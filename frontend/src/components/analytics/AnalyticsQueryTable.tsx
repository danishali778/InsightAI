import { useState, useMemo } from 'react';
import { Eye, RefreshCcw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { T } from '../dashboard/tokens';
import type { AnalyticsRecentQuery } from '../../types/api';

interface AnalyticsQueryTableProps {
  queries: AnalyticsRecentQuery[];
}

export function AnalyticsQueryTable({ queries }: AnalyticsQueryTableProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (filter === 'all') return true;
      if (filter === 'success') return q.success === true;
      if (filter === 'failed') return q.success === false && q.error;
      if (filter === 'pending') return q.success === false && !q.error;
      return true;
    });
  }, [queries, filter]);

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
    <div style={{ marginTop: 32, background: '#fff', border: `1px solid rgba(0,0,0,0.08)`, borderRadius: 0, overflow: 'hidden' }}>
      {/* Header & Filters */}
      <div style={{ padding: '24px', borderBottom: `1px solid rgba(0,0,0,0.08)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.text3 }}>
            <Filter size={14} />
            <span style={{ fontSize: '0.62rem', fontWeight: 900, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter:</span>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {(['all', 'success', 'failed', 'pending'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleFilterChange(t)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 0,
                  background: filter === t ? T.text : 'transparent',
                  color: filter === t ? '#fff' : T.text3,
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  border: `1px solid ${filter === t ? T.text : 'rgba(0,0,0,0.08)'}`,
                  marginLeft: -1,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: T.fontMono,
                  letterSpacing: '0.05em',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if(filter !== t) e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { if(filter !== t) e.currentTarget.style.color = T.text3; }}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ color: T.text, fontSize: '0.62rem', fontFamily: T.fontMono, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {filteredQueries.length} <span style={{ color: T.text3 }}>Recorded Records</span>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid rgba(0,0,0,0.08)`, background: 'rgba(0,0,0,0.01)' }}>
              {['INDEX', 'SQL SOURCE', 'CHRONOLOGY', 'DISPOSITION', 'LATENCY', 'ACTIONS'].map((h) => (
                <th key={h} style={{ padding: '16px 24px', fontSize: '0.58rem', fontWeight: 900, color: T.text3, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: T.fontMono }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedQueries.length > 0 ? (
              paginatedQueries.map((q) => (
                <tr key={q.id} style={{ borderBottom: `1px solid rgba(0,0,0,0.03)`, transition: 'background 0.1s' }} 
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.01)'} 
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '20px 24px', fontSize: '0.72rem', fontFamily: T.fontMono, color: T.text, fontWeight: 700 }}>
                    #QX-{q.id.slice(0, 4).toUpperCase()}
                  </td>
                  <td style={{ padding: '20px 24px', maxWidth: 300 }}>
                    <div style={{ 
                      padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 0, 
                      border: `1px solid rgba(0,0,0,0.05)`, color: T.text2, fontSize: '0.68rem', 
                      fontFamily: T.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', fontWeight: 500
                    }}>
                      {q.sql}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '0.72rem', color: T.text, fontFamily: T.fontMono, fontWeight: 700 }}>
                    {new Date(q.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
                    <span style={{ color: T.text3, fontWeight: 400, marginLeft: 8 }}>
                      {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '4px 12px', 
                      borderRadius: 0, 
                      background: q.success ? 'rgba(34,211,165,0.05)' : 'rgba(248,113,113,0.05)', 
                      color: q.success ? T.green : T.red, 
                      fontSize: '0.62rem', 
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      fontFamily: T.fontMono,
                      border: `1px solid ${q.success ? 'rgba(34,211,165,0.1)' : 'rgba(248,113,113,0.1)'}`
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: 0, background: q.success ? T.green : T.red }} />
                      {q.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '0.72rem', color: T.text, fontFamily: T.fontMono, fontWeight: 700 }}>
                    {q.execution_time_ms ? `${(q.execution_time_ms).toFixed(0)}ms` : '--'}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ 
                        background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0,
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: T.text3, transition: 'all 0.15s'
                      }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.color = T.text; }}
                         onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = T.text3; }}
                      >
                        <Eye size={14} />
                      </button>
                      <button style={{ 
                        background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0,
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: T.text3, transition: 'all 0.15s'
                      }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.color = T.text; }}
                         onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = T.text3; }}
                      >
                        <RefreshCcw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '80px 24px', textAlign: 'center', color: T.text3, fontSize: '0.72rem', fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  No records matching current disposition filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: '24px', borderTop: `1px solid rgba(0,0,0,0.08)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.01)' }}>
          <div style={{ color: T.text3, fontSize: '0.62rem', fontFamily: T.fontMono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Showing records <span style={{ color: T.text }}>{(currentPage - 1) * itemsPerPage + 1}</span> — <span style={{ color: T.text }}>{Math.min(currentPage * itemsPerPage, filteredQueries.length)}</span> of <span style={{ color: T.text }}>{filteredQueries.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ 
                padding: '8px 12px', border: `1px solid ${currentPage === 1 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)'}`, 
                borderRadius: 0, background: '#fff', color: currentPage === 1 ? T.text3 : T.text, 
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.62rem', fontWeight: 900,
                fontFamily: T.fontMono, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase'
              }}
            >
              <ChevronLeft size={12} /> Previous
            </button>
            
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 0, 
                    border: `1px solid ${currentPage === i + 1 ? T.text : 'rgba(0,0,0,0.08)'}`, 
                    background: currentPage === i + 1 ? T.text : '#fff', 
                    color: currentPage === i + 1 ? '#fff' : T.text2, 
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    fontFamily: T.fontMono
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ 
                padding: '8px 12px', border: `1px solid ${currentPage === totalPages ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)'}`, 
                borderRadius: 0, background: '#fff', color: currentPage === totalPages ? T.text3 : T.text, 
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.62rem', fontWeight: 900,
                fontFamily: T.fontMono, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase'
              }}
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
