import { useNavigate } from 'react-router-dom';
import { T } from './tokens';

const NAV_ITEMS = [
  { icon: '💬', label: 'Chat', path: '/chat' },
  { icon: '📊', label: 'Dashboards', badge: '3', active: true, path: '/dashboard' },
  { icon: '📄', label: 'Query Library', badge: '24', path: '/library' },
  { icon: '🕐', label: 'Scheduled' },
  { icon: '📈', label: 'Analytics' },
];

const WORKSPACE_ITEMS = [
  { icon: '🔌', label: 'Connections', badge: '3', path: '/connections' },
  { icon: '👥', label: 'Team' },
  { icon: '⚠️', label: 'Alerts', badge: '2', badgeColor: true },
  { icon: '⚙️', label: 'Settings' },
];

export function DashboardSidebar() {
  const navigate = useNavigate();

  const renderItem = (item: any, i: number) => (
    <div
      key={i}
      onClick={() => item.path ? navigate(item.path) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        transition: 'all 0.15s', marginBottom: 1,
        color: item.active ? T.text : T.text3,
        fontSize: '0.82rem',
        background: item.active ? T.s2 : 'transparent',
        border: `1px solid ${item.active ? 'rgba(0,229,255,0.12)' : 'transparent'}`,
        textDecoration: 'none',
      }}
      onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
      onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; } }}
    >
      <span style={{ width: 16, fontSize: '0.82rem', flexShrink: 0 }}>{item.icon}</span>
      {item.label}
      {item.badge && (
        <span style={{
          marginLeft: 'auto',
          background: (item as any).badgeColor ? T.redDim : T.accentDim,
          color: (item as any).badgeColor ? T.red : T.accent,
          fontSize: '0.62rem', fontFamily: T.fontMono,
          padding: '1px 6px', borderRadius: 10,
          border: `1px solid ${(item as any).badgeColor ? 'rgba(248,113,113,0.2)' : 'rgba(0,229,255,0.2)'}`,
        }}>{item.badge}</span>
      )}
    </div>
  );

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: T.s1, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 14px 12px' }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.1rem',
          letterSpacing: -0.5, padding: '4px 6px', marginBottom: 16, color: T.text,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', color: '#000', fontWeight: 800,
          }}>Q</div>
          Query<span style={{ color: T.accent }}>Mind</span>
        </div>

        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', padding: '10px 8px 5px', fontFamily: T.fontMono }}>Main</div>
        {NAV_ITEMS.map(renderItem)}

        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', padding: '18px 8px 5px', fontFamily: T.fontMono }}>Workspace</div>
        {WORKSPACE_ITEMS.map(renderItem)}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 4px', cursor: 'pointer', borderRadius: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: '#fff',
          }}>AK</div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>Ahmad Khan</div>
            <div style={{ fontSize: '0.62rem', color: T.accent, fontFamily: T.fontMono }}>PRO PLAN</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
