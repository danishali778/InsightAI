import { T } from '../dashboard/tokens';

export type ConnectionStatus = 'live' | 'offline' | 'warning';

export interface ConnectionData {
  id: string;
  name: string;
  type: string;
  version?: string;
  status: ConnectionStatus;
  latency?: number;
  queries: number;
  icon: string;
  color: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  tables_count?: number;
}

export function ConnectionListPanel({ 
  connections, 
  activeId, 
  onSelect, 
  onAdd 
}: { 
  connections: ConnectionData[], 
  activeId: string | null, 
  onSelect: (id: string) => void,
  onAdd: () => void 
}) {
  const activeConns = connections.filter(c => c.status !== 'offline');
  const offlineConns = connections.filter(c => c.status === 'offline');

  return (
    <div style={{
      width: 300, flexShrink: 0, background: T.s1, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: T.fontBody
    }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: T.text }}>
          My Connections
          <span style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{connections.length} total</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.text3, pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input 
            placeholder="Search connections..."
            style={{
              width: '100%', background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '7px 10px 7px 28px', color: T.text2, fontFamily: T.fontBody, fontSize: '0.76rem',
              outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.3)'}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }} className="custom-scrollbar">
        {activeConns.length > 0 && (
          <>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, padding: '8px 8px 5px' }}>Active</div>
            {activeConns.map(c => <ConnectionItem key={c.id} data={c} active={activeId === c.id} onClick={() => onSelect(c.id)} />)}
          </>
        )}

        {offlineConns.length > 0 && (
          <>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, padding: '16px 8px 5px' }}>Offline</div>
            {offlineConns.map(c => <ConnectionItem key={c.id} data={c} active={activeId === c.id} onClick={() => onSelect(c.id)} />)}
          </>
        )}
      </div>

      <button onClick={onAdd} style={{
        margin: '8px 10px', padding: '9px 12px', borderRadius: 10,
        border: `1px dashed ${T.border2}`, background: 'transparent',
        color: T.text3, fontSize: '0.78rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'all 0.2s', fontFamily: T.fontBody
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)'; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add new connection
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${T.s4}; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function ConnectionItem({ data, active, onClick }: { data: ConnectionData, active: boolean, onClick: () => void }) {
  const getRingColor = () => {
    switch(data.status) {
      case 'live': return T.green;
      case 'offline': return T.red;
      case 'warning': return T.yellow;
      default: return T.text3;
    }
  };

  const latencyColor = data.status === 'offline' ? T.red : data.status === 'warning' ? T.yellow : T.green;

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
      transition: 'all 0.15s', marginBottom: 2, border: `1px solid ${active ? 'rgba(0,229,255,0.15)' : 'transparent'}`,
      background: active ? T.s2 : 'transparent',
    }}
    onMouseEnter={e => { if(!active) e.currentTarget.style.background = T.s2; }}
    onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', position: 'relative', background: data.color }}>
        {data.icon}
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 11, height: 11, borderRadius: '50%', border: `2px solid ${T.s2}`, background: getRingColor() }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: active ? T.text : T.text2, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: T.text3 }}>{data.type}</span>
          <span style={{ color: T.text3, fontSize: '0.6rem' }}>·</span>
          <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: latencyColor }}>{data.status === 'offline' ? 'Offline' : `${data.latency}ms`}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: T.text3 }}>{data.queries.toLocaleString()} queries</span>
      </div>
    </div>
  );
}
