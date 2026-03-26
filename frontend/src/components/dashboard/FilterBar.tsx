import { T } from './tokens';

const FILTERS = [
  { label: 'All Regions', active: true },
  { label: 'All Products', active: false },
  { label: 'Status: Completed', active: false },
];

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export function FilterBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      {FILTERS.map((filter) => (
        <div
          key={filter.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: filter.active ? T.accentDim : T.s1,
            border: `1px solid ${filter.active ? 'rgba(0,229,255,0.3)' : T.border}`,
            borderRadius: 20,
            padding: '5px 12px',
            fontSize: '0.72rem',
            color: filter.active ? T.accent : T.text2,
            cursor: 'pointer',
            fontFamily: T.fontMono,
          }}
        >
          {filter.label}
          <ChevronDown />
        </div>
      ))}

      <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: T.s1,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: '5px 12px',
          fontSize: '0.72rem',
          color: T.text2,
          cursor: 'pointer',
          fontFamily: T.fontMono,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Filter
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono, cursor: 'pointer' }}>
        <RefreshIcon />
        Last updated 2 min ago
      </div>
    </div>
  );
}
