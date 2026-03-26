import { useEffect, useMemo, useState } from 'react';
import { T } from '../dashboard/tokens';
import { SqlBlock } from './SqlBlock';
import { addDashboardWidget } from '../../services/api';
import { DashboardCreateForm } from '../dashboard/DashboardCreateForm';
import { useDashboardCatalog } from '../../hooks/useDashboardCatalog';
import type { AddToDashboardModalProps } from '../../types/chat';
import type { WidgetSize, WidgetVizType } from '../../types/dashboard';

const CADENCE_OPTIONS = ['Manual only', 'Every hour', 'Every 6h', 'Daily 9am', 'Weekly'];

function isNumericValue(value: unknown) {
  return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)));
}

function inferDefaultViz(message: AddToDashboardModalProps['message']): WidgetVizType {
  const columns = message.columns || [];
  const rows = message.rows || [];
  const hasNumericColumn = columns.some((column) => rows.some((row) => isNumericValue(row[column])));

  if (rows.length === 1 && hasNumericColumn) {
    return 'kpi';
  }

  const recommended = message.chart_recommendation?.type;
  if (recommended === 'bar') return 'bar';
  if (recommended === 'line') return 'line';
  if (recommended === 'area') return 'area';
  if (recommended === 'scatter') return 'scatter';
  if (recommended === 'pie') return 'donut';
  return 'table';
}

function defaultWidgetTitle(message: AddToDashboardModalProps['message']) {
  return message.title || message.chart_recommendation?.title || 'Untitled Widget';
}

function layoutDefaults(size: WidgetSize) {
  if (size === 'full') return { w: 2, h: 8, minW: 2, minH: 6 };
  return { w: 1, h: 7, minW: 1, minH: 5 };
}

function VizCard({
  label,
  hint,
  selected,
  recommended,
  onClick,
  preview,
}: {
  label: string;
  hint: string;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 12,
        border: `1px solid ${selected ? 'rgba(0,229,255,0.35)' : T.border}`,
        background: selected ? 'linear-gradient(180deg, rgba(0,229,255,0.08), rgba(124,58,255,0.04))' : T.s1,
        padding: '12px 12px 10px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'rgba(0,229,255,0.22)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      {recommended && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: '0.56rem',
            fontFamily: T.fontMono,
            color: '#00131a',
            background: T.accent,
            borderRadius: 999,
            padding: '2px 7px',
            fontWeight: 700,
          }}
        >
          REC
        </span>
      )}
      <div style={{ height: 42, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{preview}</div>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: selected ? T.text : T.text2, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.62rem', color: T.text3, lineHeight: 1.5 }}>{hint}</div>
    </button>
  );
}

