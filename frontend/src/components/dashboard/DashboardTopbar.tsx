import { T } from './tokens';
import type { DashboardItem } from '../../types/dashboard';

interface DashboardTopbarProps {
  activeDashboard?: DashboardItem | null;
  dashboardCount: number;
}

export function DashboardTopbar({ activeDashboard, dashboardCount }: DashboardTopbarProps) {
  const pills = [
    { label: `${dashboardCount} dashboards`, active: true },
    { label: activeDashboard ? `${activeDashboard.widget_count} widgets` : 'No dashboard selected', active: false },
  ];

  return (
    <div style={{
      height: 52,
      flexShrink: 0,
      background: 'rgba(11,17,32,0.96)',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 24px',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', color: T.text }}>
          {activeDashboard?.name || 'Custom Dashboards'}
        </div>

        {pills.map((pill) => (
          <div
            key={pill.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: T.s2,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: '4px 11px',
              fontSize: '0.7rem',
              fontFamily: T.fontMono,
              color: T.text2,
              opacity: pill.active ? 1 : 0.6,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: pill.active ? T.green : T.text3,
                boxShadow: pill.active ? '0 0 5px rgba(34,211,165,0.7)' : 'none',
              }}
            />
            {pill.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {['7D', '30D', 'Q3', 'YTD', 'Custom'].map((d, i) => (
            <button
              key={d}
              style={{
                padding: '6px 12px',
                background: d === 'Q3' ? T.s3 : 'transparent',
                border: 'none',
                borderRight: i < 4 ? `1px solid ${T.border}` : 'none',
                color: d === 'Q3' ? T.text : T.text3,
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontFamily: T.fontMono,
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {['Share', 'Export'].map((label) => (
          <button
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 13px',
              borderRadius: 7,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              color: T.text2,
              fontSize: '0.76rem',
              cursor: 'pointer',
              fontFamily: T.fontBody,
            }}
          >
            {label}
          </button>
        ))}

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 13px',
            borderRadius: 7,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))',
            border: '1px solid rgba(0,229,255,0.25)',
            color: T.accent,
            fontSize: '0.76rem',
            cursor: 'pointer',
            fontFamily: T.fontBody,
          }}
        >
          + New Dashboard
        </button>
      </div>
    </div>
  );
}
