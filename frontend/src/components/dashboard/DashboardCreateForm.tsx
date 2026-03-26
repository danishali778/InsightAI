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
        gap: 8,
        alignItems: 'center',
        padding: compact ? '6px 4px' : '10px 13px',
        background: compact ? 'transparent' : T.s3,
        border: compact ? 'none' : '1px solid rgba(0,229,255,0.2)',
        borderRadius: compact ? 0 : 10,
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
          background: compact ? T.s3 : 'transparent',
          border: compact ? '1px solid rgba(0,229,255,0.2)' : 'none',
          borderRadius: compact ? 6 : 0,
          padding: compact ? '6px 8px' : 0,
          color: T.text,
          fontFamily: T.fontBody,
          fontSize: compact ? '0.75rem' : '0.82rem',
          outline: 'none',
        }}
      />
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            padding: compact ? '5px 8px' : '6px 10px',
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.text3,
            fontSize: compact ? '0.68rem' : '0.74rem',
            cursor: 'pointer',
            fontFamily: T.fontBody,
          }}
        >
          Cancel
        </button>
      )}
      <button
        onClick={onCreate}
        disabled={!value.trim() || creating}
        style={{
          padding: compact ? '5px 10px' : '6px 12px',
          borderRadius: 6,
          border: 'none',
          background: T.accent,
          color: '#000',
          fontFamily: T.fontBody,
          fontSize: compact ? '0.68rem' : '0.74rem',
          fontWeight: 700,
          cursor: !value.trim() || creating ? 'not-allowed' : 'pointer',
          opacity: !value.trim() || creating ? 0.5 : 1,
        }}
      >
        {creating ? 'Creating...' : ctaLabel}
      </button>
    </div>
  );
}
