import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { StatusIndicator } from '../common/StatusIndicator';
import { testConnection, updateConnectionSettings } from '../../services/api';
import type { ConnectionDetailProps, ConnectionDetailTab, ConnectionListItem } from '../../types/connections';
import { ErdDiagram } from './ErdDiagram';

// ---------------------------------------------------------------------------
// Local type definitions for schema and query data
// ---------------------------------------------------------------------------
interface ColumnSchema {
  name: string;
  type?: string;
  primary_key?: boolean;
  is_foreign_key?: boolean;
}

interface TableSchema {
  name: string;
  row_count?: number;
  columns?: ColumnSchema[];
}

interface QueryRecord {
  success: boolean;
  sql: string;
  execution_time_ms?: number;
  timestamp: string;
}

export function ConnectionDetail({ connection, schema, queryHistory, onDelete, onRefreshSchema }: ConnectionDetailProps) {
  const [activeTab, setActiveTab] = useState<ConnectionDetailTab>('overview');
  
  if (!connection) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.text3, fontFamily: T.fontBody }}>
        Select a connection to view details
      </div>
    );
  }

  const getStatusColor = () => {
    switch(connection.status) {
      case 'live': return { bg: T.greenDim, text: T.green, border: 'rgba(34,211,165,0.25)' };
      case 'offline': return { bg: T.redDim, text: T.red, border: 'rgba(248,113,113,0.25)' };
      case 'warning': return { bg: T.yellowDim, text: T.yellow, border: 'rgba(245,158,11,0.25)' };
      default: return { bg: T.s3, text: T.text3, border: T.border };
    }
  };
  const sc = getStatusColor();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.bg, fontFamily: T.fontBody }}>
      
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', background: T.s1, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, background: connection.color }}>
          {connection.icon}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.1rem', marginBottom: 2, color: T.text }}>{connection.name}</div>
          <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>{connection.host || 'localhost'} · {connection.port || 'N/A'} · database: {connection.database || 'N/A'}</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem', fontFamily: T.fontBody, flexShrink: 0, background: sc.bg, border: `1px solid ${sc.border}` }}>
          <StatusIndicator
            status={connection.status === 'live' ? 'online' : connection.status === 'offline' ? 'offline' : 'loading'}
            latency={typeof connection.latency === 'number' ? connection.latency : undefined}
            size="sm"
          />
        </div>
        
        <div style={{ display: 'flex', gap: 7 }}>
          <HeaderBtn icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>} label="Test" />
          <HeaderBtn icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Edit" />
          <HeaderBtn icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>} label="Share" />
          <HeaderBtn danger onClick={() => onDelete?.(connection.id)} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>} label="Delete" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.s1, borderBottom: `1px solid ${T.border}` }}>
        <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
        <Tab active={activeTab === 'credentials'} onClick={() => setActiveTab('credentials')} label="Credentials" />
        <Tab active={activeTab === 'schema'} onClick={() => setActiveTab('schema')} label="Schema" />
        <Tab active={activeTab === 'security'} onClick={() => setActiveTab('security')} label="Security" />
        <Tab active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} label="Query Activity" />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }} className="cd-body">
        
        {activeTab === 'overview' && <OverviewTab connection={connection} schema={schema} queryHistory={queryHistory} onTabSwitch={setActiveTab} />}
        {activeTab === 'credentials' && <CredentialsTab connection={connection} />}
        {activeTab === 'schema' && <SchemaTab schema={schema} onRefresh={onRefreshSchema} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'activity' && <ActivityTab queryHistory={queryHistory} />}

      </div>

      <style>{`
        @keyframes lp { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .cd-body::-webkit-scrollbar { width: 4px; }
        .cd-body::-webkit-scrollbar-thumb { background: ${T.s4}; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ------------------------
// Sub-components
// ------------------------

function HeaderBtn({ icon, label, danger, onClick }: { icon: React.ReactNode, label: string, danger?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, border: `1px solid ${T.border}`,
      background: 'transparent', color: T.text2, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontBody
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = danger ? 'rgba(248,113,113,0.3)' : T.border2;
      e.currentTarget.style.color = danger ? T.red : T.text;
      e.currentTarget.style.background = danger ? T.redDim : T.s2;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = T.border;
      e.currentTarget.style.color = T.text2;
      e.currentTarget.style.background = 'transparent';
    }}
    >
      {icon} {label}
    </button>
  );
}

function Tab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 20px', fontSize: '0.76rem', fontFamily: T.fontMono, color: active ? T.accent : T.text3,
      cursor: 'pointer', borderBottom: `2px solid ${active ? T.accent : 'transparent'}`, transition: 'all 0.15s'
    }}
    onMouseEnter={e => { if(!active) e.currentTarget.style.color = T.text2; }}
    onMouseLeave={e => { if(!active) e.currentTarget.style.color = T.text3; }}
    >
      {label}
    </div>
  );
}

// ------------------------
// Tabs Content
// ------------------------

function OverviewTab({ connection, schema, queryHistory, onTabSwitch }: { connection: ConnectionListItem, schema?: ConnectionDetailProps['schema'], queryHistory?: ConnectionDetailProps['queryHistory'], onTabSwitch: (tab: ConnectionDetailTab) => void }) {
  const tables = schema?.tables || [];
  const tableCount = tables.length;
  const recentQueries = (queryHistory || []).slice(0, 3);
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard val={String(connection.tables_count || tableCount)} label="Tables" sub="in this database" valColor={T.accent} subColor={T.text3} />
        <KpiCard val={connection.type} label="Database Type" sub={connection.host || ''} valColor={T.green} subColor={T.text3} />
        <KpiCard val={connection.status === 'live' ? 'Online' : 'Offline'} label="Status" sub={connection.status === 'live' ? 'Connected' : 'Disconnected'} valColor={connection.status === 'live' ? T.green : T.red} subColor={T.text3} />
        <KpiCard val={String(connection.port || 'N/A')} label="Port" sub={connection.database || ''} valColor={T.purple} subColor={T.text3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
        <SectionCard title="Schema Preview" badge={{ text: `${tableCount} tables`, color: T.green }} onAction={() => onTabSwitch('schema')}>
          <div style={{ padding: '10px 14px' }}>
            {tables.slice(0, 4).map((t: TableSchema, i: number) => (
              <SchemaTable key={i} name={t.name} rows={t.row_count != null ? `${t.row_count.toLocaleString()} rows` : 'N/A'}
                defaultExpanded={i === 0}
                cols={t.columns?.map((c: ColumnSchema) => ({ name: c.name, type: c.type?.split('(')[0]?.toUpperCase() || 'UNK', isPk: c.primary_key, isFk: c.is_foreign_key })) || []} />
            ))}
            {tables.length === 0 && <div style={{ color: T.text3, fontSize: '0.78rem', padding: 8 }}>No tables found</div>}
          </div>
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard title="Connection Health" badge={{ text: 'Coming soon', color: T.text3 }}>
            <div style={{ padding: '24px 18px', textAlign: 'center', color: T.text3, fontSize: '0.78rem' }}>
              Health monitoring will be available in a future update.
            </div>
          </SectionCard>
          
          <SectionCard title="Connection Info">
            <div style={{ padding: '10px 18px' }}>
              <InfoRow label="Type" val={connection.type} />
              <InfoRow label="Host" val={connection.host || 'localhost'} />
              <InfoRow label="Port" val={String(connection.port || 'N/A')} />
              <InfoRow label="Database" val={connection.database || 'N/A'} />
              <InfoRow label="Username" val={connection.username || 'N/A'} noBorder />
            </div>
          </SectionCard>
        </div>
      </div>
      
      <SectionCard title="Recent Query Activity" onAction={() => onTabSwitch('activity')} actionText="View All →">
         <div style={{ display: 'flex', flexDirection: 'column' }}>
           {recentQueries.map((q: QueryRecord, i: number) => (
             <ActivityRow key={i} ok={q.success} err={!q.success}
               query={q.sql?.substring(0, 80) + (q.sql?.length > 80 ? '...' : '')}
               dur={q.success ? `${((q.execution_time_ms || 0) / 1000).toFixed(2)}s` : 'Error'}
               time={timeAgo(q.timestamp)} />
           ))}
           {recentQueries.length === 0 && (
             <div style={{ padding: '18px', color: T.text3, fontSize: '0.78rem', textAlign: 'center' }}>No queries executed yet</div>
           )}
         </div>
      </SectionCard>
    </>
  );
}

function CredentialsTab({ connection }: { connection: ConnectionListItem }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tables_found?: number | null } | null>(null);
  const [sslMode, setSslMode] = useState(connection.ssl_mode ?? 'disable');
  const [readonly, setReadonly] = useState(connection.readonly ?? true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const saveSettings = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateConnectionSettings(connection.id, { ssl_mode: sslMode, readonly });
      setSaveMsg('Settings saved.');
    } catch {
      setSaveMsg('Failed to save settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection({
        db_type: connection.type,
        host: connection.host || 'localhost',
        port: connection.port || 5432,
        database: connection.database || '',
        username: connection.username || '',
        password: '',  // We don't have the password stored on frontend
      });
      setTestResult(result);
    } catch (err: unknown) {
      setTestResult({ success: false, message: (err as Error).message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 12 }}>Connection Details</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <FormGroup label="Connection Name" req value={connection.name} />
        <FormGroup label="Database Type" req value={connection.type} select />
        <FormGroup label="Host" req value={connection.host || 'localhost'} />
        <FormGroup label="Port" req value={String(connection.port || '')} />
        <FormGroup label="Database Name" req value={connection.database || ''} />
        <FormGroup label="Username" req value={connection.username || ''} />
        <FormGroup label="Password" req value="••••••••••••" full />
      </div>

      <div style={{ height: 1, background: T.border, margin: '18px 0' }} />
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 12 }}>Security & SSL</div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: T.yellowDim, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 9, marginBottom: 14 }}>
        <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>🔒</span>
        <span style={{ fontSize: '0.76rem', color: T.yellow, lineHeight: 1.5 }}>
          QueryMind connects in <strong>read-only mode</strong> by default — your data is never modified unless you disable it.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.72rem', color: T.text2, fontWeight: 600, fontFamily: T.fontMono }}>SSL Mode</label>
          <select value={sslMode} onChange={e => setSslMode(e.target.value)} style={{ background: T.s3, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 13px', color: T.text, fontFamily: T.fontBody, fontSize: '0.83rem', outline: 'none', cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.3)'}
            onBlur={e => e.target.style.borderColor = T.border}
          >
            <option value="disable">Disable</option>
            <option value="require">Require</option>
            <option value="verify-full">Verify Full</option>
          </select>
          <span style={{ fontSize: '0.66rem', color: T.text3 }}>Encrypts the connection using SSL/TLS</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.72rem', color: T.text2, fontWeight: 600, fontFamily: T.fontMono }}>Access Mode</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
            <button type="button" onClick={() => setReadonly(r => !r)} style={{ width: 38, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: readonly ? T.accent : T.s4, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: readonly ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: '0.83rem', color: readonly ? T.text : T.text3 }}>{readonly ? 'Read-only' : 'Read / Write'}</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: T.text3 }}>Blocks INSERT, UPDATE, DELETE, DROP when on</span>
        </div>
      </div>

      <div style={{ height: 1, background: T.border, margin: '18px 0' }} />
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 12 }}>Test Connection</div>

      <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>Connection Test Results</span>
          <button onClick={runTest} disabled={testing} style={{ padding: '6px 10px', borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: '0.75rem', cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? 0.5 : 1 }}>↺ Re-run test</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TestStep label="Connecting to database" res={testing ? 'Testing...' : (testResult ? (testResult.success ? 'Connection established' : 'Connection failed') : 'Click test to start')} state={testing ? 'load' : (testResult ? (testResult.success ? 'ok' : 'err') : 'wait')} />
          <TestStep label="Schema Discovery" res={testing ? 'Waiting...' : (testResult?.success ? `${testResult.tables_found || 0} tables discovered` : (testResult ? 'N/A' : 'Waiting...'))} state={testing ? 'wait' : (testResult ? (testResult.success ? 'ok' : 'err') : 'wait')} />
          {testResult && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginTop: 4, background: testResult.success ? T.greenDim : T.redDim, border: `1px solid ${testResult.success ? 'rgba(34,211,165,0.2)' : 'rgba(248,113,113,0.2)'}`, color: testResult.success ? T.green : T.red, fontSize: '0.78rem' }}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
         <button onClick={saveSettings} disabled={saving} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${T.accent}, #00b8d4)`, color: '#000', fontSize: '0.83rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: T.fontBody, opacity: saving ? 0.7 : 1 }}>
           {saving ? '⏳ Saving...' : '💾 Save Changes'}
         </button>
         <button onClick={runTest} disabled={testing} style={{ padding: '10px 20px', borderRadius: 9, border: `1px solid rgba(0,229,255,0.25)`, background: T.accentDim, color: T.accent, fontSize: '0.83rem', fontWeight: 600, cursor: testing ? 'not-allowed' : 'pointer', fontFamily: T.fontBody, opacity: testing ? 0.5 : 1 }}>{testing ? '⏳ Testing...' : '⚡ Test Connection'}</button>
         {saveMsg && <span style={{ fontSize: '0.76rem', color: saveMsg.includes('Failed') ? T.red : T.green, fontFamily: T.fontMono }}>{saveMsg}</span>}
      </div>

    </>
  );
}

