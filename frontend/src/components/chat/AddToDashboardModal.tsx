import { useEffect, useMemo, useState } from 'react';
import { T } from '../dashboard/tokens';
import { addDashboardWidget } from '../../services/api';
import { DashboardCreateForm } from '../dashboard/DashboardCreateForm';
import { useDashboardCatalog } from '../../hooks/useDashboardCatalog';
import { inferViz, autoTitle, layoutDims } from '../../utils/dashboardUtils';
import type { AddToDashboardModalProps } from '../../types/chat';
import type { WidgetSize } from '../../types/dashboard';

/* ─── Compact Popover Modal ─── */
export function AddToDashboardModal({ isOpen, onClose, message }: AddToDashboardModalProps) {
  const { dashboards, loading, creating, error, createNewDashboard } = useDashboardCatalog({ autoLoad: isOpen });
  const [selectedDashId, setSelectedDashId] = useState<string | null>(() => localStorage.getItem('lastUsedDashboardId'));
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const rows = message.rows || [];
  const columns = message.columns || [];
  const vizType = useMemo(() => inferViz(message), [message]);
  const [size, setSize] = useState<WidgetSize>('half');

  // Reset when opening
  useEffect(() => {
    if (!isOpen) return;
    const initialSize: WidgetSize = vizType === 'kpi' ? 'quarter' : (vizType === 'table' || (vizType === 'bar' && rows.length > 6) ? 'full' : 'half');
    setSize(initialSize);
    setTitle(autoTitle(message));
    setShowNewForm(false);
    setNewName('');
    setSaving(false);
    setStatus('idle');
    setErrorMsg('');
  }, [isOpen, message, vizType, rows.length]);

  // Auto-select first dashboard
  useEffect(() => {
    if (!isOpen) return;
    if (dashboards.length > 0 && !selectedDashId) setSelectedDashId(dashboards[0].id);
    if (selectedDashId && dashboards.every(d => d.id !== selectedDashId)) setSelectedDashId(dashboards[0]?.id || null);
  }, [dashboards, selectedDashId, isOpen]);

  // Show create form when no dashboards
  useEffect(() => {
    if (isOpen && !loading && dashboards.length === 0) setShowNewForm(true);
  }, [isOpen, loading, dashboards.length]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createNewDashboard({ name: newName.trim(), icon: '[]' });
      setSelectedDashId(created.id);
      localStorage.setItem('lastUsedDashboardId', created.id);
      setNewName('');
      setShowNewForm(false);
    } catch { /* hook exposes error */ }
  };

  const handleAdd = async () => {
    if (!selectedDashId) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const dims = layoutDims(size);
      await addDashboardWidget({
        dashboard_id: selectedDashId,
        title: title.trim() || autoTitle(message),
        viz_type: vizType,
        size,
        connection_id: message.connectionId,
        sql: message.sql,
        columns,
        rows: rows as Array<Record<string, unknown>>,
        chart_config: message.chart_recommendation ? {
          x_column: message.chart_recommendation.x_column,
          y_columns: message.chart_recommendation.y_columns,
          color_column: message.chart_recommendation.color_column,
          is_grouped: message.chart_recommendation.is_grouped,
          title: message.chart_recommendation.title,
          x_label: message.chart_recommendation.x_label,
          y_label: message.chart_recommendation.y_label,
        } : undefined,
        cadence: 'Manual only',
        w: dims.w, h: dims.h, minW: dims.minW, minH: dims.minH,
        bar_orientation: 'horizontal',
      });
      localStorage.setItem('lastUsedDashboardId', selectedDashId);
      setStatus('saved');
      setTimeout(() => { onClose(); setStatus('idle'); }, 900);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const selectedDash = dashboards.find(d => d.id === selectedDashId);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(6,10,18,0.7)', backdropFilter: 'blur(6px)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontBody,
      }}
    >
      <div style={{
        width: 440, maxWidth: '95vw',
        background: 'linear-gradient(180deg, rgba(15,25,41,0.98), rgba(8,12,22,0.98))',
        border: `1px solid ${T.border2}`, borderRadius: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '16px 20px 14px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.14), rgba(124,58,255,0.12))',
            border: '1px solid rgba(0,229,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.82rem', flexShrink: 0,
          }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '0.92rem', color: T.text }}>
              Add to Dashboard
            </div>
            <div style={{ fontSize: '0.64rem', color: T.text3, fontFamily: T.fontMono, marginTop: 2 }}>
              {vizType.toUpperCase()} · {rows.length} rows · {columns.length} cols
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8,
            border: `1px solid ${T.border}`, background: 'transparent',
            color: T.text3, cursor: 'pointer', fontSize: '0.8rem',
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>
          {/* Title — editable inline */}
          <div>
            <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 6, display: 'block' }}>
              Widget Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Auto-generated title"
              style={{
                width: '100%', background: T.s1, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '10px 12px', color: T.text,
                fontFamily: T.fontBody, fontSize: '0.84rem', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)'}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>

          {/* Dashboard picker */}
          <div>
            <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 6, display: 'block' }}>
              Destination
            </label>

            {loading ? (
              <div style={{ fontSize: '0.78rem', color: T.text3, padding: '8px 0' }}>Loading…</div>
            ) : !showNewForm ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {/* Dropdown-style selector */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedDashId || ''}
                    onChange={e => setSelectedDashId(e.target.value)}
                    style={{
                      width: '100%', background: T.s1, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: '10px 12px', color: T.text,
                      fontFamily: T.fontBody, fontSize: '0.82rem', outline: 'none',
                      cursor: 'pointer', appearance: 'none',
                    }}
                  >
                    {dashboards.map(d => (
                      <option key={d.id} value={d.id} style={{ background: '#0a0f1a', color: T.text }}>
                        {d.icon || '📋'} {d.name} ({d.widget_count} widgets)
                      </option>
                    ))}
                  </select>
                  <span style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.6rem', color: T.text3, pointerEvents: 'none',
                  }}>▼</span>
                </div>

                <button
                  onClick={() => setShowNewForm(true)}
                  style={{
                    padding: '8px 12px', borderRadius: 10,
                    border: `1px dashed ${T.border2}`, background: 'transparent',
                    color: T.text3, cursor: 'pointer', fontSize: '0.74rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; }}
                >
                  <span style={{ fontSize: '0.9rem' }}>+</span> New dashboard
                </button>
              </div>
            ) : (
              <DashboardCreateForm
                value={newName}
                onChange={setNewName}
                onCreate={handleCreate}
                onCancel={() => setShowNewForm(false)}
                creating={creating}
              />
            )}
          </div>

          {/* Size picker - Hide for KPIs */}
          {vizType !== 'kpi' && (
            <div>
              <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>
                Widget Size
              </label>
              <div style={{ display: 'flex', gap: 8, background: T.s1, padding: 4, borderRadius: 12, border: `1px solid ${T.border}` }}>
                {(['half', 'full'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
                      background: size === s ? 'rgba(0,229,255,0.1)' : 'transparent',
                      color: size === s ? T.accent : T.text3,
                      cursor: 'pointer', fontSize: '0.74rem', fontWeight: size === s ? 700 : 400,
                      transition: 'all 0.2s', fontFamily: T.fontBody,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{s === 'half' ? '🌓' : '🌕'}</span>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart info strip */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
            background: 'rgba(0,229,255,0.03)', borderRadius: 12,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.55rem', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</span>
              <span style={{ fontSize: '0.74rem', color: T.text2, fontWeight: 600 }}>{vizType.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.55rem', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Refresh</span>
              <span style={{ fontSize: '0.74rem', color: T.text2, fontWeight: 600 }}>MANUAL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.55rem', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rows</span>
              <span style={{ fontSize: '0.74rem', color: T.text2, fontWeight: 600 }}>{rows.length}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${T.border}`,
          background: 'rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            flex: 1, fontSize: '0.68rem', fontFamily: T.fontMono,
            color: status === 'error' ? T.red : status === 'saved' ? T.green : T.text3,
          }}>
            {status === 'error' ? (errorMsg || error) :
             status === 'saved' ? '✓ Added to dashboard' :
             selectedDash ? `→ ${selectedDash.name}` : 'Select a dashboard'}
          </div>
          <button onClick={onClose} style={{
            padding: '8px 14px', borderRadius: 10,
            border: `1px solid ${T.border}`, background: 'transparent',
            color: T.text2, cursor: 'pointer', fontSize: '0.78rem',
          }}>Cancel</button>
          <button
            onClick={handleAdd}
            disabled={saving || status === 'saved' || !selectedDashId}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none',
              background: status === 'saved'
                ? T.greenDim
                : 'linear-gradient(135deg, rgba(0,229,255,0.95), rgba(0,160,180,0.95))',
              color: status === 'saved' ? T.green : '#00131a',
              cursor: saving || status === 'saved' || !selectedDashId ? 'not-allowed' : 'pointer',
              opacity: saving || !selectedDashId ? 0.55 : 1,
              fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.84rem',
              transition: 'all 0.2s',
            }}
          >
            {status === 'saved' ? '✓ Added' : saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
