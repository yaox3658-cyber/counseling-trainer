// ===================== 大模型集成（可选） =====================
// 通过 preload 桥调用主进程发起请求（无 CORS 问题）。
// 能力 1：对自由文本回应做深度评分；能力 2：脚本案例结束后扮演来访者「自由续聊」。
(function () {
  'use strict';

  const SETTINGS_KEY = 'ct_settings_v1';

  const DEFAULT_SETTINGS = {
    provider: 'anthropic',
    baseUrl: 'https://api.openai.com/v1',
    model: 'claude-opus-5',
    apiKey: '',
    llmEnabled: false,
    dark: false
  };

  function getConfig() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch (e) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg));
  }

  function isEnabled() {
    const c = getConfig();
    return !!c.llmEnabled && !!c.apiKey;
  }

  function hasApi() {
    return !!(window.api && typeof window.api.llmChat === 'function');
  }

  function stripFences(s) {
    return String(s || '')
      .replace(/^﻿/, '')              // 去掉 BOM
      .replace(/```[a-zA-Z]*\s*/g, '')     // 去掉所有代码围栏（含语言标签，不限位置）
      .trim();
  }

  // 从第一个 { 或 [ 开始，用括号配对找到与之匹配的收尾（比 lastIndexOf 更稳，能跳过字符串里的括号）
  function extractBalanced(s, open, close) {
    const i = s.indexOf(open);
    if (i === -1) return null;
    let depth = 0, inStr = false, esc = false;
    for (let k = i; k < s.length; k++) {
      const ch = s[k];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === open) depth++;
      else if (ch === close) { depth--; if (depth === 0) return s.slice(i, k + 1); }
    }
    return null; // 未闭合（多半是生成被截断）
  }

  function parseJson(text) {
    const t = stripFences(text);
    if (!t) return null;
    try { return JSON.parse(t); } catch (e) { /* 继续尝试 */ }
    const obj = extractBalanced(t, '{', '}');
    if (obj) { try { return JSON.parse(obj); } catch (e2) { /* 继续 */ } }
    const arr = extractBalanced(t, '[', ']');
    if (arr) { try { return JSON.parse(arr); } catch (e3) { /* 继续 */ } }
    return null;
  }

  // —— 深度评分 ——
  async function score(clientText, userResponse, modeLabel) {
    if (!isEnabled() || !hasApi()) return null;
    const c = getConfig();

    const system =
      '你是一位资深心理咨询督导师，精通 Corey《心理咨询与治疗的理论及实践》第10版。' +
      '请评估实习咨询师对来访者的回应，并严格按以下 JSON 格式输出（不要输出任何 JSON 之外的内容）：\n' +
      '{"score": 0到100的整数, "level": "优秀|良好|合格|需改进", ' +
      '"strengths": ["做得好之处1", "2", ...], "improvements": ["待改进1", "2", ...], ' +
      '"suggestion": "一句话的下一步建议"}\n' +
      '评分标准（有效微技巧加分）：共情、开放式提问、情感反映、内容重述、具体化、总结、积极关注、正常化、探索意义、温和对质、立即性；' +
      '（新手误区扣分）：直接给建议、评判/责备、贴标签、过早安慰、封闭式提问、「为什么」式质问。' +
      '当前训练重点：' + modeLabel + '。请结合该重点给予有针对性的点评，语气专业、具体、可操作。';

    const user =
      '【来访者说的话】\n' + clientText + '\n\n【实习咨询师的回应】\n' + userResponse;

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.3,
      maxTokens: 1600
    });

    if (!res.ok) return { ok: false, error: res.error };
    const parsed = parseJson(res.text);
    if (!parsed) return { ok: false, error: '大模型返回格式无法解析', raw: res.text };
    return { ok: true, result: parsed };
  }

  // —— 自由续聊：扮演来访者 ——
  async function clientReply(caseInfo, transcript) {
    if (!isEnabled() || !hasApi()) return null;
    const c = getConfig();

    const system =
      '你正在扮演一位心理咨询中的来访者。请始终忠实于以下人物设定，用第一人称、口语化的中文回应咨询师，' +
      '情绪要贴合人物当前的处境，不要跳出角色，不要输出任何旁白或分析。\n' +
      '【来访者档案】\n' +
      '姓名：' + caseInfo.name + '，' + caseInfo.age + '岁，' + caseInfo.gender + '，' + caseInfo.role + '。\n' +
      '主诉：' + caseInfo.summary + '。\n' +
      '背景：' + caseInfo.background + '。';

    const messages = [];
    for (const t of transcript) {
      if (t.role === 'client') messages.push({ role: 'assistant', content: t.text });
      else if (t.role === 'counselor') messages.push({ role: 'user', content: t.text });
    }

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages,
      temperature: 0.85,
      maxTokens: 300
    });

    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, text: res.text.trim() };
  }

  // —— 在线大模型解答库：解释参考答案 ——
  async function explain(ctx, question) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system =
      '你是一位资深心理咨询督导师，精通 Corey《心理咨询与治疗的理论及实践》第10版。' +
      '实习咨询师会对「参考答案」产生疑问，请你耐心、具体、有依据地解释「参考答案为什么这样写」，' +
      '拆解它用到的微技巧与背后的咨询原理，并引用教材相关章节与流派取向。' +
      '请用中文作答，条理清晰（可用小标题与短句），语气专业且鼓励。';

    const user =
      '【来访者本轮说的话】\n' + ctx.clientText + '\n\n' +
      '【参考答案】\n' + ctx.modelAnswer + '\n\n' +
      '【本轮设计说明】训练重点：' + (ctx.techniques || []).join('、') +
      '；教材引用：' + (ctx.bookRef || '') +
      '；说明：' + (ctx.modelNote || '') + '\n\n' +
      '【实习咨询师的疑问】\n' + question;

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.4,
      maxTokens: 1600
    });

    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, text: res.text.trim() };
  }

  // —— 待改进：大模型实时、具体建议（引用原话 + 改写示范） ——
  async function improve(clientText, userResponse, modeLabel, ruleHints) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system =
      '你是一位资深心理咨询督导师，精通 Corey《心理咨询与治疗的理论及实践》第10版。' +
      '针对实习咨询师刚才对来访者的一句回应，给出「待改进」的具体建议。\n' +
      '务必遵守：\n' +
      '1. 每条建议都要引用回应里的原话（用「」括起来），指出这句话具体哪里不妥；\n' +
      '2. 每条都要给一句可直接照抄的改写示范（用「」括起来），并说明为什么更好；\n' +
      '3. 只写最要紧的 1~4 条，按重要程度排序；\n' +
      '4. 禁止写「多共情」「多倾听」「更具体」这类没有指向的空话；\n' +
      '5. 若回应本身已经不错，可返回空数组。\n' +
      '严格只输出如下 JSON，不要输出任何 JSON 之外的内容：\n' +
      '{"items":[{"problem":"引用原话并指出问题","advice":"改写示范与说明"}]}';

    const hintsText = (ruleHints && ruleHints.length)
      ? '\n\n【规则引擎已识别的线索（供你参考，可纠正或补充）】\n' + ruleHints.map((h, i) => (i + 1) + '. ' + h).join('\n')
      : '';

    const user =
      '【来访者本轮说的话】\n' + clientText + '\n\n' +
      '【实习咨询师的回应】\n' + userResponse + '\n\n' +
      '【本轮训练重点】' + modeLabel + hintsText;

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.4,
      maxTokens: 1600
    });

    if (!res.ok) return { ok: false, error: res.error };
    const parsed = parseJson(res.text);
    if (!parsed) return { ok: false, error: '大模型返回格式无法解析', raw: res.text };
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((it) => it && (it.problem || it.advice))
      : [];
    return { ok: true, items };
  }

  // —— 多版本参考答案：在线生成 ——
  async function moreAnswers(clientText, modelAnswer, modeLabel) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system =
      '你是一位资深心理咨询督导师，精通 Corey《心理咨询与治疗的理论及实践》第10版。' +
      '针对来访者的一句话，在原有参考答案之外，再从**不同流派/取向**给出 2~3 个高质量的替代参考答案，' +
      '让实习咨询师体会「同一句话可以有多种专业回应」。\n' +
      '要求：\n' +
      '1. 每个替代答案都要标注所属取向（如：以人为中心 / 认知行为 / 焦点解决 / 精神动力·意义探索 / 格式塔 / 叙事 / 阿德勒 / 存在主义 / 现实疗法 / 家庭系统 等）；\n' +
      '2. 每个答案都要有一句「强调什么」的说明，点出它背后的技术要点；\n' +
      '3. 答案要口语、自然、可直接照抄，避免生硬与套话；\n' +
      '4. 取向尽量与原有答案错开。\n' +
      '严格只输出如下 JSON，不要输出任何 JSON 之外的内容：\n' +
      '{"answers":[{"label":"取向名称","text":"参考答案正文","note":"强调什么/技术要点"}]}';

    const user =
      '【来访者本轮说的话】\n' + clientText + '\n\n' +
      '【原有参考答案】\n' + modelAnswer + '\n\n' +
      '【本轮训练重点】' + modeLabel;

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.7,
      maxTokens: 2000
    });

    if (!res.ok) return { ok: false, error: res.error };
    const parsed = parseJson(res.text);
    if (!parsed) return { ok: false, error: '大模型返回格式无法解析（可能生成被截断），请重试', raw: res.text };
    const answers = Array.isArray(parsed.answers)
      ? parsed.answers.filter((a) => a && (a.text || a.label))
      : [];
    if (!answers.length) return { ok: false, error: '模型未返回有效参考答案（可能生成被截断），请重试', raw: res.text };
    return { ok: true, answers };
  }

  // —— 教学伙伴：自由对话 ——
  async function partnerReply(partnerSystem, transcript) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system = partnerSystem ||
      '你是「心理咨询能力训练」应用里的全能教学伙伴，一位资深心理咨询督导师。请用中文、专业、具体、有条理地解答，并可讲解、出题、点评、扮演来访者。';

    const messages = [];
    for (const t of transcript) {
      if (t.role === 'partner') messages.push({ role: 'assistant', content: t.text });
      else if (t.role === 'user') messages.push({ role: 'user', content: t.text });
    }

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages,
      temperature: 0.6,
      maxTokens: 2000
    });

    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, text: res.text.trim() };
  }

  // —— 蒸馏问答：基于命中的知识词条，在线深度讲解 ——
  async function askKnowledge(question, contextEntries) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system =
      '你是「心理咨询能力训练」应用里的知识问答助手，精通杰拉德·科里（Gerald Corey）' +
      '《心理咨询与治疗的理论及实践》第10版全书。请针对用户的问题，给出详细、可靠、章节目录级的讲解，' +
      '尽量引用教材相关章节与流派取向；用中文作答，可用小标题与短句，语气专业、具体、可操作，不空谈。';

    const contextText = (contextEntries && contextEntries.length)
      ? '\n\n【本地蒸馏知识库已检索到的相关词条（请优先以这些为准，在其基础上展开，不要与之矛盾）】\n' +
        contextEntries.map((e) => '《' + e.chapter + ' · ' + e.topic + '》\n' + e.body).join('\n\n')
      : '';

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: '【问题】\n' + question + contextText }],
      temperature: 0.4,
      maxTokens: 2000
    });

    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, text: res.text.trim() };
  }

  // —— 全流程：过关阶段深度点评 ——
  async function stageCoach(stage, userResponse, transcript) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system =
      '你是一位资深心理咨询督导师，精通 Corey《心理咨询与治疗的理论及实践》第10版，正在带一位实习咨询师做「全流程咨询」过关训练。\n' +
      '针对当前关卡，评估实习咨询师对来访者的回应，判断是否「过关」，并给出深度点评。\n' +
      '严格只输出如下 JSON，不要输出任何 JSON 之外的内容：\n' +
      '{"score":0到100整数, "passed":true或false, "level":"优秀|良好|合格|需改进", ' +
      '"strengths":["做得好之处"], "improvements":["待改进之处"], ' +
      '"suggestion":"一句下一步建议", "coachNote":"结合本关目标与教材知识的督导师点评"}';

    const history = (transcript && transcript.length)
      ? '\n\n【本关已进行的对话】\n' + transcript.map((t) => (t.role === 'client' ? '来访者：' : '咨询师：') + t.text).join('\n')
      : '';

    const user =
      '【当前关卡】' + stage.title + '（' + stage.short + '）\n' +
      '【本关目标】' + stage.goal + '\n' +
      '【本关要求技能】' + (stage.requiredSkills || []).join('、') + '\n' +
      '【来访者本关说的话】' + stage.clientText + '\n\n' +
      '【实习咨询师的回应】\n' + userResponse + history;

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.3,
      maxTokens: 2000
    });

    if (!res.ok) return { ok: false, error: res.error };
    const parsed = parseJson(res.text);
    if (!parsed) return { ok: false, error: '大模型返回格式无法解析', raw: res.text };
    return { ok: true, result: parsed };
  }

  // —— 诊断训练：答案解析的大模型深度解析（逐项差异 + 举例理解） ——
  async function dxExplain(caseInfo) {
    if (!isEnabled() || !hasApi()) return { ok: false, error: '未启用大模型' };
    const c = getConfig();

    const system =
      '你是一位资深精神科医生兼心理咨询督导师，精通 ICD-11 与 CCMD-3 诊断标准，擅长给实习生讲透「诊断鉴别」。' +
      '一位实习咨询师正在做诊断训练，请对其刚做完的一道诊断选择题进行深度讲解。' +
      '请用中文作答，条理清晰（可用小标题、编号列表与短句），语气专业、具体、让实习生真正听懂差异，不要照搬教材术语空谈。';

    const user =
      '【病例（主诉与症状）】\n' + caseInfo.vignette + '\n\n' +
      '【题干】' + caseInfo.question + '\n\n' +
      '【四个选项】\n' + caseInfo.options.map((o, i) => 'ABCD'[i] + '. ' + o).join('\n') + '\n\n' +
      '【正确答案】' + 'ABCD'[caseInfo.answer] + '. ' + caseInfo.options[caseInfo.answer] +
      (caseInfo.userChoice != null ? '\n【学员选择】' + 'ABCD'[caseInfo.userChoice] + '. ' + caseInfo.options[caseInfo.userChoice] : '') +
      '\n\n请分两部分讲解：\n' +
      '一、逐项差异分析：对四个选项逐一说明「它为什么是对的 / 为什么被排除」，并明确写出选项之间的关键区分点（例如 A 与 B 的核心区别在于病程长短、核心症状、还是伴随特征）。\n' +
      '二、举例理解：为每个选项各举一个简短、具体的临床例子（虚拟来访者的一句话描述，能一眼看出该诊断的特点），帮助区分易混淆选项。\n' +
      '要求：紧扣本案例的症状，具体、可操作，若学员选错，请额外点一句「为什么容易选错、以后怎么一眼区分」。';

    const res = await window.api.llmChat({
      provider: c.provider,
      baseUrl: c.baseUrl,
      model: c.model,
      apiKey: c.apiKey,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.4,
      maxTokens: 2400
    });

    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, text: res.text.trim() };
  }

  // —— 测试连接 ——
  async function test(config) {
    if (!hasApi()) return { ok: false, error: '当前环境不支持调用（需在 Electron 中运行）' };
    const res = await window.api.llmChat({
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
      apiKey: config.apiKey,
      system: '你是一个测试助手。',
      messages: [{ role: 'user', content: '请只回复两个字：正常' }],
      temperature: 0,
      maxTokens: 20
    });
    return res;
  }

  window.LLM = {
    getConfig,
    saveConfig,
    isEnabled,
    hasApi,
    score,
    clientReply,
    explain,
    improve,
    moreAnswers,
    partnerReply,
    askKnowledge,
    stageCoach,
    dxExplain,
    test
  };
})();
