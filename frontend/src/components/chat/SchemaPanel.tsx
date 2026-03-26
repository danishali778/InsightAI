import { useState, useEffect } from 'react';
import { T } from '../dashboard/tokens';
import * as api from '../../services/api';
import type { SchemaTable } from '../../types/api';
import type { ChatSchemaPanelProps } from '../../types/chat';

const typeColor: Record<string, { bg: string; color: string }> = {
  int: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
  integer: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
  bigint: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
  serial: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
  text: { bg: 'rgba(134,239,172,0.1)', color: '#86efac' },
  varchar: { bg: 'rgba(134,239,172,0.1)', color: '#86efac' },
  char: { bg: 'rgba(134,239,172,0.1)', color: '#86efac' },
  timestamp: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa' },
  date: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa' },
  decimal: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  numeric: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  float: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  double: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  boolean: { bg: 'rgba(0,229,255,0.1)', color: '#00e5ff' },
};

function getTypeStyle(type: string) {
  const lower = type.toLowerCase();
  for (const [key, val] of Object.entries(typeColor)) {
    if (lower.includes(key)) return val;
  }
  return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
}

function shortType(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('int') || lower.includes('serial')) return 'INT';
  if (lower.includes('varchar') || lower.includes('text') || lower.includes('char')) return 'STR';
  if (lower.includes('timestamp') || lower.includes('date')) return 'TS';
  if (lower.includes('decimal') || lower.includes('numeric') || lower.includes('float') || lower.includes('double')) return 'DEC';
  if (lower.includes('bool')) return 'BOOL';
  return type.slice(0, 4).toUpperCase();
}

export function SchemaPanel({ connectionId, visible }: ChatSchemaPanelProps) {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connectionId || !visible) return;
    setLoading(true);
    api.getSchema(connectionId).then((data) => {
      const nextTables = data.tables;
      setTables(nextTables);
      setExpanded(new Set(nextTables.slice(0, 2).map((table) => table.name)));
    }).catch((err) => {
      console.error('Schema fetch failed:', err);
      setTables([]);
    }).finally(() => setLoading(false));
  }, [connectionId, visible]);

  if (!visible) return null;

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const filtered = tables.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      width: 270, flexShrink: 0, background: T.s1, borderLeft: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.85rem', color: T.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Schema Explorer</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>
            {tables.length} tables
          </span>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tables & columns..."
          style={{
            width: '100%', background: T.s2, border: `1px solid ${T.border}`,
            borderRadius: 7, padding: '6px 10px', color: T.text2,
            fontFamily: T.fontBody, fontSize: '0.75rem', outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: T.text3, fontSize: '0.78rem', fontFamily: T.fontMono }}>
            Loading schema...
          </div>
        )}
        {!loading && filtered.map(table => (
          <div key={table.name} style={{ marginBottom: 2 }}>
            <div onClick={() => toggle(table.name)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px',
              borderRadius: 7, cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.s2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4, background: 'rgba(124,58,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', color: T.purple, flexShrink: 0,
              }}>{expanded.has(table.name) ? '▼' : '▶'}</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text2, flex: 1 }}>{table.name}</span>
              {table.row_count != null && (
                <span style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>
                  {table.row_count >= 1000 ? `${(table.row_count / 1000).toFixed(1)}K` : table.row_count} rows
                </span>
              )}
            </div>
            {expanded.has(table.name) && (
              <div style={{ padding: '0 0 4px 32px' }}>
                {table.columns.map(col => {
                  const ts = getTypeStyle(col.type);
                  return (
                    <div key={col.name} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                      borderRadius: 5, cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.s2; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{
                        fontSize: '0.6rem', fontFamily: T.fontMono,
                        padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                        background: ts.bg, color: ts.color,
                      }}>{shortType(col.type)}</span>
                      <span style={{ fontSize: '0.75rem', color: T.text3 }}>{col.name}</span>
                      {col.primary_key && (
                        <span style={{ fontSize: '0.6rem', color: '#fbbf24', marginLeft: 'auto' }}>PK</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: T.text3, fontSize: '0.78rem' }}>
            {tables.length === 0 ? 'No schema loaded' : 'No matches'}
          </div>
        )}
      </div>
    </div>
  );
}
