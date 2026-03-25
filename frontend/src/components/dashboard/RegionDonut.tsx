import { T } from './tokens';

const REGIONS = [
  { label: 'N. America', pct: 37, color: T.accent },
  { label: 'Europe', pct: 25, color: T.purple },
  { label: 'APAC', pct: 17, color: T.green },
  { label: 'LATAM', pct: 12, color: T.yellow },
  { label: 'MEA', pct: 9, color: T.orange },
];

export function RegionDonut() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Revenue by Region</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Q3 2024 breakdown</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.purpleDim, color: T.purple, border: '1px solid rgba(124,58,255,0.2)' }}>DONUT</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 18px' }}>
        {/* SVG Donut */}
        <svg viewBox="0 0 130 130" style={{ width: 130, flexShrink: 0 }}>
          <circle cx={65} cy={65} r={50} fill="none" stroke={T.s4} strokeWidth={18} />
          <circle cx={65} cy={65} r={50} fill="none" stroke={T.accent} strokeWidth={18} strokeDasharray="116 198" strokeLinecap="round" transform="rotate(-90 65 65)" />
          <circle cx={65} cy={65} r={50} fill="none" stroke={T.purple} strokeWidth={18} strokeDasharray="79 235" strokeLinecap="round" transform="rotate(21 65 65)" />
          <circle cx={65} cy={65} r={50} fill="none" stroke={T.green} strokeWidth={18} strokeDasharray="54 260" strokeLinecap="round" transform="rotate(115 65 65)" />
          <circle cx={65} cy={65} r={50} fill="none" stroke={T.yellow} strokeWidth={18} strokeDasharray="38 276" strokeLinecap="round" transform="rotate(168 65 65)" />
          <circle cx={65} cy={65} r={50} fill="none" stroke={T.orange} strokeWidth={18} strokeDasharray="28 286" strokeLinecap="round" transform="rotate(209 65 65)" />
          <text x={65} y={60} fill={T.text} fontSize={14} fontFamily="Syne,sans-serif" fontWeight={800} textAnchor="middle">$11.3M</text>
          <text x={65} y={74} fill={T.text3} fontSize={8} fontFamily="DM Mono,monospace" textAnchor="middle">TOTAL Q3</text>
        </svg>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REGIONS.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: T.text2, flex: 1 }}>{r.label}</span>
              <span style={{ fontSize: '0.75rem', fontFamily: T.fontMono, color: T.text }}>{r.pct}%</span>
              <div style={{ width: 50, height: 4, background: T.s4, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
