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
            <section style={{ background: '#f8fafc', textAlign: 'center', padding: '120px 20px', position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--border)' }}>
                <div className="reveal" style={{ position: 'relative', zIndex: 2, maxWidth: 660, margin: '0 auto' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>Ready to evolve?</span>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', letterSpacing: -1.8, marginBottom: 20, fontStyle: 'normal', color: 'var(--text)' }}>
                        Stop writing SQL.<br />Start getting answers.
                    </h2>
                    <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: 44, lineHeight: 1.75, fontWeight: 300 }}>
                        Join thousands of analysts and teams who've replaced manual SQL with QueryMind. Free forever for individuals.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/auth" className="btn-glow" style={{ background: 'var(--accent)', color: '#fff', padding: '15px 36px', borderRadius: 10, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)' }}>
                            Get Started for Free →
                        </a>
                        <a href="#" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text)', padding: '15px 36px', borderRadius: 10, fontWeight: 600, fontSize: '1rem', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            Book a demo
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