function SchemaTab({ schema, onRefresh }: { schema?: { tables?: TableSchema[] }, onRefresh?: () => void }) {
  const tables = schema?.tables || [];
  const [viewMode, setViewMode] = useState<'table' | 'erd'>('table');

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 6, border: `1px solid ${active ? T.accent + '44' : T.border}`,
    background: active ? T.accentDim : 'transparent', color: active ? T.accent : T.text3,
    fontSize: '0.72rem', cursor: 'pointer', fontFamily: T.fontMono, fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  });

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: '0.82rem', color: T.text2 }}>{tables.length} tables · 1 schema</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          <button onClick={() => setViewMode('table')} style={toggleBtnStyle(viewMode === 'table')}>Table</button>
          <button onClick={() => setViewMode('erd')} style={toggleBtnStyle(viewMode === 'erd')}>ERD</button>
        </div>
        {onRefresh && <button onClick={onRefresh} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: '0.72rem', cursor: 'pointer', fontFamily: T.fontBody }}>↺ Sync Schema</button>}
      </div>

      {viewMode === 'table' && (
        <SectionCard title="All Tables" badge={{ text: `${tables.length} tables`, color: T.accent }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: T.s3 }}>
                {['Table', 'Rows', 'Columns'].map(h => (
                  <th key={h} style={{ padding: '9px 18px', textAlign: 'left', fontFamily: T.fontMono, fontSize: '0.65rem', color: T.text3, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.map((t: TableSchema, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '9px 18px', color: T.text, fontFamily: T.fontMono }}>{t.name}</td>
                  <td style={{ padding: '9px 18px', color: T.text2, fontFamily: T.fontMono }}>{t.row_count?.toLocaleString() || 'N/A'}</td>
                  <td style={{ padding: '9px 18px', color: T.text2, fontFamily: T.fontMono }}>{t.columns?.length || 0}</td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '18px', color: T.text3, textAlign: 'center' }}>No tables found — connect a database first</td></tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      )}

      {viewMode === 'erd' && (
        <div style={{ height: 'calc(100vh - 280px)', minHeight: 450 }}>
          <ErdDiagram tables={tables} />
        </div>
      )}
    </>
  );
}

