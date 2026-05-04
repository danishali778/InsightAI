import type { ReactNode } from 'react';
import { T } from '../dashboard/tokens';

export function AnalyticsSectionCard({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        border: `1px solid rgba(0,0,0,0.08)`,
        borderRadius: 0,
        padding: 24,
        boxShadow: 'none',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: T.text3, fontFamily: T.fontMono, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, fontWeight: 900 }}>
          {eyebrow}
        </div>
        <div style={{ color: T.text, fontFamily: T.fontHead, fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: -0.5 }}>{title}</div>
      </div>
      {children}
    </section>
  );
}
