import React from 'react';
import { T } from '../dashboard/tokens';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: string;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode; // For page-specific actions/filters
}

export function AppHeader({ title, subtitle, badge, children }: AppHeaderProps) {
  return (
    <header style={{
      height: 48, // Low Profile Height
      flexShrink: 0,
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px) saturate(1.8)',
      boxShadow: 'none', // Removed shadow for flat editorial feel
      borderBottom: `1px solid #e5e5e5`, // Standardized border
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px', // Standardized 20px rhythm
      gap: 16,
      zIndex: 50,
    }}>
      {/* Left: Branding/Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, overflow: 'hidden', paddingRight: 40, maxWidth: '60%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <h1 style={{
            fontFamily: T.fontHead,
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#000',
            letterSpacing: '-0.01em',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{
              fontSize: '0.68rem',
              color: T.text3,
              fontFamily: T.fontMono,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {badge && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: `${badge.color}10`,
            border: `1px solid ${badge.color}30`,
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: '0.68rem',
            fontFamily: T.fontMono,
            color: badge.color,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {badge.icon && <span style={{ display: 'flex' }}>{badge.icon}</span>}
            {badge.text}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
        {children}
      </div>
    </header>
  );
}

// Reusable Icon components for Header Actions
// eslint-disable-next-line react-refresh/only-export-components
export const HeaderIcons = {
  Share: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};
