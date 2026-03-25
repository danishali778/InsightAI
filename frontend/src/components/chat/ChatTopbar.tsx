import { T } from '../dashboard/tokens';

interface ChatTopbarProps {
  sessionId: string | null;
  dbType?: string;
  dbName?: string;
  onToggleSchema: () => void;
  schemaOpen: boolean;
}

export function ChatTopbar({ sessionId, dbName, onToggleSchema, schemaOpen }: ChatTopbarProps) {
  return (
    <div style={{
      height: 52, flexShrink: 0,
      background: 'rgba(11,17,32,0.95)',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.9rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {sessionId ? `Session ${sessionId.slice(0, 8)}` : 'New Conversation'}
        </div>
        {dbName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono, flexShrink: 0 }}>
            <span style={{ color: T.text3, opacity: 0.4 }}>›</span>
            <span>{dbName}</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {dbName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.s2, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '5px 12px',
            fontSize: '0.72rem', fontFamily: T.fontMono, color: T.text2, cursor: 'pointer',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: '0 0 5px rgba(34,211,165,0.7)' }} />
            {dbName}
            <span style={{ fontSize: '0.6rem', color: T.text3 }}>▾</span>
          </div>
        )}

        {/* Schema toggle */}
        <button onClick={onToggleSchema} style={{
          width: 32, height: 32, borderRadius: 8,
          background: schemaOpen ? T.s2 : 'transparent',
          border: `1px solid ${schemaOpen ? T.border2 : T.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: schemaOpen ? T.accent : T.text3, transition: 'all 0.2s', fontSize: '0.8rem',
        }}
          title="Schema Explorer"
        >⊞</button>

        {/* Share */}
        <button style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: `1px solid ${T.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.text3, transition: 'all 0.2s', fontSize: '0.8rem',
        }} title="Share">↗</button>

        {/* Export */}
        <button style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: `1px solid ${T.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.text3, transition: 'all 0.2s', fontSize: '0.8rem',
        }} title="Export">⬇</button>

        {/* User avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
          background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 700, color: '#fff',
        }}>AK</div>
      </div>
    </div>
  );
}
