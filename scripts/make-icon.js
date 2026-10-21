/* 生成应用图标 build/icon.png（256×256，离线，无依赖）
 * 设计：青绿圆角底 + 暖白圆脸 + 温和双眼 + 上扬微笑 + 淡腮红 ——「温和的咨询陪伴」意象
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const S = 256;
const px = Buffer.alloc(S * S * 4); // 直通 alpha，非预乘

/* ---------- PNG 编码 ---------- */
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filter none
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- 绘制 ---------- */
function smoothstep(a, b, t) { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); }
function cover(d) { return 1 - smoothstep(-1, 1, d); }

function sdRoundBox(x, y, cx, cy, half, r) {
  const qx = Math.abs(x - cx) - (half - r), qy = Math.abs(y - cy) - (half - r);
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r;
}
function sdCircle(x, y, cx, cy, r) { const dx = x - cx, dy = y - cy; return Math.sqrt(dx * dx + dy * dy) - r; }

function composite(shape) {
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const c = shape(x + 0.5, y + 0.5);
      if (!c || c.a <= 0) continue;
      const i = (y * S + x) * 4;
      const da = px[i + 3] / 255, a = c.a;
      const oa = a + da * (1 - a);
      if (oa <= 0) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
      px[i]     = Math.round((c.r * a + px[i]     * da * (1 - a)) / oa);
      px[i + 1] = Math.round((c.g * a + px[i + 1] * da * (1 - a)) / oa);
      px[i + 2] = Math.round((c.b * a + px[i + 2] * da * (1 - a)) / oa);
      px[i + 3] = Math.round(oa * 255);
    }
  }
}

// 1) 青绿圆角底 + 纵向微渐变
composite((x, y) => {
  const d = sdRoundBox(x, y, 128, 128, 128, 56);
  const a = cover(d);
  if (a <= 0) return null;
  const t = Math.max(0, Math.min(1, (y - 40) / 176));
  return { r: 112 + (74 - 112) * t, g: 170 + (137 - 170) * t, b: 166 + (133 - 166) * t, a };
});

// 2) 暖白圆脸
composite((x, y) => {
  const a = cover(sdCircle(x, y, 128, 150, 84));
  if (a <= 0) return null;
  return { r: 253, g: 248, b: 242, a };
});

// 3) 淡腮红
composite((x, y) => {
  const aL = cover(sdCircle(x, y, 86, 170, 17));
  const aR = cover(sdCircle(x, y, 170, 170, 17));
  const a = Math.max(aL, aR) * 0.45;
  if (a <= 0) return null;
  return { r: 242, g: 169, b: 154, a };
});

// 4) 温和双眼 + 高光
composite((x, y) => {
  const eL = cover(sdCircle(x, y, 98, 142, 12));
  const eR = cover(sdCircle(x, y, 158, 142, 12));
  const a = Math.max(eL, eR);
  if (a <= 0) return null;
  return { r: 74, g: 63, b: 58, a };
});
composite((x, y) => {
  const a = Math.max(cover(sdCircle(x, y, 94, 137, 3.6)), cover(sdCircle(x, y, 154, 137, 3.6)));
  if (a <= 0) return null;
  return { r: 255, g: 255, b: 255, a };
});

// 5) 上扬微笑（U 型弧 + 圆润嘴角）
composite((x, y) => {
  const cx = 128, cy = 164, R = 42, halfT = 7.5;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const deg = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180，向下为正
  let a = 0;
  if (deg >= 34 && deg <= 146) a = cover(Math.abs(dist - R) - halfT);
  // 圆润嘴角（两端小球）
  const c1 = cover(sdCircle(x, y, cx + R * Math.cos(34 * Math.PI / 180), cy + R * Math.sin(34 * Math.PI / 180), halfT));
  const c2 = cover(sdCircle(x, y, cx + R * Math.cos(146 * Math.PI / 180), cy + R * Math.sin(146 * Math.PI / 180), halfT));
  a = Math.max(a, c1, c2);
  if (a <= 0) return null;
  return { r: 229, g: 143, b: 143, a };
});

const out = path.join(__dirname, '..', 'build', 'icon.png');
fs.writeFileSync(out, encodePNG(S, S, px));
console.log('已生成图标：', out, '(', S, 'x', S, ')');
