import { T } from './tokens';

function HeaderActions({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {children}
      <button style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.7rem' }}>...</button>
    </div>
  );
}

function DragHandle() {
  return <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, borderRadius: 2, background: T.border2, opacity: 0.45 }} />;
}

export function TopProducts() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <DragHandle />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 14px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.1rem', color: T.text }}>Top Products</div>
          <div style={{ fontSize: '0.8rem', color: T.text3, fontFamily: T.fontMono }}>Revenue Q3 2024</div>
        </div>
        <span style={{ fontSize: '0.7rem', fontFamily: T.fontMono, padding: '3px 10px', borderRadius: 6, background: T.greenDim, color: T.green, border: '1px solid rgba(34,211,165,0.2)', fontWeight: 600 }}>BAR</span>
        <HeaderActions />
      </div>
      <div style={{ padding: '8px 20px 18px' }}>
        <svg viewBox="0 0 320 190" style={{ width: '100%' }}>
          <defs>
            <linearGradient id="barG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#7c3aff" />
            </linearGradient>
          </defs>
          <line x1={90} y1={0} x2={90} y2={185} stroke="rgba(255,255,255,0.06)" />
          {[['Pro Plan', 195, '$4.8M'], ['Enterprise', 163, '$3.2M'], ['Starter', 132, '$2.6M'], ['Add-ons', 100, '$1.4M'], ['Services', 70, '$0.8M']].map(([label, width, value], index) => (
            <g key={index}>
              <rect x={90} y={6 + index * 36} width={Number(width)} height={26} rx={5} fill="url(#barG)" opacity={0.95 - index * 0.12} />
              <text x={82} y={24 + index * 36} textAnchor="end" fontFamily="DM Mono,monospace" fontSize={13} fill={T.text2} fontWeight={500}>{label as string}</text>
              <text x={98 + Number(width)} y={24 + index * 36} fontFamily="DM Mono,monospace" fontSize={13} fill={T.text} fontWeight={600}>{value as string}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

const METRICS = [
  { label: 'MRR', value: '$3.76M', change: 'UP 11.2%', color: T.accent, up: true, spark: 'M0,20 L10,17 L20,15 L30,12 L40,10 L50,7 L60,5' },
  { label: 'ARR', value: '$45.1M', change: 'UP 9.8%', color: T.purple, up: true, spark: 'M0,18 L10,16 L20,14 L30,13 L40,10 L50,8 L60,6' },
  { label: 'NPS Score', value: '72', change: 'UP 4pts', color: T.green, up: true, spark: 'M0,16 L10,15 L20,17 L30,14 L40,12 L50,10 L60,9' },
  { label: 'Support Tickets', value: '1,284', change: 'UP 6.3%', color: T.red, up: false, spark: 'M0,10 L10,12 L20,11 L30,14 L40,15 L50,17 L60,18' },
  { label: 'Avg Response Time', value: '4.2h', change: 'DOWN 0.8h', color: T.yellow, up: true, spark: 'M0,18 L10,16 L20,17 L30,15 L40,14 L50,13 L60,11' },
];

export function KeyMetrics() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <DragHandle />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Key Metrics</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Live · auto-refresh 60s</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.yellowDim, color: T.yellow, border: '1px solid rgba(245,158,11,0.2)' }}>LIVE</span>
        <HeaderActions />
      </div>
      {METRICS.map((metric, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: index < METRICS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
          <div style={{ width: 3, height: 28, borderRadius: 2, background: metric.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: T.text2, marginBottom: 2 }}>{metric.label}</div>
            <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1rem', color: T.text }}>{metric.value}</div>
          </div>
          <div style={{ fontSize: '0.68rem', fontFamily: T.fontMono, color: metric.up ? T.green : T.red }}>{metric.change}</div>
          <svg viewBox="0 0 60 24" style={{ width: 60, height: 24, flexShrink: 0 }}>
            <path d={metric.spark} fill="none" stroke={metric.color} strokeWidth={1.5} />
          </svg>
        </div>
      ))}
    </div>
  );
}

const ALERTS = [
  { icon: '!!', type: 'danger', title: 'Churn rate exceeded threshold', sub: '3.2% > 3.0% target · LATAM region', time: '2m' },
  { icon: '!', type: 'danger', title: 'Daily signups below 100', sub: 'Current: 84 signups today', time: '1h' },
  { icon: '~', type: 'warn', title: 'Revenue target at risk', sub: 'MEA region tracking 12% below goal', time: '3h' },
  { icon: 'OK', type: 'ok', title: 'Q3 revenue target achieved', sub: '$11.3M - 102% of target', time: '1d' },
];

export function AlertsCard() {
  const bgMap: Record<string, string> = { danger: T.redDim, warn: T.yellowDim, ok: T.greenDim };

  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <DragHandle />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Active Alerts</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>2 critical · 1 warning</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.redDim, color: T.red, border: '1px solid rgba(248,113,113,0.2)' }}>2 NEW</span>
        <HeaderActions />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px' }}>
        {ALERTS.map((alert, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 9, border: `1px solid ${alert.type === 'ok' ? 'rgba(34,211,165,0.15)' : T.border}`, background: T.s2, cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: bgMap[alert.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontFamily: T.fontMono, fontWeight: 700, flexShrink: 0 }}>{alert.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: T.text, marginBottom: 2, fontWeight: 500 }}>{alert.title}</div>
              <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{alert.sub}</div>
            </div>
            <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{alert.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
