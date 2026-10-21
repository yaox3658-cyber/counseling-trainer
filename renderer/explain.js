// ===================== 离线解答库 =====================
// 针对「参考答案为什么这样写」的疑问，做可解释的规则拆解：
// 用评分引擎识别参考答案里的微技巧，再结合本轮的设计说明与教材依据，生成结构化解答。
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // 每个微技巧「为什么有效」的原理
  const WHY = {
    empathy: '共情是建立治疗联盟的基石——来访者只有先感到被理解、被接纳，才愿意敞开心扉触碰更深的内容。',
    reflectionFeeling: '把来访者此刻的情绪说出来，能让他感到「你真正懂我」；情绪被准确命名后往往会自然松动，也为后续探索做了铺垫。',
    paraphrase: '用自己的话复述，既确认你理解无误，也让来访者感到被认真倾听，同时帮他把散乱的想法理清。',
    openQuestion: '开放式提问把表达的主动权交还给来访者，让他按自己的节奏展开，信息量更大、也更可能触及真实困扰；而「是不是」式的是非题会限制表达。',
    encouraging: '简短的关注（如「嗯」「然后呢」）传递出「我在认真听」，维持对话的流动，让来访者愿意继续说下去。',
    summarizing: '把散落的信息整合起来，帮来访者看清全貌与主题，也给双方一个「我们已对齐」的锚点。',
    concretizing: '把模糊的感受落到具体的人、事、时间、细节，才能找到真正可以工作的「靶点」，避免空泛。',
    positiveRegard: '肯定来访者已有的努力与资源，能强化他的自我价值感，让他更有底气面对问题，而不是陷入自我否定。',
    normalization: '把「我以为只有我这样」的痛苦还原成「人之常情」，能大幅减轻羞耻与孤立感，让他不再独自硬扛。',
    exploringMeaning: '追问事情对来访者「意味着什么」，能把话题从表面事件引向他更深的价值、身份与动机。',
    confrontation: '温和地指出言行或信念中的不一致，能帮来访者看见自己没意识到的矛盾，这是推动觉察的重要一步。',
    immediacy: '把焦点拉回「此时此地」或咨访关系本身，能处理当下正在发生、容易被回避的议题。',
    selfDisclosure: '适时分享自己的相关经历，能拉近距离、示范「脆弱是被允许的」，但必须节制、始终以服务来访者为前提。',
    reframing: '换个角度重新框定，能把「缺陷」转化为资源或新意义，给来访者一个全新的视角。',
    empowerment: '让来访者看见并相信自己的力量，把决定权交还给他，而不是让他依赖咨询师。',
    goalSetting: '与来访者共同澄清他想要达成的目标，为「改变」确定方向，让咨询从「倾诉」走向「行动」。'
  };

  // 识别问题主题，给出更有针对性的直接回答
  function topic(q) {
    if (/共情|同理/.test(q)) return 'empathy';
    if (/开放|提问|为什么(要|会)?问|怎么问/.test(q)) return 'open';
    if (/建议|支招|告诉|直接|为什么不(直接)?(说|给|劝)|开导/.test(q)) return 'noAdvice';
    if (/什么(技巧|技术|方法)|用了什么|怎么(做|回应)|哪(些)?(技巧|方法)/.test(q)) return 'skills';
    if (/什么(流派|理论|取向|学派)|哪个(流派|理论|学派)|依据|出处|教材|哪一章/.test(q)) return 'theory';
    return 'general';
  }

  const DIRECT = {
    empathy: '先共情不是套路，而是有实打实的依据：来访者带着痛苦而来，若一上来就被「分析」或「支招」，他会觉得自己没被看见，反而更防御。先把情绪接住，建立「你懂我」的安全感，后面的探索和引导才有地基——这也是 Corey 全书反复强调的：治疗关系先于技术。',
    open: '开放式提问（什么 / 怎么 / 如何）把话筒交还给来访者，让他自由展开；相比之下「是不是」「有没有」这类封闭问题只能换来一个字，容易把对话堵死。参考答案正是用开放式提问，把来访者的困扰引向更具体、更深入的内容。',
    noAdvice: '新手最容易犯的错就是急着给建议。直接给建议等于剥夺了来访者自己探索、自己做决定的空间，还会让他觉得「你不懂我的处境」。参考答案刻意不给建议，而是先理解、再引导他自己找到方向——咨询的目标是「授人以渔」，而不是替他做主。',
    skills: '参考答案的措辞是经过设计的，里面藏着几个标准的微技巧。下面逐一拆解它用了什么、为什么有效。',
    theory: '参考答案背后有明确的流派取向，下面结合本轮的设计说明和教材章节来解释它的理论依据。',
    general: '参考答案的每一句话几乎都对应着一个咨询原则，而不是随口说的。下面把它拆开给你看。'
  };

  function explain(turn, question) {
    const q = (question || '').trim();
    const t = topic(q);

    // 用评分引擎识别参考答案里体现的技巧
    const found = turn.modelAnswer ? (Scoring.detect(turn.modelAnswer).found || []) : [];
    let skills = found;
    // 若识别不出，退回到本轮「目标技巧」作为解释对象
    if (!skills.length && turn.targets && turn.targets.length) {
      skills = turn.targets.map((id) => Scoring.SKILLS[id]).filter(Boolean).map((s) => ({ id: '', name: s.name, hint: s.hint }));
    }

    let html = '<div class="ask-source">📚 离线解答库</div>';

    // 1. 直接回答
    html += '<p class="ask-direct">' + esc(DIRECT[t] || DIRECT.general) + '</p>';

    // 2. 技巧拆解
    html += '<h4 class="ask-h">🔍 参考答案的拆解</h4>';
    if (skills.length) {
      html += '<ul class="ask-list">';
      skills.forEach((s) => {
        const skill = Scoring.SKILLS[s.id];
        const why = (skill && WHY[s.id]) || WHY[s.id] || '';
        html += '<li><b>' + esc(s.name) + '</b>' +
          (why ? ' —— ' + esc(why) : '') + '</li>';
      });
      html += '</ul>';
    } else {
      html += '<p class="ask-muted">本轮参考答案侧重共情与陪伴，未使用明显的结构化技巧，重点在于「接住情绪、建立关系」。</p>';
    }

    // 3. 组织逻辑
    html += '<h4 class="ask-h">🧩 为什么要这样组织</h4>';
    html += '<p class="ask-para">' + esc(
      '一条好的回应通常遵循「先接情绪 → 再展开 → 最后聚焦」的顺序：' +
      '先用共情 / 情感反映让来访者感到被理解，再用开放式提问或具体化把话题引向深处，' +
      '必要时以温和对质或目标澄清推动觉察与改变。参考答案没有跳过情绪直接解决问题，这正是它「听起来专业」的原因。'
    ) + '</p>';

    // 4. 教材依据
    html += '<h4 class="ask-h">📖 教材依据</h4>';
    if (turn.bookRef) html += '<p class="ask-para"><b>引用：</b>' + esc(turn.bookRef) + '</p>';
    if (turn.techniques && turn.techniques.length) html += '<p class="ask-para"><b>本轮技术：</b>' + esc(turn.techniques.join('、')) + '</p>';
    if (turn.modelNote) html += '<p class="ask-para ask-note">' + esc(turn.modelNote) + '</p>';

    // 5. 追问提示
    html += '<p class="ask-muted">💡 你还可以问：为什么不用封闭式提问？为什么不直接给建议？这里用了什么流派？</p>';

    return html;
  }

  window.Explainer = { explain, topic };
})();
