// Bundled SVG illustration: skyline, curved road, trees and a park.
const towers = [
  [14, 60, 22, 120, '#CFE9EB'], [40, 20, 24, 160, '#BFE0E3'], [70, 70, 26, 110, '#CFE9EB'],
  [150, 40, 20, 140, '#CFE9EB'], [180, 15, 24, 165, '#BFE0E3'], [214, 55, 22, 125, '#CFE9EB'],
  [250, 75, 20, 105, '#D9EEF0'],
  [58, 55, 24, 125, '#0F766E'], [92, 95, 26, 85, '#14897E'], [118, 85, 30, 95, '#E9F4F5'],
  [154, 100, 26, 80, '#0F766E'], [182, 75, 32, 105, '#BFE0E3'], [218, 70, 28, 110, '#0F766E'],
];
const Tree = ({ x, y, s = 1, c = '#4C9A5A' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2" y="0" width="4" height="14" fill="#7A5A3A" />
    <circle cx="0" cy="-6" r="13" fill={c} />
    <circle cx="-8" cy="2" r="9" fill={c} opacity=".9" />
    <circle cx="8" cy="2" r="9" fill={c} opacity=".9" />
  </g>
);

export default function CityIllustration() {
  return (
    <svg viewBox="0 0 300 220" role="img" aria-label="Illustration of a city with buildings, a road, trees and a park" className="city-illustration">
      <ellipse cx="150" cy="150" rx="146" ry="62" fill="#F1F7F7" />
      {towers.map(([x, y, w, h, fill], i) => (
        <g key={i}>
          <rect x={x} y={y + 30} width={w} height={h - 30} fill={fill} />
          {Array.from({ length: Math.floor((h - 40) / 14) }).map((_, r) =>
            [0, 1].map((c) => (
              <rect key={`${r}-${c}`} x={x + 4 + c * (w / 2 - 1)} y={y + 38 + r * 14} width={w / 2 - 6} height="6" fill="#fff" opacity=".55" />
            ))
          )}
        </g>
      ))}
      {/* park */}
      <path d="M110 190 Q200 150 292 160 L292 175 Q210 200 120 205 Z" fill="#7DBB6A" />
      {/* road */}
      <path d="M6 170 Q40 150 100 175 Q170 205 290 180 L290 198 Q170 225 90 200 Q40 182 6 190 Z" fill="#4B5563" />
      <path d="M12 180 Q42 164 100 188 Q170 214 284 190" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="10 8" />
      <Tree x={22} y={140} s={0.9} />
      <Tree x={50} y={150} s={0.7} c="#3E8A52" />
      <Tree x={170} y={175} s={0.8} />
      <Tree x={232} y={178} s={0.7} c="#3E8A52" />
      <Tree x={262} y={120} s={1.3} />
    </svg>
  );
}
