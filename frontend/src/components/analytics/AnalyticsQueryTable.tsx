import { useState, useMemo } from 'react';
import { T } from '../dashboard/tokens';
import type { AnalyticsRecentQuery } from '../../types/api';

interface AnalyticsQueryTableProps {
  queries: AnalyticsRecentQuery[];
}

export function AnalyticsQueryTable({ queries }: AnalyticsQueryTableProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtering Logic
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (filter === 'all') return true;
      if (filter === 'success') return q.success === true;
      if (filter === 'failed') return q.success === false && q.error;
      if (filter === 'pending') return q.success === false && !q.error; // Placeholder logic for pending
      return true;
    });
  }, [queries, filter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);
  const paginatedQueries = filteredQueries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div style={{ marginTop: 24, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      {/* Header & Filters */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'success', 'failed', 'pending'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleFilterChange(t)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: filter === t ? T.accent : T.s2,
                color: filter === t ? '#fff' : T.text2,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: filter === t ? 'none' : `1px solid ${T.border}`,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {t === 'all' ? 'All Queries' : t === 'success' ? 'Successful' : t}
            </button>
          ))}
        </div>
        <div style={{ color: T.text3, fontSize: '0.8rem', fontFamily: T.fontMono }}>
          {filteredQueries.length} total results
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.s2 }}>
              {['QUERY ID', 'SQL PREVIEW', 'TIMESTAMP', 'STATUS', 'RUNTIME', 'ACTIONS'].map((h) => (
                <th key={h} style={{ padding: '14px 24px', fontSize: '0.68rem', fontWeight: 600, color: T.text3, letterSpacing: 1.2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedQueries.length > 0 ? (
              paginatedQueries.map((q) => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.background = T.s2} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '18px 24px', fontSize: '0.8rem', fontFamily: T.fontMono, color: T.text2 }}>
                    #QX-{q.id.slice(0, 4)}
                  </td>
                  <td style={{ padding: '18px 24px', maxWidth: 300 }}>
                    <div style={{ padding: '8px 12px', background: T.s1, borderRadius: 8, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.75rem', fontFamily: T.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.sql}
                    </div>
                  </td>
                  <td style={{ padding: '18px 24px', fontSize: '0.8rem', color: T.text2 }}>
                    {new Date(q.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      padding: '4px 10px', 
                      borderRadius: 20, 
                      background: q.success ? 'rgba(34,211,165,0.1)' : 'rgba(248,113,113,0.1)', 
                      color: q.success ? T.green : T.red, 
                      fontSize: '0.7rem', 
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: q.success ? T.green : T.red }} />
                      {q.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </td>
                  <td style={{ padding: '18px 24px', fontSize: '0.8rem', color: T.text2, fontFamily: T.fontMono }}>
                    {q.execution_time_ms ? `${(q.execution_time_ms / 1000).toFixed(2)}s` : '--'}
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', gap: 12, color: T.text3 }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} title="View">👁️</button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} title="Re-run">🔄</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', color: T.text3, fontSize: '0.9rem' }}>
                  No queries found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Fix */}
      {totalPages > 1 && (
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: T.text3, fontSize: '0.8rem' }}>
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredQueries.length)}</strong> of <strong>{filteredQueries.length}</strong> queries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.s1, color: currentPage === 1 ? T.text3 : T.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
            >
              Previous
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    border: 'none', 
                    background: currentPage === i + 1 ? T.accent : 'transparent', 
                    color: currentPage === i + 1 ? '#000' : T.text2, 
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.s1, color: currentPage === totalPages ? T.text3 : T.text, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