function SecurityTab() {
  return (
    <div style={{ color: T.text2 }}>Security settings coming soon...</div>
  )
}
function ActivityTab({ queryHistory }: { queryHistory?: QueryRecord[] }) {
  const records = queryHistory || [];
  return (
    <SectionCard title="All Query Activity" badge={{ text: `${records.length} queries`, color: T.accent }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {records.map((q: QueryRecord, i: number) => (
          <ActivityRow key={i} ok={q.success} err={!q.success}
            query={q.sql?.substring(0, 100) + (q.sql?.length > 100 ? '...' : '')}
            dur={q.success ? `${((q.execution_time_ms || 0) / 1000).toFixed(2)}s` : 'Error'}
            time={timeAgo(q.timestamp)} />
        ))}
        {records.length === 0 && (
          <div style={{ padding: '24px', color: T.text3, fontSize: '0.82rem', textAlign: 'center' }}>No queries have been executed yet. Run a query from the Chat page and it will appear here.</div>
        )}
      </div>
    </SectionCard>
  )
}

function timeAgo(ts: string): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ------------------------
// Helpers
// ------------------------

function KpiCard({ val, label, sub, valColor, subColor }: { val: string, label: string, sub: string, valColor: string, subColor: string }) {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px', marginBottom: 3, color: valColor }}>{val}</div>
      <div style={{ fontSize: '0.7rem', color: T.text3 }}>{label}</div>
      <div style={{ fontSize: '0.65rem', fontFamily: T.fontMono, marginTop: 2, color: subColor }}>{sub}</div>
    </div>
  );
}

