// 心理咨询能力训练应用 —— Electron 主进程
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/* ═══════════════════════════════════════════════
   数据目录（用户 2026-10-15 指定）
   这个应用没有自己的文件存储，全部状态（训练进度、评分、诊断记录、
   对话记录、设置含 API Key）都在渲染层的 localStorage 里，
   也就是 Electron 用户目录下的 Local Storage。
   所以只要把用户目录指到桌面自建文件夹，历史就跟着过去了，
   AppData 里不会再出现 counseling-trainer。
   ═══════════════════════════════════════════════ */
const DATA_ROOT = path.join(
  app.getPath('desktop'), '我的', '自创应用', '心理咨询训练软件历史数据'
);
const PROFILE_DIR = path.join(DATA_ROOT, 'Electron用户数据');

// 记下 Electron 的默认用户目录（Windows 上是 %APPDATA%\counseling-trainer），
// 待会儿要从那儿把老数据搬出来。
const LEGACY_PROFILE = app.getPath('userData');

// setPath 要求目标目录已存在，先建；且必须在 ready 之前调用才生效。
try { fs.mkdirSync(PROFILE_DIR, { recursive: true }); } catch (e) { /* 下面 setPath 会报 */ }
try {
  app.setPath('userData', PROFILE_DIR);
} catch (e) {
  console.error('切换用户目录失败，仍用默认位置：', e);
}
// 光 setPath 还不够：Chromium 在 JS 跑起来之前就按应用名在 AppData 下建了目录，
// 得再显式带上命令行开关，让各个子进程从一开始就认新位置。
app.commandLine.appendSwitch('user-data-dir', PROFILE_DIR);

/**
 * 也正因为上面那句「JS 跑起来之前」，命令行开关拦不住那个空壳目录的诞生。
 * 它一个字节都不装，纯粹碍眼，所以启动时顺手清掉 ——
 * 只在「确确实实是空目录」时才删，万一以后真有东西落进去，绝不会误删。
 */
try {
  const shellDir = path.join(app.getPath('appData'), 'counseling-trainer');
  if (path.resolve(shellDir) !== path.resolve(PROFILE_DIR)
      && fs.existsSync(shellDir) && fs.readdirSync(shellDir).length === 0) {
    fs.rmdirSync(shellDir);
  }
} catch (e) { /* 删不掉也无所谓：它不装东西 */ }

/**
 * 把老位置的东西搬过来。只补空缺：目标已有同名文件就不动，
 * 所以重复运行安全，也不会把新数据覆盖成旧的。
 * 纯缓存目录跳过 —— 搬过来没意义，还拖慢启动。
 */
const SKIP_DIRS = new Set([
  'Cache', 'GPUCache', 'Code Cache', 'DawnGraphiteCache', 'DawnWebGPUCache',
  'ShaderCache', 'Crashpad', 'logs'
]);

function copyMissing(srcDir, dstDir) {
  let n = 0;
  let entries;
  try { entries = fs.readdirSync(srcDir, { withFileTypes: true }); } catch (e) { return 0; }
  for (const ent of entries) {
    const src = path.join(srcDir, ent.name);
    const dst = path.join(dstDir, ent.name);
    try {
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        fs.mkdirSync(dst, { recursive: true });
        n += copyMissing(src, dst);
      } else if (!fs.existsSync(dst) && fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
        n++;
      }
    } catch (e) { /* 个别文件被占用就跳过，不该因此起不来 */ }
  }
  return n;
}

