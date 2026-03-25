import { useState, useRef, useEffect } from 'react';
import { T } from '../dashboard/tokens';

interface Connection { id: string; db_type: string; database: string; host: string; status: string; }

interface ChatInputProps {
  connections: Connection[];
  activeConnectionId: string;
  onConnectionChange: (id: string) => void;
  onSend: (message: string) => void;
  loading: boolean;
}

export function ChatInput({ connections, activeConnectionId, onConnectionChange, onSend, loading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const activeConn = connections.find(c => c.id === activeConnectionId);

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
    if (textRef.current) textRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto';
      textRef.current.style.height = Math.min(textRef.current.scrollHeight, 80) + 'px';
    }
  }, [text]);

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, background: T.s1, padding: '12px 20px 14px', flexShrink: 0 }}>
      {/* Context pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 9, alignItems: 'center' }}>
        {activeConn && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: T.s2, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '3px 10px',
            fontSize: '0.68rem', fontFamily: T.fontMono, color: T.text3,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent }} />
            {activeConn.database}
          </div>
        )}
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: T.s2, border: `1px solid ${T.border}`,
        borderRadius: 12, padding: '10px 14px',
        transition: 'border-color 0.2s',
      }}>
        {/* DB Selector */}
        <div onClick={() => setShowDropdown(!showDropdown)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.s3, border: `1px solid ${T.border}`,
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
          transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap', position: 'relative',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
          <span style={{ fontSize: '0.72rem', fontFamily: T.fontMono, color: T.text2 }}>
            {activeConn?.database || 'Select DB'}
          </span>
          <span style={{ fontSize: '0.6rem', color: T.text3 }}>▾</span>
          {showDropdown && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
              background: T.s3, border: `1px solid ${T.border2}`, borderRadius: 8,
              padding: 4, zIndex: 100, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {connections.map(c => (
                <div key={c.id} onClick={e => { e.stopPropagation(); onConnectionChange(c.id); setShowDropdown(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6,
                    cursor: 'pointer', fontSize: '0.78rem', color: c.id === activeConnectionId ? T.text : T.text2,
                    background: c.id === activeConnectionId ? T.s2 : 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.s2; }}
                  onMouseLeave={e => { e.currentTarget.style.background = c.id === activeConnectionId ? T.s2 : 'transparent'; }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 'connected' ? T.green : T.red }} />
                  <span style={{ fontFamily: T.fontMono }}>{c.database}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask anything about your data..."
          rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: T.text, fontFamily: T.fontBody, fontSize: '0.88rem',
            resize: 'none', maxHeight: 80, minHeight: 20, lineHeight: 1.5,
          }}
        />

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <span style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>{text.length} / 2048</span>
          <button onClick={handleSend} disabled={loading || !text.trim()} style={{
            width: 34, height: 34, borderRadius: 9,
            background: text.trim() ? `linear-gradient(135deg, ${T.accent}, #00b8d4)` : T.s3,
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: text.trim() ? '0 0 20px rgba(0,229,255,0.3)' : 'none',
            transition: 'all 0.2s', fontSize: '0.85rem',
          }}>
            <span style={{ color: text.trim() ? '#000' : T.text3, fontWeight: 700 }}>↗</span>
          </button>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize: '0.65rem', color: T.text3, marginTop: 7, textAlign: 'center', fontFamily: T.fontMono }}>
        <span style={{ background: T.s3, border: `1px solid ${T.border}`, borderRadius: 3, padding: '1px 5px', fontSize: '0.6rem' }}>⌘ Enter</span> to send
        &nbsp;·&nbsp;
        <span style={{ background: T.s3, border: `1px solid ${T.border}`, borderRadius: 3, padding: '1px 5px', fontSize: '0.6rem' }}>/</span> for commands
      </div>
    </div>
  );
}
