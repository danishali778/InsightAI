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
  const [cadence, setCadence] = useState<string>('Manual only');

  const D = {
    bg: '#060a12',
    surface: '#0f172a',
    surfaceL2: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(0,229,255,0.3)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#0ea5e9',
    accentGlow: 'rgba(14,165,233,0.3)',
  };

  // Reset when opening
  useEffect(() => {
    if (!isOpen) return;
    const initialSize: WidgetSize = vizType === 'kpi' ? 'quarter' : (vizType === 'table' || (vizType === 'bar' && rows.length > 6) ? 'full' : 'half');
    setSize(initialSize);
    setTitle(autoTitle(message));
    setCadence('Manual only');
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

  if (!isOpen) return null;

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
        cadence: cadence,
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
        background: 'rgba(2,4,8,0.82)', backdropFilter: 'blur(12px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontBody, padding: 20
      }}
    >
      <div style={{
        width: 460, maxWidth: '100%',
        background: 'linear-gradient(175deg, #0f172a 0%, #060a12 100%)',
        border: `1px solid ${D.border}`, borderRadius: 24,
        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        overflow: 'hidden', position: 'relative'
      }}>
        {/* Spatial Edge Glow */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.2), transparent)' }} />

        {/* ── Header ── */}
        <div style={{
          padding: '24px 28px 18px', borderBottom: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(124,58,255,0.08))',
            border: '1px solid rgba(0,229,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.1rem', color: D.text, letterSpacing: '-0.01em' }}>
              Add to Dashboard
            </div>
            <div style={{ fontSize: '0.7rem', color: D.textMuted, fontFamily: T.fontMono, marginTop: 3, opacity: 0.8 }}>
              {vizType.toUpperCase()} DATA · {rows.length} ROWS
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10,
            border: `1px solid ${D.border}`, background: 'rgba(255,255,255,0.02)',
            color: D.textMuted, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>
          {/* Title — editable inline */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.textMuted, fontFamily: T.fontMono, marginBottom: 8, display: 'block', opacity: 0.7 }}>
              Widget Title
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Auto-generated title"
                style={{
                  width: '100%', background: D.surfaceL2, border: `1px solid ${D.border}`,
                  borderRadius: 14, padding: '14px 16px', color: D.text,
                  fontFamily: T.fontBody, fontSize: '0.9rem', outline: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = D.accent;
                  e.currentTarget.style.background = 'rgba(0,229,255,0.02)';
                  e.currentTarget.style.boxShadow = `0 0 15px ${D.accentGlow}, inset 0 2px 4px rgba(0,0,0,0.1)`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = D.border;
                  e.currentTarget.style.background = D.surfaceL2;
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
                }}
              />
            </div>
          </div>

          {/* Dashboard picker */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.textMuted, fontFamily: T.fontMono, marginBottom: 8, display: 'block', opacity: 0.7 }}>
              Destination Dashboard
            </label>

            {loading ? (
              <div style={{ fontSize: '0.82rem', color: D.textMuted, padding: '12px 0' }}>Initializing catalog…</div>
            ) : !showNewForm ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedDashId || ''}
                    onChange={e => setSelectedDashId(e.target.value)}
                    style={{
                      width: '100%', background: D.surfaceL2, border: `1px solid ${D.border}`,
                      borderRadius: 14, padding: '14px 16px', color: D.text,
                      fontFamily: T.fontBody, fontSize: '0.9rem', outline: 'none',
                      cursor: 'pointer', appearance: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = D.accent}
                    onBlur={e => e.currentTarget.style.borderColor = D.border}
                  >
                    {dashboards.map(d => (
                      <option key={d.id} value={d.id} style={{ background: '#0a0f1a', color: '#fff' }}>
                        {d.name} ({d.widget_count} widgets)
                      </option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', color: D.textMuted
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={() => setShowNewForm(true)}
                  style={{
                    padding: '12px 16px', borderRadius: 14,
                    border: `1px dashed rgba(0,229,255,0.2)`, background: 'transparent',
                    color: T.accent, cursor: 'pointer', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.2s', fontWeight: 600
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.04)'; e.currentTarget.style.borderColor = D.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>+</span> Create New Dashboard
                </button>
              </div>
            ) : (
              <DashboardCreateForm
                value={newName}
                onChange={setNewName}
                onCreate={async () => {
                  if (!newName.trim()) return;
                  try {
                    const created = await createNewDashboard({ name: newName.trim(), icon: '📊' });
                    setSelectedDashId(created.id);
                    localStorage.setItem('lastUsedDashboardId', created.id);
                    setNewName('');
                    setShowNewForm(false);
                  } catch { /* hook exposes error */ }
                }}
                onCancel={() => setShowNewForm(false)}
                creating={creating}
                compact
              />
            )}
          </div>

          {/* Configuration Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: vizType === 'kpi' ? '1fr' : '1fr 1fr', gap: 16 }}>
            {/* Size picker - Hide for KPIs */}
            {vizType !== 'kpi' && (
              <div>
                <label style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.textMuted, fontFamily: T.fontMono, marginBottom: 8, display: 'block', opacity: 0.7 }}>
                  Frame Size
                </label>
                <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 14, border: `1px solid ${D.border}` }}>
                  {(['half', 'full'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                        background: size === s ? T.accent : 'transparent',
                        color: size === s ? '#000' : D.textMuted,
                        cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: T.fontHead,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: size === s ? `0 4px 12px ${D.accentGlow}` : 'none'
                      }}
                    >
                      {s === 'half' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v16z"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                      )}
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cadence picker */}
            <div>
              <label style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.textMuted, fontFamily: T.fontMono, marginBottom: 8, display: 'block', opacity: 0.7 }}>
                Sync
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={cadence}
                  onChange={e => setCadence(e.target.value)}
                  style={{
                    width: '100%', background: D.surfaceL2, border: `1px solid ${D.border}`,
                    borderRadius: 14, padding: '10px 14px', color: D.text,
                    fontFamily: T.fontBody, fontSize: '0.82rem', outline: 'none',
                    cursor: 'pointer', appearance: 'none', transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = D.accent}
                  onBlur={e => e.currentTarget.style.borderColor = D.border}
                >
                  <option value="Manual only" style={{ background: '#0a0f1a' }}>Manual</option>
                  <option value="Hourly" style={{ background: '#0a0f1a' }}>Hourly ⚡</option>
                  <option value="Daily" style={{ background: '#0a0f1a' }}>Daily 🗓️</option>
                </select>
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: D.textMuted }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '20px 28px', borderTop: `1px solid ${D.border}`,
          background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            flex: 1, fontSize: '0.7rem', fontFamily: T.fontMono, fontWeight: 500,
            color: status === 'error' ? T.red : status === 'saved' ? T.green : D.textMuted,
          }}>
            {status === 'error' ? (errorMsg || error) :
             status === 'saved' ? '✓ Deployment complete' :
             selectedDash ? `DEPLOYING TO: ${selectedDash.name.toUpperCase()}` : 'Select target dashboard'}
          </div>
          <button onClick={onClose} style={{
            padding: '10px 18px', borderRadius: 14,
            border: `1px solid ${D.border}`, background: 'transparent',
            color: D.text, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600,
            fontFamily: T.fontHead, transition: 'all 0.2s'
          }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
             onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = D.border; }}>Cancel</button>
          <button
            onClick={handleAdd}
            disabled={saving || status === 'saved' || !selectedDashId}
            style={{
              padding: '10px 24px', borderRadius: 14, border: 'none',
              background: status === 'saved'
                ? T.greenDim
                : T.accent,
              color: status === 'saved' ? T.green : '#000',
              cursor: saving || status === 'saved' || !selectedDashId ? 'not-allowed' : 'pointer',
              opacity: saving || !selectedDashId ? 0.3 : 1,
              fontFamily: T.fontHead, fontWeight: 800, fontSize: '0.88rem',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: saving || status === 'saved' || !selectedDashId ? 'none' : `0 8px 24px ${D.accentGlow}`
            }}
            onMouseEnter={e => { if (!saving && !status.includes('saved')) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {status === 'saved' ? 'COMPLETE' : saving ? 'PROCESS…' : 'ADD TO VIEW'}
          </button>
        </div>
      </div>
    </div>
  );
}
