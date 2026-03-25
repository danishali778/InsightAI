import { useNavigate } from 'react-router-dom';
import { T } from '../dashboard/tokens';

export function ConnectionsSidebar() {
  const navigate = useNavigate();
  return (
    <aside style={{
      width: 220, flexShrink: 0, background: T.s1, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: T.fontBody
    }}>
      <div style={{ padding: '16px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.5px', padding: '4px 6px', marginBottom: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000', fontWeight: 800 }}>Q</div>
          <span style={{ color: T.text }}>Query<span style={{ color: T.accent }}>Mind</span></span>
        </div>
        
        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.5px', color: T.text3, textTransform: 'uppercase', padding: '8px 8px 4px', fontFamily: T.fontMono }}>Main</div>
        
        <NavItem onClick={() => navigate('/chat')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} label="Chat" />
        <NavItem onClick={() => navigate('/dashboard')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} label="Dashboards" badge="3" />
        <NavItem onClick={() => navigate('/library')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} label="Query Library" badge="24" />
        <NavItem icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Scheduled" />
        
        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.5px', color: T.text3, textTransform: 'uppercase', padding: '8px 8px 4px', fontFamily: T.fontMono, marginTop: 8 }}>Workspace</div>
        <NavItem active onClick={() => navigate('/connections')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>} label="Connections" badge="3" />
        <NavItem icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label="Team" />
        <NavItem icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>} label="Alerts" badge="2" badgeRed />
        <NavItem icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} label="Settings" />
      </div>
      
      <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 4px', cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = T.s2}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>AK</div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>Ahmad Khan</div>
            <div style={{ fontSize: '0.62rem', color: T.accent, fontFamily: T.fontMono }}>PRO PLAN</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ active, icon, label, badge, badgeRed, onClick }: { active?: boolean, icon: React.ReactNode, label: string, badge?: string, badgeRed?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
      transition: 'all 0.15s', marginBottom: 1, color: active ? T.text : T.text3, fontSize: '0.82rem',
      border: `1px solid ${active ? 'rgba(0,229,255,0.12)' : 'transparent'}`, background: active ? T.s2 : 'transparent',
    }}
      onMouseEnter={e => { if(!active){ e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
      onMouseLeave={e => { if(!active){ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; } }}
    >
      <div style={{ width: 15, height: 15, flexShrink: 0, color: active ? T.accent : 'inherit' }}>{icon}</div>
      {label}
      {badge && (
        <span style={{ 
          marginLeft: 'auto', background: badgeRed ? T.redDim : T.accentDim, color: badgeRed ? T.red : T.accent, 
          fontSize: '0.62rem', fontFamily: T.fontMono, padding: '1px 6px', borderRadius: 10, 
          border: `1px solid ${badgeRed ? 'rgba(248,113,113,0.2)' : 'rgba(0,229,255,0.2)'}` 
        }}>{badge}</span>
      )}
    </div>
  );
}
