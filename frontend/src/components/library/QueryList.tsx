import { T } from '../dashboard/tokens';
import { QueryCard } from './QueryCard';
import type { QueryData } from './QueryCard';
import { QueryDetailPanel } from './QueryDetailPanel';

interface QueryListProps {
  queries: QueryData[];
  stats: { total_queries: number; scheduled: number; total_runs: number; folders: number };
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function QueryList({ queries, stats, selectedId, onSelect, onDelete, onRefresh }: QueryListProps) {
  const selectedQuery = queries.find(q => q.id === selectedId) || null;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.bg }}>
        
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', background: T.s1, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: T.text3, fontFamily: T.fontMono, flex: 1 }}>
            <span>Library</span> <span style={{ opacity: 0.4 }}>›</span> <span style={{ color: T.text2 }}>All Queries</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' }}>
            <select style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px', color: T.text2, fontSize: '0.72rem', fontFamily: T.fontMono, outline: 'none', cursor: 'pointer', appearance: 'none' as const }}>
              <option>Sort: Last Run</option>
              <option>Sort: Name A–Z</option>
              <option>Sort: Most Run</option>
            </select>
            <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden' }}>
              <button style={{ width: 30, height: 28, background: T.s3, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2, fontSize: '0.75rem' }}>⊞</button>
              <button style={{ width: 30, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.75rem' }}>≡</button>
            </div>
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
              { val: String(stats.folders), label: 'folders' },
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
              {queries.map(q => (
                <QueryCard 
                  key={q.id} 
                  data={q} 
                  isSelected={selectedId === q.id} 
                  onClick={() => onSelect(q.id)} 
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
        onClose={() => onSelect(null)}
        onDelete={onDelete}
        onRefresh={onRefresh}
      />
    </div>
  );
}
