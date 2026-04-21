import { useEffect, useMemo, useRef, useState } from 'react';
import { T } from '../dashboard/tokens';
import { addDashboardWidget } from '../../services/api';
import { DashboardCreateForm } from '../dashboard/DashboardCreateForm';
import { useDashboardCatalog } from '../../hooks/useDashboardCatalog';
import { inferViz, autoTitle, layoutDims } from '../../utils/dashboardUtils';
import { ChevronDown, Layout, Plus, X } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div 
        className="antigravity-modal-entry"
        style={{
          width: 440, maxWidth: '95vw',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: `1px solid rgba(255, 255, 255, 0.4)`,
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5)',
          position: 'relative',
        }}
      >
        <style>{`
          @keyframes antigravity-float-in {
            0% { transform: translateY(20px) scale(0.98); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          .antigravity-modal-entry {
            animation: antigravity-float-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .premium-input {
            width: 100%; background: rgba(255, 255, 255, 0.4); border: 1px solid ${T.border};
            border-radius: 12px; padding: 10px 14px; color: ${T.text};
            font-family: ${T.fontBody}; fontSize: 0.88rem; outline: none;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .premium-input:focus {
            background: #fff; border-color: ${T.accent}; box-shadow: 0 0 0 4px ${T.accent}15;
          }
        `}</style>
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
            width: 32, height: 32, borderRadius: 10, background: 'rgba(0,0,0,0.03)',
            border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}>
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>
          {/* Title — editable inline */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 8, display: 'block', opacity: 0.8 }}>
              Widget Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Auto-generated title"
              className="premium-input"
            />
          </div>

          {/* Dashboard picker */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 8, display: 'block', opacity: 0.8 }}>
              Destination Dashboard
            </label>

            {loading ? (
              <div style={{ fontSize: '0.78rem', color: T.text3, padding: '10px 0' }}>⏳ Loading dashboards...</div>
            ) : !showNewForm ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {/* Custom Dropdown */}
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '100%', background: 'rgba(255, 255, 255, 0.4)', border: `1px solid ${isDropdownOpen ? T.accent : T.border}`,
                    borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    boxShadow: isDropdownOpen ? `0 0 0 4px ${T.accent}15` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: T.text2 }}>
                    <Layout size={16} style={{ color: T.accent }} />
                    {selectedDash ? selectedDash.name : 'Select Dashboard...'}
                  </div>
                  <ChevronDown size={16} style={{ color: T.text3, transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
                    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)',
                    border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden',
                    boxShadow: T.shadow.lg, zIndex: 10, padding: 6,
                  }}>
                    {dashboards.map(d => (
                      <div
                        key={d.id}
                        onClick={() => { setSelectedDashId(d.id); setIsDropdownOpen(false); }}
                        style={{
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                          fontSize: '0.88rem', color: T.text2,
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: selectedDashId === d.id ? T.accentDim : 'transparent',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.s2}
                        onMouseLeave={e => e.currentTarget.style.background = selectedDashId === d.id ? T.accentDim : 'transparent'}
                      >
                        <Layout size={14} style={{ opacity: 0.6 }} />
                        {d.name} ({d.widget_count})
                      </div>
                    ))}
                    <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
                    <div
                      onClick={() => { setShowNewForm(true); setIsDropdownOpen(false); }}
                      style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        fontSize: '0.88rem', color: T.accent,
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = `${T.accent}08`}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} />
                      New dashboard
                    </div>
                  </div>
                )}
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
          padding: '16px 24px', borderTop: `1px solid rgba(0,0,0,0.04)`,
          background: 'rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center', gap: 12,
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
            padding: '10px 20px', borderRadius: 14, fontSize: '0.82rem',
            fontFamily: T.fontBody, cursor: 'pointer', fontWeight: 500,
            border: `1px solid ${T.border}`, background: 'transparent', color: T.text3,
            transition: 'all 0.2s',
          }} onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}>
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || status === 'saved' || !selectedDashId}
            style={{
              padding: '10px 24px', borderRadius: 14, border: 'none',
              background: status === 'saved' ? T.green : T.accent,
              color: '#fff',
              cursor: saving || status === 'saved' || !selectedDashId ? 'default' : 'pointer',
              opacity: saving || !selectedDashId ? 0.6 : 1,
              fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.82rem',
              transition: 'all 0.2s',
              boxShadow: status === 'saved' ? 'none' : `0 8px 20px ${T.accent}30`,
            }}
            onMouseEnter={e => { if (!saving && status !== 'saved') e.currentTarget.style.transform = 'translateY(-1px)'; }} 
            onMouseLeave={e => { if (!saving && status !== 'saved') e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {status === 'saved' ? '✓ Added' : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={14} />
                {saving ? 'Adding…' : 'Add to Dashboard'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
