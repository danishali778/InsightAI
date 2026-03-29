import { useMemo, useState } from 'react';
import { T } from '../dashboard/tokens';
import { tokenizeSqlLine, type TokenKind } from '../../utils/sqlHighlight';

interface SqlBlockProps {
  sql: string;
  mode?: 'chat' | 'card';
  defaultOpen?: boolean;
  collapsible?: boolean;
  maxVisibleLines?: number;
  title?: string;
  trailingMeta?: string;
}

function tokenStyle(kind: TokenKind): React.CSSProperties {
  switch (kind) {
    case 'keyword':
      return { color: T.accent, fontWeight: 700 };
    case 'function':
      return { color: '#c084fc', fontWeight: 600 };
    case 'string':
      return { color: '#86efac' };
    case 'number':
      return { color: '#fb923c' };
    case 'table':
      return { color: '#ffb347' };
    case 'comment':
      return { color: T.text3, fontStyle: 'italic' };
    default:
      return { color: '#d7deea' };
  }
}

export function SqlBlock({
  sql,
  mode = 'chat',
  defaultOpen = mode === 'card',
  collapsible = mode === 'chat',
  maxVisibleLines,
  title,
  trailingMeta,
}: SqlBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => sql.replace(/\r\n/g, '\n').split('\n'), [sql]);
  const visibleLines = maxVisibleLines ? lines.slice(0, maxVisibleLines) : lines;
  const showCollapsedBody = !collapsible || open;
  const isCard = mode === 'card';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderBottom: isCard ? 'none' : `1px solid ${T.border}`,
        padding: isCard ? 0 : undefined,
      }}
    >
      {collapsible && (
        <div
          onClick={() => setOpen((value) => !value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: T.s2,
            cursor: 'pointer',
            transition: 'background 0.15s',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.s3; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = T.s2; }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: T.fontMono,
              fontWeight: 600,
              letterSpacing: 1,
              color: T.accent,
              background: T.accentDim,
              border: '1px solid rgba(0,229,255,0.2)',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            SQL
          </span>
          <span style={{ fontSize: '0.78rem', color: T.text2, flex: 1 }}>
            {title || 'View generated query'}
          </span>
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              borderRadius: 5,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              color: T.text3,
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: T.fontBody,
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span
            style={{
              fontSize: '0.7rem',
              color: T.text3,
              transition: 'transform 0.2s',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            v
          </span>
        </div>
      )}

      {showCollapsedBody && (
        <div
          style={{
            margin: isCard ? 0 : undefined,
            background: isCard
              ? 'linear-gradient(180deg, rgba(3,7,18,0.75) 0%, rgba(5,10,20,0.9) 100%)'
              : 'linear-gradient(180deg, rgba(6,10,18,0.88) 0%, rgba(7,12,22,0.98) 100%)',
            border: `1px solid ${T.border}`,
            borderRadius: isCard ? 11 : 0,
            padding: isCard ? '10px 12px' : '14px 18px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,229,255,0.02), transparent 40%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isCard ? 8 : 10,
              position: 'relative',
            }}
          >
            <span
              style={{
                fontSize: isCard ? '0.58rem' : '0.62rem',
                fontFamily: T.fontMono,
                letterSpacing: 0.8,
                color: T.accent,
              }}
            >
              {title || 'SQL PREVIEW'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!collapsible && (
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    border: `1px solid ${T.border}`,
                    background: 'rgba(255,255,255,0.02)',
                    color: copied ? T.green : T.text3,
                    fontSize: '0.58rem',
                    fontFamily: T.fontMono,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? 'copied' : 'copy'}
                </button>
              )}
              <span
                style={{
                  fontSize: isCard ? '0.56rem' : '0.6rem',
                  fontFamily: T.fontMono,
                  color: T.text3,
                }}
              >
                {trailingMeta || `${Math.min(sql.length, 200)} chars`}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: isCard ? 4 : 6,
              position: 'relative',
              overflowX: isCard ? 'hidden' : 'auto',
            }}
          >
            {visibleLines.map((line, index) => (
              <div
                key={`${index}-${line}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isCard ? '22px 1fr' : '28px 1fr',
                  gap: isCard ? 8 : 12,
                  alignItems: 'start',
                  minHeight: isCard ? 16 : 18,
                }}
              >
                <span
                  style={{
                    fontSize: isCard ? '0.56rem' : '0.6rem',
                    fontFamily: T.fontMono,
                    color: 'rgba(148,163,184,0.45)',
                    textAlign: 'right',
                    paddingTop: 1,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontSize: isCard ? '0.68rem' : '0.76rem',
                    fontFamily: T.fontMono,
                    lineHeight: isCard ? 1.5 : 1.7,
                    whiteSpace: isCard ? 'pre-wrap' : 'pre',
                    wordBreak: isCard ? 'break-word' : 'normal',
                  }}
                >
                  {tokenizeSqlLine(line).map((token, tokenIndex) => (
                    <span key={`${index}-${tokenIndex}-${token.text}`} style={tokenStyle(token.kind)}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
