// ===================== 动画来访者 =====================
// 通过切换 SVG 各部位的形状/透明度来表现情绪，CSS 过渡让表情平滑变化。
(function () {
  'use strict';

  // —— 眉形（左/右）——
  const B_NEUTRAL_L = 'M112 118 Q128 108 148 116';
  const B_NEUTRAL_R = 'M172 116 Q192 108 208 118';
  const B_RAISE_L = 'M112 110 Q128 98 148 106';
  const B_RAISE_R = 'M172 106 Q192 98 208 110';
  const B_WORRY_L = 'M112 121 Q128 108 148 111';
  const B_WORRY_R = 'M172 111 Q192 108 208 121';
  const B_ANGRY_L = 'M112 114 Q128 121 148 110';
  const B_ANGRY_R = 'M172 110 Q192 121 208 114';
  const B_CONFUSE_L = 'M112 110 Q128 101 148 113';
  const B_CONFUSE_R = 'M172 119 Q192 112 208 121';

  // —— 嘴形 ——
  const M_NEUTRAL = 'M136 222 Q160 214 184 222';
  const M_SMILE = 'M132 219 Q160 204 188 219';
  const M_FROWN = 'M136 226 Q160 235 184 226';
  const M_ANGRY = 'M136 229 Q160 221 184 229';
  const M_WAVY = 'M136 225 Q148 216 160 225 Q172 234 184 225';
  const M_FLAT = 'M140 222 Q160 222 180 222';
  const M_RELIEF = 'M140 219 Q160 208 180 219';
  const M_CRY = 'M136 227 Q160 238 184 227';
  const M_CONFUSED = 'M143 222 Q152 217 160 224 Q173 228 181 219';
  const M_TALK = 'M142 215 Q160 200 178 215'; // 说话时的张口
  const M_TALK_BIG = 'M136 212 Q160 194 184 212'; // 说话时更大张口

  const EMOTIONS = {
    neutral: {
      label: '平静', browL: B_NEUTRAL_L, browR: B_NEUTRAL_R,
      eye: 'scale(1,1)', pupilDX: 0, pupilDY: 0,
      mouth: M_NEUTRAL, tears: 0, sweat: 0, blush: 0
    },
    anxious: {
      label: '焦虑', browL: B_WORRY_L, browR: B_WORRY_R,
      eye: 'scale(1.05,1.05)', pupilDX: -3, pupilDY: 2,
      mouth: M_WAVY, tears: 0, sweat: 1, blush: 0
    },
    sad: {
      label: '悲伤', browL: B_WORRY_L, browR: B_WORRY_R,
      eye: 'scale(0.9,0.82)', pupilDX: 0, pupilDY: 6,
      mouth: M_FROWN, tears: 0, sweat: 0, blush: 0
    },
    tearful: {
      label: '流泪', browL: B_WORRY_L, browR: B_WORRY_R,
      eye: 'scale(0.88,0.78)', pupilDX: 0, pupilDY: 7,
      mouth: M_CRY, tears: 1, sweat: 0, blush: 0
    },
    angry: {
      label: '愤怒', browL: B_ANGRY_L, browR: B_ANGRY_R,
      eye: 'scale(0.85,0.7)', pupilDX: 0, pupilDY: 2,
      mouth: M_ANGRY, tears: 0, sweat: 0, blush: 0
    },
    fearful: {
      label: '恐惧', browL: B_RAISE_L, browR: B_RAISE_R,
      eye: 'scale(1.18,1.18)', pupilDX: 0, pupilDY: -1,
      mouth: M_CONFUSED, tears: 0, sweat: 0, blush: 0
    },
    happy: {
      label: '开心', browL: B_NEUTRAL_L, browR: B_NEUTRAL_R,
      eye: 'scale(1,0.14)', pupilDX: 0, pupilDY: 0,
      mouth: M_SMILE, tears: 0, sweat: 0, blush: 1
    },
    confused: {
      label: '困惑', browL: B_CONFUSE_L, browR: B_CONFUSE_R,
      eye: 'scale(1,0.92)', pupilDX: 3, pupilDY: 1,
      mouth: M_CONFUSED, tears: 0, sweat: 0, blush: 0
    },
    relieved: {
      label: '释然', browL: B_NEUTRAL_L, browR: B_NEUTRAL_R,
      eye: 'scale(0.95,0.9)', pupilDX: 0, pupilDY: 2,
      mouth: M_RELIEF, tears: 0, sweat: 0, blush: 1
    },
    flat: {
      label: '低落', browL: B_NEUTRAL_L, browR: B_NEUTRAL_R,
      eye: 'scale(1,0.6)', pupilDX: 0, pupilDY: 4,
      mouth: M_FLAT, tears: 0, sweat: 0, blush: 0
    },
    ashamed: {
      label: '羞愧', browL: B_WORRY_L, browR: B_WORRY_R,
      eye: 'scale(0.9,0.8)', pupilDX: 0, pupilDY: 7,
      mouth: M_CONFUSED, tears: 0, sweat: 0, blush: 1
    }
  };

  // 案例中使用的情绪词 → 视觉状态
  const ALIAS = {
    anxious: 'anxious', nervous: 'anxious', worried: 'anxious',
    sad: 'sad', tearful: 'tearful', crying: 'tearful', grief: 'tearful',
    angry: 'angry', resentful: 'angry', irritable: 'angry',
    fearful: 'fearful', avoidant: 'fearful', afraid: 'fearful',
    happy: 'happy', relieved: 'relieved', calm: 'relieved',
    confused: 'confused', conflicted: 'confused', ambivalent: 'confused',
    flat: 'flat', empty: 'flat', low: 'flat', numbed: 'flat',
    ashamed: 'ashamed', guilty: 'ashamed', neutral: 'neutral'
  };

  let current = 'neutral';
  let talking = false;
  let talkTimer = null;
  let open = 0;

  function el(id) { return document.getElementById(id); }

  function init() {
    ['browL', 'browR', 'eyeL', 'eyeR', 'mouth', 'headGroup', 'body'].forEach((id) => {
      const n = el(id);
      if (n) { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; }
    });
  }

  function apply(emotionKey, isTalk) {
    const e = EMOTIONS[emotionKey] || EMOTIONS.neutral;
    el('browL').setAttribute('d', e.browL);
    el('browR').setAttribute('d', e.browR);
    el('eyeL').setAttribute('transform', e.eye);
    el('eyeR').setAttribute('transform', e.eye);
    el('pupilL').setAttribute('cx', 130 + e.pupilDX);
    el('pupilR').setAttribute('cx', 190 + e.pupilDX);
    el('pupilL').setAttribute('cy', 150 + e.pupilDY);
    el('pupilR').setAttribute('cy', 150 + e.pupilDY);
    el('mouth').setAttribute('d', isTalk ? M_TALK : e.mouth);
    el('tearL').setAttribute('opacity', e.tears);
    el('tearR').setAttribute('opacity', e.tears);
    el('sweat').setAttribute('opacity', e.sweat);
    el('blushL').setAttribute('opacity', e.blush);
    el('blushR').setAttribute('opacity', e.blush);
    const tag = el('emotionTag');
    if (tag) tag.textContent = e.label;
  }

  function setEmotion(name) {
    current = ALIAS[name] || name || 'neutral';
    const svg = el('avatar');
    if (svg) svg.setAttribute('data-emo', current);
    apply(current, talking);
  }

  // 说话时只动嘴（三种张口状态循环），并让头部轻微点头
  function applyMouth(shape) {
    const m = el('mouth');
    if (m) m.setAttribute('d', shape);
  }

  function talkTick() {
    if (!talking) return;
    const e = EMOTIONS[current] || EMOTIONS.neutral;
    open = (open + 1) % 3;
    applyMouth(open === 0 ? M_TALK : open === 1 ? M_TALK_BIG : e.mouth);
    talkTimer = setTimeout(talkTick, 110 + Math.random() * 90);
  }

  function startTalking() {
    talking = true;
    open = 0;
    const hg = el('headGroup');
    if (hg) hg.classList.add('talking');
    if (talkTimer) clearTimeout(talkTimer);
    apply(current, false);
    talkTick();
  }

  function stopTalking() {
    talking = false;
    const hg = el('headGroup');
    if (hg) hg.classList.remove('talking');
    if (talkTimer) { clearTimeout(talkTimer); talkTimer = null; }
    apply(current, false);
  }

  function getIdle(emotionKey) { return (EMOTIONS[emotionKey] || EMOTIONS.neutral).label; }

  window.Avatar = { init, setEmotion, startTalking, stopTalking, EMOTIONS, ALIAS };
})();
