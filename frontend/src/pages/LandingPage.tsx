import { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Stats } from '../components/landing/Stats';
import { ChartsShowcase } from '../components/landing/ChartsShowcase';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Features } from '../components/landing/Features';
import { Integrations } from '../components/landing/Integrations';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
    // Scroll reveal observer
    useEffect(() => {
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.12 }
        );
        reveals.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Navbar />
            <Hero />
            <Stats />
            <ChartsShowcase />
            <HowItWorks />
            <Features />
            <Integrations />

            {/* CTA Section */}
            <section className="cta-glow" style={{ background: 'var(--bg)', textAlign: 'center', padding: '100px 60px', position: 'relative', overflow: 'hidden' }}>
                <div className="reveal" style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>Get started today</span>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3.2rem)', letterSpacing: -1.5, marginBottom: 16, fontStyle: 'normal' }}>
                        Stop writing SQL.<br />Start getting answers.
                    </h2>
                    <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: 36, lineHeight: 1.7, fontWeight: 300 }}>
                        Join thousands of analysts and teams who've replaced manual SQL with QueryMind. Free forever for individuals.
                    </p>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/chat" className="btn-glow" style={{ background: 'var(--accent)', color: '#000', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
                            Create Free Account →
                        </a>
                        <a href="#" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '14px 32px', borderRadius: 8, fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
                            Book a demo
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
