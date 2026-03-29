import { useState, useRef } from 'react';
import { refreshDashboardWidget } from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { T } from './tokens';
import type { DashboardWidgetItem, WidgetSize } from '../../types/dashboard';
import { resolveWidgetSize } from '../../types/dashboard';
import type { UpdateDashboardWidgetRequest } from '../../types/api';

const CHART_COLORS = ['#00e5ff', '#7c3aff', '#22d3a5', '#f59e0b', '#f87171', '#a29bfe', '#fab1a0', '#81ecec'];

const gs = 'rgba(255,255,255,0.06)';
const ts = { fontSize: 11, fill: 'rgba(255,255,255,0.4)' };
const tt = {
  borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: '0.78rem',
  background: 'rgba(11,17,32,0.95)', color: '#e2e8f0',
  backdropFilter: 'blur(16px)',
};

const CHART_TYPES = [
  { key: 'bar', label: 'Bar', icon: '▥' },
  { key: 'line', label: 'Line', icon: '⟋' },
  { key: 'area', label: 'Area', icon: '▨' },
  { key: 'pie', label: 'Pie', icon: '◕' },
] as const;

type ChartType = 'bar' | 'line' | 'area' | 'pie';

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
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    kpi:     { bg: T.greenDim,   color: T.green,  label: 'KPI',     borderColor: 'rgba(34,211,165,0.2)' },
    bar:     { bg: T.accentDim,  color: T.accent, label: 'BAR',     borderColor: 'rgba(0,229,255,0.2)' },
    line:    { bg: T.purpleDim,  color: T.purple, label: 'LINE',    borderColor: 'rgba(124,58,255,0.2)' },
    area:    { bg: T.purpleDim,  color: T.purple, label: 'AREA',    borderColor: 'rgba(124,58,255,0.2)' },
    scatter: { bg: T.yellowDim,  color: T.yellow, label: 'SCATTER', borderColor: 'rgba(245,158,11,0.2)' },
    donut:   { bg: T.accentDim,  color: T.accent, label: 'DONUT',   borderColor: 'rgba(0,229,255,0.2)' },
    table:   { bg: T.s3,         color: T.text2,  label: 'TABLE',   borderColor: T.border },
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

/* ── Dashboard Chart Viz ──────────────────────────────────────── */

