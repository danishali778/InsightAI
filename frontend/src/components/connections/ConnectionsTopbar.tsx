import { T } from '../dashboard/tokens';
import { Plus, BookOpen } from 'lucide-react';

export function ConnectionsTopbar({ onNewConnection }: { onNewConnection: () => void }) {
  return (
    <div style={{
      height: 72, flexShrink: 0, background: T.s1, borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 0, padding: '0 32px',
      fontFamily: T.fontBody
    }}>
      <div style={{ marginRight: 24, paddingRight: 24, borderRight: `1px solid ${T.border}`, height: 32, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 900, fontSize: '1.2rem', color: T.text, fontStyle: 'italic', letterSpacing: '-0.5px' }}>CONNECTION LEDGER</div>
      </div>
      
      <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '1px' }}>
        NODE CONTROL & DATA SOURCE ORCHESTRATION
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 'auto', border: `1px solid ${T.border}` }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 0,
          border: 'none', borderRight: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: '0.68rem',
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontMono, fontWeight: 800
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2; }}
        >
          <BookOpen size={14} />
          DOCUMENTATION
        </button>

        <button onClick={onNewConnection} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 0,
          border: 'none', background: T.accent, 
          color: '#000', fontSize: '0.68rem', fontWeight: 900,
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontMono
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={14} strokeWidth={3} />
          INITIALIZE NEW SOURCE
        </button>
      </div>
    </div>
  );
}
