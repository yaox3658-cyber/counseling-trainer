// ===================== 主逻辑 =====================
(function () {
  'use strict';

  const PROGRESS_KEY = 'ct_progress_v1';
  const WORKFLOW_KEY = 'ct_workflow_v1';
  const MODE_LABEL = { micro: '通用微技巧', core: '核心三大流派', full: '全书流派覆盖' };
  const LEVEL_COLOR = { '优秀': 'good', '良好': 'good', '合格': 'mid', '需改进': 'low' };

  const state = {
    mode: 'micro',
    caseId: null,
    turnIndex: 0,
    responseMode: 'free', // 'free' | 'choice'
    currentCase: null,
    answered: false,
    lastResult: null,
    sessionScores: [],
    freeplay: false,
    freeplayTranscript: [],
    llmBusy: false,
    typeToken: 0,
    ai: null,        // { kind: 'partner'|'client', transcript: [], offlineStep: 0, offline: bool, busy: bool }
    wf: null,        // { stageIndex, transcript: [], answered: bool, lastResult: null }
    qa: null         // { q: string, entries: [] }
  };

  // ---------- 工具 ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- 进度存取 ----------
  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { history: [], skills: {}, stats: { turns: 0, totalScore: 0, casesDone: [], lastDay: null, streak: 0 } };
  }
  function saveProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function skillName(id) {
    if (Scoring.SKILLS[id]) return Scoring.SKILLS[id].name;
    if (Scoring.ERRORS[id]) return Scoring.ERRORS[id].name;
    return id;
  }

  // ---------- 初始化 ----------
  function init() {
    const cfg = LLM.getConfig();
    if (cfg.dark) document.documentElement.setAttribute('data-theme', 'dark');
    $('setDark').checked = !!cfg.dark;
    Avatar.init();
    Avatar.setEmotion('neutral');
    buildCaseList();
    buildGlossaries();
    initLearn();
    initGrowthSelect();
    initWorkflow();
    bindEvents();
    updateLlmBadge();
    renderDashboard();
    showCaseIntro(null);
    $('turnGuide').innerHTML = '<div class="empty-tip">👈 从左栏选择一个案例开始练习</div>';
  }

  function updateLlmBadge() {
    const on = LLM.isEnabled();
    const b = $('llmBadge');
    b.textContent = on ? '🤖 大模型' : '离线';
    b.classList.toggle('on', on);
    updateAskLlmBtn();
    updateMoreAnswersBtn();
  }

  function updateMoreAnswersBtn() {
    const btn = $('moreAnswersBtn');
    if (!btn) return;
    // 仅在「有参考答案可扩展」且「启用大模型」时显示（普通训练回合，非 AI 案例）
    const active = state.currentCase && !state.currentCase.ai &&
      state.turnIndex < state.currentCase.turns.length && LLM.isEnabled();
    btn.hidden = !active;
  }

  function modeLabel() { return MODE_LABEL[state.mode] || '通用微技巧'; }

  // ---------- 案例列表 ----------
  function buildCaseList() {
    const box = $('caseList');
    box.innerHTML = '';
    window.CASES.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'case-item' + (c.id === state.caseId ? ' active' : '');
      btn.dataset.id = c.id;
      btn.innerHTML =
        '<div class="c-name">' + esc(c.name) + (c.ai ? '<span class="c-ai">🤖 AI</span>' : '') + ' · ' + esc(c.role) + '</div>' +
        '<div class="c-desc">' + esc(c.summary) + '</div>' +
        '<div class="c-meta">' +
        '<span>难度 ' + '★'.repeat(c.difficulty) + '</span>' +
        c.schools.map((s) => '<span>' + esc(s) + '</span>').join('') +
        '</div>';
      btn.addEventListener('click', () => selectCase(c.id));
      box.appendChild(btn);
    });
  }

  function selectCase(id) {
    const c = getCase(id);
    if (!c) return;
    state.caseId = id;
    state.currentCase = c;
    state.turnIndex = 0;
    state.answered = false;
    state.freeplay = false;
    state.freeplayTranscript = [];
    state.sessionScores = [];
    state.ai = null;
    // 进入新的谈话：清空上一段对话记录与气泡
    state.typeToken++;
    $('transcript').innerHTML = '';
    $('clientText').textContent = '';
    buildCaseList();
    renderProfile(c);
    showCaseIntro(c);
    if (c.ai) {
      startAiDialogue(c);
      return;
    }
    renderTurn();
    $('nextBtn').hidden = true;
    resetRightPanel();
  }

  function renderProfile(c) {
    const meta = [c.age != null ? (c.age + '岁') : null, c.gender, c.role].filter(Boolean).join(' · ');
    $('clientProfile').innerHTML =
      '<div class="p-name">' + esc(c.name) + (meta ? ' <span class="p-label">' + esc(meta) + '</span>' : '') + '</div>' +
      '<div class="p-divider"></div>' +
      '<div class="p-label">主诉</div><div>' + esc(c.summary) + '</div>' +
      '<div class="p-divider"></div>' +
      '<div class="p-label">背景</div><div>' + esc(c.background) + '</div>' +
      '<div class="p-divider"></div>' +
      '<div>' + c.schools.map((s) => '<span class="tag">' + esc(s) + '</span>').join('') + '</div>';
  }

  function showCaseIntro(c) {
    if (!c) {
      $('caseIntro').innerHTML = '欢迎！选择一个案例，开始练习你的心理咨询基本功。';
      $('clientText').textContent = '';
      $('typingCaret').hidden = true;
      return;
    }
    if (c.ai) {
      $('caseIntro').innerHTML =
        '<strong>' + esc(c.name) + '</strong> · ' + esc(c.summary) + '<br>' +
        '<span style="font-size:12px">' + (c.aiKind === 'partner' ? '可提问、出题、点评、扮演来访者，自由对话。' : '综合运用多流派技术，与复杂来访者自由对话。') + '</span>';
      return;
    }
    $('caseIntro').innerHTML =
      '<strong>训练重点：' + esc(modeLabel()) + '</strong> · 当前案例共 <strong>' + c.turns.length + '</strong> 轮。' +
      '请以来访者为中心，用你的回应接住情绪、引导探索。';
  }

  // ---------- 渲染一轮 ----------
  function renderTurn() {
    const c = state.currentCase;
    const turn = c.turns[state.turnIndex];
    state.answered = false;
    state.lastResult = null;
    $('nextBtn').hidden = true;
    $('responseInput').value = '';
    $('responseInput').disabled = false;
    $('responseInput').placeholder = '输入你对来访者的回应，然后点击「发送反馈」……';
    $('submitBtn').disabled = false;
    $('submitBtn').textContent = '发送反馈 ➤';
    $('modeSwitch').hidden = false;
    setResponseMode(state.responseMode, false);

    Avatar.setEmotion(turn.emotion);
    setGuide(turn);
    resetRightPanel();
    $('sessionProgress').innerHTML = sessionProgressHtml();
    $('speechBubble').hidden = false;
    $('typingCaret').hidden = false;
    typewriter(turn.clientText, $('clientText'), () => {
      appendTranscript('client', turn.clientText);
    });
  }

  function setGuide(turn) {
    const targets = (turn.targets || []).map((t) => {
      const s = Scoring.SKILLS[t];
      return '<span class="g-chip">🎯 ' + esc(s ? s.name : t) + '</span>';
    }).join('');
    const techs = (turn.techniques || []).map((t) => '<span class="g-chip">🧩 ' + esc(t) + '</span>').join('');
    $('turnGuide').innerHTML =
      '<div>' + esc(turn.focus) + '</div>' +
      (targets ? '<div class="g-target">本轮目标技巧：<br>' + targets + '</div>' : '') +
      (techs ? '<div class="g-target">相关流派技术：<br>' + techs + '</div>' : '');
    $('bookRef').innerHTML = '<strong>' + esc(turn.bookRef) + '</strong>';
  }

  function sessionProgressHtml() {
    const c = state.currentCase;
    const total = c.turns.length;
    let dots = '';
    for (let i = 0; i < total; i++) {
      if (i < state.turnIndex) dots += '●';
      else if (i === state.turnIndex) dots += '◉';
      else dots += '○';
    }
    const avg = state.sessionScores.length ? Math.round(state.sessionScores.reduce((a, b) => a + b, 0) / state.sessionScores.length) : '—';
    return '<div class="sp-item"><span>进度</span><b>' + (state.turnIndex + 1) + ' / ' + total + ' ' + dots + '</b></div>' +
      '<div class="sp-item"><span>本轮均分</span><b>' + avg + '</b></div>';
  }

  // ---------- 打字机 + 说话动画 ----------
  async function typewriter(text, el, onDone) {
    const token = ++state.typeToken;
    el.textContent = '';
    Avatar.startTalking();
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      if (token !== state.typeToken) { return; } // 已被新一轮打字取代，立即退出
      el.textContent += chars[i];
      await sleep(28);
    }
    if (token !== state.typeToken) return;
    Avatar.stopTalking();
    $('typingCaret').hidden = true;
    if (onDone) onDone();
  }

  function appendTranscript(role, text) {
    const box = $('transcript');
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.innerHTML = '<span class="who">' + (role === 'client' ? '来访者' : role === 'counselor' ? '我（咨询师）' : '') + '</span>' + esc(text);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  function appendSystem(text) {
    const box = $('transcript');
    const div = document.createElement('div');
    div.className = 'msg sys';
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  // ---------- 模式切换：自由输入 / 4选1 ----------
  function setResponseMode(mode, persist = true) {
    state.responseMode = mode;
    if (persist) toast(mode === 'choice' ? '已切换为「4 选 1」模式' : '已切换为自由输入模式');
    const choice = mode === 'choice';
    $('optionPanel').hidden = !choice;
    $('inputPanel').hidden = choice;
    $('modeFreeBtn').classList.toggle('active', !choice);
    $('modeChoiceBtn').classList.toggle('active', choice);
    $('modeHint').textContent = choice
      ? '提示：选出最能接住情绪、引导探索的那句回应'
      : '提示：先共情，再用开放式提问引导展开';
    if (choice && !state.answered && state.currentCase && state.turnIndex < state.currentCase.turns.length) {
      renderOptions(state.currentCase.turns[state.turnIndex]);
    }
  }

  function renderOptions(turn) {
    const box = $('optionPanel');
    box.innerHTML = '';
    const keys = ['A', 'B', 'C', 'D'];
    (turn.options || []).forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = '<span class="opt-key">' + keys[i] + '</span><span>' + esc(opt.text) + '</span>';
      btn.addEventListener('click', () => chooseOption(i));
      box.appendChild(btn);
    });
  }

  // ---------- 提交分发（普通回合 / 自由续聊 / AI 对话） ----------
  function handleSubmit() {
    if (state.ai) { sendAiMessage(); return; }
    if (state.freeplay) sendFreeplay();
    else submitResponse();
  }

  // ---------- 自由文本提交 ----------
  async function submitResponse() {
    if (state.answered || !state.currentCase) return;
    const input = $('responseInput');
    const text = input.value.trim();
    if (!text) { toast('请先输入你的回应'); return; }
    if (text.length < 4) { toast('回应太短了，试着更完整一些'); return; }

    appendTranscript('counselor', text);
    input.disabled = true;
    $('submitBtn').disabled = true;
    state.answered = true;

    const turn = state.currentCase.turns[state.turnIndex];
    const ruleResult = Scoring.scoreResponse(text, turn, state.mode);

    // 待改进：优先接入大模型，实时针对你的原话给出具体建议；评分也走大模型，失败各自回退规则引擎
    const llmOn = LLM.isEnabled() && !state.llmBusy;
    let improveItems = null;   // [{problem, advice}]，大模型生成的具体待改进
    let llmScoreRes = null;    // 大模型评分结果

    if (llmOn) {
      state.llmBusy = true;
      $('scoreLevel').textContent = '🤖 大模型评分中…';
      $('errorsFound').innerHTML = '<span class="chip neutral">🤖 大模型正在生成具体改进建议…</span>';

      const hints = Scoring.specificImprovements(ruleResult).map((it) => it.name + (it.hint ? '：' + it.hint : ''));
      const [scoreRes, improveRes] = await Promise.all([
        LLM.score(turn.clientText, text, modeLabel()),
        LLM.improve(turn.clientText, text, modeLabel(), hints)
      ]);
      state.llmBusy = false;

      if (scoreRes && scoreRes.ok && scoreRes.result) llmScoreRes = scoreRes;
      else if (scoreRes && !scoreRes.ok) toast('大模型评分失败，已回退规则评分');
      if (improveRes && improveRes.ok && improveRes.items && improveRes.items.length) improveItems = improveRes.items;
    }

    if (llmScoreRes) {
      showLlmResult(llmScoreRes.result, text, improveItems);
      recordFromLlm(llmScoreRes.result, text, improveItems);
    } else {
      showRuleResult(ruleResult, improveItems);
      recordResult(ruleResult, text);
    }
    $('nextBtn').hidden = false;
  }

  // ---------- 4 选 1 ----------
  function chooseOption(idx) {
    if (state.answered || !state.currentCase) return;
    state.answered = true;
    const turn = state.currentCase.turns[state.turnIndex];
    const opt = turn.options[idx];
    appendTranscript('counselor', opt.text);

    const btns = $('optionPanel').querySelectorAll('.option-btn');
    turn.options.forEach((o, i) => {
      const best = turn.options.reduce((m, x) => (x.score > m.score ? x : m));
      if (i === idx) btns[i].classList.add(o.score >= best.score ? 'correct' : 'wrong');
      else btns[i].classList.add('dim');
      btns[i].querySelector('span:last-child').insertAdjacentHTML('beforeend',
        '<span class="opt-feedback">' + (i === idx ? '你的选择 · ' : '') + esc(o.feedback) + '</span>');
      btns[i].disabled = true;
    });

    // 组装一个「规则式结果」用于统一展示
    const isPos = Scoring.SKILLS[opt.skill];
    const result = {
      score: opt.score,
      level: opt.score >= 85 ? '优秀' : opt.score >= 70 ? '良好' : opt.score >= 55 ? '合格' : '需改进',
      found: isPos ? [{ id: opt.skill, name: isPos.name, hint: isPos.hint }] : [],
      errors: isPos ? [] : [{ id: opt.skill, name: Scoring.ERRORS[opt.skill] ? Scoring.ERRORS[opt.skill].name : opt.skill, hint: opt.feedback }],
      techniques: [],
      tips: [],
      suggestion: [opt.feedback]
    };
    showRuleResult(result);
    // 记录：正选技巧才累计
    recordResult(result, opt.text, isPos ? opt.skill : null);
    $('nextBtn').hidden = false;
  }

  // ---------- 结果展示 ----------
  function resetRightPanel() {
    $('scoreValue').textContent = '—';
    $('scoreRingArc').style.strokeDashoffset = 326.7;
    $('scoreLevel').textContent = '等待你的回应…';
    $('scoreLevel').className = 'score-level';
    $('skillsFound').innerHTML = '';
    $('errorsFound').innerHTML = '';
    $('feedbackText').innerHTML = '';
    $('modelAnswer').innerHTML = '';
    $('altAnswers').innerHTML = '';
    $('altAnswers').hidden = true;
    $('askInput').value = '';
    $('askResult').innerHTML = '';
    updateAskLlmBtn();
    updateMoreAnswersBtn();
  }

  function updateAskLlmBtn() {
    const on = LLM.isEnabled();
    const btn = $('askLlmBtn');
    if (btn) btn.hidden = !on;
  }

  function setScoreRing(score) {
    const C = 326.7;
    const off = C * (1 - score / 100);
    $('scoreRingArc').style.strokeDashoffset = off;
    const color = score >= 70 ? 'var(--good)' : score >= 55 ? 'var(--warn)' : 'var(--bad)';
    $('scoreRingArc').style.stroke = color;
    $('scoreValue').textContent = score;
  }

  function fillChips(container, items, defaultKind) {
    const box = $(container);
    box.innerHTML = '';
    const list = (items || []).map((it) => ({ name: it.name, hint: it.hint, kind: it.kind || defaultKind }));
    if (!list.length) { box.innerHTML = '<span class="chip neutral">（暂无）</span>'; return; }
    list.forEach((it) => {
      const c = document.createElement('span');
      c.className = 'chip ' + (it.kind || '');
      c.innerHTML = esc(it.name) + (it.hint ? '<span class="why">' + esc(it.hint) + '</span>' : '');
      box.appendChild(c);
    });
  }

  // 待改进：以「问题名 + 具体建议」的条目式呈现，便于阅读长建议
  function renderImprovements(container, items) {
    const box = $(container);
    box.innerHTML = '';
    const list = items || [];
    if (!list.length) { box.innerHTML = '<span class="chip neutral">（暂无）</span>'; return; }
    list.forEach((it) => {
      const div = document.createElement('div');
      div.className = 'im-item ' + (it.kind || 'bad');
      div.innerHTML =
        (it.name ? '<div class="im-name">' + esc(it.name) + '</div>' : '') +
        (it.hint ? '<div class="im-hint">' + esc(it.hint) + '</div>' : '');
      box.appendChild(div);
    });
  }

  function showRuleResult(result, improveItems) {
    state.lastResult = result;
    setScoreRing(result.score);
    $('scoreLevel').textContent = result.level;
    $('scoreLevel').className = 'score-level ' + (LEVEL_COLOR[result.level] || '');

    fillChips('skillsFound', result.found, '');
    const improve = improveItems
      ? improveItems.map((it) => ({ name: it.problem, hint: it.advice, kind: 'bad' }))
      : Scoring.specificImprovements(result);
    if (!improve.length && result.score < 70) {
      improve.push({ name: '回应略显单薄', hint: '试着先共情来访者的情绪，再用开放式提问引导他展开。', kind: 'warn' });
    }
    renderImprovements('errorsFound', improve);
    if (result.techniques && result.techniques.length) {
      const box = $('skillsFound');
      result.techniques.forEach((t) => {
        const c = document.createElement('span');
        c.className = 'chip neutral';
        c.textContent = '流派：' + t.school;
        box.appendChild(c);
      });
    }

    const lines = (result.suggestion || []).concat(result.tips || []);
    $('feedbackText').innerHTML = lines.length
      ? lines.map((l) => '<p class="fline">' + esc(l) + '</p>').join('')
      : '<p class="fline">试试先共情，再用开放式提问引导。</p>';

    const turn = state.currentCase.turns[state.turnIndex];
    $('modelAnswer').innerHTML =
      '<div class="ma-quote">「' + esc(turn.modelAnswer) + '」</div>' +
      '<div class="ma-note">💡 ' + esc(turn.modelNote) + '</div>';
    renderAltAnswers(turn.altAnswers);
    updateMoreAnswersBtn();
  }

  function showLlmResult(result, userText, improveItems) {
    state.lastResult = { score: result.score, level: result.level, found: [], errors: [], techniques: [], tips: [], suggestion: result.suggestion ? [result.suggestion] : [] };
    setScoreRing(Number(result.score) || 0);
    $('scoreLevel').textContent = result.level || '';
    $('scoreLevel').className = 'score-level ' + (LEVEL_COLOR[result.level] || '');

    fillChips('skillsFound', (result.strengths || []).map((s) => ({ name: s })), '');
    renderImprovements('errorsFound', improveItems
      ? improveItems.map((it) => ({ name: it.problem, hint: it.advice, kind: 'bad' }))
      : (result.improvements || []).map((s) => ({ name: '', hint: s, kind: 'bad' })));
    $('feedbackText').innerHTML = (result.suggestion ? '<p class="fline"><b>下一步：</b>' + esc(result.suggestion) + '</p>' : '') +
      (result.strengths && result.strengths.length ? '<p class="fline"><b>亮点：</b>' + esc(result.strengths.join('；')) + '</p>' : '') +
      (result.improvements && result.improvements.length ? '<p class="fline"><b>待改进：</b>' + esc(result.improvements.join('；')) + '</p>' : '');

    const turn = state.currentCase.turns[state.turnIndex];
    $('modelAnswer').innerHTML =
      '<div class="ma-quote">「' + esc(turn.modelAnswer) + '」</div>' +
      '<div class="ma-note">💡 ' + esc(turn.modelNote) + '</div>';
    renderAltAnswers(turn.altAnswers);
    updateMoreAnswersBtn();
  }

  // ---------- 多版本参考答案 ----------
  function renderAltAnswers(answers) {
    const box = $('altAnswers');
    const list = (answers || []).filter((a) => a && a.text);
    if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = '<div class="alt-head">📚 更多参考答案（' + list.length + '）</div>' +
      list.map((a) =>
        '<div class="alt-item">' +
        (a.label ? '<span class="alt-label">' + esc(a.label) + '</span>' : '') +
        '<div class="alt-text">「' + esc(a.text) + '」</div>' +
        (a.note ? '<div class="alt-note">💡 ' + esc(a.note) + '</div>' : '') +
        '</div>'
      ).join('');
    box.hidden = false;
  }

  async function generateMoreAnswers() {
    const turn = currentTurnForAsk();
    if (!turn) { toast('请先在左侧选择一个案例'); return; }
    const btn = $('moreAnswersBtn');
    btn.disabled = true;
    btn.textContent = '🤖 正在生成…';
    try {
      const res = await LLM.moreAnswers(turn.clientText, turn.modelAnswer, modeLabel());
      if (res && res.ok && res.answers && res.answers.length) {
        // 追加到现有 altAnswers 之后（合并显示）
        const existing = (turn.altAnswers || []).concat(res.answers);
        renderAltAnswers(existing);
        toast('已生成 ' + res.answers.length + ' 个替代参考答案');
      } else {
        toast('生成失败：' + ((res && res.error) || '未知错误'));
      }
    } catch (err) {
      toast('生成出错：' + esc(String((err && err.message) || err)));
    } finally {
      btn.disabled = false;
      btn.textContent = '🤖 大模型生成更多参考答案';
    }
  }

  // ---------- 询问参考答案 ----------
  function currentTurnForAsk() {
    if (!state.currentCase) return null;
    return state.currentCase.turns[state.turnIndex];
  }

  function askOffline() {
    const turn = currentTurnForAsk();
    if (!turn) { toast('请先在左侧选择一个案例'); return; }
    const q = $('askInput').value.trim();
    if (!q) { toast('请先输入你的疑问'); return; }
    $('askResult').innerHTML = window.Explainer.explain(turn, q);
    $('askResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function askOnline() {
    const turn = currentTurnForAsk();
    if (!turn) { toast('请先在左侧选择一个案例'); return; }
    const q = $('askInput').value.trim();
    if (!q) { toast('请先输入你的疑问'); return; }
    const btn = $('askLlmBtn');
    const box = $('askResult');
    btn.disabled = true;
    box.innerHTML = '<div class="ask-source">🤖 大模型解答</div><p class="ask-muted">正在生成深度解答，通常需几秒到十几秒…</p>';
    try {
      const res = await LLM.explain({
        clientText: turn.clientText,
        modelAnswer: turn.modelAnswer,
        modelNote: turn.modelNote,
        techniques: turn.techniques || [],
        bookRef: turn.bookRef || ''
      }, q);
      if (res && res.ok && res.text) {
        box.innerHTML = '<div class="ask-source">🤖 大模型解答</div><div class="ask-llm">' +
          esc(res.text).replace(/\n/g, '<br>') + '</div>';
      } else {
        const err = (res && res.error) || '未知错误';
        toast('大模型解答失败，已切换离线解答');
        box.innerHTML = '<div class="ask-source">🤖 大模型解答</div>' +
          '<p class="ask-muted">大模型解答失败（' + esc(err) + '），已为你切换回离线解答：</p>' +
          window.Explainer.explain(turn, q);
      }
    } catch (err) {
      toast('大模型解答出错，已切换离线解答');
      box.innerHTML = '<div class="ask-source">🤖 大模型解答</div>' +
        '<p class="ask-muted">大模型解答出错（' + esc(String((err && err.message) || err)) + '），已为你切换回离线解答：</p>' +
        window.Explainer.explain(turn, q);
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- 记录进度 ----------
  function recordResult(result, text, forcedSkillId) {
    const p = loadProgress();
    p.stats.turns += 1;
    p.stats.totalScore += result.score;

    // 累计技能使用
    const skillIds = forcedSkillId ? [forcedSkillId] : (result.found || []).map((f) => f.id);
    skillIds.forEach((id) => {
      if (!Scoring.SKILLS[id]) return;
      p.skills[id] = (p.skills[id] || 0) + 1;
    });

    // 连续天数
    const t = today();
    if (p.stats.lastDay !== t) {
      const yesterday = new Date(Date.now() - 86400000);
      const y = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
      p.stats.streak = p.stats.lastDay === y ? p.stats.streak + 1 : 1;
      p.stats.lastDay = t;
    }

    // 完成案例标记
    if (!p.stats.casesDone.includes(state.caseId)) {
      if (state.turnIndex === state.currentCase.turns.length - 1) p.stats.casesDone.push(state.caseId);
    }

    // 历史
    p.history.unshift({
      time: Date.now(),
      caseId: state.caseId,
      caseName: state.currentCase.name,
      turn: state.turnIndex + 1,
      mode: state.mode,
      score: result.score,
      level: result.level,
      response: text,
      modelAnswer: state.currentCase.turns[state.turnIndex].modelAnswer,
      good: (result.found || []).map((f) => f.name),
      goodIds: skillIds.filter((id) => Scoring.SKILLS[id]),
      bad: (result.errors || []).map((e) => e.name),
      gap: (result.gaps || []).map((g) => g.name),
      review: result.score < 70
    });
    if (p.history.length > 200) p.history = p.history.slice(0, 200);

    saveProgress(p);
    state.sessionScores.push(result.score);
    $('sessionProgress').innerHTML = sessionProgressHtml();
    renderDashboard();
  }

  function recordFromLlm(result, text, improveItems) {
    const badNames = improveItems ? improveItems.map((it) => it.problem) : (result.improvements || []);
    const fake = {
      score: Number(result.score) || 0,
      level: result.level || '',
      found: (result.strengths || []).map((s) => ({ id: null, name: s })),
      errors: badNames.map((s) => ({ id: null, name: s }))
    };
    // 大模型结果没有明确的 skill id，仅记录历史，不做技能累计
    const p = loadProgress();
    p.stats.turns += 1;
    p.stats.totalScore += fake.score;
    const t = today();
    if (p.stats.lastDay !== t) {
      const yesterday = new Date(Date.now() - 86400000);
      const y = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
      p.stats.streak = p.stats.lastDay === y ? p.stats.streak + 1 : 1;
      p.stats.lastDay = t;
    }
    if (!p.stats.casesDone.includes(state.caseId) && state.turnIndex === state.currentCase.turns.length - 1) {
      p.stats.casesDone.push(state.caseId);
    }
    p.history.unshift({
      time: Date.now(), caseId: state.caseId, caseName: state.currentCase.name,
      turn: state.turnIndex + 1, mode: state.mode, score: fake.score, level: fake.level,
      response: text, modelAnswer: state.currentCase.turns[state.turnIndex].modelAnswer,
      good: fake.found.map((f) => f.name), bad: fake.errors.map((e) => e.name), review: fake.score < 70
    });
    if (p.history.length > 200) p.history = p.history.slice(0, 200);
    saveProgress(p);
    state.sessionScores.push(fake.score);
    $('sessionProgress').innerHTML = sessionProgressHtml();
    renderDashboard();
  }

  // ---------- 下一轮 / 结束 ----------
  function advanceTurn() {
    if (!state.currentCase) return;
    state.turnIndex++;
    if (state.turnIndex >= state.currentCase.turns.length) {
      endSession();
      return;
    }
    renderTurn();
  }

  function endSession() {
    const c = state.currentCase;
    const avg = state.sessionScores.length ? Math.round(state.sessionScores.reduce((a, b) => a + b, 0) / state.sessionScores.length) : 0;
    Avatar.setEmotion('relieved');
    $('speechBubble').hidden = true;
    $('clientText').textContent = '';
    $('typingCaret').hidden = true;
    $('responseInput').disabled = true;
    $('submitBtn').disabled = true;
    $('optionPanel').hidden = true;
    $('inputPanel').hidden = true;
    $('modeSwitch').hidden = true;
    appendSystem('—— 本案例完成 · 平均分 ' + avg + ' ——');
    $('nextBtn').hidden = true;

    const canFreeplay = LLM.isEnabled();
    $('sessionProgress').innerHTML = sessionProgressHtml() +
      '<div class="sp-item"><span>本案例均分</span><b>' + avg + '</b></div>' +
      '<div class="sp-item"><span>状态</span><b>已完成 ✓</b></div>';

    $('feedbackText').innerHTML = '<p class="fline"><b>🎉 案例完成！</b>平均分 <b>' + avg + '</b>。</p>' +
      (canFreeplay
        ? '<p class="fline">你已启用大模型，可以「自由续聊」，让 AI 继续扮演 ' + esc(c.name) + ' 与你深入对话。</p>'
        : '<p class="fline">💡 在「⚙ 设置」里配置大模型后，即可开启「自由续聊」继续练习。</p>');

    // 自由续聊按钮
    const fa = document.createElement('div');
    fa.id = 'freeplayBar';
    fa.style.cssText = 'margin-top:10px;';
    const btn = document.createElement('button');
    btn.className = 'btn primary block';
    btn.textContent = '💬 自由续聊（AI 继续扮演来访者）';
    btn.disabled = !canFreeplay;
    btn.addEventListener('click', startFreeplay);
    fa.appendChild(btn);
    $('feedbackText').appendChild(fa);

    renderDashboard();
  }

  // ---------- 自由续聊 ----------
  function startFreeplay() {
    state.freeplay = true;
    state.freeplayTranscript = state.currentCase.turns.map((t) => ({ role: 'client', text: t.clientText }));
    // 加入咨询师的历史回应（从 transcript 粗略取，这里用已记录的输入）
    $('feedbackText').innerHTML = '<p class="fline"><b>💬 自由续聊模式</b>：现在由 AI 扮演 ' + esc(state.currentCase.name) + '，请像真实咨询那样继续回应。</p>';
    $('inputPanel').hidden = false;
    $('responseInput').disabled = false;
    $('responseInput').value = '';
    $('submitBtn').disabled = false;
    $('optionPanel').hidden = true;
    $('modeSwitch').hidden = true;
    $('responseInput').placeholder = '继续回应 ' + state.currentCase.name + ' ……';
    $('submitBtn').textContent = '发送 ➤';
    appendSystem('（自由续聊开始）');
    // 让 AI 先开口
    llmReply();
  }

  async function sendFreeplay() {
    const input = $('responseInput');
    const text = input.value.trim();
    if (!text) return;
    appendTranscript('counselor', text);
    state.freeplayTranscript.push({ role: 'counselor', text });
    input.value = '';
    $('submitBtn').disabled = true;
    await llmReply();
  }

  async function llmReply() {
    const c = state.currentCase;
    $('typingCaret').hidden = false;
    $('speechBubble').hidden = false;
    Avatar.setEmotion(c.baselineEmotion);
    const r = await LLM.clientReply({
      name: c.name, age: c.age, gender: c.gender, role: c.role, summary: c.summary, background: c.background
    }, state.freeplayTranscript);
    if (!r || !r.ok) {
      appendSystem('（大模型调用失败，自由续聊结束：' + (r ? esc(r.error) : '未配置') + '）');
      $('typingCaret').hidden = true;
      $('submitBtn').disabled = true;
      return;
    }
    state.freeplayTranscript.push({ role: 'client', text: r.text });
    await typewriter(r.text, $('clientText'), () => {
      appendTranscript('client', r.text);
    });
    $('submitBtn').disabled = false;
    $('responseInput').focus();
  }

  // ---------- AI 自由对话（教学伙伴 / 复杂来访者） ----------
  function aiWho(role) {
    if (role === 'partner') return '🤖 教学伙伴';
    if (role === 'client') return '来访者';
    return '我（咨询师）';
  }
  function aiClass(role) {
    if (role === 'partner') return 'partner';
    if (role === 'client') return 'client';
    return 'user';
  }
  function appendAiMsg(role, text) {
    if (role === 'sys') { appendSystem(text); return; }
    const box = $('transcript');
    const div = document.createElement('div');
    div.className = 'msg ' + aiClass(role);
    div.innerHTML = '<span class="who">' + aiWho(role) + '</span>' + esc(text);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  function appendAiHtml(role, html) {
    const box = $('transcript');
    const div = document.createElement('div');
    div.className = 'msg ' + aiClass(role);
    div.innerHTML = '<span class="who">' + aiWho(role) + '</span>' + html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function appendClientSpeech(text) {
    Avatar.setEmotion(state.currentCase.baselineEmotion || 'neutral');
    $('typingCaret').hidden = false;
    $('speechBubble').hidden = false;
    typewriter(text, $('clientText'), () => {
      appendAiMsg('client', text);
    });
  }

  function startAiDialogue(c) {
    const online = LLM.isEnabled();
    state.ai = { kind: c.aiKind, transcript: [], offlineStep: 0, offline: !online, busy: false };
    $('modeSwitch').hidden = true;
    $('optionPanel').hidden = true;
    $('inputPanel').hidden = false;
    $('responseInput').disabled = false;
    $('responseInput').value = '';
    $('submitBtn').disabled = false;
    $('submitBtn').textContent = '发送 ➤';
    $('nextBtn').hidden = true;
    resetRightPanel();
    Avatar.setEmotion(c.baselineEmotion || 'neutral');
    $('sessionProgress').innerHTML =
      '<div class="sp-item"><span>模式</span><b>' + (c.aiKind === 'partner' ? '教学伙伴' : '来访者陪练') + '</b></div>' +
      '<div class="sp-item"><span>状态</span><b>' + (online ? '🤖 在线大模型' : '📴 离线') + '</b></div>';

    if (c.aiKind === 'partner') {
      $('turnGuide').innerHTML =
        '<div><b>教学伙伴用法：</b></div>' +
        '<div>· 提问：「什么是共情？」「CBT 的核心是什么？」</div>' +
        '<div>· 出题：「给我出 3 道选择题」</div>' +
        '<div>· 点评：「帮我看看这句回应怎么样」</div>' +
        '<div>· 扮演：「请扮演一位焦虑的来访者，我来练习」</div>';
      $('responseInput').placeholder = '向教学伙伴提问、请它出题、点评或扮演来访者……';
      appendAiMsg('partner', online
        ? '你好，我是你的 AI 教学伙伴。你可以向我提问任何流派、概念或技术，也可以让我出题测验、点评你的回应，或扮演来访者陪你练习。'
        : c.offlineHint);
    } else {
      $('turnGuide').innerHTML =
        '<div><b>来访者档案</b></div><div>' + esc(c.background) + '</div>' +
        '<div class="g-target">💡 提示：综合运用共情、开放式提问、认知重构等多流派技术，不要只用单一技巧。</div>';
      $('responseInput').placeholder = '以咨询师的身份回应 ' + esc(c.name) + ' ……';
      if (online) {
        appendAiMsg('sys', '开始自由对话：AI 将扮演来访者，你以咨询师身份回应。');
        aiClientReply();
      } else {
        appendAiMsg('sys', c.offlineHint);
        const first = c.offlineLines[0];
        state.ai.offlineStep = 0;
        state.ai.transcript.push({ role: 'client', text: first });
        appendClientSpeech(first);
      }
    }
  }

  async function sendAiMessage() {
    const c = state.currentCase;
    const input = $('responseInput');
    const text = input.value.trim();
    if (!text) { toast('请输入内容'); return; }
    if (state.ai.busy) return;
    input.value = '';
    $('submitBtn').disabled = true;
    const role = (c.aiKind === 'partner') ? 'user' : 'counselor';
    appendAiMsg(role, text);
    state.ai.transcript.push({ role, text });

    if (c.aiKind === 'partner') {
      if (state.ai.offline) {
        const cards = knowledgeSearch(text);
        if (cards.length) appendAiHtml('partner', cards.map(renderKnowledgeCard).join(''));
        else appendAiMsg('partner', c.offlineHint);
      } else {
        await aiPartnerReply();
      }
    } else {
      if (state.ai.offline) aiClientOfflineReply();
      else await aiClientReply();
    }
    $('submitBtn').disabled = false;
    $('responseInput').focus();
  }

  async function aiPartnerReply() {
    const c = state.currentCase;
    state.ai.busy = true;
    const r = await LLM.partnerReply(c.partnerSystem, state.ai.transcript);
    state.ai.busy = false;
    if (!r || !r.ok) {
      appendAiMsg('sys', '（大模型调用失败：' + (r ? esc(r.error) : '未配置') + '，已切换本地知识库检索。）');
      const last = state.ai.transcript.length ? state.ai.transcript[state.ai.transcript.length - 1].text : '';
      const cards = knowledgeSearch(last);
      appendAiHtml('partner', cards.length ? cards.map(renderKnowledgeCard).join('') : '<div class="knowledge-card k-none">' + esc(c.offlineHint) + '</div>');
      return;
    }
    state.ai.transcript.push({ role: 'partner', text: r.text });
    appendAiMsg('partner', r.text);
  }

  async function aiClientReply() {
    const c = state.currentCase;
    state.ai.busy = true;
    const r = await LLM.clientReply({ name: c.name, age: c.age, gender: c.gender, role: c.role, summary: c.summary, background: c.background }, state.ai.transcript);
    state.ai.busy = false;
    if (!r || !r.ok) {
      appendAiMsg('sys', '（大模型调用失败：' + (r ? esc(r.error) : '未配置') + '）');
      $('submitBtn').disabled = true;
      return;
    }
    state.ai.transcript.push({ role: 'client', text: r.text });
    appendClientSpeech(r.text);
  }

  function aiClientOfflineReply() {
    const c = state.currentCase;
    const lines = c.offlineLines || [];
    state.ai.offlineStep++;
    if (state.ai.offlineStep < lines.length) {
      const next = lines[state.ai.offlineStep];
      state.ai.transcript.push({ role: 'client', text: next });
      appendClientSpeech(next);
    } else {
      appendAiMsg('sys', '（离线脚本已结束。配置大模型后可体验完整自由陪练。）');
      $('submitBtn').disabled = true;
    }
  }

  // —— 离线知识库检索（教学伙伴退化） ——
  function knowledgeSearch(q) {
    const tokens = (q || '').split(/[\s，。？！、；：""''（）()\-/·]+/).filter((t) => t.length >= 2);
    const qq = (q || '').trim();
    const all = tokens.length ? tokens : (qq ? [qq] : []);
    if (!all.length) return [];
    const hit = (text) => {
      const t = (text || '').toLowerCase();
      return all.some((k) => t.indexOf(k.toLowerCase()) !== -1);
    };
    const cards = [];
    Object.keys(Scoring.SKILLS).forEach((id) => {
      const s = Scoring.SKILLS[id];
      if (hit([s.name, s.en, s.def, s.hint, s.example].join(' '))) {
        cards.push({ title: '🛠️ ' + s.name + (s.en ? '（' + s.en + '）' : ''), body: '定义：' + s.def + (s.example ? '\n示例：「' + s.example + '」' : '') + '\n要点：' + s.hint });
      }
    });
    Object.keys(Scoring.ERRORS).forEach((id) => {
      const e = Scoring.ERRORS[id];
      if (hit([e.name, e.en, e.hint].join(' '))) {
        cards.push({ title: '⚠️ 误区：' + e.name, body: e.hint });
      }
    });
    // 全书蒸馏知识库（更详细、优先，作为离线教学伙伴的主力内容）
    if (window.BookKnowledge) {
      window.BookKnowledge.search(q).forEach((e) => {
        cards.push({ title: '📚 ' + e.chapter + ' · ' + e.topic, body: e.body });
      });
    } else {
      (window.THEORIES || []).forEach((t) => {
        if (hit([t.name, t.founder, t.core, t.tech, t.keyTerms, t.humanNature, t.goals, t.relation, t.contributions, t.limitations].join(' '))) {
          cards.push({ title: '🎓 ' + t.ch + ' ' + t.name + (t.founder ? '（' + t.founder + '）' : ''), body: (t.humanNature ? '人性观：' + t.humanNature + '\n' : '') + '核心：' + t.core + '\n技术：' + t.tech + (t.goals ? '\n目标：' + t.goals : '') });
        }
      });
      (window.FOUNDATIONS || []).forEach((f) => {
        if (hit([f.name, f.core, f.keyTerms, f.points].join(' '))) {
          cards.push({ title: '📖 ' + f.ch + ' ' + f.name, body: '核心：' + f.core + '\n要点：' + f.points });
        }
      });
    }
    // 课程教材知识库（心理咨询技术与实务）
    if (window.CourseKnowledge) {
      window.CourseKnowledge.search(q).forEach((e) => {
        cards.push({ title: '🎓 ' + e.chapter + ' · ' + e.topic, body: e.body });
      });
    }
    return cards.slice(0, 5);
  }

  function renderKnowledgeCard(k) {
    return '<div class="knowledge-card"><h3>' + esc(k.title) + '</h3><p>' + esc(k.body).replace(/\n/g, '<br>') + '</p></div>';
  }

  // ---------- 仪表盘 ----------
  function renderDashboard() {
    const p = loadProgress();
    $('statTurns').textContent = p.stats.turns;
    $('statAvg').textContent = p.stats.turns ? Math.round(p.stats.totalScore / p.stats.turns) : '—';
    $('statCases').textContent = p.stats.casesDone.length;
    $('statStreak').textContent = p.stats.streak;
    renderRadar(p);
    renderHistory(p);
    renderReview(p);
    renderGrowth(p);
  }

  function renderRadar(p) {
    const skills = Object.keys(Scoring.SKILLS);
    const counts = skills.map((id) => p.skills[id] || 0);
    const max = Math.max(1, ...counts);
    const n = skills.length;
    const cx = 200, cy = 200, R = 150;
    const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];

    let svg = '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">';
    // 网格（4 层）
    for (let g = 1; g <= 4; g++) {
      const r = R * g / 4;
      const pts = skills.map((_, i) => pt(i, r).join(',')).join(' ');
      svg += '<polygon points="' + pts + '" fill="none" stroke="var(--line)" stroke-width="1"/>';
    }
    // 轴线
    skills.forEach((_, i) => {
      const [x, y] = pt(i, R);
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="var(--line)" stroke-width="1"/>';
    });
    // 数据多边形
    const dataPts = skills.map((_, i) => pt(i, R * (counts[i] / max) * 0.92).join(',')).join(' ');
    svg += '<polygon points="' + dataPts + '" fill="var(--primary)" fill-opacity="0.28" stroke="var(--primary)" stroke-width="2.5"/>';
    // 顶点 + 标签
    skills.forEach((id, i) => {
      const [x, y] = pt(i, R * (counts[i] / max) * 0.92);
      svg += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="var(--primary)"/>';
      const [lx, ly] = pt(i, R + 24);
      const name = Scoring.SKILLS[id].name;
      svg += '<text x="' + lx + '" y="' + ly + '" font-size="11" fill="var(--ink-soft)" text-anchor="middle">' + esc(name) + '</text>';
      svg += '<text x="' + lx + '" y="' + (ly + 13) + '" font-size="9.5" fill="var(--muted)" text-anchor="middle">' + counts[i] + '次</text>';
    });
    svg += '</svg>';
    $('radarBox').innerHTML = svg;
  }

  function renderHistory(p) {
    const box = $('historyList');
    if (!p.history.length) { box.innerHTML = '<div class="empty-tip">还没有练习记录，去完成一轮吧。</div>'; return; }
    box.innerHTML = p.history.slice(0, 30).map((h) => {
      const d = new Date(h.time);
      const timeStr = d.getMonth() + 1 + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      return '<div class="h-row">' +
        '<div class="h-top"><span><b>' + esc(h.caseName) + '</b> · 第' + h.turn + '轮 · ' + esc(MODE_LABEL[h.mode] || '') + '</span>' +
        '<span class="h-score ' + (LEVEL_COLOR[h.level] || '') + '">' + h.score + '分 ' + esc(h.level || '') + '</span></div>' +
        '<div class="h-time">' + timeStr + '</div>' +
        '<div class="h-detail">' +
        (h.good && h.good.length ? '✅ ' + esc(h.good.join('、')) + '<br>' : '') +
        (h.bad && h.bad.length ? '⚠️ ' + esc(h.bad.join('、')) + '<br>' : '') +
        (h.gap && h.gap.length ? '<span class="h-gap">🎯 可尝试 ' + esc(h.gap.join('、')) + '</span>' : '') +
        '</div></div>';
    }).join('');
  }

  function renderReview(p) {
    const box = $('reviewList');
    const items = p.history.filter((h) => h.review);
    if (!items.length) { box.innerHTML = '<div class="empty-tip">暂无错题（70 分以下的回应会收进这里）。</div>'; return; }
    box.innerHTML = items.slice(0, 30).map((h) =>
      '<div class="h-row">' +
      '<div class="h-top"><span><b>' + esc(h.caseName) + '</b> · 第' + h.turn + '轮</span>' +
      '<span class="h-score low">' + h.score + '分</span></div>' +
      '<div class="h-detail"><span class="rv-label">你的回应</span>' + esc(h.response) +
      '<br><span class="rv-label">参考答案</span>「' + esc(h.modelAnswer) + '」</div>' +
      '</div>'
    ).join('');
  }

  // ---------- 成长曲线 ----------
  function initGrowthSelect() {
    const sel = $('growthMetric');
    if (!sel) return;
    let html = '<option value="score">综合得分</option>';
    Object.keys(Scoring.SKILLS).forEach((id) => {
      html += '<option value="' + id + '">' + esc(Scoring.SKILLS[id].name) + '</option>';
    });
    sel.innerHTML = html;
  }

  function lineChartSvg(values, labels, yLabel, width) {
    const W = Math.max(360, Math.min(1600, width || 1000));
    const H = Math.round(W * 0.62);
    const padL = 64, padR = 16, padT = 30, padB = 46;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = values.length;
    const x = (i) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = (v) => padT + (1 - Math.max(0, Math.min(100, v)) / 100) * plotH;

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" class="line-chart-svg" preserveAspectRatio="xMidYMid meet">';
    for (let g = 0; g <= 4; g++) {
      const v = g * 25;
      const yy = y(v);
      svg += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" stroke="var(--line)" stroke-width="1"/>';
      svg += '<text x="' + (padL - 10) + '" y="' + (yy + 5) + '" font-size="14" fill="var(--muted)" text-anchor="end">' + v + '</text>';
    }
    const pts = values.map((v, i) => x(i) + ',' + y(v)).join(' ');
    if (n > 1) {
      const area = padL + ',' + (padT + plotH) + ' ' + pts + ' ' + x(n - 1) + ',' + (padT + plotH);
      svg += '<polygon points="' + area + '" fill="var(--primary)" fill-opacity="0.10"/>';
    }
    svg += '<polyline points="' + pts + '" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    values.forEach((v, i) => {
      svg += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="5" fill="var(--primary)"><title>第' + esc(labels[i]) + '次 · ' + v + '</title></circle>';
    });
    const step = Math.max(1, Math.ceil(n / 12));
    values.forEach((v, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      svg += '<text x="' + x(i) + '" y="' + (H - 12) + '" font-size="14" fill="var(--muted)" text-anchor="middle">' + esc(labels[i]) + '</text>';
    });
    svg += '<text x="' + padL + '" y="' + (padT - 10) + '" font-size="14" fill="var(--muted)">' + esc(yLabel) + '</text>';
    svg += '</svg>';
    return svg;
  }

  function renderGrowth(p) {
    const box = $('growthChart');
    const note = $('growthNote');
    const metric = $('growthMetric') ? $('growthMetric').value : 'score';
    const chrono = (p.history || []).slice().reverse(); // 旧 → 新

    if (!chrono.length) {
      box.innerHTML = '<div class="empty-tip">完成几轮练习后，这里会出现你的成长曲线。</div>';
      note.textContent = '';
      return;
    }

    let values, labels, yLabel, noteText;
    if (metric === 'score') {
      values = chrono.map((h) => Math.max(0, Math.min(100, h.score || 0)));
      labels = chrono.map((h, i) => String(i + 1));
      yLabel = '得分（0–100）';
      noteText = '每次回应得到的得分。曲线整体抬升，说明你的回应质量在稳定提高。';
    } else {
      const W = 5;
      const skillName = Scoring.SKILLS[metric] ? Scoring.SKILLS[metric].name : metric;
      values = chrono.map((h, i) => {
        const start = Math.max(0, i - W + 1);
        let hit = 0;
        for (let k = start; k <= i; k++) {
          if ((chrono[k].goodIds || []).indexOf(metric) !== -1) hit++;
        }
        return Math.round(hit / (i - start + 1) * 100);
      });
      labels = chrono.map((h, i) => String(i + 1));
      yLabel = '近 5 轮命中率（%）';
      noteText = '「' + esc(skillName) + '」在最近 5 次回应中被正确使用的比例，反映这项技巧的熟练度随时间的变化。';
    }

    box.innerHTML = lineChartSvg(values, labels, yLabel, box.clientWidth);
    note.textContent = noteText;
  }

  // ---------- 学习资料 ----------
  function buildGlossaries() {
    // 微技巧词条（含英文名 / 定义 / 示例 / 要点）
    const sBox = $('skillsGlossary');
    sBox.innerHTML = Object.keys(Scoring.SKILLS).map((id) => {
      const s = Scoring.SKILLS[id];
      return '<div class="glossary-card"><h3>' + esc(s.name) +
        (s.en ? ' <span class="g-en">' + esc(s.en) + '</span>' : '') + '</h3>' +
        (s.def ? '<p><b>定义：</b>' + esc(s.def) + '</p>' : '') +
        (s.example ? '<p class="g-ex"><b>示例：</b>「' + esc(s.example) + '」</p>' : '') +
        (s.hint ? '<p class="g-hint"><b>要点：</b>' + esc(s.hint) + '</p>' : '') +
        '</div>';
    }).join('') +
    '<div class="glossary-card g-errors"><h3>⚠️ 常见误区（减分项）</h3><p>' +
    Object.keys(Scoring.ERRORS).map((id) => {
      const e = Scoring.ERRORS[id];
      return '<b>' + esc(e.name) + '</b>' + (e.en ? ' <span class="g-en">' + esc(e.en) + '</span>' : '') + '：' + esc(e.hint);
    }).join('<br>') + '</p></div>';

    // 基础与伦理（第 1~3、15 章）
    const fBox = $('foundationsGlossary');
    fBox.innerHTML = (window.FOUNDATIONS || []).map((f) =>
      '<div class="glossary-card"><h3><span class="ch">' + esc(f.ch) + '</span>' + esc(f.name) + '</h3>' +
      '<p><b>核心：</b>' + esc(f.core) + '</p>' +
      '<p class="g-tech"><b>关键术语：</b>' + esc(f.keyTerms) + '</p>' +
      '<p class="g-tech"><b>要点：</b>' + esc(f.points) + '</p>' +
      '</div>'
    ).join('');

    // 流派速览（可折叠：标题常驻、详情展开）
    const tBox = $('theoriesGlossary');
    tBox.innerHTML = window.THEORIES.map((t) =>
      collapsibleCard(
        t.ch, t.name, (t.founder ? '（' + t.founder + '）' : ''),
        '<p><b>核心：</b>' + esc(t.core) + '</p>' +
        (t.humanNature ? '<p><b>人性观：</b>' + esc(t.humanNature) + '</p>' : '') +
        (t.goals ? '<p><b>治疗目标：</b>' + esc(t.goals) + '</p>' : '') +
        (t.relation ? '<p><b>咨访关系：</b>' + esc(t.relation) + '</p>' : '') +
        '<p><b>技术：</b>' + esc(t.tech) + '</p>' +
        (t.keyTerms ? '<p><b>关键术语：</b>' + esc(t.keyTerms) + '</p>' : '') +
        (t.contributions ? '<p><b>贡献：</b>' + esc(t.contributions) + '</p>' : '') +
        (t.limitations ? '<p><b>适用与局限：</b>' + esc(t.limitations) + '</p>' : '')
      )
    ).join('');

    // 全书蒸馏知识库（可折叠详细词条）
    const bBox = $('bookKnowledgeGlossary');
    if (bBox && window.BOOK_KNOWLEDGE) {
      bBox.innerHTML = window.BOOK_KNOWLEDGE.map((e) =>
        collapsibleCard(e.chapter, e.topic, '', '<p>' + esc(e.body).replace(/\n/g, '<br>') + '</p>')
      ).join('');
    }

    // 课程教材知识库（可折叠详细词条）
    const cBox = $('courseKnowledgeGlossary');
    if (cBox && window.COURSE_KNOWLEDGE) {
      cBox.innerHTML = window.COURSE_KNOWLEDGE.map((e) =>
        collapsibleCard(e.chapter, e.topic, '', '<p>' + esc(e.body).replace(/\n/g, '<br>') + '</p>')
      ).join('');
    }
  }

  // 生成可折叠词条卡：标题常驻，正文点击展开
  function collapsibleCard(chapter, title, sub, bodyHtml) {
    return '<div class="glossary-card g-collapse">' +
      '<button class="g-head" type="button" aria-expanded="false">' +
      '<span class="g-head-title"><span class="ch">' + esc(chapter) + '</span>' + esc(title) +
      (sub ? '<span class="g-founder">' + esc(sub) + '</span>' : '') + '</span>' +
      '<span class="g-chev">▾</span>' +
      '</button>' +
      '<div class="g-body" hidden>' + bodyHtml + '</div>' +
      '</div>';
  }

  // ---------- 学习资料：分类切换 + 折叠 + 搜索 ----------
  function initLearn() {
    // 分类计数（动态，避免与数据不一致）
    const counts = {
      skills: Object.keys(Scoring.SKILLS).length,
      foundations: (window.FOUNDATIONS || []).length,
      theories: (window.THEORIES || []).length,
      book: (window.BOOK_KNOWLEDGE || []).length,
      course: (window.COURSE_KNOWLEDGE || []).length
    };
    document.querySelectorAll('.cat-count').forEach((el) => {
      const k = el.getAttribute('data-count');
      if (counts[k] != null) el.textContent = counts[k];
    });

    // 折叠 / 展开
    document.querySelectorAll('.g-head').forEach((h) => {
      h.addEventListener('click', () => {
        const body = h.nextElementSibling;
        const open = body && !body.hidden;
        if (body) body.hidden = open;
        h.classList.toggle('open', !open);
        h.setAttribute('aria-expanded', String(!open));
      });
    });

    const cats = document.querySelectorAll('.learn-cat');
    const panels = document.querySelectorAll('.learn-panel');
    const search = $('learnSearch');

    function activePanel() {
      for (const p of panels) if (!p.hidden) return p;
      return panels[0];
    }

    function applyFilter() {
      const q = (search.value || '').trim().toLowerCase();
      const panel = activePanel();
      if (!panel) return;
      const cards = panel.querySelectorAll('.glossary-card');
      let n = 0;
      cards.forEach((c) => {
        const ok = !q || c.textContent.toLowerCase().indexOf(q) !== -1;
        c.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      const empty = $('learnEmpty');
      empty.hidden = !(q && cards.length > 0 && n === 0);
      $('learnEmptyKey').textContent = search.value.trim();
    }

    // 分类切换
    cats.forEach((btn) => {
      btn.addEventListener('click', () => {
        cats.forEach((x) => x.classList.remove('active'));
        btn.classList.add('active');
        panels.forEach((p) => { p.hidden = (p.dataset.panel !== btn.dataset.cat); });
        applyFilter();
      });
    });

    search.addEventListener('input', applyFilter);
  }

  // ---------- 蒸馏问答 ----------
  const QA_SUGGESTED = [
    '什么是共情？', '认知歪曲有哪些？', '系统脱敏怎么做？', 'ABC-D-E 模型是什么？',
    '斯坦案例是什么？', '个案概念化怎么做？', '精神分析的核心概念？', 'WDEP 是什么？'
  ];

  function qaRetrieve(q) {
    const bookEntries = window.BookKnowledge ? window.BookKnowledge.search(q) : [];
    const courseEntries = window.CourseKnowledge ? window.CourseKnowledge.search(q) : [];
    const entries = bookEntries.concat(courseEntries);
    const tokens = (q || '').split(/[\s，。？！、；：""''（）()\-/·]+/).filter((t) => t.length >= 1);
    const all = tokens.length ? tokens : ((q || '').trim() ? [(q || '').trim()] : []);
    const hit = (text) => {
      const t = (text || '').toLowerCase();
      return all.some((k) => t.indexOf(k.toLowerCase()) !== -1);
    };
    const cards = bookEntries.map((e) => ({ title: '📚 ' + e.chapter + ' · ' + e.topic, body: e.body }))
      .concat(courseEntries.map((e) => ({ title: '🎓 ' + e.chapter + ' · ' + e.topic, body: e.body })));
    if (all.length) {
      Object.keys(Scoring.SKILLS).forEach((id) => {
        const s = Scoring.SKILLS[id];
        if (hit([s.name, s.en, s.def, s.hint, s.example].join(' '))) {
          cards.push({ title: '🛠️ ' + s.name + (s.en ? '（' + s.en + '）' : ''), body: '定义：' + s.def + (s.example ? '\n示例：「' + s.example + '」' : '') + '\n要点：' + s.hint });
        }
      });
      Object.keys(Scoring.ERRORS).forEach((id) => {
        const e = Scoring.ERRORS[id];
        if (hit([e.name, e.en, e.hint].join(' '))) cards.push({ title: '⚠️ 误区：' + e.name, body: e.hint });
      });
    }
    return { entries, cards };
  }

  function renderQaResult(cards, llmText) {
    const box = $('qaResult');
    let html = '';
    if (llmText) {
      html += '<div class="qa-answer"><div class="qa-answer-head">🤖 大模型深度讲解</div><div class="qa-answer-body">' + esc(llmText).replace(/\n/g, '<br>') + '</div></div>';
    }
    if (!cards.length && !llmText) {
      html = '<p class="qa-empty">没有命中相关词条。试试换成流派名、微技巧名或关键词（如「共情」「认知行为」「系统脱敏」「斯坦」）。</p>';
    } else if (cards.length) {
      html += '<div class="qa-ref-head">📚 命中的蒸馏词条（' + cards.length + '）</div>' + cards.map(renderKnowledgeCard).join('');
    }
    box.innerHTML = html;
  }

  function renderQa() {
    $('qaChips').innerHTML = QA_SUGGESTED.map((s) => '<button class="qa-chip">' + esc(s) + '</button>').join('');
    $('qaChips').querySelectorAll('.qa-chip').forEach((c) => {
      c.addEventListener('click', () => { $('qaInput').value = c.textContent; qaSearch(); });
    });
    const list = (window.BOOK_KNOWLEDGE || []).concat(window.COURSE_KNOWLEDGE || []);
    $('qaCount').textContent = list.length;
    $('qaBrowse').hidden = false;
    $('qaToggleBrowse').textContent = '收起全部';
    $('qaBrowse').innerHTML = list.map((e) =>
      '<div class="glossary-card g-book"><h3><span class="ch">' + esc(e.chapter) + '</span>' + esc(e.topic) + '</h3>' +
      '<p>' + esc(e.body).replace(/\n/g, '<br>') + '</p></div>'
    ).join('');
    updateQaLlmBtn();
    if (!state.qa) $('qaResult').innerHTML = '<p class="qa-empty">👆 输入一个问题，或点击上面的推荐问题开始。</p>';
  }

  function updateQaLlmBtn() {
    const btn = $('qaLlmBtn');
    if (!btn) return;
    btn.hidden = !(LLM.isEnabled() && state.qa && state.qa.q);
  }

  function qaSearch() {
    const q = ($('qaInput').value || '').trim();
    if (!q) { toast('请输入一个问题'); return; }
    const { entries, cards } = qaRetrieve(q);
    state.qa = { q, entries };
    renderQaResult(cards, null);
    updateQaLlmBtn();
  }

  async function qaLlmAsk() {
    if (!state.qa || !state.qa.q) return;
    if (!LLM.isEnabled()) { toast('请先在「设置」里启用大模型'); return; }
    const btn = $('qaLlmBtn');
    btn.disabled = true; btn.textContent = '⏳ 生成中…';
    try {
      const res = await LLM.askKnowledge(state.qa.q, state.qa.entries);
      if (res.ok) {
        renderQaResult(qaRetrieve(state.qa.q).cards, res.text);
      } else {
        toast('深度讲解失败：' + (res.error || '未知错误'));
      }
    } finally {
      btn.disabled = false; btn.textContent = '🤖 深度讲解（大模型）';
    }
  }

  // ---------- 全流程咨询 · 过关 ----------
  function loadWorkflow() {
    try {
      const raw = localStorage.getItem(WORKFLOW_KEY);
      if (raw) {
        const w = JSON.parse(raw);
        if (w && typeof w.currentStage === 'number') return w;
      }
    } catch (e) {}
    return { currentStage: 0, unlocked: 1, passed: {}, best: {} };
  }
  function saveWorkflow(w) {
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(w));
  }

  function initWorkflow() {
    renderWorkflow();
  }

  function renderWorkflow() {
    const w = loadWorkflow();
    renderStageMap(w);
    renderClientCard();
    const stage = window.WORKFLOW_STAGES[w.currentStage];
    renderStageDetail(stage, w);
  }

  function renderClientCard() {
    const c = window.WORKFLOW_CLIENT;
    if (!c) return;
    $('wfClientCard').innerHTML =
      '<div class="wc-name">' + esc(c.name) + ' <span style="font-weight:400;font-size:12px">' + c.age + '岁 · ' + esc(c.gender) + ' · ' + esc(c.role) + '</span></div>' +
      '<div>' + String(c.issues || '').split('、').map((s) => '<span class="wc-tag">' + esc(s) + '</span>').join('') + '</div>' +
      '<div style="margin-top:6px;color:var(--muted)">' + esc(c.note) + '</div>';
  }

  function renderStageMap(w) {
    const box = $('wfStageMap');
    const stages = window.WORKFLOW_STAGES || [];
    box.innerHTML = stages.map((s, i) => {
      const locked = i >= w.unlocked;
      const done = !!(w.passed && w.passed[i]);
      const isCur = i === w.currentStage && !locked;
      let badge = '';
      if (locked) badge = '<span class="wf-s-badge lock">🔒 未解锁</span>';
      else if (done) badge = '<span class="wf-s-badge pass">✓ 已过关</span>';
      else if (isCur) badge = '<span class="wf-s-badge pass">▶ 当前</span>';
      else badge = '<span class="wf-s-badge lock">待解锁</span>';
      const score = (w.best && w.best[i] != null) ? ('最佳 ' + w.best[i] + ' 分') : '';
      const cls = 'wf-stage-card ' + (locked ? 'locked' : (done ? 'done' : (isCur ? 'current' : '')));
      return '<div class="' + cls + '" data-idx="' + i + '">' +
        '<div class="wf-s-top"><span class="wf-s-icon">' + esc(s.icon) + '</span>' +
        '<span class="wf-s-title">' + (i + 1) + '. ' + esc(s.title) + '</span>' + badge + '</div>' +
        '<div class="wf-s-short">' + esc(s.short) + '</div>' +
        (score ? '<div class="wf-s-score">' + esc(score) + '</div>' : '') +
        '</div>';
    }).join('');
    box.querySelectorAll('.wf-stage-card').forEach((el) => {
      const idx = Number(el.dataset.idx);
      el.addEventListener('click', () => {
        const w2 = loadWorkflow();
        if (idx >= w2.unlocked) { toast('请先通过前面的关卡'); return; }
        w2.currentStage = idx;
        saveWorkflow(w2);
        renderWorkflow();
      });
    });
  }

  function renderStageDetail(stage, w) {
    if (!stage) return;
    const alreadyPassed = !!(w.passed && w.passed[w.currentStage]);
    state.wf = { stageIndex: w.currentStage, lineIdx: 0, passed: alreadyPassed, evaluating: false, lastResult: null, transcript: [] };

    $('wfStageTitle').textContent = stage.icon + ' ' + stage.title;
    $('wfStageGoal').innerHTML = '<b>本关目标：</b>' + esc(stage.goal) +
      (stage.requiredSkills && stage.requiredSkills.length
        ? '<br><b>要求技能：</b>' + stage.requiredSkills.map((id) => Scoring.SKILLS[id] ? Scoring.SKILLS[id].name : id).join('、')
        : '');
    $('wfKnowledge').innerHTML = '<span class="wf-k-title">📚 知识背景</span>\n' + esc(stage.knowledge);
    $('wfKnowledge').hidden = true;
    $('wfToggleKnowledge').textContent = '📚 查看本关知识背景';
    $('wfClientName').textContent = window.WORKFLOW_CLIENT.name + '（' + window.WORKFLOW_CLIENT.role + '）';
    $('wfClientText').textContent = stage.clientText;
    $('wfTranscript').innerHTML = '';
    appendWfTranscript('client', stage.clientText);
    $('wfResponseInput').value = '';
    $('wfResponseInput').disabled = alreadyPassed;
    $('wfSubmitBtn').disabled = alreadyPassed;
    $('wfSubmitBtn').textContent = '提交本关回应 ➤';
    $('wfInputHint').textContent = 'Ctrl + Enter 发送';
    $('wfResult').innerHTML = '';
    $('wfNextStageBtn').hidden = !alreadyPassed;
    if (alreadyPassed) {
      const isLast = w.currentStage >= window.WORKFLOW_STAGES.length - 1;
      $('wfNextStageBtn').textContent = isLast ? '🎓 全流程已完成' : '进入下一关 →';
      $('wfNextStageBtn').disabled = isLast;
      $('wfResult').innerHTML = '<div class="wf-verdict pass">✓ 本关已过关' +
        (w.best && w.best[w.currentStage] != null ? ' · 最佳 ' + w.best[w.currentStage] + ' 分' : '') +
        '</div><div class="wf-im">💡 ' + esc(stage.reflection) + '</div>';
    } else {
      $('wfNextStageBtn').hidden = true;
    }
  }

  function appendWfTranscript(role, text) {
    const box = $('wfTranscript');
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'client' ? 'client' : 'counselor');
    div.innerHTML = '<span class="who">' + (role === 'client' ? '来访者' : '我（咨询师）') + '</span>' + esc(text);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    if (state.wf) state.wf.transcript = (state.wf.transcript || []).concat([{ role, text }]);
  }

  async function submitWorkflowResponse() {
    if (!state.wf || state.wf.evaluating || state.wf.passed) return;
    const stage = window.WORKFLOW_STAGES[state.wf.stageIndex];
    const input = $('wfResponseInput');
    const text = input.value.trim();
    if (!text) { toast('请先输入你的回应'); return; }
    if (text.length < 4) { toast('回应太短了，试着更完整一些'); return; }

    state.wf.evaluating = true;
    input.disabled = true;
    $('wfSubmitBtn').disabled = true;
    appendWfTranscript('counselor', text);

    const pseudoTurn = { targets: stage.targets || [], techniques: stage.techniques || [] };
    const ruleResult = Scoring.scoreResponse(text, pseudoTurn, 'full');

    let coachRes = null;
    if (LLM.isEnabled()) {
      $('wfResult').innerHTML = '<div class="wf-verdict" style="background:var(--bg-soft);color:var(--ink-soft)">🤖 大模型评估中…</div>';
      coachRes = await LLM.stageCoach(stage, text, state.wf.transcript || []);
    }

    let result;
    if (coachRes && coachRes.ok && coachRes.result) {
      const r = coachRes.result;
      result = {
        score: Number(r.score) || 0,
        passed: !!r.passed,
        level: r.level || '',
        strengths: r.strengths || [],
        improvements: r.improvements || [],
        suggestion: r.suggestion || '',
        coachNote: r.coachNote || ''
      };
    } else {
      result = {
        score: ruleResult.score,
        passed: ruleResult.score >= stage.passScore,
        level: ruleResult.level,
        strengths: ruleResult.found.map((f) => f.name),
        improvements: Scoring.specificImprovements(ruleResult).map((it) => it.name + (it.hint ? '：' + it.hint : '')),
        suggestion: (ruleResult.suggestion || []).join('；'),
        coachNote: ''
      };
    }

    state.wf.evaluating = false;
    state.wf.lastResult = result;
    state.wf.passed = result.passed;

    const w = loadWorkflow();
    w.best[state.wf.stageIndex] = Math.max(w.best[state.wf.stageIndex] || 0, result.score);
    if (result.passed) {
      w.passed[state.wf.stageIndex] = true;
      w.unlocked = Math.min(window.WORKFLOW_STAGES.length, Math.max(w.unlocked, state.wf.stageIndex + 2));
    }
    saveWorkflow(w);
    renderStageMap(w);
    renderWfResult(result, stage);
  }

  function renderWfResult(result, stage) {
    const box = $('wfResult');
    const pass = result.passed;
    let html =
      '<div class="wf-verdict ' + (pass ? 'pass' : 'fail') + '">' + (pass ? '🎉 过关！' : '↩️ 未达标，可再试一次') +
      '　<span class="wf-score-big">' + result.score + '</span> 分' +
      (result.level ? '（' + esc(result.level) + '）' : '') + '</div>' +
      (result.strengths && result.strengths.length ? '<div class="wf-im">✅ <b>做得好：</b>' + esc(result.strengths.join('、')) + '</div>' : '') +
      (result.improvements && result.improvements.length ? '<div class="wf-im">⚠️ <b>待改进：</b>' + esc(result.improvements.join('；')) + '</div>' : '') +
      (result.suggestion ? '<div class="wf-im">🎯 <b>建议：</b>' + esc(result.suggestion) + '</div>' : '') +
      (result.coachNote ? '<div class="wf-im" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)">🧭 <b>督导师点评：</b>' + esc(result.coachNote).replace(/\n/g, '<br>') + '</div>' : '') +
      '<div class="wf-im" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)">💡 <b>过关小结：</b>' + esc(stage.reflection) + '</div>';
    box.innerHTML = html;

    if (pass) {
      const isLast = state.wf.stageIndex >= window.WORKFLOW_STAGES.length - 1;
      $('wfNextStageBtn').hidden = false;
      $('wfNextStageBtn').textContent = isLast ? '🎓 全流程已完成' : '进入下一关 →';
      $('wfNextStageBtn').disabled = isLast;
      $('wfResponseInput').disabled = true;
      $('wfSubmitBtn').disabled = true;
    } else {
      // 未达标：来访者继续，给出下一句台词，允许重试
      $('wfResponseInput').disabled = false;
      $('wfResponseInput').value = '';
      $('wfSubmitBtn').disabled = false;
      $('wfSubmitBtn').textContent = '↩️ 再试一次 ➤';
      advanceWfClientLine(stage);
    }
  }

  function advanceWfClientLine(stage) {
    const lines = [stage.clientText].concat(stage.offlineReplies || []);
    state.wf.lineIdx = Math.min(state.wf.lineIdx + 1, lines.length - 1);
    const line = lines[state.wf.lineIdx];
    appendWfTranscript('client', line);
    $('wfClientText').textContent = line;
    if (state.wf.lineIdx >= lines.length - 1) {
      $('wfInputHint').textContent = '台词已讲完，试着结合本关要求技能再回应一次（Ctrl + Enter 发送）';
    }
  }

  function nextWorkflowStage() {
    const w = loadWorkflow();
    const next = w.currentStage + 1;
    if (next >= window.WORKFLOW_STAGES.length) { toast('🎉 恭喜！你已走完整个咨询全流程！'); return; }
    if (next >= w.unlocked) { toast('请先通过前面的关卡'); return; }
    w.currentStage = next;
    saveWorkflow(w);
    renderWorkflow();
  }

  function resetWorkflow() {
    if (!confirm('确定要重置全流程进度吗？所有关卡与最佳分将被清空。')) return;
    localStorage.removeItem(WORKFLOW_KEY);
    renderWorkflow();
    toast('全流程进度已重置');
  }

  function toggleWfKnowledge() {
    const el = $('wfKnowledge');
    const hidden = el.hidden;
    el.hidden = !hidden;
    $('wfToggleKnowledge').textContent = hidden ? '📚 收起知识背景' : '📚 查看本关知识背景';
  }

  // ---------- 设置 ----------
  function openSettings() {
    const c = LLM.getConfig();
    $('setProvider').value = c.provider || 'anthropic';
    $('setBaseUrl').value = c.baseUrl || '';
    $('setModel').value = c.model || '';
    $('setApiKey').value = c.apiKey || '';
    $('setLlmEnabled').checked = !!c.llmEnabled;
    $('baseUrlField').hidden = (c.provider !== 'openai');
    $('testResult').textContent = '';
    $('settingsModal').hidden = false;
  }
  function closeSettings() {
    const c = LLM.getConfig();
    c.provider = $('setProvider').value;
    c.baseUrl = $('setBaseUrl').value.trim();
    c.model = $('setModel').value.trim();
    c.apiKey = $('setApiKey').value.trim();
    c.llmEnabled = $('setLlmEnabled').checked;
    LLM.saveConfig(c);
    $('settingsModal').hidden = true;
    updateLlmBadge();
  }

  async function testLlm() {
    const cfg = {
      provider: $('setProvider').value,
      baseUrl: $('setBaseUrl').value.trim(),
      model: $('setModel').value.trim(),
      apiKey: $('setApiKey').value.trim()
    };
    if (!cfg.apiKey) { $('testResult').textContent = '请先填写 API Key'; $('testResult').className = 'test-result err'; return; }
    $('testResult').textContent = '测试中…';
    $('testResult').className = 'test-result';
    const r = await LLM.test(cfg);
    if (r && r.ok) { $('testResult').textContent = '✅ 连接成功'; $('testResult').className = 'test-result ok'; }
    else { $('testResult').textContent = '❌ ' + (r ? r.error : '失败'); $('testResult').className = 'test-result err'; }
  }

  function resetProgress() {
    if (!confirm('确定要清空全部练习进度与历史记录吗？此操作不可恢复。')) return;
    localStorage.removeItem(PROGRESS_KEY);
    toast('进度已清空');
    renderDashboard();
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    // 标签切换
    document.querySelectorAll('.tab').forEach((t) => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
        $('view-' + t.dataset.view).classList.add('active');
        if (t.dataset.view === 'progress') renderDashboard();
        if (t.dataset.view === 'workflow') renderWorkflow();
        if (t.dataset.view === 'qa') renderQa();
        if (t.dataset.view === 'talk' && window.TALK) window.TALK.refresh();
        if (t.dataset.view === 'diagnosis' && window.DIAGNOSIS) window.DIAGNOSIS.render();
      });
    });

    $('modeSelect').addEventListener('change', (e) => {
      state.mode = e.target.value;
      if (state.currentCase) showCaseIntro(state.currentCase);
      toast('训练重点已切换为：' + modeLabel());
    });

    $('growthMetric').addEventListener('change', () => renderGrowth(loadProgress()));
    window.addEventListener('resize', () => {
      if ($('view-progress').classList.contains('active')) renderGrowth(loadProgress());
    });

    $('askBtn').addEventListener('click', askOffline);
    $('askLlmBtn').addEventListener('click', askOnline);
    $('askInput').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') askOffline();
    });

    $('moreAnswersBtn').addEventListener('click', generateMoreAnswers);

    $('modeFreeBtn').addEventListener('click', () => setResponseMode('free'));
    $('modeChoiceBtn').addEventListener('click', () => setResponseMode('choice'));

    $('submitBtn').addEventListener('click', handleSubmit);
    $('responseInput').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
    });

    $('nextBtn').addEventListener('click', advanceTurn);

    $('settingsBtn').addEventListener('click', openSettings);
    $('closeSettings').addEventListener('click', closeSettings);
    $('settingsModal').addEventListener('click', (e) => { if (e.target === $('settingsModal')) closeSettings(); });
    $('setProvider').addEventListener('change', (e) => { $('baseUrlField').hidden = (e.target.value !== 'openai'); });
    $('testLlmBtn').addEventListener('click', testLlm);
    $('setDark').addEventListener('change', (e) => {
      if (e.target.checked) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      const c = LLM.getConfig(); c.dark = e.target.checked; LLM.saveConfig(c);
    });
    $('resetBtn').addEventListener('click', resetProgress);

    // 全流程咨询
    $('wfSubmitBtn').addEventListener('click', submitWorkflowResponse);
    $('wfResponseInput').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitWorkflowResponse();
    });
    $('wfNextStageBtn').addEventListener('click', nextWorkflowStage);
    $('wfResetBtn').addEventListener('click', resetWorkflow);
    $('wfToggleKnowledge').addEventListener('click', toggleWfKnowledge);

    // 蒸馏问答
    $('qaSearchBtn').addEventListener('click', qaSearch);
    $('qaLlmBtn').addEventListener('click', qaLlmAsk);
    $('qaInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') qaSearch(); });
    $('qaToggleBrowse').addEventListener('click', () => {
      const b = $('qaBrowse');
      b.hidden = !b.hidden;
      $('qaToggleBrowse').textContent = b.hidden ? '展开全部' : '收起全部';
    });
  }

  // 启动
  init();
})();
