const stats = [
    { num: '10×', label: 'Faster than writing SQL manually' },
    { num: '50+', label: 'Database & tool integrations' },
    { num: '99.2%', label: 'Query accuracy rate' },
    { num: '<2s', label: 'Average query response time' },
];

export function Stats() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {stats.map((s, i) => (
                <div
                    key={i}
                    className={`reveal ${i > 0 ? `reveal-delay-${i}` : ''}`}
                    style={{
                        flex: 1,
                        maxWidth: 220,
                        padding: '36px 24px',
                        textAlign: 'center',
                        borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                >
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)', fontStyle: 'normal' }}>{s.num}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
                </div>
            ))}
        </div>
    );
}