if (LEGACY_PROFILE && path.resolve(LEGACY_PROFILE) !== path.resolve(PROFILE_DIR)) {
  const moved = copyMissing(LEGACY_PROFILE, PROFILE_DIR);
  if (moved) console.log(`已迁入训练记录与设置 ${moved} 个文件：${LEGACY_PROFILE} -> ${PROFILE_DIR}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    title: '心理咨询能力训练 · 来访者模拟',
    backgroundColor: '#f4f1ec',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// —— 大模型调用（在主进程里发请求，彻底规避渲染进程的 CORS 限制）——
// payload: { provider, baseUrl, model, apiKey, system, messages, temperature, maxTokens }
const LLM_TIMEOUT = 90000;   // 单次请求超时
const LLM_RETRIES = 3;       // 网络抖动 / 超时 / 5xx / 429 时自动重试次数

function fetchWithTimeout(url, options = {}, ms = LLM_TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
    .finally(() => clearTimeout(timer));
}

// 可标记「是否值得重试」的请求错误
class LlmError extends Error {
  constructor(message, retryable = true) {
    super(message);
    this.retryable = retryable;
  }
}

// 从各厂商的响应体里尽量抽出可读的错误信息（字段位置不一）
function extractErrorMessage(data) {
  if (!data) return '';
  const e = data.error;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') return e.message || e.msg || e.code || '';
  if (typeof data.message === 'string') return data.message;
  if (typeof data.msg === 'string') return data.msg;
  return '';
}

// 把 HTTP 状态码 + 错误原文映射成中文、可操作的提示
function mapError(status, raw) {
  const m = String(raw || '').toLowerCase();
  if (status === 401 || status === 403) return 'API Key 无效或无权限（' + status + '），请在「设置」里检查 Key。';
  if (status === 404) return '接口或模型不存在（404），请检查 Base URL 与「模型」名称。';
  if (status === 429) return '请求过于频繁或额度不足（429），请稍后重试或检查账户余额。';
  if (status === 400 && /model/.test(m)) return '模型名称无效（400），请检查「模型」栏填写是否正确。';
  if (status >= 500) return '服务商服务器错误（' + status + '），请稍后重试。';
  if (/api ?key|unauthor|auth|token|credential|invalid.*key/i.test(m)) return '鉴权失败：' + (raw || '请检查 API Key。');
  if (/model.*(not ?found|不存在|invalid|unknown|does not exist)/i.test(m)) return '模型不存在：' + (raw || '请检查模型名称。');
  if (/quota|insufficient|balance|billing|rate ?limit|限流|额度/i.test(m)) return '额度或限流问题：' + (raw || '请检查账户余额或稍后再试。');
  if (raw) return raw;
  return '请求失败（HTTP ' + status + '）';
}

// 单次调用：成功返回 { ok:true, text }，失败抛 LlmError（4xx 配置错误标记为不可重试）
async function llmOnce(payload) {
  const {
    provider = 'anthropic',
    baseUrl = 'https://api.openai.com/v1',
    model,
    apiKey,
    system,
    messages,
    temperature = 0.4,
    maxTokens = 1200
  } = payload || {};

  if (!apiKey) throw new LlmError('尚未配置 API Key，请在「设置」中填写。', false);

  if (provider === 'anthropic') {
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5',
        max_tokens: maxTokens,
        temperature,
        system,
        messages
      })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new LlmError(mapError(res.status, extractErrorMessage(data)), res.status >= 500 || res.status === 429);
    const text = ((data && data.content) || []).map((c) => c.text || '').join('');
    if (!text.trim()) throw new LlmError('模型返回了空内容（可能被内容过滤或生成中断），请重试。', true);
    return { ok: true, text };
  }

  // OpenAI 兼容接口（OpenAI / DeepSeek / 月之暗面 / 通义 / GLM …）
  const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`
  };
  const body = {
    model: model || 'gpt-4o-mini',
    temperature,
    max_tokens: maxTokens,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages
  };
  let res = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
  let data = await res.json().catch(() => null);
  // 部分推理模型（如 DeepSeek 推理系列）不接受 temperature 参数，会返回 400；
  // 命中则去掉 temperature 重试一次，避免「每次都一样地失败」。
  if (!res.ok && res.status === 400 && data &&
      /temperature|top_p|presence_penalty|frequency_penalty|参数|parameter|not support|unsupported|does not support/i.test(extractErrorMessage(data) || '')) {
    delete body.temperature;
    res = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
    data = await res.json().catch(() => null);
  }
  if (!res.ok) throw new LlmError(mapError(res.status, extractErrorMessage(data)), res.status >= 500 || res.status === 429);
  const msg = data && data.choices && data.choices[0] && data.choices[0].message;
  // 推理模型（如 deepseek-v4-pro）会先产出 reasoning_content 再产出 content；
  // 若 content 为空、reasoning_content 有内容，退而求其次用后者，避免白报错。
  let text = (msg && msg.content) || '';
  if (Array.isArray(text)) text = text.map((c) => (c && c.text) || '').join(''); // 少数厂商 content 是分片数组
  if (!String(text).trim() && msg && msg.reasoning_content) text = msg.reasoning_content;
  if (!String(text).trim()) throw new LlmError('模型返回了空内容（推理模型可能把 token 全用在了思考上），请重试或调大回答长度上限。', true);
  return { ok: true, text };
}

