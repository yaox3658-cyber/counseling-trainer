/* =============================================================
 * 谈心 · 咨询师画像（talk-avatar.js）
 * 一个「可爱而细腻」的咨询师 SVG 画像的表情引擎。
 * - 依据来访者话语中的情绪线索（中文关键词）给出细腻、克制的表情；
 * - 表情变化带平滑过渡（CSS transition），说话时轻微点头律动。
 * 暴露：window.TALK_AVATAR = { react, setEmotion, startTalking, stopTalking, EMOTIONS }
 * ============================================================= */
(function () {
  'use strict';

  var EYE_L = document.getElementById('tkEyeL');
  var EYE_R = document.getElementById('tkEyeR');
  var BROW_L = document.getElementById('tkBrowL');
  var BROW_R = document.getElementById('tkBrowR');
  var MOUTH = document.getElementById('tkMouth');
  var BLUSH_L = document.getElementById('tkBlushL');
  var BLUSH_R = document.getElementById('tkBlushR');
  var HEAD = document.getElementById('tkHeadGroup');
  var SVG = document.getElementById('tkAvatar');
  var TAG = document.getElementById('tkEmotionTag');

  if (!SVG) { window.TALK_AVATAR = null; return; }

  /* 嘴巴形状：控制点放在端点下方 → 两端上扬的「U 型微笑」 */
  var MOUTHS = {
    soft:    'M108 148 Q120 157 132 148',                          // 温和微笑（默认）
    calm:    'M109 150 Q120 156 131 150',                          // 平静温柔（浅笑）
    warm:    'M106 147 Q120 159 134 147',                          // 温暖欣慰（明显暖笑）
    gentle:  'M108 149 Q120 157 132 149',                          // 轻柔安抚
    concern: 'M110 151 Q120 155 130 151',                          // 认真关切（仍温和上扬）
    talk:    'M109 151 Q120 143 131 151 Q120 159 109 151 Z',       // 说话（小开口）
    talkBig: 'M107 150 Q120 141 133 150 Q120 161 107 150 Z'        // 说话（略大开口）
  };

  /* 眉毛形状：M 起点 → Q 控制点 → 终点 */
  var BROWS = {
    neutral: { l: 'M86 100 Q100 93 114 100', r: 'M126 100 Q140 93 154 100' },
    soft:    { l: 'M86 98 Q100 90 114 98',    r: 'M126 98 Q140 90 154 98' },
    worry:   { l: 'M86 103 Q100 95 114 97',   r: 'M126 97 Q140 95 154 103' },
    tender:  { l: 'M86 105 Q100 96 114 96',   r: 'M126 96 Q140 96 154 105' }
  };

  /* 表情配置：每种情绪对应一套「细腻」的部件组合 */
  var EMOTIONS = {
    attentive: { label: '温柔倾听', brow: 'soft',    eye: 'scale(1,1)',        pupil: '0 0', mouth: 'soft',    blush: 0.20, tilt: 0 },
    sympathy:  { label: '温柔共情', brow: 'tender',  eye: 'scale(0.96,0.9)',  pupil: '0 2', mouth: 'gentle',  blush: 0.30, tilt: 2.2 },
    concern:   { label: '认真关切', brow: 'worry',   eye: 'scale(1.06,1.06)', pupil: '0 0', mouth: 'concern', blush: 0.10, tilt: 0.8 },
    empathy:   { label: '温暖安抚', brow: 'soft',    eye: 'scale(1,0.85)',    pupil: '0 1', mouth: 'warm',    blush: 0.42, tilt: 1.6 },
    warm:      { label: '温暖欣慰', brow: 'soft',    eye: 'scale(1,0.82)',    pupil: '0 0', mouth: 'warm',    blush: 0.50, tilt: 0.8 },
    calm:      { label: '平静陪伴', brow: 'neutral', eye: 'scale(1,1)',       pupil: '0 0', mouth: 'calm',    blush: 0.14, tilt: 0 },
    thinking:  { label: '专注思考', brow: 'neutral', eye: 'scale(1,1)',       pupil: '3 0', mouth: 'calm',    blush: 0.14, tilt: -1.6 }
  };

  /* 中文情绪线索词典（权重用于排序） */
  var LEXICON = {
    crisis: { weight: 10, words: ['自杀','自伤','自残','割腕','割脉','轻生','想死','去死','不想活','活不下去','结束生命','了结自己','伤害自己','伤害我自己','不想活了','解脱','跳楼','寻死','安眠药过量','遗书'] },
    sad:    { weight: 4,  words: ['难过','伤心','想哭','流泪','哭了','委屈','无助','绝望','孤独','孤单','寂寞','痛苦','很累','好累','心累','疲惫','崩溃','撑不住','撑不下去','失落','沮丧','郁闷','压抑','失去','分手','离婚','失恋','没人在乎','没人懂','没人理解','被抛弃','被忽视','被冷落','憋屈','心如死灰','万念俱灰'] },
    anxious:{ weight: 3,  words: ['焦虑','紧张','害怕','恐惧','恐慌','担心','不安','心慌','失眠','睡不着','睡不好','怕','慌乱','害怕出错','怕失败','坐立不安','提心吊胆','心神不宁'] },
    angry:  { weight: 2,  words: ['生气','愤怒','气死','好气','讨厌','烦躁','窝火','火大','恨','受不了','凭什么','不公平','发火','恼火','憋气'] },
    positive:{weight: 3,  words: ['开心','高兴','好多了','好一些','好点','谢谢','感谢','进步','轻松','舒服','释怀','想通','有希望','有信心','温暖','欣慰','喜欢','安心','踏实','松了口气'] },
    confused:{weight: 2,  words: ['迷茫','纠结','矛盾','不知道','不确定','搞不懂','犹豫','困惑','左右为难','拿不定主意','没方向','看不清'] }
  };

  /* 依据来访者话语，判定情绪类别（crisis 优先级最高） */
  function classify(text) {
    if (!text) return 'attentive';
    var t = String(text);
    var scores = {};
    var crisisHit = false;
    for (var cat in LEXICON) {
      var n = 0;
      var ws = LEXICON[cat].words;
      for (var i = 0; i < ws.length; i++) {
        if (t.indexOf(ws[i]) !== -1) n++;
      }
      if (cat === 'crisis' && n > 0) crisisHit = true;
      scores[cat] = n;
    }
    if (crisisHit) return 'concern';

    var best = null, bestScore = 0;
    for (var c in scores) {
      var s = scores[c] * LEXICON[c].weight;
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (bestScore <= 0) return 'attentive';
    var map = { crisis:'concern', sad:'sympathy', anxious:'empathy', angry:'calm', positive:'warm', confused:'thinking' };
    return map[best] || 'attentive';
  }

  function setPupil(dx, dy) {
    // 瞳孔：虹膜+瞳孔一起轻微移动，营造视线方向；高光（第 3 个 circle）保持不动
    [EYE_L, EYE_R].forEach(function (eye, ei) {
      if (!eye) return;
      var circles = eye.querySelectorAll('circle');
      var baseCx = ei === 0 ? 101 : 139;
      var baseCy = 116;
      if (circles[0]) { circles[0].setAttribute('cx', baseCx + dx); circles[0].setAttribute('cy', baseCy + dy); }
      if (circles[1]) { circles[1].setAttribute('cx', baseCx + dx); circles[1].setAttribute('cy', baseCy + dy); }
    });
  }

  var current = 'attentive';

  function apply(name, animate) {
    var e = EMOTIONS[name] || EMOTIONS.attentive;
    current = name;
    var brow = BROWS[e.brow] || BROWS.neutral;
    if (BROW_L) BROW_L.setAttribute('d', brow.l);
    if (BROW_R) BROW_R.setAttribute('d', brow.r);
    if (EYE_L) EYE_L.style.transform = e.eye;
    if (EYE_R) EYE_R.style.transform = e.eye;
    if (MOUTH) MOUTH.setAttribute('d', MOUTHS[e.mouth]);
    if (BLUSH_L) BLUSH_L.style.opacity = e.blush;
    if (BLUSH_R) BLUSH_R.style.opacity = e.blush;
    if (HEAD) HEAD.style.transform = 'rotate(' + e.tilt + 'deg)';
    var parts = e.pupil.split(' ');
    setPupil(parseFloat(parts[0] || 0), parseFloat(parts[1] || 0));
    if (TAG) TAG.textContent = e.label;
  }

  var talkTimer = null;

  /* 自然眨眼：随机间隔，让画像始终「活着」，绝不静止 */
  var blinkTimer = null;
  function scheduleBlink() {
    if (blinkTimer) clearTimeout(blinkTimer);
    blinkTimer = setTimeout(doBlink, 2600 + Math.random() * 3200);
  }
  function doBlink() {
    if (document.hidden || !SVG || SVG.classList.contains('tk-talking')) { scheduleBlink(); return; }
    var e = EMOTIONS[current] || EMOTIONS.attentive;
    if (EYE_L) EYE_L.style.transform = 'scale(1,0.08)';
    if (EYE_R) EYE_R.style.transform = 'scale(1,0.08)';
    setTimeout(function () {
      if (EYE_L) EYE_L.style.transform = e.eye;
      if (EYE_R) EYE_R.style.transform = e.eye;
      scheduleBlink();
    }, 130);
  }
  scheduleBlink();

  function startTalking() {
    if (!SVG) return;
    SVG.classList.add('tk-talking');
    var flip = false;
    if (talkTimer) clearInterval(talkTimer);
    talkTimer = setInterval(function () {
      flip = !flip;
      if (MOUTH) MOUTH.setAttribute('d', MOUTHS[flip ? 'talk' : 'talkBig']);
    }, 240);
  }

  function stopTalking() {
    if (!SVG) return;
    SVG.classList.remove('tk-talking');
    if (talkTimer) { clearInterval(talkTimer); talkTimer = null; }
    apply(current); // 恢复当前情绪的嘴巴
  }

  window.TALK_AVATAR = {
    EMOTIONS: EMOTIONS,
    react: function (text) { apply(classify(text)); },
    setEmotion: function (name) { apply(name); },
    startTalking: startTalking,
    stopTalking: stopTalking
  };

  apply('attentive');
})();
