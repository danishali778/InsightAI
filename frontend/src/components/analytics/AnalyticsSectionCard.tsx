import type { ReactNode } from 'react';
import { T } from '../dashboard/tokens';

export function AnalyticsSectionCard({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: `linear-gradient(180deg, rgba(20,31,48,0.96), rgba(11,17,32,0.98))`,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: T.accent, fontFamily: T.fontMono, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
          {eyebrow}
        </div>
        <div style={{ color: T.text, fontFamily: T.fontHead, fontSize: '1.15rem', fontWeight: 700 }}>{title}</div>
      </div>
      {children}
    </section>
  );
}
