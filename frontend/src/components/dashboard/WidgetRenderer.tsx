import { useState, useRef, useEffect } from 'react';
import { refreshDashboardWidget, getWidgetInsight } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { T } from './tokens';
import type { DashboardWidgetItem } from '../../types/dashboard';
import { resolveWidgetSize } from '../../types/dashboard';
import type { UpdateDashboardWidgetRequest } from '../../types/api';
import { DashboardBarChart } from './charts/DashboardBarChart';
import { DashboardLineChart } from './charts/DashboardLineChart';
import { DashboardAreaChart } from './charts/DashboardAreaChart';
import { DashboardPieChart } from './charts/DashboardPieChart';


const CHART_TYPES = [
  { key: 'bar', label: 'Bar', icon: '▥' },
  { key: 'line', label: 'Line', icon: '⟋' },
  { key: 'area', label: 'Area', icon: '▨' },
  { key: 'pie', label: 'Pie', icon: '◕' },
] as const;

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

/* ── SVG Icons ───────────────────────────────────────────────── */

function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconRefresh({ spinning }: { spinning?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'refresh-spin' : ''}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconResize() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function IconZap({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* ── Utility Functions ───────────────────────────────────────── */

function formatColHeader(col: string) {
  return col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMetric(value: unknown) {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  }
  return String(value ?? '-');
}

function widgetBadge(vizType: string) {
  const map: Record<string, { bg: string; color: string; label: string; borderColor: string }> = {
    kpi:     { bg: '#f0fdf4',   color: '#16a34a',  label: 'KPI',     borderColor: '#bbf7d0' },
    bar:     { bg: '#f0f9ff',   color: '#0284c7',  label: 'BAR',     borderColor: '#bae6fd' },
    line:    { bg: '#f5f3ff',   color: '#7c3aed',  label: 'LINE',    borderColor: '#ddd6fe' },
    area:    { bg: '#f5f3ff',   color: '#7c3aed',  label: 'AREA',    borderColor: '#ddd6fe' },
    scatter: { bg: '#fffbeb',   color: '#d97706',  label: 'SCATTER', borderColor: '#fef3c7' },
    donut:   { bg: '#f0f9ff',   color: '#0284c7',  label: 'DONUT',   borderColor: '#bae6fd' },
    table:   { bg: '#f8fafc',   color: '#64748b',  label: 'TABLE',   borderColor: '#e2e8f0' },
  };
  return map[vizType] || map.table;
}

function inferChangePercent(rows: Array<Record<string, unknown>>, key?: string) {
  if (!rows.length || !key) return null;
  const first = Number(rows[0][key] ?? 0);
  const last = Number(rows[rows.length - 1][key] ?? 0);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
}


/* ── Premium UI Helpers ───────────────────────────────────────── */

function LiveIndicator() {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 6, 
      color: '#22d3a5', fontSize: '0.62rem', fontWeight: 600,
      fontFamily: T.fontMono, marginLeft: 8
    }}>
      <span className="live-indicator-pulse" style={{
        width: 6, height: 6, borderRadius: '50%', background: '#22d3a5',
        boxShadow: '0 0 8px rgba(34,211,165,0.6)'
      }} />
      LIVE
    </span>
  );
}

