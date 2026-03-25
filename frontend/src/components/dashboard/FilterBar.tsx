import { T } from './tokens';

export function FilterBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>Filters:</span>
      {['All Regions ▾', 'All Products ▾', 'Status: Completed ▾'].map((f, i) => (
        <div key={f} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: i === 0 ? T.accentDim : T.s1,
          border: `1px solid ${i === 0 ? 'rgba(0,229,255,0.3)' : T.border}`,
          borderRadius: 20, padding: '5px 12px',
          fontSize: '0.72rem', color: i === 0 ? T.accent : T.text2,
          cursor: 'pointer', fontFamily: T.fontMono,
        }}>{f}</div>
      ))}
      <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: T.s1, border: `1px solid ${T.border}`,
        borderRadius: 20, padding: '5px 12px',
        fontSize: '0.72rem', color: T.text2, cursor: 'pointer', fontFamily: T.fontMono,
      }}>+ Add Filter</div>
      <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono, cursor: 'pointer' }}>
        🔄 Last updated 2 min ago
      </div>
    </div>
  );
}