function SectionCard({ title, badge, onAction, actionText, children }: { title: string, badge?: { text: string, color: string }, onAction?: () => void, actionText?: string, children: React.ReactNode }) {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.border}`, background: T.s2 }}>
        <span style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.85rem', color: T.text }}>{title}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {badge && <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}33` }}>{badge.text}</span>}
          {onAction && <button onClick={onAction} style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: '0.68rem', cursor: 'pointer' }}>{actionText || 'View All →'}</button>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SchemaTable({ name, rows, defaultExpanded, cols }: { name: string, rows: string, defaultExpanded?: boolean, cols: ColumnSchema[] }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded || false);
  return (
    <div style={{ marginBottom: 4 }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', background: isOpen ? T.s2 : 'transparent' }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: T.purpleDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: T.purple, flexShrink: 0 }}>{isOpen ? '▼' : '▶'}</div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text2, flex: 1 }}>{name}</span>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: T.text3 }}>{rows}</span>
      </div>
      {isOpen && cols.length > 0 && (
         <div style={{ paddingLeft: 30 }}>
           {cols.map((c, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 5 }}>
               <span style={{ fontSize: '0.58rem', fontFamily: T.fontMono, padding: '1px 5px', borderRadius: 3, background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>{c.type}</span>
               <span style={{ fontSize: '0.72rem', color: T.text3 }}>{c.name}</span>
               {c.isPk && <span style={{ fontSize: '0.58rem', color: '#fbbf24', marginLeft: 'auto' }}>PK</span>}
               {c.isFk && <span style={{ fontSize: '0.58rem', color: T.text3, marginLeft: 'auto' }}>FK</span>}
             </div>
           ))}
         </div>
      )}
    </div>
  );
}

