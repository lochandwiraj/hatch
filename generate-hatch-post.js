const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '.agents', 'skills', 'canvas-design', 'canvas-fonts');

GlobalFonts.registerFromPath(path.join(fontsDir, 'BricolageGrotesque-Bold.ttf'), 'Bricolage');
GlobalFonts.registerFromPath(path.join(fontsDir, 'BricolageGrotesque-Regular.ttf'), 'BricolageLight');
GlobalFonts.registerFromPath(path.join(fontsDir, 'InstrumentSans-Regular.ttf'), 'Instrument');
GlobalFonts.registerFromPath(path.join(fontsDir, 'InstrumentSans-Bold.ttf'), 'InstrumentBold');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Outfit-Regular.ttf'), 'Outfit');

const W = 1080;
const H = 1080;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// --- Background: deep warm charcoal ---
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#0f0d0b');
bg.addColorStop(0.5, '#1a1410');
bg.addColorStop(1, '#0d0b0a');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// --- Radial warm glow center-bottom ---
const glow = ctx.createRadialGradient(W / 2, H * 0.72, 0, W / 2, H * 0.72, 520);
glow.addColorStop(0, 'rgba(255, 160, 50, 0.22)');
glow.addColorStop(0.45, 'rgba(220, 90, 30, 0.10)');
glow.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

// --- Top-left secondary glow ---
const glow2 = ctx.createRadialGradient(80, 80, 0, 80, 80, 320);
glow2.addColorStop(0, 'rgba(255, 200, 80, 0.10)');
glow2.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = glow2;
ctx.fillRect(0, 0, W, H);

// --- Subtle grid lines ---
ctx.save();
ctx.globalAlpha = 0.035;
ctx.strokeStyle = '#e8a84b';
ctx.lineWidth = 0.8;
for (let x = 0; x <= W; x += 54) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
}
for (let y = 0; y <= H; y += 54) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}
ctx.restore();

// --- Arc rings (hatching motif) ---
function drawArc(cx, cy, r, startAngle, endAngle, color, lineWidth, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.stroke();
  ctx.restore();
}

const CX = W / 2, CY = H * 0.48;

drawArc(CX, CY, 310, Math.PI * 1.15, Math.PI * 1.85, '#e8a84b', 1.2, 0.18);
drawArc(CX, CY, 295, Math.PI * 0.2,  Math.PI * 0.75, '#c06020', 0.8, 0.12);
drawArc(CX, CY, 230, Math.PI * 1.05, Math.PI * 1.55, '#f0b860', 1.5, 0.22);
drawArc(CX, CY, 215, Math.PI * 0.3,  Math.PI * 0.9,  '#d07030', 1.0, 0.15);
drawArc(CX, CY, 155, Math.PI * 1.1,  Math.PI * 1.9,  '#e8a84b', 2.0, 0.30);
drawArc(CX, CY, 140, Math.PI * 0.15, Math.PI * 0.85, '#ff9040', 1.2, 0.18);
drawArc(CX, CY, 80,  0,              Math.PI * 2,     '#e8a84b', 0.7, 0.20);

// --- Radiating burst lines ---
ctx.save();
ctx.globalAlpha = 0.07;
ctx.strokeStyle = '#f0c060';
ctx.lineWidth = 0.6;
for (let i = 0; i < 36; i++) {
  const angle = (i / 36) * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(CX + Math.cos(angle) * 100, CY + Math.sin(angle) * 100);
  ctx.lineTo(CX + Math.cos(angle) * 370, CY + Math.sin(angle) * 370);
  ctx.stroke();
}
ctx.restore();

