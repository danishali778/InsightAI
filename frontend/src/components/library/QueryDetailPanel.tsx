import { useState } from 'react';
import { T } from '../dashboard/tokens';
import type { QueryData } from './QueryCard';
import { deleteSavedQuery, runSavedQuery } from '../../services/api';

export function QueryDetailPanel({ query, onClose, onDelete, onRefresh }: { query: QueryData | null, onClose: () => void, onDelete?: (id: string) => void, onRefresh?: () => void }) {
  const [activeTab, setActiveTab] = useState<'info'|'sql'|'history'|'schedule'|'share'>('info');
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);

  if (!query) return null;

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const result = await runSavedQuery(query.id);
      setRunResult(result);
      onRefresh?.();
    } catch (err: any) {
      setRunResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this query?')) {
      onDelete?.(query.id);
    }
  };

  const timeAgo = (ts: string | null): string => {
    if (!ts) return 'Never';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDate = (ts: string): string => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    revenue: { bg: T.accentDim, color: T.accent, border: 'rgba(0,229,255,0.2)' },
    churn: { bg: T.purpleDim, color: T.purple, border: 'rgba(124,58,255,0.2)' },
    users: { bg: T.greenDim, color: T.green, border: 'rgba(34,211,165,0.2)' },
    daily: { bg: T.yellowDim, color: T.yellow, border: 'rgba(245,158,11,0.2)' },
    critical: { bg: T.redDim, color: T.red, border: 'rgba(248,113,113,0.2)' },
  };
  const DEFAULT_TAG = { bg: 'transparent', color: T.text3, border: T.border };

  return (
    <div style={{
      width: 340, flexShrink: 0, background: T.s1, borderLeft: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: T.fontBody
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '0.95rem', color: T.text, lineHeight: 1.3 }}>{query.title}</div>
          <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono, marginTop: 4 }}>{query.folder_name}{query.connection_id ? ` · ${query.connection_id}` : ''}</div>
        </div>
        <button onClick={onClose} style={{
          width: 24, height: 24, borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3,
          fontSize: '0.75rem', flexShrink: 0, transition: 'all 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}
        >✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.s2 }}>
        {['info','sql','history','schedule','share'].map((t) => (
          <div key={t} onClick={() => setActiveTab(t as any)} style={{
            flex: 1, padding: '9px 6px', textAlign: 'center', fontSize: '0.72rem', fontFamily: T.fontMono,
            color: activeTab === t ? T.accent : T.text3, cursor: 'pointer', borderBottom: `2px solid ${activeTab === t ? T.accent : 'transparent'}`,
            transition: 'all 0.15s', textTransform: 'capitalize'
          }}
            onMouseEnter={e => { if(activeTab !== t) e.currentTarget.style.color = T.text2; }}
            onMouseLeave={e => { if(activeTab !== t) e.currentTarget.style.color = T.text3; }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }} className="custom-scroll">
        
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>Details</span>
              <InfoRow label="Created" value={formatDate(query.created_at)} />
              <InfoRow label="Last Run" value={timeAgo(query.last_run_at)} color={query.last_run_at ? T.green : undefined} />
              <InfoRow label="Total Runs" value={`${query.run_count} times`} />
              <InfoRow label="Folder" value={query.folder_name} />
              <InfoRow label="Connection" value={query.connection_id || 'None'} color={query.connection_id ? T.accent : undefined} />
            </div>

            {query.description && (
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>Description</span>
                <div style={{ fontSize: '0.78rem', color: T.text2, lineHeight: 1.6, background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  {query.description}
                </div>
              </div>
            )}

            {query.tags.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>Tags</span>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {query.tags.map(t => {
                    const colors = TAG_COLORS[t] || DEFAULT_TAG;
                    return (
                      <span key={t} style={{ padding: '1px 7px', borderRadius: 10, fontSize: '0.62rem', fontFamily: T.fontMono, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.color }}>{t}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Run Result */}
            {runResult && (
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>Last Run Result</span>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: runResult.success ? T.greenDim : T.redDim, border: `1px solid ${runResult.success ? 'rgba(34,211,165,0.2)' : 'rgba(248,113,113,0.2)'}`, color: runResult.success ? T.green : T.red, fontSize: '0.78rem' }}>
                  {runResult.success ? `✅ ${runResult.row_count} rows returned in ${runResult.execution_time_ms}ms` : `❌ ${runResult.error}`}
                </div>
              </div>
            )}
          </>
        )}

        {/* SQL TAB */}
        {activeTab === 'sql' && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono }}>Current SQL</span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => navigator.clipboard.writeText(query.sql)} style={miniBtnStyle}>Copy</button>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, borderRadius: 9, padding: '12px 14px', fontFamily: T.fontMono, fontSize: '0.72rem', lineHeight: 1.8, color: '#a0b0cc', maxHeight: 300, overflowY: 'auto', whiteSpace: 'pre-wrap' }} className="custom-scroll">
              {query.sql}
            </div>
          </div>
        )}

        {/* HISTORY TAB (still static) */}
        {activeTab === 'history' && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: T.text3, fontSize: '0.78rem' }}>
            Version history coming soon
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>Schedule Settings</span>
              <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ fontSize: '0.74rem', color: T.text2 }}>Schedule enabled</span>
                  <div onClick={() => setScheduleEnabled(!scheduleEnabled)} style={{ width: 32, height: 18, borderRadius: 20, background: scheduleEnabled ? T.accent : T.s4, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#000', top: 3, right: scheduleEnabled ? 3 : 17, transition: 'right 0.2s' }} />
                  </div>
                </div>
                {query.schedule ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                    <span style={{ fontSize: '0.74rem', color: T.text2 }}>Schedule</span>
                    <span style={{ fontSize: '0.72rem', fontFamily: T.fontMono, color: T.accent }}>{query.schedule}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.74rem', color: T.text3, padding: '5px 0' }}>No schedule configured</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* SHARE TAB (still static) */}
        {activeTab === 'share' && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: T.text3, fontSize: '0.78rem' }}>
            Sharing coming soon
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
        <PanelBtn label={running ? '⏳  Running...' : '▶  Run Query'} type="accent" onClick={handleRun} disabled={running} />
        <PanelBtn label="📋  Duplicate Query" type="ghost" />
        <PanelBtn label="🗑  Delete Query" type="danger" onClick={handleDelete} />
      </div>

    </div>
  );
}

