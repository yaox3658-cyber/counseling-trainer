// ===================== 诊断训练 · 诊断标准速查（ICD-11 / CCMD-3） =====================
// 依赖 window.REF_ICD11 / window.REF_CCMD3（ref-icd11.js / ref-ccmd3.js，由 _refdata/bundle.js 生成）。
// 暴露 window.DXREF = { render }，由 diagnosis.js 的 setArea('ref') 调用。
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    selected: null,      // 当前选中的 disorder 对象
    query: '',
    open: {}             // block -> boolean
  };

  function icd() { return window.REF_ICD11 || []; }
  function ccmd() { return window.REF_CCMD3 || []; }

  // 按 block 分组（保持出现顺序）
  function groupByBlock(list) {
    const order = [];
    const map = new Map();
    for (const d of list) {
      const key = d.block || '（未分类）';
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key).push(d);
    }
    return order.map((k) => ({ block: k, blockZh: map.get(k)[0].blockZh || k, blockEn: map.get(k)[0].blockEn || '', items: map.get(k) }));
  }

  function match(d, q) {
    return (d.code + ' ' + d.name + ' ' + (d.nameZh || '') + ' ' + (d.nameEn || '')).toLowerCase().indexOf(q) !== -1;
  }

  // ---------- 列表 ----------
  function renderList() {
    const box = $('rxList'); if (!box) return;
    const q = state.query.trim().toLowerCase();
    const icdList = icd(), ccmdList = ccmd();

    if (q) {
      // 搜索结果：扁平展示
      const hits = [];
      icdList.forEach((d) => { if (match(d, q)) hits.push({ d, sys: 'ICD-11' }); });
      ccmdList.forEach((d) => { if (match(d, q)) hits.push({ d, sys: 'CCMD-3' }); });
      box.innerHTML = hits.length
        ? '<div class="rx-searchcount">找到 ' + hits.length + ' 条</div>' + hits.map((h) =>
            '<button class="rx-item' + (state.selected === h.d ? ' active' : '') + '" data-k="' + h.sys + ':' + esc(h.d.code) + '">' +
            '<span class="rx-item-code">' + esc(h.d.code) + '</span>' +
            '<span class="rx-item-name">' + esc(h.d.nameZh || h.d.name) + '</span>' +
            '<span class="rx-item-sys">' + h.sys + '</span></button>').join('')
        : '<p class="dx-empty">没有匹配的障碍。</p>';
      box.querySelectorAll('.rx-item').forEach((b) => b.addEventListener('click', () => selectByKey(b.dataset.k)));
      return;
    }

    // 分组树
    let html = '';
    const groups = [
      { title: '🌐 ICD-11 国际分类', sub: 'Clinical descriptions and diagnostic requirements (WHO)', list: icdList },
      { title: '🇨🇳 CCMD-3 中国分类', sub: '《中国精神障碍分类及诊断标准》（第 3 版）', list: ccmdList }
    ];
    for (const g of groups) {
      if (!g.list.length) continue;
      html += '<div class="rx-sys">' + esc(g.title) + ' <span class="rx-sys-sub">' + esc(g.sub) + '</span></div>';
      const blocks = groupByBlock(g.list);
      for (const blk of blocks) {
        const open = state.open[blk.block] !== undefined ? state.open[blk.block] : false;
        html += '<div class="rx-block">' +
          '<button class="rx-block-head" data-block="' + esc(blk.block) + '">' +
          '<span class="rx-block-arrow">' + (open ? '▾' : '▸') + '</span>' +
          esc(blk.blockZh) + ' <b>' + blk.items.length + '</b></button>' +
          '<div class="rx-block-body"' + (open ? '' : ' hidden') + '>' +
          blk.items.map((d) =>
            '<button class="rx-item' + (state.selected === d ? ' active' : '') + '" data-k="' + (g.title.indexOf('ICD') !== -1 ? 'ICD-11' : 'CCMD-3') + ':' + esc(d.code) + '">' +
            '<span class="rx-item-code">' + esc(d.code) + '</span>' +
            '<span class="rx-item-name">' + esc(d.nameZh || d.name) + '</span></button>').join('') +
          '</div></div>';
      }
    }
    box.innerHTML = html;
    box.querySelectorAll('.rx-block-head').forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.block;
      state.open[key] = !(state.open[key] || false);
      renderList();
    }));
    box.querySelectorAll('.rx-item').forEach((b) => b.addEventListener('click', () => selectByKey(b.dataset.k)));
  }

  function selectByKey(key) {
    const [sys, code] = key.split(/:(.*)/);
    const list = sys === 'ICD-11' ? icd() : ccmd();
    const d = list.find((x) => String(x.code) === code);
    if (d) { state.selected = d; renderDetail(d); renderList(); }
  }

  // ---------- 详情 ----------
  function renderDetail(d) {
    const box = $('rxDetail'); if (!box) return;
    if (!d) { box.innerHTML = '<p class="dx-empty">在左侧选择障碍，查看其诊断标准（中英对照）。</p>'; return; }
    const isIcd = !!d.sections;
    let html = '<div class="rx-head">' +
      '<div class="rx-head-code">' + esc(d.code) + '</div>' +
      '<div class="rx-head-name">' + esc(d.nameZh || d.name) + (d.name && d.nameZh && d.name !== d.nameZh ? ' <span class="rx-head-en">' + esc(d.name) + '</span>' : '') + '</div>' +
      '<div class="rx-head-block">' + esc(d.blockZh || d.block || '') + '</div>' +
      '</div>';

    if (isIcd) {
      html += d.sections.map((s) =>
        '<div class="rx-sec">' +
        '<h3>' + esc(s.headZh || s.head) + ' <span class="rx-sec-en">' + esc(s.head) + '</span></h3>' +
        (s.zh ? '<p class="rx-zh">' + esc(s.zh) + '</p>' : '') +
        (s.en ? '<p class="rx-en">' + esc(s.en) + '</p>' : '') +
        '</div>').join('');
    } else {
      html += (d.criteria || []).map((c) =>
        '<div class="rx-sec">' +
        '<h3>' + esc(c.section || '诊断标准') + '</h3>' +
        (c.text ? '<p class="rx-zh">' + esc(c.text) + '</p>' : '') +
        '</div>').join('');
    }
    box.innerHTML = html;
    box.scrollTop = 0;
  }

  function render() {
    const n = icd().length + ccmd().length;
    $('rxCount').textContent = 'ICD-11 ' + icd().length + ' · CCMD-3 ' + ccmd().length;
    if (!n) {
      $('rxList').innerHTML = '<p class="dx-empty">诊断标准数据未加载（请确认 ref-icd11.js / ref-ccmd3.js 已生成）。</p>';
      $('rxDetail').innerHTML = '';
      return;
    }
    if (!state.selected) state.selected = icd()[0] || ccmd()[0];
    if (state.selected) {
      // 展开包含选中项的块
      const blk = state.selected.block;
      if (blk && state.open[blk] === undefined) state.open[blk] = true;
    }
    renderList();
    renderDetail(state.selected);
  }

  // ---------- 事件绑定（幂等） ----------
  let bound = false;
  function bind() {
    if (bound) return; bound = true;
    const s = $('rxSearch');
    if (s) s.addEventListener('input', () => { state.query = s.value; renderList(); });
  }

  window.DXREF = { render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
