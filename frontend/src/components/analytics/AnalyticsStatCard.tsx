import { T } from '../dashboard/tokens';

export function AnalyticsStatCard({
  label,
  value,
  hint,
  tone = 'accent',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'accent' | 'green' | 'purple' | 'yellow';
}) {
  const toneMap = {
    accent: { border: 'rgba(0,0,0,0.1)', value: T.text },
    green: { border: 'rgba(0,0,0,0.1)', value: T.green },
    purple: { border: 'rgba(0,0,0,0.1)', value: T.purple },
    yellow: { border: 'rgba(0,0,0,0.1)', value: T.yellow },
  } as const;
  const colors = toneMap[tone];

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderRadius: 0,
        padding: 24,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: colors.value, fontFamily: T.fontHead, fontStyle: 'italic', letterSpacing: -1 }}>{value}</div>
        <div style={{ minWidth: 8, height: 8, borderRadius: 0, background: colors.value }} />
      </div>
      <div style={{ color: T.text3, fontSize: '0.72rem', lineHeight: 1.5, fontFamily: T.fontMono, textTransform: 'uppercase', opacity: 0.8 }}>{hint}</div>
    </div>
  );
}