// Helpers
function InfoRow({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono, width: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.76rem', color: color || T.text2, flex: 1 }}>{value}</span>
    </div>
  );
}

const miniBtnStyle: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent',
  color: T.text3, fontSize: '0.65rem', cursor: 'pointer', fontFamily: T.fontMono,
};

function PanelBtn({ label, type, onClick, disabled }: { label: string, type: 'accent'|'ghost'|'danger', onClick?: () => void, disabled?: boolean }) {
  const getStyle = (): React.CSSProperties => {
    if (type === 'accent') return { background: `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))`, border: '1px solid rgba(0,229,255,0.25)', color: T.accent };
    if (type === 'danger') return { background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', color: T.red };
    return { background: 'transparent', border: `1px solid ${T.border}`, color: T.text2 };
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '9px 14px', borderRadius: 8, fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.fontBody, display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, ...getStyle() }}
      onMouseEnter={e => {
        if (disabled) return;
        if (type === 'accent') e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,229,255,0.22), rgba(124,58,255,0.16))`;
        if (type === 'ghost') { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = T.s2; }
        if (type === 'danger') e.currentTarget.style.background = T.redDim;
      }}
      onMouseLeave={e => {
        if (disabled) return;
        if (type === 'accent') e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))`;
        if (type === 'ghost') { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }
        if (type === 'danger') e.currentTarget.style.background = 'transparent';
      }}
    >
      {label}
    </button>
  );
}