export function AddToDashboardModal({ isOpen, onClose, message }: AddToDashboardModalProps) {
  const { dashboards, loading, creating, error, createNewDashboard } = useDashboardCatalog({ autoLoad: isOpen });
  const [selectedDashId, setSelectedDashId] = useState<string | null>(null);
  const [showNewDashForm, setShowNewDashForm] = useState(false);
  const [newDashName, setNewDashName] = useState('');
  const [selectedViz, setSelectedViz] = useState<WidgetVizType>('table');
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('half');
  const [selectedCadence, setSelectedCadence] = useState('Manual only');
  const [title, setTitle] = useState(defaultWidgetTitle(message));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rows = message.rows || [];
  const columns = message.columns || [];
  const recommendedViz = useMemo(() => inferDefaultViz(message), [message]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setSelectedViz(recommendedViz);
    setSelectedSize(recommendedViz === 'table' || (recommendedViz === 'bar' && rows.length > 6) ? 'full' : 'half');
    setSelectedCadence('Manual only');
    setTitle(defaultWidgetTitle(message));
    setShowNewDashForm(false);
    setNewDashName('');
    setSaving(false);
    setSaved(false);
    setSaveError(null);
  }, [isOpen, message, recommendedViz]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (dashboards.length > 0 && !selectedDashId) {
      setSelectedDashId(dashboards[0].id);
    }
    if (selectedDashId && dashboards.every((dashboard) => dashboard.id !== selectedDashId)) {
      setSelectedDashId(dashboards[0]?.id || null);
    }
  }, [dashboards, selectedDashId, isOpen]);

  useEffect(() => {
    if (isOpen && !loading && dashboards.length === 0) {
      setShowNewDashForm(true);
    }
  }, [isOpen, loading, dashboards.length]);

  if (!isOpen) return null;

  const handleCreateDash = async () => {
    if (!newDashName.trim()) return;
    try {
      const created = await createNewDashboard({ name: newDashName.trim(), icon: '[]' });
      setSelectedDashId(created.id);
      setNewDashName('');
      setShowNewDashForm(false);
    } catch {
      // hook already exposes the error
    }
  };

  const handleAddWidget = async () => {
    if (!selectedDashId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const dims = layoutDefaults(selectedSize);
      await addDashboardWidget({
        dashboard_id: selectedDashId,
        title: title.trim() || defaultWidgetTitle(message),
        viz_type: selectedViz,
        size: selectedSize,
        connection_id: message.connectionId,
        columns,
        rows: rows as Array<Record<string, unknown>>,
        chart_config: message.chart_recommendation ? {
          x_column: message.chart_recommendation.x_column,
          y_columns: message.chart_recommendation.y_columns,
          title: message.chart_recommendation.title,
          x_label: message.chart_recommendation.x_label,
          y_label: message.chart_recommendation.y_label,
        } : undefined,
        cadence: selectedCadence,
        w: dims.w,
        h: dims.h,
        minW: dims.minW,
        minH: dims.minH,
        bar_orientation: 'horizontal',
      });
      setSaved(true);
      window.setTimeout(() => {
        onClose();
        setSaved(false);
      }, 900);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add widget');
    } finally {
      setSaving(false);
    }
  };

  const dashboardError = error || saveError;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,10,18,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: T.fontBody,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 840,
          maxWidth: '96vw',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, rgba(15,25,41,0.98), rgba(8,12,22,0.98))',
          border: `1px solid ${T.border2}`,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(0,229,255,0.14), rgba(124,58,255,0.12))',
              border: '1px solid rgba(0,229,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.accent,
              fontFamily: T.fontMono,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            DB
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', color: T.text, marginBottom: 4 }}>Add Query Result to Dashboard</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{message.dbName || 'database'}</span>
              <span style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{rows.length} rows</span>
              <span style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{columns.length} columns</span>
              <span style={{ fontSize: '0.68rem', color: T.accent, fontFamily: T.fontMono }}>recommended {recommendedViz}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              color: T.text3,
              cursor: 'pointer',
            }}
          >
            x
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'grid', gap: 18 }}>
          {message.sql && (
            <SqlBlock
              sql={message.sql}
              mode="card"
              collapsible={false}
              maxVisibleLines={6}
              title="QUERY PREVIEW"
              trailingMeta={`${Math.min(message.sql.length, 300)} chars`}
            />
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono }}>
              Dashboard Destination
            </div>

            {loading ? (
              <div style={{ fontSize: '0.8rem', color: T.text3 }}>Loading dashboards...</div>
            ) : dashboards.length === 0 && !showNewDashForm ? (
              <div style={{ fontSize: '0.8rem', color: T.text3 }}>No dashboards yet. Create one to save this widget.</div>
            ) : dashboards.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {dashboards.map((dashboard) => {
                  const selected = dashboard.id === selectedDashId;
                  return (
                    <button
                      key={dashboard.id}
                      onClick={() => setSelectedDashId(dashboard.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${selected ? 'rgba(0,229,255,0.35)' : T.border}`,
                        background: selected ? T.accentDim : T.s1,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: selected ? 'rgba(0,229,255,0.14)' : T.s3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.74rem',
                          fontFamily: T.fontMono,
                          color: selected ? T.accent : T.text2,
                          flexShrink: 0,
                        }}
                      >
                        {dashboard.icon || '[]'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{dashboard.name}</div>
                        <div style={{ fontSize: '0.66rem', color: T.text3, fontFamily: T.fontMono }}>
                          {dashboard.widget_count} widgets • created {new Date(dashboard.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!showNewDashForm ? (
              <button
                onClick={() => setShowNewDashForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: `1px dashed ${T.border2}`,
                  background: 'transparent',
                  color: T.text3,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: T.accent }}>+</span>
                Create new dashboard
              </button>
            ) : (
              <DashboardCreateForm
                value={newDashName}
                onChange={setNewDashName}
                onCreate={handleCreateDash}
                onCancel={() => setShowNewDashForm(false)}
                creating={creating}
              />
            )}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono }}>
              Widget Setup
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget title"
              style={{
                width: '100%',
                background: T.s1,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: '11px 13px',
                color: T.text,
                fontFamily: T.fontBody,
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
              <VizCard
                label="KPI"
                hint="Single value or small stat block"
                selected={selectedViz === 'kpi'}
                recommended={recommendedViz === 'kpi'}
                onClick={() => { setSelectedViz('kpi'); setSelectedSize('half'); }}
                preview={<div style={{ fontFamily: T.fontHead, fontSize: '1.3rem', color: T.yellow }}>128K</div>}
              />
              <VizCard
                label="Bar"
                hint="Compare grouped values"
                selected={selectedViz === 'bar'}
                recommended={recommendedViz === 'bar'}
                onClick={() => { setSelectedViz('bar'); if (rows.length > 6) setSelectedSize('full'); }}
                preview={<svg width="46" height="30" viewBox="0 0 46 30"><rect x="3" y="11" width="6" height="16" rx="2" fill={T.accent} /><rect x="14" y="6" width="6" height="21" rx="2" fill={T.accent} opacity="0.85" /><rect x="25" y="14" width="6" height="13" rx="2" fill={T.accent} opacity="0.65" /><rect x="36" y="3" width="6" height="24" rx="2" fill={T.accent} opacity="0.95" /></svg>}
              />
              <VizCard
                label="Line"
                hint="Track trends over time"
                selected={selectedViz === 'line'}
                recommended={recommendedViz === 'line'}
                onClick={() => { setSelectedViz('line');  }}
                preview={<svg width="46" height="30" viewBox="0 0 46 30"><polyline points="2,23 12,14 21,17 31,8 44,5" fill="none" stroke={T.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              />
              <VizCard
                label="Area"
                hint="Filled trend chart"
                selected={selectedViz === 'area'}
                recommended={recommendedViz === 'area'}
                onClick={() => { setSelectedViz('area');  }}
                preview={<svg width="46" height="30" viewBox="0 0 46 30"><path d="M2 24 L12 14 L20 16 L30 9 L44 7 L44 28 L2 28 Z" fill={T.purpleDim} /><polyline points="2,24 12,14 20,16 30,9 44,7" fill="none" stroke={T.purple} strokeWidth="2.1" /></svg>}
              />
              <VizCard
                label="Scatter"
                hint="Point distribution"
                selected={selectedViz === 'scatter'}
                recommended={recommendedViz === 'scatter'}
                onClick={() => { setSelectedViz('scatter');  }}
                preview={<svg width="46" height="30" viewBox="0 0 46 30"><circle cx="8" cy="21" r="2.8" fill={T.yellow} /><circle cx="16" cy="12" r="2.5" fill={T.yellow} /><circle cx="24" cy="16" r="2.7" fill={T.yellow} /><circle cx="34" cy="8" r="2.8" fill={T.yellow} /></svg>}
              />
              <VizCard
                label="Donut"
                hint="Show category share"
                selected={selectedViz === 'donut'}
                recommended={recommendedViz === 'donut'}
                onClick={() => { setSelectedViz('donut');  }}
                preview={<svg width="34" height="34" viewBox="0 0 36 36"><circle cx="18" cy="18" r="12" fill="none" stroke={T.s4} strokeWidth="7" /><circle cx="18" cy="18" r="12" fill="none" stroke={T.purple} strokeWidth="7" strokeDasharray="28 48" strokeDashoffset="20" /><circle cx="18" cy="18" r="12" fill="none" stroke={T.accent} strokeWidth="7" strokeDasharray="18 58" strokeDashoffset="-12" /></svg>}
              />
              <VizCard
                label="Table"
                hint="Keep full record detail"
                selected={selectedViz === 'table'}
                recommended={recommendedViz === 'table'}
                onClick={() => { setSelectedViz('table'); setSelectedSize('full'); }}
                preview={<div style={{ width: 42, display: 'grid', gap: 3 }}><div style={{ height: 4, borderRadius: 2, background: T.accent }} /><div style={{ height: 4, borderRadius: 2, background: T.text3 }} /><div style={{ height: 4, borderRadius: 2, background: T.text3 }} /><div style={{ height: 4, borderRadius: 2, background: T.text3 }} /></div>}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {([
                { id: 'half' as const, label: 'Half width', hint: 'Best for charts and KPIs' },
                { id: 'full' as const, label: 'Full width', hint: 'Best for tables and large charts' },
              ]).map((size) => {
                const selected = selectedSize === size.id;
                return (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${selected ? 'rgba(0,229,255,0.35)' : T.border}`,
                      background: selected ? T.accentDim : T.s1,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>{size.label}</div>
                    <div style={{ fontSize: '0.64rem', color: T.text3 }}>{size.hint}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CADENCE_OPTIONS.map((cadence) => {
                const selected = selectedCadence === cadence;
                return (
                  <button
                    key={cadence}
                    onClick={() => setSelectedCadence(cadence)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: `1px solid ${selected ? 'rgba(0,229,255,0.35)' : T.border}`,
                      background: selected ? T.accentDim : T.s1,
                      color: selected ? T.accent : T.text3,
                      fontSize: '0.7rem',
                      fontFamily: T.fontMono,
                      cursor: 'pointer',
                    }}
                  >
                    {cadence}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.16)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: '0.72rem', color: dashboardError ? T.red : saved ? T.green : T.text3, fontFamily: T.fontMono }}>
            {dashboardError || (saved ? 'Widget added to dashboard' : `${columns.length} columns • ${rows.length} rows`)}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              color: T.text2,
              cursor: 'pointer',
              fontFamily: T.fontBody,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAddWidget}
            disabled={saving || saved || !selectedDashId}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: saved ? T.greenDim : 'linear-gradient(135deg, rgba(0,229,255,0.95), rgba(0,160,180,0.95))',
              color: saved ? T.green : '#00131a',
              cursor: saving || saved || !selectedDashId ? 'not-allowed' : 'pointer',
              opacity: saving || !selectedDashId ? 0.55 : 1,
              fontFamily: T.fontHead,
              fontWeight: 700,
              fontSize: '0.86rem',
            }}
          >
            {saved ? 'Added' : saving ? 'Adding...' : 'Add Widget'}
          </button>
        </div>
      </div>
    </div>
  );
}