// --- Diamond accents top-center ---
function diamond(x, y, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.55, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.55, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

diamond(W / 2, 108, 8, '#e8a84b', 0.85);
diamond(W / 2 - 28, 108, 4, '#c06020', 0.55);
diamond(W / 2 + 28, 108, 4, '#c06020', 0.55);

// --- Texture dots ---
ctx.save();
[
  [120,190,1.8],[960,210,1.4],[85,820,1.6],[998,860,1.5],
  [200,960,1.2],[880,940,1.3],[50,540,1.0],[1030,480,1.1],
  [340,60,1.3],[720,50,1.5],[410,1020,1.2],[680,1015,1.0],
  [160,680,0.9],[920,700,0.9],[270,120,1.1],[800,130,1.0],
].forEach(([x, y, r]) => {
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#e8a84b';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
});
ctx.restore();

// --- Thin horizontal dividers ---
ctx.save();
ctx.globalAlpha = 0.18;
ctx.strokeStyle = '#e8a84b';
ctx.lineWidth = 0.5;
ctx.beginPath(); ctx.moveTo(80, 148); ctx.lineTo(W - 80, 148); ctx.stroke();
ctx.beginPath(); ctx.moveTo(80, H - 148); ctx.lineTo(W - 80, H - 148); ctx.stroke();
ctx.restore();

// --- "EST. 2025" micro-label ---
ctx.save();
ctx.globalAlpha = 0.40;
ctx.fillStyle = '#e8a84b';
ctx.font = '11px Instrument';
ctx.textAlign = 'center';
ctx.fillText('E S T .   2 0 2 5', W / 2, 136);
ctx.restore();

// --- Side watermark (rotated) ---
ctx.save();
ctx.globalAlpha = 0.12;
ctx.fillStyle = '#e8a84b';
ctx.font = '10px Instrument';
ctx.textAlign = 'center';
ctx.translate(38, H / 2);
ctx.rotate(-Math.PI / 2);
ctx.fillText('H A T C H   E V E N T S', 0, 0);
ctx.restore();

// --- Main wordmark: HATCH ---
ctx.save();
ctx.fillStyle = '#f5f0eb';
ctx.font = '148px Bricolage';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('HATCH', W / 2, CY - 6);
ctx.restore();

// Warm underline beneath wordmark
ctx.save();
ctx.globalAlpha = 0.55;
ctx.strokeStyle = '#e8a84b';
ctx.lineWidth = 1.2;
ctx.beginPath();
ctx.moveTo(W / 2 - 190, CY + 75);
ctx.lineTo(W / 2 + 190, CY + 75);
ctx.stroke();
ctx.restore();

// --- Tagline ---
ctx.save();
ctx.globalAlpha = 0.72;
ctx.fillStyle = '#e8c890';
ctx.font = '26px Instrument';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Your events, elevated.', W / 2, CY + 112);
ctx.restore();

// --- "NOW LIVE" pill badge ---
const pillW = 200, pillH = 38;
const pillX = W / 2 - pillW / 2, pillY = H - 190;

ctx.save();
ctx.globalAlpha = 0.14;
ctx.fillStyle = '#e8a84b';
ctx.beginPath();
ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
ctx.fill();
ctx.restore();

ctx.save();
ctx.globalAlpha = 0.55;
ctx.strokeStyle = '#e8a84b';
ctx.lineWidth = 0.8;
ctx.beginPath();
ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
ctx.stroke();
ctx.restore();

ctx.save();
ctx.globalAlpha = 0.85;
ctx.fillStyle = '#f0c878';
ctx.font = '12px InstrumentBold';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('✦  NOW LIVE  ✦', W / 2, pillY + pillH / 2);
ctx.restore();

// --- Bottom domain ---
ctx.save();
ctx.globalAlpha = 0.32;
ctx.fillStyle = '#e8a84b';
ctx.font = '13px Outfit';
ctx.textAlign = 'center';
ctx.textBaseline = 'alphabetic';
ctx.fillText('hatchevent.in', W / 2, H - 100);
ctx.restore();

// --- Corner precision marks ---
function cornerMark(x, y, sx, sy) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#e8a84b';
  ctx.lineWidth = 0.8;
  const s = 18, g = 62;
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.beginPath();
  ctx.moveTo(g, g - s);
  ctx.lineTo(g, g);
  ctx.lineTo(g - s, g);
  ctx.stroke();
  ctx.restore();
}
cornerMark(0,   0,   1,  1);
cornerMark(W,   0,  -1,  1);
cornerMark(0,   H,   1, -1);
cornerMark(W,   H,  -1, -1);

// --- Save PNG ---
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('hatch-first-post.png', buffer);
console.log('hatch-first-post.png saved (' + Math.round(buffer.length / 1024) + ' KB)');
