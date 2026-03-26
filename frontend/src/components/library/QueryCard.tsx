import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { highlightSqlInline } from '../../utils/sqlHighlight';
import type { LibraryQuery } from '../../types/library';

interface QueryCardProps {
  data: LibraryQuery;
  isSelected?: boolean;
  onClick?: () => void;
  onScheduleClick?: () => void;
  index?: number;
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
  customers: { bg: T.purpleDim, color: T.purple, border: 'rgba(124,58,255,0.2)' },
  funnel: { bg: T.yellowDim, color: T.yellow, border: 'rgba(245,158,11,0.2)' },
  marketing: { bg: 'rgba(255,255,255,0.02)', color: T.text3, border: T.border },
};
const DEFAULT_TAG = { bg: 'rgba(255,255,255,0.02)', color: T.text3, border: T.border };

function inferIcon(data: LibraryQuery): { icon: string; bg: string } {
  const s = `${data.title} ${data.sql} ${data.tags.join(' ')}`.toLowerCase();
  if (s.includes('revenue') || s.includes('sales')) return { icon: '💰', bg: 'rgba(0,229,255,0.1)' };
  if (s.includes('customer') || s.includes('user') || s.includes('client')) return { icon: '👤', bg: 'rgba(124,58,255,0.1)' };
  if (s.includes('churn') || s.includes('cancel')) return { icon: '📉', bg: 'rgba(248,113,113,0.1)' };
  if (s.includes('dau') || s.includes('active user') || s.includes('session')) return { icon: '👥', bg: 'rgba(34,211,165,0.1)' };
  if (s.includes('cart') || s.includes('funnel') || s.includes('conversion')) return { icon: '🛒', bg: 'rgba(245,158,11,0.1)' };
  if (s.includes('marketing') || s.includes('signup') || s.includes('utm')) return { icon: '📣', bg: 'rgba(192,132,252,0.1)' };
  if (s.includes('product') || s.includes('inventory')) return { icon: '📦', bg: 'rgba(0,229,255,0.1)' };
  if (s.includes('order') || s.includes('shipment')) return { icon: '📋', bg: 'rgba(34,211,165,0.1)' };
  if (s.includes('region') || s.includes('country') || s.includes('geo')) return { icon: '🌐', bg: 'rgba(59,130,246,0.1)' };
  return { icon: data.icon || '📄', bg: data.icon_bg || 'rgba(148,163,184,0.1)' };
}

export function QueryCard({ data, isSelected, onClick, onScheduleClick, index = 0 }: QueryCardProps) {
  const [hovered, setHovered] = useState(false);
  const connectionLabel = data.connection_id || 'No connection';
  const folderLabel = data.folder_name || 'Uncategorized';
  const isScheduled = Boolean(data.schedule_label);
  const visual = inferIcon(data);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.s1,
        border: `1px solid ${isSelected ? 'rgba(0,229,255,0.4)' : hovered ? 'rgba(0,229,255,0.2)' : T.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        transform: hovered && !isSelected ? 'translateY(-2px)' : 'none',
        boxShadow: isSelected
          ? '0 0 0 1px rgba(0,229,255,0.15)'
          : hovered
            ? '0 8px 30px rgba(0,0,0,0.3)'
            : 'none',
        animation: `fadeUp 0.35s ease both`,
        animationDelay: `${index * 0.03}s`,
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', flexShrink: 0, background: visual.bg,
        }}>
          {visual.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text,
            marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {data.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>
            {folderLabel} · {connectionLabel}
          </div>
        </div>
        {/* Menu button */}
        <button style={{
          width: 24, height: 24, borderRadius: 6, background: 'transparent',
          border: `1px solid ${hovered ? T.border : 'transparent'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.text3, transition: 'all 0.15s', flexShrink: 0, fontSize: '0.8rem',
          opacity: hovered ? 1 : 0,
        }}>⋯</button>
      </div>

      {/* SQL Preview */}
      <div style={{
        margin: '0 16px', padding: '10px 12px',
        background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, borderRadius: 8,
        fontFamily: T.fontMono, fontSize: '0.7rem', lineHeight: 1.7,
        overflow: 'hidden', maxHeight: 72, position: 'relative',
      }}>
        {highlightSqlInline(data.sql, 'card')}
        {/* Fade gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 24,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.25))', pointerEvents: 'none',
        }} />
      </div>

      {/* Meta row 1: connection + tags + run count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px 8px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem',
          fontFamily: T.fontMono, color: T.text3,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.green }} />
          {connectionLabel}
        </div>
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {data.tags.slice(0, 3).map((t) => {
            const colors = TAG_COLORS[t] || DEFAULT_TAG;
            return (
              <span key={t} style={{
                padding: '1px 7px', borderRadius: 10, fontSize: '0.62rem', fontFamily: T.fontMono,
                border: `1px solid ${colors.border}`, background: colors.bg, color: colors.color,
              }}>{t}</span>
            );
          })}
        </div>
        <div style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: T.text3, marginLeft: 'auto' }}>
          {data.run_count} runs
        </div>
      </div>

      {/* Meta row 2: schedule + timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 10px' }}>
        {isScheduled && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', fontFamily: T.fontMono,
            color: T.yellow, background: T.yellowDim,
            border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '1px 6px', whiteSpace: 'nowrap',
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.yellow, animation: 'lp 2s infinite' }} />
            {data.schedule_label}
          </div>
        )}
        <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, marginLeft: 'auto' }}>
          {timeAgo(data.last_run_at || data.updated_at)}
        </span>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${T.border}`, background: T.s2 }}>
        <ActionBtn label="Run" icon="▶" hoverColor={T.accent} />
        <ActionBtn label="Edit" icon="✏" />
        <ActionBtn label="Schedule" icon="📅" hoverColor={T.yellow} onClick={onScheduleClick} />
        <ActionBtn label="Share" icon="🔗" hoverColor={T.purple} isLast />
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

function ActionBtn({ label, icon, hoverColor, isLast, onClick }: { label: string; icon: string; hoverColor?: string; isLast?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      style={{
        flex: 1, padding: '8px 6px', background: 'transparent', border: 'none',
        color: T.text3, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: T.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        borderRight: isLast ? 'none' : `1px solid ${T.border}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.s3; e.currentTarget.style.color = hoverColor || T.text2; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
    >
      {icon} {label}
    </button>
  );
}
