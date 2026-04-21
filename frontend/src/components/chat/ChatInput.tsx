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
      background: '#f1f0e8',
      padding: '24px 24px 24px', // Standardized symmetrical padding
      flexShrink: 0,
      zIndex: 10,
      borderTop: '1px solid #e5e5e5' // Unified border token
    }}>
      <div style={{
        maxWidth: 1200, // Matched with ChatPage messages
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#f7f7f3',
          border: `1px solid #e5e5e5`, // Unified border token
          borderRadius: 16,
          padding: '10px 14px',
          boxShadow: isFocused ? '0 8px 30px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.01)',
          transition: 'all 0.2s ease', // Premium duration
        }}>
          {/* Professional Connection Badge (Integrated) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f0f4ff',
                border: '1px solid #dce4f9',
                borderRadius: 20,
                padding: '6px 14px',
                cursor: 'pointer',
                color: '#5c7ed3',
                fontSize: '0.72rem',
                fontWeight: 600,
                fontFamily: T.fontBody,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e8efff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0f4ff'; }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              {activeConn?.database || 'ecommerce_analytics'}
              <span style={{ fontSize: '0.6rem', color: '#5c7ed3', opacity: 0.7 }}>▾</span>
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 12px)', left: 0,
                background: '#fff',
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: 6,
                minWidth: 200,
                boxShadow: T.shadow.lg,
                zIndex: 100,
              }}>
                {connections.map(c => (
                  <div key={c.id} onClick={e => { e.stopPropagation(); onConnectionChange(c.id); setShowDropdown(false); }}
                    style={{
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      fontSize: '0.82rem', color: c.id === activeConnectionId ? T.accent : T.text,
                      background: c.id === activeConnectionId ? T.s2 : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.s2}
                    onMouseLeave={e => e.currentTarget.style.background = c.id === activeConnectionId ? T.s2 : 'transparent'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 'connected' ? T.green : T.red }} />
                    <span style={{ fontWeight: 500 }}>{c.database}</span>
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
            placeholder="Search or ask anything..."
            rows={2}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: T.text,
              fontFamily: T.fontBody,
              fontSize: '1rem',
              resize: 'none',
              minHeight: 44, // Support ~2 lines naturally
              maxHeight: 120, // Allow expansion until scroll
              overflowY: 'auto',
              padding: '2px 0',
              lineHeight: 1.4,
            }}
          />

          {/* Action Row Inside */}
          <button
            onClick={handleSend}
            disabled={loading || !text.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#fff',
              border: `1px solid #e5e5e5`,
              cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => { if (text.trim()) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#ccc'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
          >
            {loading ? (
              <div style={{ width: 16, height: 16, border: `2px solid rgba(0,0,0,0.1)`, borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l10-10M17 17V7H7" />
              </svg>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
