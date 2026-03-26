import { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { DashboardCreateForm } from '../components/dashboard/DashboardCreateForm';
import { WidgetRenderer } from '../components/dashboard/WidgetRenderer';
import { T } from '../components/dashboard/tokens';
import {
  deleteDashboard,
  listDashboardWidgets,
  deleteDashboardWidget,
  getDashboardStats,
  updateDashboardWidget,
} from '../services/api';
import { useDashboardCatalog } from '../hooks/useDashboardCatalog';
import type { DashboardItem, DashboardMetrics, DashboardWidgetItem } from '../types/dashboard';
import type { UpdateDashboardWidgetRequest } from '../types/api';
import { resolveWidgetSize } from '../types/dashboard';

function DashboardRail({
  dashboards,
  activeDashId,
  onSelect,
  onDelete,
  showCreateForm,
  onShowCreateForm,
  newDashName,
  onNewDashNameChange,
  onCreate,
  onCancelCreate,
  creating,
}: {
  dashboards: DashboardItem[];
  activeDashId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  showCreateForm: boolean;
  onShowCreateForm: () => void;
  newDashName: string;
  onNewDashNameChange: (value: string) => void;
  onCreate: () => void;
  onCancelCreate: () => void;
  creating: boolean;
}) {
  return (
    <div style={{ width: 235, flexShrink: 0, background: T.s1, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.86rem', color: T.text, marginBottom: 4 }}>My Dashboards</div>
        <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{dashboards.length} dashboards</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {dashboards.map((dashboard) => {
          const isActive = dashboard.id === activeDashId;
          return (
            <div
              key={dashboard.id}
              onClick={() => onSelect(dashboard.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 10px',
                borderRadius: 9,
                cursor: 'pointer',
                marginBottom: 2,
                background: isActive ? T.accentDim : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,229,255,0.18)' : 'transparent'}`,
                color: isActive ? T.text : T.text3,
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>{dashboard.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dashboard.name}</div>
                <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono }}>{dashboard.widget_count} widgets</div>
              </div>
              {isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(dashboard.id); }}
                  style={{ width: 18, height: 18, borderRadius: 4, background: 'transparent', border: '1px solid transparent', color: T.text3, fontSize: '0.6rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  x
                </button>
              )}
            </div>
          );
        })}

        {!showCreateForm ? (
          <button
            onClick={onShowCreateForm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 10px',
              borderRadius: 9,
              border: `1px dashed ${T.border2}`,
              background: 'transparent',
              cursor: 'pointer',
              width: '100%',
              color: T.text3,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: '0.8rem' }}>+</span>
            <span style={{ fontSize: '0.75rem' }}>New Dashboard</span>
          </button>
        ) : (
          <DashboardCreateForm
            value={newDashName}
            onChange={onNewDashNameChange}
            onCreate={onCreate}
            onCancel={onCancelCreate}
            creating={creating}
            compact
            ctaLabel="Add"
          />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ border: `2px dashed ${T.border2}`, borderRadius: 18, padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>[]</div>
      <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.3rem', color: T.text, marginBottom: 8 }}>
        Create your first dashboard
      </div>
      <div style={{ fontSize: '0.88rem', color: T.text3, maxWidth: 440, lineHeight: 1.6 }}>
        Click <strong style={{ color: T.accent }}>+ New Dashboard</strong> in the sidebar, then add widgets from Chat results using <strong style={{ color: T.accent }}>+ Dashboard</strong>.
      </div>
    </div>
  );
}

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

  const getGridSpan = (widget: DashboardWidgetItem) => {
    const size = resolveWidgetSize(widget.size, widget.viz_type, widget.rows.length);
    return size === 'full' ? 'span 2' : 'span 1';
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: '1.35rem' }}>{activeDash.icon}</span>
        <div>
          <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.2rem', color: T.text }}>{activeDash.name}</div>
          <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>
            {stats.total_widgets} widgets · Created {new Date(activeDash.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {['All Regions', 'All Products', 'Status: Completed'].map((chip) => (
          <button key={chip} style={{ borderRadius: 999, border: `1px solid ${T.border}`, background: T.s1, color: chip === 'All Regions' ? T.accent : T.text2, padding: '7px 14px', fontFamily: T.fontMono, fontSize: '0.72rem' }}>
            {chip}
          </button>
        ))}
        <button style={{ borderRadius: 999, border: `1px solid ${T.border}`, background: T.s1, color: T.text2, padding: '7px 14px', fontFamily: T.fontMono, fontSize: '0.72rem' }}>+ Add Filter</button>
        <span style={{ marginLeft: 'auto', fontFamily: T.fontMono, fontSize: '0.7rem', color: T.text3 }}>Ordered layout</span>
      </div>

      {stats.total_widgets > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(stats.viz_breakdown || {}).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', fontSize: '0.7rem', fontFamily: T.fontMono }}>
              <span style={{ color: T.text, fontWeight: 600 }}>{String(value)}</span>
              <span style={{ color: T.text3 }}>{key}</span>
            </div>
          ))}
        </div>
      )}

      {widgets.length > 0 ? (
        <div style={{ paddingBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, alignItems: 'stretch' }}>
            {widgets.map((widget) => (
              <div key={widget.id} style={{ gridColumn: getGridSpan(widget) }}>
                <WidgetRenderer widget={widget} onDelete={onDeleteWidget} onUpdateWidget={onUpdateWidget} />
              </div>
            ))}
          </div>
          <div style={{ border: `2px dashed ${T.border2}`, borderRadius: 14, minHeight: 70, color: T.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', marginTop: 14 }}>
            Add more widgets from Chat page using <strong style={{ color: T.accent, marginLeft: 5 }}>+ Dashboard</strong>
          </div>
        </div>
      ) : (
        <div style={{ border: `2px dashed ${T.border2}`, borderRadius: 18, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>[=]</div>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.1rem', color: T.text, marginBottom: 6 }}>No widgets yet</div>
          <div style={{ fontSize: '0.82rem', color: T.text3, maxWidth: 360, lineHeight: 1.6, margin: '0 auto' }}>
            Run queries in Chat and add visualizations here.
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardPage() {
  const { dashboards, reloadDashboards, createNewDashboard, creating } = useDashboardCatalog();
  const [activeDashId, setActiveDashId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetItem[]>([]);
  const [stats, setStats] = useState<DashboardMetrics>({ total_widgets: 0, viz_breakdown: {} });
  const [newDashName, setNewDashName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    setWidgets(widgetResult);
    setStats(statsResult);
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

  const activeDash = dashboards.find((dashboard) => dashboard.id === activeDashId);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#060a12', fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <DashboardTopbar activeDashboard={activeDash} dashboardCount={dashboards.length} />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <DashboardRail
            dashboards={dashboards}
            activeDashId={activeDashId}
            onSelect={setActiveDashId}
            onDelete={handleDeleteDash}
            showCreateForm={showCreateForm}
            onShowCreateForm={() => setShowCreateForm(true)}
            newDashName={newDashName}
            onNewDashNameChange={setNewDashName}
            onCreate={handleCreateDash}
            onCancelCreate={() => setShowCreateForm(false)}
            creating={creating}
          />

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '18px 22px 30px', background: '#060a12' }}>
            <DashboardCanvas activeDash={activeDash} stats={stats} widgets={widgets} onDeleteWidget={handleDeleteWidget} onUpdateWidget={handleUpdateWidget} />
          </div>
        </div>
      </div>
    </div>
  );
}
