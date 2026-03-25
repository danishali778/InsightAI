const tools = [
    { icon: '🐘', name: 'PostgreSQL', type: 'Database', color: '#336791' },
    { icon: '🐬', name: 'MySQL', type: 'Database', color: '#00758f' },
    { icon: '❄️', name: 'Snowflake', type: 'Data Warehouse', color: '#e8443a' },
    { icon: '🔶', name: 'BigQuery', type: 'Data Warehouse', color: '#ff9900' },
    { icon: '📗', name: 'Excel', type: 'Spreadsheet', color: '#217346' },
    { icon: '📊', name: 'Google Sheets', type: 'Spreadsheet', color: '#0f9d58' },
    { icon: '🦆', name: 'DuckDB', type: 'Embedded DB', color: '#e97627' },
    { icon: '🔴', name: 'Redis', type: 'Cache / Store', color: '#cc2927' },
    { icon: '☁️', name: 'Airtable', type: 'No-code DB', color: '#4285f4' },
    { icon: '🔗', name: 'REST APIs', type: 'Custom Source', color: '#ff4500' },
];

export function Integrations() {
    return (
        <section id="integrations" style={{ background: 'var(--bg)', padding: '100px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }} className="reveal">
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, display: 'block' }}>Integrations</span>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 16, fontStyle: 'normal' }}>
                    Connect to the tools<br />you already use
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 520, margin: '0 auto', fontWeight: 300 }}>
                    One-click connectors for every major database and data source. Your stack, your rules.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
                {tools.map((t) => (
                    <a
                        key={t.name}
                        href="#"
                        className="tool-card-hover"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            padding: '28px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            color: 'var(--text)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 14,
                            transition: 'border-color 0.3s, transform 0.25s, box-shadow 0.3s',
                            ['--tool-color' as string]: t.color,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-6px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                    >
                        <div style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', background: 'rgba(255,255,255,0.04)' }}>
                            {t.icon}
                        </div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: 0.3, fontStyle: 'normal' }}>{t.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{t.type}</div>
                    </a>
                ))}
            </div>
        </section>
    );
}
