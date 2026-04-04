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
  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 6 : 8,
        alignItems: 'center',
        padding: compact ? '4px 0' : '10px 13px',
        background: compact ? 'transparent' : T.s3,
        border: compact ? 'none' : '1px solid rgba(0,229,255,0.2)',
        borderRadius: compact ? 0 : 10,
        width: '100%',
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
          background: compact ? T.s3 : 'transparent',
          border: compact ? '1px solid rgba(0,229,255,0.15)' : 'none',
          borderRadius: compact ? 7 : 0,
          padding: compact ? '6px 10px' : 0,
          color: T.text,
          fontFamily: T.fontBody,
          fontSize: compact ? '0.74rem' : '0.82rem',
          outline: 'none',
        }}
      />
      {onCancel && (
        <button
          onClick={onCancel}
          title="Cancel"
          style={{
            width: compact ? 28 : 'auto',
            height: compact ? 28 : 'auto',
            padding: compact ? 0 : '6px 10px',
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.text3,
            fontSize: compact ? '0.68rem' : '0.74rem',
            cursor: 'pointer',
            fontFamily: T.fontBody,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.text3; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
        >
          {compact ? <IconClose /> : 'Cancel'}
        </button>
      )}
      <button
        onClick={onCreate}
        disabled={!value.trim() || creating}
        title={ctaLabel}
        style={{
          width: compact ? 28 : 'auto',
          height: compact ? 28 : 'auto',
          padding: compact ? 0 : '6px 12px',
          borderRadius: 7,
          border: 'none',
          background: T.accent,
          color: '#000',
          fontFamily: T.fontBody,
          fontSize: compact ? '0.68rem' : '0.74rem',
          fontWeight: 700,
          cursor: !value.trim() || creating ? 'not-allowed' : 'pointer',
          opacity: !value.trim() || creating ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: compact ? `0 0 10px ${T.accent}33` : 'none',
        }}
      >
        {creating ? (
          <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : compact ? (
          <IconCheck />
        ) : (
          ctaLabel
        )}
      </button>

      {compact && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
    </div>
  );
}
