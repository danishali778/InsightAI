import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { QueryCard } from './QueryCard';
import { QueryDetailPanel } from './QueryDetailPanel';
import { PublicLibraryPanel } from './PublicLibraryPanel';
import type { QueryListProps } from '../../types/library';

type SortKey = 'last_run' | 'name_az' | 'most_run' | 'newest' | 'oldest';

function sortQueries(queries: QueryListProps['queries'], key: SortKey) {
  return [...queries].sort((a, b) => {
    switch (key) {
      case 'last_run': return (b.last_run_at ?? '').localeCompare(a.last_run_at ?? '');
      case 'name_az': return a.title.localeCompare(b.title);
      case 'most_run': return (b.run_count ?? 0) - (a.run_count ?? 0);
      case 'newest': return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      case 'oldest': return (a.created_at ?? '').localeCompare(b.created_at ?? '');
      default: return 0;
    }
  });
}

export function QueryList({ queries, stats, selectedId, onSelect, onDelete, onRefresh, activeFolder }: QueryListProps & { activeFolder: string }) {
  const selectedQuery = queries.find(q => q.id === selectedId) || null;
  const [detailTab, setDetailTab] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortKey>('last_run');

  if (activeFolder === 'Public Library') {
    return <PublicLibraryPanel onCloned={onRefresh} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.bg }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 20px', background: T.s1, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: T.text3, fontFamily: T.fontMono, flex: 1 }}>
            <span>Library</span> <span style={{ opacity: 0.4 }}>›</span> <span style={{ color: T.text2 }}>{activeFolder}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px', color: T.text2, fontSize: '0.72rem', fontFamily: T.fontMono, outline: 'none', cursor: 'pointer', appearance: 'none' as const }}>
              <option value="last_run">Sort: Last Run</option>
              <option value="name_az">Sort: Name A–Z</option>
              <option value="most_run">Sort: Most Run</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }} className="custom-scroll">
          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { val: String(stats.total_queries), label: 'total queries' },
              { val: String(stats.scheduled), label: 'scheduled' },
              { val: String(stats.total_runs), label: 'total runs' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: '0.72rem', fontFamily: T.fontMono }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{s.val}</span>
                <span style={{ color: T.text3 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Grid / Empty State */}
          {queries.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {sortQueries(queries, sortBy).map((q, index) => (
                <QueryCard
                  key={q.id}
                  data={q}
                  isSelected={selectedId === q.id}
                  onClick={() => { setDetailTab(undefined); onSelect(q.id); }}
                  onScheduleClick={() => { setDetailTab('schedule'); onSelect(q.id); }}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.text3 }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text2, marginBottom: 6 }}>No saved queries yet</div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
                Save queries from the Chat page or use the API to add them to your library.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <QueryDetailPanel
        query={selectedQuery}
        onClose={() => { setDetailTab(undefined); onSelect(null); }}
        onDelete={onDelete}
        onRefresh={onRefresh}
        initialTab={detailTab}
      />
    </div>
  );
}
