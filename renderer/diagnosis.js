// ===================== 诊断训练 · 模块逻辑 =====================
// 依赖 window.DX_CASES / window.DX_CATEGORIES（diagnosis-cases.js）。
// 暴露 window.DIAGNOSIS = { render }，由 app.js 在切到「诊断训练」tab 时调用。
// 四个子区：诊断判断（案例库 + 即时判题解析）、初步判断地图、诊断标准（ICD-11/CCMD-3 速查）、生成案例（离线规则 + 可选大模型）。
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORE_KEY = 'ct_dx_v1';

  const state = {
    area: 'quiz',          // 'quiz' | 'map' | 'ref'
    cat: 'all',            // 当前筛选类别
    current: null,         // 当前诊断案例（库内或生成）
    answered: false,
    generated: false,
    userChoice: null,      // 学员本题选择的下标（供大模型深度解析）
    mapCase: null          // 地图区选中的案例
  };

  // ---------- 工具 ----------
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffleIdx(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function toast(msg) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- 逐项辨析：为每个选项生成一句“区别点 / 错误理由” ----------
  const SYN = [['ADHD', '注意缺陷多动障碍'], ['多动症', '注意缺陷多动障碍'], ['PTSD', '创伤后应激障碍'], ['NSSI', '非自杀性自伤']];
  function expandSyn(s) { for (const p of SYN) s = s.split(p[0]).join(p[1]); return s; }
  function clauseFor(optionName, differential) {
    const full = String(optionName || '').trim();
    const stripped = full.replace(/[（(][^）)]*[)）]/g, '').trim();
    const d = String(differential || '');
    const clauses = d.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
    if (!full || !clauses.length) return '';
    const names = [full, stripped].filter((n) => n.length >= 2);
    for (const c of clauses) {
      const lead0 = c.replace(/^排除「[^」]+」[：:]\s*/, '');
      const lead = expandSyn(lead0);
      for (const nm of names) {
        // 最长公共前缀（≥2 字）
        let head = '';
        for (let n = 2; n <= Math.min(nm.length, 8); n++) {
          const p = lead.slice(0, n);
          if (nm.indexOf(p) >= 0) head = p; else break;
        }
        if (head.length >= 2) return lead0;
        // 选项首 2 字出现在句子开头 10 字内
        if (lead.slice(0, 10).indexOf(nm.slice(0, 2)) >= 0) return lead0;
      }
    }
    return '';
  }
  function optNote(c, i) {
    const a = c.analysis || {};
    if (Array.isArray(a.optionNotes) && a.optionNotes[i]) return a.optionNotes[i];
    if (i === c.answer) return '正确：本案例的核心表现符合该诊断（详见「诊断依据」）。';
    const clause = clauseFor(c.options[i], a.differential);
    return clause ? '排除理由：' + clause.replace(/[。；;]+$/, '') : '该选项与正确答案的区别见「鉴别要点」。';
  }

  // ---------- 进度存取 ----------
  function loadStore() {
    try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch (e) {}
    return { stats: {}, history: [] };
  }
  function saveStore(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

  // ---------- 离线生成模板（每个 = 一个明确诊断） ----------
  const GEN = [
    { cat: 'mood', disorder: '抑郁发作（重性抑郁症）', ref: 'ICD-11 6A70 · CCMD-3 32', age: [22, 28, 35, 45, 52], dur: ['近 1 个月', '近 2 个月', '近 6 周'],
      lead: '{dur}持续情绪低落、对什么都提不起兴趣、每天没精力',
      symptoms: ['早醒、睡眠浅', '食欲下降、体重减轻', '自责、觉得自己没用', '有时觉得活着没意思', '注意力难集中、不想见人'],
      basis: '存在情绪低落、兴趣/快感丧失、精力减退等核心症状并持续≥2周，社会功能受损，符合抑郁发作。',
      distractors: [
        { name: '双相障碍', why: '双相需有躁狂/轻躁狂发作史，本案例无躁狂表现。' },
        { name: '适应障碍', why: '适应障碍有明确应激源且程度较轻、与应激源直接相关。' },
        { name: '恶劣心境障碍', why: '恶劣心境为持续≥2年的慢性轻抑郁，本案例为近期急性起病。' }
      ],
      examples: ["例如：持续 2 周以上的情绪低落、兴趣减退、早醒、食欲下降、自责，符合抑郁发作的核心症状。"],
      map: { problems: ['持续情绪低落、兴趣减退', '睡眠与食欲差、自责', '精力减退、回避社交'], needs: '胜任感与被认可', earlyAdversity: '', cognition: { self: '我没用、是个负担', others: '别人也帮不了我', world: '没有希望', condition: '如果我没价值，就不值得被爱' }, corePain: '低落、绝望、自责', maladaptive: '回避社交、躺卧不动', roots: ['可能存在的负性认知模式', '近期压力事件'], triggers: ['近期应激或无明显诱因'], resources: ['有求助行为', '可评估社会支持'], quizDistractor: '关系妄想与评论性幻听' }
    },
    { cat: 'mood', disorder: '躁狂发作', ref: 'ICD-11 6A60 · CCMD-3 30', age: [22, 26, 31, 38], dur: ['近 1 周', '近 2 周'],
      lead: '{dur}异常兴奋、话多、自我感觉极好',
      symptoms: ['每天只睡 2~3 小时仍精力充沛', '乱花钱、乱投资', '管闲事、易激惹', '自认能力超群', '想法一个接一个停不下来'],
      basis: '情感高涨、思维奔逸、活动增多，睡眠需要减少，持续≥1周，社会功能受损，符合躁狂发作。',
      distractors: [
        { name: '精神分裂症', why: '精神分裂症情感不协调、有思维破裂与幻觉妄想，本案例情感协调高涨。' },
        { name: '注意缺陷多动障碍', why: 'ADHD 起病于童年且无典型情感高涨。' },
        { name: '抑郁发作', why: '抑郁以情绪低落、兴趣丧失为核心，与本案例相反。' }
      ],
      examples: ["例如：每天只睡 2-3 小时仍精力充沛、乱花钱、话多易激惹，持续 1 周以上，符合躁狂发作。"],
      map: { problems: ['情感高涨、活动增多', '睡眠需求减少', '冲动消费与易激惹'], needs: '自我价值与掌控感', earlyAdversity: '', cognition: { self: '我是天才、无所不能', others: '别人都跟不上我', world: '充满机会', condition: '只要我够快够强，就能掌控一切' }, corePain: '易激惹、内在不安', maladaptive: '冲动行为、鲁莽决定', roots: ['生物因素（心境障碍易感性）'], triggers: ['可能无明确诱因'], resources: ['有就医机会', '家属支持'], quizDistractor: '持续情绪低落与兴趣丧失' }
    },
    { cat: 'mood', disorder: '双相障碍', ref: 'ICD-11 6A60/6A61 · CCMD-3 31', age: [24, 30, 36], dur: ['本次为情绪低落近 1 个月'],
      lead: '本次{dur}、失眠、兴趣下降来诊；追问病史，过去曾有一段“心情极好、话多、乱花钱、睡眠少”持续 2~3 周的时期',
      symptoms: ['情绪低落、兴趣下降', '失眠、早醒', '精力减退', '既往有轻躁狂/躁狂发作史'],
      basis: '当前为抑郁相，既往存在明确躁狂/轻躁狂发作史，符合双相障碍（治疗需心境稳定剂，勿单用抗抑郁药）。',
      distractors: [
        { name: '抑郁发作', why: '单纯抑郁无躁狂/轻躁狂发作史。' },
        { name: '环性心境障碍', why: '环性心境为长期轻躁狂与轻抑郁交替但均未达发作标准。' },
        { name: '边缘型人格障碍', why: '边缘型以情绪与关系不稳定为核心，不构成完整情感发作。' }
      ],
      examples: ["例如：当前为抑郁、但既往有过 2-3 周的兴奋话多、乱花钱、睡眠少，提示双相障碍。"],
      map: { problems: ['当前抑郁发作', '既往轻躁狂/躁狂发作', '情绪两极波动'], needs: '稳定与掌控', earlyAdversity: '', cognition: { self: '我控制不住自己的情绪', others: '别人不理解我', world: '不可预测', condition: '如果情绪失控，我就会毁掉一切' }, corePain: '低落与亢奋交替、羞耻', maladaptive: '情绪剧烈波动', roots: ['遗传与生物易感性'], triggers: ['应激或季节变化'], resources: ['有就医史', '家庭支持'], quizDistractor: '持续性被害妄想' }
    },
    { cat: 'anxiety', disorder: '广泛性焦虑障碍', ref: 'ICD-11 6B00 · CCMD-3 43.22', age: [30, 38, 46, 55], dur: ['近 6 个月', '近 8 个月'],
      lead: '{dur}几乎每天为工作、家庭、健康等多件事过度担心、控制不住',
      symptoms: ['坐立不安、易疲劳', '注意力难集中', '肌肉紧张、颈肩发紧', '入睡困难、睡眠浅'],
      basis: '对多件事的过度焦虑与担心持续≥6个月，伴多种症状并引起功能损害，符合广泛性焦虑障碍。',
      distractors: [
        { name: '惊恐障碍', why: '惊恐障碍为发作性濒死感，而非持续性弥散担忧。' },
        { name: '抑郁发作', why: '抑郁以情绪低落、兴趣丧失为核心。' },
        { name: '强迫症', why: '强迫症有强迫观念/行为与反强迫冲突，担心内容局限。' }
      ],
      examples: ["例如：半年多几乎每天为工作、健康、家庭多件事过度担心、肌肉紧张、入睡困难，符合广泛性焦虑。"],
      map: { problems: ['过度担心、控制不住', '肌肉紧张、睡眠差', '易疲劳、注意力下降'], needs: '安全感与确定感', earlyAdversity: '', cognition: { self: '我应付不了突发状况', others: '未来不可依赖', world: '充满危险与不确定', condition: '如果我不提前担心，坏事就会发生' }, corePain: '焦虑、紧张', maladaptive: '反复担忧、回避决策', roots: ['易焦虑人格特质', '慢性压力'], triggers: ['工作/生活压力'], resources: ['有求助意愿', '社会功能基本保持'], quizDistractor: '坚信自己已患绝症' }
    },
    { cat: 'anxiety', disorder: '惊恐障碍', ref: 'ICD-11 6B01 · CCMD-3 43.21', age: [24, 29, 35, 42], dur: ['近 2 个月', '近 3 个月'],
      lead: '{dur}反复突发心慌、呼吸困难、濒死感，每次持续十几分钟，发作时意识清楚、事后能回忆',
      symptoms: ['担心再次发作', '发作间期不敢独处', '多次查心脏无异常'],
      basis: '反复发作性惊恐，1个月内发作≥3次或持续担心再发≥1个月，排除躯体疾病，符合惊恐障碍。',
      distractors: [
        { name: '广泛性焦虑障碍', why: '广泛性焦虑为持续性焦虑，而非发作性。' },
        { name: '躯体疾病（心脏病）', why: '多次检查无异常可排除器质性疾病。' },
        { name: '分离障碍', why: '分离障碍有身份/记忆等解离症状，无典型惊恐发作。' }
      ],
      examples: ["例如：突发心慌、濒死感、出汗，10 分钟内达峰、数分钟到数十分钟缓解，多次查心脏无异常，符合惊恐障碍。"],
      map: { problems: ['发作性惊恐、濒死感', '预期焦虑、回避'], needs: '安全感与掌控', earlyAdversity: '', cognition: { self: '我身体要失控了', others: '没人能及时救我', world: '危险无处不在', condition: '如果发作时没人帮我，我就会死' }, corePain: '恐惧、无助', maladaptive: '回避、过度关注身体', roots: ['自主神经易激惹'], triggers: ['无明确诱因的发作'], resources: ['多次就医排除器质性', '有求助意愿'], quizDistractor: '对社交场合的持续恐惧' }
    },
    { cat: 'phobia', disorder: '社交焦虑障碍', ref: 'ICD-11 6B04 · CCMD-3 43.12', age: [19, 22, 26], dur: ['近 1 年', '近半年'],
      lead: '{dur}害怕见人、尤其当众说话或被注视，一说话就脸红、心跳、出汗',
      symptoms: ['不敢抬头看人', '尽量回避社交场合', '严重影响学习工作、内心痛苦'],
      basis: '对社交场合的显著恐惧并回避，担心被负面评价，知道恐惧过分却无法控制，符合社交焦虑障碍。',
      distractors: [
        { name: '回避型人格障碍', why: '回避型人格为更广泛、更持久（自幼）的人际退缩模式。' },
        { name: '广场恐惧症', why: '广场恐惧害怕难以逃离的场所，而非人际场景。' },
        { name: '特定恐惧症', why: '特定恐惧针对具体事物/情境，而非社交。' }
      ],
      examples: ["例如：当众说话就脸红、心跳、出汗，害怕被负面评价并回避社交，符合社交焦虑障碍。"],
      map: { problems: ['社交场合的恐惧与回避', '脸红、心跳等躯体反应', '担心被负面评价'], needs: '被接纳与认可', earlyAdversity: '', cognition: { self: '我会出丑、显得很笨', others: '别人都在评判我', world: '社交是危险的', condition: '如果我表现不好，就会被嘲笑排斥' }, corePain: '羞耻、紧张', maladaptive: '回避社交', roots: ['可能有过当众受挫经历'], triggers: ['需要当众表现的场合'], resources: ['有改变的意愿', '社交技能尚可'], quizDistractor: '害怕难以逃离的封闭场所' }
    },
    { cat: 'phobia', disorder: '广场恐惧症', ref: 'ICD-11 6B02 · CCMD-3 43.11', age: [30, 38, 45], dur: ['近 8 个月', '近 1 年'],
      lead: '{dur}害怕独自外出、乘公交、进商场或排队，担心一旦不适会无法逃离或无人帮助',
      symptoms: ['尽量不出门', '出门需家人陪同', '在家或有人陪时焦虑明显减轻'],
      basis: '对难以逃离或无法获得帮助的场所/情境的恐惧与回避，符合广场恐惧症。',
      distractors: [
        { name: '社交焦虑障碍', why: '社交焦虑怕被审视评价，而非怕无法逃离。' },
        { name: '惊恐障碍', why: '惊恐障碍为自发性发作，本案例无自发惊恐。' },
        { name: '特定恐惧症', why: '特定恐惧针对单一具体刺激。' }
      ],
      examples: ["例如：害怕独自乘公交、进商场，担心一旦不适无法逃离或无人帮助，符合广场恐惧症。"],
      map: { problems: ['外出/公共场所的恐惧与回避', '需他人陪同'], needs: '安全感与可逃离感', earlyAdversity: '', cognition: { self: '我会在公共场所失控', others: '没人能帮我', world: '外面的世界危险', condition: '如果离开家，我就会陷入无法逃脱的困境' }, corePain: '恐惧、被困感', maladaptive: '回避外出', roots: ['可能曾有过惊恐/不适体验'], triggers: ['外出或去公共场所'], resources: ['家庭支持', '居家功能尚可'], quizDistractor: '害怕与人目光接触' }
    },
    { cat: 'phobia', disorder: '特定恐惧症', ref: 'ICD-11 6B03 · CCMD-3 43.13', age: [14, 20, 28, 35], dur: ['从小', '近 3 年'],
      lead: '{dur}对某种具体事物（如高处/血液/动物/密闭空间）强烈恐惧，一接触就心慌、出冷汗、想逃',
      symptoms: ['回避相关刺激', '恐惧与现实危险不相称', '明知过度仍无法控制'],
      basis: '对特定刺激的显著恐惧与回避，与现实危险不相称，符合特定恐惧症。',
      distractors: [
        { name: '广场恐惧症', why: '广场恐惧针对广泛场所并担心无法逃离，而非单一事物。' },
        { name: '惊恐障碍', why: '惊恐障碍为自发性发作，无特定触发刺激。' },
        { name: '广泛性焦虑障碍', why: '广泛性焦虑为弥散性担心，而非针对特定刺激。' }
      ],
      examples: ["例如：一见血就心慌、出冷汗、想逃，明知过度仍无法控制，符合特定恐惧症。"],
      map: { problems: ['对特定刺激的恐惧与回避'], needs: '安全可控', earlyAdversity: '', cognition: { self: '我面对它会受不了', others: '', world: '那东西很危险', condition: '只要避开它，我就安全了' }, corePain: '恐惧', maladaptive: '回避', roots: ['可能有过相关恐惧经历或习得'], triggers: ['接触/想到特定刺激'], resources: ['回避外功能基本正常'], quizDistractor: '广泛的无对象担心' }
    },
    { cat: 'ocd', disorder: '强迫症', ref: 'ICD-11 6B20 · CCMD-3 43.3', age: [22, 28, 34, 41], dur: ['近 1 年', '近半年'],
      lead: '{dur}反复出现自己明知不必要却控制不住的念头/冲动，并反复做某些动作来缓解',
      symptoms: ['不洗/不检查就焦虑、做了才暂时缓解', '明知过度却无法自控', '每天耗时>1小时、影响工作生活'],
      basis: '存在强迫观念与强迫行为，自我强迫与反强迫并存、冲突导致痛苦，符合强迫症。',
      distractors: [
        { name: '强迫型人格障碍', why: '强迫型人格是一贯完美主义人格模式，无强迫-反强迫冲突与痛苦。' },
        { name: '广泛性焦虑障碍', why: '广泛性焦虑为弥散担心，无仪式行为。' },
        { name: '特定恐惧症', why: '特定恐惧针对具体刺激，无强迫仪式。' }
      ],
      examples: ["例如：反复洗手、反复检查门锁，明知不必仍控制不住、每天耗时超 1 小时，符合强迫症。"],
      map: { problems: ['强迫观念与强迫行为', '焦虑痛苦、功能受损'], needs: '确定感与可控感', earlyAdversity: '', cognition: { self: '我必须确保万无一失', others: '', world: '不确定=危险', condition: '如果不反复确认，就会有坏事发生' }, corePain: '焦虑、自责', maladaptive: '反复仪式行为', roots: ['过度责任感等认知特质'], triggers: ['压力事件'], resources: ['有自知力、主动求治'], quizDistractor: '情感高涨与活动增多' }
    },
    { cat: 'trauma', disorder: '创伤后应激障碍（PTSD）', ref: 'ICD-11 6B40 · CCMD-3 41.12', age: [28, 34, 40], dur: ['2 个月前', '3 个月前'],
      lead: '{dur}经历重大创伤事件后，反复闪回创伤画面、做噩梦',
      symptoms: ['回避与事件相关的人与地点', '易惊、失眠、注意力不集中', '情绪麻木、对什么都没兴趣'],
      basis: '重大创伤后出现闯入性再体验、回避麻木、警觉性增高三大症状群，持续>1个月，符合 PTSD。',
      distractors: [
        { name: '急性应激障碍', why: '急性应激障碍病程<1个月，本案例已超过。' },
        { name: '抑郁发作', why: '抑郁无典型闯入性再体验与回避。' },
        { name: '适应障碍', why: '适应障碍应激源较轻、症状轻。' }
      ],
      examples: ["例如：创伤后反复闪回、噩梦、回避相关线索、易惊失眠，持续超 1 个月，符合 PTSD。"],
      map: { problems: ['闯入性再体验', '回避与情感麻木', '警觉性增高'], needs: '安全与可控', earlyAdversity: '重大创伤经历', cognition: { self: '我永远不安全了', others: '世界不可信', world: '危险随时再来', condition: '只要回想，就会重新经历痛苦' }, corePain: '恐惧、麻木、悲伤', maladaptive: '回避、警觉', roots: ['重大创伤事件'], triggers: ['与创伤相关的线索'], resources: ['社会支持', '有求治意愿'], quizDistractor: '持续过度兴奋与乱花钱' }
    },
    { cat: 'trauma', disorder: '适应障碍', ref: 'ICD-11 适应障碍 · CCMD-3 41.13', age: [19, 24, 40, 52], dur: ['1 个月前', '几周前'],
      lead: '在明确生活变化/应激事件（如入学、离职、离婚、失业）后{dur}出现情绪或行为适应不良',
      symptoms: ['情绪低落或焦虑、烦躁', '失眠、注意力下降', '能基本维持生活、程度较轻'],
      basis: '有明确应激源、1个月内起病、以情绪适应不良为主、程度较轻，符合适应障碍。',
      distractors: [
        { name: '抑郁发作', why: '抑郁发作症状更重、有自罪自杀观念、与应激源关系不紧密。' },
        { name: '急性应激障碍', why: '急性应激障碍需灾难性应激源且有分离/木僵。' },
        { name: '广泛性焦虑障碍', why: '广泛性焦虑无明确应激源、持续≥6个月。' }
      ],
      examples: ["例如：入学或离职后 1 个月内出现情绪低落、焦虑、失眠，程度较轻、功能基本保持，符合适应障碍。"],
      map: { problems: ['应激源后的情绪适应不良', '睡眠差、注意下降'], needs: '适应新环境', earlyAdversity: '', cognition: { self: '我适应不了', others: '', world: '变化太大', condition: '如果我适应不了，就会一直痛苦' }, corePain: '低落、焦虑', maladaptive: '退缩、回避', roots: ['生活事件', '应对资源不足'], triggers: ['明确的生活变化'], resources: ['社会支持', '既往适应良好'], quizDistractor: '被害妄想与幻听' }
    },
    { cat: 'trauma', disorder: '急性应激障碍', ref: 'ICD-11 急性应激反应 · CCMD-3 41.1', age: [25, 33, 45], dur: ['2 天前', '数小时前'],
      lead: '{dur}目睹/经历灾难性事件后急性出现茫然、发呆、木僵或激越',
      symptoms: ['神情恍惚、反应迟钝', '对刚发生的事记不清', '反复浮现现场画面'],
      basis: '灾难性应激源后数小时~数日内起病，病程<1个月，以分离、木僵/激越为主，符合急性应激障碍。',
      distractors: [
        { name: '创伤后应激障碍', why: 'PTSD 起病较晚、病程>1个月。' },
        { name: '分离障碍', why: '分离障碍无明确灾难性应激诱因。' },
        { name: '抑郁发作', why: '抑郁无典型分离/木僵表现。' }
      ],
      examples: ["例如：灾难事件后数小时内出现茫然、木僵、记不清刚发生的事，病程短于 1 个月，符合急性应激障碍。"],
      map: { problems: ['急性应激反应、木僵/激越', '分离症状'], needs: '安全感与稳定', earlyAdversity: '', cognition: { self: '我无法承受', others: '', world: '刚刚的一切太可怕', condition: '如果我不麻木，就会崩溃' }, corePain: '恐惧、麻木', maladaptive: '解离、木僵', roots: ['灾难性应激源'], triggers: ['灾难性事件'], resources: ['可尽快获得专业支持'], quizDistractor: '持续≥1个月的三大症状群' }
    },
    { cat: 'schizo', disorder: '精神分裂症（偏执型）', ref: 'ICD-11 6A20 · CCMD-3 20', age: [22, 25, 30], dur: ['近半年', '近 8 个月'],
      lead: '{dur}逐渐敏感多疑，认为别人要害自己、议论自己，耳边常听到有人评论自己',
      symptoms: ['认为被监视、被控制', '行为孤僻、不与交往', '不承认有病、拒绝就医'],
      basis: '存在被害/关系妄想、评论性幻听等精神病性症状，社会功能受损、无自知力，符合精神分裂症（偏执型）。',
      distractors: [
        { name: '偏执性精神障碍', why: '偏执性精神障碍妄想系统、幻觉不突出、人格相对完整。' },
        { name: '抑郁发作', why: '抑郁以情绪低落为核心，无典型幻觉妄想。' },
        { name: '偏执型人格障碍', why: '偏执型人格为长期多疑但无幻觉与系统妄想。' }
      ],
      examples: ["例如：逐渐敏感多疑、坚信被害、听到评论自己的声音、无自知力，符合精神分裂症（偏执型）。"],
      map: { problems: ['被害/关系妄想、幻听', '社交退缩、无自知力'], needs: '', earlyAdversity: '', cognition: { self: '有人要害我', others: '他人不可信', world: '充满敌意', condition: '只有防备才能自保' }, corePain: '恐惧、多疑', maladaptive: '孤立、敌意', roots: ['生物易感性'], triggers: ['可能无明确诱因'], resources: ['需专业精神科干预'], quizDistractor: '情绪低落与兴趣丧失' }
    },
    { cat: 'schizo', disorder: '妄想性障碍', ref: 'ICD-11 6A24 · CCMD-3 21', age: [40, 46, 52], dur: ['1 年多', '2 年来'],
      lead: '{dur}坚信某个接近现实的想法（如配偶不忠、被邻居投毒），罗列“证据”逻辑自成一体',
      symptoms: ['除此之外工作社交基本正常', '无幻觉', '人格基本保持完整'],
      basis: '以系统化、接近现实的妄想为唯一或主要症状，无其他精神病性症状、功能相对保持，符合妄想性障碍。',
      distractors: [
        { name: '精神分裂症', why: '精神分裂症妄想荒谬、伴幻觉、人格衰退。' },
        { name: '偏执型人格障碍', why: '偏执型人格为长期多疑但非系统固定妄想。' },
        { name: '强迫症', why: '强迫症有反强迫冲突，非坚信不疑。' }
      ],
      examples: ["例如：坚信配偶不忠并罗列“证据”、逻辑自成一体，除此之外工作社交正常、无幻觉，符合妄想性障碍。"],
      map: { problems: ['系统化妄想'], needs: '', earlyAdversity: '', cognition: { self: '我是对的', others: '他人在欺骗我', world: '充满阴谋', condition: '只要我坚持，就能揭穿真相' }, corePain: '多疑、愤怒', maladaptive: '纠缠、诉讼', roots: ['偏执人格基础'], triggers: ['人际冲突'], resources: ['功能相对保持'], quizDistractor: '评论性幻听与思维破裂' }
    },
    { cat: 'personality', disorder: '边缘型人格障碍', ref: 'DSM-5 B簇 · CCMD-3 60.4', age: [22, 26, 31], dur: ['成年早期起病'],
      lead: '人际关系极不稳定，常把人理想化又迅速贬低，情绪波动大、常感空虚',
      symptoms: ['害怕被抛弃', '反复割腕等自伤', '冲动消费、暴饮暴食'],
      basis: '在人际关系、自我形象、情绪等多方面不稳定并伴冲动与自伤，符合边缘型人格障碍。',
      distractors: [
        { name: '双相障碍', why: '双相为发作性情感症状，情绪波动不构成完整发作。' },
        { name: '表演型人格障碍', why: '表演型以寻求关注为主，无持续空虚与自伤。' },
        { name: '抑郁发作', why: '抑郁为发作性情绪低落，无人际与自我形象不稳定。' }
      ],
      examples: ["例如：人际关系大起大落、怕被抛弃、反复自伤、情绪与自我形象不稳定，符合边缘型人格障碍。"],
      map: { problems: ['人际不稳定、怕被抛弃', '情绪不稳、空虚', '自伤与冲动行为'], needs: '被爱与被接纳', earlyAdversity: '可能存在被忽视/不安全的依恋', cognition: { self: '我不值得被爱、会被抛弃', others: '别人最终都会离开我', world: '不可靠', condition: '如果被抛弃，我就无法承受' }, corePain: '空虚、恐惧、羞耻', maladaptive: '自伤、冲动、极端化', roots: ['早期依恋创伤', '情绪调节缺陷'], triggers: ['人际关系中的拒绝/冲突'], resources: ['有求助机会', 'DBT可改善'], quizDistractor: '一贯的情感冷漠与社交隔绝' }
    },
    { cat: 'personality', disorder: '反社会型人格障碍', ref: 'DSM-5 B簇 · CCMD-3 60.3', age: [28, 33, 38], dur: ['长期'],
      lead: '从小有品行问题，成年后无视他人权利、说谎欺骗、屡次违法',
      symptoms: ['对伤害他人毫无愧疚', '缺乏责任感、工作做不长', '冲动易怒'],
      basis: '15岁前有品行问题、18岁后持续反社会行为、缺乏内疚与责任感，符合反社会型人格障碍。',
      distractors: [
        { name: '物质使用障碍', why: '反社会行为与物质使用相关时，应首先考虑物质使用障碍。' },
        { name: '边缘型人格障碍', why: '边缘型以情绪与人际不稳定为核心。' },
        { name: '躁狂发作', why: '躁狂为发作性情感高涨，非持久反社会模式。' }
      ],
      examples: ["例如：从小品行不良、成年后屡次违法、说谎欺骗、对伤害他人毫无愧疚，符合反社会型人格障碍。"],
      map: { problems: ['反社会行为、缺乏内疚', '冲动与攻击'], needs: '掌控与刺激', earlyAdversity: '可能存在童年管教缺失/虐待', cognition: { self: '规则约束不了我', others: '他人可被利用', world: '弱肉强食', condition: '只要不被抓到，做什么都行' }, corePain: '空虚、易怒', maladaptive: '欺骗、攻击', roots: ['童年品行问题', '共情缺陷'], triggers: ['挫折或冲突'], resources: ['行为约束与监管'], quizDistractor: '反复洗手等仪式行为' }
    },
    { cat: 'personality', disorder: '回避型人格障碍', ref: 'DSM-5 C簇 · CCMD-3 60.7', age: [24, 29, 35], dur: ['自幼'],
      lead: '从小害羞、自卑、害怕被批评和拒绝，回避社交与需要承担人际风险的活动',
      symptoms: ['除非确信被喜欢否则不愿交往', '渴望亲密又退缩', '在群体中沉默'],
      basis: '起病早、广泛持久的社交抑制、自卑与害怕被拒绝，符合回避型人格障碍。',
      distractors: [
        { name: '社交焦虑障碍', why: '社交焦虑更局限、起病可较晚，回避型为更广泛持久的人格模式。' },
        { name: '分裂样人格障碍', why: '分裂样对关系无兴趣，回避型是渴望但害怕。' },
        { name: '依赖型人格障碍', why: '依赖型以需要被照顾为核心。' }
      ],
      examples: ["例如：自幼自卑、怕被批评拒绝、除非确信被喜欢否则不愿交往，符合回避型人格障碍。"],
      map: { problems: ['社交抑制、自卑', '回避人际风险'], needs: '被接纳', earlyAdversity: '', cognition: { self: '我不够好、会被拒绝', others: '别人会批评我', world: '充满评价', condition: '如果被拒绝，我会很受伤' }, corePain: '自卑、孤独', maladaptive: '回避', roots: ['早期被否定的经历'], triggers: ['社交场合'], resources: ['渴望联结的动机'], quizDistractor: '对亲密关系毫无兴趣' }
    },
    { cat: 'eating', disorder: '神经性厌食', ref: 'ICD-11 6B80 · CCMD-3 50.1', age: [16, 18, 21], dur: ['近半年', '近 1 年'],
      lead: '为减肥长期严格节食、过度运动，体重显著低于正常，仍觉得自己胖',
      symptoms: ['女性闭经≥3个月', '家人让吃饭就发脾气', '对体型体重极度关注'],
      basis: '体重显著低于正常、体像障碍、强烈怕胖、闭经，符合神经性厌食。',
      distractors: [
        { name: '神经性贪食', why: '贪食体重正常或偏重，核心是暴食-代偿循环。' },
        { name: '抑郁发作', why: '抑郁无主动减重追求与体像障碍。' },
        { name: '躯体疾病所致消瘦', why: '躯体疾病有器质性证据、无怕胖和体像障碍。' }
      ],
      examples: ["例如：为减肥严格节食、过度运动、体重显著过低仍觉自己胖、女性闭经，符合神经性厌食。"],
      map: { problems: ['体重显著过低', '体像障碍、怕胖', '闭经、营养不良'], needs: '控制感', earlyAdversity: '', cognition: { self: '我还太胖', others: '别人都在看我身材', world: '瘦才是好', condition: '只有再瘦一点，我才有价值' }, corePain: '对体重焦虑、恐惧发胖', maladaptive: '节食、过度运动', roots: ['社会文化压力', '完美主义'], triggers: ['对体型的关注/评价'], resources: ['家人关注', '可及的营养与心理支持'], quizDistractor: '反复暴食后催吐、体重正常' }
    },
    { cat: 'eating', disorder: '神经性贪食', ref: 'ICD-11 6B81 · CCMD-3 50.2', age: [19, 22, 26], dur: ['近半年', '近 1 年'],
      lead: '反复暴食，吃大量食物后感到失控，之后催吐/导泻/过度运动来“补救”',
      symptoms: ['每周发作数次、持续≥3个月', '体重正常', '怕胖、对体型过度关注'],
      basis: '暴食-代偿循环、每周≥1次持续3个月、体重正常、怕胖，符合神经性贪食。',
      distractors: [
        { name: '神经性厌食', why: '厌食体重显著低于正常、闭经。' },
        { name: '暴食障碍', why: '暴食障碍无代偿行为。' },
        { name: '神经性呕吐', why: '神经性呕吐无暴食与怕胖动机。' }
      ],
      examples: ["例如：反复暴食后催吐或导泻、体重正常、怕胖，每周数次持续 3 个月，符合神经性贪食。"],
      map: { problems: ['暴食与失控', '代偿行为、怕胖'], needs: '情绪调节', earlyAdversity: '', cognition: { self: '我控制不住自己', others: '别人会嫌我胖', world: '食物是危险的', condition: '只有催吐才能不发胖' }, corePain: '羞耻、自卑', maladaptive: '暴食-催吐循环', roots: ['对体重的过度关注', '情绪调节困难'], triggers: ['情绪波动'], resources: ['体重正常、躯体风险较低'], quizDistractor: '体重显著低于正常且闭经' }
    },
    { cat: 'sleep', disorder: '失眠障碍', ref: 'ICD-11 7A00 · CCMD-3 51.1', age: [38, 45, 52], dur: ['近半年', '近 1 年'],
      lead: '{dur}入睡困难或睡眠浅易醒、早醒，越想睡越睡不着',
      symptoms: ['白天头晕乏力、注意力下降', '对睡眠过度担心', '有充足睡眠机会仍失眠'],
      basis: '睡眠紊乱每周≥3晚持续≥3个月、有充足睡眠机会仍失眠、日间功能损害，符合失眠障碍。',
      distractors: [
        { name: '抑郁发作', why: '抑郁以情绪低落、兴趣丧失为核心，失眠为伴发症状。' },
        { name: '睡眠呼吸暂停', why: '睡眠呼吸暂停有鼾声与呼吸暂停、白天嗜睡。' },
        { name: '广泛性焦虑障碍', why: '广泛性焦虑以担心为核心，失眠为表现之一。' }
      ],
      examples: ["例如：入睡困难、易醒早醒每周 3 晚以上持续 3 个月、白天乏力，有充足睡眠机会仍失眠，符合失眠障碍。"],
      map: { problems: ['入睡困难/维持困难', '日间功能受损', '对睡眠的过度担忧'], needs: '休息与恢复', earlyAdversity: '', cognition: { self: '我今晚又睡不着了', others: '', world: '', condition: '睡不着明天就完了' }, corePain: '焦虑、疲惫', maladaptive: '卧床焦虑、强迫自己睡', roots: ['压力', '不良睡眠习惯'], triggers: ['压力或作息紊乱'], resources: ['可接受 CBT-I'], quizDistractor: '白天不可抗拒睡眠伴猝倒' }
    },
    { cat: 'somatoform', disorder: '疑病障碍', ref: 'ICD-11 6B23 · CCMD-3 43.43', age: [30, 38, 47, 55], dur: ['近半年', '近 1 年'],
      lead: '{dur}坚信自己得了重病，反复就医、反复检查均正常仍不放心',
      symptoms: ['频繁换医院、反复检查', '对阴性结果不相信', '影响工作生活、内心痛苦'],
      basis: '持续存在的疑病观念、反复检查无法打消疑虑、无器质性证据，符合疑病障碍。',
      distractors: [
        { name: '躯体疾病', why: '反复检查无异常可排除器质性疾病。' },
        { name: '精神分裂症', why: '精神分裂症疑病妄想更荒谬、有其它精神病性症状。' },
        { name: '抑郁发作', why: '抑郁以情绪低落为核心，疑病为继发。' }
      ],
      examples: ["例如：反复就医、检查均正常仍坚信自己患重病、反复换医院，符合疑病障碍。"],
      map: { problems: ['坚信患病、反复就医', '对阴性结果不相信'], needs: '确定感', earlyAdversity: '', cognition: { self: '我的身体出了问题', others: '医生没查出来', world: '', condition: '只有查出来，我才能安心' }, corePain: '焦虑、恐惧患病', maladaptive: '过度检查、反复求医', roots: ['健康焦虑特质'], triggers: ['身体轻微不适'], resources: ['有就医渠道'], quizDistractor: '多种躯体不适但不过度关注' }
    },
    { cat: 'somatoform', disorder: '躯体痛苦障碍', ref: 'ICD-11 6B60 · CCMD-3 43.4', age: [35, 42, 50], dur: ['近 2 年', '近 1 年'],
      lead: '{dur}反复出现多种躯体不适（疼痛、胃胀、心慌、乏力），多次就诊检查无异常',
      symptoms: ['非常关注身体、频繁求医', '症状随情绪波动', '影响生活'],
      basis: '以持续躯体症状与过度关注为核心、检查阴性，符合躯体痛苦障碍（躯体症状障碍）。',
      distractors: [
        { name: '疑病障碍', why: '疑病以坚信患重病为核心，本案例为多种症状但非坚信某一重病。' },
        { name: '广泛性焦虑障碍', why: '广泛性焦虑以担心为核心，而非以躯体症状为核心。' },
        { name: '抑郁发作', why: '抑郁以情绪低落为核心。' }
      ],
      examples: ["例如：反复多种躯体不适、检查阴性、过度关注身体并频繁求医，符合躯体痛苦障碍。"],
      map: { problems: ['多种躯体不适', '过度关注、频繁求医'], needs: '被关注与安全感', earlyAdversity: '', cognition: { self: '我的身体很脆弱', others: '没人理解我的痛苦', world: '', condition: '只有不断检查，我才能确认没事' }, corePain: '痛苦、焦虑', maladaptive: '反复求医、过度关注', roots: ['情绪表达躯体化'], triggers: ['情绪压力'], resources: ['有就医渠道'], quizDistractor: '坚信自己患了特定绝症' }
    },
    { cat: 'substance', disorder: '酒精依赖', ref: 'ICD-11 6C40 / SUD3 · CCMD-3 10.1', age: [38, 45, 52, 60], dur: ['近 5 年', '近 8 年'],
      lead: '长期饮酒，{dur}每日大量饮酒、早晨醒来先要喝酒，多次想戒却停一两天就手抖心慌',
      symptoms: ['饮酒量越来越大、越来越频繁', '因喝酒耽误工作、与家人争吵', '停酒后手抖、心慌、出汗'],
      basis: '存在耐受、戒断症状、晨饮与失控，符合酒精依赖（物质依赖）。',
      distractors: [
        { name: '酒精有害使用', why: '有害使用造成损害但未达依赖（无耐受/戒断/失控）。' },
        { name: '双相障碍', why: '双相为情感发作，饮酒为继发行为。' },
        { name: '广泛性焦虑障碍', why: '广泛性焦虑以弥散担心为核心，与酒精依赖无关。' }
      ],
      examples: ["例如：晨饮压手抖、停酒后手抖心慌出汗、为喝酒误工，符合酒精依赖。"],
      map: { problems: ['长期大量饮酒、晨饮', '停酒后戒断症状', '因酒耽误工作、家庭冲突'], needs: '压力缓解与情绪调节', earlyAdversity: '', cognition: { self: '没有酒我撑不住', others: '家人都怪我', world: '', condition: '只要喝一口就能好受' }, corePain: '渴求、戒断焦虑', maladaptive: '借酒应对压力', roots: ['慢性压力', '可能家族易感性'], triggers: ['压力、应酬'], resources: ['有戒酒意愿', '家庭支持'], quizDistractor: '情感高涨、睡眠需求减少' }
    },
    { cat: 'addictive', disorder: '赌博障碍', ref: 'ICD-11 6C50 · CCMD-3 61.1', age: [30, 38, 45], dur: ['近 3 年', '近 2 年'],
      lead: '{dur}沉迷赌博、越赌越大，输钱后借钱再赌，无法控制',
      symptoms: ['多次向家人隐瞒、说谎', '因赌博欠债、工作家庭受损', '不赌时烦躁、坐立不安'],
      basis: '赌博行为失控并造成明显损害，符合赌博障碍（成瘾行为障碍）。',
      distractors: [
        { name: '躁狂发作', why: '躁狂有情感高涨、睡眠减少等核心症状。' },
        { name: '反社会型人格障碍', why: '反社会人格为更广泛的反社会行为模式。' },
        { name: '偷窃癖', why: '偷窃癖针对偷窃行为而非赌博。' }
      ],
      examples: ["例如：越赌越大、输钱借钱再赌、隐瞒家人、欠债仍控制不住，符合赌博障碍。"],
      map: { problems: ['赌博失控、越赌越大', '隐瞒说谎、负债'], needs: '刺激与翻本渴望', earlyAdversity: '', cognition: { self: '我能翻本', others: '家人不理解', world: '运气会眷顾我', condition: '再赌一把就能赢回来' }, corePain: '空虚、焦虑、羞耻', maladaptive: '赌博、说谎', roots: ['冲动奖赏寻求'], triggers: ['输钱后冲动'], resources: ['家庭介入'], quizDistractor: '情感高涨伴睡眠需求减少' }
    },
    { cat: 'neurodev', disorder: '注意缺陷多动障碍', ref: 'ICD-11 6A05 · CCMD-3 80.1', age: [7, 8, 10, 12], dur: ['近 1 年', '近 2 年'],
      lead: '儿童自幼上课坐不住、小动作多、注意力难集中，{dur}影响学习',
      symptoms: ['作业粗心、丢三落四', '插嘴抢答、难以安静', '常在座位上扭动'],
      basis: '注意缺陷、多动冲动起病于童年并影响功能，符合注意缺陷多动障碍。',
      distractors: [
        { name: '对立违抗障碍', why: '对立违抗以违抗挑衅为主，而非多动与注意缺陷。' },
        { name: '抽动障碍', why: '抽动障碍为不自主运动/发声抽动。' },
        { name: '适应障碍', why: '适应障碍有明确应激源。' }
      ],
      examples: ["例如：上课坐不住、插嘴、作业粗心丢三落四，跨场合出现，符合注意缺陷多动障碍。"],
      map: { problems: ['注意力不集中、作业粗心', '多动冲动、影响课堂'], needs: '被接纳与胜任感', earlyAdversity: '', cognition: { self: '我管不住自己', others: '老师总批评我', world: '', condition: '我就是比别人差' }, corePain: '挫败、自卑', maladaptive: '冲动、逃避作业', roots: ['神经发育因素'], triggers: ['需久坐专注的情境'], resources: ['行为干预与支持'], quizDistractor: '反复违抗、故意激怒他人' }
    },
    { cat: 'impulse', disorder: '间歇性暴怒障碍', ref: 'ICD-11 6C73', age: [30, 38, 45, 50], dur: ['近 2 年', '近 3 年'],
      lead: '{dur}反复因极小的事突然暴怒、摔东西打人，事后非常后悔却控制不住',
      symptoms: ['冲动程度与诱因明显不相称', '发作时难以自控', '事后深感内疚'],
      basis: '反复爆发性冲动攻击、与情境不相称且非预谋，符合间歇性暴怒障碍。',
      distractors: [
        { name: '反社会型人格障碍', why: '反社会人格为持久反社会模式、无事后内疚。' },
        { name: '躁狂发作', why: '躁狂有情感高涨等核心症状。' },
        { name: '边缘型人格障碍', why: '边缘型以情绪与人际不稳定为核心。' }
      ],
      examples: ["例如：因极小的事暴怒摔物打人、事后后悔但下次仍失控，符合间歇性暴怒障碍。"],
      map: { problems: ['爆发性攻击、摔物打人', '事后内疚'], needs: '情绪调节', earlyAdversity: '', cognition: { self: '我控制不住自己', others: '', world: '', condition: '只要被激怒我就会爆发' }, corePain: '愤怒、内疚', maladaptive: '攻击爆发', roots: ['冲动控制缺陷'], triggers: ['微小挫折'], resources: ['事后有反思'], quizDistractor: '持续多疑与被害妄想' }
    },
    { cat: 'disruptive', disorder: '品行-违纪障碍', ref: 'ICD-11 6C91 · CCMD-3 81.1', age: [13, 15, 16], dur: ['近 2 年', '近 1 年'],
      lead: '青少年{dur}多次打架、毁坏财物、偷窃、逃学，反复违纪',
      symptoms: ['对他人有攻击行为', '故意破坏、偷窃', '对伤害他人无明显愧疚'],
      basis: '反复攻击、破坏、偷窃等严重违纪行为，符合品行-违纪障碍。',
      distractors: [
        { name: '对立违抗障碍', why: '对立违抗无严重攻击与破坏行为。' },
        { name: '反社会型人格障碍', why: '反社会人格需满18岁且先前有品行问题。' },
        { name: '注意缺陷多动障碍', why: 'ADHD 以注意多动为核心。' }
      ],
      examples: ["例如：多次打架、毁坏公物、偷窃、逃学、对伤害他人无愧疚，符合品行-违纪障碍。"],
      map: { problems: ['攻击他人、毁坏财物', '偷窃、逃学'], needs: '掌控与刺激', earlyAdversity: '可能管教缺失', cognition: { self: '规则约束不了我', others: '他人可被利用', world: '弱肉强食', condition: '只要不被抓就行' }, corePain: '空虚、易怒', maladaptive: '攻击、违纪', roots: ['不良家庭环境'], triggers: ['冲突挫折'], resources: ['行为矫正'], quizDistractor: '反复洗手等仪式行为' }
    },
    { cat: 'paraphilic', disorder: '露阴障碍', ref: 'ICD-11 6D30 · CCMD-3 62.22', age: [28, 32, 36, 40], dur: ['近 1 年', '近 2 年'],
      lead: '{dur}多次在偏僻处对陌生女性突然暴露生殖器，从对方惊恐反应中获得性兴奋',
      symptoms: ['事后羞愧但仍反复出现', '已造成困扰或法律后果', '难以控制'],
      basis: '反复向非同意个体暴露生殖器以求性唤起，符合露阴障碍。',
      distractors: [
        { name: '窥阴障碍', why: '窥阴为偷窥他人，而非暴露自己。' },
        { name: '摩擦障碍', why: '摩擦为摩擦他人身体。' },
        { name: '强迫性性行为障碍', why: '强迫性性行为无特定异常性对象。' }
      ],
      examples: ["例如：对陌生女性突然暴露生殖器、从对方惊恐中获得性兴奋，符合露阴障碍。"],
      map: { problems: ['反复暴露生殖器', '造成困扰与后果'], needs: '性唤起', earlyAdversity: '', cognition: { self: '', others: '', world: '', condition: '' }, corePain: '羞耻', maladaptive: '暴露行为', roots: ['异常性唤起模式'], triggers: ['冲动情境'], resources: ['可接受治疗'], quizDistractor: '反复偷窥他人洗澡更衣' }
    },
    { cat: 'neurocog', disorder: '阿尔茨海默病痴呆', ref: 'ICD-11 6D80 · CCMD-3 00', age: [68, 72, 76, 80], dur: ['近 3 年', '近 4 年'],
      lead: '老年人{dur}记忆进行性减退，常忘记刚发生的事、找不到回家的路',
      symptoms: ['计算能力下降', '性格变得淡漠', '生活逐渐不能自理'],
      basis: '潜隐起病、进行性全面认知损害、无卒中证据，符合阿尔茨海默病痴呆。',
      distractors: [
        { name: '血管性痴呆', why: '血管性痴呆有卒中史且阶梯式恶化。' },
        { name: '谵妄', why: '谵妄为急性波动性意识障碍。' },
        { name: '抑郁性假性痴呆', why: '抑郁性假性痴呆有抑郁心境且认知波动。' }
      ],
      examples: ["例如：3 年内记忆进行性减退、找不到回家路、计算下降、性格淡漠，无卒中史，符合阿尔茨海默病痴呆。"],
      map: { problems: ['进行性记忆减退', '定向与计算下降'], needs: '尊严与被照顾', earlyAdversity: '', cognition: { self: '我记不住事了', others: '', world: '', condition: '' }, corePain: '失落、淡漠', maladaptive: '回避复杂任务', roots: ['神经退行性病变'], triggers: ['疾病进展'], resources: ['家庭照护'], quizDistractor: '急性意识模糊伴症状波动' }
    },
    { cat: 'dissociative', disorder: '分离性遗忘', ref: 'ICD-11 6B61 · CCMD-3 40.11', age: [24, 28, 33, 40], dur: ['1 周前', '2 周前'],
      lead: '在经历创伤事件后{dur}突然记不起事件当天及前后的经历，甚至短暂想不起自己的身份信息',
      symptoms: ['无头部外伤', '神经系统检查无异常', '对关键个人信息记忆缺失'],
      basis: '应激后出现的局限性记忆缺失、排除器质性原因，符合分离性遗忘。',
      distractors: [
        { name: '创伤后应激障碍', why: 'PTSD 以闯入性再体验、回避、警觉增高为核心。' },
        { name: '器质性遗忘障碍', why: '器质性遗忘有脑损伤证据。' },
        { name: '分离性身份障碍', why: '分离性身份障碍有多个身份状态交替。' }
      ],
      examples: ["例如：创伤后记不起事件当天前后经历、短暂想不起姓名、无脑外伤，符合分离性遗忘。"],
      map: { problems: ['创伤后的记忆缺失'], needs: '安全与整合', earlyAdversity: '创伤经历', cognition: { self: '我记不起来了', others: '', world: '太可怕', condition: '' }, corePain: '恐惧、麻木', maladaptive: '解离、遗忘', roots: ['创伤事件'], triggers: ['创伤线索'], resources: ['社会支持'], quizDistractor: '存在多个不同人格状态交替' }
    }
  ];

  // ---------- 从模板生成一个案例 ----------
  function buildFromTemplate(t) {
    const gender = pick(['女', '男']);
    const age = t.age ? pick(t.age) : 30;
    const dur = t.dur ? pick(t.dur) : '近 3 个月';
    const sym = t.symptoms.slice(0, 3 + (Math.floor(Math.random() * 2)));
    const lead = t.lead.replace(/\{dur\}/g, dur).replace(/\{gender\}/g, gender).replace(/\{age\}/g, age);
    const vignette = gender + '，' + age + ' 岁，' + lead + '，' + sym.join('、') + '。';
    const names = [t.disorder].concat(t.distractors.map((d) => d.name));
    const order = shuffleIdx(names.length);
    const options = order.map((i) => names[i]);
    const answer = order.indexOf(0);
    const differential = t.distractors.map((d) => '排除「' + d.name + '」：' + d.why).join(' ');
    const baseNotes = [t.correctNote || ('符合「' + t.disorder + '」的核心特征（见诊断依据）')]
      .concat(t.distractors.map((d) => '排除「' + d.name + '」：' + d.why));
    const optionNotes = order.map((idx) => baseNotes[idx]);
    return {
      id: 'dxgen_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      category: t.cat,
      title: t.disorder + '（生成案例）',
      difficulty: 2,
      vignette: vignette,
      question: '该来访者最可能的诊断是？',
      options: options,
      answer: answer,
      analysis: {
        symptoms: lead.replace(/\{dur\}/g, dur).replace(/\{gender\}/g, gender).replace(/\{age\}/g, age) + '，' + sym.join('、'),
        basis: t.basis,
        differential: differential,
        optionNotes: optionNotes,
        examples: t.examples || [],
        ref: t.ref
      },
      map: t.map,
      generated: true
    };
  }
  function generateOffline(catKey) {
    let pool = GEN;
    if (catKey && catKey !== 'all') pool = GEN.filter((t) => t.cat === catKey);
    if (!pool.length) pool = GEN;
    return buildFromTemplate(pick(pool));
  }

  // ---------- 大模型生成（可选） ----------
  async function generateLlm() {
    if (!(window.LLM && window.LLM.isEnabled && window.LLM.isEnabled() && window.LLM.hasApi && window.LLM.hasApi())) {
      toast('需先在「设置」里配置并启用大模型'); return null;
    }
    const cfg = window.LLM.getConfig();
    const system = '你是一位资深精神科医生兼心理咨询督导师，精通 ICD-11 与 CCMD-3 诊断标准。' +
      '请生成一个用于诊断训练的案例。严格要求：答案必须唯一、无歧义、准确无误。' +
      '只输出 JSON（不要输出任何 JSON 之外的内容）：' +
      '{"vignette":"来访者描述（含性别、年龄、症状、病程，信息足以做出唯一诊断）",' +
      '"options":["诊断A","诊断B","诊断C","诊断D"]（4 个诊断名，恰好 1 个正确，其余 3 个是可被明确排除的鉴别诊断）,' +
      '"answer":正确选项下标0-3的整数,"symptoms":"关键症状",' +
      '"basis":"诊断依据（对照标准）","differential":"鉴别要点（逐一说明为何排除其余三项）",' +
      '"ref":"权威出处（ICD-11 / CCMD-3 编码）"}';
    const user = '请生成一个诊断案例。';
    try {
      const res = await window.api.llmChat({ provider: cfg.provider, baseUrl: cfg.baseUrl, model: cfg.model, apiKey: cfg.apiKey, system, messages: [{ role: 'user', content: user }], temperature: 0.5, maxTokens: 1600 });
      if (!res.ok) { toast('生成失败：' + (res.error || '网络错误')); return null; }
      const text = String(res.text || '').replace(/^﻿/, '').replace(/```[a-zA-Z]*\s*/g, '').trim();
      let obj = null;
      try { obj = JSON.parse(text); } catch (e) { const i = text.indexOf('{'); const j = text.lastIndexOf('}'); if (i >= 0 && j > i) { try { obj = JSON.parse(text.slice(i, j + 1)); } catch (e2) {} } }
      if (!obj || !obj.vignette || !Array.isArray(obj.options) || obj.options.length !== 4 || !(obj.answer >= 0 && obj.answer <= 3)) {
        toast('大模型返回格式无法解析，请重试'); return null;
      }
      return {
        id: 'dxllm_' + Date.now(), category: 'llm', title: '大模型生成案例', difficulty: 3,
        vignette: obj.vignette, question: '该来访者最可能的诊断是？',
        options: obj.options, answer: obj.answer,
        analysis: { symptoms: obj.symptoms || '', basis: obj.basis || '', differential: obj.differential || '', ref: obj.ref || '大模型生成（请以教材/诊断标准核对）' },
        map: null, generated: true
      };
    } catch (e) {
      toast('生成失败：' + (e && e.message ? e.message : '网络错误')); return null;
    }
  }

  // ---------- 渲染 ----------
  function currentPool() {
    if (state.cat === 'all') return window.DX_CASES;
    return window.DX_CASES.filter((c) => c.category === state.cat);
  }

  function renderCats() {
    const box = $('dxCats'); if (!box) return;
    const cats = [{ key: 'all', label: '全部', emoji: '🧠' }].concat(window.DX_CATEGORIES);
    box.innerHTML = cats.map((c) => {
      const n = c.key === 'all' ? window.DX_CASES.length : window.DX_CASES.filter((x) => x.category === c.key).length;
      return '<button class="dx-cat' + (state.cat === c.key ? ' active' : '') + '" data-cat="' + c.key + '">' + c.emoji + ' ' + esc(c.label) + ' <b>' + n + '</b></button>';
    }).join('');
    box.querySelectorAll('.dx-cat').forEach((b) => {
      b.addEventListener('click', () => {
        state.cat = b.dataset.cat;
        renderCats(); renderCaseList();
        if (state.current && state.current.category !== state.cat && state.cat !== 'all' && state.current.category !== 'llm') {
          // 保持当前题，若不属于该类别则自动切到该类别第一题
        }
      });
    });
  }

  function renderCaseList() {
    const box = $('dxCaseList'); if (!box) return;
    const pool = currentPool();
    box.innerHTML = pool.map((c) => {
      const active = state.current && state.current.id === c.id ? ' active' : '';
      return '<div class="case-item' + active + '" data-id="' + c.id + '">' +
        '<div class="c-name">' + esc(c.title) + '</div>' +
        '<div class="c-desc">' + esc((c.vignette || '').slice(0, 34)) + '…</div>' +
        '</div>';
    }).join('');
    box.querySelectorAll('.case-item').forEach((el) => {
      el.addEventListener('click', () => {
        const c = window.DX_CASES.find((x) => x.id === el.dataset.id);
        if (c) { state.current = c; state.answered = false; state.generated = false; renderCase(); renderCaseList(); }
      });
    });
  }

  function renderCase() {
    const c = state.current;
    if (!c) return;
    $('dxCaseTitle').textContent = c.title;
    $('dxCaseMeta').textContent = '难度 ' + '★'.repeat(c.difficulty || 1) + ' · ' + (catLabel(c.category));
    $('dxVignette').textContent = c.vignette;
    $('dxQuestion').textContent = c.question || '该来访者最可能的诊断是？';
    const optBox = $('dxOptions');
    optBox.innerHTML = c.options.map((o, i) =>
      '<button class="dx-opt" data-i="' + i + '"><span class="dx-opt-key">' + 'ABCD'[i] + '</span>' + esc(o) + '</button>'
    ).join('');
    optBox.querySelectorAll('.dx-opt').forEach((b) => {
      b.addEventListener('click', () => { if (!state.answered) answer(parseInt(b.dataset.i, 10)); });
    });
    $('dxAnswer').hidden = true;
    $('dxNextBtn').hidden = true;
    resetLlmResult();
    state.answered = false;
  }

  function answer(i) {
    const c = state.current;
    if (!c || state.answered) return;
    state.answered = true;
    state.userChoice = i;
    const correct = i === c.answer;
    // 记录进度
    if (c.category !== 'llm') {
      const s = loadStore();
      const st = s.stats[c.category] || { total: 0, correct: 0 };
      st.total += 1; if (correct) st.correct += 1;
      s.stats[c.category] = st;
      saveStore(s);
    }
    // 选项着色
    const btns = $('dxOptions').querySelectorAll('.dx-opt');
    btns.forEach((b, k) => {
      b.disabled = true;
      if (k === c.answer) b.classList.add('correct');
      else if (k === i) b.classList.add('wrong');
    });
    // 答案与解析
    const a = c.analysis || {};
    const wrongMsg = !correct ? ('<div class="dx-sec dx-wrong-why"><h4>⚠️ 你的选择为什么不对</h4><p>你选择了「<b>' + esc(c.options[i]) + '</b>」。' + esc(optNote(c, i)) + '</p></div>') : '';
    const perOpt = '<div class="dx-sec"><h4>🔍 逐项辨析</h4><div class="dx-opt-diff-list">' +
      c.options.map((o, k) => '<div class="dx-opt-diff' + (k === c.answer ? ' is-correct' : '') + '"><span class="dx-opt-key">' + 'ABCD'[k] + '</span><b>' + esc(o) + '</b> — ' + esc(optNote(c, k)) + '</div>').join('') + '</div></div>';
    const ex = (Array.isArray(a.examples) && a.examples.length) ? ('<div class="dx-sec"><h4>💡 举例说明</h4><ul class="dx-ex">' + a.examples.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>') : '';
    $('dxAnswer').hidden = false;
    $('dxAnswer').innerHTML =
      '<div class="dx-verdict ' + (correct ? 'ok' : 'no') + '">' + (correct ? '✅ 回答正确' : '❌ 回答错误') +
      ' · 正确答案：' + esc(c.options[c.answer]) + '</div>' +
      wrongMsg +
      (a.symptoms ? '<div class="dx-sec"><h4>🔍 症状识别</h4><p>' + esc(a.symptoms) + '</p></div>' : '') +
      (a.basis ? '<div class="dx-sec"><h4>📋 诊断依据</h4><p>' + esc(a.basis) + '</p></div>' : '') +
      (a.differential ? '<div class="dx-sec"><h4>⚖️ 鉴别要点</h4><p>' + esc(a.differential) + '</p></div>' : '') +
      perOpt +
      ex +
      (a.ref ? '<div class="dx-sec dx-ref"><h4>📚 权威出处</h4><p>' + esc(a.ref) + '</p></div>' : '');
    $('dxNextBtn').hidden = false;
    updateScore();
    resetLlmResult(true);
  }

  function updateScore() {
    const s = loadStore();
    let t = 0, r = 0;
    Object.keys(s.stats).forEach((k) => { t += s.stats[k].total; r += s.stats[k].correct; });
    const cat = state.cat !== 'all' && s.stats[state.cat] ? s.stats[state.cat] : null;
    $('dxScore').textContent = '已练 ' + t + ' 题 · 正确率 ' + (t ? Math.round(r / t * 100) : 0) + '%' +
      (cat ? '（本类 ' + cat.correct + '/' + cat.total + '）' : '');
  }

  // ---------- 大模型深度解析（逐项差异 + 举例理解） ----------
  function resetLlmResult(showBtn) {
    const bar = $('dxLlmBar');
    const btn = $('dxLlmBtn');
    const box = $('dxLlmResult');
    if (bar) bar.hidden = !(showBtn && window.LLM && window.LLM.isEnabled && window.LLM.isEnabled());
    if (btn) { btn.disabled = false; btn.textContent = '🤖 大模型深度解析（逐项差异 + 举例）'; }
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }

  async function dxLlmExplain() {
    const c = state.current;
    if (!c || !state.answered) return;
    if (!(window.LLM && window.LLM.isEnabled && window.LLM.isEnabled())) { toast('请先在「设置」里启用大模型'); return; }
    const btn = $('dxLlmBtn');
    const box = $('dxLlmResult');
    if (!btn || !box) return;
    btn.disabled = true; btn.textContent = '⏳ 深度解析中…';
    box.hidden = false;
    box.innerHTML = '<div class="dx-sec"><p>🤖 正在生成逐项差异分析与举例理解，通常需几秒到十几秒…</p></div>';
    try {
      const res = await window.LLM.dxExplain({
        vignette: c.vignette,
        question: c.question || '该来访者最可能的诊断是？',
        options: c.options,
        answer: c.answer,
        userChoice: state.userChoice
      });
      if (res && res.ok) {
        box.innerHTML = '<div class="dx-sec dx-llm-sec"><h4>🤖 大模型深度解析</h4><div class="dx-llm-body">' +
          esc(res.text).replace(/\n/g, '<br>') + '</div></div>';
      } else {
        box.innerHTML = '<div class="dx-sec dx-llm-sec"><h4>🤖 大模型深度解析</h4><p class="dx-llm-err">解析失败：' + esc((res && res.error) || '未知错误') + '</p></div>';
      }
    } catch (e) {
      box.innerHTML = '<div class="dx-sec dx-llm-sec"><h4>🤖 大模型深度解析</h4><p class="dx-llm-err">解析失败：' + esc(e && e.message ? e.message : '网络错误') + '</p></div>';
    } finally {
      btn.disabled = false; btn.textContent = '🤖 大模型深度解析（逐项差异 + 举例）';
    }
  }

  function nextQuestion() {
    const pool = currentPool();
    if (pool.length) {
      const idx = pool.findIndex((c) => state.current && c.id === state.current.id);
      const next = pool[(idx + 1) % pool.length];
      state.current = next; state.answered = false; state.generated = false;
    }
    renderCase(); renderCaseList();
  }

  function randomQuestion() {
    const pool = currentPool();
    if (pool.length) {
      state.current = pool[Math.floor(Math.random() * pool.length)];
      state.answered = false; state.generated = false;
      renderCase(); renderCaseList();
    }
  }

  async function doGenerate(llm) {
    const btn = $('dxGenBtn'); const btn2 = $('dxGenLlmBtn');
    if (llm) {
      if (btn2) { btn2.disabled = true; btn2.textContent = '生成中…'; }
      const c = await generateLlm();
      if (btn2) { btn2.disabled = false; btn2.innerHTML = '🤖 深度生成'; }
      if (!c) return;
      state.current = c; state.answered = false; state.generated = true;
      renderCase(); renderCaseList();
      return;
    }
    const c = generateOffline(state.cat);
    state.current = c; state.answered = false; state.generated = true;
    renderCase(); renderCaseList();
    toast('已生成新案例（答案唯一、依据权威）');
  }

  // ---------- 初步判断地图 ----------
  function catLabel(key) {
    const c = window.DX_CATEGORIES.find((x) => x.key === key);
    return c ? c.label : (key === 'llm' ? '大模型生成' : key);
  }

  function renderMapSelect() {
    const sel = $('dxMapSelect'); if (!sel) return;
    const withMap = window.DX_CASES.filter((c) => c.map);
    let list = withMap.slice();
    if (state.mapCase && !list.some((c) => c.id === state.mapCase.id)) list.unshift(state.mapCase);
    sel.innerHTML = list.map((c) => '<option value="' + c.id + '">' + esc(c.title) + '</option>').join('') ||
      '<option value="">（库内暂无带地图案例，请生成）</option>';
    if (list.length && !state.mapCase) state.mapCase = list[0];
    if (state.mapCase && list.some((c) => c.id === state.mapCase.id)) sel.value = state.mapCase.id;
  }

  function renderMap() {
    const body = $('dxMapBody'); if (!body) return;
    const c = state.mapCase;
    if (!c || !c.map) {
      body.innerHTML = '<p class="dx-empty">当前案例未配置「初步判断地图」。请点击左侧「⚡ 生成一个带地图的案例」，或选择带地图的案例查看。</p>';
      return;
    }
    const m = c.map;
    const cog = m.cognition || {};
    const html =
      '<div class="dx-map-case">📌 ' + esc(c.title) + '</div>' +
      '<div class="dx-map-grid">' +
      mapCard('1️⃣', '问题清单', (m.problems || []).map(li).join('')) +
      mapCard('2️⃣', '问题机制',
        (m.needs ? '<div class="dx-map-line"><b>重要但脆弱的需要：</b>' + esc(m.needs) + '</div>' : '') +
        (m.earlyAdversity ? '<div class="dx-map-line"><b>早期不良经历：</b>' + esc(m.earlyAdversity) + '</div>' : '') +
        (cog.self || cog.others || cog.world || cog.condition ? '<div class="dx-map-line"><b>认知机制：</b>' +
          ['自我', '他人', '世界', '条件'].map((k) => { const v = cog[k === '自我' ? 'self' : k === '他人' ? 'others' : k === '世界' ? 'world' : 'condition']; return v ? '<div class="dx-map-sub">' + k + '：' + esc(v) + '</div>' : ''; }).join('') + '</div>' : '') +
        (m.corePain ? '<div class="dx-map-line"><b>核心痛苦：</b>' + esc(m.corePain) + '</div>' : '') +
        (m.maladaptive ? '<div class="dx-map-line"><b>适应不良的反应：</b>' + esc(m.maladaptive) + '</div>' : '')) +
      mapCard('3️⃣', '问题机制根源', (m.roots || []).map(li).join('')) +
      mapCard('4️⃣', '当前诱因', (m.triggers || []).map(li).join('')) +
      mapCard('5️⃣', '资源', (m.resources || []).map(li).join('')) +
      '</div>';
    body.innerHTML = html;
  }
  function li(x) { return '<li>' + esc(x) + '</li>'; }
  function mapCard(no, title, inner) {
    return '<div class="dx-map-card"><h3>' + no + ' ' + esc(title) + '</h3><div class="dx-map-card-body">' + (inner || '<span class="dx-map-none">（未标注）</span>') + '</div></div>';
  }

  // ---------- 区域切换 ----------
  function setArea(area) {
    state.area = area;
    document.querySelectorAll('.dx-seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.dxarea === area));
    $('dxQuizSide').hidden = area !== 'quiz';
    $('dxMapSide').hidden = area !== 'map';
    $('dxRefSide').hidden = area !== 'ref';
    $('dxQuizMain').hidden = area !== 'quiz';
    $('dxMapMain').hidden = area !== 'map';
    $('dxRefMain').hidden = area !== 'ref';
    if (area === 'map') renderMap();
    if (area === 'ref' && window.DXREF) window.DXREF.render();
  }

  function render() {
    if (!window.DX_CASES || !window.DX_CASES.length) return;
    renderCats();
    renderCaseList();
    renderMapSelect();
    if (!state.current) randomQuestion();
    renderCase();
    updateScore();
    renderMap();
    setArea(state.area);
  }

  // ---------- 事件绑定（幂等） ----------
  let bound = false;
  function bind() {
    if (bound) return; bound = true;
    document.querySelectorAll('.dx-seg-btn').forEach((b) => b.addEventListener('click', () => setArea(b.dataset.dxarea)));
    $('dxNextBtn').addEventListener('click', nextQuestion);
    $('dxRandomBtn').addEventListener('click', randomQuestion);
    $('dxGenBtn').addEventListener('click', () => doGenerate(false));
    $('dxGenLlmBtn').addEventListener('click', () => doGenerate(true));
    $('dxLlmBtn').addEventListener('click', dxLlmExplain);
    $('dxMapGenBtn').addEventListener('click', () => {
      state.mapCase = generateOffline('all');
      renderMapSelect(); renderMap();
      toast('已生成带地图的案例');
    });
    $('dxMapSelect').addEventListener('change', () => {
      const v = $('dxMapSelect').value;
      const c = window.DX_CASES.find((x) => x.id === v);
      if (c) { state.mapCase = c; renderMap(); }
    });
    // 大模型生成按钮：有 key 才显示
    const showLlm = window.LLM && window.LLM.isEnabled && window.LLM.isEnabled();
    $('dxGenLlmBtn').hidden = !showLlm;
  }

  window.DIAGNOSIS = { render };
  // 等 DOM 就绪后再绑定（script 在 index.html 底部，DOM 已就绪）
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
