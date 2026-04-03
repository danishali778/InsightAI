import { useState } from 'react';
import { T } from '../dashboard/tokens';
import type { ChatSidebarProps } from '../../types/chat';
import { DeleteSessionModal } from './DeleteSessionModal';

export function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, onRenameSession, onOpenConnect, connections }: ChatSidebarProps) {
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

  return (
    <aside style={{ width: 260, flexShrink: 0, background: T.s1, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Logo + New Chat */}
      <div style={{ padding: '16px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.15rem', letterSpacing: -0.5, padding: '4px 6px', marginBottom: 12, color: T.text }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#000', fontWeight: 800 }}>Q</div>
          Query<span style={{ color: T.accent }}>Mind</span>
        </div>
        <button onClick={onNewChat} style={{
          width: '100%', padding: '9px 14px',
          background: `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))`,
          border: '1px solid rgba(0,229,255,0.25)', borderRadius: 9, color: T.accent,
          fontFamily: T.fontBody, fontSize: '0.82rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.22), rgba(124,58,255,0.15))'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))'; e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1rem' }}>+</span> New Conversation
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 14px 6px' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 10px' }}>
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
                      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8,
                      cursor: 'pointer', marginBottom: 1, border: `1px solid ${isActive ? 'rgba(0,229,255,0.15)' : 'transparent'}`,
                      background: isActive || hoveredId === s.id ? T.s2 : 'transparent', position: 'relative', transition: 'background 0.15s',
                    }}
                    onMouseEnter={() => {
                      setHoveredId(s.id);
                      // Fallback for logic that directly modifies style
                    }}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {isActive && <div style={{ position: 'absolute', left: -1, top: '20%', bottom: '20%', width: 2, borderRadius: 2, background: T.accent }} />}
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

      {/* Connections */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 8 }}>Connections</div>
        {connections.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2 }}
            onMouseEnter={e => { e.currentTarget.style.background = T.s2; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'connected' ? T.green : T.red, boxShadow: c.status === 'connected' ? '0 0 6px rgba(34,211,165,0.6)' : 'none', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: T.text2, flex: 1 }}>{c.database}</span>
            <span style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>{dbTypeLabel(c.db_type)}</span>
          </div>
        ))}
        <button onClick={onOpenConnect} style={{
          width: '100%', padding: '7px 10px', borderRadius: 8,
          border: `1px dashed ${T.border2}`, background: 'transparent',
          color: T.text3, fontSize: '0.75rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', marginTop: 6, fontFamily: T.fontBody,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; }}
        >+ Add connection</button>
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>AK</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>Ahmad Khan</div>
          <div style={{ fontSize: '0.65rem', color: T.accent, fontFamily: T.fontMono }}>PRO PLAN</div>
        </div>
      </div>
    </aside>
  );
}
