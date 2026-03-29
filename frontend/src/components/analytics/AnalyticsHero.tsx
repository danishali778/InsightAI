import { T } from '../dashboard/tokens';

export function AnalyticsHero() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <div style={{ color: T.accent, fontFamily: T.fontMono, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 8 }}>
          Workspace analytics
        </div>
        <h1 style={{ margin: 0, color: T.text, fontFamily: T.fontHead, fontSize: '2rem', letterSpacing: -0.8 }}>
          Usage, health, and output across QueryMind
        </h1>
        <p style={{ margin: '10px 0 0', color: T.text2, maxWidth: 760, lineHeight: 1.65, fontSize: '0.92rem' }}>
          This page summarizes app activity from the current running backend session. It tracks query execution, saved assets, dashboards, and connection usage.
        </p>
      </div>
      <div style={{ padding: '9px 13px', borderRadius: 999, background: T.s1, border: `1px solid ${T.border}`, color: T.text2, fontFamily: T.fontMono, fontSize: '0.72rem' }}>
        Live workspace summary
      </div>
    </div>
  );
}
