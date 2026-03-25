import { T } from './tokens';

/* ═══ Top Products Bar Chart ═══ */
export function TopProducts() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Top Products</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Revenue Q3 2024</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.greenDim, color: T.green, border: '1px solid rgba(34,211,165,0.2)' }}>BAR</span>
      </div>
      <div style={{ padding: '12px 18px 16px' }}>
        <svg viewBox="0 0 260 150" style={{ width: '100%' }}>
          <defs><linearGradient id="barG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00e5ff" /><stop offset="100%" stopColor="#7c3aff" /></linearGradient></defs>
          <line x1={70} y1={0} x2={70} y2={125} stroke="rgba(255,255,255,0.08)" />
          {[['Pro Plan', 170, '$4.8M'], ['Enterprise', 142, '$3.2M'], ['Starter', 115, '$2.6M'], ['Add-ons', 88, '$1.4M'], ['Services', 62, '$0.8M']].map(([label, w, val], i) => (
            <g key={i}>
              <rect x={70} y={5 + i * 25} width={Number(w)} height={18} rx={3} fill="url(#barG)" opacity={0.95 - i * 0.15} />
              <text x={64} y={18 + i * 25} textAnchor="end" fontFamily="DM Mono,monospace" fontSize={9} fill="#4a5568">{label as string}</text>
              <text x={76 + Number(w)} y={18 + i * 25} fontFamily="DM Mono,monospace" fontSize={9} fill="#94a3b8">{val as string}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ═══ Key Metrics List ═══ */
const METRICS = [
  { label: 'MRR', value: '$3.76M', change: '▲ 11.2%', color: T.accent, up: true, spark: 'M0,20 L10,17 L20,15 L30,12 L40,10 L50,7 L60,5' },
  { label: 'ARR', value: '$45.1M', change: '▲ 9.8%', color: T.purple, up: true, spark: 'M0,18 L10,16 L20,14 L30,13 L40,10 L50,8 L60,6' },
  { label: 'NPS Score', value: '72', change: '▲ +4pts', color: T.green, up: true, spark: 'M0,16 L10,15 L20,17 L30,14 L40,12 L50,10 L60,9' },
  { label: 'Support Tickets', value: '1,284', change: '▲ 6.3%', color: T.red, up: false, spark: 'M0,10 L10,12 L20,11 L30,14 L40,15 L50,17 L60,18' },
  { label: 'Avg Response Time', value: '4.2h', change: '▼ 0.8h', color: T.yellow, up: true, spark: 'M0,18 L10,16 L20,17 L30,15 L40,14 L50,13 L60,11' },
];

export function KeyMetrics() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Key Metrics</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Live · auto-refresh 60s</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.yellowDim, color: T.yellow, border: '1px solid rgba(245,158,11,0.2)' }}>LIVE</span>
      </div>
      {METRICS.map((m, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 18px', borderBottom: i < METRICS.length - 1 ? `1px solid ${T.border}` : 'none',
        }}>
          <div style={{ width: 3, height: 28, borderRadius: 2, background: m.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: T.text2, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1rem', color: T.text }}>{m.value}</div>
          </div>
          <div style={{ fontSize: '0.68rem', fontFamily: T.fontMono, color: m.up ? T.green : T.red }}>{m.change}</div>
          <svg viewBox="0 0 60 24" style={{ width: 60, height: 24, flexShrink: 0 }}>
            <path d={m.spark} fill="none" stroke={m.color} strokeWidth={1.5} />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ═══ Alerts Card ═══ */
const ALERTS = [
  { icon: '🚨', type: 'danger', title: 'Churn rate exceeded threshold', sub: '3.2% > 3.0% target · LATAM region', time: '2m' },
  { icon: '⚠️', type: 'danger', title: 'Daily signups below 100', sub: 'Current: 84 signups today', time: '1h' },
  { icon: '📊', type: 'warn', title: 'Revenue target at risk', sub: 'MEA region tracking 12% below goal', time: '3h' },
  { icon: '✅', type: 'ok', title: 'Q3 revenue target achieved', sub: '$11.3M — 102% of target', time: '1d' },
];

export function AlertsCard() {
  const bgMap: Record<string, string> = { danger: T.redDim, warn: T.yellowDim, ok: T.greenDim };
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Active Alerts</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>2 critical · 1 warning</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.redDim, color: T.red, border: '1px solid rgba(248,113,113,0.2)' }}>2 NEW</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px' }}>
        {ALERTS.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px', borderRadius: 9,
            border: `1px solid ${a.type === 'ok' ? 'rgba(34,211,165,0.15)' : T.border}`,
            background: T.s2, cursor: 'pointer',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: bgMap[a.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: T.text, marginBottom: 2, fontWeight: 500 }}>{a.title}</div>
              <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{a.sub}</div>
            </div>
            <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
