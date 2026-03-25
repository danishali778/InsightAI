import { useState, useEffect } from 'react';
import { T } from '../dashboard/tokens';
import { addDashboardWidget, listDashboards, createDashboard } from '../../services/api';

interface AddToDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    title?: string;
    dbName?: string;
    rowCount?: number;
    sql?: string;
    columns?: string[];
    rows?: Record<string, unknown>[];
    connectionId?: string;
    chart_recommendation?: { type: string; x_column: string; y_columns: string[]; title: string; x_label: string; y_label: string };
  };
}

interface DashData { id: string; name: string; icon: string; widget_count: number; created_at: string }

export function AddToDashboardModal({ isOpen, onClose, message }: AddToDashboardModalProps) {
  const [dashboards, setDashboards] = useState<DashData[]>([]);
  const [selectedDashId, setSelectedDashId] = useState<string | null>(null);
  const [showNewDashForm, setShowNewDashForm] = useState(false);
  const [newDashName, setNewDashName] = useState('');

  const recType = message.chart_recommendation?.type;
  const defaultViz = recType === 'bar' ? 'bar' : recType === 'line' || recType === 'area' ? 'line' : recType === 'pie' ? 'donut' : recType === 'scatter' ? 'line' : 'table';

  const [selectedViz, setSelectedViz] = useState<'bar' | 'line' | 'donut' | 'table'>(defaultViz as any);
  const [selectedSize, setSelectedSize] = useState<'half' | 'full'>('half');
  const [selectedCadence, setSelectedCadence] = useState('Manual only');
  const [title, setTitle] = useState(message.title || 'Untitled Widget');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingDash, setLoadingDash] = useState(true);

  // Fetch dashboards on open
  useEffect(() => {
    if (!isOpen) return;
    setLoadingDash(true);
    listDashboards().then(d => {
      setDashboards(d);
      if (d.length > 0 && !selectedDashId) setSelectedDashId(d[0].id);
      setLoadingDash(false);
    }).catch(() => setLoadingDash(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateDash = async () => {
    if (!newDashName.trim()) return;
    try {
      const newDash = await createDashboard({ name: newDashName.trim(), icon: '✨' });
      const updated = await listDashboards();
      setDashboards(updated);
      setSelectedDashId(newDash.id);
      setNewDashName('');
      setShowNewDashForm(false);
    } catch {
      // ignore
    }
  };

  const handleAddWidget = async () => {
    if (!selectedDashId) return;
    setSaving(true);
    try {
      await addDashboardWidget({
        dashboard_id: selectedDashId,
        title,
        viz_type: selectedViz,
        size: selectedSize,
        connection_id: message.connectionId,
        columns: message.columns || [],
        rows: (message.rows || []) as Record<string, any>[],
        chart_config: message.chart_recommendation ? {
          x_column: message.chart_recommendation.x_column,
          y_columns: message.chart_recommendation.y_columns,
          title: message.chart_recommendation.title,
          x_label: message.chart_recommendation.x_label,
          y_label: message.chart_recommendation.y_label,
        } : undefined,
        cadence: selectedCadence,
      });
      setSaved(true);
      setTimeout(() => { onClose(); setSaved(false); }, 1200);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const cadences = ['Manual only', 'Every hour', 'Every 6h', 'Daily 9am', 'Weekly'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.75)', backdropFilter: 'blur(6px)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease', fontFamily: T.fontBody
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width: 520, maxHeight: '90vh', background: T.s2, border: `1px solid ${T.border2}`,
        borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,255,0.06)',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)'
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.12))',
            border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
          }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>Add to Dashboard</div>
            <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>
              {title} · {message.dbName || 'db'} · {message.rowCount || 0} rows
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.8rem',
            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = T.s3; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}
          >✕</button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* SQL preview */}
          {message.sql && (
            <div style={{
              margin: '14px 22px 0', padding: '10px 13px', background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${T.border}`, borderRadius: 9, fontFamily: T.fontMono,
              fontSize: '0.68rem', lineHeight: 1.7, color: '#4a6080', position: 'relative', overflow: 'hidden'
            }}>
              <span style={{
                position: 'absolute', top: 8, right: 10, fontSize: '0.55rem', color: T.text3, letterSpacing: 1,
                background: T.s3, padding: '1px 6px', borderRadius: 4, border: `1px solid ${T.border}`
              }}>SQL</span>
              <div style={{ maxHeight: 60, overflow: 'hidden', whiteSpace: 'pre-wrap', color: '#6b8aab' }}>
                {message.sql.substring(0, 200)}
              </div>
            </div>
          )}

          <div style={{ padding: '16px 22px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 1. Dashboard Picker (dynamic from API) */}
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 7, display: 'block' }}>Select Dashboard</span>
              {loadingDash ? (
                <div style={{ fontSize: '0.78rem', color: T.text3, padding: '10px 0' }}>Loading dashboards...</div>
              ) : dashboards.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: T.text3, padding: '10px 0' }}>No dashboards yet — create one below</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dashboards.map(d => {
                    const isSelected = selectedDashId === d.id;
                    return (
                      <div key={d.id} onClick={() => setSelectedDashId(d.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px',
                        borderRadius: 10, border: `2px solid ${isSelected ? T.accent : T.border}`,
                        background: isSelected ? T.accentDim : 'rgba(255,255,255,0.015)',
                        boxShadow: isSelected ? '0 0 0 1px rgba(0,229,255,0.1)' : 'none',
                        cursor: 'pointer', transition: 'all 0.18s',
                      }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSelected ? T.accent : T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, transform: isSelected ? 'scale(1)' : 'scale(0)', transition: 'transform 0.18s' }} />
                        </div>
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{d.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? T.text : T.text2, marginBottom: 1 }}>{d.name}</div>
                          <div style={{ fontSize: '0.64rem', color: T.text3, fontFamily: T.fontMono }}>
                            Created {new Date(d.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.64rem', fontFamily: T.fontMono, color: T.text3, background: T.s3, padding: '1px 7px', borderRadius: 8, flexShrink: 0 }}>{d.widget_count} widgets</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Dashboard toggler */}
              <button onClick={() => setShowNewDashForm(p => !p)} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 10,
                border: `1px dashed ${T.border2}`, background: 'transparent', cursor: 'pointer',
                transition: 'all 0.18s', width: '100%', fontFamily: T.fontBody, marginTop: 7, color: T.text3,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.background = T.accentDim; e.currentTarget.style.color = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span style={{ fontSize: '0.8rem' }}>Create new dashboard</span>
              </button>

              {showNewDashForm && (
                <div style={{ display: 'flex', padding: '10px 13px', background: T.s3, border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, gap: 8, alignItems: 'center', marginTop: 7 }}>
                  <input autoFocus value={newDashName} onChange={e => setNewDashName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateDash()}
                    placeholder="e.g. Executive Summary" style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontFamily: T.fontBody, fontSize: '0.82rem', outline: 'none' }}
                  />
                  <button onClick={handleCreateDash} disabled={!newDashName.trim()} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: T.accent, color: '#000', fontFamily: T.fontBody, fontSize: '0.74rem', fontWeight: 600, cursor: newDashName.trim() ? 'pointer' : 'not-allowed', opacity: newDashName.trim() ? 1 : 0.5 }}>Create</button>
                </div>
              )}
            </div>

            {/* 2. Widget Title */}
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 7, display: 'block' }}>Widget Title</span>
              <input value={title} onChange={e => setTitle(e.target.value)} style={{
                width: '100%', background: T.s3, border: `1px solid ${T.border}`, borderRadius: 9,
                padding: '9px 13px', color: T.text, fontFamily: T.fontBody, fontSize: '0.83rem', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.06)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* 3. Viz Type */}
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 7, display: 'block' }}>Visualization Type</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { id: 'bar', label: 'Bar', comp: (sel: boolean) => (<div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 36, marginBottom: 7 }}><div style={{ width: 8, height: '55%', background: T.accent, opacity: sel ? 1 : 0.5, borderRadius: '2px 2px 0 0' }} /><div style={{ width: 8, height: '80%', background: T.accent, opacity: sel ? 1 : 0.5, borderRadius: '2px 2px 0 0' }} /><div style={{ width: 8, height: '40%', background: T.accent, opacity: sel ? 1 : 0.5, borderRadius: '2px 2px 0 0' }} /><div style={{ width: 8, height: '65%', background: T.accent, opacity: sel ? 1 : 0.5, borderRadius: '2px 2px 0 0' }} /></div>) },
                  { id: 'line', label: 'Line', comp: (sel: boolean) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, marginBottom: 7 }}><svg width="44" height="28" viewBox="0 0 44 28"><polyline points="2,22 10,14 20,18 30,8 42,6" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={sel ? 1 : 0.5} /></svg></div>) },
                  { id: 'donut', label: 'Donut', comp: (sel: boolean) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, marginBottom: 7 }}><svg width="32" height="32" viewBox="0 0 36 36"><circle cx="18" cy="18" r="13" fill="none" stroke={T.s4} strokeWidth="7" /><circle cx="18" cy="18" r="13" fill="none" stroke={T.accent} strokeWidth="7" strokeDasharray="33 49" strokeDashoffset="25" opacity={sel ? 0.9 : 0.5} /><circle cx="18" cy="18" r="13" fill="none" stroke={T.purple} strokeWidth="7" strokeDasharray="22 60" strokeDashoffset="-8" opacity={sel ? 1 : 0.5} /><circle cx="18" cy="18" r="13" fill="none" stroke={T.green} strokeWidth="7" strokeDasharray="15 67" strokeDashoffset="-30" opacity={sel ? 0.8 : 0.4} /></svg></div>) },
                  { id: 'table', label: 'Table', comp: (sel: boolean) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, marginBottom: 7 }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 44 }}><div style={{ height: 5, borderRadius: 1, background: T.accent, opacity: sel ? 1 : 0.6 }} /><div style={{ height: 5, borderRadius: 1, background: T.text3, opacity: sel ? 0.7 : 0.4 }} /><div style={{ height: 5, borderRadius: 1, background: T.text3, opacity: sel ? 0.7 : 0.4 }} /><div style={{ height: 5, borderRadius: 1, background: T.text3, opacity: sel ? 0.7 : 0.4 }} /></div></div>) },
                ].map(v => {
                  const isSelected = selectedViz === v.id;
                  const isRec = v.id === defaultViz && defaultViz !== 'table';
                  return (
                    <div key={v.id} onClick={() => setSelectedViz(v.id as any)} style={{
                      padding: '12px 8px', borderRadius: 10, border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accentDim : 'rgba(255,255,255,0.015)', cursor: 'pointer',
                      textAlign: 'center', transition: 'all 0.18s', position: 'relative',
                      boxShadow: isSelected ? '0 0 0 1px rgba(0,229,255,0.1)' : 'none',
                    }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; e.currentTarget.style.background = T.accentDim; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.transform = 'none'; } }}
                    >
                      {isRec && <div style={{ fontSize: '0.55rem', fontFamily: T.fontMono, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: '#000', padding: '1px 6px', borderRadius: 10, display: isSelected ? 'inline-block' : 'none', marginBottom: 4, fontWeight: 700, position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)' }}>Recommended</div>}
                      {v.comp(isSelected)}
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isSelected ? T.accent : T.text3, fontFamily: T.fontMono }}>{v.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Widget Size */}
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 7, display: 'block' }}>Widget Size</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'half', label: 'Half Width', width: '50%' },
                  { id: 'full', label: 'Full Width', width: '100%' }
                ].map(s => {
                  const isSelected = selectedSize === s.id;
                  return (
                    <div key={s.id} onClick={() => setSelectedSize(s.id as any)} style={{
                      flex: 1, padding: '10px 10px 8px', borderRadius: 9, border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accentDim : 'rgba(255,255,255,0.015)', cursor: 'pointer',
                      transition: 'all 0.18s', textAlign: 'center'
                    }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; e.currentTarget.style.background = T.accentDim; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; } }}
                    >
                      <div style={{ height: 24, borderRadius: 5, background: T.s4, marginBottom: 6, border: `1px solid ${T.border}`, width: s.width, margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.68rem', fontFamily: T.fontMono, color: isSelected ? T.accent : T.text3 }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Refresh Cadence */}
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 7, display: 'block' }}>Auto-refresh</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cadences.map(c => {
                  const isSelected = selectedCadence === c;
                  return (
                    <span key={c} onClick={() => setSelectedCadence(c)} style={{
                      padding: '5px 13px', borderRadius: 20, border: `1px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accentDim : 'transparent', color: isSelected ? T.accent : T.text3,
                      fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontMono,
                    }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; e.currentTarget.style.color = T.text2; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; } }}
                    >{c}</span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '13px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono, flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {saved ? '✅ Widget added to dashboard!' : `${(message.columns || []).length} columns · ${(message.rows || []).length} rows`}
          </div>
          <button onClick={onClose} style={{
            padding: '10px 16px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent',
            color: T.text2, fontFamily: T.fontBody, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = T.s3; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
          >Cancel</button>
          <button onClick={handleAddWidget} disabled={saving || saved || !selectedDashId} style={{
            padding: '10px 26px', borderRadius: 9, border: 'none', background: saved ? T.greenDim : `linear-gradient(135deg, ${T.accent}, #008fa3)`,
            color: saved ? T.green : '#000', fontFamily: T.fontHead, fontSize: '0.88rem', fontWeight: 700,
            cursor: saving || saved || !selectedDashId ? 'default' : 'pointer', opacity: saving || !selectedDashId ? 0.5 : 1,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7,
          }}
            onMouseEnter={e => { if (!saving && !saved && selectedDashId) { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,255,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            {saved ? '✅ Added!' : saving ? '⏳ Adding...' : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Widget
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
