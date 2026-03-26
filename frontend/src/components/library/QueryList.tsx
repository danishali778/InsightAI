import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { QueryCard } from './QueryCard';
import { QueryDetailPanel } from './QueryDetailPanel';
import type { QueryListProps } from '../../types/library';

export function QueryList({ queries, stats, selectedId, onSelect, onDelete, onRefresh }: QueryListProps) {
  const selectedQuery = queries.find(q => q.id === selectedId) || null;
  const [detailTab, setDetailTab] = useState<string | undefined>(undefined);

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
              <option>Sort: Newest</option>
              <option>Sort: Oldest</option>
            </select>
            <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden' }}>
              <button style={{ width: 30, height: 28, background: T.s3, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2, fontSize: '0.75rem' }}>⊞</button>
              <button style={{ width: 30, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.75rem' }}>≡</button>
            </div>
            {/* Filter button — STATIC */}
            <button title="Filter" style={{
              width: 32, height: 32, borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </button>
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
              { val: '4', label: 'shared' }, /* STATIC */
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: '0.72rem', fontFamily: T.fontMono }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{s.val}</span>
                <span style={{ color: T.text3 }}>{s.label}</span>
              </div>
            ))}
            {/* Connection status — STATIC */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: '0.72rem', fontFamily: T.fontMono, marginLeft: 'auto' }}>
              <span style={{ color: T.green, fontWeight: 600 }}>●</span>
              <span style={{ color: T.text3 }}>prod-postgres connected</span>
            </div>
          </div>

          {/* Grid / Empty State */}
          {queries.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {queries.map((q, index) => (
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
