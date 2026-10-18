// 앱의 Windmill.tsx와 같은 모양을 SVG 문자열로 그린다 (스토어 그림용).
const SWEEPS = {
  savings: ['#00C8B3', '#00C0E8', '#0088FF', '#6155F5'],
  deposit: ['#FFCC00', '#FF8D28', '#FF6B4A', '#FF2D55'],
};
const BLADE_LEN = 72, HUB_R = 10, HUB = { x: 120, y: 84 };

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function bladeColor(i, blades, type) {
  const s = SWEEPS[type];
  const pos = ((i % blades) / Math.max(1, blades - 1)) * (s.length - 1);
  const k = Math.min(Math.floor(pos), s.length - 2), f = pos - k;
  const a = hexToRgb(s[k]), b = hexToRgb(s[k + 1]);
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(',')})`;
}
function sailPath(w, corner, fullFrom = 0.45) {
  const L = BLADE_LEN, r0 = HUB_R + 3;
  const neck = fullFrom > 0.45
    ? `Q ${w} ${-L * 0.3} ${w * 0.3} ${-r0 - 3} Q ${w * 0.1} ${-r0} 0 ${-r0} Z`
    : `Q ${w} ${-r0 - 2.2} ${w * 0.35} ${-r0 - 1} Q ${w * 0.1} ${-r0} 0 ${-r0} Z`;
  return `M 0 ${-r0} L 0 ${-L + corner} Q 0 ${-L} ${corner} ${-L} L ${w - corner} ${-L} Q ${w} ${-L} ${w} ${-L + corner} L ${w} ${-L * fullFrom} ${neck}`;
}
/** type: savings|deposit, filled: 채운 날개 수(0~12), rotate: 날개 회전(도) */
function windmillSVG({ type = 'savings', filled = 12, blades = 12, rotate = 0, id = 'w' }) {
  const path = blades <= 6 ? sailPath(33, 13) : sailPath(18, 8, 0.62);
  let bl = '';
  for (let i = 0; i < blades; i++) {
    const fill = i < filled ? bladeColor(i, blades, type) : '#FFFFFF';
    const op = i < filled ? 1 : 0.75;
    bl += `<path d="${path}" fill="${fill}" fill-opacity="${op}" transform="rotate(${(360 / blades) * i})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 188">
  <defs><linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6F6F9"/><stop offset="0.55" stop-color="#E6E6EC"/><stop offset="1" stop-color="#D2D2DA"/></linearGradient></defs>
  <ellipse cx="120" cy="181" rx="30" ry="3.5" fill="#000" fill-opacity="0.08"/>
  <path d="M105 180 Q106 119 115.4 91 Q120 84.5 124.6 91 Q134 119 135 180 Q120 184 105 180 Z" fill="url(#${id}t)"/>
  <g transform="translate(${HUB.x} ${HUB.y}) rotate(${rotate})">${bl}
    <circle r="${HUB_R + 1.5}" fill="#000" fill-opacity="0.08"/><circle r="${HUB_R}" fill="#FFFFFF"/><circle r="2.5" fill="#C7C7CC"/>
  </g></svg>`;
}
