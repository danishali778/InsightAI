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
    accent: { border: 'rgba(0,229,255,0.16)', value: T.accent },
    green: { border: 'rgba(34,211,165,0.18)', value: T.green },
    purple: { border: 'rgba(124,58,255,0.18)', value: T.purple },
    yellow: { border: 'rgba(245,158,11,0.18)', value: T.yellow },
  } as const;
  const colors = toneMap[tone];

  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${T.s2}, ${T.s1})`,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 18,
        boxShadow: `0 8px 24px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)`,
      }}
    >
      <div style={{ fontSize: '0.68rem', letterSpacing: 1.4, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: colors.value, fontFamily: T.fontHead }}>{value}</div>
        <div style={{ minWidth: 10, height: 10, borderRadius: 999, background: colors.value, boxShadow: `0 0 18px ${colors.value}` }} />
      </div>
      <div style={{ marginTop: 10, color: T.text2, fontSize: '0.8rem', lineHeight: 1.5 }}>{hint}</div>
    </div>
  );
}
