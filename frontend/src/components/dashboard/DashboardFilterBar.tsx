import React, { useState } from 'react';
import { T } from './tokens';

interface DashboardFilterBarProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onApply: () => void;
}

export function DashboardFilterBar({ filters, onFiltersChange, onApply }: DashboardFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const setFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="dash-section" style={{
      background: 'rgba(11,17,32,0.4)',
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: '12px 16px',
      marginBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'rgba(0,229,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', color: T.accent
          }}>
            ▽
          </div>
          <span style={{ 
            fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.85rem',
            color: T.text, letterSpacing: 0.2
          }}>
            Global Runtime Filters
          </span>
          {hasFilters && (
            <span style={{
              background: T.accentDim, color: T.accent, fontSize: '0.65rem',
              fontWeight: 800, padding: '2px 8px', borderRadius: 20,
              fontFamily: T.fontMono, border: '1px solid rgba(0,229,255,0.2)'
            }}>
              {Object.keys(filters).length} ACTIVE
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent', border: 'none', color: T.text3,
              fontSize: '0.72rem', cursor: 'pointer', fontFamily: T.fontMono,
              padding: '4px 8px'
            }}
          >
            {isExpanded ? '[ COLLAPSE ]' : '[ EDIT FILTERS ]'}
          </button>
          
          <button 
            onClick={onApply}
            style={{
              background: 'linear-gradient(135deg, #00E5FF, #7C3AFF)',
              border: 'none', borderRadius: 8, padding: '6px 16px',
              color: 'white', fontWeight: 700, fontSize: '0.78rem',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,229,255,0.2)'
            }}
          >
            Apply to All Widgets
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono }}>
              Date Range (Days)
            </label>
            <select 
              value={filters.date_range || '30'}
              onChange={(e) => setFilter('date_range', e.target.value)}
              style={{
                background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '8px 12px', color: T.text, fontSize: '0.8rem', outline: 'none'
              }}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono }}>
              Status Filter
            </label>
            <input 
              placeholder="e.g. active, completed"
              value={filters.status || ''}
              onChange={(e) => setFilter('status', e.target.value)}
              style={{
                background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '8px 12px', color: T.text, fontSize: '0.8rem', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono }}>
              Limit Rows
            </label>
            <input 
              type="number"
              placeholder="100"
              value={filters.limit || ''}
              onChange={(e) => setFilter('limit', e.target.value)}
              style={{
                background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '8px 12px', color: T.text, fontSize: '0.8rem', outline: 'none'
              }}
            />
          </div>
        </div>
      )}

      {hasFilters && !isExpanded && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(filters).map(([key, value]) => (
            <div key={key} style={{
              background: T.s3, border: `1px solid ${T.border}`, borderRadius: 6,
              padding: '2px 8px', fontSize: '0.7rem', color: T.text2,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ color: T.text3 }}>{key}:</span>
              <span style={{ color: T.accent, fontWeight: 600 }}>{String(value)}</span>
              <button 
                onClick={() => removeFilter(key)}
                style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', padding: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