function Typewriter({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <MarkdownLite text={displayedText} />;
}

function MarkdownLite({ text }: { text: string }) {
  // Simple regex-based formatter for **bold**, - list, and line breaks
  const parts = text.split(/(\*\*.*?\*\*|- .*?\n|\n)/g);
  
  return (
    <div style={{ lineHeight: 1.6 }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: T.text, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('- ')) {
          return <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '4px 0' }}>
            <span style={{ color: T.accent }}>•</span>
            <span>{part.slice(2)}</span>
          </div>;
        }
        if (part === '\n') {
          return <br key={i} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

/* ── Table Viz ────────────────────────────────────────────────── */

function TableViz({ columns, rows, compact }: { columns: string[]; rows: Array<Record<string, unknown>>; compact: boolean }) {
  const visible = rows.slice(0, compact ? 6 : 10);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{
                background: '#f8fafc', color: T.text2, fontFamily: T.fontMono,
                fontSize: '0.64rem', textTransform: 'uppercase', textAlign: 'left',
                padding: '10px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                letterSpacing: 0.5,
              }}>
                {formatColHeader(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr
              key={index}
              style={{ transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((col) => (
                <td key={col} style={{
                  padding: '9px 12px', borderBottom: `1px solid ${T.border}`,
                  color: T.text2, fontFamily: T.fontMono,
                  maxWidth: compact ? 180 : 240,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {row[col] === null || row[col] === undefined || row[col] === ''
                    ? <span style={{ color: T.text3, fontStyle: 'italic', opacity: 0.6 }}>-- no value --</span>
                    : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > visible.length && (
        <div style={{
          padding: '8px 12px', fontSize: '0.68rem',
          color: T.text3, fontFamily: T.fontMono, textAlign: 'center',
          borderTop: `1px solid ${T.border}`,
        }}>
          +{rows.length - visible.length} more rows
        </div>
      )}
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────── */

function Sparkline({ rows, yColumn, color }: { rows: Array<Record<string, unknown>>; yColumn?: string; color: string }) {
  if (!yColumn || rows.length < 2) {
    return <div style={{ height: 40, borderTop: `1px dashed ${T.border}`, marginTop: 4 }} />;
  }
  const values = rows.slice(-16).map((r) => Number(r[yColumn] ?? 0));
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;
  const w = 260, h = 46;
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * (w - 2) + 1;
    const y = h - ((v - minV) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 40 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${points} ${w - 1},${h} 1,${h}`}
        fill={`url(#${gradId})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({ widget, onDelete }: {
  widget: DashboardWidgetItem;
  onDelete: (id: string) => void;
}) {
  const metricCol = (widget.chart_config?.y_columns || []).find(Boolean)
    || widget.columns.find((c) => widget.rows.some((r) => typeof r[c] === 'number'));
  const labelCol = widget.chart_config?.x_column || widget.columns.find((c) => c !== metricCol);
  const primaryRow = widget.rows[widget.rows.length - 1] || widget.rows[0] || {};
  const metric = metricCol ? primaryRow[metricCol] : undefined;
  const label = labelCol ? String(primaryRow[labelCol] ?? '') : '';
  const change = inferChangePercent(widget.rows, metricCol);

  return (
    <div className="widget-card widget-drag-handle" style={{
      background: T.s1,
      border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', minHeight: 190,
      cursor: 'grab',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        padding: '14px 16px 8px', display: 'flex',
        alignItems: 'flex-start', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(124,58,255,0.08))',
          border: '1px solid rgba(0,229,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.accent, fontSize: '0.75rem', fontWeight: 700,
        }}>
          $
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.9rem',
            color: T.text, whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {widget.title}
          </div>
          <div style={{
            fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono,
            marginTop: 1,
          }}>{label || 'live metric'}</div>
        </div>
        {change !== null && (
          <span style={{
            fontSize: '0.65rem', fontFamily: T.fontMono,
            color: change >= 0 ? T.green : T.red,
            background: change >= 0 ? T.greenDim : T.redDim,
            borderRadius: 999, padding: '3px 9px',
            display: 'flex', alignItems: 'center', gap: 3,
            border: `1px solid ${change >= 0 ? 'rgba(34,211,165,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}>
            {change >= 0 ? <IconArrowUp /> : <IconArrowDown />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        <button
          className="dash-action-btn dash-action-btn--danger"
          onClick={() => onDelete(widget.id)}
          style={{ width: 24, height: 24 }}
          title="Remove widget"
        >
          <IconClose />
        </button>
      </div>
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{
          fontFamily: T.fontHead, fontWeight: 800, fontSize: '2.2rem',
          color: T.text, letterSpacing: -1, lineHeight: 1.1,
        }}>
          {formatMetric(metric)}
        </div>
        <div style={{ fontSize: '0.72rem', color: T.text3, marginTop: 2 }}>{metricCol || 'value'}</div>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <Sparkline rows={widget.rows} yColumn={metricCol} color={T.accent} />
      </div>
    </div>
  );
}

/* ── Main Widget Renderer ────────────────────────────────────── */

export function WidgetRenderer({
  widget,
  onDelete,
  onUpdateWidget,
}: {
  widget: DashboardWidgetItem;
  onDelete: (id: string) => void;
  onUpdateWidget: (id: string, patch: UpdateDashboardWidgetRequest) => void;
}) {
  const size = resolveWidgetSize(widget.size, widget.viz_type, widget.rows.length);
  const badge = widgetBadge(widget.viz_type);

  const isChartType = (t: string): t is ChartType => ['bar', 'line', 'area', 'pie'].includes(t);
  const initialType: ChartType = isChartType(widget.viz_type) ? widget.viz_type : 'bar';
  const [chartType, setChartType] = useState<ChartType>(initialType);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(widget.title);
  const [refreshing, setRefreshing] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue.trim() !== widget.title) {
      onUpdateWidget(widget.id, { title: titleValue.trim() });
    } else {
      setTitleValue(widget.title);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const updated = await refreshDashboardWidget(widget.id);
      onUpdateWidget(widget.id, { columns: updated.columns, rows: updated.rows } as UpdateDashboardWidgetRequest);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGetInsight = async () => {
    if (insight) {
      setInsight(null);
      return;
    }
    setLoadingInsight(true);
    try {
      const res = await getWidgetInsight(widget.id);
      setInsight(res.insight);
    } catch (err) {
      console.error('Insight failed:', err);
    } finally {
      setLoadingInsight(false);
    }
  };

  if (widget.viz_type === 'kpi') {
    return <KpiCard widget={widget} onDelete={onDelete} />;
  }

   const onToggleSize = () => {
    const isPie = widget.viz_type === 'pie' || widget.viz_type === 'donut' || chartType === 'pie' || chartType === 'donut';
    let nextW = 10;
    let nextH = widget.h || 7;

    if (isPie) {
      nextW = widget.w >= 10 ? 7 : 10;
    } else {
      if (widget.w < 10) nextW = 10;
      else if (widget.w >= 10 && widget.w < 13) nextW = 13;
      else if (widget.w >= 13 && widget.w < 20) nextW = 20;
      else nextW = 10;
    }

    onUpdateWidget(widget.id, { w: nextW, h: nextH });
  };

  const isChart = widget.viz_type !== 'table';
  const canRefresh = !!(widget.sql && widget.connection_id);

  return (
    <div className="widget-card" style={{
      background: T.s1,
      border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', height: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    }}>
      {/* Header */}
      <div className="widget-drag-handle" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '13px 16px 11px',
        borderBottom: `1px solid ${T.border}`,
        cursor: 'grab',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              autoFocus
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitTitle();
                else if (e.key === 'Escape') { setTitleValue(widget.title); setEditingTitle(false); }
              }}
              onBlur={commitTitle}
              style={{
                width: '100%', background: T.s2,
                border: '1px solid rgba(0,229,255,0.3)',
                borderRadius: 7, padding: '4px 10px',
                color: T.text, fontFamily: T.fontHead,
                fontWeight: 700, fontSize: '0.93rem', outline: 'none',
              }}
            />
          ) : (
            <div
              title="Double-click to rename"
              onDoubleClick={() => { setEditingTitle(true); setTimeout(() => titleInputRef.current?.select(), 0); }}
              style={{
                fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.93rem',
                color: T.text, whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', cursor: 'text',
              }}
            >
              {titleValue}
            </div>
          )}
          <div style={{
            fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono,
            marginTop: 3, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{widget.rows.length} rows</span>
            <span style={{
              width: 2, height: 2, borderRadius: '50%',
              background: T.text3, display: 'inline-block',
            }} />
            <select 
              value={widget.cadence || 'Manual only'}
              onChange={(e) => onUpdateWidget(widget.id, { cadence: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                color: T.text3,
                fontFamily: T.fontMono,
                fontSize: '0.62rem',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                padding: '0 4px',
                marginLeft: '-4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <option value="Manual only">Manual only ▼</option>
              <option value="Hourly">Hourly ⚡</option>
              <option value="Daily">Daily 🗓️</option>
              <option value="Weekly">Weekly 📅</option>
              <option value="Monthly">Monthly 📆</option>
            </select>
            {widget.cadence !== 'Manual only' && <LiveIndicator />}
          </div>
        </div>

        {/* Chart type switcher */}
        {isChart && (
          <div style={{
            display: 'flex', gap: 2,
            background: T.s2, borderRadius: 8,
            padding: 2, border: `1px solid ${T.border}`,
          }}>
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setChartType(t.key);
                  onUpdateWidget(widget.id, { viz_type: t.key });
                }}
                title={t.label}
                style={{
                  padding: '4px 9px', borderRadius: 6,
                  border: 'none',
                  background: chartType === t.key
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.08))'
                    : 'transparent',
                  color: chartType === t.key ? T.accent : T.text3,
                  fontSize: '0.64rem', cursor: 'pointer',
                  fontFamily: T.fontMono, fontWeight: 600,
                  transition: 'all 0.18s ease',
                  letterSpacing: 0.3,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Size toggle */}
        <button
          className="dash-action-btn"
          onClick={onToggleSize}
          style={{ width: 28, height: 28, color: T.text3 }}
        >
          <IconResize />
        </button>

        {/* Badge */}
        <span className="viz-badge" style={{
          background: badge.bg, color: badge.color,
          border: `1px solid ${badge.borderColor}`,
        }}>
          {badge.label}
        </span>

        {/* AI Insight */}
        <button
          className="dash-action-btn"
          onClick={handleGetInsight}
          disabled={loadingInsight}
          title="Get AI insights"
          style={{
            width: 26, height: 26,
            color: (insight || loadingInsight) ? T.accent : T.text3,
            background: (insight || loadingInsight) ? 'rgba(0,229,255,0.1)' : 'transparent',
            border: (insight || loadingInsight) ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
          }}
        >
          {loadingInsight ? '...' : '✨'}
        </button>

        {/* Export Data */}
        {widget.rows && widget.rows.length > 0 && (
          <button
            className="dash-action-btn"
            onClick={() => exportToCSV(widget.rows, `${widget.title.replace(/\s+/g, '_')}_export`)}
            title="Download Data (CSV)"
            style={{ width: 26, height: 26 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {/* Refresh */}
        {canRefresh && (
          <button
            className="dash-action-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data"
            style={{
              width: 26, height: 26,
              color: refreshing ? T.accent : undefined,
              cursor: refreshing ? 'default' : 'pointer',
            }}
          >
            <IconRefresh spinning={refreshing} />
          </button>
        )}

        {/* Delete */}
        <button
          className="dash-action-btn dash-action-btn--danger"
          onClick={() => onDelete(widget.id)}
          style={{ width: 26, height: 26 }}
          title="Remove widget"
        >
          <IconClose />
        </button>
      </div>

      {/* Insight Panel */}
      {insight && (
        <div 
          className="insight-panel-premium"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(124,58,255,0.04))',
            borderBottom: `1px solid ${T.border}`,
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: T.text2,
            position: 'relative'
          }}
        >
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            marginBottom: 10, color: T.accent, 
            fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase',
            fontFamily: T.fontHead, letterSpacing: 0.5
          }}>
            <IconZap style={{ width: 14, height: 14 }} />
            <span>✨ AI ANALYSIS</span>
            <div style={{ flex: 1 }} />
            <button 
              onClick={() => setInsight(null)}
              style={{ background: 'transparent', border: 'none', color: T.text3, cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
            >✕</button>
          </div>
          <Typewriter text={insight} />
        </div>
      )}

      {/* Body */}
      <div style={{ padding: isChart ? '0 0 12px' : '12px 16px 16px', position: 'relative' }}>
        {isChart && chartType === 'bar' && <DashboardBarChart widget={widget} size={size} />}
        {isChart && chartType === 'line' && <DashboardLineChart widget={widget} size={size} />}
        {isChart && chartType === 'area' && <DashboardAreaChart widget={widget} size={size} />}
        {isChart && (chartType === 'pie' || chartType === 'donut') && <DashboardPieChart widget={widget} size={size} />}
        {widget.viz_type === 'table' && <TableViz columns={widget.columns} rows={widget.rows} compact={size !== 'full'} />}
      </div>
    </div>
  );
}
