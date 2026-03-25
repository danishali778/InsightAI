import { T } from '../dashboard/tokens';

export interface QueryData {
  id: string;
  title: string;
  sql: string;
  description: string;
  folder_name: string;
  connection_id: string | null;
  icon: string;
  icon_bg: string;
  tags: string[];
  schedule: string | null;
  created_at: string;
  updated_at: string;
  run_count: number;
  last_run_at: string | null;
}

interface QueryCardProps {
  data: QueryData;
  isSelected?: boolean;
  onClick?: () => void;
}

function timeAgo(ts: string | null): string {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  revenue: { bg: T.accentDim, color: T.accent, border: 'rgba(0,229,255,0.2)' },
  churn: { bg: T.purpleDim, color: T.purple, border: 'rgba(124,58,255,0.2)' },
  users: { bg: T.greenDim, color: T.green, border: 'rgba(34,211,165,0.2)' },
  daily: { bg: T.yellowDim, color: T.yellow, border: 'rgba(245,158,11,0.2)' },
  critical: { bg: T.redDim, color: T.red, border: 'rgba(248,113,113,0.2)' },
};

const DEFAULT_TAG = { bg: 'transparent', color: T.text3, border: T.border };

export function QueryCard({ data, isSelected, onClick }: QueryCardProps) {
  return (
    <div onClick={onClick} style={{
      background: T.s1, border: `1px solid ${isSelected ? 'rgba(0,229,255,0.4)' : T.border}`, borderRadius: 12,
      overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      position: 'relative',
      boxShadow: isSelected ? '0 0 0 1px rgba(0,229,255,0.15)' : 'none',
    }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
    >
      {/* Top row */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, background: data.icon_bg }}>
          {data.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>
            {data.folder_name}{data.connection_id ? ` · ${data.connection_id}` : ''}
          </div>
        </div>
      </div>

      {/* SQL Preview (plain text) */}
      <div style={{ margin: '0 16px', padding: '10px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: T.fontMono, fontSize: '0.7rem', lineHeight: 1.7, color: '#6b7a99', overflow: 'hidden', maxHeight: 72, position: 'relative', whiteSpace: 'pre-wrap' }}>
        {data.sql.substring(0, 200)}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(transparent, rgba(0,0,0,0.25))' }} />
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px 8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {data.tags.map(t => {
            const colors = TAG_COLORS[t] || DEFAULT_TAG;
            return (
              <span key={t} style={{
                padding: '1px 7px', borderRadius: 10, fontSize: '0.62rem', fontFamily: T.fontMono,
                border: `1px solid ${colors.border}`, background: colors.bg, color: colors.color
              }}>
                {t}
              </span>
            );
          })}
        </div>
        <div style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: T.text3, marginLeft: 'auto' }}>
          {data.run_count} runs
        </div>
      </div>

      {/* Timing row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 10px' }}>
        {data.schedule && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', fontFamily: T.fontMono, color: T.yellow, background: T.yellowDim, border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '1px 6px', whiteSpace: 'nowrap' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.yellow, animation: 'pulseAlpha 2s infinite' }} />
            {data.schedule}
          </div>
        )}
        <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, marginLeft: 'auto' }}>
          {timeAgo(data.last_run_at || data.updated_at)}
        </span>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${T.border}`, background: T.s2 }}>
        <ActionBtn label="▶ Run" hoverColor={T.accent} />
        <ActionBtn label="✏ Edit" />
        <ActionBtn label="📅 Schedule" hoverColor={T.yellow} />
        <ActionBtn label="🔗 Share" hoverColor={T.purple} isLast />
      </div>
      
      <style>{`
        @keyframes pulseAlpha { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

function ActionBtn({ label, hoverColor, isLast }: { label: string, hoverColor?: string, isLast?: boolean }) {
  return (
    <button style={{
      flex: 1, padding: '8px 6px', background: 'transparent', border: 'none',
      color: T.text3, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.15s',
      fontFamily: T.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 4, borderRight: isLast ? 'none' : `1px solid ${T.border}`
    }}
      onMouseEnter={e => { e.currentTarget.style.background = T.s3; e.currentTarget.style.color = hoverColor || T.text2; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
    >
      {label}
    </button>
  );
}
