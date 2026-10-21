// ===================== 规则评分引擎 =====================
// 基于通用咨询微技巧 + 12 大流派技术关键词，对中文回应做可解释的打分。
// 每个技巧含：中文名、英文名、定义、操作要点、示例、匹配模式。
(function () {
  'use strict';

  const EMO = '难过|伤心|生气|愤怒|焦虑|担心|害怕|恐惧|委屈|孤独|孤单|无助|绝望|沮丧|压力|疲惫|痛苦|失落|内疚|自责|后悔|紧张|烦躁|低落|不安|迷茫|纠结|失望|羞愧|羞耻|崩溃';

  // —— 有效微技巧（16 种）——
  const SKILLS = {
    openQuestion: {
      name: '开放式提问', en: 'Open Question',
      def: '用「什么 / 怎么 / 如何」引导来访者自由展开，而非「是不是」式的是非题。',
      hint: '用「什么 / 怎么 / 如何」引导展开，避免「是不是 / 有没有」。',
      example: '这件事对你来说是什么样的？',
      patterns: [/什么/, /怎么/, /如何/, /哪些/, /哪方面/, /哪一?方面/, /能否/, /(能(不能)?(多|再|具体|详细)?)(说说|谈谈|讲讲)/, /(说|谈|讲)(一?说|一?谈|一?讲)?/, /(展开|详细)(说说|讲讲)?/]
    },
    reflectionFeeling: {
      name: '情感反映', en: 'Reflection of Feeling',
      def: '替来访者说出他此刻的情绪，让他感到被听懂、被接纳。',
      hint: '替来访者说出此刻的情绪，如「听起来你感到很委屈」。',
      example: '听起来你对这件事感到挺委屈的。',
      patterns: [
        new RegExp('(你|听起来|我(听到|感觉|觉得)|似乎|看起来|听得出来)(现在|此刻)?(感到|觉得|很|挺|蛮|有点|非常|特别|是)?' + EMO),
        /听起来你/, /我听到你(说)?你/, /感觉你(很|挺|蛮|有点)?/, /你(现在|此刻)(很|挺)?/, /(你)(内心|心里)(很|挺|蛮|有点|是)/
      ]
    },
    paraphrase: {
      name: '内容重述', en: 'Paraphrase',
      def: '用自己的话复述来访者话语的核心内容，确认理解、让对方感到被倾听。',
      hint: '用自己的话复述，确认理解：「你的意思是……」',
      example: '你是说，他总是否定你的努力，对吗？',
      patterns: [/你是说/, /你的意思是/, /所以(说)?(你的)?意思/, /换句话说/, /也就是说/, /我听到你(说)?/, /让我(确认|理解)一下/, /你是想说/, /我理解(的)?是/, /我(这样|这么)理解(对|对吗)?/]
    },
    empathy: {
      name: '共情', en: 'Empathy',
      def: '表达对来访者处境与感受的理解和接纳，而非评判或急于解决。',
      hint: '表达理解与接纳，而非急于解决问题。',
      example: '换作是我，遇到这些事也会很难受。',
      patterns: [/我能理解/, /我(很)?理解/, /我明白/, /这一定(很|非常|挺|蛮|让)/, /换(作|成)?是我/, /确实(很|不|挺)/, /(很|挺|真|真的)不容易/, /(很|挺)难(熬|受)?/, /辛苦了/, /我能体会/, /我感同身受/, /(我)?能(体会|感受|想象)(到)?你的/, /(很|挺|真)难为你了/]
    },
    encouraging: {
      name: '鼓励与关注', en: 'Encouraging / Attending',
      def: '用简短回应或关注的态度邀请对方继续，营造被倾听的氛围。',
      hint: '用简短回应鼓励继续，如「嗯」「然后呢」「我在听」。',
      example: '嗯，我在听，你接着说。',
      patterns: [/然后呢/, /继续说/, /接着说/, /我在(听|这里)/, /多(说|讲)一点/, /(还有|然后)呢/, /嗯哼/, /你接着说/, /我(认真)?听你说/]
    },
    summarizing: {
      name: '总结', en: 'Summarizing',
      def: '阶段性整合散落的信息，帮来访者看清全貌与主题。',
      hint: '把散落的信息整合起来，帮来访者看清全貌。',
      example: '到目前为止，你提到了工作、家庭和睡眠三个方面。',
      patterns: [/总结/, /总(的)?来说/, /到目前为止/, /(刚刚|刚才)(你|我们)谈到/, /回顾/, /梳理/, /归纳/, /我帮你?理(一)?下/, /简单(来说|总结)/]
    },
    concretizing: {
      name: '具体化', en: 'Concretization',
      def: '把模糊的感受或抽象的描述落到具体情境、时间、细节上。',
      hint: '请来访者把模糊感受落成具体情境、例子或细节。',
      example: '能举一个最近发生的具体例子吗？',
      patterns: [/具体(一点|说说|讲讲)?/, /举个例子/, /比如说/, /能(不能)?具体/, /详细(说说|讲讲)/, /那(次|个|天|件事).{0,4}(具体|什么情况)/]
    },
    positiveRegard: {
      name: '积极关注/肯定', en: 'Positive Regard',
      def: '看见并肯定来访者已有的努力、力量与资源，强化其自我价值感。',
      hint: '肯定来访者已有的努力、力量与资源。',
      example: '你已经独自撑了这么久，这很不容易。',
      patterns: [/你(很|挺|一直|已经|其实|确实).{0,5}(努力|不容易|坚持|勇敢|坚强|有力量|有能力|有勇气|在扛)/, /看得出你(很|在|一直)/, /你(有|具备|拥有).{0,5}(优点|能力|力量|资源|韧性)/, /你(做得|已经做得)(很好|不错|很棒)/, /(这|你已经)(很|是).{0,3}(不容易|了不起)/]
    },
    normalization: {
      name: '正常化', en: 'Normalizing',
      def: '让来访者感到自己的反应是「人之常情」，减轻羞耻与孤立感。',
      hint: '让来访者感到反应是「人之常情」，减少羞耻感。',
      example: '面对突然的失去，任何人都会很难熬。',
      patterns: [/很多人(都|也|会|都会)/, /这(很|非常|挺|也)正常/, /换(谁|作是谁|了谁|成谁)都/, /人之常情/, /(很|非常|挺)?普遍/, /不少人都/, /(这|会这样)(是)?(很)?正常/, /(任何人|谁)(都|也会)/]
    },
    exploringMeaning: {
      name: '探索意义', en: 'Exploring Meaning',
      def: '追问事件或情绪对来访者的个人意义，触及更深层的价值与动机。',
      hint: '追问事情对来访者的意义，如「这对你意味着什么？」',
      example: '这件事对你来说意味着什么？',
      patterns: [/对(你|他|她)?(来说)?意味(着)?(什么)?/, /意味着什么/, /代表(着)?什么/, /(对你)(有|是)(什么|怎样)的?意义/, /(你)(会|是)怎么(理解|看待)?/, /这(让|会)你(想到|想起)/]
    },
    confrontation: {
      name: '温和对质', en: 'Gentle Confrontation',
      def: '温和地指出言行或信念中的不一致，帮助来访者觉察内在矛盾。',
      hint: '温和指出言行中的不一致，帮助来访者觉察。',
      example: '你说想改变，但似乎又在回避每一次机会。',
      patterns: [/我注意到/, /我观察到/, /(但|可是|不过)(同时|我又)(发现|注意到|听到|看到)/, /(似乎|好像)有点(矛盾|不一致)/, /一方面.*另一方面/, /(可是|不过)你(又|也)/, /我(发现|感觉到)(这里|好像|似乎)/]
    },
    immediacy: {
      name: '立即性/关系觉察', en: 'Immediacy',
      def: '把焦点拉回「此时此地」或咨访关系本身，处理当下正在发生的事。',
      hint: '把焦点拉回「此时此地」或咨访关系本身。',
      example: '我注意到你刚才说到这里时，声音突然变轻了。',
      patterns: [/(此刻|现在|当下)(你|我|我们)/, /我们(之间|彼此)/, /(现在|此刻)(你|我)(感觉|想|希望|注意)/, /(我)(注意到)(你)(刚才|现在)/]
    },
    selfDisclosure: {
      name: '自我表露', en: 'Self-Disclosure',
      def: '适时分享自己相关的经历或感受以促进联结（需节制，始终以服务来访者为前提）。',
      hint: '适时分享自己的相关经历以促进联结，但勿喧宾夺主。',
      example: '我也有过类似的被否定的经历，那时我也很沮丧。',
      patterns: [/我也(有过|曾经|遇到|经历|会)/, /我(自己|以前|曾经)(也)?(会|是|遇到|经历)/, /我(也|当年|年轻时)(会|是|遇到|经历)?/]
    },
    reframing: {
      name: '重构/重新框定', en: 'Reframing',
      def: '换个角度重新看待问题，把「缺陷」转化为资源或新的意义。',
      hint: '换个角度重新框定，把「缺陷」转化为资源或新意义。',
      example: '这份焦虑，其实说明你很在乎这件事。',
      patterns: [/换个(角度|说法|思路|方式)/, /(这|那)(也|不妨)(理解|看成|看作|当作)/, /其实(这)?(说明|恰恰说明|意味着)/, /也许(这)?不是.*而是/, /(与其说).*(不如说)/]
    },
    empowerment: {
      name: '赋能', en: 'Empowerment',
      def: '帮助来访者看见并相信自己拥有改变的能力，把决定权交还给他。',
      hint: '让来访者看见并相信自己的能力，把决定权交还给他。',
      example: '你其实已经有能力处理这件事，只是需要一点支持。',
      patterns: [/(你)(其实|已经|完全)*(有能力|有力量|可以|能够)/, /(相信)(你)(自己|能|可以)/, /(决定权|选择权)(交|还给)(你)/, /(你)(自己)?(最)(了解|清楚)(你|自己)/, /(你)(是)(自己)?(的)?(主人|专家)/]
    },
    goalSetting: {
      name: '协作设定目标', en: 'Goal Setting',
      def: '与来访者共同澄清他想要达成的具体目标，为改变确定方向。',
      hint: '与来访者一起澄清他想要的具体目标与方向。',
      example: '如果这次咨询有帮助，你希望最后变成什么样？',
      patterns: [/(一起)?(设定|制定|确定|澄清)(一个)?(小)?(目标|方向)/, /你(希望|想)(在)?(这次|咨询|谈话)(中)?(达成|实现|改变|解决)/, /(今天|这次)你(最)?想(谈|改变|解决|达成)/, /(你)(希望|想)(未来|以后|最后)?(变成|成为)(什么|怎样|什么样)/]
    }
  };

  // —— 新手常见误区（9 种，减分项）——
  const ERRORS = {
    advice: {
      name: '直接给建议', en: 'Giving Advice',
      hint: '「你应该……」会剥夺来访者自我探索的空间，易引发阻抗。',
      patterns: [/你应该/, /你(要|得|必须|一定要|就该)/, /我建议(你)?/, /你最好/, /不妨/, /建议你/, /你就(去|应该|得)/, /试试(去)?(做|跟)/, /(干脆|直接)(去|就)/, /听我的/]
    },
    judgment: {
      name: '评判/责备', en: 'Judging',
      hint: '评判会让来访者更防御，破坏咨访关系。',
      patterns: [/你(错|不对|不应该|不该|太(过|作|敏感|矫情|软弱|消极))/, /(这样|这)是(错|不对)的/, /你(怎么|居然)(能|会|又)/, /(太|很)(自私|消极|矫情|软弱|没用)/, /别(再|老)这样/, /(这|你)不(好|行|对)/, /你(根本|完全)没有/]
    },
    labeling: {
      name: '贴标签', en: 'Labeling',
      hint: '轻易下诊断 / 扣帽子，会把复杂的人简单化、病理化。',
      patterns: [/你(这|就是|是不是)(抑郁|焦虑|强迫|神经|有病|人格|双相|躁郁)/, /你(就是|总是|从来|从来都|天生)/, /你就是(个|一个)?(爱|太|很|总是|从来|天生)/]
    },
    reassurance: {
      name: '过早安慰', en: 'Premature Reassurance',
      hint: '「会好的 / 别担心」会堵住情绪的出口，让来访者觉得不被理解。',
      patterns: [/别担心/, /别难过/, /别害怕/, /别(想|哭|急)/, /想开点/, /看开点/, /(一切)?都会(好|过去|没事)/, /没事(的)?/, /振作(起来)?/, /加油/, /(开心|快乐|积极|坚强)一点/, /往好处想/, /没什么大不了的/]
    },
    closedQuestion: {
      name: '封闭式提问', en: 'Closed Question',
      hint: '只能回答「是 / 否」的提问，会限制来访者的表达。',
      patterns: [/是不是/, /有没有/, /是否/, /对吗/, /对吧/, /对不对/, /是吧/, /行吗/, /可以吗/, /能不能/]
    },
    whyInterrogation: {
      name: '「为什么」式质问', en: 'Why-Questioning',
      hint: '「为什么」虽开放，但常带质问感，易让来访者防御或理智化。',
      patterns: [/为什么(你|会|要|不|还|总|从来|老)/, /(你|他|她)为什么/, /为什么(这|那|这么|那么)/]
    },
    doubleQuestion: {
      name: '连环提问', en: 'Multiple Questions',
      hint: '一次抛多个问题会让来访者不知所措，一次聚焦一个问题。',
      patterns: [/[？?].*[？?]/, /(为什么|怎么|什么|吗|呢)[^。！\n]{1,24}(为什么|怎么|什么|吗|呢)/]
    },
    preaching: {
      name: '说教', en: 'Preaching',
      hint: '讲大道理会让来访者感到被教育而非被理解。',
      patterns: [/做人(要|应该)/, /(明白|懂得|学会)(这个|那些)?(道理|是非)/, /(这是)(做人)?(的)?(基本)?(道理|常识|底线)/, /(人|做人)(就)?(应该|要)(感恩|乐观|坚强|知足|宽容)/]
    },
    assuming: {
      name: '主观臆断/读心', en: 'Mind-Reading',
      hint: '替来访者下结论会剥夺他自己表达的空间，用提问代替断言。',
      patterns: [/(你)(肯定|一定|八成|准是|绝对)/, /(我)(猜|估计)(你)/, /(你)(心里)(其实|一定|肯定)/]
    }
  };

  // —— 流派技术（用于核心/全书模式的技术识别）——
  const THEORY_TECHNIQUES = {
    personCentered: { school: '以人为中心', ch: '第7章', patterns: [/(无条件)?积极关注/, /接纳(他|你|自己)?/, /真诚(一致)?/, /(情绪|情感)反映/, /(我)(相信)(你|人)(有|能)(能力|力量)/] },
    cbt: { school: '认知行为', ch: '第10章', patterns: [/自动思维/, /认知(重构|歪曲|调整)?/, /(你脑子里|那一刻|当时)(冒|闪过|想到)(了)?(什么|怎样)/, /苏格拉底/, /(有没有|还有没有)(别的|其他)(可能|解释|想法)/, /证据(是什么|有哪些)?/, /家庭作业/, /行为实验/, /(最坏|最好|现实)(的)?(情况|结果)/, /(你在)(想什么|怎么想)/, /(支持|反对)(这个想法)?(的)?证据/] },
    rebt: { school: '理性情绪行为', ch: '第10章', patterns: [/非理性信念/, /ABC/, /(应该|必须|一定要|绝对)(的)?(想法|念头|要求)/, /辩驳/, /(你的)(应该|必须|绝对)/, /(这个)(必须|应该)(是)(这样|合理)/] },
    behavior: { school: '行为疗法', ch: '第9章', patterns: [/系统脱敏/, /暴露/, /放松(训练)?/, /(深呼吸|腹式呼吸)/, /强化/, /(行为)?(记录|日记|监测)/, /(逐步|循序渐进)(地)?(面对|练习)/, /(暴露|脱敏)(疗法)?/, /(奖励|强化)(自己)?/] },
    psychodynamic: { school: '精神分析', ch: '第4章', patterns: [/早年|童年|小时候/, /防御机制/, /移情/, /(无|潜)意识/, /自由联想/, /(早年|童年)(经历|经验|记忆)/, /(压抑|投射|否认|合理化)(的)?(防御)?/] },
    adlerian: { school: '阿德勒', ch: '第5章', patterns: [/早期记忆/, /生活(风格|方式|型态)/, /社会兴趣/, /出生(顺序|排行)/, /(自卑|超越)(感)?/, /(目的|目标)(是什么|导向)/, /(归属感|价值感)(的)?(需要|追求)/] },
    existential: { school: '存在主义', ch: '第6章', patterns: [/意义/, /(死亡|死亡)(焦虑|议题)?/, /自由(与)?责任/, /(存在|生存)(的)?(焦虑|议题|意义|孤独)/, /(人生的)?(意义|目的)/, /孤独/, /(自由)(的)?(选择|责任)/, /(死亡)(焦虑|恐惧|议题)/] },
    gestalt: { school: '格式塔', ch: '第8章', patterns: [/空椅/, /(想象|假如)(他|她)(就)?(坐|在)(这里|对面)/, /(此时此地|此刻)(你|注意)/, /觉察/, /未完成(事件|的事)/, /(你注意到)(你)?(身体|呼吸)/, /(这里|此刻)(你)(感受|体验|觉察)/, /(身体)(的)?(感受|反应|语言)/] },
    reality: { school: '现实/选择理论', ch: '第11章', patterns: [/你(真正)?(想要|需要)(什么)/, /WDEP/, /(质量世界|理想世界)/, /(你(现在)?)(打算|计划|选择)(怎么|如何|什么)/, /(你的)(行为|选择)(是)?(什么|怎样)/, /(为你的)(行为|选择)(负责|负责任)/, /(你现在)(在做什么|怎么做)/, /(这)(对)(你)(有帮助吗|有效吗)/] },
    feminist: { school: '女权主义', ch: '第12章', patterns: [/性别(角色|期待|刻板)/, /(社会|文化)(对)?(女性|男性)(的)?(期待|要求|规训)/, /(权力|赋权|增能)/, /(你作为)(女性|男性)/, /(身体|外貌)(的)?(规训|标准)/, /(性别)(不平等|歧视)/] },
    solutionFocused: { school: '焦点解决', ch: '第13章', patterns: [/奇迹(问句|问题)/, /(如果|假如)(一觉醒来|有一天)(问题|困扰)?(解决|消失)/, /(例外|什么时候)(问题)?(没有|不)(发生|出现)/, /(1到10|一到十|十分)(分|评分|量表)/, /(什么)(时候|情况下)(问题|困扰)(会)?(少|没有|减轻)/, /(什么)(让你)(还)(撑|坚持)(到)(现在)/, /(你)(希望)(未来|以后)(变成)(什么样)/] },
    narrative: { school: '叙事', ch: '第13章', patterns: [/外化/, /(这个)?「?问题」?(如何|怎么)(影响|控制)/, /(给)(问题|困扰)(取|起)(个)?名字/, /(独特|例外)(结果|故事|时刻)/, /(重新|改写)(书写|讲述|故事)/, /(你)(希望)(自己的)?(故事|人生)/, /(你)(给)(它)(起)(个)?(名字|称呼)/] },
    familySystems: { school: '家庭系统', ch: '第14章', patterns: [/家庭(关系|互动|系统|结构)/, /(你们)(家|家庭|一家人)/, /边界/, /子系统/, /(家谱图|家庭图)/, /(循环)(提问|因果)/, /(三角化|三角关系)/, /(你在)(家庭|家里)(的角色|位置)/, /(代际)(传递|传承)/] }
  };

  function matchAny(text, patterns) {
    for (let i = 0; i < patterns.length; i++) {
      patterns[i].lastIndex = 0;
      if (patterns[i].test(text)) return true;
    }
    return false;
  }

  // 返回命中的原文片段（用于引用用户原话，给出针对性建议）
  function matchText(text, patterns) {
    for (let i = 0; i < patterns.length; i++) {
      patterns[i].lastIndex = 0;
      const m = patterns[i].exec(text);
      if (m) return m[0] || '';
    }
    return '';
  }

  // 检测：返回 { found[], errors[], techniques[], tips[] }
  function detect(text) {
    const found = [];
    const errors = [];
    const techniques = [];
    const tips = [];

    for (const id in SKILLS) {
      if (matchAny(text, SKILLS[id].patterns)) {
        found.push({ id, name: SKILLS[id].name, hint: SKILLS[id].hint });
      }
    }
    for (const id in ERRORS) {
      const sample = matchText(text, ERRORS[id].patterns);
      if (sample) {
        errors.push({ id, name: ERRORS[id].name, hint: ERRORS[id].hint, sample });
      }
    }
    for (const id in THEORY_TECHNIQUES) {
      if (matchAny(text, THEORY_TECHNIQUES[id].patterns)) {
        techniques.push({ id, school: THEORY_TECHNIQUES[id].school, ch: THEORY_TECHNIQUES[id].ch });
      }
    }
    if (/为什么/.test(text)) {
      tips.push('「为什么」有时像质问，可换用「是什么让你……」「那对你的意义是……」更柔和。');
    }
    if (text.trim().length < 6) {
      errors.push({ id: 'tooShort', name: '回应过短', hint: '请给出更完整的回应，把共情和引导展开。', sample: String(text.trim().length) });
    }
    return { found, errors, techniques, tips };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // 核心三大流派（以人为中心 / 认知行为 / 精神动力与阿德勒）
  const CORE_IDS = ['personCentered', 'cbt', 'rebt', 'psychodynamic', 'adlerian'];

  // 打分入口
  // mode: 'micro' | 'core' | 'full'
  function scoreResponse(text, turn, mode) {
    const d = detect(text);
    if (mode === 'micro') {
      d.techniques = []; // 微技巧模式不计流派技术分
    } else if (mode === 'core') {
      d.techniques = d.techniques.filter((t) => CORE_IDS.indexOf(t.id) !== -1);
    }
    let score = 52; // 基线

    d.found.forEach((s) => { score += 8; });
    d.errors.forEach((e) => {
      if (e.id === 'tooShort') score -= 25;
      else score -= 11;
    });
    d.techniques.forEach((t) => { score += 4; });

    // 命中本轮目标技能 → 加分
    if (turn && turn.targets) {
      const targetIds = turn.targets || [];
      const hitCount = d.found.filter((s) => targetIds.indexOf(s.id) !== -1).length;
      score += hitCount * 10;
    }

    // 回应过短不给及格
    if (text.trim().length < 6) score = Math.min(score, 40);

    // 技巧多且未犯错，略作封顶修正，避免虚高
    score = clamp(Math.round(score), 0, 100);

    const level =
      score >= 85 ? '优秀' : score >= 70 ? '良好' : score >= 55 ? '合格' : '需改进';

    // 生成下一步建议
    const suggestion = buildSuggestion(d, turn, mode);

    // 未命中的目标技巧（作为"待改进"的缺口）
    const gaps = [];
    if (turn && turn.targets) {
      const used = d.found.map((s) => s.id);
      turn.targets.forEach((tid) => {
        if (used.indexOf(tid) === -1 && SKILLS[tid]) {
          gaps.push({ id: tid, name: SKILLS[tid].name, hint: SKILLS[tid].hint });
        }
      });
    }

    return {
      score,
      level,
      found: d.found,
      errors: d.errors,
      gaps,
      techniques: d.techniques,
      tips: d.tips,
      suggestion
    };
  }

  function buildSuggestion(d, turn, mode) {
    const lines = [];
    if (d.found.length) {
      lines.push('✅ 你做得很好的地方：' + d.found.map((s) => s.name).join('、') + '。');
    }
    if (d.errors.length) {
      lines.push('⚠️ 需要留意：' + d.errors.map((e) => e.name).join('、') + '。');
    }
    // 推荐一个尚未用到的目标技巧
    if (turn && turn.targets) {
      const used = d.found.map((s) => s.id);
      const missing = turn.targets.filter((t) => used.indexOf(t) === -1);
      if (missing.length) {
        const sk = SKILLS[missing[0]];
        lines.push('🎯 下次可尝试：' + (sk ? sk.name + '——' + sk.hint : missing[0]) + '。');
      }
    }
    if (!lines.length) {
      lines.push('试试先共情来访者的情绪，再用开放式提问引导他多说一点。');
    }
    return lines;
  }

  // 针对每个误区，结合用户原话给出具体的改写建议（而非笼统提示）
  const ERROR_FIX = {
    advice: (s) => '你用了「' + s + '」，属于直接给建议。先别急着出主意，把对方的难处接住，比如：「听起来你现在很为难，你希望事情能变成什么样？」',
    judgment: (s) => '「' + s + '」带有评判，容易让对方更防御。改成陈述你观察或听到的，比如：「我听到你对自己挺严厉的。」',
    labeling: (s) => '「' + s + '」在给对方贴标签、下结论。改成描述具体表现，比如：「你最近常常一个人待着，也不太想出门。」',
    reassurance: (s) => '「' + s + '」是过早安慰，情绪还没被接住。先反映情绪，比如：「这件事让你很担心，对吗？」',
    closedQuestion: (s) => '「' + s + '」是封闭式提问，只能换来「是 / 否」。改成开放式，比如：「这件事对你来说是什么样的？」',
    whyInterrogation: (s) => '「' + s + '」带质问感，容易让对方想辩解。换成温和一点的问法，比如：「是什么让你决定这样做的？」',
    doubleQuestion: (s) => '你一句话里连问了几个问题「' + s + '」，对方会不知道先答哪个。一次只问一个，先问最想了解的那个。',
    preaching: (s) => '「' + s + '」在讲道理，容易让对方觉得被教育。改成先理解他的感受，比如：「要接纳这些确实不容易。」',
    assuming: (s) => '「' + s + '」在替对方下结论（读心）。改成提问，把表达权还给他，比如：「你当时是什么感受？」',
    tooShort: (s) => '你的回应只有 ' + s + ' 个字，还没展开。试着先共情再提问，比如：「听起来这件事让你挺委屈的，能多说一点发生了什么吗？」'
  };

  // 生成「待改进」的具体条目：引用原话 + 可操作改写
  function specificImprovements(result) {
    const items = [];
    (result.errors || []).forEach((e) => {
      let hint;
      if (e.sample && ERROR_FIX[e.id]) hint = ERROR_FIX[e.id](e.sample); // 自由输入：结合原话
      else if (e.hint) hint = e.hint;                                   // 4 选 1：案例已给具体反馈
      else hint = '';
      items.push({ name: e.name, hint: hint, kind: 'bad' });
    });
    (result.gaps || []).forEach((g) => {
      const sk = SKILLS[g.id];
      items.push({
        name: '未命中目标 · ' + g.name,
        hint: '本轮目标是「' + g.name + '」，你的回应里还没用上。可以补一句，比如：「' + (sk ? sk.example : '') + '」',
        kind: 'warn'
      });
    });
    return items;
  }

  window.Scoring = {
    SKILLS,
    ERRORS,
    THEORY_TECHNIQUES,
    detect,
    scoreResponse,
    specificImprovements,
    clamp
  };
})();
