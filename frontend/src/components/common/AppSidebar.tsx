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
        gap: 12,
        padding: '9px 12px',
        borderRadius: 8,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: 2,
        color: active ? '#000' : '#4b5563',
        fontSize: '0.84rem',
        fontWeight: active ? 600 : 500,
        background: active ? '#fff' : 'transparent',
        border: `1px solid ${active ? '#e5e5e5' : 'transparent'}`,
        fontFamily: T.fontBody,
        position: 'relative',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      }}
      onMouseEnter={e => {
        if (!active && clickable) {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.borderColor = '#e5e5e5';
          e.currentTarget.style.color = '#000';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        if (!active && clickable) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = '#4b5563';
          e.currentTarget.style.boxShadow = 'none';
        }
        onMouseLeave?.(e);
      }}
    >
      {/* Active Indicator Strip */}
      {active && (
        <div style={{
          position: 'absolute',
          left: -12,
          width: 4,
          height: 18,
          background: '#3b82f6',
          borderRadius: '0 4px 4px 0',
        }} />
      )}

      <span style={{
        fontSize: '0.9rem',
        width: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: active ? 1 : 0.7,
      }}>
        {icon}
      </span>
      {label}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.5,
  color: '#666', textTransform: 'uppercase',
  padding: '12px 12px 6px', fontFamily: T.fontMono,
};

/** Just the nav items — usable inside other sidebars (e.g. Chat) */
export function NavSection({ onDashboardHover }: { onDashboardHover?: (hovering: boolean) => void }) {
  const location = useLocation();
  const p = location.pathname;

  return (
    <div style={{ padding: '0 8px' }}>
      <div style={sectionLabel}>General</div>
      <NavItem icon="💬" label="Chat" path="/chat" active={p === '/chat'} />
      <NavItem 
        icon="📊" 
        label="Dashboards" 
        path="/dashboard" 
        active={p === '/dashboard'} 
        onMouseEnter={() => onDashboardHover?.(true)}
        onMouseLeave={() => onDashboardHover?.(false)}
      />
      <NavItem icon="📚" label="Library" path="/library" active={p === '/library'} />
      <NavItem icon="📈" label="Analytics" path="/analytics" active={p === '/analytics'} />

      <div style={{ ...sectionLabel, paddingTop: 20 }}>Infrastructure</div>
      <NavItem icon="🔌" label="Connections" path="/connections" active={p === '/connections'} />
      <NavItem icon="🔔" label="Alerts" />
      <NavItem icon="⚙️" label="Settings" path="/settings" active={p === '/settings'} />
    </div>
  );
}

/** Full app sidebar — used by Dashboard, Library, Connections, Analytics */
export function AppSidebar({ onDashboardHover }: { onDashboardHover?: (hovering: boolean) => void, activeId?: string }) {
  const { settings } = useSettingsStore();
  const displayName = settings?.full_name || 'User';
  const avatarInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: '#f9f9f8', 
      borderRight: `1px solid #e5e5e5`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: T.fontBody,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.2rem',
          letterSpacing: -0.5, padding: '4px 0', marginBottom: 16, color: '#000',
        }}>
          {/* 4-Square Grid Logo */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 2, 
            width: 24, 
            height: 24,
            flexShrink: 0
          }}>
            <div style={{ background: '#000', borderRadius: 2 }} />
            <div style={{ background: '#3b82f6', borderRadius: 2 }} />
            <div style={{ background: '#3b82f6', borderRadius: 2 }} />
            <div style={{ background: '#000', borderRadius: 2 }} />
          </div>
          Query<span style={{ color: '#3b82f6' }}>Mind</span>
        </div>

        <NavSection onDashboardHover={onDashboardHover} />
      </div>

      {/* User Footer */}
      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: `1px solid #e5e5e5`, background: 'rgba(0,0,0,0.01)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px',
          borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
          border: '1px solid transparent'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#e5e5e5';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: `#f3f4f6`,
            border: '1px solid #e5e5e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#374151',
          }}>{avatarInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 500 }}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