function DashboardChartViz({ widget, chartType }: { widget: DashboardWidgetItem; chartType: ChartType }) {
  const xCol = widget.chart_config?.x_column || widget.columns[0];
  let yCols = widget.chart_config?.y_columns?.length
    ? widget.chart_config.y_columns
    : [];

  if (yCols.length === 0 && widget.rows.length > 0) {
    // Auto-detect numeric columns for Y axis
    const firstRow = widget.rows[0];
    yCols = widget.columns.filter(c => c !== xCol && typeof firstRow[c] === 'number');
    if (yCols.length === 0) {
      // Fallback
      yCols = [widget.columns[1]].filter(Boolean);
    }
  } else if (yCols.length === 0) {
    yCols = [widget.columns[1]].filter(Boolean);
  }

  const data = widget.rows.map((row) => {
    const item: Record<string, unknown> = { [xCol]: row[xCol] };
    yCols.forEach((col) => {
      const v = row[col];
      item[col] = typeof v === 'number' ? v : parseFloat(String(v)) || 0;
    });
    return item;
  });

  const colMaxes: Record<string, number> = Object.fromEntries(
    yCols.map(c => [c, Math.max(...data.map(d => Math.abs(Number(d[c]) || 0))) || 1])
  );

  const sortedBySca = [...yCols].sort((a, b) => (colMaxes[b] || 0) - (colMaxes[a] || 0));
  const maxVal = colMaxes[sortedBySca[0]] || 1;
  const minMax = colMaxes[sortedBySca[sortedBySca.length - 1]] || 1;

  const leftCols = sortedBySca.filter(c => (colMaxes[c] || 0) >= maxVal / 10);
  const rightCols = sortedBySca.filter(c => (colMaxes[c] || 0) < maxVal / 10);

  const hasMixedScales = yCols.length > 1 && minMax > 0 && maxVal / minMax > 10;
  // Let bar, line, and area use dual axis if scales are mixed
  const needsDualAxis = hasMixedScales && rightCols.length > 0 && chartType !== 'pie';
  const getAxisId = (col: string): 'left' | 'right' => 
    needsDualAxis && rightCols.includes(col) ? 'right' : 'left';

  const leftAxisColor = CHART_COLORS[yCols.indexOf(leftCols[0]) % CHART_COLORS.length];
  const rightAxisColor = CHART_COLORS[yCols.indexOf(rightCols[0] ?? '') % CHART_COLORS.length];

  const needsScroll = data.length > 20;
  const fixedWidth = Math.max(500, data.length * 48);
  const chartHeight = 280;
  const bottomPad = needsScroll ? 70 : 50;
  const chartProps = { data, margin: { top: 12, right: 24, left: 10, bottom: bottomPad } };
  const xTickProps = needsScroll
    ? { ...ts, angle: -45, textAnchor: 'end' as const }
    : ts;

  const renderInner = () => {
    const AXIS_W = needsDualAxis ? 64 : 45;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const makeAxisLabel = (value: string, color: string, side: 'left' | 'right') => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: (props: any) => {
        const vb = props.viewBox as { x: number; y: number; width: number; height: number } | undefined;
        if (!vb) return null;
        const cy = vb.y + vb.height / 2;
        const cx = side === 'left' ? vb.x - AXIS_W + 14 : vb.x + vb.width + AXIS_W - 14;
        const rotate = side === 'left' ? -90 : 90;
        return (
          <text x={cx} y={cy} transform={`rotate(${rotate}, ${cx}, ${cy})`}
            textAnchor="middle" fill={color} fontSize={10} opacity={0.85}>
            {value}
          </text>
        );
      },
    });

    const leftAxisLabel = leftCols.map(formatColHeader).join(' / ').substring(0, 30);
    const rightAxisLabel = rightCols.map(formatColHeader).join(' / ').substring(0, 30);

    const yLeft = (
      <YAxis yAxisId="left" width={AXIS_W} tickCount={6}
        tick={{ fontSize: 11, fill: leftAxisColor, opacity: 0.8 }}
        axisLine={{ stroke: leftAxisColor, strokeOpacity: 0.5 }}
        tickLine={{ stroke: leftAxisColor, strokeOpacity: 0.3 }}
        label={makeAxisLabel(leftAxisLabel, leftAxisColor, 'left')} />
    );
    const yRight = needsDualAxis ? (
      <YAxis yAxisId="right" orientation="right" width={AXIS_W} tickCount={6}
        tick={{ fontSize: 11, fill: rightAxisColor, opacity: 0.8 }}
        axisLine={{ stroke: rightAxisColor, strokeOpacity: 0.5 }}
        tickLine={{ stroke: rightAxisColor, strokeOpacity: 0.3 }}
        label={makeAxisLabel(rightAxisLabel, rightAxisColor, 'right')} />
    ) : null;
    const ySingle = <YAxis yAxisId="left" tick={ts} axisLine={{ stroke: gs }} />;

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey={xCol} tick={xTickProps} axisLine={{ stroke: gs }} />
            {needsDualAxis ? yLeft : ySingle}
            {needsDualAxis ? yRight : null}
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }} />
            {yCols.map((c, i) => (
              <Bar key={c} yAxisId={getAxisId(c)} dataKey={c} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey={xCol} tick={xTickProps} axisLine={{ stroke: gs }} />
            {needsDualAxis ? yLeft : ySingle}
            {needsDualAxis ? yRight : null}
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }} />
            {yCols.map((c, i) => (
              <Line key={c} yAxisId={getAxisId(c)} type="monotone" dataKey={c} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey={xCol} tick={xTickProps} axisLine={{ stroke: gs }} />
            {needsDualAxis ? yLeft : ySingle}
            {needsDualAxis ? yRight : null}
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }} />
            {yCols.map((c, i) => (
              <Area key={c} yAxisId={getAxisId(c)} type="monotone" dataKey={c} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
            ))}
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yCols[0]}
              nameKey={xCol}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: 'rgba(255,255,255,0.25)' }}
              isAnimationActive={false}
            >
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }} />
          </PieChart>
        );
    }
  };

  if (needsScroll) {
    return (
      <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ width: fixedWidth, height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderInner()!}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      {renderInner()!}
    </ResponsiveContainer>
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
                background: 'rgba(15,25,41,0.6)', color: T.text3, fontFamily: T.fontMono,
                fontSize: '0.64rem', textTransform: 'uppercase', textAlign: 'left',
                padding: '9px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
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

function KpiCard({ widget, onDelete, onUpdateWidget, size }: {
  widget: DashboardWidgetItem;
  onDelete: (id: string) => void;
  onUpdateWidget: (id: string, patch: UpdateDashboardWidgetRequest) => void;
  size: WidgetSize;
}) {
  const metricCol = (widget.chart_config?.y_columns || []).find(Boolean)
    || widget.columns.find((c) => widget.rows.some((r) => typeof r[c] === 'number'));
  const labelCol = widget.chart_config?.x_column || widget.columns.find((c) => c !== metricCol);
  const primaryRow = widget.rows[widget.rows.length - 1] || widget.rows[0] || {};
  const metric = metricCol ? primaryRow[metricCol] : undefined;
  const label = labelCol ? String(primaryRow[labelCol] ?? '') : '';
  const change = inferChangePercent(widget.rows, metricCol);

  return (
    <div className="widget-card" style={{
      background: 'linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,14,26,0.98))',
      border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', minHeight: 190,
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
          className="dash-action-btn"
          onClick={() => onUpdateWidget(widget.id, { size: size === 'full' ? 'half' : 'full' })}
          style={{ width: 24, height: 24 }}
          title={size === 'full' ? 'Half width' : 'Full width'}
        >
          <IconResize />
        </button>
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

  if (widget.viz_type === 'kpi') {
    return <KpiCard widget={widget} onDelete={onDelete} onUpdateWidget={onUpdateWidget} size={size} />;
  }

  const isChart = widget.viz_type !== 'table';
  const canRefresh = !!(widget.sql && widget.connection_id);

  return (
    <div className="widget-card" style={{
      background: 'linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,14,26,0.98))',
      border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '13px 16px 11px',
        borderBottom: `1px solid ${T.border}`,
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
            <span>{widget.cadence}</span>
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
                onClick={() => setChartType(t.key)}
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
          onClick={() => onUpdateWidget(widget.id, { size: size === 'full' ? 'half' : 'full' })}
          style={{ width: 26, height: 26 }}
          title={size === 'full' ? 'Half width' : 'Full width'}
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

      {/* Body */}
      <div style={{ padding: '12px 16px 16px' }}>
        {isChart && <DashboardChartViz widget={widget} chartType={chartType} />}
        {widget.viz_type === 'table' && <TableViz columns={widget.columns} rows={widget.rows} compact={size !== 'full'} />}
      </div>
    </div>
  );
}
