import { useLocation, useNavigate } from 'react-router-dom';
import { T } from './tokens';

type SidebarItem = {
  icon: string;
  label: string;
  path?: string;
  badge?: string;
  badgeColor?: boolean;
};

const NAV_ITEMS: SidebarItem[] = [
  { icon: 'C', label: 'Chat', path: '/chat' },
  { icon: 'D', label: 'Dashboards', badge: '3', path: '/dashboard' },
  { icon: 'L', label: 'Query Library', badge: '24', path: '/library' },
  { icon: 'A', label: 'Analytics', path: '/analytics' },
];

const WORKSPACE_ITEMS: SidebarItem[] = [
  { icon: 'N', label: 'Connections', badge: '3', path: '/connections' },
  { icon: '!', label: 'Alerts', badge: '2', badgeColor: true },
  { icon: 'G', label: 'Settings' },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const renderItem = (item: SidebarItem, i: number) => {
    const isActive = Boolean(item.path && location.pathname === item.path);

    return (
      <div
        key={i}
        onClick={() => (item.path ? navigate(item.path) : undefined)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '8px 10px',
          borderRadius: 8,
          cursor: item.path ? 'pointer' : 'default',
          transition: 'all 0.15s',
          marginBottom: 1,
          color: isActive ? T.text : T.text3,
          fontSize: '0.82rem',
          background: isActive ? T.s2 : 'transparent',
          border: `1px solid ${isActive ? 'rgba(0,229,255,0.12)' : 'transparent'}`,
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive && item.path) {
            e.currentTarget.style.background = T.s2;
            e.currentTarget.style.color = T.text2;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && item.path) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = T.text3;
          }
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            borderRadius: 4,
            border: `1px solid ${isActive ? 'rgba(0,229,255,0.2)' : T.border}`,
            background: isActive ? T.accentDim : 'transparent',
            color: isActive ? T.accent : T.text3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.62rem',
            fontFamily: T.fontMono,
            fontWeight: 700,
          }}
        >
          {item.icon}
        </span>
        {item.label}
        {item.badge && (
          <span
            style={{
              marginLeft: 'auto',
              background: item.badgeColor ? T.redDim : T.accentDim,
              color: item.badgeColor ? T.red : T.accent,
              fontSize: '0.62rem',
              fontFamily: T.fontMono,
              padding: '1px 6px',
              borderRadius: 10,
              border: `1px solid ${item.badgeColor ? 'rgba(248,113,113,0.2)' : 'rgba(0,229,255,0.2)'}`,
            }}
          >
            {item.badge}
          </span>
        )}
      </div>
    );
  };

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: T.s1,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 14px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontFamily: T.fontHead,
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: -0.5,
            padding: '4px 6px',
            marginBottom: 16,
            color: T.text,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: '#000',
              fontWeight: 800,
            }}
          >
            Q
          </div>
          Query<span style={{ color: T.accent }}>Mind</span>
        </div>

        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', padding: '10px 8px 5px', fontFamily: T.fontMono }}>
          Main
        </div>
        {NAV_ITEMS.map(renderItem)}

        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', padding: '18px 8px 5px', fontFamily: T.fontMono }}>
          Workspace
        </div>
        {WORKSPACE_ITEMS.map(renderItem)}
      </div>

      <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 4px', borderRadius: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            AK
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>Ahmad Khan</div>
            <div style={{ fontSize: '0.62rem', color: T.accent, fontFamily: T.fontMono }}>PRO PLAN</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
