import { useState } from 'react';
import { T } from '../dashboard/tokens';

interface FolderSidebarProps {
  folders: { name: string; count: number }[];
  tags: string[];
  stats: { total_queries: number; scheduled: number; total_runs: number; recently_run?: number };
  activeFolder: string;
  activeTag: string | null;
  onFolderChange: (folder: string) => void;
  onTagChange: (tag: string | null) => void;
}

const TAG_COLORS: Record<string, string> = {
  revenue: '#00e5ff', churn: '#7c3aff', users: '#22d3a5',
  weekly: '#f59e0b', critical: '#f87171', sales: '#ff6b35', funnel: '#c084fc',
};

export function FolderSidebar({ folders, tags, stats, activeFolder, activeTag, onFolderChange, onTagChange }: FolderSidebarProps) {
  const [search, setSearch] = useState('');

  const quickAccess = [
    { id: 'All Queries', icon: '⭐', count: stats.total_queries },
    { id: 'Recently Run', icon: '🕐', count: stats.recently_run ?? 0 },
    { id: 'Scheduled', icon: '📅', count: stats.scheduled },
  ];

  return (
    <div style={{
      width: 230, flexShrink: 0, background: T.s1, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: T.fontBody
    }}>
      {/* Header & Search */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.85rem', color: T.text, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Folders
          <span style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>{folders.length}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.text3, pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search queries..." value={search} onChange={e => setSearch(e.target.value)} style={{
            width: '100%', background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px 7px 28px',
            color: T.text2, fontFamily: T.fontBody, fontSize: '0.76rem', outline: 'none', transition: 'border-color 0.2s'
          }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
        </div>
      </div>

      {/* Body List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }} className="custom-scroll">
        
        {/* Quick Access */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, padding: '8px 8px 4px' }}>Quick Access</div>
          {quickAccess.map(f => (
            <FolderItem key={f.id} active={activeFolder === f.id} onClick={() => onFolderChange(f.id)} icon={f.icon} label={f.id} count={f.count} />
          ))}
        </div>

        {/* My Folders (from API) */}
        {folders.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, padding: '8px 8px 4px' }}>My Folders</div>
            {folders.map(f => (
              <FolderItem key={f.name} active={activeFolder === f.name} onClick={() => onFolderChange(f.name)} icon="📁" label={f.name} count={f.count} />
            ))}
          </div>
        )}
      </div>

      {/* Tags (from API) */}
      {tags.length > 0 && (
        <div style={{ padding: '10px 10px 0' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, padding: '0 0 8px 8px', display: 'block' }}>Tags</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 8px' }}>
            {tags.map(t => {
              const active = activeTag === t;
              return (
                <span key={t} onClick={() => onTagChange(active ? null : t)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20,
                  border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : T.border}`, background: active ? T.accentDim : 'transparent',
                  color: active ? T.accent : T.text3, fontSize: '0.68rem', cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontMono
                }}
                  onMouseEnter={e => { if(!active){ e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; } }}
                  onMouseLeave={e => { if(!active){ e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: TAG_COLORS[t] || T.text3 }}></div>
                  {t}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, marginTop: 'auto' }}>
        <button style={{
          width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px dashed ${T.border2}`, background: 'transparent',
          color: T.text3, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s', fontFamily: T.fontBody
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Folder
        </button>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${T.s4}; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function FolderItem({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: string, label: string, count: number }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
      transition: 'all 0.15s', border: `1px solid ${active ? 'rgba(0,229,255,0.12)' : 'transparent'}`,
      background: active ? T.s2 : 'transparent', marginBottom: 1
    }}
      onMouseEnter={e => { if(!active) e.currentTarget.style.background = T.s2; }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '0.85rem', flexShrink: 0, width: 18, textAlign: 'center', color: active ? T.accent : 'inherit' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', color: active ? T.text : T.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {count > 0 && <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, flexShrink: 0, background: T.s3, padding: '1px 6px', borderRadius: 8 }}>{count}</span>}
    </div>
  );
}
