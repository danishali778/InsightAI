import { T } from '../dashboard/tokens';

export function ConnectionsTopbar({ onNewConnection }: { onNewConnection: () => void }) {
  return (
    <div style={{
      height: 52, flexShrink: 0, background: 'rgba(11,17,32,0.97)', borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 28px', backdropFilter: 'blur(20px)',
      fontFamily: T.fontBody
    }}>
      <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', color: T.text }}>Connections</div>
      <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>Manage your database & data source connections</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7,
          border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: '0.76rem',
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontBody
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.background = T.s2; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          Connection Docs
        </button>

        <button onClick={onNewConnection} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7,
          border: `1px solid rgba(0,229,255,0.3)`, background: `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))`, 
          color: T.accent, fontSize: '0.76rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontBody
        }}
        onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,229,255,0.22), rgba(124,58,255,0.18))` }
        onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,255,0.1))` }
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Connection
        </button>
      </div>
    </div>
  );
}
