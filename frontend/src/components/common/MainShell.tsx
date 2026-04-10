import React from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { T } from '../dashboard/tokens';

interface MainShellProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: string;
    icon?: React.ReactNode;
  };
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  onDashboardHover?: (hovering: boolean) => void;
  hideSidebar?: boolean;
  activeId?: string;
}

export function MainShell({ 
  title, 
  subtitle, 
  badge, 
  headerActions, 
  children,
  onDashboardHover,
  hideSidebar = false,
  activeId
}: MainShellProps) {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden', 
      background: T.bg, 
      fontFamily: T.fontBody,
      color: T.text,
    }}>
      {/* Main Sidebar */}
      {!hideSidebar && <AppSidebar activeId={activeId} onHover={onDashboardHover} />}

      {/* Page Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: 'padding-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Universal Header */}
        <AppHeader 
          title={title} 
          subtitle={subtitle} 
          badge={badge}
        >
          {headerActions}
        </AppHeader>

        {/* Page Content */}
        <main style={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {children}
        </main>
      </main>
    </div>
  );
}
