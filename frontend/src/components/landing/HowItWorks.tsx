const steps = [
    { num: '01', title: 'Connect your data', desc: 'Link any database, spreadsheet, or data tool in minutes with a secure one-click connector.' },
    { num: '02', title: 'Ask in plain English', desc: 'Type your question naturally — no SQL needed. Our AI understands your intent and schema.' },
    { num: '03', title: 'Review the query', desc: 'See the generated SQL before execution. Edit, save, or approve it with full transparency.' },
    { num: '04', title: 'Explore results', desc: 'Get a table, chart, and AI summary automatically. Export or share with your team instantly.' },
];

export function HowItWorks() {
    return (
        <section id="how" style={{ background: 'var(--surface)', padding: '100px 60px' }}>
            <div style={{ textAlign: 'center' }} className="reveal">
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, display: 'block' }}>How it works</span>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 16, fontStyle: 'normal' }}>
                    From question to insight<br />in seconds
                </h2>
            </div>

            <div className="steps-connector" style={{ display: 'flex', gap: 0, maxWidth: 900, margin: '60px auto 0', position: 'relative' }}>
                {steps.map((step, i) => (
                    <div key={step.num} className={`reveal ${i > 0 ? `reveal-delay-${i}` : ''}`} style={{ flex: 1, textAlign: 'center', padding: '0 24px', position: 'relative' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--accent)', margin: '0 auto 20px', position: 'relative', zIndex: 2 }}>
                            {step.num}
                        </div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, fontStyle: 'normal' }}>{step.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>{step.desc}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
