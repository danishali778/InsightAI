import { T } from '../dashboard/tokens';
import type { LibraryStats } from '../../types/api';

export function LibraryTopbar({ stats }: { stats?: LibraryStats }) {
  return (
    <div style={{
      height: 52, flexShrink: 0, background: 'rgba(11,17,32,0.97)', borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', backdropFilter: 'blur(20px)', fontFamily: T.fontBody
    }}>
      <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', color: T.text }}>Query Library</div>
      <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>{stats ? `${stats.total_queries} queries across ${stats.folders} folders` : ''}</div>
    </div>
  );
}
