import { T } from './tokens';

/* ═══ Top Customers Table ═══ */
const CUSTOMERS = [
  { rank: 1, name: 'Acme Corp', revenue: '$842K', growth: '▲ 18%', up: true, share: 84, chip: 'gold' },
  { rank: 2, name: 'Globex Inc', revenue: '$634K', growth: '▲ 7%', up: true, share: 63, chip: 'silver' },
  { rank: 3, name: 'Initech LLC', revenue: '$520K', growth: '▲ 22%', up: true, share: 52, chip: 'bronze' },
  { rank: 4, name: 'Umbrella Co', revenue: '$418K', growth: '▼ 3%', up: false, share: 42 },
  { rank: 5, name: 'Massive Dyn.', revenue: '$382K', growth: '— 0%', up: null, share: 38 },
];

export function TopCustomers() {
  const chipColors: Record<string, { bg: string; color: string }> = {
    gold: { bg: 'rgba(245,158,11,0.15)', color: T.yellow },
    silver: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
    bronze: { bg: 'rgba(205,133,63,0.1)', color: '#cd853f' },
  };

  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Top Customers</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>By revenue · Q3 2024</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.accentDim, color: T.accent, border: '1px solid rgba(0,229,255,0.2)' }}>TABLE</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {['#', 'Customer', 'Revenue ↕', 'Growth', 'Share'].map(h => (
              <th key={h} style={{
                background: T.s2, padding: '9px 16px', textAlign: 'left',
                fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 600,
                color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase',
                borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CUSTOMERS.map(c => (
            <tr key={c.rank} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, color: T.text2, fontFamily: T.fontMono }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 6, fontSize: '0.65rem', fontWeight: 600,
                  background: c.chip ? chipColors[c.chip]?.bg || T.s3 : T.s3,
                  color: c.chip ? chipColors[c.chip]?.color || T.text3 : T.text3,
                }}>{c.rank}</span>
              </td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, color: c.rank <= 3 ? T.text : T.text2, fontFamily: T.fontMono }}>{c.name}</td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, color: T.text, fontWeight: 500, fontFamily: T.fontMono }}>{c.revenue}</td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, fontFamily: T.fontMono }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  background: c.up === true ? T.greenDim : c.up === false ? T.redDim : T.s3,
                  color: c.up === true ? T.green : c.up === false ? T.red : T.text3,
                  borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem',
                }}>{c.growth}</span>
              </td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 80, height: 4, background: T.s4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.share}%`, background: 'linear-gradient(90deg, #00e5ff, #7c3aff)', borderRadius: 2, opacity: c.rank <= 3 ? 1 : 0.5 }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══ Scheduled Reports ═══ */
const SCHEDULES = [
  { icon: '📊', name: 'Weekly Revenue Report', freq: 'Every Monday 9am', next: 'Mon 9am', live: true },
  { icon: '👥', name: 'Daily Active Users', freq: 'Every day 8am', next: '8am', live: true },
  { icon: '📉', name: 'Churn Analysis', freq: 'Every Friday 6pm', next: 'Fri 6pm', live: true },
  { icon: '🛒', name: 'Sales Funnel', freq: '1st of month', next: 'Oct 1', live: false },
  { icon: '🌍', name: 'Regional Breakdown', freq: 'Every Sunday', next: 'Sun', live: true },
];

export function ScheduledReports() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Scheduled Reports</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>6 active schedules</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.purpleDim, color: T.purple, border: '1px solid rgba(124,58,255,0.2)' }}>AUTO</span>
      </div>
      {SCHEDULES.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 18px', borderBottom: i < SCHEDULES.length - 1 ? `1px solid ${T.border}` : 'none',
          cursor: 'pointer',
        }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: T.s3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0 }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: T.text2 }}>{s.name}</div>
            <div style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>{s.freq}</div>
          </div>
          <div style={{ fontSize: '0.65rem', color: T.accent, fontFamily: T.fontMono, marginRight: 6 }}>{s.next}</div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.live ? T.green : T.text3, boxShadow: s.live ? '0 0 5px rgba(34,211,165,0.5)' : 'none' }} />
        </div>
      ))}
    </div>
  );
}

/* ═══ Team Activity ═══ */
const ACTIVITIES = [
  { initials: 'AK', name: 'You', action: 'added Revenue chart to this dashboard', time: '2m', grad: `linear-gradient(135deg, #7c3aff, #00e5ff)` },
  { initials: 'SR', name: 'Sarah R.', action: 'ran churn rate query on prod-postgres', time: '1h', grad: `linear-gradient(135deg, #22d3a5, #7c3aff)` },
  { initials: 'MK', name: 'Mike K.', action: 'exported Top Customers to CSV', time: '3h', grad: `linear-gradient(135deg, #f59e0b, #ff6b35)` },
  { initials: 'LJ', name: 'Lisa J.', action: 'shared Revenue Trend publicly', time: '5h', grad: `linear-gradient(135deg, #f87171, #7c3aff)` },
  { initials: 'OP', name: 'Omar P.', action: 'connected analytics-bq database', time: '8h', grad: `linear-gradient(135deg, #00e5ff, #22d3a5)` },
];

export function TeamActivity() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Team Activity</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Last 24 hours</div>
        </div>
      </div>
      {ACTIVITIES.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: i < ACTIVITIES.length - 1 ? `1px solid ${T.border}` : 'none' }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: a.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{a.initials}</div>
          <div style={{ fontSize: '0.75rem', color: T.text2, flex: 1, lineHeight: 1.4 }}>
            <strong style={{ color: T.text }}>{a.name}</strong> {a.action}
          </div>
          <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}
