interface ChatHeaderProps {
    sessionId: string | null;
    dbType?: string;
    dbName?: string;
}

export function ChatHeader({ sessionId, dbType, dbName }: ChatHeaderProps) {
    return (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(22,22,35,0.9)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#e2e8f0', margin: 0, fontStyle: 'normal' }}>
                    {sessionId ? `Chat ${sessionId.slice(0, 6)}` : 'New Chat'}
                </h2>
                {dbType && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.64rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '3px 10px', borderRadius: 16, letterSpacing: 0.8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                        {dbType}
                    </span>
                )}
                {dbName && (
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{dbName}</span>
                )}
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
                {['↗', '↓', '⋯'].map((icon) => (
                    <button
                        key={icon}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                    >
                        {icon}
                    </button>
                ))}
            </div>
        </header>
    );
}
