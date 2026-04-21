import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav 
      className="glass-topbar"
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '14px 20px', // Smaller padding for mobile by default
        transition: 'all 0.3s ease'
      }}
    >
      {/* Desktop Padding via CSS wrapper or media query logic below */}
      <style>{`
        @media (min-width: 1024px) {
          nav.glass-topbar { padding: 18px 60px !important; }
          .nav-links { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 1023px) {
          .nav-links { display: none; }
          .mobile-toggle { display: block; }
        }
      `}</style>

      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.45rem', letterSpacing: -0.8, color: 'var(--text)', fontStyle: 'normal', zIndex: 1001 }}>
        Query<span style={{ color: 'var(--accent)' }}>Mind</span>
      </div>

      {/* Desktop Links */}
      <ul className="nav-links" style={{ display: 'none', gap: 32, listStyle: 'none', alignItems: 'center' }}>
        <li><a href="#features" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}>Features</a></li>
        <li><a href="#how" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}>How it works</a></li>
        <li>
          <a href="/dashboard" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)', transition: 'all 0.2s' }}>
            Get Started Free
          </a>
        </li>
      </ul>

      {/* Mobile Toggle */}
      <button 
        className="mobile-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', zIndex: 1001, padding: 8 }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.98)', 
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 32, zIndex: 1000, animation: 'fadeDown 0.3s ease'
        }}>
          <a href="#features" onClick={() => setIsOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Features</a>
          <a href="#how" onClick={() => setIsOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>How it works</a>
          <a href="/dashboard" style={{ background: 'var(--accent)', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)' }}>
            Get Started Free
          </a>
        </div>
      )}
    </nav>
  );
}
