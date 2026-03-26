import { T } from './tokens';

const CHIPS = [
  { icon: '$', label: 'Revenue by region' },
  { icon: '@', label: 'Active customers' },
  { icon: '~', label: 'Churn analysis' },
  { icon: '%', label: 'Avg order value' },
  { icon: '=', label: 'Monthly MRR' },
  { icon: '*', label: 'APAC breakdown' },
  { icon: '#', label: 'Top customers' },
  { icon: '+', label: 'Signups today' },
];

export function QuickLaunch() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, borderRadius: 2, background: T.border2, opacity: 0.45 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Quick Query Launch</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono, marginLeft: 8 }}>Saved queries for this dashboard</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '14px 18px' }}>
          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.s2,
                color: T.text2,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = T.s2; }}
            >
              <span style={{ fontSize: '0.8rem', fontFamily: T.fontMono, fontWeight: 700 }}>{chip.icon}</span>
              {chip.label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          border: `2px dashed ${T.border2}`,
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 140,
          cursor: 'pointer',
          transition: 'all 0.2s',
          color: T.text3,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.background = 'rgba(0,229,255,0.03)'; e.currentTarget.style.color = T.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>+</div>
        <div style={{ fontSize: '0.85rem', fontFamily: T.fontBody, fontWeight: 500 }}>Add Widget</div>
        <div style={{ fontSize: '0.72rem', marginTop: 4, fontFamily: T.fontMono }}>Chart · Table · Metric · Alert</div>
      </div>
    </div>
  );
}
