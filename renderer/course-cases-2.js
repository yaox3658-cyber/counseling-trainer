// ===================== 课程教学案例（7~12） =====================
// 来自大学课程讲义《心理咨询技术与实务案例集》12 个脱敏教学案例，
// 已改编为可训练的多轮对话案例（原创脚本化对话，人物为虚构、已匿名化）。
// 采用「追加式」：加载后自行合并进 window.CASES，不改写 cases.js。
(function () {
  'use strict';

  const COURSE_CASES_2 = [
    {
      id: 'sz_xiaomei',
      name: '小梅',
      age: 19,
      gender: '女',
      role: '高三复读生',
      difficulty: 2,
      schools: ['以人为中心', '认知行为'],
      summary: '复读压力、敏感多疑、觉被老师同学排斥、在乎他人评价',
      background: '生长于单亲家庭，三岁时父母离异，跟随「重男轻女」的姥爷生活，母亲整天忙于生计无暇照顾。去年因填错选择题答题卡没能考上理想大学，目前插班复读。班主任评价成绩不错、上进心强，但内向敏感、没什么朋友。开学后被安排坐在最后一排，她埋怨「为什么把我流放到垃圾区」；第一次月考超水平发挥，但觉得班主任不相信。上课紧张，很在乎别人看法，同学一句玩笑话都要琢磨半天，说到伤心处郁闷好几天。',
      baselineEmotion: 'sad',
      turns: [
        {
          clientText: '老师把我安排在教室最后一排，凭什么？我不就是复读生吗，他是不是觉得我考不上，才把我流放到那个「垃圾区」？',
          emotion: 'angry',
          focus: '建立关系：先接住委屈与愤怒，不急着为老师辩解。',
          targets: ['reflectionFeeling', 'empathy'],
          techniques: ['建立关系', '共情'],
          bookRef: '实务课·共情性反馈｜第7章 以人为中心',
          options: [
            { text: '被安排在最后一排，你心里特别委屈，也觉得被轻视了——「垃圾区」这三个字，能听出你有多难受、多不服气。', score: 100, skill: 'reflectionFeeling', feedback: '接住愤怒与委屈，不评判、不辩解，先让情绪被看见。' },
            { text: '坐最后一排也不一定是因为复读生，你别多想。', score: 60, skill: 'reassurance', feedback: '急于否定她的感受，会让她觉得不被理解。' },
            { text: '你跟老师说过你想坐前面吗？', score: 30, skill: 'closedQuestion', feedback: '过早转向行动建议，跳过了她的情绪。' },
            { text: '复读生本来就不容易，你要低调一点。', score: 0, skill: 'advice', feedback: '带着偏见的「劝告」，会强化她的屈辱感。' }
          ],
          modelAnswer: '被安排在最后一排，你心里特别委屈，也觉得自己被轻视了。「垃圾区」这三个字，让我听出你有多难受、多不服气。',
          modelNote: '先共情愤怒与委屈，不急着分辨「老师是否故意」，把关系放在第一位。'
        },
        {
          clientText: '而且这次月考我明明超水平发挥了，可我看班主任那样子，根本不相信是我自己考的。我最讨厌被人怀疑。',
          emotion: 'angry',
          focus: '澄清「老师不信」是事实还是推测，引导她自己分辨。',
          targets: ['concretizing', 'openQuestion'],
          techniques: ['澄清', '具体化'],
          bookRef: '第10章 认知行为疗法 · 自动思维',
          options: [
            { text: '「超常发挥却觉得老师不信」，这对你伤害很大。我想请你回想一下：班主任具体做了什么、说了什么，让你确定他「根本不相信」？', score: 100, skill: 'concretizing', feedback: '用具体化请她区分「事实」与「推测」，既不争辩也不武断，很稳妥。' },
            { text: '老师一般不会这样，肯定是你误会了。', score: 60, skill: 'reassurance', feedback: '替老师打包票，可能让她觉得被否定。' },
            { text: '你很在乎老师怎么看你是吗？', score: 30, skill: 'closedQuestion', feedback: '封闭式提问，且略跳跃。' },
            { text: '你太敏感了，老师哪有空针对你。', score: 0, skill: 'judgment', feedback: '评判她「敏感」，会伤害她的自尊。' }
          ],
          modelAnswer: '「超常发挥却觉得老师不信」，这件事伤你伤得很深。我想请你回想得具体一点：班主任到底做了什么、说了什么，让你确定他「根本不相信」你？',
          modelNote: '用具体化帮她区分「事实」与「推测」，避免替任何一方下结论。'
        },
        {
          clientText: '其实……他也没明说，就是那个眼神、那种语气。我这个人很在乎别人怎么看我，同学一句玩笑话我都要琢磨好几天。',
          emotion: 'sad',
          focus: '探索「过度在乎他人评价」与自我价值的关系。',
          targets: ['exploringMeaning', 'paraphrase'],
          techniques: ['探索意义', '内容重述'],
          bookRef: '实务课·共情性倾听（冰山模型）｜第10章 认知行为疗法',
          options: [
            { text: '我听到你把别人的一个眼神、一句玩笑，都当成对自己价值的评判。这种「很在乎别人怎么看」的背后，是不是藏着一个疑问——「我到底够不够好、值不值得被认可」？', score: 100, skill: 'exploringMeaning', feedback: '重述「在乎评价」，并追问其背后对自我价值的疑问，切入核心。' },
            { text: '你不用太在乎别人，做好自己就行。', score: 60, skill: 'advice', feedback: '正确的废话，没触及她为何如此在乎。' },
            { text: '你从小到大是不是都特别在意别人？', score: 30, skill: 'closedQuestion', feedback: '封闭式提问，且有点贴标签的味道。' },
            { text: '你就是太玻璃心了，别这么脆弱。', score: 0, skill: 'judgment', feedback: '用「玻璃心」贬低她，会严重伤害关系。' }
          ],
          modelAnswer: '我听到你把别人的一个眼神、一句玩笑，都当成了对自己价值的评判。这种「很在乎别人怎么看」的背后，是不是藏着一个疑问——「我到底够不够好、值不值得被认可」？',
          modelNote: '把「在乎评价」联结到「自我价值」的深层议题，用探索意义引导她向内看。'
        },
        {
          clientText: '可能吧。我从小跟着姥爷长大，他重男轻女，我总觉得自己是多余的。去年又因为填错答题卡没考上，我更觉得自己没用。',
          emotion: 'tearful',
          focus: '触及早期经验：把「重男轻女」的创伤与「觉得自己没用」联结。',
          targets: ['reflectionFeeling', 'empathy'],
          techniques: ['共情', '探索早期经验'],
          bookRef: '实务课·共情性反馈｜第4章 精神分析 · 早期经验',
          options: [
            { text: '原来「觉得自己多余、没用」不是凭空来的，它从「重男轻女」的环境里就开始了，去年填错卡的事又狠狠戳了一下。这一路，你其实一直在努力证明自己有价值。', score: 100, skill: 'empathy', feedback: '把早期创伤与当前自我怀疑联结，并肯定其努力，共情深入。' },
            { text: '过去的事就别想了，现在努力就行。', score: 60, skill: 'reassurance', feedback: '急于跳过创伤，会让她觉得伤痛不被允许。' },
            { text: '重男轻女是姥爷的观念问题，不是你的错。', score: 30, skill: 'reframing', feedback: '道理对，但此刻需要先共情，再讲道理。' },
            { text: '你家里重男轻女，难怪你这么自卑。', score: 0, skill: 'labeling', feedback: '把家庭议题简单归为「你自卑」，会让她更受伤。' }
          ],
          modelAnswer: '我好像明白了——「觉得自己多余、没用」不是凭空冒出来的，它从「重男轻女」的环境里就开始了，去年填错答题卡的事又狠狠戳了它一下。这一路，你其实一直在拼命证明自己是有价值的。',
          modelNote: '把早期创伤与当前自我怀疑联结起来，并看见她一直以来的努力。'
        },
        {
          clientText: '对，我一直在证明。其实我成绩挺好的，月考也证明了。可能我该少盯着别人的脸色看。',
          emotion: 'relieved',
          focus: '巩固：肯定其能力与资源，把「少看别人脸色」落成行动。',
          targets: ['positiveRegard', 'goalSetting'],
          techniques: ['积极关注', '协作设定目标'],
          bookRef: '第7章 以人为中心 · 无条件积极关注｜第10章 认知行为疗法 · 家庭作业',
          options: [
            { text: '你能说出「其实我成绩挺好、月考也证明了」，这本身就是很大的力量。接下来，当你又想「老师是不是看不起我」时，愿不愿意试着先问问自己：我有什么证据？而不是直接相信那个念头？', score: 100, skill: 'goalSetting', feedback: '肯定其能力与觉察，并给一个具体可操作的「证据检验」作业。' },
            { text: '对，以后别管别人怎么想了。', score: 60, skill: 'advice', feedback: '口号式的建议，缺少具体方法。' },
            { text: '你成绩好是优势，继续努力保持。', score: 30, skill: 'reassurance', feedback: '只强调成绩，没接住她「少看脸色」的成长。' },
            { text: '你看，你其实什么都懂，就是爱钻牛角尖。', score: 0, skill: 'judgment', feedback: '前半句夸、后半句贬，反而打击她的信心。' }
          ],
          modelAnswer: '你能自己说出「其实我成绩挺好、月考也证明了」，这本身就是一种很大的力量。下次当那个「老师是不是看不起我」的念头再冒出来时，你愿不愿意先停一下，问问自己：我有什么证据？而不是立刻相信它。',
          modelNote: '积极关注她的能力与觉察，把「少看别人脸色」落成一个「找证据」的具体练习。'
        }
      ]
    },
    {
      id: 'sz_xiaoliu',
      name: '小刘',
      age: 15,
      gender: '女',
      role: '高一学生',
      difficulty: 3,
      schools: ['危机干预', '以人为中心'],
      summary: '宿舍孤立、抑郁、有被性骚扰与家庭不支持的创伤史、觉得活着没意义',
      background: '认为自己是一个很失败的人。上高一后觉得宿舍同学处处针对自己，平时说话别人要么不理睬、要么针对，因此常独来独往，有时一整天不与别人说话，与老师也少交流，只能和网友聊天放松，一回到学校就心情抑郁，甚至觉得活着没什么意义。初中时被男同学性骚扰，父母与老师不但没为自己做主，反而认为是自己行为不检点，对此很失望。亲戚都说自己是不听话叛逆的人。主动来辅导室求助。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '我觉得自己很失败，在学校里谁都不理我，连老师也不喜欢我。有时候我真觉得，活着挺没意思的。',
          emotion: 'flat',
          focus: '建立关系：接住孤独与无望，表达真诚的关心。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['建立关系', '共情'],
          bookRef: '实务课·共情性反馈｜伦理 · 安全评估',
          options: [
            { text: '听你说「觉得自己很失败、活着没意思」，我心里很担心你。一个人撑着这么大的孤独和无助，一定特别难。谢谢你愿意把这些讲给我听。', score: 100, skill: 'empathy', feedback: '真诚表达关心与感谢求助，接住无望感，为后续安全评估打基础。' },
            { text: '活着没意思这种话不能乱说，你要乐观一点。', score: 60, skill: 'preaching', feedback: '回避了关键信号，还可能让她觉得被说教、不被认真对待。' },
            { text: '同学们为什么不理你？', score: 30, skill: 'closedQuestion', feedback: '此刻转向追问原因，跳过了「活着没意思」这个更需要回应的信号。' },
            { text: '你才多大就说这种话，太不懂事了。', score: 0, skill: 'judgment', feedback: '指责她「不懂事」，极具伤害性，会让她更加绝望。' }
          ],
          modelAnswer: '听你说「觉得自己很失败、活着没意思」，我心里很担心你。一个人扛着这么大的孤独和无助，一定特别难。谢谢你愿意把这么重的话讲给我听。',
          modelNote: '先真诚共情无望感，表达关心与感谢求助——这是处理危机信号的第一步。'
        },
        {
          clientText: '就是有时候特别难受的时候，会想，要是我消失了，是不是就解脱了。',
          emotion: 'flat',
          focus: '安全评估：温和而直接地询问是否有伤害自己的想法。',
          targets: ['openQuestion', 'reflectionFeeling'],
          techniques: ['安全评估', '具体化'],
          bookRef: '伦理 · 安全评估与危机干预（保密例外）',
          options: [
            { text: '你说的这句话让我很担心你的安全，我想认真地问你：你刚才说「消失了就解脱了」，你有没有想过真的要伤害自己，或者已经做过什么？', score: 100, skill: 'openQuestion', feedback: '直接、不回避地评估自杀风险，措辞温和而具体，是危机干预的正确做法。' },
            { text: '你怎么能这么想呢，别胡思乱想了。', score: 60, skill: 'reassurance', feedback: '回避了风险，可能错过评估与保护的关键时机。' },
            { text: '你不会有事的，开心一点。', score: 30, skill: 'reassurance', feedback: '空洞的安慰，既没评估风险，也没接住情绪。' },
            { text: '你要知道自杀是不对的。', score: 0, skill: 'preaching', feedback: '道德评判会让她更羞耻、更不敢开口，非常危险。' }
          ],
          modelAnswer: '你这句话让我很担心你的安全，我想很认真地问你：刚才你说「消失了就解脱了」，你有没有真的想过伤害自己，或者已经做过什么？',
          modelNote: '不回避、不含糊地直接评估自杀风险，是助人者不可跳过的红线。'
        },
        {
          clientText: '有想过，但没做过。其实我更难受的是，初中的时候我被一个男同学欺负过，我去跟爸妈和老师说，他们却都怪我，说是我自己不检点。从那以后，我觉得没有一个人会站在我这边。',
          emotion: 'tearful',
          focus: '共情创伤与被辜负：接住「没人站在我这边」的绝望。',
          targets: ['reflectionFeeling', 'empathy'],
          techniques: ['共情', '情感反映'],
          bookRef: '实务课·共情性反馈｜伦理 · 创伤知情',
          options: [
            { text: '听到你被欺负后，最该保护你的人却反过来责怪你，我的心揪了一下。那种「没有一个人站在我这边」的绝望，换成谁都会很难撑下去。那不是你的错。', score: 100, skill: 'empathy', feedback: '共情被辜负的绝望，并明确「不是你的错」，有力地抚慰了创伤。' },
            { text: '事情都过去了，你要学会放下。', score: 60, skill: 'reassurance', feedback: '过早劝「放下」，会让她觉得这些痛不该被提。' },
            { text: '你当时为什么不报警？', score: 30, skill: 'whyInterrogation', feedback: '「为什么」式的质问，会让她再次感到被指责。' },
            { text: '一个巴掌拍不响，你要反思一下自己。', score: 0, skill: 'judgment', feedback: '对受害者二次伤害，绝对不可接受。' }
          ],
          modelAnswer: '听到你在被欺负之后，最该保护你的父母和老师反而责怪你，我的心揪了一下。那种「没有一个人站在我这边」的绝望，换作是谁都会很难撑下去。我想清楚地告诉你：那不是你的错。',
          modelNote: '共情被辜负的绝望，明确「不是你的错」，为受创者提供矫正性的情感体验。'
        },
        {
          clientText: '……谢谢你。从来没有人跟我说过「这不是我的错」。',
          emotion: 'sad',
          focus: '建立支持：肯定她的求助，让她知道自己并非孤立无援。',
          targets: ['positiveRegard', 'normalization'],
          techniques: ['积极关注', '正常化'],
          bookRef: '第7章 以人为中心 · 无条件积极关注｜伦理 · 支持系统',
          options: [
            { text: '你今天能主动来这里，还把这些最难开口的事讲出来，这本身就是一种非常勇敢的自救。你不是孤立无援的，至少从今天起，我会站在你这边。', score: 100, skill: 'positiveRegard', feedback: '肯定其求助的勇气，明确「我会站在你这边」，给她实实在在的支持感。' },
            { text: '你要多交朋友，别总是一个人。', score: 60, skill: 'advice', feedback: '泛泛的建议，忽略了她此刻更需要的是被支持而非被指导。' },
            { text: '其实老师同学也没有那么讨厌你。', score: 30, skill: 'reassurance', feedback: '否认她的体验，会削弱刚刚建立起的信任。' },
            { text: '你以后要坚强一点，别这么消极。', score: 0, skill: 'preaching', feedback: '说教式的「坚强」，对她此刻的脆弱毫无帮助。' }
          ],
          modelAnswer: '你今天能主动来到这里，还把这些最难开口的事讲出来，这本身就是一种非常勇敢的自救。我想让你知道，你不是孤立无援的——至少从今天起，我会站在你这边。',
          modelNote: '肯定求助的勇气，并明确提供支持，让她体验到「有人站在我这边」。'
        },
        {
          clientText: '好，那如果我又难受得不行、又想「消失」的时候，我该怎么办？',
          emotion: 'confused',
          focus: '巩固：制定安全计划，明确求助渠道与支持网络。',
          targets: ['goalSetting', 'empowerment'],
          techniques: ['安全计划', '协作设定目标'],
          bookRef: '伦理 · 安全计划与转介｜危机干预',
          options: [
            { text: '这个很重要，我们一起做个安全计划：当你又出现「消失」的念头时，先联系我或心理中心，24 小时也可以拨打心理援助热线；我们还可以一起列一两个你信得过、能马上找到的人。你愿意吗？', score: 100, skill: 'goalSetting', feedback: '把危机应对落成具体的安全计划（求助渠道+支持名单），并征得同意，专业且负责。' },
            { text: '你要答应我，不能再有这种想法了。', score: 60, skill: 'advice', feedback: '要一个「不再想」的承诺，既不现实也不等于安全计划。' },
            { text: '难受的时候就听听音乐、散散步。', score: 30, skill: 'advice', feedback: '只给了缓解情绪的小建议，没有针对高风险时刻的安全安排。' },
            { text: '你放心，很快会好起来的。', score: 0, skill: 'reassurance', feedback: '空洞的保证，在危机中既无效也不负责。' }
          ],
          modelAnswer: '这个特别重要，我们一起做一个安全计划，好吗？当你又出现「消失」的念头时，第一时间联系我或心理中心，24 小时也能打心理援助热线；我们再一起列出你能马上找到的一两个信得过的人。你愿意跟我一起做这个计划吗？',
          modelNote: '把危机应对落成可执行的安全计划（求助渠道+支持名单），并征得来访者同意，是负责任的收尾。'
        }
      ]
    },
    {
      id: 'sz_xiaoli',
      name: '小李',
      age: 19,
      gender: '男',
      role: '中职三年级学生',
      difficulty: 2,
      schools: ['现实疗法', '焦点解决', '认知行为'],
      summary: '就业焦虑、迷茫、无技能感、面试紧张、缺乏自信',
      background: '即将毕业的中职学生，面对择业感到迷茫，面对就业竞争压力感到焦虑。感觉三年中职生活过得太平淡，没学到任何一技之长，也不清楚未来想做什么。当初读中职是因中考落榜又不想过早进入社会。不善交际、没有可倾诉的朋友，作为成年人又不想让家人分担。每次求职面试都特别紧张、无法正常发挥，越来越缺乏自信，现在连面试都不敢赴约。',
      baselineEmotion: 'anxious',
      turns: [
        {
          clientText: '快毕业了，别的同学都有方向，我连自己想干什么都不知道，面试也一次比一次紧张，现在连约都不敢赴。',
          emotion: 'anxious',
          focus: '建立关系：接住迷茫与焦虑，不急于给建议。',
          targets: ['reflectionFeeling', 'empathy'],
          techniques: ['建立关系', '共情'],
          bookRef: '实务课·共情性反馈｜第11章 现实/选择理论',
          options: [
            { text: '听你说「别人都有方向，我连想干什么都不知道」，我感觉到一种很深的迷茫和压力。越想越紧张、越不敢去面试，这种循环一定让你很挫败。', score: 100, skill: 'empathy', feedback: '共情「迷茫+挫败」的双重感受，让来访者感到被理解。' },
            { text: '你要多投简历，别怕失败。', score: 60, skill: 'advice', feedback: '过早跳到行动建议，忽略了情绪。' },
            { text: '你是不是太不自信了？', score: 30, skill: 'closedQuestion', feedback: '封闭式提问，还暗含评判。' },
            { text: '中职毕业能找到工作就不错了，别挑三拣四。', score: 0, skill: 'judgment', feedback: '带着轻视的评判，会打击他的自尊。' }
          ],
          modelAnswer: '听你说「别人都有方向，我连自己想干什么都不知道」，我感觉到一种很深的迷茫，还有越来越不敢迈出那一步的压力。这个循环，一定让你很挫败。',
          modelNote: '共情迷茫与挫败，先建立信任，再谈规划。'
        },
        {
          clientText: '是啊，我觉得我这三年什么都没学到，一技之长都没有，去面试也不知道能跟人家说什么。',
          emotion: 'sad',
          focus: '澄清「什么都没学到」：具体化他的真实能力与经历。',
          targets: ['concretizing', 'openQuestion'],
          techniques: ['具体化', '澄清'],
          bookRef: '实务课·评估性会谈：收集信息｜第13章 焦点解决',
          options: [
            { text: '「三年什么都没学到」这句话，我想请你慢一点。这三年里，你有没有哪门课、哪件具体的事，是你能上手、或者做得比别人顺手一点的？哪怕很小。', score: 100, skill: 'concretizing', feedback: '用具体化去检验「什么都没学到」的绝对化结论，引导他看见被忽略的资源。' },
            { text: '你肯定学到了东西，只是你自己没发现。', score: 60, skill: 'reassurance', feedback: '断言式安慰，缺乏具体证据，说服力不足。' },
            { text: '你们专业都学些什么？', score: 30, skill: 'closedQuestion', feedback: '偏封闭且方向略偏，没直接回应他的自我否定。' },
            { text: '谁让你当初不努力呢。', score: 0, skill: 'judgment', feedback: '指责过去，会让他更否定自己。' }
          ],
          modelAnswer: '「三年什么都没学到」——这句话我想请你慢一点。这三年里，有没有哪门课、或者哪件具体的事，你是能上手、或者做得比周围人顺手一点的？哪怕是一件很小的事。',
          modelNote: '用具体化去松动「什么都没学到」的绝对化，帮他看见被忽略的资源与优势。'
        },
        {
          clientText: '嗯……其实我在班上修电脑、装系统挺在行的，同学手机电脑有问题都找我。可这算什么一技之长啊。',
          emotion: 'confused',
          focus: '识别「这不算一技之长」的自我贬低，肯定其优势。',
          targets: ['positiveRegard', 'paraphrase'],
          techniques: ['积极关注', '内容重述'],
          bookRef: '第13章 焦点解决 · 优势与例外｜第11章 现实疗法',
          options: [
            { text: '同学有问题都来找你——这说明在动手能力上，你是被大家认可和信赖的。可你却说「这算什么一技之长」，好像有点把真实的优势给否掉了。', score: 100, skill: 'positiveRegard', feedback: '用具体证据肯定其被信赖的能力，并温和点出「自我贬低」的模式，很有力。' },
            { text: '修电脑确实不算什么正式技能。', score: 60, skill: 'judgment', feedback: '附和了他的自我贬低，错失了肯定他的机会。' },
            { text: '你可以考个证书，把爱好变成技能。', score: 30, skill: 'advice', feedback: '方向可行，但先跳过了「肯定他」这一步。' },
            { text: '光会修电脑可找不到好工作。', score: 0, skill: 'judgment', feedback: '打击性的否定，会加重他的自卑。' }
          ],
          modelAnswer: '同学手机、电脑有问题都来找你——这说明在动手能力上，你是被大家认可、被信赖的。可我听到你说「这算什么一技之长」，好像把自己真实拥有的优势轻轻推开了。',
          modelNote: '用具体证据肯定其能力，并温和指出「自我贬低」的模式。'
        },
        {
          clientText: '可能我总盯着自己的不足吧。其实上次有个兼职让我去修设备，我做得还挺好的，就是面试的时候紧张得说不出话。',
          emotion: 'relieved',
          focus: '焦点解决：从例外与成功经验里找资源，处理面试紧张。',
          targets: ['exploringMeaning', 'reframing'],
          techniques: ['焦点解决·例外', '重构'],
          bookRef: '第13章 焦点解决 · 例外时刻｜第9章 行为疗法 · 放松',
          options: [
            { text: '你看，你已经有一个「做得挺好」的真实例子了。我们把它放大一点：那次兼职你做得好的时候，你做了什么、当时是什么状态？这种状态，能不能也带到面试里？', score: 100, skill: 'exploringMeaning', feedback: '聚焦例外与成功经验，并引导把成功状态迁移到面试，焦点解决取向很到位。' },
            { text: '面试就是熟能生巧，多练练就好了。', score: 60, skill: 'advice', feedback: '方向对，但没有利用他已有的成功经验。' },
            { text: '其实面试官也都很和善，不用怕。', score: 30, skill: 'reassurance', feedback: '空泛的安慰，没触及他紧张的具体原因。' },
            { text: '你能力不行，光会修设备有什么用。', score: 0, skill: 'judgment', feedback: '否定其能力，伤害极大。' }
          ],
          modelAnswer: '你看，你已经有一个「做得挺好」的真实例子了。我们把它放大一点：那次兼职你做得顺手的时候，你具体做了什么？当时是一种什么状态？这种状态，能不能也带到下一次面试里？',
          modelNote: '聚焦例外与成功经验，引导他把「做事时的自信」迁移到「面试情境」，是焦点解决的核心思路。'
        },
        {
          clientText: '那时候我是在做具体的事，就不紧张。可能面试的时候我也别想「我什么都不会」，就想着我能解决什么问题。',
          emotion: 'relieved',
          focus: '巩固：制定现实的小目标（WDEP 式的计划）。',
          targets: ['goalSetting', 'empowerment'],
          techniques: ['协作设定目标', '赋能'],
          bookRef: '第11章 现实疗法 · WDEP｜第13章 焦点解决',
          options: [
            { text: '这是个特别好的觉察。接下来这一周，你愿不愿意定一个小计划：把「我能解决什么问题」写成三句话，然后去赴一次之前不敢去的面试？哪怕只是去看看。', score: 100, skill: 'goalSetting', feedback: '把觉察落成具体、可执行的小目标，兼顾行动与可承受度，很扎实。' },
            { text: '对，所以你赶紧多去面试几次。', score: 60, skill: 'advice', feedback: '只催促行动，没有帮他准备「说什么」。' },
            { text: '你要相信自己，一定能找到工作。', score: 30, skill: 'reassurance', feedback: '泛泛的鼓励，缺少具体步骤。' },
            { text: '你现在状态挺好的，可以结案了。', score: 0, skill: 'reassurance', feedback: '草率宣布结案，忽略了他仍需要的支持。' }
          ],
          modelAnswer: '这是个特别好的觉察。接下来这一周，我们定一个小计划，好不好？你先把「我能解决什么问题」写成三句话，然后去赴一次你之前不敢去的面试——哪怕只是去看一眼、走个流程。',
          modelNote: '把觉察转化为可执行的 WDEP 式计划，兼顾行动与可承受度。'
        }
      ]
    },
    {
      id: 'sz_xiaoli_da',
      name: '小丽',
      age: 21,
      gender: '女',
      role: '大一学生',
      difficulty: 2,
      schools: ['以人为中心', '认知行为'],
      summary: '因家境外貌自卑、疏远朋友、萌生退学',
      background: '个子不高、比较瘦小、长相一般、成绩中等，父母职业为农民，家里有个姐姐，小时候穿姐姐的旧衣服。上大学后交了一个好朋友，但不久发现她和好朋友同时喜欢上一个男同学；好朋友长得比她漂亮、家庭条件也比她好，于是产生巨大自卑，尤其在喜欢的男生在场时更甚。于是疏远朋友和喜欢的男生，越来越自卑，觉得自己又丑又穷、没人喜欢，萌生退学想法，看到心理中心宣传单前来辅导。',
      baselineEmotion: 'sad',
      turns: [
        {
          clientText: '我最近特别难受，都不想上学了。我长得又丑又穷，肯定没人会喜欢我，不如退学算了。',
          emotion: 'sad',
          focus: '建立关系：接住自卑与孤独，不急着反驳。',
          targets: ['reflectionFeeling', 'empathy'],
          techniques: ['建立关系', '共情'],
          bookRef: '实务课·共情性反馈｜第7章 以人为中心',
          options: [
            { text: '听你说「又丑又穷、没人会喜欢我」，我感觉到你很自卑，也很孤独，甚至想用退学来逃离这一切。', score: 100, skill: 'empathy', feedback: '共情「自卑+孤独」，接住了她想退学背后的痛苦。' },
            { text: '你怎么能这么贬低自己呢，你并不丑。', score: 60, skill: 'reassurance', feedback: '急于否定她的自我评价，会让她觉得不被理解。' },
            { text: '是不是发生什么事了让你这么想？', score: 30, skill: 'closedQuestion', feedback: '封闭式提问，略早于共情。' },
            { text: '退学就能解决问题吗？你别冲动。', score: 0, skill: 'advice', feedback: '带着质疑的劝阻，会让她更想封闭自己。' }
          ],
          modelAnswer: '听你说「又丑又穷、没人会喜欢我」，我感觉到你很自卑，也很孤独，甚至想用退学来逃离这一切。',
          modelNote: '先共情自卑与孤独，不急着反驳她的自我评价。'
        },
        {
          clientText: '我本来交了一个好朋友，可我发现我和她都喜欢上了一个男生。她长得比我漂亮，家里也比我有钱，我怎么可能比得过她。',
          emotion: 'sad',
          focus: '澄清「比较」带来的自我否定，具体化这份自卑的来源。',
          targets: ['paraphrase', 'openQuestion'],
          techniques: ['内容重述', '澄清'],
          bookRef: '第10章 认知行为疗法 · 认知歪曲（比较）',
          options: [
            { text: '我听到你把自己和好朋友放在一起比较，然后得出「我比不过她、我不如她」的结论。这个比较，是什么时候开始变得特别强烈的？', score: 100, skill: 'paraphrase', feedback: '重述「比较→自我否定」的模式，用开放式提问追溯其来源。' },
            { text: '你朋友漂亮有钱，不代表你就差。', score: 60, skill: 'reframing', feedback: '想反驳，但略早，且说服力不足。' },
            { text: '那个男生知道你喜欢他吗？', score: 30, skill: 'closedQuestion', feedback: '突然转向具体八卦，偏离了她的情绪。' },
            { text: '你朋友比你优秀，你自卑也正常。', score: 0, skill: 'judgment', feedback: '认可「她比你优秀」的预设，强化了她的自卑。' }
          ],
          modelAnswer: '我听到你把自己和好朋友放在一起比较，然后得出了「我比不过她、我不如她」的结论。我想知道，这种「比不过」的感觉，是从什么时候开始变得特别强烈的？',
          modelNote: '重述「比较→自我否定」的模式，用开放式提问追溯来源。'
        },
        {
          clientText: '可能一直都有吧。我从小穿姐姐的旧衣服，家里条件不好，我一直觉得自己低人一等。',
          emotion: 'tearful',
          focus: '触及「低人一等」的核心信念，共情其由来已久。',
          targets: ['reflectionFeeling', 'exploringMeaning'],
          techniques: ['共情', '探索核心信念'],
          bookRef: '实务课·共情性倾听（冰山模型）｜第10章 认知行为疗法 · 核心信念',
          options: [
            { text: '原来「低人一等」这个念头，从你小时候就跟着你了，现在又在这段友谊和喜欢里被狠狠触发了。这个念头一定让你在很多关系里都很累、很没安全感。', score: 100, skill: 'reflectionFeeling', feedback: '把早年经验与当前自卑联结，共情其「由来已久」的疲惫。' },
            { text: '家里穷不是你的错，你要自信一点。', score: 60, skill: 'advice', feedback: '「自信一点」太空，没触及深层信念。' },
            { text: '你姐姐穿旧衣服，你也只是小时候穿。', score: 30, skill: 'reassurance', feedback: '纠结于细节，错过了她的情感。' },
            { text: '穷人的孩子早当家，你应该更坚强。', score: 0, skill: 'preaching', feedback: '说教且强化「穷人」标签，会伤害她。' }
          ],
          modelAnswer: '原来「低人一等」这个念头，从你小时候就跟着你了，现在又在这段友谊和喜欢里被狠狠地触发。带着这个念头，你在很多关系里一定都很累、很没有安全感。',
          modelNote: '把「低人一等」的核心信念与早年经验、当前困境联结，共情其由来已久。'
        },
        {
          clientText: '对，所以我干脆疏远了他们。可越疏远，我越觉得自己又丑又穷，没人会喜欢。',
          emotion: 'sad',
          focus: '温和对质「疏远→更孤独」的矛盾，重构自我价值。',
          targets: ['confrontation', 'reframing'],
          techniques: ['温和对质', '重构'],
          bookRef: '第10章 认知行为疗法 · 行为实验｜第7章 以人为中心',
          options: [
            { text: '我注意到一个循环：你越害怕「没人喜欢」，就越躲开他们；可一躲开，又更确信「没人喜欢我」。这像不像你亲手把验证的机会关在了门外？', score: 100, skill: 'confrontation', feedback: '温和点出「躲开→更确信没人喜欢」的自我应验循环，切中要害。' },
            { text: '你不该疏远朋友，这样朋友会伤心的。', score: 60, skill: 'advice', feedback: '从他人角度劝说，没触及她内心的恐惧。' },
            { text: '其实有人是喜欢你的，是你没发现。', score: 30, skill: 'reassurance', feedback: '缺乏证据的空洞安慰。' },
            { text: '你就是太自卑了，这样没人会喜欢你。', score: 0, skill: 'judgment', feedback: '把「没人喜欢」的责任推回给她，雪上加霜。' }
          ],
          modelAnswer: '我注意到一个循环：你越怕「没人喜欢」，就越躲开他们；可一旦躲开，又更确信「真的没人喜欢我」。这像不像你亲手把验证的机会关在了门外？',
          modelNote: '温和对质「疏远→更确信不被爱」的自我应验循环，为行为实验做铺垫。'
        },
        {
          clientText: '好像是……我都没给别人了解我的机会。也许我该试试，先不躲了。',
          emotion: 'relieved',
          focus: '巩固：把「不躲了」落成小行动，肯定其价值。',
          targets: ['goalSetting', 'empowerment'],
          techniques: ['协作设定目标', '赋能'],
          bookRef: '第9章 行为疗法 · 行为塑造｜第7章 以人为中心',
          options: [
            { text: '「我都没给别人了解我的机会」——这个觉察特别宝贵。接下来这一周，你愿不愿意做一件小事：主动约那位好朋友喝杯水、聊一次天，看看会发生什么？', score: 100, skill: 'goalSetting', feedback: '肯定觉察，并把「不躲了」落成一个具体、可尝试的小行动。' },
            { text: '对，你要多跟别人交往。', score: 60, skill: 'advice', feedback: '泛泛的鼓励，缺具体步骤。' },
            { text: '你本来就挺可爱的，别妄自菲薄。', score: 30, skill: 'reassurance', feedback: '夸赞没落到她刚获得的觉察上。' },
            { text: '退学的事就别再提了，安心读书。', score: 0, skill: 'advice', feedback: '命令式的收尾，抹掉了她刚才的成长。' }
          ],
          modelAnswer: '「我都没给别人了解我的机会」——这个觉察特别宝贵。接下来这一周，你愿不愿意做一件小事：主动约那位好朋友喝杯水、聊一次天，看看接下来会发生什么？',
          modelNote: '肯定她的觉察，把「不躲了」落成一个具体、可尝试的小行动。'
        }
      ]
    },
    {
      id: 'sz_xiaoli_gao',
      name: '小丽',
      age: 16,
      gender: '女',
      role: '高二学生',
      difficulty: 3,
      schools: ['危机干预', '认知行为', '家庭系统'],
      summary: '抑郁、有自伤与自杀念头、父母离异、被夹在父母中间',
      background: '近半年情绪持续低落、兴趣减退，有自伤行为和自杀念头，学习压力大、状态不佳、常拖欠作业，医院诊断为中度抑郁和轻度焦虑。从小父母感情不好，小学时离异，随母亲生活；母亲无固定工作、情绪不稳，小时候曾目睹母亲的自杀尝试。父亲再婚后，母亲常骚扰父亲，又常在小丽面前抱怨数落父亲，让小丽做两人之间的传声筒。在家常与母亲吵架。高中后学习一落千丈，觉得人际交往麻烦、没朋友。经班主任建议主动求助。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '我最近半年一直很低落，对什么都提不起兴趣，作业也不想写。有时候还会用刀片划自己，感觉那样能好受一点。',
          emotion: 'flat',
          focus: '建立关系：接住低落，认真回应自伤这个信号。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['建立关系', '共情'],
          bookRef: '实务课·共情性反馈｜伦理 · 安全评估',
          options: [
            { text: '听你说持续低落、还会用刀片伤害自己，我既心疼也很认真地在听。用这种方式让自己「好受一点」，说明你内心的痛苦真的很重。谢谢你愿意告诉我。', score: 100, skill: 'empathy', feedback: '认真、不回避地接住自伤信号，共情其痛苦，为安全评估开好头。' },
            { text: '自残对身体不好，你要控制住自己。', score: 60, skill: 'advice', feedback: '只讲危害，没先理解她为何这样做。' },
            { text: '你是不是最近学习压力太大了？', score: 30, skill: 'closedQuestion', feedback: '过早归因，跳过了更紧急的安全议题。' },
            { text: '你这样做对得起你妈妈吗？', score: 0, skill: 'judgment', feedback: '道德指责会让她更羞耻、更不敢求助，非常危险。' }
          ],
          modelAnswer: '听你说持续低落、还会用刀片伤害自己，我既心疼，也在很认真地听。用这种方式让自己「好受一点」，说明你心里的痛苦真的很重。谢谢你愿意把这些告诉我。',
          modelNote: '认真接住自伤信号，先共情其痛苦，为随后的安全评估建立信任。'
        },
        {
          clientText: '有时候特别难受的时候，我也会想，要是能消失就好了。',
          emotion: 'flat',
          focus: '安全评估：温和直接地询问自杀念头与具体计划。',
          targets: ['openQuestion', 'reflectionFeeling'],
          techniques: ['安全评估', '具体化'],
          bookRef: '伦理 · 安全评估与危机干预（保密例外）',
          options: [
            { text: '你提到「想消失」，这句话让我很担心你的安全，我想直接问你：你有没有真的想过结束自己的生命？如果有，你有没有想过具体怎么做？', score: 100, skill: 'openQuestion', feedback: '不回避、直接而具体地评估自杀风险（意念→计划→手段），是危机干预的正确做法。' },
            { text: '别说这种不吉利的话，你要想开点。', score: 60, skill: 'reassurance', feedback: '回避了关键风险信号，可能错过保护时机。' },
            { text: '你不会有事的，你还有妈妈。', score: 30, skill: 'reassurance', feedback: '空洞的安慰，既没评估风险，也可能并不准确。' },
            { text: '你这样说，会让关心你的人伤心的。', score: 0, skill: 'preaching', feedback: '用「让人伤心」施压，可能加重她的内疚与绝望。' }
          ],
          modelAnswer: '你提到「想消失」，这句话让我很担心你的安全，我想直接地问你：你有没有真的想过结束自己的生命？如果有，你有没有想过具体要怎么做？',
          modelNote: '不回避、不含糊地评估自杀风险（意念、计划、手段），这是不可跳过的红线。'
        },
        {
          clientText: '有想过，但没想好怎么做。其实我最难受的是，我妈总让我在中间传话，还在我面前说爸爸坏话，我小时候还见过她自杀。我觉得我活着就是他们吵架的工具。',
          emotion: 'tearful',
          focus: '共情「夹在父母中间」的创伤，理解其被工具化的痛苦。',
          targets: ['reflectionFeeling', 'empathy'],
          techniques: ['共情', '家庭系统'],
          bookRef: '实务课·共情性反馈｜第14章 家庭系统',
          options: [
            { text: '听到你从小被夹在父母中间、还要替大人传话，甚至见过妈妈自杀，我特别心疼。那种「我只是他们吵架的工具」的感觉，让你觉得自己不是被爱的孩子，而是被使用的。', score: 100, skill: 'empathy', feedback: '准确共情「被工具化」的痛苦，并点出「不是被爱而是被用」的深层受伤。' },
            { text: '你妈妈也是不容易，你要体谅她。', score: 60, skill: 'preaching', feedback: '站在大人立场要求她体谅，会加重她的委屈。' },
            { text: '你为什么不跟你妈说清楚呢？', score: 30, skill: 'whyInterrogation', feedback: '「为什么」式质问，会让她觉得被指责。' },
            { text: '你妈让你传话是不对的，你要拒绝。', score: 0, skill: 'advice', feedback: '虽有理，但此刻直接命令她「拒绝」，忽视了她做不到的困境。' }
          ],
          modelAnswer: '听到你从小被夹在父母中间、要替大人传话，甚至见过妈妈自杀，我特别心疼。那种「我只是他们吵架的工具」的感觉，让你觉得自己不是一个被爱着的孩子，而是一个被使用的东西。',
          modelNote: '共情「被工具化」的创伤，点出「不是被爱、而是被用」的深层受伤。'
        },
        {
          clientText: '……对，我就是这种感觉。可是他们毕竟是我爸妈，我又不能不管。',
          emotion: 'sad',
          focus: '建立保护：肯定其善良与努力，讨论边界与支持。',
          targets: ['positiveRegard', 'normalization'],
          techniques: ['积极关注', '正常化'],
          bookRef: '第7章 以人为中心 · 无条件积极关注｜第14章 家庭系统 · 边界',
          options: [
            { text: '你一边承受这么大的痛苦，一边还想着「他们毕竟是我爸妈」，我看到了你的善良，也看到你被这份责任压得很累。你不需要一个人扛这些——照顾自己的安全，才是现在最重要的。', score: 100, skill: 'positiveRegard', feedback: '肯定其善良，同时温和地把「保护自己」放到「照顾父母」之前，方向正确。' },
            { text: '你要学会跟他们划清界限。', score: 60, skill: 'advice', feedback: '「划清界限」太空，没考虑她当下的现实与情感。' },
            { text: '你父母的事让他们自己解决，你别管。', score: 30, skill: 'advice', feedback: '指令式建议，忽略了她「不能不管」的纠结。' },
            { text: '你既然知道是他们的问题，就别再难过了。', score: 0, skill: 'reassurance', feedback: '用「别难过」否定她的情绪，会让她更压抑。' }
          ],
          modelAnswer: '你一边承受这么大的痛苦，一边还想着「他们毕竟是我爸妈」，我看到了你的善良，也看到你被这份责任压得很累。我想让你知道，你不需要一个人扛这些——先照顾好自己的安全，才是现在最重要的事。',
          modelNote: '肯定她的善良与努力，温和地把「保护自己」放在优先位置。'
        },
        {
          clientText: '好。那如果我又想划自己、或者又想消失，我该怎么办？',
          emotion: 'confused',
          focus: '巩固：制定安全计划与专业支持（含转介），明确求助渠道。',
          targets: ['goalSetting', 'empowerment'],
          techniques: ['安全计划', '转介', '协作设定目标'],
          bookRef: '伦理 · 安全计划与转介｜危机干预',
          options: [
            { text: '我们一起做个安全计划：当你又想伤害自己时，先联系我或心理中心，24 小时可拨打心理援助热线；你已经在医院确诊，我们也要和医生保持联系。我还想和你一起列出两个能马上求助的人。可以吗？', score: 100, skill: 'goalSetting', feedback: '把安全计划、转介与支持名单一并纳入，专业、具体、负责。' },
            { text: '你要答应我，以后不能再伤害自己了。', score: 60, skill: 'advice', feedback: '要一个承诺，不等于安全计划，也难以兑现。' },
            { text: '难受的时候多听听音乐、出去走走。', score: 30, skill: 'advice', feedback: '只给了情绪缓解的小技巧，没有高风险时刻的安全安排。' },
            { text: '你还年轻，未来会好起来的。', score: 0, skill: 'reassurance', feedback: '空洞的保证，在危机中既无效也不负责。' }
          ],
          modelAnswer: '我们一起做一个安全计划，好吗？当你又想伤害自己时，第一时间联系我或心理中心，24 小时也能拨打心理援助热线；你已经在医院确诊，我们也要和医生保持联系。我还想和你一起列出两个能马上求助的人。',
          modelNote: '把安全计划、专业转介与支持网络一并落实，并征得同意，是负责任的收尾。'
        }
      ]
    },
    {
      id: 'sz_xiaodong',
      name: '小东',
      age: 20,
      gender: '男',
      role: '大二学生',
      difficulty: 3,
      schools: ['危机干预', '以人为中心', '家庭系统'],
      summary: '抑郁、强烈自我责备、母亲控制、自杀倾向、母亲不重视就医',
      background: '来自单亲家庭，不清楚爸爸是谁，妈妈是女强人。从小到大被妈妈压着，从不向妈妈表达不满与委屈，怕表露想法妈妈火气更大。经常责备自己，认为全都是自己的错。自述情绪低落、无法控制情绪，在学校正常，但一回家见到妈妈就紧张，妈妈一刺激自己就有自杀倾向、经常想跳楼。曾私自去医院看心理医生，诊断为中度抑郁，把报告拿给妈妈看，妈妈不重视还叫他以后别去看了。怕控制不住想吃药控制自杀念头。',
      baselineEmotion: 'flat',
      turns: [
        {
          clientText: '我控制不住自己的情绪，尤其一回家见到我妈就特别紧张。她一说我，我就特别难受，有时候会想从楼上跳下去。',
          emotion: 'flat',
          focus: '建立关系：接住无助与紧张，认真回应自杀倾向的信号。',
          targets: ['empathy', 'reflectionFeeling'],
          techniques: ['建立关系', '共情'],
          bookRef: '实务课·共情性反馈｜伦理 · 安全评估',
          options: [
            { text: '听你说一见到妈妈就紧张、还会冒出跳楼的念头，我很担心你，也在很认真地听。这种「控制不住」的感觉，一定让你又害怕又无助。', score: 100, skill: 'empathy', feedback: '认真接住自杀信号并共情「失控」的恐惧，为安全评估铺路。' },
            { text: '跳楼这种话不能随便说。', score: 60, skill: 'preaching', feedback: '回避了关键信号，还可能让他觉得被说教。' },
            { text: '你跟你妈妈关系一直这样吗？', score: 30, skill: 'closedQuestion', feedback: '过早转向关系议题，跳过了更紧急的安全问题。' },
            { text: '你一个大男人，怎么这么脆弱。', score: 0, skill: 'judgment', feedback: '性别刻板印象的指责，会让他更羞耻、更不敢求助。' }
          ],
          modelAnswer: '听你说一见到妈妈就紧张、还会冒出跳楼的念头，我很担心你，也在很认真地听。这种「控制不住」的感觉，一定让你又害怕又无助。',
          modelNote: '认真接住自杀倾向的信号，共情「失控」的恐惧。'
        },
        {
          clientText: '我经常有想跳楼的想法，尤其我妈一刺激我。我怕哪天真的控制不住。',
          emotion: 'flat',
          focus: '安全评估：直接询问自杀意念的频率与具体计划。',
          targets: ['openQuestion', 'reflectionFeeling'],
          techniques: ['安全评估', '具体化'],
          bookRef: '伦理 · 安全评估与危机干预（保密例外）',
          options: [
            { text: '你经常有想跳楼的念头，这非常需要重视。我想直接问你：这种念头一般多久出现一次？最近一次出现时，你有没有想过具体的时间、地点或方式？', score: 100, skill: 'openQuestion', feedback: '具体评估自杀意念的频率与计划，态度认真而克制，是负责任的评估。' },
            { text: '别想这些了，多想点开心的事。', score: 60, skill: 'reassurance', feedback: '回避了风险，可能错过保护与转介的时机。' },
            { text: '你会不会真的跳？', score: 30, skill: 'closedQuestion', feedback: '太突兀、太封闭，容易让他敷衍或防御。' },
            { text: '你知道跳楼会连累家人吗？', score: 0, skill: 'preaching', feedback: '用「连累家人」施压，会加重他的内疚，非常危险。' }
          ],
          modelAnswer: '你经常有想跳楼的念头，这非常需要认真对待。我想直接问你：这种念头一般多久会出现一次？最近一次出现时，你有没有想过具体的时间、地点，或者用什么样的方式？',
          modelNote: '具体评估自杀意念的频率与计划，认真而克制，为后续转介与安全计划打基础。'
        },
        {
          clientText: '最近挺频繁的，一回家就会想。我总觉得这些都是我的错——我从小就这样，从来不跟我妈顶嘴，怕她火气更大。',
          emotion: 'sad',
          focus: '探索「全是我的错」的自我责备，与母亲控制的关系。',
          targets: ['paraphrase', 'exploringMeaning'],
          techniques: ['内容重述', '家庭系统'],
          bookRef: '实务课·共情性倾听（冰山模型）｜第14章 家庭系统',
          options: [
            { text: '我听到你总把责任都揽到自己身上——「都是我的错」。好像从小你就学会了用「压抑自己、不顶嘴」来避免妈妈更大的火气。这种习惯，是不是让你把太多本不属于你的错也背了下来？', score: 100, skill: 'paraphrase', feedback: '重述「过度自我归责」的模式，并把它与「怕妈妈火大」的生存策略联结，切入精准。' },
            { text: '你妈妈脾气不好，你也没办法。', score: 60, skill: 'reassurance', feedback: '把问题外归因，虽想安慰，但没触及他「自我责备」的模式。' },
            { text: '你为什么不跟你妈说说你的想法？', score: 30, skill: 'whyInterrogation', feedback: '「为什么」式质问，忽视了他「不敢说」的深层原因。' },
            { text: '你总说是你的错，说明你确实有问题。', score: 0, skill: 'judgment', feedback: '认可他的自我责备，极具伤害性。' }
          ],
          modelAnswer: '我听到你总把责任都揽到自己身上——「都是我的错」。好像从小你就学会了用「压抑自己、不顶嘴」来避免妈妈更大的火气。这个习惯，是不是让你把很多本不该你背的错，也一起背了下来？',
          modelNote: '重述「过度自我归责」的模式，并把它与「怕妈妈火大」的生存策略联结。'
        },
        {
          clientText: '可能是吧。其实我偷偷去看过心理医生，确诊中度抑郁。我拿报告给我妈看，她却说别浪费钱、以后别去了。我挺绝望的。',
          emotion: 'sad',
          focus: '肯定其主动就医，处理「不被妈妈重视」的绝望。',
          targets: ['positiveRegard', 'reframing'],
          techniques: ['积极关注', '重构'],
          bookRef: '伦理 · 能力边界与转介｜第7章 以人为中心',
          options: [
            { text: '你自己一个人偷偷去确诊、还想着要继续治疗，这其实是特别了不起的自救。妈妈没重视，不是你的错，也不是你不需要帮助的理由——你需要，而且你配得到这些帮助。', score: 100, skill: 'positiveRegard', feedback: '肯定其主动就医的勇气，并把「妈妈不重视」与「他需要帮助」分开，很有力量。' },
            { text: '你妈可能也是担心你，别怪她。', score: 60, skill: 'reframing', feedback: '替妈妈开脱，可能让他更觉得自己的痛苦不被看见。' },
            { text: '你可以再劝劝你妈。', score: 30, skill: 'advice', feedback: '把求助的责任又推回给他，加重其负担。' },
            { text: '既然你妈不支持，那就算了。', score: 0, skill: 'advice', feedback: '劝他放弃治疗，非常危险。' }
          ],
          modelAnswer: '你自己一个人偷偷去确诊、还想着要继续治疗，这其实是特别了不起的自救。妈妈没有重视，不是你的错，也绝不等于你不需要帮助——你需要，而且你完全配得到这些帮助。',
          modelNote: '肯定其主动就医的勇气，把「妈妈不重视」与「他需要帮助」分开。'
        },
        {
          clientText: '谢谢。可我还是怕自己哪天控制不住，尤其是回家的时候。',
          emotion: 'confused',
          focus: '巩固：制定安全计划与专业转介，明确高危情境的应对。',
          targets: ['goalSetting', 'empowerment'],
          techniques: ['安全计划', '转介', '协作设定目标'],
          bookRef: '伦理 · 安全计划与转介｜危机干预',
          options: [
            { text: '你的担心很合理，我们一起做个安全计划：当你感觉快控制不住时，立刻联系我或心理中心，24 小时打心理援助热线；我们继续推进正规的精神科治疗。再列一两个你能马上求助的人。可以吗？', score: 100, skill: 'goalSetting', feedback: '把安全计划、专业转介与支持名单一并落实，并针对「回家」这一高危情境，专业负责。' },
            { text: '你要控制住自己，别冲动。', score: 60, skill: 'advice', feedback: '要一个「控制住」的承诺，不等于有效的安全安排。' },
            { text: '你暂时别回家了，搬出去住。', score: 30, skill: 'advice', feedback: '给了一个不一定可行、且没征得同意的指令。' },
            { text: '你能想开就没事了。', score: 0, skill: 'reassurance', feedback: '把严重的抑郁与自杀风险轻描淡写，既不专业也不负责。' }
          ],
          modelAnswer: '你的担心非常合理，我们一起做个安全计划：当你感觉快控制不住时，立刻联系我或心理中心，24 小时也能拨打心理援助热线；同时我们继续推进正规的精神科治疗。再一起列出两个你能马上求助的人，可以吗？',
          modelNote: '把安全计划、专业转介与支持网络一并落实，并针对「回家」这一高危情境，是负责任的收尾。'
        }
      ]
    }
  ];

  // 追加合并进案例库（排在 course-cases-1 之后）
  window.CASES = (window.CASES || []).concat(COURSE_CASES_2);
  window.COURSE_CASES_2 = COURSE_CASES_2;
})();
