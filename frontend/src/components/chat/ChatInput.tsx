import { useState, useRef, useEffect } from 'react';
import { T } from '../dashboard/tokens';
import type { ChatInputProps } from '../../types/chat';

export function ChatInput({ connections, activeConnectionId, onConnectionChange, onSend, loading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const activeConn = connections.find(c => c.id === activeConnectionId);

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ 
      borderTop: `1px solid ${T.border}`,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      padding: '8px 24px 10px',
      flexShrink: 0,
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          background: T.s1,
          border: `1px solid ${isFocused ? T.accent : T.border}`,
          borderRadius: 14,
          padding: '10px 14px',
          boxShadow: isFocused ? T.shadow.glow : '0 2px 8px rgba(0,0,0,0.02)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* DB Selector (Professional Pill Style) */}
          <div style={{ position: 'relative', marginTop: 2 }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '5px 10px',
                cursor: 'pointer',
                color: T.text2,
                fontSize: '0.72rem',
                fontFamily: T.fontMono,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.s3; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeConn ? T.green : T.red, boxShadow: activeConn ? `0 0 4px ${T.green}40` : 'none' }} />
              {activeConn?.database || 'Select DB'}
              <span style={{ fontSize: '0.6rem', color: T.text3 }}>▾</span>
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                background: T.s1,
                border: `1px solid ${T.border2}`,
                borderRadius: 10,
                padding: 4,
                minWidth: 180,
                boxShadow: T.shadow.lg,
                zIndex: 100,
              }}>
                {connections.map(c => (
                  <div key={c.id} onClick={e => { e.stopPropagation(); onConnectionChange(c.id); setShowDropdown(false); }}
                    style={{
                      padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.78rem', color: c.id === activeConnectionId ? T.text : T.text2,
                      background: c.id === activeConnectionId ? T.s2 : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.s2}
                    onMouseLeave={e => e.currentTarget.style.background = c.id === activeConnectionId ? T.s2 : 'transparent'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 'connected' ? T.green : T.red }} />
                    <span style={{ fontFamily: T.fontMono }}>{c.database}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask your data anything..."
            rows={2}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: T.text,
              fontFamily: T.fontBody,
              fontSize: '0.92rem',
              resize: 'none',
              height: 48,
              overflowY: 'auto',
              padding: '2px 0',
              lineHeight: 1.5,
              scrollbarWidth: 'thin',
              scrollbarColor: `${T.border2} transparent`,
            }}
          />

          {/* Action Row Inside */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
             <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, opacity: 0.8 }}>{text.length} / 2048</span>
             <button
              onClick={handleSend}
              disabled={loading || !text.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: text.trim() ? T.accent : T.s3,
                border: 'none',
                cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: text.trim() ? T.shadow.glow : 'none',
              }}
              onMouseEnter={e => { if (text.trim()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Hints */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, opacity: 0.6 }}>
           <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono }}>
              <span style={{ background: T.s4, padding: '1px 4px', borderRadius: 3 }}>⌘ ↵</span> to send
           </div>
           <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono }}>
              <span style={{ background: T.s4, padding: '1px 4px', borderRadius: 3 }}>/</span> for commands
           </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
