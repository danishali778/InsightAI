import { useState } from 'react';
import { T } from './tokens';
import type { DashboardItem } from '../../types/dashboard';

/* ── SVG Icons ───────────────────────────────────────────────── */

function IconShare() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────── */

interface DashboardTopbarProps {
  activeDashboard?: DashboardItem | null;
  dashboardCount: number;
}

const DATE_RANGES = ['7D', '30D', 'Q3', 'YTD', 'Custom'];

export function DashboardTopbar({ activeDashboard, dashboardCount }: DashboardTopbarProps) {
  const [activeRange, setActiveRange] = useState('Q3');

  return (
    <div className="glass-topbar" style={{
      height: 54, flexShrink: 0,
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center',
      gap: 14, padding: '0 24px',
    }}>
      {/* Left: Title + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem',
          color: T.text, letterSpacing: -0.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {activeDashboard?.name || 'Dashboards'}
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(34,211,165,0.06)',
            border: '1px solid rgba(34,211,165,0.15)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: '0.68rem', fontFamily: T.fontMono,
            color: T.green,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: T.green,
              boxShadow: '0 0 6px rgba(34,211,165,0.6)',
            }} />
            {dashboardCount} dashboard{dashboardCount !== 1 ? 's' : ''}
          </div>

          {activeDashboard && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: T.s2, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: '4px 12px',
              fontSize: '0.68rem', fontFamily: T.fontMono,
              color: T.text2,
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: T.accent,
                boxShadow: '0 0 4px rgba(0,229,255,0.4)',
              }} />
              {activeDashboard.widget_count} widget{activeDashboard.widget_count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Center: Date Range */}
      <div style={{
        display: 'flex',
        background: T.s2,
        border: `1px solid ${T.border}`,
        borderRadius: 9,
        overflow: 'hidden',
        padding: 2,
      }}>
        {DATE_RANGES.map((d) => (
          <button
            key={d}
            onClick={() => setActiveRange(d)}
            className={`date-pill ${d === activeRange ? 'date-pill--active' : ''}`}
            style={{
              background: d === activeRange
                ? 'rgba(0,229,255,0.08)'
                : 'transparent',
              color: d === activeRange ? T.accent : T.text3,
              borderRadius: 7,
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Search */}
        <button
          className="dash-action-btn"
          style={{ width: 32, height: 32 }}
          title="Search widgets"
        >
          <IconSearch />
        </button>

        {/* Share */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.text2, fontSize: '0.76rem',
            cursor: 'pointer', fontFamily: T.fontBody,
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.text2;
          }}
        >
          <IconShare /> Share
        </button>

        {/* Export */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.text2, fontSize: '0.76rem',
            cursor: 'pointer', fontFamily: T.fontBody,
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.text2;
          }}
        >
          <IconDownload /> Export
        </button>

        {/* New Dashboard CTA */}
        <button
          className="new-dash-cta"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.08))',
            border: '1px solid rgba(0,229,255,0.25)',
            color: T.accent, fontSize: '0.78rem',
            cursor: 'pointer', fontFamily: T.fontBody,
            fontWeight: 600,
          }}
        >
          <IconPlus /> New
        </button>
      </div>
    </div>
  );
}
