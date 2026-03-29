import { useState, useEffect } from 'react';
import { T } from '../dashboard/tokens';
import { runSavedQuery, getQueryRunHistory, setQuerySchedule, removeQuerySchedule, updateSavedQuery, listLibraryFolders } from '../../services/api';
import { highlightSqlInline, extractTablesFromSql } from '../../utils/sqlHighlight';
import type { LibraryQuery, LibraryRunResult } from '../../types/library';
import type { FolderSummary, QueryRunHistoryRecord, ScheduleConfig } from '../../types/api';

const DAYS_OF_WEEK = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const COMMON_TIMEZONES = [
  'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'Europe/London','Europe/Berlin','Asia/Karachi','Asia/Kolkata','Asia/Tokyo','Australia/Sydney',
];

function defaultSchedule(): ScheduleConfig {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { enabled: true, frequency: 'weekly', day_of_week: 'monday', day_of_month: null, hour: 9, minute: 0, timezone: COMMON_TIMEZONES.includes(tz) ? tz : 'UTC', next_run_at: null };
}

export function QueryDetailPanel({ query, onClose, onDelete, onRefresh, initialTab }: { query: LibraryQuery | null, onClose: () => void, onDelete?: (id: string) => void, onRefresh?: () => void, initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<'info'|'sql'|'history'|'schedule'|'share'>('info');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<LibraryRunResult | null>(null);
  const [runHistory, setRunHistory] = useState<QueryRunHistoryRecord[]>([]);
  const [schedDraft, setSchedDraft] = useState<ScheduleConfig>(defaultSchedule());
  const [schedSaving, setSchedSaving] = useState(false);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [folderDraft, setFolderDraft] = useState('');
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);

  useEffect(() => {
    if (!query) return;
    getQueryRunHistory(query.id).then(setRunHistory).catch(() => setRunHistory([]));
  }, [query?.id, query?.run_count]);

  useEffect(() => {
    if (!query) return;
    setSchedDraft(query.schedule ?? defaultSchedule());
  }, [query?.id]);

  useEffect(() => {
    if (!query) return;
    setFolderDraft(query.folder_name);
    setNewFolderMode(false);
    setNewFolderName('');
    listLibraryFolders().then(setFolders).catch(() => {});
  }, [query?.id]);

  useEffect(() => {
    if (initialTab && ['info','sql','history','schedule','share'].includes(initialTab)) {
      setActiveTab(initialTab as typeof activeTab);
    }
  }, [initialTab, query?.id]);

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

  const handleFolderSave = async () => {
    const name = newFolderMode ? newFolderName.trim() : folderDraft;
    if (!name || name === query.folder_name) { setNewFolderMode(false); return; }
    setFolderSaving(true);
    try {
      await updateSavedQuery(query.id, { folder_name: name });
      setNewFolderMode(false);
      onRefresh?.();
    } catch {
      // silently handle
    } finally {
      setFolderSaving(false);
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
  const tables = extractTablesFromSql(query.sql);

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
        {(['info','sql','history','schedule','share'] as const).map((t) => (
          <div key={t} onClick={() => setActiveTab(t)} style={{
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
            <Section label="Details">
              <InfoRow label="Created" value={formatDate(query.created_at)} />
              <InfoRow label="Last Run" value={timeAgo(query.last_run_at)} color={query.last_run_at ? T.green : undefined} />
              <InfoRow label="Total Runs" value={`${query.run_count} times`} />
              <InfoRow label="Avg Runtime" value={runHistory.length > 0 ? `${(runHistory.reduce((s, r) => s + r.execution_time_ms, 0) / runHistory.length).toFixed(0)}ms` : '—'} />
              <InfoRow label="Last Rows" value={runHistory.length > 0 ? `${runHistory[0].row_count} rows returned` : '—'} />
              <InfoRow label="Database" value={query.connection_id || 'None'} color={query.connection_id ? T.accent : undefined} />
              {tables.length > 0 && <InfoRow label="Tables Used" value={tables.join(', ')} />}

              {/* Editable folder row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono, minWidth: 80, paddingTop: 2 }}>Folder</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  {!newFolderMode ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select
                        value={folderDraft}
                        onChange={e => {
                          if (e.target.value === '__new__') { setNewFolderMode(true); }
                          else { setFolderDraft(e.target.value); }
                        }}
                        style={{
                          background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6,
                          padding: '3px 8px', color: T.text2, fontSize: '0.72rem',
                          fontFamily: T.fontMono, outline: 'none', cursor: 'pointer',
                        }}
                      >
                        <option value="Uncategorized">Uncategorized</option>
                        {folders.filter(f => f.name !== 'Uncategorized' && f.name !== 'Public Library').map(f => (
                          <option key={f.name} value={f.name}>{f.name}</option>
                        ))}
                        <option disabled>──────────</option>
                        <option value="__new__">＋ New folder…</option>
                      </select>
                      {folderDraft !== query.folder_name && (
                        <button onClick={handleFolderSave} disabled={folderSaving} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem', fontFamily: T.fontMono,
                          cursor: 'pointer', border: `1px solid rgba(0,229,255,0.3)`,
                          background: T.accentDim, color: T.accent,
                        }}>{folderSaving ? '…' : 'Move'}</button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        onKeyDown={e => { if (e.key === 'Enter') handleFolderSave(); if (e.key === 'Escape') setNewFolderMode(false); }}
                        style={{
                          background: T.s2, border: `1px solid rgba(0,229,255,0.3)`, borderRadius: 6,
                          padding: '3px 8px', color: T.text, fontSize: '0.72rem',
                          fontFamily: T.fontMono, outline: 'none', width: 120,
                        }}
                      />
                      <button onClick={handleFolderSave} disabled={folderSaving} style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem', fontFamily: T.fontMono,
                        cursor: 'pointer', border: `1px solid rgba(0,229,255,0.3)`,
                        background: T.accentDim, color: T.accent,
                      }}>{folderSaving ? '…' : 'Create'}</button>
                      <button onClick={() => setNewFolderMode(false)} style={{
                        padding: '3px 6px', borderRadius: 6, fontSize: '0.65rem', fontFamily: T.fontMono,
                        cursor: 'pointer', border: `1px solid ${T.border}`,
                        background: 'transparent', color: T.text3,
                      }}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {query.description && (
              <Section label="Description">
                <div style={{ fontSize: '0.78rem', color: T.text2, lineHeight: 1.6, background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  {query.description}
                </div>
              </Section>
            )}

            {/* Run Frequency Chart — STATIC */}
            <Section label="Run Frequency (last 30 days)">
              <div style={{ height: 50, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%' }}>
                  {[30,50,40,70,55,80,60,90,75,100,85,70,95,80].map((h, i) => (
                    <div key={i} style={{
                      display: 'inline-block', width: 8, borderRadius: '2px 2px 0 0',
                      background: T.accent, opacity: h === 100 ? 1 : 0.5, height: `${h}%`,
                      transition: 'opacity 0.15s', cursor: 'pointer', verticalAlign: 'bottom',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { if (h !== 100) e.currentTarget.style.opacity = '0.5'; }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono }}>
                {query.run_count} total runs · avg {Math.max(0.1, query.run_count / 30).toFixed(1)}/day
              </div>
            </Section>

            {/* Tags */}
            {query.tags.length > 0 && (
              <Section label="Tags">
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {query.tags.map(t => {
                    const colors = TAG_COLORS[t] || DEFAULT_TAG;
                    return (
                      <span key={t} style={{ padding: '1px 7px', borderRadius: 10, fontSize: '0.62rem', fontFamily: T.fontMono, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.color }}>
                        {t}
                      </span>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Run Result */}
            {runResult && (
              <Section label="Last Run Result">
                <div style={{ padding: '10px 12px', borderRadius: 8, background: runResult.success ? T.greenDim : T.redDim, border: `1px solid ${runResult.success ? 'rgba(34,211,165,0.2)' : 'rgba(248,113,113,0.2)'}`, color: runResult.success ? T.green : T.red, fontSize: '0.78rem' }}>
                  {runResult.success ? `${runResult.row_count} rows returned in ${runResult.execution_time_ms}ms` : runResult.error}
                </div>
              </Section>
            )}
          </>
        )}

        {/* SQL TAB */}
        {activeTab === 'sql' && (
          <Section label="">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono }}>Current SQL</span>
              <button onClick={() => navigator.clipboard.writeText(query.sql)} style={miniBtnStyle}>Copy</button>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, borderRadius: 9,
              padding: '12px 14px', fontFamily: T.fontMono, fontSize: '0.72rem', lineHeight: 1.8,
              maxHeight: 200, overflowY: 'auto',
            }} className="custom-scroll">
              {highlightSqlInline(query.sql, 'panel')}
            </div>
          </Section>
        )}

        {/* HISTORY TAB — Run History */}
        {activeTab === 'history' && (
          <Section label="Run History">
            {runHistory.length > 0 ? (
              runHistory.map((run, i, arr) => (
                <div key={run.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: run.success ? T.green : T.red,
                      border: `2px solid ${run.success ? T.green : T.red}`,
                    }} />
                    {i < arr.length - 1 && <div style={{ width: 2, background: T.border, flex: 1, minHeight: 30, margin: '2px 3px 0' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.76rem', color: T.text2, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {run.success ? `${run.row_count} rows returned` : 'Failed'}
                      {i === 0 && (
                        <span style={{ fontSize: '0.6rem', fontFamily: T.fontMono, padding: '1px 6px', borderRadius: 4, background: T.accentDim, color: T.accent, border: '1px solid rgba(0,229,255,0.2)' }}>latest</span>
                      )}
                      {run.triggered_by === 'schedule' && (
                        <span style={{ fontSize: '0.6rem', fontFamily: T.fontMono, padding: '1px 6px', borderRadius: 4, background: T.yellowDim, color: T.yellow, border: '1px solid rgba(245,158,11,0.2)' }}>scheduled</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono }}>
                      {run.execution_time_ms.toFixed(0)}ms · {timeAgo(run.ran_at)}
                      {run.error && <span style={{ color: T.red }}> · {run.error}</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: T.text3 }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: '0.78rem', color: T.text2, marginBottom: 4 }}>No runs yet</div>
                <div style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>Run this query to see execution history here.</div>
              </div>
            )}
          </Section>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <>
            <Section label="Schedule Settings">
              <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '12px 14px' }}>
                <SettingsRow label="Enabled">
                  <Toggle on={schedDraft.enabled} onToggle={() => setSchedDraft({ ...schedDraft, enabled: !schedDraft.enabled })} />
                </SettingsRow>

                {schedDraft.enabled && (
                  <>
                    {/* Frequency pills */}
                    <SettingsRow label="Frequency">
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['daily','weekly','monthly'] as const).map(f => (
                          <button key={f} onClick={() => setSchedDraft({ ...schedDraft, frequency: f })} style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem', fontFamily: T.fontMono, cursor: 'pointer',
                            border: `1px solid ${schedDraft.frequency === f ? T.accent : T.border}`,
                            background: schedDraft.frequency === f ? T.accentDim : 'transparent',
                            color: schedDraft.frequency === f ? T.accent : T.text3,
                            transition: 'all 0.15s', textTransform: 'capitalize',
                          }}>{f}</button>
                        ))}
                      </div>
                    </SettingsRow>

                    {/* Day of week (weekly) */}
                    {schedDraft.frequency === 'weekly' && (
                      <SettingsRow label="Day">
                        <div style={{ display: 'flex', gap: 3 }}>
                          {DAYS_OF_WEEK.map((d, i) => (
                            <button key={d} onClick={() => setSchedDraft({ ...schedDraft, day_of_week: d })} style={{
                              width: 28, height: 24, borderRadius: 5, fontSize: '0.62rem', fontFamily: T.fontMono, cursor: 'pointer',
                              border: `1px solid ${schedDraft.day_of_week === d ? T.accent : T.border}`,
                              background: schedDraft.day_of_week === d ? T.accentDim : 'transparent',
                              color: schedDraft.day_of_week === d ? T.accent : T.text3,
                              transition: 'all 0.15s',
                            }}>{DAY_LABELS[i]}</button>
                          ))}
                        </div>
                      </SettingsRow>
                    )}

                    {/* Day of month (monthly) */}
                    {schedDraft.frequency === 'monthly' && (
                      <SettingsRow label="Day of month">
                        <input type="number" min={1} max={28} value={schedDraft.day_of_month ?? 1}
                          onChange={e => setSchedDraft({ ...schedDraft, day_of_month: Math.min(28, Math.max(1, Number(e.target.value))) })}
                          style={{ width: 50, padding: '3px 6px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.s1, color: T.text, fontSize: '0.72rem', fontFamily: T.fontMono, outline: 'none' }}
                        />
                      </SettingsRow>
                    )}

                    {/* Time */}
                    <SettingsRow label="Time">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number" min={1} max={12}
                          value={schedDraft.hour % 12 || 12}
                          onChange={e => {
                            const h12 = Math.min(12, Math.max(1, Number(e.target.value)));
                            const isPm = schedDraft.hour >= 12;
                            setSchedDraft({ ...schedDraft, hour: isPm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12) });
                          }}
                          style={{ ...selectStyle, width: 44, textAlign: 'center' }}
                        />
                        <span style={{ color: T.text3, fontSize: '0.72rem' }}>:</span>
                        <input
                          type="number" min={0} max={59}
                          value={String(schedDraft.minute).padStart(2, '0')}
                          onChange={e => {
                            const m = Math.min(59, Math.max(0, Number(e.target.value)));
                            setSchedDraft({ ...schedDraft, minute: m });
                          }}
                          style={{ ...selectStyle, width: 44, textAlign: 'center' }}
                        />
                        <button onClick={() => {
                          const isPm = schedDraft.hour >= 12;
                          setSchedDraft({ ...schedDraft, hour: isPm ? schedDraft.hour - 12 : schedDraft.hour + 12 });
                        }} style={{
                          padding: '3px 8px', borderRadius: 5, fontSize: '0.68rem', fontFamily: T.fontMono, cursor: 'pointer',
                          border: `1px solid ${T.border}`, background: T.accentDim, color: T.accent, transition: 'all 0.15s',
                        }}>{schedDraft.hour >= 12 ? 'PM' : 'AM'}</button>
                      </div>
                    </SettingsRow>

                    {/* Timezone */}
                    <SettingsRow label="Timezone">
                      <select value={schedDraft.timezone} onChange={e => setSchedDraft({ ...schedDraft, timezone: e.target.value })} style={{ ...selectStyle, width: 'auto' }}>
                        {COMMON_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                      </select>
                    </SettingsRow>

                    {/* Next run (read-only, shown if saved) */}
                    {query.schedule?.next_run_at && (
                      <SettingsRow label="Next run">
                        <span style={{ fontSize: '0.72rem', fontFamily: T.fontMono, color: T.green }}>
                          {new Date(query.schedule.next_run_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </SettingsRow>
                    )}
                  </>
                )}
              </div>

              {/* Save / Remove buttons */}
              <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
                <button onClick={async () => {
                  setSchedSaving(true);
                  try {
                    await setQuerySchedule(query.id, schedDraft);
                    onRefresh?.();
                  } catch { /* ignore */ }
                  setSchedSaving(false);
                }} disabled={schedSaving || !query.connection_id} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 7, fontSize: '0.76rem', cursor: schedSaving || !query.connection_id ? 'not-allowed' : 'pointer',
                  background: `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))`,
                  border: '1px solid rgba(0,229,255,0.25)', color: T.accent, fontFamily: T.fontBody,
                  opacity: schedSaving || !query.connection_id ? 0.5 : 1, transition: 'all 0.15s',
                }}>
                  {schedSaving ? 'Saving...' : 'Save Schedule'}
                </button>
                {query.schedule && (
                  <button onClick={async () => {
                    setSchedSaving(true);
                    try {
                      await removeQuerySchedule(query.id);
                      setSchedDraft(defaultSchedule());
                      onRefresh?.();
                    } catch { /* ignore */ }
                    setSchedSaving(false);
                  }} style={{
                    padding: '8px 12px', borderRadius: 7, fontSize: '0.76rem', cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', color: T.red,
                    fontFamily: T.fontBody, transition: 'all 0.15s',
                  }}>Remove</button>
                )}
              </div>
              {!query.connection_id && (
                <div style={{ fontSize: '0.68rem', color: T.yellow, marginTop: 6 }}>Assign a database connection before scheduling.</div>
              )}
            </Section>

            {/* STATIC — Send Results To */}
            <Section label="Send Results To">
              <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '12px 14px' }}>
                <SettingsRow label="Email">
                  <Toggle on={emailEnabled} onToggle={() => setEmailEnabled(!emailEnabled)} />
                </SettingsRow>
                <SettingsRow label="Slack">
                  <Toggle on={slackEnabled} onToggle={() => setSlackEnabled(!slackEnabled)} />
                </SettingsRow>
                <SettingsRow label="Format"><span style={{ fontSize: '0.72rem', fontFamily: T.fontMono, color: T.accent }}>CSV + Chart PNG</span></SettingsRow>
              </div>
            </Section>
          </>
        )}

        {/* SHARE TAB — STATIC user list */}
        {activeTab === 'share' && (
          <Section label="Shared With">
            {[
              { initials: 'SR', name: 'Sarah Rahman', role: 'Can Edit', roleType: 'edit' as const, gradient: 'linear-gradient(135deg, #22d3a5, #7c3aff)' },
              { initials: 'MK', name: 'Mike Karim', role: 'View Only', roleType: 'view' as const, gradient: 'linear-gradient(135deg, #f59e0b, #ff6b35)' },
              { initials: 'LJ', name: 'Lisa Johansson', role: 'View Only', roleType: 'view' as const, gradient: 'linear-gradient(135deg, #f87171, #7c3aff)' },
            ].map((user, i, arr) => (
              <div key={user.initials} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#fff', flexShrink: 0, background: user.gradient }}>{user.initials}</div>
                <span style={{ fontSize: '0.78rem', color: T.text2, flex: 1 }}>{user.name}</span>
                <span style={{
                  fontSize: '0.65rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4,
                  ...(user.roleType === 'edit'
                    ? { background: T.purpleDim, color: T.purple, border: '1px solid rgba(124,58,255,0.2)' }
                    : { background: T.s3, color: T.text3, border: `1px solid ${T.border}` }),
                }}>{user.role}</span>
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
        <PanelBtn label={running ? 'Running...' : '▶  Run Query'} type="accent" onClick={handleRun} disabled={running} />
        <PanelBtn label="🗑  Delete Query" type="danger" onClick={handleDelete} />
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${T.s4}; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────

function Section({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8, display: 'block' }}>{label}</span>}
      {children}
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono, width: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.76rem', color: color || T.text2, flex: 1 }}>{value}</span>
    </div>
  );
}

function SettingsRow({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: '0.74rem', color: T.text2 }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean, onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 32, height: 18, borderRadius: 20, background: on ? T.accent : T.s4,
      cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s',
    }}>
      <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#000', top: 3, right: on ? 3 : 17, transition: 'right 0.2s' }} />
    </div>
  );
}

const miniBtnStyle: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent',
  color: T.text3, fontSize: '0.65rem', cursor: 'pointer', fontFamily: T.fontMono,
};

const selectStyle: React.CSSProperties = {
  padding: '3px 6px', borderRadius: 5, border: `1px solid ${T.border}`,
  background: T.s1, color: T.text, fontSize: '0.72rem', fontFamily: T.fontMono,
  outline: 'none', cursor: 'pointer', appearance: 'none' as const,
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
