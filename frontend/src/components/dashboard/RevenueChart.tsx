import { T } from './tokens';

export function RevenueChart() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, borderRadius: 2, background: T.border2, opacity: 0.45 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Monthly Revenue Trend</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Jul - Sep 2024 · All regions</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 4, background: T.accentDim, color: T.accent, border: '1px solid rgba(0,229,255,0.2)' }}>LINE</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {['<>', '...'].map((label) => (
            <button key={label} style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, transition: 'all 0.15s', fontSize: '0.7rem' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, padding: '10px 18px 4px' }}>
        {[
          { color: T.accent, label: 'Revenue' },
          { color: T.purple, label: 'Target', opacity: 0.6 },
          { color: T.green, label: 'Last Year', dashed: true },
        ].map((legend) => (
          <div key={legend.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>
            <div style={{ width: 16, borderRadius: 2, background: legend.color, opacity: legend.opacity || 1, borderTop: legend.dashed ? `2px dashed ${legend.color}` : undefined, height: legend.dashed ? 0 : 2 }} />
            {legend.label}
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 18px 16px' }}>
        <svg viewBox="0 0 520 160" style={{ width: '100%' }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <line x1={40} y1={10} x2={40} y2={130} stroke="rgba(255,255,255,0.08)" />
          <line x1={40} y1={130} x2={510} y2={130} stroke="rgba(255,255,255,0.08)" />
          {[40, 70, 100].map((y) => <line key={y} x1={40} y1={y} x2={510} y2={y} stroke="rgba(255,255,255,0.04)" />)}
          {['$4M', '$3M', '$2M', '$1M'].map((label, index) => (
            <text key={label} x={34} y={43 + index * 30} textAnchor="end" fontFamily="DM Mono,monospace" fontSize={9} fill="#4a5568">{label}</text>
          ))}
          {['Jul 1', 'Jul 15', 'Aug 1', 'Aug 15', 'Sep 1', 'Sep 15'].map((label, index) => (
            <text key={label} x={93 + index * 75} y={143} textAnchor="middle" fontFamily="DM Mono,monospace" fontSize={9} fill="#4a5568">{label}</text>
          ))}
          <path d="M40,110 L93,105 L168,100 L243,92 L318,88 L393,82 L468,78 L510,75" fill="none" stroke="#22d3a5" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.6} />
          <path d="M40,95 L93,90 L168,85 L243,80 L318,75 L393,68 L468,63 L510,60" fill="none" stroke="#7c3aff" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
          <path d="M40,108 L93,100 L168,88 L243,78 L318,65 L393,52 L468,38 L510,30 L510,130 L40,130Z" fill="url(#revGrad)" />
          <path d="M40,108 L93,100 L168,88 L243,78 L318,65 L393,52 L468,38 L510,30" fill="none" stroke="#00e5ff" strokeWidth={2} />
          {[[93, 100], [168, 88], [243, 78], [318, 65], [393, 52], [468, 38]].map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r={3} fill="#00e5ff" />
          ))}
          <line x1={393} y1={10} x2={393} y2={130} stroke="rgba(0,229,255,0.15)" strokeDasharray="3,3" />
          <rect x={355} y={8} width={76} height={30} rx={5} fill="#0f1929" stroke="rgba(0,229,255,0.2)" />
          <text x={393} y={19} textAnchor="middle" fontFamily="DM Mono,monospace" fontSize={9} fill="#94a3b8">Sep 1</text>
          <text x={393} y={31} textAnchor="middle" fontFamily="DM Mono,monospace" fontSize={10} fill="#00e5ff" fontWeight={600}>$3.84M</text>
        </svg>
      </div>
    </div>
  );
}
