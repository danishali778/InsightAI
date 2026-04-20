import { T } from './tokens';

interface DashboardCreateFormProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  onCancel?: () => void;
  creating?: boolean;
  compact?: boolean;
  placeholder?: string;
  ctaLabel?: string;
}

/* ── SVG Icons ─────────────────────────────────────────────────── */

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function DashboardCreateForm({
  value,
  onChange,
  onCreate,
  onCancel,
  creating = false,
  compact = false,
  placeholder = 'Dashboard name',
  ctaLabel = 'Create',
}: DashboardCreateFormProps) {
  const D = {
    surface: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.1)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#0ea5e9',
    accentGlow: 'rgba(14,165,233,0.15)',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 8 : 12,
        alignItems: 'center',
        padding: compact ? '4px' : '14px 18px',
        background: compact ? 'transparent' : 'rgba(15,23,42,0.6)',
        border: compact ? 'none' : `1px solid ${D.border}`,
        borderRadius: compact ? 0 : 16,
        width: '100%',
        backdropFilter: compact ? 'none' : 'blur(10px)',
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCreate();
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          background: D.surface,
          border: `1px solid ${D.border}`,
          borderRadius: 12,
          padding: '10px 14px',
          color: D.text,
          fontFamily: T.fontBody,
          fontSize: compact ? '0.8rem' : '0.88rem',
          outline: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = D.accent;
          e.currentTarget.style.boxShadow = `0 0 15px ${D.accentGlow}, inset 0 2px 4px rgba(0,0,0,0.1)`;
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = D.border;
          e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
        }}
      />
      {onCancel && (
        <button
          onClick={onCancel}
          title="Cancel"
          style={{
            width: compact ? 36 : 'auto',
            height: compact ? 36 : 'auto',
            padding: compact ? 0 : '8px 14px',
            borderRadius: 12,
            border: `1px solid ${D.border}`,
            background: 'rgba(255,255,255,0.02)',
            color: D.textMuted,
            fontSize: compact ? '0.74rem' : '0.82rem',
            cursor: 'pointer',
            fontFamily: T.fontBody,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.textMuted; }}
        >
          {compact ? <IconClose /> : 'Cancel'}
        </button>
      )}
      <button
        onClick={onCreate}
        disabled={!value.trim() || creating}
        title={ctaLabel || 'Confirm'}
        style={{
          width: compact ? 36 : 'auto',
          height: compact ? 36 : 'auto',
          padding: compact ? 0 : '8px 16px',
          borderRadius: 12,
          border: 'none',
          background: T.accent,
          color: '#000',
          fontFamily: T.fontHead,
          fontSize: compact ? '0.78rem' : '0.88rem',
          fontWeight: 800,
          cursor: !value.trim() || creating ? 'not-allowed' : 'pointer',
          opacity: !value.trim() || creating ? 0.4 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: !value.trim() || creating ? 'none' : `0 4px 12px ${D.accentGlow}`,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!creating && value.trim()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { if (!creating) e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {creating ? (
          <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : compact ? (
          <IconCheck />
        ) : (
          ctaLabel || 'Confirm'
        )}
      </button>

      {compact && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
    </div>
  );
}
