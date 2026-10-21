// ===================== 增强内容合并器 =====================
// 把「扩展轮次」「多版本参考答案」「AI 案例」合并进 cases.js 的 CASES。
// 采用「追加式」而非改写 cases.js，最大限度避免影响原有已稳定的代码与内容。
// 依赖（由 index.html 依序加载）：
//   cases.js  →  extra-turns-1.js / extra-turns-2.js  →  alt-answers.js  →  ai-cases.js  →  omnibus.js
(function () {
  'use strict';

  const EXTRA_TURNS = window.EXTRA_TURNS || {};
  const ALT_ANSWERS = window.ALT_ANSWERS || {};
  const AI_CASES = window.AI_CASES || [];

  // 1) 追加每个案例的扩展轮次（把 3~4 轮补到 5~6 轮）
  window.CASES.forEach((c) => {
    if (EXTRA_TURNS[c.id] && EXTRA_TURNS[c.id].length) {
      c.turns = c.turns.concat(EXTRA_TURNS[c.id]);
    }
  });

  // 2) 给「原有轮次」补上多版本参考答案（新增轮次已在 extra-turns 内联自带 altAnswers）
  window.CASES.forEach((c) => {
    const alts = ALT_ANSWERS[c.id];
    if (!alts) return;
    c.turns.forEach((t, i) => {
      if (alts[i] && alts[i].length) t.altAnswers = alts[i];
    });
  });

  // 3) AI 案例置顶（放在案例列表最前，便于发现）
  if (AI_CASES.length) {
    window.CASES = AI_CASES.concat(window.CASES);
  }

  // 4) 覆盖 getCase，让它从「合并后的」window.CASES 里查（否则查不到 AI 案例）
  window.getCase = function (id) {
    return window.CASES.find((c) => c.id === id) || null;
  };
})();
