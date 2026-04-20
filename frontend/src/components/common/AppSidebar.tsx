import { useLocation, useNavigate } from 'react-router-dom';
import { T } from '../dashboard/tokens';
import { useSettingsStore } from '../../store/settingsStore';

interface NavItemProps {
  icon: string;
  label: string;
  path?: string;
  active?: boolean;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

function NavItem({ icon, label, path, active, onMouseEnter, onMouseLeave }: NavItemProps) {
  const navigate = useNavigate();
  const clickable = Boolean(path);

  return (
    <div
      onClick={() => { if (path) navigate(path); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        marginBottom: 2,
        color: active ? T.text : T.text3,
        fontSize: '0.8rem',
        fontWeight: active ? 600 : 500,
        background: active ? T.s2 : 'transparent',
        border: `1px solid ${active ? T.border : 'transparent'}`,
        fontFamily: T.fontBody,
      }}
      onMouseEnter={e => {
        if (!active && clickable) {
          e.currentTarget.style.background = T.s2;
          e.currentTarget.style.color = T.text;
          e.currentTarget.style.borderColor = T.border;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        if (!active && clickable) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = T.text3;
          e.currentTarget.style.borderColor = 'transparent';
        }
        onMouseLeave?.(e);
      }}
    >
      <span style={{
        width: 18, height: 18, flexShrink: 0, borderRadius: 5,
        border: `1px solid ${active ? T.accent : T.border}`,
        background: active ? T.accentDim : T.s1,
        color: active ? T.accent : T.text3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontFamily: T.fontMono, fontWeight: 700,
        transition: 'all 0.2s ease',
      }}>
        {icon}
      </span>
      {label}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.5,
  color: T.text3, textTransform: 'uppercase',
  padding: '10px 8px 4px', fontFamily: T.fontMono,
};

/** Just the nav items — usable inside other sidebars (e.g. Chat) */
export function NavSection({ onDashboardHover }: { onDashboardHover?: (hovering: boolean) => void }) {
  const location = useLocation();
  const p = location.pathname;

  return (
    <div>
      <div style={sectionLabel}>Main</div>
      <NavItem icon="C" label="Chat" path="/chat" active={p === '/chat'} />
      <NavItem 
        icon="D" 
        label="Dashboards" 
        path="/dashboard" 
        active={p === '/dashboard'} 
        onMouseEnter={() => onDashboardHover?.(true)}
        onMouseLeave={() => onDashboardHover?.(false)}
      />
      <NavItem icon="L" label="Query Library" path="/library" active={p === '/library'} />
      <NavItem icon="A" label="Analytics" path="/analytics" active={p === '/analytics'} />

      <div style={{ ...sectionLabel, paddingTop: 16 }}>Workspace</div>
      <NavItem icon="N" label="Connections" path="/connections" active={p === '/connections'} />
      <NavItem icon="G" label="Settings" path="/settings" active={p === '/settings'} />
    </div>
  );
}

/** Full app sidebar — used by Dashboard, Library, Connections, Analytics */
export function AppSidebar({ onDashboardHover }: { onDashboardHover?: (hovering: boolean) => void }) {
  const { settings } = useSettingsStore();
  const displayName = settings?.full_name || 'User';
  const avatarInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: T.s1, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: T.fontBody,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 14px 4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.1rem',
          letterSpacing: -0.5, padding: '4px 6px', marginBottom: 8, color: T.text,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', color: '#000', fontWeight: 800,
          }}>Q</div>
          Query<span style={{ color: T.accent }}>Mind</span>
        </div>

        <NavSection onDashboardHover={onDashboardHover} />
      </div>

      {/* User */}
      <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '6px 4px',
          borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = T.s2)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: '#fff',
          }}>{avatarInitials}</div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>{displayName}</div>
            <div style={{ fontSize: '0.62rem', color: T.accent, fontFamily: T.fontMono }}>PRO PLAN</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