// 带重试的调用：网络抖动 / 超时 / 5xx / 429 自动重试（600ms、1.2s 退避），4xx 配置错误不重试
async function llmWithRetry(payload) {
  let lastErr;
  for (let i = 0; i < LLM_RETRIES; i++) {
    try {
      return await llmOnce(payload);
    } catch (err) {
      lastErr = err;
      const retryable = !err || err.retryable !== false;
      if (!retryable || i === LLM_RETRIES - 1) break;
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, i)));
    }
  }
  if (lastErr && lastErr.name === 'AbortError') {
    throw new LlmError('请求超时（' + Math.round(LLM_TIMEOUT / 1000) + ' 秒无响应），请检查网络或代理后重试。', false);
  }
  if (lastErr instanceof LlmError) throw lastErr;
  throw new LlmError(String((lastErr && lastErr.message) || lastErr), true);
}

ipcMain.handle('llm:chat', async (_event, payload) => {
  try {
    return await llmWithRetry(payload);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, error: '请求超时（' + Math.round(LLM_TIMEOUT / 1000) + ' 秒无响应），请检查网络或代理后重试。' };
    }
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// —— 联网搜索（「谈心」栏目「联网找方法」用）：免费多源、无需 Key ——
// 三源并行（维基百科 API / DuckDuckGo 即时答案 / DuckDuckGo Lite HTML），
// 按 URL 去重 + 权威优先排序 + 超时，全部失败则优雅降级，由渲染层兜底。
const SEARCH_TIMEOUT = 8000;
const SEARCH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) counseling-trainer/1.0';

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function decodeDDGUrl(u) {
  if (!u) return '';
  const m = String(u).match(/uddg=([^&]+)/);
  if (m) { try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
  return u;
}
async function fetchSearchJson(url) {
  const res = await fetchWithTimeout(url, { headers: { 'user-agent': SEARCH_UA } }, SEARCH_TIMEOUT);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
async function sourceWikipedia(q) {
  const u = 'https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&srlimit=5&format=json&origin=*';
  const data = await fetchSearchJson(u);
  const items = (data && data.query && data.query.search) || [];
  return items.map((it) => ({
    title: it.title, url: 'https://zh.wikipedia.org/wiki/' + encodeURIComponent(it.title),
    snippet: stripHtml(it.snippet || ''), source: '维基百科'
  })).filter((x) => x.title);
}
async function sourceDdgInstant(q) {
  const u = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1';
  const data = await fetchSearchJson(u);
  const out = [];
  if (data.AbstractText) out.push({ title: data.Heading || '', url: data.AbstractURL || '', snippet: stripHtml(data.AbstractText), source: 'DuckDuckGo' });
  const related = (data.RelatedTopics || []).flatMap((t) => (t && t.Topics ? t.Topics : [t]));
  for (const t of related.slice(0, 6)) if (t && t.Text) out.push({ title: t.Name || '', url: t.FirstURL || '', snippet: stripHtml(t.Text), source: 'DuckDuckGo' });
  return out.filter((x) => x.snippet || x.title);
}
async function sourceDdgHtml(q) {
  const u = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q);
  const res = await fetchWithTimeout(u, { headers: { 'user-agent': SEARCH_UA } }, SEARCH_TIMEOUT);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const html = await res.text();
  const out = [];
  const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && out.length < 8) {
    out.push({ title: stripHtml(m[2]), url: decodeDDGUrl(m[1]), snippet: stripHtml(m[3]), source: 'DuckDuckGo 搜索' });
  }
  return out.filter((x) => x.title && x.url);
}
async function searchWeb(q) {
  const settled = await Promise.allSettled([sourceWikipedia(q), sourceDdgInstant(q), sourceDdgHtml(q)]);
  const rank = { '维基百科': 0, 'DuckDuckGo': 1, 'DuckDuckGo 搜索': 2 };
  const seen = new Set();
  const results = [];
  for (const s of settled) {
    if (s.status !== 'fulfilled') continue;
    for (const r of s.value) {
      const key = String(r.url || r.title || '').replace(/\/+$/, '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push(r);
    }
  }
  results.sort((a, b) => ((rank[a.source] != null ? rank[a.source] : 9) - (rank[b.source] != null ? rank[b.source] : 9)));
  return results.slice(0, 8);
}
ipcMain.handle('web:search', async (_event, query) => {
  const q = String(query || '').trim().slice(0, 200);
  if (!q) return { ok: false, error: '空检索词' };
  try {
    const results = await searchWeb(q);
    if (!results.length) return { ok: false, error: '未找到相关结果' };
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// —— 大模型流式调用（「谈心」栏目专用）——
// 新增 llm:chatStream，与上面的 llm:chat 整段返回链路完全并行、互不影响。
// payload 额外带 reqId；主进程边收边把增量经 webContents.send('llm:chunk', {reqId, delta}) 推给渲染层。
const streamAborts = new Map();              // reqId -> AbortController（附 userAborted 标记）
const LLM_STREAM_IDLE = 45000;               // 流中途 45s 无字节视为掉线
const LLM_STREAM_CONNECT = 30000;            // 首字节前 30s 无响应视为超时

function normalizeDeltaContent(delta) {
  if (!delta) return '';
  const c = delta.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((x) => (x && (x.text || x.content)) || '').join('');
  return '';
}
// 带「连接超时」的流式 fetch：超时未响应则 abort ctrl（与空闲超时、用户叫停共用同一 AbortController）
function fetchStreamRes(url, options, ctrl, ms) {
  const timer = setTimeout(() => { if (!ctrl.signal.aborted) { try { ctrl.abort(); } catch (e) { /* 忽略 */ } } }, ms);
  return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
    .finally(() => clearTimeout(timer));
}
// 逐行读 SSE 流；空闲 idleMs 无数据则 abort ctrl
async function* sseLines(res, ctrl, idleMs) {
  if (!res.body || typeof res.body.getReader !== 'function') { yield ''; return; }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let timer = null;
  const kick = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { if (!ctrl.signal.aborted) { try { ctrl.abort(); } catch (e) { /* 忽略 */ } } }, idleMs);
  };
  kick();
  try {
    for (;;) {
      let r;
      try { r = await reader.read(); } catch (e) { break; }   // 被 abort 或出错 → 结束
      kick();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        yield chunk;
      }
    }
  } finally { if (timer) clearTimeout(timer); }
}
// 单次流式调用：成功返回 { ok, text, stopReason }；失败抛 LlmError；被 abort 抛 AbortError
async function llmOnceStream(payload, onDelta, ctrl) {
  const {
    provider = 'anthropic', baseUrl = 'https://api.openai.com/v1',
    model, apiKey, system, messages, temperature = 0.6, maxTokens = 800
  } = payload || {};

  if (!apiKey) throw new LlmError('尚未配置 API Key，请在「设置」中填写。', false);

  if (provider === 'anthropic') {
    const res = await fetchStreamRes('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: model || 'claude-sonnet-5', max_tokens: maxTokens, temperature, system, messages, stream: true })
    }, ctrl, LLM_STREAM_CONNECT);
    if (!res.ok) { const data = await res.json().catch(() => null); throw new LlmError(mapError(res.status, extractErrorMessage(data)), res.status >= 500 || res.status === 429); }
    let text = '', stopReason = '';
    for await (const line of sseLines(res, ctrl, LLM_STREAM_IDLE)) {
      const s = line.trim();
      if (!s || s.indexOf('data:') !== 0) continue;
      const dataStr = s.slice(5).trim();
      if (dataStr === '[DONE]') continue;
      let evt; try { evt = JSON.parse(dataStr); } catch (e) { continue; }
      if (evt.type === 'content_block_delta' && evt.delta && typeof evt.delta.text === 'string') {
        text += evt.delta.text; if (onDelta) onDelta(evt.delta.text);
      } else if (evt.type === 'message_delta' && evt.delta && evt.delta.stop_reason) {
        stopReason = evt.delta.stop_reason;
      }
    }
    if (ctrl.signal.aborted) { const e = new Error('aborted'); e.name = 'AbortError'; throw e; }
    if (!text.trim()) throw new LlmError('模型返回了空内容（可能被内容过滤或生成中断），请重试。', true);
    return { ok: true, text, stopReason };
  }

  // OpenAI 兼容流式
  const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` };
  const body = {
    model: model || 'gpt-4o-mini', temperature, max_tokens: maxTokens, stream: true,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages
  };
  let res = await fetchStreamRes(url, { method: 'POST', headers, body: JSON.stringify(body) }, ctrl, LLM_STREAM_CONNECT);
  let data = null;
  if (!res.ok) {
    data = await res.json().catch(() => null);
    // 推理模型不接受 temperature 的重试（同 llmOnce）
    if (res.status === 400 && data && /temperature|top_p|presence_penalty|frequency_penalty|参数|parameter|not support|unsupported|does not support/i.test(extractErrorMessage(data) || '')) {
      delete body.temperature;
      res = await fetchStreamRes(url, { method: 'POST', headers, body: JSON.stringify(body) }, ctrl, LLM_STREAM_CONNECT);
      if (!res.ok) { data = await res.json().catch(() => null); throw new LlmError(mapError(res.status, extractErrorMessage(data)), res.status >= 500 || res.status === 429); }
    } else {
      throw new LlmError(mapError(res.status, extractErrorMessage(data)), res.status >= 500 || res.status === 429);
    }
  }
  let text = '';
  for await (const line of sseLines(res, ctrl, LLM_STREAM_IDLE)) {
    const s = line.trim();
    if (!s || s.indexOf('data:') !== 0) continue;
    const dataStr = s.slice(5).trim();
    if (dataStr === '[DONE]') continue;
    let evt; try { evt = JSON.parse(dataStr); } catch (e) { continue; }
    const delta = evt.choices && evt.choices[0] && evt.choices[0].delta;
    const piece = normalizeDeltaContent(delta);
    if (piece) { text += piece; if (onDelta) onDelta(piece); }
  }
  if (ctrl.signal.aborted) { const e = new Error('aborted'); e.name = 'AbortError'; throw e; }
  if (!text.trim()) throw new LlmError('模型返回了空内容（推理模型可能把 token 用在了思考上），请重试。', true);
  return { ok: true, text };
}
// 带重试的流式调用：只在「尚未吐出任何增量」时对可重试错误重试，避免重复/串话
async function llmStreamWithRetry(payload, onDelta, ctrl) {
  let emitted = false, lastErr;
  for (let i = 0; i < LLM_RETRIES; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 600 * Math.pow(2, i - 1)));
    try {
      return await llmOnceStream(payload, (d) => { emitted = true; if (onDelta) onDelta(d); }, ctrl);
    } catch (err) {
      lastErr = err;
      if (emitted) break;
      if (err && err.name === 'AbortError') break;   // 已中止（用户叫停 / 连接或空闲超时），不再重试
      const retryable = !err || err.retryable !== false;
      if (!retryable || i === LLM_RETRIES - 1) break;
    }
  }
  if (lastErr && lastErr.name === 'AbortError') throw lastErr;
  if (lastErr instanceof LlmError) throw lastErr;
  throw new LlmError(String((lastErr && lastErr.message) || lastErr), true);
}
ipcMain.handle('llm:chatStream', async (event, payload) => {
  const reqId = (payload && payload.reqId) != null ? payload.reqId : null;
  const ctrl = new AbortController();
  if (reqId != null) streamAborts.set(reqId, ctrl);
  const sendChunk = (delta) => { if (reqId != null && event.sender && !event.sender.isDestroyed()) event.sender.send('llm:chunk', { reqId, delta }); };
  try {
    const out = await llmStreamWithRetry(payload, sendChunk, ctrl);
    return Object.assign({}, out, { aborted: false });
  } catch (err) {
    const userAborted = !!ctrl.userAborted;
    const timedOut = !userAborted && !!(ctrl.signal && ctrl.signal.aborted);
    if (userAborted || (err && err.name === 'AbortError' && userAborted)) return { ok: false, error: '已取消', aborted: true };
    if (timedOut) return { ok: false, error: '连接或空闲超时（' + Math.round(LLM_STREAM_IDLE / 1000) + ' 秒无数据），请重试', aborted: false };
    if (err && err.name === 'AbortError') return { ok: false, error: '已取消', aborted: true };
    return { ok: false, error: String((err && err.message) || err), aborted: false };
  } finally {
    if (reqId != null) streamAborts.delete(reqId);
  }
});
ipcMain.on('llm:abort', (_e, reqId) => {
  const ctrl = streamAborts.get(reqId);
  if (ctrl) { ctrl.userAborted = true; try { ctrl.abort(); } catch (e) { /* 忽略 */ } }
});

ipcMain.handle('shell:openExternal', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) shell.openExternal(url);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
