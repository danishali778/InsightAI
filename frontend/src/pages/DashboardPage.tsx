import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import { MainShell } from '../components/common/MainShell';
import { HeaderIcons } from '../components/common/AppHeader';
import { DashboardCreateForm } from '../components/dashboard/DashboardCreateForm';
import { WidgetRenderer } from '../components/dashboard/WidgetRenderer';
import { T } from '../components/dashboard/tokens';
import { DashboardFilterBar } from '../components/dashboard/DashboardFilterBar';
import {
  deleteDashboard,
  renameDashboard,
  updateDashboard,
  refreshDashboardWidget,
  listDashboardWidgets,
  deleteDashboardWidget,
  getDashboardStats,
  updateDashboardWidget,
} from '../services/api';
import { useDashboardCatalog } from '../hooks/useDashboardCatalog';
import type { DashboardItem, DashboardMetrics, DashboardWidgetItem } from '../types/dashboard';
import type { UpdateDashboardWidgetRequest } from '../types/api';
import { DeleteDashboardModal } from '../components/dashboard/DeleteDashboardModal';

/* ── SVG Icons ─────────────────────────────────────────────────── */

function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

/* ── Dashboard Sidebar Rail ─────────────────────────────────────── */

function DashboardRail({
  dashboards,
  activeDashId,
  onSelect,
  onDelete,
  onRename,
  showCreateForm,
  onShowCreateForm,
  newDashName,
  onNewDashNameChange,
  onCreate,
  onCancelCreate,
  creating,
  externalHover,
}: {
  dashboards: DashboardItem[];
  activeDashId: string | null;
  onSelect: (id: string) => void;
  onDelete: (dashboard: DashboardItem) => void;
  onRename: (id: string, name: string) => void;
  showCreateForm: boolean;
  onShowCreateForm: () => void;
  newDashName: string;
  onNewDashNameChange: (value: string) => void;
  onCreate: () => void;
  onCancelCreate: () => void;
  creating: boolean;
  externalHover: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const startEdit = (e: React.MouseEvent, dash: DashboardItem) => {
    e.stopPropagation();
    setEditingId(dash.id);
    setEditValue(dash.name);
  };

  const commitEdit = (id: string) => {
    if (editValue.trim()) onRename(id, editValue.trim());
    setEditingId(null);
  };

  const isExpanded = isHovered || editingId !== null || showCreateForm || externalHover;

  return (
    <div style={{ width: 0, flexShrink: 0, position: 'relative', zIndex: 40 }}>
      {/* Absolute positioning container for overlay collapse effect */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: isExpanded ? 240 : 16,
          background: isExpanded ? 'rgba(8,14,26,0.98)' : 'transparent',
          backdropFilter: isExpanded ? 'blur(16px)' : 'none',
          boxShadow: isExpanded ? '4px 0 24px rgba(0,0,0,0.6)' : 'none',
          borderRight: isExpanded ? `1px solid ${T.border}` : 'transparent',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ 
          width: 240, height: '100%', display: 'flex', flexDirection: 'column',
          opacity: isExpanded ? 1 : 0, 
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}>
          {/* Rail header */}
          <div style={{
            padding: '16px 16px 12px',
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.15))',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.accent,
              }}>
                <IconGrid />
              </div>
              <div style={{
                fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.82rem',
                color: T.text, letterSpacing: -0.3, transition: 'opacity 0.2s',
                opacity: isExpanded ? 1 : 0,
              }}>My Dashboards</div>
            </div>
            <div style={{
              fontSize: '0.64rem', color: T.text3, fontFamily: T.fontMono,
              paddingLeft: 36, transition: 'opacity 0.2s',
              opacity: isExpanded ? 1 : 0,
            }}>{dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Dashboard list */}
          <div className="dash-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 4px 8px 8px' }}>
            {/* New Dashboard at top */}
            <div style={{ paddingRight: 6, marginBottom: 8 }}>
              {!showCreateForm ? (
                <button
                  onClick={onShowCreateForm}
                  className="new-dash-cta"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 17px', borderRadius: 10,
                    border: '1px solid rgba(0,229,255,0.25)',
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(124,58,255,0.05))',
                    cursor: 'pointer', width: '100%',
                    color: T.accent,
                    fontFamily: T.fontBody, fontSize: '0.76rem',
                    fontWeight: 600, overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.08))';
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(124,58,255,0.05))';
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)';
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: 'rgba(0,229,255,0.15)',
                    border: '1px solid rgba(0,229,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconPlus />
                  </div>
                  <span style={{ transition: 'opacity 0.2s', opacity: isExpanded ? 1 : 0 }}>
                    New Dashboard
                  </span>
                </button>
              ) : (
                <div style={{ transition: 'opacity 0.2s', opacity: isExpanded ? 1 : 0 }}>
                  <DashboardCreateForm
                    value={newDashName}
                    onChange={onNewDashNameChange}
                    onCreate={handleCreateDash}
                    onCancel={onCancelCreate}
                    creating={creating}
                    compact
                    ctaLabel="Add"
                  />
                </div>
              )}
            </div>

            {dashboards.map((dashboard, index) => {
              const isActive = dashboard.id === activeDashId;
              const isEditing = editingId === dashboard.id;
              return (
                <div
                  key={dashboard.id}
                  className={`dash-rail-item ${isActive ? 'dash-rail-item--active' : ''} dash-section`}
                  style={{ animationDelay: `${index * 0.04}s` }}
                  onClick={() => !isEditing && onSelect(dashboard.id)}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 10px 9px 14px',
                    borderRadius: 9,
                    cursor: isEditing ? 'default' : 'pointer',
                    color: isActive ? T.text : T.text2,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.12))'
                        : T.s2,
                      border: `1px solid ${isActive ? 'rgba(0,229,255,0.2)' : T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? T.accent : T.text3,
                      fontSize: '0.75rem', transition: 'all 0.2s ease',
                    }}>
                      {dashboard.icon || <IconDashboard />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, transition: 'opacity 0.2s', opacity: isExpanded ? 1 : 0 }}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(dashboard.id);
                            else if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => commitEdit(dashboard.id)}
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: '100%', background: T.s2,
                            border: '1px solid rgba(0,229,255,0.3)',
                            borderRadius: 6, padding: '3px 8px',
                            color: T.text, fontFamily: T.fontBody,
                            fontSize: '0.76rem', outline: 'none',
                          }}
                        />
                      ) : (
                        <>
                          <div style={{
                            fontSize: '0.76rem', fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', lineHeight: 1.3,
                          }}>{dashboard.name}</div>
                          <div style={{
                            fontSize: '0.6rem', color: T.text3,
                            fontFamily: T.fontMono, marginTop: 1,
                          }}>{dashboard.widget_count} widget{dashboard.widget_count !== 1 ? 's' : ''}</div>
                        </>
                      )}
                    </div>
                    {isActive && !isEditing && isExpanded && (
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button
                          className="dash-action-btn"
                          title="Rename"
                          onClick={(e) => startEdit(e, dashboard)}
                          style={{ width: 22, height: 22 }}
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="dash-action-btn dash-action-btn--danger"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); onDelete(dashboard); }}
                          style={{ width: 22, height: 22 }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rail footer stats */}
          <div style={{
            padding: '10px 25px', borderTop: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: T.green,
              boxShadow: '0 0 6px rgba(34,211,165,0.5)',
            }} />
            <span style={{
              fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono,
              transition: 'opacity 0.2s', opacity: isExpanded ? 1 : 0,
            }}>All systems online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ──────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="dash-section" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 400,
      position: 'relative',
    }}>
      {/* Background glow */}
      <div className="empty-glow" style={{
        position: 'absolute', width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, rgba(124,58,255,0.04) 40%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Floating dashboard illustration */}
      <div className="empty-illustration" style={{ marginBottom: 28, position: 'relative' }}>
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          {/* Main frame */}
          <rect x="10" y="8" width="100" height="72" rx="8" stroke="rgba(0,229,255,0.3)" strokeWidth="1.5" fill="rgba(0,229,255,0.03)" />
          {/* Top bar */}
          <rect x="10" y="8" width="100" height="14" rx="8" fill="rgba(11,17,32,0.6)" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
          <circle cx="20" cy="15" r="2" fill="rgba(248,113,113,0.6)" />
          <circle cx="27" cy="15" r="2" fill="rgba(245,158,11,0.6)" />
          <circle cx="34" cy="15" r="2" fill="rgba(34,211,165,0.6)" />
          {/* KPI cards */}
          <rect x="16" y="28" width="22" height="14" rx="3" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.2)" strokeWidth="0.8" />
          <rect x="42" y="28" width="22" height="14" rx="3" fill="rgba(124,58,255,0.1)" stroke="rgba(124,58,255,0.2)" strokeWidth="0.8" />
          <rect x="68" y="28" width="22" height="14" rx="3" fill="rgba(34,211,165,0.1)" stroke="rgba(34,211,165,0.2)" strokeWidth="0.8" />
          {/* Chart area */}
          <rect x="16" y="48" width="44" height="26" rx="4" fill="rgba(0,229,255,0.05)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
          {/* Chart bars */}
          <rect x="22" y="60" width="5" height="10" rx="1" fill="rgba(0,229,255,0.3)" />
          <rect x="30" y="56" width="5" height="14" rx="1" fill="rgba(0,229,255,0.4)" />
          <rect x="38" y="52" width="5" height="18" rx="1" fill="rgba(0,229,255,0.5)" />
          <rect x="46" y="48" width="5" height="22" rx="1" fill="rgba(0,229,255,0.35)" />
          {/* Donut */}
          <circle cx="80" cy="61" r="12" fill="none" stroke="rgba(124,58,255,0.3)" strokeWidth="4" />
          <circle cx="80" cy="61" r="12" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="4" strokeDasharray="30 45" strokeLinecap="round" transform="rotate(-90 80 61)" />
        </svg>
      </div>

      <div style={{
        fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.4rem',
        color: T.text, marginBottom: 10, letterSpacing: -0.5,
      }}>
        Create your first dashboard
      </div>
      <div style={{
        fontSize: '0.88rem', color: T.text3, maxWidth: 380,
        lineHeight: 1.7, textAlign: 'center', marginBottom: 24,
      }}>
        Build custom dashboards from your query results. Add charts, KPIs, and tables to track what matters.
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))',
          border: '1px solid rgba(0,229,255,0.3)',
          color: T.accent, cursor: 'pointer',
          fontFamily: T.fontBody, fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 0 20px rgba(0,229,255,0.15)',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 0 32px rgba(0,229,255,0.25)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.15)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <IconPlus /> New Dashboard
        </button>
        <button style={{
          padding: '10px 22px', borderRadius: 10,
          background: 'transparent',
          border: `1px solid ${T.border2}`,
          color: T.text2, cursor: 'pointer',
          fontFamily: T.fontBody, fontSize: '0.85rem',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.border2;
            e.currentTarget.style.color = T.text2;
          }}
        >
          Go to Chat
        </button>
      </div>

      {/* Hint */}
      <div style={{
        marginTop: 32, display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 166px', borderRadius: 8, // Fixed padding from previous broken state
        background: 'rgba(0,229,255,0.04)',
        border: '1px solid rgba(0,229,255,0.08)',
      }}>
        <span style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>
          💡 Run a query in Chat → click <strong style={{ color: T.accent }}>+ Dashboard</strong> to add widgets
        </span>
      </div>
    </div>
  );
}

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/* ── Dashboard Canvas ─────────────────────────────────────────── */

function DashboardCanvas({
  activeDash,
  stats,
  widgets,
  onDeleteWidget,
  onUpdateWidget,
}: {
  activeDash?: DashboardItem;
  stats: DashboardMetrics;
  widgets: DashboardWidgetItem[];
  onDeleteWidget: (id: string) => void;
  onUpdateWidget: (id: string, patch: UpdateDashboardWidgetRequest) => void;
}) {
  if (!activeDash) return <EmptyState />;

  const [localFilters, setLocalFilters] = useState<Record<string, unknown>>(activeDash.filters || {});
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null); // null = off, otherwise ms

  useEffect(() => {
    setLocalFilters(activeDash.filters || {});
  }, [activeDash.id, activeDash.filters]);

  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      console.log('Live Refreshing Dashboard...');
      widgets.forEach(w => {
        if (w.sql) {
          refreshDashboardWidget(w.id).then((updated) => {
            onUpdateWidget(w.id, { columns: updated.columns, rows: updated.rows } as UpdateDashboardWidgetRequest);
          }).catch((err: unknown) => console.error('Refresh fail:', err));
        }
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, widgets, onUpdateWidget]);

  const handleApplyFilters = async () => {
    try {
      await updateDashboard(activeDash.id, { filters: localFilters });
      window.location.reload();
    } catch (err) {
      console.error('Failed to apply filters:', err);
    }
  };

  const layouts = useMemo(() => {
    return {
      lg: widgets.map((w): GridLayoutItem => {
        return {
          i: w.id,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          minW: w.viz_type === 'kpi' ? 5 : 4,
          minH: w.viz_type === 'kpi' ? 4 : 5
        };
      })
    };
  }, [widgets]);

  const handleLayoutChange = (currentLayout: readonly GridLayoutItem[]) => {
    currentLayout.forEach((item) => {
      const widget = widgets.find(w => w.id === item.i);
      if (widget) {
        if (widget.x !== item.x || widget.y !== item.y || widget.w !== item.w || widget.h !== item.h) {
          onUpdateWidget(item.i, {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          });
        }
      }
    });
  };

  return (
    <>
      <div className="dash-section" style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(124,58,255,0.1))',
          border: '1px solid rgba(0,229,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {activeDash.icon || '📊'}
        </div>
        <div>
          <div style={{
            fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.25rem',
            color: T.text, letterSpacing: -0.5,
          }}>{activeDash.name}</div>
          <div style={{
            fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono,
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
          }}>
            <span>{stats.total_widgets} widget{stats.total_widgets !== 1 ? 's' : ''}</span>
            <span style={{
              width: 3, height: 3, borderRadius: '50%',
              background: T.text3, display: 'inline-block',
            }} />
            <span>Created {new Date(activeDash.created_at).toLocaleDateString()}</span>
            <span style={{
              width: 3, height: 3, borderRadius: '50%',
              background: T.text3, display: 'inline-block',
            }} />
            <button 
              onClick={() => setRefreshInterval(refreshInterval ? null : 60000)}
              style={{
                background: 'transparent', border: 'none', 
                color: refreshInterval ? T.accent : T.text3,
                fontSize: '0.68rem', fontFamily: T.fontMono, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <div style={{ 
                width: 6, height: 6, borderRadius: '50%', 
                background: refreshInterval ? T.accent : T.text3,
                boxShadow: refreshInterval ? `0 0 8px ${T.accent}` : 'none'
              }} />
              {refreshInterval ? 'LIVE REFRESH (60s)' : 'LIVE REFRESH OFF'}
            </button>
          </div>
        </div>
      </div>

      {stats.total_widgets > 0 && (
        <div className="dash-section dash-section-d1" style={{
          display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap',
        }}>
          {Object.entries(stats.viz_breakdown || {}).map(([key, value]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.s1, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '5px 12px',
              fontSize: '0.7rem', fontFamily: T.fontMono,
              transition: 'all 0.18s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)';
                e.currentTarget.style.background = 'rgba(0,229,255,0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = T.s1;
              }}
            >
              <span style={{ color: T.accent, fontWeight: 700 }}>{String(value)}</span>
              <span style={{ color: T.text3 }}>{key}</span>
            </div>
          ))}
        </div>
      )}

      <DashboardFilterBar 
        filters={localFilters}
        onFiltersChange={setLocalFilters}
        onApply={handleApplyFilters}
      />

      {widgets.length > 0 ? (
        <div id="dashboard-grid" className="dash-section dash-section-d2" style={{ paddingBottom: 14, background: T.bg }}>
          <ResponsiveGridLayout
            layouts={layouts}
            breakpoints={{ lg: 1024, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 20, md: 15, sm: 10, xs: 5, xxs: 2 }}
            rowHeight={30}
            draggableHandle=".widget-drag-handle"
            isDraggable={true}
            isResizable={true}
            onLayoutChange={(_, allLayouts) => handleLayoutChange(allLayouts.lg || [])}
            margin={[20, 20]}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetRenderer
                  widget={widget}
                  onDelete={onDeleteWidget}
                  onUpdateWidget={onUpdateWidget}
                />
              </div>
            ))}
          </ResponsiveGridLayout>

          <div style={{
            border: `1px dashed rgba(0,229,255,0.15)`,
            borderRadius: 14, minHeight: 64,
            color: T.text3, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', marginTop: 16,
            background: 'rgba(0,229,255,0.02)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)';
              e.currentTarget.style.background = 'rgba(0,229,255,0.04)';
              e.currentTarget.style.color = T.accent;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(0,229,255,0.15)';
              e.currentTarget.style.background = 'rgba(0,229,255,0.02)';
              e.currentTarget.style.color = T.text3;
            }}
          >
            <IconPlus />&nbsp; Add more widgets from Chat using
            <strong style={{ color: T.accent, marginLeft: 5 }}>+ Dashboard</strong>
          </div>
        </div>
      ) : (
        <div className="dash-section dash-section-d1" style={{
          border: `1px dashed rgba(0,229,255,0.15)`,
          borderRadius: 18, padding: '55px 40px',
          textAlign: 'center', position: 'relative',
          background: 'rgba(0,229,255,0.015)',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: '2.5rem', marginBottom: 14, position: 'relative' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div style={{
            fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.15rem',
            color: T.text, marginBottom: 8, position: 'relative',
          }}>No widgets yet</div>
          <div style={{
            fontSize: '0.82rem', color: T.text3, maxWidth: 340,
            lineHeight: 1.7, margin: '0 auto', position: 'relative',
          }}>
            Run queries in Chat and add your visualizations here to build your dashboard.
          </div>
        </div>
      )}
    </>
  );
}

/* ── Main DashboardPage ─────────────────────────────────────────── */

export function DashboardPage() {
  const { dashboards, reloadDashboards, createNewDashboard, creating } = useDashboardCatalog();
  const [activeDashId, setActiveDashId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetItem[]>([]);
  const [stats, setStats] = useState<DashboardMetrics>({ total_widgets: 0, viz_breakdown: {} });
  const [newDashName, setNewDashName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardItem | null>(null);
  const [sidebarTriggeredHover, setSidebarTriggeredHover] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSidebarHover = (isHovering: boolean) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (isHovering) {
      setSidebarTriggeredHover(true);
    } else {
      hoverTimeoutRef.current = setTimeout(() => setSidebarTriggeredHover(false), 150);
    }
  };

  const fetchWidgets = useCallback(async () => {
    if (!activeDashId) {
      setWidgets([]);
      setStats({ total_widgets: 0, viz_breakdown: {} });
      return;
    }
    const [widgetResult, statsResult] = await Promise.all([
      listDashboardWidgets(activeDashId),
      getDashboardStats(activeDashId),
    ]);

    const normalizedWidgets = widgetResult.map(w => {
      let newW = w.w;
      let newH = w.h;

      const isKPI = w.viz_type === 'kpi';
      
      if (isKPI) {
        newW = 5;
        newH = 5;
      } else if (w.w < 4) {
        newW = 10;
        newH = Math.max(w.h, 7);
      }

      if (newW !== w.w || newH !== w.h) {
        return { ...w, w: newW, h: newH };
      }
      return w;
    });

    const kpis = normalizedWidgets.filter(w => w.viz_type === 'kpi').sort((a, b) => a.x - b.x);
    const nonKpis = normalizedWidgets.filter(w => w.viz_type !== 'kpi');
    
    const kpiRowsUsed = kpis.length > 0 ? Math.ceil(kpis.length / 4) * 5 : 0;
    
    const herdedWidgets = [
      ...kpis.map((w, i) => ({
        ...w,
        x: (i % 4) * 5,
        y: Math.floor(i / 4) * 5
      })),
      ...nonKpis.map(w => ({
        ...w,
        y: Math.max(w.y, kpiRowsUsed)
      }))
    ];

    setWidgets(herdedWidgets);
    setStats(statsResult);

    // Persist repairs to DB
    herdedWidgets.forEach(w => {
      const original = widgetResult.find(ow => ow.id === w.id);
      if (original && (original.w !== w.w || original.h !== w.h || original.x !== w.x || original.y !== w.y)) {
        updateDashboardWidget(w.id, { x: w.x, y: w.y, w: w.w, h: w.h });
      }
    });
  }, [activeDashId]);

  useEffect(() => {
    if (dashboards.length > 0 && !activeDashId) {
      setActiveDashId(dashboards[0].id);
    }
  }, [dashboards, activeDashId]);

  useEffect(() => {
    if (activeDashId && dashboards.every((dashboard) => dashboard.id !== activeDashId)) {
      setActiveDashId(dashboards[0]?.id || null);
    }
  }, [dashboards, activeDashId]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const handleDeleteWidget = async (id: string) => {
    await deleteDashboardWidget(id);
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    fetchWidgets();
    reloadDashboards();
  };

  const handleUpdateWidget = useCallback(async (id: string, patch: UpdateDashboardWidgetRequest) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    try {
      await updateDashboardWidget(id, patch);
    } catch {
      fetchWidgets();
    }
  }, [fetchWidgets]);

  const handleCreateDash = async () => {
    if (!newDashName.trim()) return;
    const created = await createNewDashboard({ name: newDashName.trim() });
    setNewDashName('');
    setShowCreateForm(false);
    setActiveDashId(created.id);
  };

  const handleDeleteDash = async (id: string) => {
    await deleteDashboard(id);
    await reloadDashboards();
    setActiveDashId((prev) => (prev === id ? null : prev));
  };

  const handleRenameDash = async (id: string, name: string) => {
    await renameDashboard(id, name);
    await reloadDashboards();
  };

  const activeDash = dashboards.find((dashboard) => dashboard.id === activeDashId);

  const handleExportPNG = async () => {
    if (!activeDash) return;
    const { exportToPNG } = await import('../utils/exportUtils');
    await exportToPNG('dashboard-grid', `${activeDash.name.replace(/\s+/g, '_')}_Dashboard`);
  };

  const handleShareClick = async () => {
    if (!activeDash) return;
    try {
      let token = activeDash.share_token;
      if (!activeDash.is_public || !token) {
        const updated = await updateDashboard(activeDash.id, { is_public: true });
        token = updated.share_token;
        await reloadDashboards();
      }
      if (token) {
        const url = `${window.location.origin}/s/${token}`;
        await navigator.clipboard.writeText(url);
        alert(`Public link enabled and copied to clipboard!\n${url}`);
      }
    } catch (err) {
      console.error('Failed to create share link:', err);
      alert('Failed to create share link.');
    }
  };

  return (
    <MainShell
      title={activeDash?.name || 'Dashboards'}
      subtitle={activeDash ? `${stats.total_widgets} widgets` : 'Data Insights'}
      badge={dashboards.length > 0 ? {
        text: `${dashboards.length} platforms`,
        color: T.accent,
        icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
      } : undefined}
      headerActions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={headerIconBtnStyle} title="Search"><HeaderIcons.Search /></button>
          <button onClick={handleShareClick} style={headerActionBtnStyle} title="Share"><HeaderIcons.Share /> Share URL</button>
          <button onClick={handleExportPNG} style={headerActionBtnStyle} title="Export Report"><HeaderIcons.Download /> Export PNG</button>
          <button 
            onClick={() => setShowCreateForm(true)}
            style={{
              ...headerActionBtnStyle,
              background: T.accent,
              color: '#fff',
              border: 'none',
              fontWeight: 700
            }}
          >
            <HeaderIcons.Plus /> New
          </button>
        </div>
      }
      onDashboardHover={handleSidebarHover}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <DashboardRail
          dashboards={dashboards}
          activeDashId={activeDashId}
          onSelect={setActiveDashId}
          onDelete={setDashboardToDelete}
          onRename={handleRenameDash}
          showCreateForm={showCreateForm}
          onShowCreateForm={() => setShowCreateForm(true)}
          newDashName={newDashName}
          onNewDashNameChange={setNewDashName}
          onCreate={handleCreateDash}
          onCancelCreate={() => setShowCreateForm(false)}
          creating={creating}
          externalHover={sidebarTriggeredHover}
        />
        {/* Main Dashboard Content */}
        <div className="dash-scroll" style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '24px 32px 48px', background: T.bg,
        }}>
          <DashboardCanvas
            activeDash={activeDash}
            stats={stats}
            widgets={widgets}
            onDeleteWidget={handleDeleteWidget}
            onUpdateWidget={handleUpdateWidget}
          />
        </div>
      </div>

      <DeleteDashboardModal
        isOpen={!!dashboardToDelete}
        onClose={() => setDashboardToDelete(null)}
        onConfirm={() => {
          if (dashboardToDelete) {
            handleDeleteDash(dashboardToDelete.id);
            setDashboardToDelete(null);
          }
        }}
        dashboardName={dashboardToDelete?.name || ''}
      />
    </MainShell>
  );
}

const headerActionBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: 'transparent',
  color: T.text2, fontSize: '0.76rem',
  cursor: 'pointer', fontFamily: T.fontBody,
  transition: 'all 0.18s ease',
};

const headerIconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent',
  color: T.text3, cursor: 'pointer', transition: 'all 0.18s ease',
};
