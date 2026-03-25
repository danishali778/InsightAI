import { T } from './tokens';

const KPIS = [
  {
    icon: '💰', label: 'Total Revenue', value: '$11.3M',
    sub: 'vs $9.9M last quarter', trend: '▲ +14.2%', up: true,
    color: T.accent, dimColor: T.accentDim,
    spark: 'M0,20 L10,18 L20,15 L30,16 L40,12 L50,10 L60,8 L70,6 L80,5 L90,3 L100,2',
  },
  {
    icon: '👥', label: 'Active Customers', value: '84.2K',
    sub: 'vs 77.4K last quarter', trend: '▲ +8.7%', up: true,
    color: T.purple, dimColor: T.purpleDim,
    spark: 'M0,22 L10,19 L20,20 L30,17 L40,15 L50,14 L60,12 L70,10 L80,8 L90,6 L100,4',
  },
  {
    icon: '📉', label: 'Churn Rate', value: '3.2%',
    sub: '↑ from 2.9% — needs attention', trend: '▲ +0.3%', up: false,
    color: T.red, dimColor: T.redDim, subColor: T.red,
  },
  {
    icon: '🛒', label: 'Avg Order Value', value: '$328',
    sub: 'vs $312 last quarter', trend: '▲ +5.1%', up: true,
    color: T.green, dimColor: T.greenDim,
    spark: 'M0,18 L10,16 L20,17 L30,14 L40,15 L50,12 L60,11 L70,9 L80,8 L90,6 L100,5',
  },
];

export function KpiCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
      {KPIS.map((kpi, i) => (
        <div key={i} style={{
          background: T.s1, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: '18px 20px',
          position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%',
            background: `radial-gradient(circle, ${kpi.dimColor} 0%, transparent 70%)`,
            transform: 'translate(20px, -20px)',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: kpi.dimColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem',
            }}>{kpi.icon}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '0.7rem', fontFamily: T.fontMono,
              padding: '3px 8px', borderRadius: 20,
              background: kpi.up ? T.greenDim : T.redDim,
              color: kpi.up ? T.green : T.red,
            }}>{kpi.trend}</div>
          </div>

          <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.7rem', letterSpacing: -1, color: T.text, lineHeight: 1, marginBottom: 5 }}>
            {kpi.value}
          </div>
          <div style={{ fontSize: '0.75rem', color: T.text3 }}>{kpi.label}</div>
          <div style={{ fontSize: '0.68rem', color: kpi.subColor || T.text3, marginTop: 3, fontFamily: T.fontMono }}>{kpi.sub}</div>

          {kpi.spark && (
            <div style={{ marginTop: 12 }}>
              <svg viewBox="0 0 100 24" style={{ width: '100%', height: 24 }}>
                <defs>
                  <linearGradient id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={kpi.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={`${kpi.spark} L100,24 L0,24Z`} fill={`url(#sg${i})`} />
                <path d={kpi.spark} fill="none" stroke={kpi.color} strokeWidth={1.5} />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
