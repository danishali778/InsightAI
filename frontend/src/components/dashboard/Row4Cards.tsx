import { T } from './tokens';

function HeaderActions({ extra }: { extra?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {extra}
      <button style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.7rem' }}>...</button>
    </div>
  );
}

function DragHandle() {
  return <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, borderRadius: 2, background: T.border2, opacity: 0.45 }} />;
}

const CUSTOMERS = [
  { rank: 1, name: 'Acme Corp', revenue: '$842K', growth: 'UP 18%', up: true, share: 84, chip: 'gold' },
  { rank: 2, name: 'Globex Inc', revenue: '$634K', growth: 'UP 7%', up: true, share: 63, chip: 'silver' },
  { rank: 3, name: 'Initech LLC', revenue: '$520K', growth: 'UP 22%', up: true, share: 52, chip: 'bronze' },
  { rank: 4, name: 'Umbrella Co', revenue: '$418K', growth: 'DOWN 3%', up: false, share: 42 },
  { rank: 5, name: 'Massive Dyn.', revenue: '$382K', growth: 'FLAT 0%', up: null, share: 38 },
];

export function TopCustomers() {
  const chipColors: Record<string, { bg: string; color: string }> = {
    gold: { bg: 'rgba(245,158,11,0.15)', color: T.yellow },
    silver: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
    bronze: { bg: 'rgba(205,133,63,0.1)', color: '#cd853f' },
  };

  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <DragHandle />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Top Customers</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>By revenue · Q3 2024</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.accentDim, color: T.accent, border: '1px solid rgba(0,229,255,0.2)' }}>TABLE</span>
        <HeaderActions extra={<button style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.7rem' }}>v</button>} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {['#', 'Customer', 'Revenue', 'Growth', 'Share'].map((header) => (
              <th key={header} style={{ background: T.s2, padding: '9px 16px', textAlign: 'left', fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 600, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CUSTOMERS.map((customer) => (
            <tr key={customer.rank} style={{ transition: 'background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, color: T.text2, fontFamily: T.fontMono }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, background: customer.chip ? chipColors[customer.chip]?.bg || T.s3 : T.s3, color: customer.chip ? chipColors[customer.chip]?.color || T.text3 : T.text3 }}>
                  {customer.rank}
                </span>
              </td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, color: customer.rank <= 3 ? T.text : T.text2, fontFamily: T.fontMono }}>{customer.name}</td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, color: T.text, fontWeight: 500, fontFamily: T.fontMono }}>{customer.revenue}</td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}`, fontFamily: T.fontMono }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: customer.up === true ? T.greenDim : customer.up === false ? T.redDim : T.s3, color: customer.up === true ? T.green : customer.up === false ? T.red : T.text3, borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem' }}>
                  {customer.growth}
                </span>
              </td>
              <td style={{ padding: '9px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 80, height: 4, background: T.s4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${customer.share}%`, background: 'linear-gradient(90deg, #00e5ff, #7c3aff)', borderRadius: 2, opacity: customer.rank <= 3 ? 1 : 0.5 }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SCHEDULES = [
  { icon: '=', name: 'Weekly Revenue Report', freq: 'Every Monday 9am', next: 'Mon 9am', live: true },
  { icon: '@', name: 'Daily Active Users', freq: 'Every day 8am', next: '8am', live: true },
  { icon: '~', name: 'Churn Analysis', freq: 'Every Friday 6pm', next: 'Fri 6pm', live: true },
  { icon: '%', name: 'Sales Funnel', freq: '1st of month', next: 'Oct 1', live: false },
  { icon: '*', name: 'Regional Breakdown', freq: 'Every Sunday', next: 'Sun', live: true },
];

export function ScheduledReports() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <DragHandle />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Scheduled Reports</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>6 active schedules</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: T.purpleDim, color: T.purple, border: '1px solid rgba(124,58,255,0.2)' }}>AUTO</span>
        <HeaderActions extra={<button style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.7rem' }}>+</button>} />
      </div>
      {SCHEDULES.map((schedule, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: index < SCHEDULES.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: T.s3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontFamily: T.fontMono, fontWeight: 700, flexShrink: 0 }}>{schedule.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: T.text2 }}>{schedule.name}</div>
            <div style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>{schedule.freq}</div>
          </div>
          <div style={{ fontSize: '0.65rem', color: T.accent, fontFamily: T.fontMono, marginRight: 6 }}>{schedule.next}</div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: schedule.live ? T.green : T.text3, boxShadow: schedule.live ? '0 0 5px rgba(34,211,165,0.5)' : 'none' }} />
        </div>
      ))}
    </div>
  );
}

const ACTIVITIES = [
  { initials: 'AK', name: 'You', action: 'added Revenue chart to this dashboard', time: '2m', grad: 'linear-gradient(135deg, #7c3aff, #00e5ff)' },
  { initials: 'SR', name: 'Sarah R.', action: 'ran churn rate query on prod-postgres', time: '1h', grad: 'linear-gradient(135deg, #22d3a5, #7c3aff)' },
  { initials: 'MK', name: 'Mike K.', action: 'exported Top Customers to CSV', time: '3h', grad: 'linear-gradient(135deg, #f59e0b, #ff6b35)' },
  { initials: 'LJ', name: 'Lisa J.', action: 'shared Revenue Trend publicly', time: '5h', grad: 'linear-gradient(135deg, #f87171, #7c3aff)' },
  { initials: 'OP', name: 'Omar P.', action: 'connected analytics-bq database', time: '8h', grad: 'linear-gradient(135deg, #00e5ff, #22d3a5)' },
];

export function TeamActivity() {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <DragHandle />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Team Activity</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>Last 24 hours</div>
        </div>
        <HeaderActions />
      </div>
      {ACTIVITIES.map((activity, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: index < ACTIVITIES.length - 1 ? `1px solid ${T.border}` : 'none' }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: activity.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{activity.initials}</div>
          <div style={{ fontSize: '0.75rem', color: T.text2, flex: 1, lineHeight: 1.4 }}>
            <strong style={{ color: T.text }}>{activity.name}</strong> {activity.action}
          </div>
          <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{activity.time}</div>
        </div>
      ))}
    </div>
  );
}
