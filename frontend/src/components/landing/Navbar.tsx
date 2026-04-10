export function Navbar() {
    return (
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 60px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.45rem', letterSpacing: -0.8, color: 'var(--text)', fontStyle: 'normal' }}>
                Query<span style={{ color: 'var(--accent)' }}>Mind</span>
            </div>
            <ul style={{ display: 'flex', gap: 32, listStyle: 'none', alignItems: 'center' }}>
                <li><a href="#features" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Features</a></li>
                <li><a href="#how" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>How it works</a></li>
                <li>
                    <a href="/dashboard" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)' }}>
                        Get Started Free
                    </a>
                </li>
            </ul>
        </nav>
    );
}
