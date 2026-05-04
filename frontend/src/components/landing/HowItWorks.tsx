import { T } from '../dashboard/tokens';

const steps = [
    { num: '01', title: 'CONNECT_SOURCE', desc: 'Link any database, spreadsheet, or data tool in minutes with a secure one-click connector.' },
    { num: '02', title: 'INPUT_NATURAL_TEXT', desc: 'Type your question naturally — no SQL needed. Our AI understands your intent and schema.' },
    { num: '03', title: 'VALIDATE_SQL_NODE', desc: 'See the generated SQL before execution. Edit, save, or approve it with full transparency.' },
    { num: '04', title: 'EXTRACT_INSIGHTS', desc: 'Get a table, chart, and AI summary automatically. Export or share with your team instantly.' },
];

export function HowItWorks() {
    return (
        <section id="how" style={{ background: T.s2, padding: '120px 60px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 1, background: T.accent }} />
                  <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', color: T.accent, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 950 }}>WORKFLOW_PROTOCOL</span>
                </div>
                <h2 style={{ fontFamily: T.fontHead, fontWeight: 950, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: -3, lineHeight: 0.9, color: T.text, textTransform: 'uppercase' }}>
                    FROM_QUESTION_TO_INSIGHT
                </h2>
            </div>

            <div style={{ display: 'flex', gap: 40, maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
                {steps.map((step, i) => (
                    <div key={step.num} style={{ flex: 1, textAlign: 'left', padding: '40px 32px', background: T.s1, border: `1px solid ${T.border}`, position: 'relative' }}>
                        <div style={{ 
                          width: 44, height: 44, background: T.accent, color: '#000', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontFamily: T.fontMono, fontSize: '0.75rem', fontWeight: 950, 
                          marginBottom: 32, position: 'relative', zIndex: 2 
                        }}>
                            {step.num}
                        </div>
                        <div style={{ fontFamily: T.fontHead, fontWeight: 950, fontSize: '1rem', marginBottom: 12, color: T.text, letterSpacing: '-1px', textTransform: 'uppercase' }}>{step.title}</div>
                        <div style={{ fontSize: '0.7rem', color: T.text3, lineHeight: 1.8, fontFamily: T.fontMono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{step.desc}</div>
                        
                        {i < steps.length - 1 && (
                          <div style={{ position: 'absolute', top: '50%', right: -25, width: 20, height: 1, background: T.accent, opacity: 0.4, zIndex: 1 }} />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
