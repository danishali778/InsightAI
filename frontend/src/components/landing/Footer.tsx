import { T } from '../dashboard/tokens';

const productLinks = ['FEATURES', 'INTEGRATIONS', 'PRICING', 'CHANGELOG', 'ROADMAP'];
const resourceLinks = ['DOCUMENTATION', 'API_REFERENCE', 'SQL_GUIDE', 'BLOG', 'COMMUNITY'];
const companyLinks = ['ABOUT', 'CAREERS', 'PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'CONTACT'];

export function Footer() {
    return (
        <footer style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '80px 60px 48px', color: T.text }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 60, maxWidth: 1200, margin: '0 auto 80px' }}>
                {/* Brand */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 28, height: 28, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '1rem', fontWeight: 950, fontFamily: T.fontHead }}>Q</div>
                        <span style={{ fontFamily: T.fontHead, fontWeight: 950, fontSize: '1.4rem', color: T.text, letterSpacing: '-1px', textTransform: 'uppercase' }}>
                            QUERY<span style={{ color: T.accent }}>MIND</span>
                        </span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: T.text3, lineHeight: 1.8, maxWidth: 280, fontFamily: T.fontMono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        INITIALIZING NATURAL LANGUAGE INVESTIGATIONS. TRANSFORM PLAIN TEXT INTO PRODUCTION-READY SQL NODES INSTANTLY.
                    </p>
                </div>

                {/* Columns */}
                {[
                    { title: 'PRODUCT', links: productLinks },
                    { title: 'RESOURCES', links: resourceLinks },
                    { title: 'COMPANY', links: companyLinks },
                ].map((col) => (
                    <div key={col.title}>
                        <h4 style={{ fontFamily: T.fontHead, fontWeight: 950, fontSize: '0.75rem', marginBottom: 24, color: T.text, letterSpacing: '2px' }}>{col.title}</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, margin: 0, padding: 0 }}>
                            {col.links.map((link) => (
                                <li key={link}>
                                    <a href="#" style={{ 
                                      fontSize: '0.65rem', color: T.text3, textDecoration: 'none', 
                                      fontFamily: T.fontMono, fontWeight: 800, letterSpacing: '1px',
                                      transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = T.accent}
                                    onMouseLeave={e => e.currentTarget.style.color = T.text3}
                                    >{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
                <p style={{ fontSize: '0.6rem', color: T.text3, fontFamily: T.fontMono, fontWeight: 800, letterSpacing: '1px' }}>
                    © 2025 QUERYMIND_SYSTEMS // ALL_RIGHTS_RESERVED
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                    {['𝕏', 'IN', 'GH'].map((icon) => (
                        <div
                            key={icon}
                            style={{ 
                              width: 36, height: 36, borderRadius: 0, border: `1px solid ${T.border}`, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              fontSize: '0.8rem', cursor: 'pointer', color: T.text,
                              fontFamily: T.fontMono, fontWeight: 950, transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
                        >
                            {icon}
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}
