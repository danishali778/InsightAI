import { useEffect, useRef } from 'react';

const QUERY_TEXT = "Show me total revenue by region for Q3 2024, ordered by highest sales";

export function Hero() {
    const typewriterRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = typewriterRef.current;
        if (!el) return;
        el.textContent = '';
        let i = 0;
        const timeout = setTimeout(() => {
            const iv = setInterval(() => {
                if (i < QUERY_TEXT.length) {
                    el.textContent += QUERY_TEXT[i++];
                } else {
                    clearInterval(iv);
                }
            }, 32);
            return () => clearInterval(iv);
        }, 1200);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 60px 80px', position: 'relative', overflow: 'hidden' }}>
            {/* Background effects */}
            <div style={{ position: 'absolute', inset: 0 }} className="hero-bg-gradient" />
            <div style={{ position: 'absolute', inset: 0 }} className="hero-grid-pattern" />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 860 }}>
                {/* Badge */}
                <div className="animate-fade-down" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: 100, padding: '6px 16px', fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: 'var(--accent)', marginBottom: 28 }}>
                    <div className="animate-pulse-dot" style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} />
                    Text-to-SQL &nbsp;·&nbsp; Instant Insights
                </div>

                {/* Headline */}
                <h1 className="animate-fade-down-1" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2.8rem, 6vw, 5rem)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 24, fontStyle: 'normal' }}>
                    Ask questions.<br />
                    <span className="gradient-text">Get SQL. See Data.</span>
                </h1>

                {/* Subtitle */}
                <p className="animate-fade-down-2" style={{ fontSize: '1.15rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px', fontWeight: 300 }}>
                    Transform plain English into powerful database queries — no SQL knowledge required. Connect your data, ask anything, and visualize results instantly.
                </p>

                {/* CTA Buttons */}
                <div className="animate-fade-down-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href="/dashboard" className="btn-glow" style={{ background: 'var(--accent)', color: '#fff', padding: '14px 34px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)' }}>
                        Start for Free →
                    </a>
                    <a href="#how" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '14px 34px', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', transition: 'all 0.2s' }}>
                        Watch how it works
                    </a>
                </div>

                {/* Demo box */}
                <div className="animate-fade-up demo-shadow" style={{ marginTop: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
                    {/* Title bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 8 }}>querymind.app — live query</span>
                    </div>
                    {/* Query */}
                    <div style={{ padding: '24px 28px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: 'var(--text)', display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', background: 'rgba(14, 165, 233, 0.08)', color: 'var(--accent)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '4px 9px', borderRadius: 4, whiteSpace: 'nowrap' }}>ASK</span>
                        <span ref={typewriterRef} style={{ fontWeight: 500 }} />
                    </div>
                    {/* SQL output */}
                    <div style={{ padding: '18px 28px 24px', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#1e293b', background: '#f8fafc', borderTop: '1px solid var(--border)', lineHeight: 1.8, textAlign: 'left' }}>
                        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>SELECT</span> region, <span style={{ color: '#0ea5e9', fontWeight: 600 }}>SUM</span>(revenue) <span style={{ color: '#0ea5e9', fontWeight: 600 }}>AS</span> total_revenue<br />
                        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>FROM</span> <span style={{ color: '#6366f1' }}>sales_data</span><br />
                        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>WHERE</span> quarter = <span style={{ color: '#10b981' }}>'Q3'</span> <span style={{ color: '#0ea5e9', fontWeight: 600 }}>AND</span> year = <span style={{ color: '#10b981' }}>2024</span><br />
                        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>GROUP BY</span> region<br />
                        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>ORDER BY</span> total_revenue <span style={{ color: '#0ea5e9', fontWeight: 600 }}>DESC</span>;
                    </div>
                </div>
            </div>
        </section>
    );
}
