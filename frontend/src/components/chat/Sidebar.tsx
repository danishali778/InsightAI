import { useState } from 'react';
import { T } from '../dashboard/tokens';
import type { ChatSidebarProps } from '../../types/chat';
import { DeleteSessionModal } from './DeleteSessionModal';

export function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, onRenameSession, connections, activeConnectionId }: ChatSidebarProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const weekAgo = Date.now() - 7 * 86400000;

  const grouped: { label: string; items: ChatSidebarProps['sessions'] }[] = [];
  const todayItems: ChatSidebarProps['sessions'] = [], yesterdayItems: ChatSidebarProps['sessions'] = [], weekItems: ChatSidebarProps['sessions'] = [], olderItems: ChatSidebarProps['sessions'] = [];

  sessions.forEach(s => {
    const d = new Date(s.created_at);
    const ds = d.toDateString();
    if (ds === today) todayItems.push(s);
    else if (ds === yesterday) yesterdayItems.push(s);
    else if (d.getTime() > weekAgo) weekItems.push(s);
    else olderItems.push(s);
  });

  if (todayItems.length) grouped.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) grouped.push({ label: 'Yesterday', items: yesterdayItems });
  if (weekItems.length) grouped.push({ label: 'Last 7 Days', items: weekItems });
  if (olderItems.length) grouped.push({ label: 'Older', items: olderItems });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const dbTypeLabel = (t: string) => {
    const m: Record<string, string> = { postgresql: 'PG', mysql: 'MY', sqlite: 'SL' };
    return m[t?.toLowerCase()] || t?.slice(0, 2).toUpperCase() || '??';
  };
  const activeConn = connections.find(c => c.id === activeConnectionId);

  return (
    <aside style={{ 
      width: 280, 
      flexShrink: 0, 
      background: '#f9f9f8', 
      borderRight: `1px solid #e5e5e5`, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden' 
    }}>
      {/* Logo + Active Connection */}
      <div style={{ padding: '24px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.25rem', letterSpacing: -0.6, marginBottom: 16, color: '#1a1a1a' }}>
          {/* Grid Logo Icon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, width: 22, height: 22 }}>
            <div style={{ background: '#1a1a1a', borderRadius: 2 }} />
            <div style={{ background: '#3b82f6', borderRadius: 2 }} />
            <div style={{ background: '#6366f1', borderRadius: 2 }} />
            <div style={{ background: '#d1d1d1', borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            Query<span style={{ color: '#3b82f6' }}>Mind</span>
          </div>
        </div>

        {/* Active Connection Pill - White Border Style */}
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 8, 
          padding: '4px 12px', borderRadius: 20, 
          background: '#fff', border: `1px solid #e5e5e5`, 
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          marginBottom: 20
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeConn ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 500, fontFamily: T.fontBody }}>
            {activeConn?.database || 'ecommerce_analytics'}
            <span style={{ color: '#999', marginLeft: 4, fontWeight: 400 }}>- {dbTypeLabel(activeConn?.db_type || 'pg')}</span>
          </span>
        </div>

        <button onClick={onNewChat} style={{
          width: '100%', padding: '10px 14px',
          background: '#fff',
          border: `1px solid #1a1a1a`, borderRadius: 8, color: '#1a1a1a',
          fontFamily: T.fontBody, fontSize: '0.85rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#fcfcfc'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 300, color: '#1a1a1a', transform: 'translateY(-1px)' }}>+</span> New conversation
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 6px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: T.text3 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{
              width: '100%', background: T.s2, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '7px 10px 7px 30px',
              color: T.text2, fontFamily: T.fontBody, fontSize: '0.78rem', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Conversations */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 10px' }}>
        {grouped.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', padding: '12px 6px 6px', fontFamily: T.fontMono }}>{group.label}</div>
            {group.items
              .filter(s => !search || s.id.toLowerCase().includes(search.toLowerCase()) || (s.title || '').toLowerCase().includes(search.toLowerCase()))
              .map(s => {
                const isActive = s.id === activeSessionId;
                return (
                  <div key={s.id} onClick={() => onSelectSession(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
                      cursor: 'pointer', marginBottom: 1, 
                      background: isActive ? '#fff' : hoveredId === s.id ? 'rgba(255,255,255,0.5)' : 'transparent', 
                      position: 'relative', transition: 'background 0.15s',
                    }}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#3b82f6' }} />}
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, flexShrink: 0, boxShadow: '0 0 5px rgba(34,211,165,0.5)' }} />
                    {editingId === s.id ? (
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { onRenameSession(s.id, editText.trim() || s.title || `Session ${s.id.slice(0, 6)}`); setEditingId(null); }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => { onRenameSession(s.id, editText.trim() || s.title || `Session ${s.id.slice(0, 6)}`); setEditingId(null); }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, fontSize: '0.8rem', color: T.text, background: T.s2,
                          border: `1px solid ${T.accent}`, borderRadius: 4, padding: '1px 4px',
                          outline: 'none', fontFamily: T.fontBody, minWidth: 0,
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={e => { e.stopPropagation(); setEditingId(s.id); setEditText(s.title || `Session ${s.id.slice(0, 6)}`); }}
                        style={{ fontSize: '0.8rem', color: isActive ? T.text : T.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}
                      >
                        {s.title || `Session ${s.id.slice(0, 6)}`}
                      </span>
                    )}
                    <span style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono, flexShrink: 0 }}>{timeAgo(s.created_at)}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteId(s.id);
                      }}
                      title="Delete chat"
                      style={{
                        background: 'none', border: 'none', color: T.text3, cursor: 'pointer',
                        fontSize: '0.9rem', padding: '2px 6px',
                        opacity: hoveredId === s.id ? 1 : 0,
                        transition: 'all 0.2s', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 4,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'none'; }}
                    >
                      <span style={{ transform: 'translateY(-1px)' }}>×</span>
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
        {sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: T.text3, fontSize: '0.8rem', lineHeight: 1.7 }}>
            No conversations yet.<br />Start a new chat!
          </div>
        )}
      </div>

      <DeleteSessionModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDeleteSession(deleteId);
        }}
        sessionTitle={sessions.find(s => s.id === deleteId)?.title || undefined}
      />


      {/* User Footer - Premium Image 2 Style */}
      <div style={{ 
        padding: '16px 20px', 
        borderTop: `1px solid #e5e5e5`, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        background: 'transparent' // Maintained beige feel
      }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '0.8rem', fontWeight: 800, color: '#fff', flexShrink: 0
        }}>U</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1a1a' }}>User</div>
          <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 500 }}>Pro plan</div>
        </div>
      </div>
    </aside>
  );
}
