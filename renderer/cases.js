// ===================== 案例库 + 流派知识库 =====================
// 案例改编自 Corey《心理咨询与治疗的理论及实践》第10版中的典型临床情境，
// 均已脱敏与匿名化，人物为虚构，仅用于教育训练。
(function () {
  'use strict';

  // —— 12 大流派速览（用于「学习资料」）——
  // —— 基础篇 + 整合篇（第 1~3 章、第 15 章）——
  const FOUNDATIONS = [
    {
      ch: '第1章', name: '引言与概览',
      core: '各流派有一个共同目标：帮助来访者更好地认识自己、做出选择、承担选择的责任，并促成改变。流派之间不是「谁对谁错」，而是看待人性与改变的十几种不同视角。',
      keyTerms: '个案概念化、治疗目标、折衷与整合、共同因素、改变机制',
      points: '研究反复表明：有效咨询的关键并非某个单一技术，而是「人」——咨询师的人格、真诚与关系质量，比任何具体技术更能预测疗效。'
    },
    {
      ch: '第2章', name: '咨询师：个人与专业',
      core: '咨询师本人是最重要的「治疗工具」。自我觉察、心理成熟、价值观澄清与持续的个人成长，是成为有效咨询师的前提。',
      keyTerms: '自我觉察、价值观、反移情、个人咨询、督导、自我照顾',
      points: '持续接受个人咨询与督导；觉察并处理自己的反移情，避免把个人议题带入咨询；对职业耗竭做好自我照顾，保持助人的活力。'
    },
    {
      ch: '第3章', name: '咨询实践中的伦理议题',
      core: '伦理守则的六大基本原则：自主、无害、行善、公正、忠诚、诚信。核心议题包括知情同意、保密与例外、多重关系、能力边界、价值观冲突、记录与法律。',
      keyTerms: '知情同意、保密例外、多重关系、能力边界、价值观冲突、转介',
      points: '保密例外：当来访者有自杀或伤人风险、涉及虐待（尤其儿童与老人）、或法律明确要求时，必须打破保密；来访者的福祉永远第一。'
    },
    {
      ch: '第15章', name: '整合视角',
      core: '不盲从单一流派，而是基于个案概念化，整合多个流派的理念与技术，形成带有个人风格的整合取向。',
      keyTerms: '技术折衷、理论整合、共同因素（关系、希望、策略）、整合三角',
      points: '整合的三条路径：技术折衷（挑技术）、理论整合（融理论）、共同因素（抓核心）。成熟的整合建立在充分理解各流派之后，而非随意拼凑。'
    }
  ];

  const THEORIES = [
    {
      name: '精神分析', ch: '第4章', founder: '弗洛伊德',
      humanNature: '人被无意识的本能驱力（生/死本能）与童年经验塑造；人格由本我、自我、超我构成；早期经验对成年有决定性影响。',
      core: '无意识、本能驱力、防御机制；童年经验塑造人格，症状是无意识冲突的表达。',
      goals: '把无意识冲突带到意识层面，重建人格、强化自我，处理被压抑的早年创伤。',
      relation: '治疗师保持节制与「空白屏幕」的匿名，通过移情与阻抗展开工作。',
      tech: '自由联想、释梦、移情分析、阻抗解释。',
      keyTerms: '无意识、本我/自我/超我、防御机制、移情、阻抗、童年经验、客体关系。',
      contributions: '第一个系统的心理治疗理论，深刻塑造了对人格发展、防御机制与无意识的理解。',
      limitations: '疗程长、费用高；过度强调童年可能忽略当下；对危机/行为问题见效慢，需长期训练背景。'
    },
    {
      name: '阿德勒疗法', ch: '第5章', founder: '阿德勒',
      humanNature: '人是社会性、有目标导向的整体存在；行为受「追求卓越、克服自卑」驱动，并由生活风格组织起来。',
      core: '人是社会性存在；社会兴趣、自卑与超越、生活风格、目的论（行为指向目标）。',
      goals: '增强社会兴趣，纠正错误的生活目标，发展归属感与价值感。',
      relation: '合作、平等的「师生式」关系，治疗师是示范者与鼓励者。',
      tech: '早期记忆探索、生活风格评估、鼓励、「好像」技术。',
      keyTerms: '社会兴趣、自卑感与追求卓越、生活风格、出生顺序、目的论、虚构目标。',
      contributions: '先驱性地强调社会因素与目标导向，深刻影响了 CBT、REBT、现实疗法、家庭系统等后起流派。',
      limitations: '概念有时不够严谨、难以操作化；更重教育与鼓励，深度探索受限。'
    },
    {
      name: '存在主义', ch: '第6章', founder: '弗兰克尔、亚隆等',
      humanNature: '人拥有自由与责任，必须面对死亡、孤独、无意义等存在议题；意义不是被给予的，而是自我创造的。',
      core: '自由、责任、死亡、孤独、无意义；焦虑是成长的契机而非病态。',
      goals: '帮助来访者认识自己的自由与责任，活出真实、有意义的人生。',
      relation: '真诚的「我-你」关系，治疗师是来访者旅途中的同伴而非指导者。',
      tech: '现象学对话、探索意义、直面存在议题、建立真诚的关系。',
      keyTerms: '存在焦虑、自由与责任、死亡、孤独、无意义、本真性、此在。',
      contributions: '提供理解人生困境与意义的哲学框架，弥补了技术主义对「人为何而活」的忽视。',
      limitations: '缺乏具体可操作的技术与评估框架；对急于缓解症状或文化上倾向实用的来访者可能不适配。'
    },
    {
      name: '以人为中心', ch: '第7章', founder: '罗杰斯',
      humanNature: '人性本善，人有自我实现的倾向；心理困扰源于「价值条件」对真实自我的压抑与扭曲。',
      core: '人本有自我实现的倾向；治疗的核心是真诚一致、无条件积极关注、共情。',
      goals: '营造安全的氛围，让来访者自我觉察、自我接纳，恢复自我实现的动力。',
      relation: '疗效的核心在关系本身——真诚一致、无条件积极关注、准确共情。',
      tech: '积极倾听、情感反映、接纳与陪伴，相信来访者自身的力量。',
      keyTerms: '真诚一致、无条件积极关注、共情、自我实现、价值条件、现象场。',
      contributions: '确立「关系是疗效核心」这一基石，其态度已成为几乎所有流派的基础。',
      limitations: '几乎无结构化技术，全靠治疗师个人品质；对需要具体指导或严重病理者可能不够有力。'
    },
    {
      name: '格式塔', ch: '第8章', founder: '皮尔斯',
      humanNature: '人是追求完整与整合的整体，通过「此时此地」的觉察获得成长。',
      core: '强调「此时此地」、整体性、觉察、未完成事件；人通过觉察获得成长。',
      goals: '增强此时此地的觉察，整合被否认的自我部分，完成未完成事件。',
      relation: '直接、真诚、有挑战性的关系，治疗师设计实验来促进觉察。',
      tech: '空椅对话、觉察练习、角色扮演、关注身体语言。',
      keyTerms: '此时此地、觉察、未完成事件、空椅、场理论、接触边界、我-你关系。',
      contributions: '强调体验与觉察，贡献了空椅等富有创造力的技术，把身体语言纳入咨询。',
      limitations: '重体验，对认知/行为改变的结构化不足；实验性技术对某些来访者可能太具冲击力。'
    },
    {
      name: '行为疗法', ch: '第9章', founder: '斯金纳、班杜拉等',
      humanNature: '行为是习得的，也能通过学习改变；关注可观察、可测量的行为。',
      core: '行为是习得的，也能通过学习改变；关注可观察、可测量的行为。',
      goals: '消除适应不良行为，习得新的适应性行为，达成具体、可测量的目标。',
      relation: '合作、指导性的关系，治疗师像教练/老师，与来访者共同制定计划。',
      tech: '系统脱敏、暴露、强化、行为契约、放松训练、自我管理。',
      keyTerms: '操作性条件反射、强化、系统脱敏、暴露、行为塑造、自我监控、社会学习。',
      contributions: '建立在扎实的实证研究之上，疗效可测量，为众多问题提供高效、聚焦的干预。',
      limitations: '可能忽视情感、意义与关系的作用；若只处理表面行为，深层议题可能复发。'
    },
    {
      name: '认知行为 CBT', ch: '第10章', founder: '贝克',
      humanNature: '情绪与行为由「自动思维」「认知歪曲」「核心信念」驱动；改变认知可改变感受与行为。',
      core: '情绪和行为由「自动思维」「认知歪曲」「核心信念」驱动，改变认知可改变感受。',
      goals: '识别并矫正歪曲的认知，发展更现实、灵活的思维方式，缓解症状。',
      relation: '协作经验主义——治疗师与来访者共同检验思维的现实性，来访者是自己的「研究者」。',
      tech: '识别/检验自动思维、苏格拉底式提问、认知重构、家庭作业、行为实验。',
      keyTerms: '自动思维、认知歪曲（灾难化/以偏概全等）、核心信念、苏格拉底式提问、行为实验、结构化议程。',
      contributions: '拥有大量实证支持的结构化疗法，广泛用于抑郁、焦虑等，可操作性强。',
      limitations: '结构化强，但对深层情感体验、复杂创伤或意义议题覆盖有限；需要来访者愿意完成作业。'
    },
    {
      name: '理性情绪 REBT', ch: '第10章', founder: '埃利斯',
      humanNature: '人既理性又不理性；情绪困扰主要源于非理性的「必须、应该、绝对」信念。',
      core: 'ABC 模型：困扰（C）来自对事件（A）的非理性信念（B），而非事件本身。',
      goals: '帮助来访者辩驳非理性信念，培养无条件的自我接纳。',
      relation: '主动、直接、教导性的关系，治疗师积极挑战来访者的非理性信念。',
      tech: '辩驳非理性信念（必须/应该/绝对）、理性情绪想象。',
      keyTerms: 'ABC 模型、非理性信念、灾难化思维、辩驳（D）、理性信念、无条件自我接纳。',
      contributions: '强调认知在情绪困扰中的核心作用，是 CBT 的先驱，风格清晰有力。',
      limitations: '风格直接、说教感强，可能被体验为严厉；对高度情绪化或关系取向的来访者需调整力度。'
    },
    {
      name: '现实/选择理论', ch: '第11章', founder: '格拉瑟',
      humanNature: '人有五种基本需要（生存、爱与归属、权力、自由、乐趣）；我们只能控制自己的行为。',
      core: '人有五种基本需要；我们只能控制自己的行为，选择理论强调为自己的选择负责。',
      goals: '帮助来访者满足基本需要、为自己的选择负责，做出更有效的选择。',
      relation: '温暖、真诚、不评判但坚定的关系，治疗师是「不放弃」的伙伴。',
      tech: 'WDEP（需求、方向、评估、计划）、探索「质量世界」。',
      keyTerms: '五种基本需要、质量世界、总行为、选择理论、WDEP、有效/无效行为。',
      contributions: '简洁实用，强调责任与行动，适用于学校、机构、教育等多元场景。',
      limitations: '回避过去与无意识，可能让需要被深度理解的来访者感到被否定；对严重精神障碍处理有限。'
    },
    {
      name: '女权主义疗法', ch: '第12章', founder: '（多源）',
      humanNature: '人生活在社会文化的权力结构之中；性别社会化与压迫深刻影响心理健康。',
      core: '关注性别社会化、权力与压迫，「个人即政治」；症状常是压迫环境的内化。',
      goals: '赋权、提高来访者对社会性别与权力的觉察，促进平等与改变。',
      relation: '平等、透明、非权威的关系，治疗师同时也是倡导者。',
      tech: '赋权、性别角色分析、权力分析、促进社会行动。',
      keyTerms: '个人即政治、赋权、性别社会化、权力分析、多重压迫、文化敏感。',
      contributions: '把社会文化维度引入咨询，强调多元化与赋权，具有社会批判与解放意义。',
      limitations: '过度聚焦社会/政治维度可能忽略个体内心议题；部分来访者未必认同性别框架。'
    },
    {
      name: '后现代（焦点/叙事）', ch: '第13章', founder: '德·沙泽、怀特',
      humanNature: '现实由语言与社会建构；人是自己生活的专家，拥有资源与优势。',
      core: '语言建构现实；聚焦解决与优势（焦点解决），或外化问题、改写故事（叙事）。',
      goals: '聚焦解决与优势（焦点），或外化问题、改写偏好故事（叙事）。',
      relation: '协作、非专家化的关系，来访者是专家，治疗师是好奇的对话伙伴。',
      tech: '奇迹问句、例外、量表；外化对话、改写故事、独特结果。',
      keyTerms: '奇迹问句、例外时刻、外化、独特结果、问题故事与偏好故事、来访者即专家。',
      contributions: '短程、积极、尊重来访者视角，对资源取向与优势取向的整合影响深远。',
      limitations: '聚焦解决可能过早跳过情绪与痛苦；叙事对话较为抽象，需较高语言与反思能力。'
    },
    {
      name: '家庭系统', ch: '第14章', founder: '鲍恩、米纽庆等',
      humanNature: '个体是其家庭系统的产物；症状常是系统失衡、边界不清的信号。',
      core: '从系统看个体：循环因果、边界、子系统；症状常是系统失衡的信号。',
      goals: '改善家庭系统的互动模式与边界，缓解症状，增强系统整体功能。',
      relation: '治疗师是系统的「扰动者」与中立观察者，介入家庭互动。',
      tech: '家谱图、循环提问、重构、边界澄清。',
      keyTerms: '循环因果、边界、子系统、三角化、自我分化、家谱图、症状的系统功能。',
      contributions: '从系统视角理解个体，提供关系层面的干预思路，突破「个人病理」的局限。',
      limitations: '需要家庭成员参与，个体来访时受限；可能弱化个体责任，对文化中的家庭观念需敏感处理。'
    }
  ];

  // —— 案例库 ——
  const CASES = [
    {
      id: 'lin_anxiety',
      name: '小林',
      age: 21,
      gender: '女',
      role: '大三学生',
      difficulty: 2,
      schools: ['认知行为', '行为疗法', '以人为中心'],
      summary: '考试与社交焦虑，回避课堂发言，失眠',
      background: '成绩中上，但每次重要答辩/考试前失眠、心悸，被点名发言会脸红出汗，逐渐回避小组讨论。核心是「我要是答错会很丢脸」的自动思维。',
      baselineEmotion: 'anxious',
      turns: [
        {
          clientText: '我最近总是睡不着，一想到下周三的答辩就心慌，白天也静不下心来看书。',
          emotion: 'anxious',
          focus: '建立信任关系：先接住情绪，再澄清困扰。',
          targets: ['empathy', 'openQuestion'],
          techniques: ['建立关系', '澄清问题'],
          bookRef: '第10章 认知行为疗法 · 治疗关系与个案概念化',
          options: [
            { text: '听起来这次答辩让你压力很大，连觉都睡不好。能多说说，一想到答辩，你心里会冒出哪些念头吗？', score: 100, skill: 'reflectionFeeling', feedback: '先情感反映建立联结，再用开放式提问引导展开，很棒。' },
            { text: '答辩前紧张很正常，很多人都这样。你准备得怎么样了？', score: 60, skill: 'normalization', feedback: '正常化是好的，但「准备得怎么样」偏封闭，且过早转向解决问题。' },
            { text: '你别担心，答辩没那么可怕，放轻松就好。', score: 30, skill: 'reassurance', feedback: '过早安慰会堵住情绪的出口，让来访者觉得没被真正理解。' },
            { text: '你应该早点开始准备，就不会这么慌了。', score: 0, skill: 'advice', feedback: '直接给建议，还隐含评判，会破坏关系、引发防御。' }
          ],
          modelAnswer: '听起来这次答辩让你压力很大，连觉都睡不好。我很好奇，当你在脑海中想象站上台的那一刻，心里会冒出什么念头？',
          modelNote: '先情感反映建立联结，再用认知行为取向的提问去触碰自动思维。'
        },
        {
          clientText: '我就是怕自己在台上说错，别人会笑话我，觉得我能力不行……其实我准备得挺好的，但一上台脑子就一片空白。',
          emotion: 'anxious',
          focus: '识别自动思维与认知歪曲。',
          targets: ['paraphrase', 'concretizing'],
          techniques: ['识别自动思维', '苏格拉底式提问'],
          bookRef: '第10章 认知行为疗法 · 自动思维',
          options: [
            { text: '所以你担心的不只是表现，而是别人会因此否定你这个人。你能回忆一下，最近一次上台前，脑子里具体闪过哪句话？', score: 100, skill: 'paraphrase', feedback: '重述核心（表现→自我价值），并用具体化捕捉自动思维，精准。' },
            { text: '你觉得自己能力不行，可你又说准备得挺好，这听起来有点矛盾。', score: 60, skill: 'confrontation', feedback: '温和对质不错，但时机略早，先共情、再对质会更稳。' },
            { text: '你想太多了，别人其实没那么关注你。', score: 30, skill: 'reassurance', feedback: '否认了来访者的真实感受，会让对方更觉得不被理解。' },
            { text: '你就是太在意别人的看法了，这样不好。', score: 0, skill: 'judgment', feedback: '直接评判，会让来访者更加自我否定。' }
          ],
          modelAnswer: '我听到你其实很清楚自己准备得很充分，但一上台，那个「我会搞砸、会被笑话」的念头就盖过了一切。那一刻你脑子里最常出现的是哪句话？',
          modelNote: '把「表现」与「自我价值」联系起来，再用具体化帮来访者捕捉自动思维。'
        },
        {
          clientText: '我知道不该这么想，可就是控制不住。每次一想「要是搞砸了怎么办」，心跳就特别快，手心冒汗。',
          emotion: 'anxious',
          focus: '引入行为/生理应对，布置家庭作业。',
          targets: ['positiveRegard', 'normalization'],
          techniques: ['放松训练', '行为实验 / 家庭作业'],
          bookRef: '第9章 行为疗法 · 放松与暴露',
          options: [
            { text: '你已经能清楚地觉察到「念头 + 身体反应」这条链条了，这本身就是很重要的一步。如果下周答辩前，我们一起练习一个简单的呼吸放松，你愿意试试吗？', score: 100, skill: 'positiveRegard', feedback: '肯定来访者的觉察，再以征询的口吻提出可操作的行为方案。' },
            { text: '你可以试试深呼吸，答辩前多做几次。', score: 60, skill: 'advice', feedback: '方法本身没错，但缺少共情铺垫，且像「下指令」而非协作。' },
            { text: '你要相信自己，别老往坏处想。', score: 30, skill: 'reassurance', feedback: '空洞的鼓励，没有触及真实困难。' },
            { text: '你就是心理素质太差，得多锻炼。', score: 0, skill: 'judgment', feedback: '评判 + 贴标签，会加重来访者的自我否定。' }
          ],
          modelAnswer: '「控制不住」很正常——焦虑本来就不听「道理」的话。你刚才已经能清楚说出「念头 + 心跳 + 手汗」这条链条，这特别有价值。我有个小提议：我们一起来学一个 3 分钟的呼吸放松，当作这周的练习，你愿意吗？',
          modelNote: '正常化 + 肯定觉察 + 提出行为作业（并征求同意而非命令）。'
        }
      ]
    },

    {
      id: 'chen_depression',
      name: '陈女士',
      age: 40,
      gender: '女',
      role: '离异，单亲母亲',
      difficulty: 3,
      schools: ['认知行为', '以人为中心'],
      summary: '低自尊、兴趣减退、强烈的自我否定',
      background: '两年前离婚后独自抚养女儿，工作屡受挫折，认为自己「一无是处」，逐渐丧失兴趣与动力。',
      baselineEmotion: 'sad',
      turns: [
        {
          clientText: '我做什么都不行，工作被领导批，女儿也跟我顶嘴。我是不是很失败？',
          emotion: 'sad',
          focus: '建立关系、共情，温和承接自我否定。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['以人为中心的接纳', '识别自动思维'],
          bookRef: '第7章 以人为中心疗法',
          options: [
            { text: '听起来你在工作和家庭里都很受挫，心里一定很累。你刚才说「做什么都不行」，能具体说说最近是哪件事让你最有这种感觉吗？', score: 100, skill: 'reflectionFeeling', feedback: '情感反映 + 具体化，把笼统的「都不行」落回具体事件。' },
            { text: '很多人都会有这种感觉，别太自责。', score: 60, skill: 'normalization', feedback: '正常化方向对，但「别太自责」有点劝诫意味，缺共情。' },
            { text: '你女儿顶嘴很正常，青春期都这样。', score: 30, skill: 'reassurance', feedback: '转移了焦点，还否认了她的痛苦。' },
            { text: '你怎么能这么否定自己呢？要振作起来。', score: 0, skill: 'judgment', feedback: '评判 + 说教，会让本就自责的她更沉重。' }
          ],
          modelAnswer: '听起来你在工作和家庭里都受了伤，心里一定很疲惫。你刚才说「做什么都不行」，如果选一件最近最让你有这种感觉的事，是哪一件？',
          modelNote: '先共情承接情绪，再用具体化把灾难化的「都不行」聚焦到具体事件。'
        },
        {
          clientText: '有时候我真想一个人躲起来，谁也不想见。别人都过得很好，就我这么糟糕。',
          emotion: 'tearful',
          focus: '深入共情，识别「社会比较」的认知歪曲。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['认知歪曲（比较/灾难化）'],
          bookRef: '第10章 认知行为疗法 · 认知歪曲',
          options: [
            { text: '听起来你现在很疲惫，甚至想逃离一切，觉得只有自己过得不好。当你躲起来的时候，通常是什么状态？', score: 100, skill: 'reflectionFeeling', feedback: '准确反映孤独与疲惫，并用开放式提问延续探索。' },
            { text: '其实每个人都有自己的难处，别人未必比你好。', score: 60, skill: 'normalization', feedback: '有点说教，容易被听成「你不该这么想」。' },
            { text: '你要多出去走走，别一个人闷着。', score: 30, skill: 'advice', feedback: '直接给建议，忽略了情绪背后的需求。' },
            { text: '你太消极了，这样下去会越来越糟。', score: 0, skill: 'judgment', feedback: '评判式预言，会加深她的绝望感。' }
          ],
          modelAnswer: '听起来你累到想躲起来，也觉得全世界只有自己在受苦。躲起来的时候，你会一个人做些什么、又会想些什么？',
          modelNote: '反映「孤独 + 社会比较」的歪曲，再引导她具体描述回避时的内在体验。'
        },
        {
          clientText: '我知道不该这么消极，可我就是觉得生活没希望……',
          emotion: 'tearful',
          focus: '表达陪伴，探索资源，评估风险。',
          targets: ['positiveRegard', 'empathy'],
          techniques: ['探索例外与资源', '以人为中心的陪伴'],
          bookRef: '第7章 以人为中心 · 无条件积极关注',
          options: [
            { text: '谢谢你愿意把这些讲给我听，这很不容易。虽然现在看不到光，但你已经撑到今天了——是什么让你没有完全放弃？', score: 100, skill: 'positiveRegard', feedback: '肯定她的坚持，再探索支撑她的资源，专业且温暖。' },
            { text: '生活总有起伏，能感到绝望说明你也在乎，这很正常。', score: 60, skill: 'normalization', feedback: '正常化方向对，但缺少对「绝望」本身的接纳。' },
            { text: '你应该去看看医生，吃药会好很多。', score: 30, skill: 'advice', feedback: '过早给出医学建议，绕过了当下的情绪。' },
            { text: '你这种想法就是抑郁症的表现。', score: 0, skill: 'labeling', feedback: '贴标签，会让来访者更羞耻、更退缩。' }
          ],
          modelAnswer: '谢谢你愿意告诉我这些，这需要很大的勇气。我听到「没希望」里，其实还藏着一点点没放弃的部分——是什么，让你今天依然愿意坐在这里？',
          modelNote: '积极关注 + 探索例外资源，把焦点从「绝望」轻轻移向「尚未放弃」。'
        }
      ]
    },

    {
      id: 'hao_anger',
      name: '阿浩',
      age: 16,
      gender: '男',
      role: '高一学生',
      difficulty: 3,
      schools: ['现实疗法', '阿德勒', '格式塔'],
      summary: '与父亲激烈冲突、易怒冲动、成绩下滑',
      background: '常与父亲爆发争吵、摔门砸物，被老师评价「脾气爆」。内心渴望被认可，却总感到被否定。',
      baselineEmotion: 'angry',
      turns: [
        {
          clientText: '我没什么好说的。他们从来不听我说话，只会骂我。',
          emotion: 'angry',
          focus: '建立联结，不急于说教，反映愤怒。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['建立关系', '反映愤怒'],
          bookRef: '第5章 阿德勒疗法 · 第7章 共情',
          options: [
            { text: '听起来你在家里很少被认真倾听，心里憋着一肚子气。如果你愿意，我很想听听你的版本——最近一次让你特别火大的是什么事？', score: 100, skill: 'reflectionFeeling', feedback: '先反映愤怒建立信任，再尊重地邀请他开口。' },
            { text: '你父母也是为你好，你要理解他们。', score: 30, skill: 'judgment', feedback: '站在父母一边说教，会把他推得更远。' },
            { text: '你应该试着跟父母好好沟通。', score: 30, skill: 'advice', feedback: '忽略了他「不被倾听」的痛点，直接给建议。' },
            { text: '你现在这种态度就不对，难怪他们骂你。', score: 0, skill: 'judgment', feedback: '评判 + 归咎于他，严重破坏关系。' }
          ],
          modelAnswer: '听起来你在这段关系里很少被听见，那种憋闷和愤怒一定很难受。我很想听听你的感受——最近一次，是发生了什么事让你特别火大？',
          modelNote: '对愤怒本身表示理解与接纳，用开放式提问邀请他讲述自己的版本。'
        },
        {
          clientText: '我爸就觉得我没出息，天天拿我跟别人比。他越说我就越烦，就想砸东西。',
          emotion: 'angry',
          focus: '反映愤怒，具体化触发情境与身体感受。',
          targets: ['concretizing', 'empathy'],
          techniques: ['具体化', '格式塔的身体觉察'],
          bookRef: '第8章 格式塔 · 觉察',
          options: [
            { text: '被拿来和别人比、还被贴「没出息」的标签，换谁都会窝火。你烦到想砸东西的那一刻，身体是什么感觉？', score: 100, skill: 'concretizing', feedback: '共情之后，用身体觉察把愤怒从「行为」引向「体验」。' },
            { text: '砸东西解决不了问题，你要学会控制情绪。', score: 60, skill: 'advice', feedback: '说教，且先于共情，容易激起阻抗。' },
            { text: '你爸也是望子成龙，是为你好。', score: 30, skill: 'judgment', feedback: '又一次替父亲辩解，忽略了他的受伤。' },
            { text: '你就是太冲动，一点就着。', score: 0, skill: 'labeling', feedback: '贴标签，会固化他对自己的负面看法。' }
          ],
          modelAnswer: '被拿来和别人比较、还被说成「没出息」，确实很伤人。当那股想砸东西的冲动上来时，你身体哪个地方最先有反应？',
          modelNote: '用格式塔的「身体觉察」帮他把愤怒从冲动行为转化为可观察的内在体验。'
        },
        {
          clientText: '我也想控制，可一激动就收不住。砸完又后悔……',
          emotion: 'conflicted',
          focus: '肯定改变的意愿，探索「想要什么」。',
          targets: ['positiveRegard', 'openQuestion'],
          techniques: ['现实疗法：探索「想要」', '肯定意愿'],
          bookRef: '第11章 现实/选择理论',
          options: [
            { text: '你其实很想控制住自己，也为自己失控而难受——这说明你在乎。如果「能控制住」真的发生了，你希望那个时刻的你是什么样子？', score: 100, skill: 'positiveRegard', feedback: '肯定改变的意愿，再用现实疗法式的提问指向「想要」。' },
            { text: '知错能改就好，以后别那么冲动。', score: 30, skill: 'reassurance', feedback: '轻飘飘的安慰，没有深入他的内心。' },
            { text: '你就应该趁生气的时候赶紧走开。', score: 30, skill: 'advice', feedback: '直接给策略，缺共情，也没帮他理解自己。' },
            { text: '你这种脾气迟早要出事。', score: 0, skill: 'judgment', feedback: '威胁式评判，只会加重他的无助与羞耻。' }
          ],
          modelAnswer: '「想控制却收不住」——这股拉扯本身就说明你很在乎、很想变好。如果你真的能控制住自己，那个你希望成为的样子，会是什么样？',
          modelNote: '肯定意愿 + 现实疗法的 WDEP 起点：先厘清他真正「想要」的方向。'
        }
      ]
    },

    {
      id: 'zhang_existential',
      name: '张先生',
      age: 42,
      gender: '男',
      role: '企业中层',
      difficulty: 4,
      schools: ['存在主义'],
      summary: '事业家庭稳定却深感空虚、怀疑人生意义',
      background: '事业有成、家庭和睦，却常感「空」，凌晨醒来觉得一切没意思，质疑「我这样活着到底为了什么」。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '我该有的都有了，可就是高兴不起来，觉得每天都是在重复。',
          emotion: 'flat',
          focus: '接住「空」的感受，不急于给答案。',
          targets: ['empathy', 'exploringMeaning'],
          techniques: ['存在议题：意义与重复'],
          bookRef: '第6章 存在主义疗法',
          options: [
            { text: '你拥有了很多，却依然感到空洞和重复——这种感受本身一定很孤独。你觉得这种「重复」里，最让你喘不过气的是什么？', score: 100, skill: 'reflectionFeeling', feedback: '先承接「空」的孤独感，再用意义探索式的提问深入。' },
            { text: '你这是中年危机，很多人都有。', score: 30, skill: 'labeling', feedback: '贴标签，把深刻的体验简单化、病理化。' },
            { text: '你应该培养点兴趣爱好，生活就有意思了。', score: 30, skill: 'advice', feedback: '用「兴趣」草率回应「意义」问题，隔靴搔痒。' },
            { text: '你就是不知足。', score: 0, skill: 'judgment', feedback: '评判，完全否定了他的内心体验。' }
          ],
          modelAnswer: '拥有很多却依然感到空虚和重复，这种落差一定让你很孤独。当你说「每天都是在重复」时，最让你难以忍受的是哪一刻？',
          modelNote: '存在主义取向：不急于「解决」，而是陪他去面对和澄清这份空。'
        },
        {
          clientText: '有时候半夜醒来，会想「我这样活着到底为了什么」，想多了就害怕。',
          emotion: 'fearful',
          focus: '探索意义与存在焦虑，不回避。',
          targets: ['exploringMeaning', 'empathy'],
          techniques: ['存在主义：意义与存在焦虑'],
          bookRef: '第6章 存在主义 · 意义与焦虑',
          options: [
            { text: '你在深夜里触碰到了一个很根本的问题——「活着为了什么」。这个问题让你害怕，但你愿意直视它，这很勇敢。如果试着给这个问题一个你自己的答案，哪怕是临时的，会是什么？', score: 100, skill: 'exploringMeaning', feedback: '肯定直面存在议题的勇气，并邀请他建构自己的意义。' },
            { text: '别想这么多，早点睡就好了。', score: 30, skill: 'reassurance', feedback: '回避了核心议题，让他感到不被理解。' },
            { text: '人生本来就没什么意义，别较真。', score: 0, skill: 'judgment', feedback: '强加虚无主义，可能加深他的绝望。' },
            { text: '你可以去信个教，找点精神寄托。', score: 30, skill: 'advice', feedback: '把宏大的意义问题简化成「找个寄托」，失于草率。' }
          ],
          modelAnswer: '你在深夜触碰到了一个很根本的问题——「我这样活着到底为了什么」。这份害怕其实很真实。我很好奇，抛开外界给你的答案，你自己心里，哪怕模模糊糊，觉得人活着最重要的是什么？',
          modelNote: '存在主义不回避意义与死亡议题，把问题还给他，帮助他成为意义的作者。'
        },
        {
          clientText: '别人说我不知足，可我不是不感恩，就是……说不出的空。',
          emotion: 'flat',
          focus: '正常化，帮助命名与面对这种「空」。',
          targets: ['normalization', 'exploringMeaning'],
          techniques: ['存在主义：面对虚无与自由'],
          bookRef: '第6章 存在主义 · 自由与虚无',
          options: [
            { text: '我相信你并不是不感恩——「空」和「感恩」可以同时存在。当你说「说不出的空」时，如果给它一个画面或比喻，它像什么？', score: 100, skill: 'concretizing', feedback: '先肯定，再用具象化的方式帮他把模糊的「空」说清楚。' },
            { text: '你试着每天感恩，就会觉得充实。', score: 30, skill: 'advice', feedback: '技术化的「感恩练习」绕开了真实的存在困境。' },
            { text: '你这是一种心理问题，得治疗。', score: 0, skill: 'labeling', feedback: '把存在困惑病理化，是常见的误判。' },
            { text: '想开点，人生得意须尽欢。', score: 30, skill: 'reassurance', feedback: '轻率的安慰，无法触及他真实的空洞。' }
          ],
          modelAnswer: '我理解「空」并不等于「不感恩」。如果让你给这份「空」找一个比喻或画面，它更像什么——一片雾？一间空房间？还是一口枯井？',
          modelNote: '用具体化/现象学的方式，帮他把难以言说的「空」变成可以谈论的对象。'
        }
      ]
    },

    {
      id: 'ya_trauma',
      name: '小雅',
      age: 25,
      gender: '女',
      role: '职场新人',
      difficulty: 4,
      schools: ['行为疗法', '叙事疗法', '格式塔'],
      summary: '校园霸凌创伤后的强烈回避与闪回',
      background: '中学时遭受校园霸凌，现对公开场合、被评价的场景强烈回避，偶有创伤记忆闪回。',
      baselineEmotion: 'fearful',
      turns: [
        {
          clientText: '我尽量不出现在人多的地方，一想到要上台或被别人看着，就喘不过气。',
          emotion: 'fearful',
          focus: '共情，理解回避的功能，不急于暴露。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['理解回避', '建立安全感'],
          bookRef: '第9章 行为疗法 · 焦虑与回避',
          options: [
            { text: '仅仅是想象那个场景，就已经让你喘不过气——这些年来你一定躲得很辛苦。能不能告诉我，你一般会用什么办法让自己躲开那些场合？', score: 100, skill: 'reflectionFeeling', feedback: '先共情回避背后的恐惧，再温和地了解她的应对方式。' },
            { text: '你要勇敢面对，越躲越严重。', score: 30, skill: 'advice', feedback: '过早的「面对」，忽略了她尚未建立的安全感。' },
            { text: '你是不是有社交恐惧症？', score: 0, skill: 'labeling', feedback: '贴标签，会让她更羞耻、更想躲。' },
            { text: '没事的，没人会真的关注你。', score: 30, skill: 'reassurance', feedback: '否认她的恐惧，堵住了表达。' }
          ],
          modelAnswer: '仅仅是想像那个场景，就已经让你喘不过气——这些年你一定躲得非常辛苦。你通常是怎么让自己避开那些场合的？',
          modelNote: '共情回避的「功能」，建立安全感，是后续分级暴露的前提。'
        },
        {
          clientText: '那些画面会突然跳出来，好像又回到了那时候……我是不是永远都这样了？',
          emotion: 'tearful',
          focus: '共情闪回，外化记忆，注入希望。',
          targets: ['empathy', 'normalization'],
          techniques: ['叙事：外化创伤记忆', '注入希望'],
          bookRef: '第13章 叙事疗法 · 外化',
          options: [
            { text: '那些记忆像是会突然闯进现在的生活，把你重新拉回过去——那种感觉一定很无力。你问「是不是永远都这样」，这恰恰说明你在渴望走出来。', score: 100, skill: 'reflectionFeeling', feedback: '把「闪回」外化为「闯进来的记忆」，并捕捉她的希望。' },
            { text: '你要学会忘记过去，向前看。', score: 30, skill: 'advice', feedback: '简单化的「忘记」，忽视了创伤的复杂性。' },
            { text: '都过去那么久了，你太脆弱了。', score: 0, skill: 'judgment', feedback: '评判脆弱，二次伤害。' },
            { text: '别想了，那些都是过去的事了。', score: 30, skill: 'reassurance', feedback: '「别想」反而会强化闪回。' }
          ],
          modelAnswer: '那些画面好像会突然闯进「现在」，把你重新拽回过去，那种无力感一定很折磨人。你问「是不是永远都这样」——能问出这句话，说明你心里依然渴望有一天能走出来。',
          modelNote: '叙事式外化「闯入的记忆」，并把焦点从绝望转向她未熄灭的希望。'
        },
        {
          clientText: '我很想走出来，可每次想迈出一步，就特别恐惧，就缩回来了。',
          emotion: 'fearful',
          focus: '肯定动机，分级暴露（小步走）。',
          targets: ['positiveRegard', 'concretizing'],
          techniques: ['行为疗法：分级暴露', '肯定动机'],
          bookRef: '第9章 行为疗法 · 系统脱敏',
          options: [
            { text: '「想走出来」本身已经是迈出的第一步，只是那一步对你来说太陡了。我们能不能把「上台」拆成很小很小的台阶，比如先想象、再对着镜子讲，一步步来？', score: 100, skill: 'positiveRegard', feedback: '肯定动机 + 分级暴露，把目标拆小到可承受。' },
            { text: '你就直接去试试，克服了就好了。', score: 30, skill: 'advice', feedback: '「直接面对」违背暴露的渐进原则，容易再次受挫。' },
            { text: '你还是太胆小，得逼自己一把。', score: 0, skill: 'judgment', feedback: '评判胆怯，摧毁她仅剩的勇气。' },
            { text: '没关系，做不到也没事。', score: 30, skill: 'reassurance', feedback: '过度包容，反而可能强化回避。' }
          ],
          modelAnswer: '「想走出来」这一步，其实你已经迈出了。只是「上台」对你现在来说还太高、太陡。我们能不能把它拆成一个个更小的台阶，比如先从「想象那个场景」开始？',
          modelNote: '肯定动机 + 分级暴露/系统脱敏：把目标拆成来访者可承受的小步。'
        }
      ]
    },

    {
      id: 'li_marriage',
      name: '李太太',
      age: 35,
      gender: '女',
      role: '已婚，全职工作',
      difficulty: 3,
      schools: ['家庭系统', '认知行为'],
      summary: '夫妻冷战、沟通破裂，深感孤独',
      background: '结婚 8 年，与丈夫陷入冷战与争吵循环，觉得「他不懂我」，几乎无交流。',
      baselineEmotion: 'sad',
      turns: [
        {
          clientText: '他回家就玩手机，我说话他当没听见。我们除了孩子的事，几乎不说话。',
          emotion: 'sad',
          focus: '共情孤独，探索互动模式。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['家庭系统：互动模式', '共情依恋需要'],
          bookRef: '第14章 家庭系统疗法',
          options: [
            { text: '你渴望被回应、被看见，却常常被忽略，那种孤单一定很难受。当他又一次盯着手机不回应时，你通常会做什么？', score: 100, skill: 'reflectionFeeling', feedback: '反映孤独与依恋需要，再探索她在这个循环中的行为。' },
            { text: '你要跟他好好谈谈，沟通很重要。', score: 30, skill: 'advice', feedback: '空泛的建议，忽略了她「试过却失败」的处境。' },
            { text: '男人都这样，你习惯了就好。', score: 30, skill: 'judgment', feedback: '把问题正常化、压抑她的需要。' },
            { text: '你就是太敏感了，他可能只是累了。', score: 0, skill: 'judgment', feedback: '否定她的感受，替对方开脱。' }
          ],
          modelAnswer: '你渴望被看见、被回应，却常常被忽略，那种孤单一定很难熬。当他盯着手机、又一次没有回应时，你通常会怎么做？',
          modelNote: '系统视角：不只聚焦她的委屈，也去理解双方在循环中各做了什么。'
        },
        {
          clientText: '我试过好好谈，可每次说着说着就吵起来，他就摔门出去。',
          emotion: 'resentful',
          focus: '具体化冲突循环，循环因果（非指责）。',
          targets: ['concretizing', 'empathy'],
          techniques: ['家庭系统：循环因果', '具体化冲突'],
          bookRef: '第14章 家庭系统 · 循环因果',
          options: [
            { text: '你们像是掉进了一个循环：你想谈，最后变成吵，然后他走开、你更委屈。能不能具体说说，通常是什么话或什么瞬间，让「谈」变成了「吵」？', score: 100, skill: 'concretizing', feedback: '用「循环」而非「对错」理解冲突，再具体化转折点。' },
            { text: '他摔门不对，你应该让他改。', score: 30, skill: 'judgment', feedback: '只归咎一方，强化了「你对我错」的对立。' },
            { text: '你就不该在他生气的时候还继续说。', score: 30, skill: 'advice', feedback: '把责任都推给她，忽视循环因果。' },
            { text: '这种婚姻还不如离了算了。', score: 0, skill: 'advice', feedback: '极端建议，严重越界。' }
          ],
          modelAnswer: '听起来你们掉进了一个「想谈→变吵→摔门→更委屈」的循环。我想具体了解一下：通常是在哪句话、哪个瞬间，「谈」开始变成了「吵」？',
          modelNote: '循环因果视角：不追责谁对谁错，而是看清循环是怎么被共同维持的。'
        },
        {
          clientText: '我越来越觉得，这个家只有我一个人在撑着。',
          emotion: 'sad',
          focus: '共情，探索深层需要与自身力量。',
          targets: ['positiveRegard', 'empathy'],
          techniques: ['积极关注', '触及深层依恋需要'],
          bookRef: '第14章 家庭系统 · 第7章 积极关注',
          options: [
            { text: '撑一个家这么久，你一定又累又孤单。除了累，你有没有想过，你最希望从他那里得到的是什么？', score: 100, skill: 'positiveRegard', feedback: '肯定她的付出，再引导她触及深层需要。' },
            { text: '你要学会放手，别什么都自己扛。', score: 30, skill: 'advice', feedback: '建议没错，但没先接住她的疲惫与委屈。' },
            { text: '你太能干了，男人会不珍惜。', score: 0, skill: 'judgment', feedback: '把问题归咎于她的「能干」，是偏见。' },
            { text: '会过去的，忍一忍就好了。', score: 30, skill: 'reassurance', feedback: '让她继续忍耐，忽视了她真实的疲惫。' }
          ],
          modelAnswer: '一个人撑起这个家这么久，你一定又疲惫又孤单。我很好奇，除了「累」，你心底最希望从他那里得到的，到底是什么？',
          modelNote: '积极关注肯定她的付出，再帮她把模糊的委屈聚焦为具体的依恋需要。'
        }
      ]
    },

    {
      id: 'wang_ocd',
      name: '王先生',
      age: 33,
      gender: '男',
      role: '公司职员',
      difficulty: 3,
      schools: ['认知行为', '行为疗法'],
      summary: '反复检查门锁/燃气，明知不必要却停不下来',
      background: '每天出门前反复检查门锁、燃气、电器，耗时约一小时，明知不必要却无法停止，影响工作与家庭。',
      baselineEmotion: 'anxious',
      turns: [
        {
          clientText: '我知道门锁了，可就是得再回去看一眼，不然心里发慌，一整天都不踏实。',
          emotion: 'anxious',
          focus: '共情，理解强迫的「不可控感」。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['CBT：理解强迫循环'],
          bookRef: '第10章 认知行为疗法 · 强迫',
          options: [
            { text: '明知道门锁了，却还是被一股强烈的不安推着回去——这种「身不由己」一定让你很疲惫。如果没回去检查，你最怕发生什么？', score: 100, skill: 'reflectionFeeling', feedback: '反映「不可控感」，再引导他说出恐惧的具体内容。' },
            { text: '你就是强迫症，得治疗。', score: 0, skill: 'labeling', feedback: '贴标签，会加重羞耻。' },
            { text: '你试着别去检查，忍一忍就好。', score: 30, skill: 'advice', feedback: '「忍一忍」恰恰是强迫最做不到的事。' },
            { text: '门锁了就是锁了，你多虑了。', score: 30, skill: 'reassurance', feedback: '用理性否定他的焦虑，无法解除强迫。' }
          ],
          modelAnswer: '明明知道门锁了，却还是被那股强烈的不安推着回去——这种身不由己一定很疲惫。如果那一刻你没有回去检查，你最害怕发生什么？',
          modelNote: '共情「不可控感」，再引导他具体化恐惧，为认知工作铺路。'
        },
        {
          clientText: '如果我不检查，会不会出事？万一真出事，那都是我的错。',
          emotion: 'anxious',
          focus: '识别「责任夸大」的认知歪曲。',
          targets: ['openQuestion', 'empathy'],
          techniques: ['CBT：责任夸大与可能性'],
          bookRef: '第10章 认知行为 · 认知歪曲',
          options: [
            { text: '你承担了很大的责任——仿佛只要自己少看一眼，灾祸就会因你而起。如果冷静下来算一笔账：门已经锁好、出事的真实概率有多大？', score: 100, skill: 'openQuestion', feedback: '用苏格拉底式提问温和挑战「责任夸大」。' },
            { text: '你想太多了，不会出事的。', score: 30, skill: 'reassurance', feedback: '直接安慰，没有帮他检验想法。' },
            { text: '你太追求完美了，得改改。', score: 0, skill: 'judgment', feedback: '评判，且误解了强迫的本质。' },
            { text: '你就让别人帮你检查好了。', score: 30, skill: 'advice', feedback: '让家人代劳只会强化强迫，南辕北辙。' }
          ],
          modelAnswer: '你好像把「不检查」和「出大事」划了等号，责任全压在自己身上。如果把它当一道算术题：门已锁好、真出事的概率有多大？最坏的结果又有多大？',
          modelNote: '识别「责任夸大」歪曲，用苏格拉底式提问检验可能性。'
        },
        {
          clientText: '我老婆说我有病，我也知道这样不正常，可停下来更难受。',
          emotion: 'sad',
          focus: '正常化挣扎，介绍 ERP 协作方案。',
          targets: ['normalization', 'empathy'],
          techniques: ['CBT/ERP：暴露与反应预防'],
          bookRef: '第9章 行为疗法 · 暴露与反应预防',
          options: [
            { text: '「知道不该做却停不下来」，正是强迫最折磨人的地方，不是你意志力差。如果有一个循序渐进的办法，让你从「少检查一次」开始慢慢练习，你愿意一起了解吗？', score: 100, skill: 'normalization', feedback: '正常化挣扎 + 以协作口吻介绍 ERP，专业且尊重。' },
            { text: '你要相信科学，去做暴露治疗。', score: 30, skill: 'advice', feedback: '方向对但语气像命令，缺共情铺垫。' },
            { text: '你就是意志力不够强。', score: 0, skill: 'judgment', feedback: '归咎意志力，是对强迫的误解与伤害。' },
            { text: '别管它，顺其自然就好。', score: 30, skill: 'reassurance', feedback: '「顺其自然」没给出可操作的方法，徒增无力。' }
          ],
          modelAnswer: '「知道不该做却停不下来」——这正是强迫最折磨人的地方，不是你的意志力问题。如果有一个循序渐进的办法，从「少检查一次」开始慢慢练习，你愿意和我一起了解吗？',
          modelNote: '正常化 + 去除自责 + 以征求同意的口吻引入 ERP。'
        }
      ]
    },

    {
      id: 'mei_bodyimage',
      name: '小美',
      age: 19,
      gender: '女',
      role: '大一学生',
      difficulty: 4,
      schools: ['认知行为', '女权主义', '以人为中心'],
      summary: '完美主义、节食与过度运动、身体意象困扰',
      background: '严格控制饮食、过度运动，对身材极度不满，坚信「不瘦不完美就不值得被爱」。',
      baselineEmotion: 'ashamed',
      turns: [
        {
          clientText: '我要是胖一点点，就觉得自己很恶心。周围人都那么瘦那么好看。',
          emotion: 'ashamed',
          focus: '共情，探索「瘦＝价值」的核心信念。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['识别核心信念', '女权：身体的社会规训'],
          bookRef: '第10章 认知行为 · 第12章 女权主义',
          options: [
            { text: '「胖一点点就恶心」——这句话背后，似乎藏着「只有瘦才值得被爱」的沉重标准。你从什么时候开始，觉得自己的价值跟身材绑在了一起？', score: 100, skill: 'reflectionFeeling', feedback: '把症状语言翻译成核心信念，并追溯其来源。' },
            { text: '你其实挺瘦的，别瞎想。', score: 30, skill: 'reassurance', feedback: '用「你挺瘦」安慰，反而强化了「瘦=好」的框架。' },
            { text: '你是不是有进食障碍？', score: 0, skill: 'labeling', feedback: '贴诊断标签，会让她更羞耻、更隐瞒。' },
            { text: '你应该健康饮食、规律运动。', score: 30, skill: 'advice', feedback: '过早的教育式建议，绕开了信念核心。' }
          ],
          modelAnswer: '「胖一点点就恶心」——我听到一个很沉重的标准：似乎只有瘦、只有「完美」，你才值得被喜欢。这个想法，是从什么时候开始住进你心里的？',
          modelNote: '识别「瘦=价值」的核心信念，并追溯其来源（结合女权视角审视社会规训）。'
        },
        {
          clientText: '我一天只吃很少，体重涨一点点就崩溃。我知道这样不健康，可停不下来。',
          emotion: 'ashamed',
          focus: '共情挣扎，探索节食的功能（控制感）。',
          targets: ['empathy', 'exploringMeaning'],
          techniques: ['理解进食控制的功能'],
          bookRef: '第10章 认知行为 · 行为功能',
          options: [
            { text: '严格地控制饮食，也许是你生活中少数能握在手里的「掌控感」，所以你不敢放手。我想先理解：对你来说，这个「控制」还意味着什么？', score: 100, skill: 'exploringMeaning', feedback: '探索行为的功能，把「节食」理解为对控制感的追求。' },
            { text: '你不能再这样节食了，会出事的。', score: 30, skill: 'judgment', feedback: '警告式的说教，可能让她更防御。' },
            { text: '你会瘦下来的，别担心。', score: 0, skill: 'reassurance', feedback: '强化了「瘦」的价值，方向完全错误。' },
            { text: '你要多吃点，身体最重要。', score: 30, skill: 'advice', feedback: '与她的信念直接对立，容易引起阻抗。' }
          ],
          modelAnswer: '也许对现在的你来说，严格控制饮食是少数能握在手里的「掌控感」，所以很难放手。我想更理解你：这份「控制」对你来说，还意味着什么？',
          modelNote: '把「停不下来」理解为节食在为她提供某种功能（控制感），为替代方案留出空间。'
        },
        {
          clientText: '我总觉得，如果我够瘦够好，大家才会喜欢我。',
          emotion: 'ashamed',
          focus: '温和挑战核心信念，肯定内在价值。',
          targets: ['confrontation', 'positiveRegard'],
          techniques: ['认知重构：价值≠身材', '女权：解构规训'],
          bookRef: '第10章 认知重构 · 第12章 解构规训',
          options: [
            { text: '你相信「只有瘦和好，才配被喜欢」——这个标准是哪里来的？我很好奇，那些真心在乎你的人，喜欢的究竟是你的身材，还是你这个人？', score: 100, skill: 'confrontation', feedback: '温和对质 + 苏格拉底式提问，动摇「价值=身材」的等式。' },
            { text: '你已经很优秀了，自信一点。', score: 30, skill: 'reassurance', feedback: '空洞的赞美，无法撼动根深蒂固的信念。' },
            { text: '你这种想法太病态了。', score: 0, skill: 'judgment', feedback: '评判，会让她更羞耻、更孤立。' },
            { text: '多想想自己的优点就好了。', score: 30, skill: 'advice', feedback: '「想想优点」太表层，触及不了核心信念。' }
          ],
          modelAnswer: '你心里似乎有一条等式：瘦、好、完美 = 被喜欢。我想陪你一起看看这条等式是谁写下的——以及，那些真正在乎你的人，爱的是你的身材，还是你这个人本身？',
          modelNote: '温和对质核心信念，并（女权视角）解构「女性价值=外貌」的社会规训。'
        }
      ]
    },

    {
      id: 'zhou_grief',
      name: '周女士',
      age: 50,
      gender: '女',
      role: '丧偶',
      difficulty: 3,
      schools: ['以人为中心', '存在主义'],
      summary: '丈夫突发离世后的复杂哀伤',
      background: '丈夫半年前突发离世，陷入哀伤，失眠、独自垂泪，「不知道怎么活下去」。',
      baselineEmotion: 'tearful',
      turns: [
        {
          clientText: '他走得太突然了，我到现在还觉得他只是在上班，晚上就会回来。',
          emotion: 'tearful',
          focus: '共情，允许哀伤，不急于「往前走」。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['以人为中心：陪伴哀伤'],
          bookRef: '第7章 以人为中心 · 哀伤',
          options: [
            { text: '你的世界好像还停留在「他会回来」的那一刻，接受「他真的不在了」太难了。能多说说他吗？', score: 100, skill: 'reflectionFeeling', feedback: '接纳她不接受现实的状态，并邀请她讲述亡者。' },
            { text: '时间会冲淡一切的。', score: 30, skill: 'reassurance', feedback: '空洞的安慰，抹平了哀伤的独特性。' },
            { text: '你这就是还没走出来，要振作。', score: 0, skill: 'judgment', feedback: '评判她的哀伤进程，是很大的伤害。' },
            { text: '你应该多出去走走，转移注意力。', score: 30, skill: 'advice', feedback: '「转移」回避了哀伤，反而会延迟处理。' }
          ],
          modelAnswer: '你的世界好像还停留在「他下班就会回来」的那一刻——要接受他真的不在了，太难太难了。我很想听你多讲讲他。',
          modelNote: '以人为中心的陪伴：不催促「接受」，而是陪她待在这份哀伤里，并邀请讲述。'
        },
        {
          clientText: '家里到处都是他的东西，我不敢动，也不敢一个人待着，可又不想见人。',
          emotion: 'tearful',
          focus: '共情矛盾感受，具体化。',
          targets: ['empathy', 'concretizing'],
          techniques: ['哀伤辅导：允许矛盾'],
          bookRef: '第7章 以人为中心 · 第6章 存在主义',
          options: [
            { text: '留着东西、既怕独处又怕见人——这些看似矛盾的心情，其实都是思念他的一部分。哪些东西，是你最舍不得碰的？', score: 100, skill: 'reflectionFeeling', feedback: '把矛盾情绪正常化为「思念的一部分」，再具体化。' },
            { text: '你应该把他的东西收拾起来，早点走出来。', score: 30, skill: 'advice', feedback: '急于「清理」和「走出来」，不尊重她的节奏。' },
            { text: '人死不能复生，你要接受现实。', score: 0, skill: 'judgment', feedback: '冷酷的说教，是哀伤辅导的大忌。' },
            { text: '想哭就哭吧，哭出来就好了。', score: 30, skill: 'reassurance', feedback: '「哭出来就好」过于简单，忽略了哀伤的漫长。' }
          ],
          modelAnswer: '留着东西、既怕独处又怕见人——这些看似矛盾的心情，也许都是你在用自己的方式留住他。这些物品里，哪一件最让你舍不得碰？',
          modelNote: '把矛盾正常化为对亡者的依恋，再用具体化轻轻打开记忆。'
        },
        {
          clientText: '别人劝我向前看，可我觉得，如果我好起来了，是不是就把他忘了？',
          emotion: 'tearful',
          focus: '重构「记得」与「向前」的关系。',
          targets: ['exploringMeaning', 'empathy'],
          techniques: ['存在主义：意义与哀伤', '叙事'],
          bookRef: '第6章 存在主义 · 第13章 叙事',
          options: [
            { text: '你把「好起来」当成了「遗忘」和「背叛」——可也许，带着对他的爱与记忆往前走，才是真正把他留在生命里。你想以怎样的方式记住他？', score: 100, skill: 'exploringMeaning', feedback: '重构「好起来≠遗忘」，并引导她主动建构纪念的方式。' },
            { text: '你当然不能忘了他，但也要为自己活。', score: 30, skill: 'reassurance', feedback: '方向对但略说教，缺深度。' },
            { text: '你要是不走出来，他在天上也会不安心。', score: 0, skill: 'judgment', feedback: '借亡者之名施压，会造成内疚。' },
            { text: '时间久了自然就淡了。', score: 30, skill: 'reassurance', feedback: '「淡了」恰好印证她害怕的「遗忘」。' }
          ],
          modelAnswer: '你把「好起来」和「忘了他」划上了等号——但也许，带着对他的爱与记忆继续往前走，才是真正把他留在生命里。你想用什么方式，一直记住他？',
          modelNote: '意义重构：把「继续生活」重新定义为「延续爱与记忆」，而非背叛。'
        }
      ]
    },

    {
      id: 'ming_gaming',
      name: '阿明',
      age: 22,
      gender: '男',
      role: '待业青年',
      difficulty: 3,
      schools: ['现实疗法', '认知行为'],
      summary: '沉迷游戏、逃避求职、与父母关系紧张',
      background: '大学毕业后待业在家，昼夜颠倒沉迷游戏，几次求职被拒后更退缩，与父母冲突加剧。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '打游戏的时候我才觉得活着有点意思。现实中我什么都不是。',
          emotion: 'flat',
          focus: '共情，理解游戏的功能。',
          targets: ['empathy', 'exploringMeaning'],
          techniques: ['理解成瘾的功能', '动机访谈'],
          bookRef: '第11章 现实疗法 · 第9章 行为',
          options: [
            { text: '游戏里你能感到「有点意思」、甚至被需要，而现实却让你觉得自己一无是处——这个反差一定很伤人。游戏里的你，和现实里的你，最大的不同是什么？', score: 100, skill: 'exploringMeaning', feedback: '探索游戏的功能，并引导他对比两个世界里的自我。' },
            { text: '你就是游戏上瘾了，得戒。', score: 0, skill: 'labeling', feedback: '贴标签，会激起强烈的防御。' },
            { text: '你应该找份工作，忙起来就好了。', score: 30, skill: 'advice', feedback: '忽略了他的挫败与退缩，直接给建议。' },
            { text: '年轻人都有迷茫期，会好的。', score: 30, skill: 'reassurance', feedback: '轻描淡写，没接住他的无价值感。' }
          ],
          modelAnswer: '在游戏里你能感到「有点意思」、甚至被需要，而现实却让你觉得自己一无是处——这个落差一定很伤人。我很想知道，游戏里的你和现实里的你，最大的不同在哪里？',
          modelNote: '先理解游戏在满足他的哪些需要（成就感、归属感），这是改变的起点。'
        },
        {
          clientText: '我也知道该找工作，可投简历被拒了几次，就更不想面对了，干脆缩在游戏里。',
          emotion: 'flat',
          focus: '共情挫败，探索回避循环。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['动机访谈：矛盾心态'],
          bookRef: '第11章 现实疗法 · 第10章 行为回避',
          options: [
            { text: '几次被拒像一盆盆冷水，浇灭了你走出去的勇气，游戏成了你躲避挫败的避风港。被拒绝的那一刻，你心里是怎么跟自己说的？', score: 100, skill: 'reflectionFeeling', feedback: '共情回避背后的挫败，再引导他觉察内在自我对话。' },
            { text: '被拒很正常，你要越挫越勇。', score: 30, skill: 'reassurance', feedback: '空洞的鼓励，忽略了真实的挫败感。' },
            { text: '你就是太玻璃心，扛不住打击。', score: 0, skill: 'judgment', feedback: '评判 + 羞辱，会让他更退缩。' },
            { text: '你多投几家，总有要你的。', score: 30, skill: 'advice', feedback: '简单化的建议，没触及他回避的核心。' }
          ],
          modelAnswer: '几次被拒，像一盆盆冷水浇灭了你走出去的勇气，于是游戏成了你躲避挫败的避风港。当收到「不录用」的那一刻，你心里是怎么跟自己说的？',
          modelNote: '共情回避的功能，再引导他觉察被拒时的自动化自我对话。'
        },
        {
          clientText: '爸妈天天逼我，越逼我越不想动。我是不是没救了？',
          emotion: 'low',
          focus: '肯定求助意愿，探索「想要什么」。',
          targets: ['positiveRegard', 'openQuestion'],
          techniques: ['现实疗法：WDEP', '肯定意愿'],
          bookRef: '第11章 现实/选择理论',
          options: [
            { text: '「我是不是没救了」这句话里，其实藏着你想被拉一把、想变好的渴望。如果抛开爸妈的催促，你自己最想要的生活，长什么样子？', score: 100, skill: 'positiveRegard', feedback: '捕捉求助意愿，再用 WDEP 式的提问指向他「想要」的方向。' },
            { text: '你当然有救，别这么说自己。', score: 30, skill: 'reassurance', feedback: '安慰方向对，但没有深入。' },
            { text: '你再这样下去真的没救了。', score: 0, skill: 'judgment', feedback: '顺着他的绝望补刀，极其伤害。' },
            { text: '你应该跟爸妈好好沟通，别躲。', score: 30, skill: 'advice', feedback: '忽略了他的无力感，直接给建议。' }
          ],
          modelAnswer: '「我是不是没救了」——能问出这句话，说明你心里其实很想被拉一把、很想变好。抛开爸妈的催促，你自己最想要的那种生活，是什么样子的？',
          modelNote: '积极关注捕捉求助意愿，用现实疗法 WDEP 的第一步：厘清他真正「想要」的方向。'
        }
      ]
    },

    {
      id: 'stan',
      name: '斯坦（Stan）',
      age: 34,
      gender: '男',
      role: '贯穿全书案例',
      difficulty: 4,
      schools: ['精神分析', '阿德勒', '认知行为', '以人为中心'],
      summary: '低自尊、物质滥用、亲密关系困难、与父母冲突',
      background: 'Corey 教材的贯穿案例：低自尊、酒精与药物滥用、亲密关系屡屡失败、与父母长期冲突，偶有自杀念头。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '我不知道从哪说起。我的人生一团糟，工作、感情、跟家里人的关系，全都搞砸了。',
          emotion: 'flat',
          focus: '建立安全，共情，邀请而不催促。',
          targets: ['empathy', 'encouraging'],
          techniques: ['建立关系', '接纳'],
          bookRef: '第2章 咨询师 · 治疗关系',
          options: [
            { text: '听起来你有好多事压在心里，一时不知从何说起——这没关系，我们从你最想谈的地方开始，好吗？', score: 100, skill: 'encouraging', feedback: '接纳他的无从说起，把选择权交还给他。' },
            { text: '你的人生怎么就搞砸了？说具体点。', score: 30, skill: 'whyInterrogation', feedback: '追问式开头，缺乏安全感的铺垫。' },
            { text: '别灰心，重新开始就好。', score: 30, skill: 'reassurance', feedback: '过早的鼓励，绕开了他的沉重。' },
            { text: '你先冷静下来，整理好再说。', score: 0, skill: 'advice', feedback: '命令式，会让本就无助的他更受挫。' }
          ],
          modelAnswer: '听起来你心里压着很多事，一时不知从何说起——这完全没关系。我们就从此刻你最想谈的地方开始，好吗？',
          modelNote: '安全、共情、非指导性的开场，把节奏和选择权交给来访者。'
        },
        {
          clientText: '我喝酒、吃药，就是想让自己别那么难受。有时候晚上会想，也许消失了对大家都好。',
          emotion: 'flat',
          focus: '共情痛苦，评估自杀风险（安全第一）。',
          targets: ['empathy', 'openQuestion'],
          techniques: ['危机评估', '共情'],
          bookRef: '第3章 伦理 · 风险评估',
          options: [
            { text: '听起来那份痛苦重到你甚至想过「消失」来解脱——谢谢你愿意告诉我这么重要的话。我想认真了解一下：这种想法最近出现的频率高吗？有没有具体想过怎么做？', score: 100, skill: 'empathy', feedback: '先共情，再专业地评估风险，把安全放在第一位。' },
            { text: '你可千万别做傻事。', score: 30, skill: 'reassurance', feedback: '出于好意，但没评估风险，也不够专业。' },
            { text: '你这是抑郁症，得赶紧去医院。', score: 30, skill: 'labeling', feedback: '贴标签 + 急切转介，忽略了当下的陪伴。' },
            { text: '你想开点，很多人比你惨多了。', score: 0, skill: 'judgment', feedback: '比较式说教，可能加重他的绝望与羞耻。' }
          ],
          modelAnswer: '这份痛苦已经重到你甚至想过「消失」——谢谢你愿意把这么重要的话告诉我。我需要认真了解：这样的想法最近出现得频繁吗？你有没有具体想过怎么做？',
          modelNote: '先共情、再评估自杀风险（频率、计划、手段），安全永远优先。'
        },
        {
          clientText: '我爸妈从小就说我不行，我好像一直在证明他们是对的。',
          emotion: 'sad',
          focus: '探索早年经验与内在批判。',
          targets: ['empathy', 'exploringMeaning'],
          techniques: ['精神动力：早年经验', '内在批判者'],
          bookRef: '第4章 精神分析 · 第5章 阿德勒',
          options: [
            { text: '父母那句「你不行」似乎长成了你心里一个不断自我否定的声音。我很好奇，这个声音今天还在对你重复什么话？', score: 100, skill: 'exploringMeaning', feedback: '把外在批判内化理解为「内在的声音」，并具体化它的内容。' },
            { text: '过去的事就让它过去吧。', score: 30, skill: 'reassurance', feedback: '回避了早年经验对当下的持续影响。' },
            { text: '你父母也是为你好，别怪他们。', score: 0, skill: 'judgment', feedback: '替父母辩解，否认了他的真实伤害。' },
            { text: '你应该跟父母断绝来往。', score: 30, skill: 'advice', feedback: '极端建议，严重越界。' }
          ],
          modelAnswer: '父母那句「你不行」似乎已经内化成了你心里一个不断自我否定的声音。我很好奇，直到今天，这个声音还会对你说些什么？',
          modelNote: '精神动力/阿德勒取向：探索早年经验如何内化为「内在批判者」。'
        },
        {
          clientText: '我想改变，可我试过很多次，最后都回到老样子。',
          emotion: 'low',
          focus: '肯定意愿，具体化改变的努力与卡点。',
          targets: ['positiveRegard', 'concretizing'],
          techniques: ['肯定动机', '具体化'],
          bookRef: '第15章 整合取向',
          options: [
            { text: '你已经一次次地尝试改变，这份不放弃本身就很有力量。能不能说说，过去你「试过」的方法里，哪一次其实已经撑得比较久？那次是靠什么撑住的？', score: 100, skill: 'positiveRegard', feedback: '肯定坚持，并具体化「例外」——那次较成功的尝试里藏着资源。' },
            { text: '你要有毅力，坚持住。', score: 30, skill: 'advice', feedback: '把失败归咎于「没毅力」，忽视了他的努力。' },
            { text: '你根本就没真的想改。', score: 0, skill: 'judgment', feedback: '否定他的努力，极具伤害。' },
            { text: '慢慢来，别着急。', score: 30, skill: 'reassurance', feedback: '温和但空泛，没帮他找到卡点。' }
          ],
          modelAnswer: '你已经一次次地尝试改变，这份不放弃本身就很有力量。我很想知道，过去你尝试过的办法里，哪一次其实撑得最久？那一次，是靠什么撑住的？',
          modelNote: '肯定动机 + 探索「例外/资源」：找到曾经有效的小部分，作为改变的支点。'
        }
      ]
    },
    {
      id: 'xu_burnout',
      name: '许老师',
      age: 35,
      gender: '女',
      role: '中学语文教师',
      difficulty: 3,
      schools: ['现实/选择理论', '存在主义', '认知行为'],
      summary: '长期超负荷导致职业倦怠，意义感丧失，想辞职又不敢',
      background: '从教十二年，是同事眼中的「拼命三娘」。近一年课改压力、行政检查、家长投诉叠加，出现周日夜晚心慌、晨起胸闷，对教学失去热情，反复想辞职又被房贷与家庭责任「劝退」。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '一到周日晚上我就心慌，想到周一要站上讲台，胸口就发闷。我教了十几年书，以前还挺有成就感的，现在只剩累，一点热情都没有了。',
          emotion: 'flat',
          focus: '建立信任：先接住这份耗竭感，再澄清「从热情到负担」的转折点。',
          targets: ['empathy', 'openQuestion'],
          techniques: ['共情', '澄清转折点'],
          bookRef: '第11章 现实/选择理论 · 第6章 存在主义',
          options: [
            { text: '听起来这份工作已经快把你的力气耗尽了，连身体都在发出信号。我很好奇，从什么时候开始，站上讲台这件事从「有成就感」变成了负担？', score: 100, skill: 'empathy', feedback: '先情感反映接住耗竭感，再用开放式提问定位转折点，很稳。' },
            { text: '工作久了谁都会有倦怠期，这很正常。你具体是哪个环节最累？', score: 60, skill: 'normalization', feedback: '正常化有助于减轻羞耻，但「哪个环节最累」略显封闭，且过早转向解决问题。' },
            { text: '你应该请个长假出去旅游，好好散散心。', score: 30, skill: 'advice', feedback: '直接给建议，跳过了对感受的探索，也未必解决根本困境。' },
            { text: '你现在就是太消极了，当老师哪能没有热情？', score: 0, skill: 'judgment', feedback: '评判会让耗竭的来访者更自责、更防御。' }
          ],
          modelAnswer: '这份工作似乎已经快把你的力气耗尽了，连身体都在提醒你。我很好奇，从什么时候起，站上讲台从「有成就感」慢慢变成了负担？',
          modelNote: '先共情耗竭感，再用开放式提问帮来访者定位「热情消退」的时间线。'
        },
        {
          clientText: '我每天像个机器人一样，改作业、开会、应付检查。以前学生成绩提高了我会特别开心，现在什么都不想管，好像跟我没关系了。我是不是已经废了？',
          emotion: 'flat',
          focus: '情感反映 + 探索意义，把「热情没了」与自我价值感联系起来。',
          targets: ['reflectionFeeling', 'exploringMeaning'],
          techniques: ['情感反映', '探索意义'],
          bookRef: '第6章 存在主义 · 意义与价值',
          options: [
            { text: '曾经学生进步会让你开心，现在却什么都不想管——那种「热情没了」的感觉，是不是让你开始怀疑自己还有没有价值？', score: 100, skill: 'exploringMeaning', feedback: '把外在的倦怠拉回内在的意义与价值议题，精准且有深度。' },
            { text: '你说自己像机器人，可你分明还记得以前会为学生的进步开心，这好像并不像一台没感情的机器。', score: 60, skill: 'confrontation', feedback: '温和对质不错，但稍显理性化，先接住情绪再对质会更稳。' },
            { text: '你要学会劳逸结合，别把工作看得那么重。', score: 30, skill: 'advice', feedback: '说教式的建议，没有回应来访者对自我价值的怀疑。' },
            { text: '你这是典型的职业倦怠综合征，已经比较严重了。', score: 0, skill: 'labeling', feedback: '轻易下诊断，会把复杂的人标签化、病理化。' }
          ],
          modelAnswer: '曾经学生的进步会让你开心，现在却什么都不想管——那种「热情没了」的感觉，是不是让你开始怀疑自己这个人还有没有价值？',
          modelNote: '把倦怠从「工作层面」引向「存在/意义层面」，触碰更深层的议题。'
        },
        {
          clientText: '我想辞职，可房贷、孩子、父母的医药费都压在我身上，我不敢。可这样耗下去，我每天睁开眼都在想：活着到底图什么？',
          emotion: 'sad',
          focus: '共情两难，探索「真正想要的生活」，把决定权交还给他。',
          targets: ['empathy', 'goalSetting'],
          techniques: ['共情', '协作目标', '存在议题'],
          bookRef: '第6章 存在主义 · 第11章 现实/选择理论',
          options: [
            { text: '辞职的念头和不敢辞职的恐惧，每天都在拉扯你，这确实非常消耗人。我们不妨往后退一步：抛开那些现实压力，你内心深处真正想要的，是一个什么样的生活？', score: 100, skill: 'goalSetting', feedback: '共情两难，再用「目标澄清」把焦点从困局引向向往，方向清晰。' },
            { text: '「活着到底图什么」——这个问题似乎已经不只是工作的事了。你愿意多说一点，这个念头什么时候最强烈吗？', score: 60, skill: 'exploringMeaning', feedback: '很好，抓住了存在议题，但可以再给来访者一个「向往」的方向，而不只停留在痛苦上。' },
            { text: '别想那么多，熬过这一阵子就好了。', score: 30, skill: 'reassurance', feedback: '过早安慰会堵住对意义的探索，让来访者觉得被敷衍。' },
            { text: '你应该果断辞职，身体和健康才是最重要的。', score: 0, skill: 'advice', feedback: '替他做重大人生决定，严重越界，忽略了他真实的现实约束。' }
          ],
          modelAnswer: '辞职的念头和不敢辞职的恐惧，每天都在撕扯你，这的确非常消耗人。我们不妨先放下那些「应该」，问问自己：抛开现实压力，你真正想要的生活是什么样子的？',
          modelNote: '共情两难处境后，用「目标澄清」把视角从困局转向向往，为改变找到内在支点。'
        }
      ]
    }
  ];

  function getCase(id) {
    return CASES.find((c) => c.id === id) || null;
  }

  window.CASES = CASES;
  window.THEORIES = THEORIES;
  window.FOUNDATIONS = FOUNDATIONS;
  window.getCase = getCase;
})();
