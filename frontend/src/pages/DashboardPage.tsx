import { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { WidgetRenderer } from '../components/dashboard/WidgetRenderer';
import { T } from '../components/dashboard/tokens';
import { listDashboards, createDashboard, deleteDashboard, listDashboardWidgets, deleteDashboardWidget, getDashboardStats } from '../services/api';

interface DashData { id: string; name: string; icon: string; widget_count: number; created_at: string }

export function DashboardPage() {
  const [dashboards, setDashboards] = useState<DashData[]>([]);
  const [activeDashId, setActiveDashId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_widgets: 0, viz_breakdown: {} });
  const [newDashName, setNewDashName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchDashboards = useCallback(async () => {
    const d = await listDashboards();
    setDashboards(d);
    if (d.length > 0 && !activeDashId) setActiveDashId(d[0].id);
  }, []);

  const fetchWidgets = useCallback(async () => {
    if (!activeDashId) { setWidgets([]); setStats({ total_widgets: 0, viz_breakdown: {} }); return; }
    const [w, s] = await Promise.all([listDashboardWidgets(activeDashId), getDashboardStats(activeDashId)]);
    setWidgets(w);
    setStats(s);
  }, [activeDashId]);

  useEffect(() => { fetchDashboards(); }, [fetchDashboards]);
  useEffect(() => { fetchWidgets(); }, [fetchWidgets]);

  const handleDeleteWidget = async (id: string) => {
    await deleteDashboardWidget(id);
    fetchWidgets();
    fetchDashboards(); // update widget counts
  };

  const handleCreateDash = async () => {
    if (!newDashName.trim()) return;
    const d = await createDashboard({ name: newDashName.trim() });
    setNewDashName('');
    setShowCreateForm(false);
    await fetchDashboards();
    setActiveDashId(d.id);
  };

  const handleDeleteDash = async (id: string) => {
    await deleteDashboard(id);
    await fetchDashboards();
    setActiveDashId(prev => prev === id ? null : prev);
  };

  const activeDash = dashboards.find(d => d.id === activeDashId);
  const halfWidgets = widgets.filter(w => w.size === 'half');
  const fullWidgets = widgets.filter(w => w.size === 'full');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#060a12', fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <DashboardTopbar />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Dashboard List Panel */}
          <div style={{ width: 220, flexShrink: 0, background: T.s1, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.85rem', color: T.text, marginBottom: 4 }}>My Dashboards</div>
              <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{dashboards.length} dashboards</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
              {dashboards.map(d => {
                const isActive = d.id === activeDashId;
                return (
                  <div key={d.id} onClick={() => setActiveDashId(d.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9,
                    cursor: 'pointer', transition: 'all 0.15s', marginBottom: 2,
                    background: isActive ? T.accentDim : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(0,229,255,0.15)' : 'transparent'}`,
                    color: isActive ? T.text : T.text3,
                  }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = isActive ? T.accentDim : 'transparent'; e.currentTarget.style.color = isActive ? T.text : T.text3; } }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{d.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                      <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono }}>{d.widget_count} widgets</div>
                    </div>
                    {isActive && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDash(d.id); }} style={{
                        width: 18, height: 18, borderRadius: 4, background: 'transparent', border: `1px solid transparent`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.6rem',
                        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
                      }}
                        onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = T.redDim; }}
                        onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}
                      >✕</button>
                    )}
                  </div>
                );
              })}

              {/* Create new */}
              {!showCreateForm ? (
                <button onClick={() => setShowCreateForm(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderRadius: 9,
                  border: `1px dashed ${T.border2}`, background: 'transparent', cursor: 'pointer',
                  transition: 'all 0.15s', width: '100%', fontFamily: T.fontBody, color: T.text3, marginTop: 4,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '0.8rem' }}>＋</span>
                  <span style={{ fontSize: '0.75rem' }}>New Dashboard</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, padding: '6px 4px' }}>
                  <input autoFocus value={newDashName} onChange={e => setNewDashName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateDash(); if (e.key === 'Escape') setShowCreateForm(false); }}
                    placeholder="Dashboard name" style={{
                      flex: 1, background: T.s3, border: `1px solid rgba(0,229,255,0.2)`, borderRadius: 6,
                      padding: '6px 8px', color: T.text, fontFamily: T.fontBody, fontSize: '0.75rem', outline: 'none',
                    }}
                  />
                  <button onClick={handleCreateDash} disabled={!newDashName.trim()} style={{
                    padding: '5px 10px', borderRadius: 5, border: 'none', background: T.accent, color: '#000',
                    fontSize: '0.68rem', fontWeight: 600, cursor: newDashName.trim() ? 'pointer' : 'not-allowed', opacity: newDashName.trim() ? 1 : 0.5
                  }}>Add</button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px 32px', background: '#060a12' }}>
            {activeDash ? (
              <>
                {/* Dashboard header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '1.4rem' }}>{activeDash.icon}</span>
                  <div>
                    <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.2rem', color: T.text }}>{activeDash.name}</div>
                    <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>
                      {stats.total_widgets} widgets · Created {new Date(activeDash.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                {stats.total_widgets > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    {Object.entries(stats.viz_breakdown || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', fontSize: '0.7rem', fontFamily: T.fontMono }}>
                        <span style={{ color: T.text, fontWeight: 600 }}>{String(v)}</span>
                        <span style={{ color: T.text3 }}>{k}</span>
                      </div>
                    ))}
                  </div>
                )}

                {widgets.length > 0 ? (
                  <>
                    {fullWidgets.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
                        {fullWidgets.map(w => <WidgetRenderer key={w.id} widget={w} onDelete={handleDeleteWidget} />)}
                      </div>
                    )}
                    {halfWidgets.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        {halfWidgets.map(w => <WidgetRenderer key={w.id} widget={w} onDelete={handleDeleteWidget} />)}
                      </div>
                    )}
                    {/* Add more prompt */}
                    <div style={{
                      border: `2px dashed ${T.border2}`, borderRadius: 14,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      minHeight: 80, color: T.text3, padding: '16px',
                    }}>
                      <div style={{ fontSize: '0.78rem' }}>Add more widgets from the <strong style={{ color: T.accent }}>Chat page</strong></div>
                    </div>
                  </>
                ) : (
                  <div style={{
                    border: `2px dashed ${T.border2}`, borderRadius: 18, padding: '60px 40px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>📊</div>
                    <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.1rem', color: T.text, marginBottom: 6 }}>
                      No widgets yet
                    </div>
                    <div style={{ fontSize: '0.82rem', color: T.text3, maxWidth: 360, lineHeight: 1.6 }}>
                      Run queries in the Chat page and click <strong style={{ color: T.accent }}>➕ Dashboard</strong> to add visualizations here.
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No dashboard selected */
              <div style={{
                border: `2px dashed ${T.border2}`, borderRadius: 18, padding: '80px 40px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
                <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.3rem', color: T.text, marginBottom: 8 }}>
                  Create your first dashboard
                </div>
                <div style={{ fontSize: '0.88rem', color: T.text3, maxWidth: 400, lineHeight: 1.6, marginBottom: 20 }}>
                  Click <strong style={{ color: T.accent }}>＋ New Dashboard</strong> in the sidebar to get started, then add widgets from your Chat queries.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
