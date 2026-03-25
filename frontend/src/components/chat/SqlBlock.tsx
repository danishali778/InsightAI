import { useState } from 'react';
import { T } from '../dashboard/tokens';

interface SqlBlockProps { sql: string; }

export function SqlBlock({ sql }: SqlBlockProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple SQL keyword highlighting
  const highlighted = sql
    .replace(/(SELECT|FROM|WHERE|JOIN|ON|AND|OR|GROUP BY|ORDER BY|AS|DESC|ASC|LIMIT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|SET|VALUES|INTO|HAVING|DISTINCT|UNION|ALL|IN|NOT|NULL|IS|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|WITH|OVER|PARTITION BY|LEFT|RIGHT|INNER|OUTER|CROSS|FULL)\b/gi, '<span style="color:#00e5ff">$1</span>')
    .replace(/(SUM|COUNT|AVG|MAX|MIN|ROUND|LAG|LEAD|ROW_NUMBER|RANK|DENSE_RANK|COALESCE|CAST|EXTRACT)\b/gi, '<span style="color:#c084fc">$1</span>')
    .replace(/'([^']*)'/g, '<span style="color:#86efac">\'$1\'</span>')
    .replace(/(\b\d+\.?\d*\b)/g, '<span style="color:#fb923c">$1</span>')
    .replace(/(--[^\n]*)/g, '<span style="color:#4a5568;font-style:italic">$1</span>');

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      {/* Header */}
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
        background: T.s2, cursor: 'pointer', transition: 'background 0.15s', userSelect: 'none',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = T.s3; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.s2; }}
      >
        <span style={{
          fontSize: '0.65rem', fontFamily: T.fontMono, fontWeight: 600, letterSpacing: 1,
          color: T.accent, background: T.accentDim, border: '1px solid rgba(0,229,255,0.2)',
          padding: '2px 8px', borderRadius: 4,
        }}>SQL</span>
        <span style={{ fontSize: '0.78rem', color: T.text2, flex: 1 }}>View generated query</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleCopy} style={{
            padding: '4px 10px', borderRadius: 5, border: `1px solid ${T.border}`,
            background: 'transparent', color: T.text3, fontSize: '0.7rem',
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.fontBody,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>{copied ? '✓ Copied' : '⎘ Copy'}</button>
        </div>
        <span style={{ fontSize: '0.7rem', color: T.text3, transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
      </div>

      {/* Code */}
      {open && (
        <div style={{
          padding: '16px 20px', fontFamily: T.fontMono, fontSize: '0.78rem', lineHeight: 1.9,
          background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${T.border}`, color: T.text2,
          whiteSpace: 'pre-wrap', overflowX: 'auto',
        }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  );
}
