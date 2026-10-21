// 合并 _refdata 下的 JSON chunk 为 renderer 里的数据文件。
// 用法：node bundle.js  （在 _refdata 目录下运行）
'use strict';
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const outDir = path.join(dir, '..');

const SYS = [
  { prefix: 'icd11-', out: 'ref-icd11.js', varname: 'REF_ICD11' },
  { prefix: 'ccmd3-', out: 'ref-ccmd3.js', varname: 'REF_CCMD3' }
];

function sanitize(js) {
  // 避免 U+2028/U+2029 在旧 JS 引擎里成为换行符（JSON.stringify 不会转义它们）
  return js.split('\u2028').join('\\u2028').split('\u2029').join('\\u2029');
}

let grandTotal = 0;
for (const s of SYS) {
  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith(s.prefix) && f.endsWith('.json'))
    .sort();
  let all = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const arr = data.disorders || [];
    if (!Array.isArray(arr)) throw new Error(f + ' 缺少 disorders 数组');
    all = all.concat(arr);
  }
  // 按编码排序（数字优先）
  all.sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), 'en', { numeric: true }));
  // 去重（按 code）
  const seen = new Set();
  all = all.filter((d) => {
    const k = d.code || d.name || JSON.stringify(d);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const js = '/* 自动生成：' + s.varname + ' 诊断标准数据（_refdata/bundle.js 合并 ' + files.length + ' 个 chunk） */\n' +
    'window.' + s.varname + ' = ' + sanitize(JSON.stringify(all)) + ';\n';
  fs.writeFileSync(path.join(outDir, s.out), js, 'utf8');
  console.log(s.out + ' <- ' + files.length + ' chunks, ' + all.length + ' disorders');
  grandTotal += all.length;
}
console.log('TOTAL', grandTotal);
