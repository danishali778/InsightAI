export function Navbar() {
    return (
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', background: 'rgba(6,10,18,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: -0.5, color: '#fff', fontStyle: 'normal' }}>
                Query<span style={{ color: 'var(--accent)' }}>Mind</span>
            </div>
            <ul style={{ display: 'flex', gap: 36, listStyle: 'none' }}>
                <li><a href="#features" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Features</a></li>
                <li><a href="#how" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>How it works</a></li>
                <li><a href="#integrations" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Integrations</a></li>
                <li>
                    <a href="/dashboard" style={{ background: 'var(--accent)', color: '#000', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                        Get Started Free
                    </a>
                </li>
            </ul>
        </nav>
    );
}
