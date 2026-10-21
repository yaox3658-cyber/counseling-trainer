// ===================== 谈心（AI 咨询师 · 分阶段陪伴） =====================
// 角色反转：AI 当咨询师，用户当来访者。以系统背后的教材/课件（Corey 第 10 版 + 深大讲义）为本，
// 分 5 阶段咨询，一个阶段结束后询问感受、可随时回退；支持联网找更适合的方法；咨询师回复流式逐字显示。
// 铁律：LLM 只在用户点击/发送时调用，绝不后台自动烧 tokens；API Key 仍仅存本机 localStorage。
(function () {
  'use strict';

  const LS_KEY = 'ct_talk_v1';
  const MAX_HISTORY = 40;   // 喂给 LLM 的对话历史上限（条）
  const TYPE_INTERVAL = 30; // 咨询师逐字流速（毫秒/字），越小越快

  // —— 5 阶段（来访者视角措辞），id 与 workflow.js 的 WORKFLOW_STAGES 对齐，教材依据复用其 knowledge ——
  const TALK_STAGES = [
    { id: 'relationship', icon: '🤝', title: '建立信任与倾诉', goal: '营造安全、被接纳的氛围，了解你为什么而来，愿意把话说出来。' },
    { id: 'assessment', icon: '🔍', title: '了解与评估', goal: '深入了解你的困扰、背景与资源，必要时温和评估安全风险，理清问题脉络。' },
    { id: 'goals', icon: '🎯', title: '明确想改变什么', goal: '把你「想好起来」的模糊愿望，一起具体成可行的小目标。' },
    { id: 'intervention', icon: '🛠️', title: '一起找方法', goal: '结合教材与联网资料，给你可操作的方法/技术，陪你练习、促成改变。' },
    { id: 'consolidation', icon: '🌱', title: '巩固与道别', goal: '总结收获、留住对你有用的方法、制定防复发小计划，妥善道别。' }
  ];

  const WELCOME =
    '💗 欢迎来到「谈心」。我是你的 AI 咨询陪伴，会以心理咨询师的方式陪你聊，分阶段一起慢慢梳理。这里说的话只保存在你本机。\n' +
    '需要提醒：我是教育训练用途的 AI 陪伴，不构成临床诊断或治疗；如果此刻你正处于危机中，请先拨打 12356（全国心理援助热线）或 110/120。\n\n' +
    '我们先从最自然的地方开始——是什么让你今天想来找我聊聊？';

  const ROLE =
    '你是「谈心」栏目里的资深心理咨询师，正在陪伴一位来访者（用户）。你的取向：以「以人为中心」为基础（真诚、无条件积极关注、共情），' +
    '结合认知行为与焦点解决做温和引导。你的言行应贴近权威咨询示范（如罗杰斯「格洛丽亚」会谈）与咨询教材中成熟咨询师的真实语气。\n\n' +
    '语气与口吻：\n' +
    '- 轻柔、温和、平稳，坚定而不急促；语气传递「我认真听你、你有能力好起来」，而不是命令或说教。\n' +
    '- 少说「我认为/我觉得/你应该」，多用尝试性、探索性口吻，如「听起来你好像……是这样吗？」「你心里是不是感到……」——把理解说给来访者听，留给他确认或纠正的空间。\n' +
    '- 以反映式倾听为主：先复述、情感反映，再温和引导；不评判、不贴标签、不说「一切都会好起来的」这类空洞保证。\n' +
    '- 共情要设身处地、准确传达，同时保持中立与克制（进得去、出得来），不替来访者下结论、不被他的情绪牵着走。\n' +
    '- 真诚、表里如一，但不自我暴露、不说教、不刻意用流行语或过于个性的口吻。\n\n' +
    '对话节奏：\n' +
    '- 每次回复 2~5 句，一次最多只问 1 个问题，不连珠炮提问，给来访者留出「说下去」的空间。\n' +
    '- 多用开放式提问、复述、情感反映，让来访者感到被理解、被陪伴。\n- 始终用中文回复。';

  const SAFETY =
    '【安全红线 · 最高优先级，必须遵守】\n' +
    '若来访者流露自杀、自伤或伤害他人的风险，你必须：\n' +
    '1. 温和而直接地、具体地询问风险（是否有念头、计划、手段、时间）；不回避、不转移话题、不做虚假安慰。\n' +
    '2. 表达你认真对待、关心他，并感谢他愿意说出来。\n' +
    '3. 鼓励立即寻求专业帮助，并给出资源：全国心理援助热线 12356、紧急情况 110/120。\n' +
    '4. 不承诺「绝对保密」，说明在危及生命安全时必须突破保密以保护他。';

  const DISCLAIMER =
    '【身份与边界】\n' +
    '你是教育训练用途的 AI 咨询陪伴，不构成临床诊断或治疗，不能替代执业心理咨询师或精神科医生。' +
    '涉及疑似精神障碍时，温和说明边界并建议转介专业机构（《精神卫生法》第 23 条：心理咨询人员不得从事心理治疗或精神障碍的诊断、治疗）。' +
    '始终把来访者的福祉与安全放在第一位。';

  const ADVANCE_MARK = '[[STAGE_ADVANCE]]';
  const FLOW =
    '【分阶段陪伴流程】\n' +
    '请围绕「当前阶段」的目标展开咨询，暂不越到后面阶段。当你的专业判断认为：本阶段的核心议题已聊得比较充分、来访者的情绪已被接住、' +
    '且继续停留本阶段收益不大时，请【主动推进】到下一阶段：\n' +
    '1. 在回复里先简短肯定本阶段的进展，并温和询问来访者此刻的感受；\n' +
    '2. 再用一两句话自然引出下一阶段，说明接下来想一起做什么；\n' +
    '3. 在回复的最末尾、单独占一行，原样输出标记 ' + ADVANCE_MARK + '，系统会自动切换到下一阶段。\n' +
    '若来访者还想在本阶段多聊、或流露尚未处理完的内容，则不要输出该标记，继续留在本阶段陪伴。\n' +
    '若来访者想回到更早的阶段或话题，随时跟随他的需要。\n' +
    '若你当前已在最后一个阶段（巩固与道别），请做好总结与收尾，不要输出 ' + ADVANCE_MARK + '。';

  // 从回复里识别「推进标记」并去掉：返回 { advance, text }
  function extractAdvance(text) {
    const i = text.indexOf(ADVANCE_MARK);
    if (i === -1) return { advance: false, text };
    const clean = (text.slice(0, i) + text.slice(i + ADVANCE_MARK.length)).replace(/\n{3,}/g, '\n\n').trim();
    return { advance: true, text: clean };
  }

  // ---------- 会话状态 ----------
  let Talk = null;
  let busy = false;
  let activeReqId = null;

  function defaultState() {
    return {
      id: 'talk_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'idle',            // 'idle' | 'active' | 'done'
      currentStage: 0,
      stageLog: [{ stageId: TALK_STAGES[0].id, enteredAt: Date.now(), leftAt: null }],
      issue: '',
      transcript: [{ role: 'sys', text: WELCOME }],
      llmMessages: [],           // [{role:'user'|'assistant', content}]
      methods: [],               // [{title,url,snippet,source}]
      knowledgeHits: []          // [{chapter,topic,body,source}]
    };
  }

  // ---------- 工具 ----------
  const $ = (id) => document.getElementById(id);
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }
  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { Talk = Object.assign(defaultState(), JSON.parse(raw)); return; }
    } catch (e) { /* 忽略损坏数据 */ }
    Talk = defaultState();
  }
  function save() {
    Talk.updatedAt = Date.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(Talk)); } catch (e) { /* 忽略 */ }
  }

  function online() {
    return !!(window.LLM && typeof window.LLM.isEnabled === 'function' && window.LLM.isEnabled())
      && !!(window.api && typeof window.api.llmChatStream === 'function');
  }
  function wfStage(id) {
    const ws = window.WORKFLOW_STAGES || [];
    return ws.find((s) => s.id === id) || { knowledge: '' };
  }

  // ---------- 教材课件检索（离线，复用 BookKnowledge / CourseKnowledge） ----------
  function refreshKnowledge(q) {
    const book = (window.BookKnowledge && typeof window.BookKnowledge.search === 'function') ? window.BookKnowledge.search(q) : [];
    const course = (window.CourseKnowledge && typeof window.CourseKnowledge.search === 'function') ? window.CourseKnowledge.search(q) : [];
    const seen = new Set();
    const merged = [];
    const push = (list, src) => {
      for (const e of list || []) {
        const key = ((e.chapter || '') + '|' + (e.topic || '')).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push({ chapter: e.chapter, topic: e.topic, body: e.body, source: src });
      }
    };
    push(book, 'Corey 教材');
    push(course, '课程讲义');
    Talk.knowledgeHits = merged.slice(0, 6);
  }

  // ---------- 咨询师系统提示词 ----------
  function buildSystem(extra) {
    const st = TALK_STAGES[Talk.currentStage];
    const meta = wfStage(st.id);
    const issueLine = Talk.issue ? '【本次来访议题】' + Talk.issue : '';
    const hits = Talk.knowledgeHits || [];
    const kb = hits.length
      ? '【本软件教材/课件依据 · 请优先以此为准、不与之矛盾】\n' +
        hits.map((h, i) => (i + 1) + '. [' + h.chapter + '] ' + h.topic + '：' + truncate(h.body, 500)).join('\n')
      : '【教材/课件依据】未命中词条，请基于通用心理咨询专业共识回应。';
    const stageLine =
      '【当前阶段】第 ' + (Talk.currentStage + 1) + ' 阶段「' + st.title + '」\n' +
      '【本阶段目标】' + st.goal + '\n' +
      '【本阶段教材要点】' + truncate(meta.knowledge || '', 900);
    const nextIdx = Talk.currentStage + 1;
    const nextLine = nextIdx < TALK_STAGES.length
      ? '【下一阶段预告】第 ' + (nextIdx + 1) + ' 阶段「' + TALK_STAGES[nextIdx].title + '」：' + TALK_STAGES[nextIdx].goal
      : '【当前已是最后阶段】请做好总结、巩固与妥善道别。';
    return [ROLE, SAFETY, DISCLAIMER, issueLine, stageLine, nextLine, kb, FLOW, extra].filter(Boolean).join('\n\n');
  }
  function buildMessages() {
    const msgs = Talk.llmMessages || [];
    return msgs.length > MAX_HISTORY ? msgs.slice(-MAX_HISTORY) : msgs.slice();
  }

  // ---------- 渲染 ----------
  function appendMsg(role, text, noScroll) {
    const box = $('tkTranscript');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'counselor' ? 'counselor' : role === 'client' ? 'client' : 'sys');
    const who = role === 'counselor' ? '💗 咨询师' : role === 'client' ? '我（来访者）' : '';
    div.innerHTML = (who ? '<span class="who">' + who + '</span>' : '') + esc(text);
    box.appendChild(div);
    if (!noScroll) box.scrollTop = box.scrollHeight;
  }
  function scrollBottom() {
    const box = $('tkTranscript');
    if (box) box.scrollTop = box.scrollHeight;
  }
  function renderTranscript() {
    const box = $('tkTranscript');
    if (!box) return;
    box.innerHTML = '';
    (Talk.transcript || []).forEach((m) => appendMsg(m.role, m.text, true));
    scrollBottom();
  }
  function renderStages() {
    const box = $('tkStageMap');
    if (!box) return;
    box.innerHTML = '';
    TALK_STAGES.forEach((st, i) => {
      const btn = document.createElement('button');
      btn.className = 'tk-stage';
      if (i === Talk.currentStage) btn.classList.add('current');
      else if (i < Talk.currentStage) btn.classList.add('done');
      else if (i === Talk.currentStage + 1) btn.classList.add('next');
      else btn.classList.add('locked');
      const label = (i === Talk.currentStage) ? '进行中' : (i < Talk.currentStage ? '已完成' : (i === Talk.currentStage + 1 ? '下一步' : '未解锁'));
      btn.innerHTML = '<span class="s-ic">' + st.icon + '</span><span class="s-t">' + st.title + '</span><span class="s-num">' + label + '</span>';
      btn.addEventListener('click', () => {
        if (i !== Talk.currentStage && i <= Talk.currentStage + 1) setStage(i);
      });
      box.appendChild(btn);
    });
  }
  function renderBanner() {
    const box = $('tkStageBanner');
    if (!box) return;
    const st = TALK_STAGES[Talk.currentStage];
    let html = '🧭 当前：<b>第 ' + (Talk.currentStage + 1) + ' 阶段 · ' + st.title + '</b>　' + esc(st.goal);
    if (Talk.currentStage < TALK_STAGES.length - 1) {
      html += '　<button id="tkNextStageBtn" class="btn primary" style="margin-left:8px;padding:5px 12px;font-size:12.5px">✅ 进入下一阶段</button>';
    } else {
      html += '　<span class="hint">（最后阶段 · 好好道别与巩固）</span>';
    }
    box.innerHTML = html;
    const nb = $('tkNextStageBtn');
    if (nb) nb.addEventListener('click', () => setStage(Talk.currentStage + 1));
  }
  function renderIssue() {
    const el = $('tkIssue');
    if (!el) return;
    let html = Talk.issue ? esc(Talk.issue) : '<span class="empty">（还没有说出本次想谈的事）</span>';
    if (Talk.knowledgeHits.length) {
      html += '<div class="tk-kb-hits">📚 教材依据：' + Talk.knowledgeHits.map((h) => esc(h.topic)).join('、') + '</div>';
    }
    el.innerHTML = html;
  }
  function renderMethods() {
    const box = $('tkMethods');
    if (!box) return;
    if (!Talk.methods.length) {
      box.innerHTML = '<div class="empty">还没有方法。点左下「🔍 联网找更适合我的方法」，我会结合教材和网上资料为你整理。</div>';
      return;
    }
    box.innerHTML = '';
    Talk.methods.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'tk-method';
      let title = esc(m.title || '（无标题）');
      if (m.url) title = '<a href="#" data-url="' + esc(m.url) + '">' + title + '</a>';
      card.innerHTML = '<div class="m-title">' + title + '</div>'
        + (m.snippet ? '<div class="m-snippet">' + esc(truncate(m.snippet, 160)) + '</div>' : '')
        + (m.source ? '<div class="m-src">来源：' + esc(m.source) + '</div>' : '');
      box.appendChild(card);
    });
    // 点击卡片标题在系统浏览器打开
    box.querySelectorAll('a[data-url]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const url = a.getAttribute('data-url');
        if (url && window.api && typeof window.api.openExternal === 'function') window.api.openExternal(url);
      });
    });
  }
  function renderGate() {
    const gate = $('tkGate');
    const panel = document.querySelector('#view-talk .tk-input-panel');
    const on = online();
    if (gate) gate.hidden = on;
    if (panel) panel.hidden = !on;
    setInputEnabled();
  }
  function setInputEnabled() {
    const en = online() && !busy;
    const ta = $('tkInput');
    const btn = $('tkSendBtn');
    if (ta) ta.disabled = !en;
    if (btn) {
      btn.disabled = !online();
      btn.textContent = busy ? '⏹ 停止' : '发送 ➤';
    }
  }
  function renderAll() {
    renderStages();
    renderBanner();
    renderIssue();
    renderMethods();
    renderTranscript();
    renderGate();
  }

  // ---------- 流式咨询师回复 ----------
  // 打字机：把到达的文字以缓慢、均匀的节奏逐字吐出，标点处稍作停顿，营造温和「娓娓道来」的感觉。
  function createTypewriter(bodyEl, caretEl, box) {
    let acc = '';      // 目标全文（随流式增量增长）
    let shown = 0;     // 已显示字符数
    let ended = false; // 流是否已结束（收到完整回复）
    let timer = null;
    let resolveDone = null;
    const done = new Promise((res) => { resolveDone = res; });

    const PAUSE_CHARS = '。！？…；：，、';
    function nextDelay(ch) {
      if (ch === '\n') return 150;
      if (PAUSE_CHARS.indexOf(ch) !== -1) return 140;
      return TYPE_INTERVAL;
    }
    function step() {
      if (shown < acc.length) {
        shown++;
        if (bodyEl) bodyEl.textContent = acc.slice(0, shown);
        if (caretEl) caretEl.hidden = false;
        if (box) box.scrollTop = box.scrollHeight;
        timer = setTimeout(step, nextDelay(acc[shown - 1]));
      } else if (ended) {
        timer = null;
        if (caretEl) caretEl.hidden = true;
        resolveDone();
      } else {
        timer = null;   // 流未结束，等待下一次 append 再启动
      }
    }
    function start() { if (!timer) timer = setTimeout(step, 0); }

    return {
      done,
      getText: () => acc,
      append: (text) => { acc += text; start(); },
      end: (finalText) => { if (typeof finalText === 'string') acc = finalText; ended = true; start(); },
      finishNow: () => {
        if (timer) { clearTimeout(timer); timer = null; }
        shown = acc.length;
        if (bodyEl) bodyEl.textContent = acc.slice(0, shown);
        if (caretEl) caretEl.hidden = true;
        resolveDone();
      }
    };
  }

  async function streamCounselor(opts) {
    opts = opts || {};
    if (busy) return;
    if (!online()) {
      appendMsg('sys', '（未启用大模型，无法陪你谈心。请在「设置」里配置 API Key 并启用。）');
      return;
    }
    busy = true;
    setInputEnabled();
    if (window.TALK_AVATAR && typeof window.TALK_AVATAR.startTalking === 'function') window.TALK_AVATAR.startTalking();

    const reqId = 'tk_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    activeReqId = reqId;
    const cfg = window.LLM.getConfig();

    // 流式气泡（带轻微淡入）
    const box = $('tkTranscript');
    const div = document.createElement('div');
    div.className = 'msg counselor tk-fade';
    div.innerHTML = '<span class="who">💗 咨询师</span><span class="tk-body"></span><span class="tk-caret">▍</span>';
    box.appendChild(div);
    const bodyEl = div.querySelector('.tk-body');
    const caretEl = div.querySelector('.tk-caret');
    const tw = createTypewriter(bodyEl, caretEl, box);

    const unsub = (window.api && typeof window.api.onLlmChunk === 'function')
      ? window.api.onLlmChunk((data) => {
          if (data && data.reqId === reqId && data.delta) tw.append(data.delta);
        })
      : null;

    try {
      const r = await window.api.llmChatStream({
        reqId,
        provider: cfg.provider, baseUrl: cfg.baseUrl, model: cfg.model, apiKey: cfg.apiKey,
        system: opts.system || buildSystem(),
        messages: buildMessages(),
        temperature: 0.7,
        maxTokens: 600
      });
      if (r && r.ok) {
        const raw = String(r.text || '').trim();
        const parsed = extractAdvance(raw);
        const text = parsed.text;
        const advance = parsed.advance && (opts.allowAdvance !== false) && Talk.currentStage < TALK_STAGES.length - 1;
        tw.end(text);
        await tw.done;   // 等最后一句缓缓吐完再收尾
        if (!text) {
          bodyEl.textContent = '（对方没有回复内容，请再试一次）';
          div.classList.remove('counselor'); div.classList.add('sys');
        } else {
          Talk.llmMessages.push({ role: 'assistant', content: text });
          Talk.transcript.push({ role: 'counselor', text });
          if (Talk.status === 'idle') Talk.status = 'active';
          if (advance) applyStageTransition(Talk.currentStage + 1);   // 咨询师主动判断→推进到下一阶段
          if (opts.onDone) opts.onDone(text);
        }
      } else if (r && r.aborted) {
        const partial = tw.getText();
        tw.finishNow();
        if (partial.trim()) {
          bodyEl.textContent = partial + '\n（已停止）';
          Talk.transcript.push({ role: 'counselor', text: partial.trim() });
        } else {
          bodyEl.textContent = '（已停止）';
          div.classList.remove('counselor'); div.classList.add('sys');
        }
      } else {
        tw.finishNow();
        bodyEl.textContent = '（' + ((r && r.error) || '出错了') + '）';
        div.classList.remove('counselor'); div.classList.add('sys');
      }
    } catch (e) {
      tw.finishNow();
      bodyEl.textContent = '（调用失败：' + esc(String((e && e.message) || e)) + '）';
      div.classList.remove('counselor'); div.classList.add('sys');
    } finally {
      if (unsub) unsub();
      if (window.TALK_AVATAR && typeof window.TALK_AVATAR.stopTalking === 'function') window.TALK_AVATAR.stopTalking();
      busy = false;
      activeReqId = null;
      save();
      setInputEnabled();
      box.scrollTop = box.scrollHeight;
      const ta = $('tkInput');
      if (ta && !ta.disabled) ta.focus();
    }
  }

  // ---------- 动作 ----------
  // 咨询师画像：依据来访者话语实时给表情（无画像时静默跳过）
  function reactAvatar(text) {
    if (window.TALK_AVATAR && typeof window.TALK_AVATAR.react === 'function') {
      window.TALK_AVATAR.react(text || '');
    }
  }

  async function send() {
    const input = $('tkInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text || busy) return;
    if (!online()) { renderGate(); toast('未启用大模型，无法谈心'); return; }
    input.value = '';
    reactAvatar(text);   // 听到你的话，先给出共情/关心等表情

    if (!Talk.issue) {
      Talk.issue = text;
      refreshKnowledge(text);
    }
    if (Talk.status === 'idle') Talk.status = 'active';
    appendMsg('client', text);
    Talk.transcript.push({ role: 'client', text });
    Talk.llmMessages.push({ role: 'user', content: text });
    save();
    renderIssue();
    await streamCounselor({});
  }

  // 实际执行阶段切换（不校验 busy，供「用户点击」与「咨询师主动推进」两条路径共用）
  function applyStageTransition(i) {
    const forward = i > Talk.currentStage;
    Talk.currentStage = i;
    Talk.stageLog.push({ stageId: TALK_STAGES[i].id, enteredAt: Date.now(), leftAt: null });
    const st = TALK_STAGES[i];
    const sysText = (forward ? '—— 进入第 ' + (i + 1) + ' 阶段「' + st.title + '」：' + st.goal + ' ——'
                             : '—— 回到第 ' + (i + 1) + ' 阶段「' + st.title + '」：' + st.goal + ' ——');
    appendMsg('sys', sysText);
    Talk.transcript.push({ role: 'sys', text: sysText });
    refreshKnowledge((Talk.issue ? Talk.issue + ' ' : '') + st.title + ' ' + st.goal);
    save();
    renderStages();
    renderBanner();
    renderIssue();
  }

  function setStage(i) {
    const n = TALK_STAGES.length;
    i = Math.max(0, Math.min(n - 1, i));
    if (i === Talk.currentStage || busy) return;
    const forward = i > Talk.currentStage;
    applyStageTransition(i);
    if (forward && Talk.llmMessages.some((m) => m.role === 'user')) {
      // 咨询师开场：先询问感受，再预览本阶段（用户主动点击「进入下一阶段」触发的单次调用）
      streamCounselor({
        allowAdvance: false,
        system: buildSystem() + '\n\n【刚刚进入新阶段】请先温和询问来访者此刻的感受，再用一两句话介绍本阶段想一起做什么，然后邀请他继续。'
      });
    }
  }

  async function findMethods() {
    if (busy) return;
    const q = buildSearchQuery();
    const box = $('tkMethods');
    if (box) box.innerHTML = '<div class="tk-methods-loading">🔍 正在联网检索「' + esc(q) + '」……</div>';

    let results = [];
    let ok = false;
    if (window.api && typeof window.api.webSearch === 'function') {
      try {
        const r = await window.api.webSearch(q);
        if (r && r.ok) { results = r.results || []; ok = true; }
      } catch (e) { /* 忽略，走降级 */ }
    }
    Talk.methods = results;
    renderMethods();
    if (!ok || !results.length) {
      if (box) box.innerHTML = '<div class="empty">联网未找到结果（可能断网）。已用教材 + 大模型知识为你综合；也可以 <a href="#" id="tkBrowserSearch">🌐 在浏览器里搜索</a>。</div>';
      const bs = $('tkBrowserSearch');
      if (bs) bs.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.api && typeof window.api.openExternal === 'function') {
          window.api.openExternal('https://www.bing.com/search?q=' + encodeURIComponent(q));
        }
      });
    }
    save();

    const resultsText = results.length
      ? '【联网检索结果（来自维基百科 / DuckDuckGo）】\n' +
        results.map((x, i) => (i + 1) + '. ' + x.title + '：' + truncate(x.snippet, 200) + (x.url ? '（' + x.url + '）' : '')).join('\n')
      : '（本次无联网检索结果）';
    await streamCounselor({
      allowAdvance: false,
      system: buildSystem() + '\n\n' + resultsText +
        '\n\n【任务】请基于教材依据与上面的检索结果，为来访者综合一份简短「方法清单」：2~6 条，每条 = 方法名 + 为什么适合他 + 一个可尝试的小步骤；语气温暖；若涉及危机先处理危机。'
    });
  }

  function buildSearchQuery() {
    const st = TALK_STAGES[Talk.currentStage];
    const parts = [];
    if (Talk.issue) parts.push(truncate(Talk.issue, 30));
    parts.push(st.title);
    parts.push('心理咨询 自助方法');
    return parts.filter((x, i) => parts.indexOf(x) === i).join(' ').slice(0, 120);
  }

  function resetState() {
    Talk = defaultState();
    save();
  }
  function clear() {
    if (!confirm('确定清空本次谈心的全部对话吗？此操作不可撤销。')) return;
    resetState();
    renderAll();
    toast('已清空对话');
  }
  function restart() {
    if (Talk.transcript.length > 1 || Talk.issue) {
      if (!confirm('确定重新开始吗？将清空当前议题与对话，从第一阶段重新开始。')) return;
    }
    resetState();
    renderAll();
    toast('已重新开始');
  }
  function stop() {
    if (activeReqId != null && window.api && typeof window.api.llmAbort === 'function') {
      window.api.llmAbort(activeReqId);
    }
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    const sendBtn = $('tkSendBtn');
    if (sendBtn) sendBtn.addEventListener('click', () => { if (busy) stop(); else send(); });
    const input = $('tkInput');
    if (input) input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
    });
    // 输入时实时跟随心情（防抖，避免每敲一个字都跳一次）
    if (input) {
      let liveTimer = null;
      input.addEventListener('input', () => {
        if (liveTimer) clearTimeout(liveTimer);
        liveTimer = setTimeout(() => reactAvatar(input.value), 450);
      });
    }
    const findBtn = $('tkFindBtn');
    if (findBtn) findBtn.addEventListener('click', findMethods);
    const restartBtn = $('tkRestartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restart);
    const clearBtn = $('tkClearBtn');
    if (clearBtn) clearBtn.addEventListener('click', clear);
    const openSet = $('tkOpenSettings');
    if (openSet) openSet.addEventListener('click', () => { const b = $('settingsBtn'); if (b) b.click(); });

    // 设置弹窗关闭后刷新门（用户可能刚启用大模型）
    const modal = $('settingsModal');
    if (modal && window.MutationObserver) {
      new MutationObserver(() => { if (modal.hidden) renderGate(); })
        .observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  function refresh() {
    // 切到本栏目前台时：仅重渲染 + 滚底，绝不自动发请求
    renderAll();
    scrollBottom();
  }

  // ---------- 初始化 ----------
  function init() {
    load();
    renderAll();
    bindEvents();
  }

  window.TALK = {
    refresh,
    send,
    setStage,
    findMethods,
    clear,
    restart,
    state: () => Talk
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
