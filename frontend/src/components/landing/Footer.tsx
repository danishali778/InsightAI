const productLinks = ['Features', 'Integrations', 'Pricing', 'Changelog', 'Roadmap'];
const resourceLinks = ['Documentation', 'API Reference', 'SQL Guide', 'Blog', 'Community'];
const companyLinks = ['About', 'Careers', 'Privacy Policy', 'Terms of Service', 'Contact'];

export function Footer() {
    return (
        <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '60px 60px 36px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, maxWidth: 1100, margin: '0 auto 48px' }}>
                {/* Brand */}
                <div>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)', display: 'block', marginBottom: 14, fontStyle: 'normal' }}>
                        Query<span style={{ color: 'var(--accent)' }}>Mind</span>
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 240 }}>
                        Turn plain English into powerful SQL queries and stunning data visualizations — in seconds.
                    </p>
                </div>

                {/* Columns */}
                {[
                    { title: 'Product', links: productLinks },
                    { title: 'Resources', links: resourceLinks },
                    { title: 'Company', links: companyLinks },
                ].map((col) => (
                    <div key={col.title}>
                        <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', marginBottom: 16, color: 'var(--text)', fontStyle: 'normal' }}>{col.title}</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {col.links.map((link) => (
                                <li key={link}>
                                    <a href="#" style={{ fontSize: '0.83rem', color: 'var(--muted)', textDecoration: 'none' }}>{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>© 2025 QueryMind. All rights reserved.</p>
                <div style={{ display: 'flex', gap: 14 }}>
                    {['𝕏', 'in', 'gh'].map((icon) => (
                        <div
                            key={icon}
                            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            {icon}
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}
