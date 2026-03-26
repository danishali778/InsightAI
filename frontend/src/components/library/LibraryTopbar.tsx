import { T } from '../dashboard/tokens';
import type { LibraryStats } from '../../types/api';

export function LibraryTopbar({ stats }: { stats?: LibraryStats }) {
  return (
    <div style={{
      height: 52, flexShrink: 0, background: 'rgba(11,17,32,0.97)', borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', backdropFilter: 'blur(20px)', fontFamily: T.fontBody
    }}>
      <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', color: T.text }}>Query Library</div>
      <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>{stats ? `${stats.total_queries} queries across ${stats.folders} folders` : ''}</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <button style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = T.s2; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Import SQL
        </button>
        <button style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = T.s2; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Collection
        </button>
        <button style={{ ...btnStyle, background: `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))`, borderColor: 'rgba(0,229,255,0.25)', color: T.accent }}
          onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,229,255,0.22), rgba(124,58,255,0.16))`}
          onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))` }
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Query
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 7,
  border: `1px solid ${T.border}`, background: 'transparent', color: T.text2,
  fontSize: '0.76rem', cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontBody
};
