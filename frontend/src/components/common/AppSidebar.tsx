import React from 'react';
import { NavLink } from 'react-router-dom';
import { T } from '../dashboard/tokens';

const icons = {
  chat: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  analytics: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  library: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  connections: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
};

interface AppSidebarProps {
  activeId?: string;
  onHover?: (hovering: boolean) => void;
}

export function AppSidebar({ onHover }: AppSidebarProps) {
  return (
    <div 
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{
        width: 64,
        flexShrink: 0,
        background: T.s1,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        gap: 28,
        zIndex: 100,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Branding */}
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        boxShadow: '0 8px 16px rgba(14, 165, 233, 0.25)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <SidebarLink to="/chat" icon={icons.chat()} label="Chat" />
        <SidebarLink to="/dashboard" icon={icons.dashboard()} label="Dashboards" />
        <SidebarLink to="/analytics" icon={icons.analytics()} label="Analytics" />
        <SidebarLink to="/library" icon={icons.library()} label="Library" />
        <SidebarLink to="/connections" icon={icons.connections()} label="Data Sources" />
      </nav>

      {/* Bottom Actions */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SidebarLink to="/settings" icon={icons.settings()} label="Settings" />
      </nav>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      title={label}
      style={({ isActive }) => ({
        width: 42,
        height: 42,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? T.accent : T.text3,
        background: isActive ? `${T.accent}10` : 'transparent',
        border: `1px solid ${isActive ? `${T.accent}25` : 'transparent'}`,
        transition: 'all 0.18s ease',
        textDecoration: 'none',
      })}
      className={({ isActive }) => isActive ? 'sidebar-active-glow' : ''}
    >
      {icon}
    </NavLink>
  );
}
