import { useState } from 'react';
import { T } from '../dashboard/tokens';
import type { ConnectionListItem } from '../../types/connections';

export function ConnectionListPanel({ 
  connections, 
  activeId, 
  onSelect, 
  onAdd 
}: { 
  connections: ConnectionListItem[], 
  activeId: string | null, 
  onSelect: (id: string) => void,
  onAdd: () => void 
}) {
  const [search, setSearch] = useState('');
  
  const filtered = connections.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 320, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
      background: T.s1, flexShrink: 0, height: '100%', overflow: 'hidden'
    }}>
      {/* Search Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="FILTER SOURCES..."
            style={{
              width: '100%', background: T.s2, border: `1px solid ${T.border}`,
              padding: '10px 14px 10px 34px', fontSize: '0.68rem', fontFamily: T.fontMono,
              color: T.text, outline: 'none', transition: 'all 0.15s',
              borderRadius: 0, letterSpacing: '0.5px'
            }}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.text3 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="conn-list">
        {filtered.map(conn => {
          const isActive = conn.id === activeId;
          const statusColor = conn.status === 'live' ? T.green : (conn.status === 'offline' ? T.red : T.yellow);
          
          return (
            <div
              key={conn.id}
              onClick={() => onSelect(conn.id)}
              style={{
                padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                borderBottom: `1px solid ${T.border}`, position: 'relative',
                background: isActive ? T.s2 : 'transparent'
              }}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = T.s2; }}
              onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.accent }} />}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ 
                  width: 32, height: 32, background: conn.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1rem', flexShrink: 0, borderRadius: 0
                }}>
                  {conn.icon}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ 
                    fontFamily: T.fontHead, fontWeight: 800, fontSize: '0.88rem', 
                    color: isActive ? T.text : T.text2, whiteSpace: 'nowrap', 
                    overflow: 'hidden', textOverflow: 'ellipsis' 
                  }}>{conn.name}</div>
                  <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{conn.type} · {conn.database || 'public'}</div>
                </div>
                <div style={{ 
                  width: 6, height: 6, borderRadius: 0, 
                  background: statusColor,
                  opacity: conn.status === 'live' ? 1 : 0.4
                }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', gap: 8 }}>
                   <Stat label="latency" val={conn.status === 'offline' ? 'OFF' : `${conn.latency}ms`} col={statusColor} />
                   <Stat label="queries" val={String(conn.queries || 0)} />
                 </div>
                 <div style={{ fontSize: '0.55rem', color: T.text3, fontFamily: T.fontMono, textTransform: 'uppercase' }}>
                   {conn.status}
                 </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: T.text3, fontSize: '0.68rem', fontFamily: T.fontMono }}>
            NO SOURCES FOUND
          </div>
        )}
      </div>

      {/* Add Button */}
      <div style={{ padding: 16, borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={onAdd}
          style={{
            width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${T.border}`,
            color: T.text2, fontSize: '0.68rem', fontFamily: T.fontMono, cursor: 'pointer',
            transition: 'all 0.15s', fontWeight: 700, display: 'flex', alignItems: 'center', 
            justifyContent: 'center', gap: 8, borderRadius: 0, textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.s2; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Initialize New Source
        </button>
      </div>

      <style>{`
        .conn-list::-webkit-scrollbar { width: 4px; }
        .conn-list::-webkit-scrollbar-thumb { background: ${T.s4}; }
      `}</style>
    </div>
  );
}

function Stat({ label, val, col }: { label: string, val: string, col?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: '0.55rem', color: T.text3, fontFamily: T.fontMono, textTransform: 'uppercase' }}>{label}:</span>
      <span style={{ fontSize: '0.62rem', color: col || T.text2, fontFamily: T.fontMono, fontWeight: 700 }}>{val}</span>
    </div>
  );
}
