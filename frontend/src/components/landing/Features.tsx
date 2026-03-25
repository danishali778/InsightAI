const features = [
    { icon: '🧠', bg: 'rgba(0,229,255,0.1)', name: 'Natural Language to SQL', desc: 'Describe your question in plain English and get production-ready SQL in under 2 seconds.' },
    { icon: '📊', bg: 'rgba(124,58,255,0.1)', name: 'Auto Visualizations', desc: 'Automatically selects bar charts, line graphs, pie charts, or scatter plots based on your data type.' },
    { icon: '⚡', bg: 'rgba(255,107,53,0.1)', name: 'Real-time Execution', desc: 'Query runs directly on your database — no data copying, no latency, always fresh results.' },
    { icon: '🔐', bg: 'rgba(74,222,128,0.1)', name: 'Secure by Default', desc: 'Read-only access, end-to-end encryption, and role-based permissions keep your data safe.' },
    { icon: '🗂️', bg: 'rgba(251,191,36,0.1)', name: 'Query Library', desc: 'Save, schedule, and share queries across your team. Build a living library of business intelligence.' },
    { icon: '🤝', bg: 'rgba(244,114,182,0.1)', name: 'Team Collaboration', desc: 'Comment on queries, share dashboards, and set up automated reports to any Slack channel or inbox.' },
];

export function Features() {
    return (
        <section id="features" style={{ background: 'var(--surface)', padding: '100px 60px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div className="reveal">
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, display: 'block' }}>Everything you need</span>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 16, fontStyle: 'normal' }}>
                        Built for data teams<br />and non-technical users alike
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1100, marginTop: 60 }}>
                    {features.map((f, i) => (
                        <div
                            key={f.name}
                            className={`reveal ${i % 3 === 1 ? 'reveal-delay-1' : i % 3 === 2 ? 'reveal-delay-2' : ''}`}
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '32px 28px', transition: 'border-color 0.3s, transform 0.3s', cursor: 'default' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,229,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 20, background: f.bg }}>
                                {f.icon}
                            </div>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 10, fontStyle: 'normal' }}>{f.name}</div>
                            <div style={{ fontSize: '0.87rem', color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