function InfoRow({ label, val, noBorder }: { label: string, val: React.ReactNode, noBorder?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: noBorder ? 'none' : `1px solid ${T.border}`, fontSize: '0.74rem' }}>
      <span style={{ color: T.text3 }}>{label}</span>
      <span style={{ color: T.text2, fontFamily: T.fontMono }}>{val}</span>
    </div>
  )
}

function ActivityRow({ ok, err, query, dur, time }: { ok?: boolean, err?: boolean, query: string, dur: string, time: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: err ? T.red : T.green }} />
      <span style={{ fontSize: '0.76rem', color: err ? T.red : T.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query}</span>
      <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: err ? T.red : (ok ? T.green : T.yellow), flexShrink: 0 }}>{dur}</span>
      <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: T.text3, flexShrink: 0 }}>{time}</span>
    </div>
  );
}

function FormGroup({ label, req, value, full, select }: { label: string, req?: boolean, value?: string, full?: boolean, select?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: full ? 'span 2' : 'auto' }}>
      <label style={{ fontSize: '0.72rem', color: T.text2, fontWeight: 600, fontFamily: T.fontMono, display: 'flex', alignItems: 'center', gap: 6 }}>
        {label} {req && <span style={{ color: T.red, fontSize: '0.7rem' }}>*</span>}
      </label>
      {select ? (
        <select style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 13px', color: T.text2, fontFamily: T.fontBody, fontSize: '0.83rem', outline: 'none', width: '100%' }}>
          <option>{value}</option>
        </select>
      ) : (
        <input defaultValue={value} type={full && label === 'Password' ? 'password' : 'text'} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 13px', color: T.text, fontFamily: T.fontBody, fontSize: '0.83rem', outline: 'none', width: '100%' }} />
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ToggleRow({ label, sub, on }: { label: string, sub: string, on?: boolean }) {
  const [isOn, setIsOn] = useState(on || false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9 }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: T.text2 }}>{label}</div>
        <div style={{ fontSize: '0.68rem', color: T.text3, marginTop: 1 }}>{sub}</div>
      </div>
      <div onClick={() => setIsOn(!isOn)} style={{ width: 36, height: 20, borderRadius: 20, cursor: 'pointer', position: 'relative', background: isOn ? T.accent : T.s4, flexShrink: 0, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff', top: 3, left: isOn ? 19 : 3, transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

function TestStep({ label, res, state }: { label: string, res: string, state: 'wait'|'load'|'ok'|'err' }) {
  const st = {
    wait: { icon: '·', bg: T.s3, col: T.text3, spin: false },
    load: { icon: '↻', bg: T.accentDim, col: T.accent, spin: true },
    ok: { icon: '✓', bg: T.greenDim, col: T.green, spin: false },
    err: { icon: '✕', bg: T.redDim, col: T.red, spin: false },
  }[state];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}` }}>
       <div style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, background: st.bg, color: st.col, ...(st.spin ? { animation: 'spin 1s linear infinite' } : {}) }}>
         {st.icon}
       </div>
       <span style={{ fontSize: '0.76rem', color: T.text2, flex: 1 }}>{label}</span>
       <span style={{ fontSize: '0.68rem', fontFamily: T.fontMono, color: state === 'wait' ? T.text3 : st.col }}>{res}</span>
       <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

