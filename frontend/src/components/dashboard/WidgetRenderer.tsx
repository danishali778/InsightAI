import { useState } from 'react';
import { T } from './tokens';
import type { DashboardWidgetItem, WidgetSize } from '../../types/dashboard';
import { resolveWidgetSize } from '../../types/dashboard';
import type { UpdateDashboardWidgetRequest } from '../../types/api';

const CHART_COLORS = [T.accent, T.purple, T.green, T.yellow, T.orange, '#f87171', '#c084fc', '#60a5fa'];

function inferChangePercent(rows: Array<Record<string, unknown>>, key?: string) {
  if (!rows.length || !key) return null;
  const first = Number(rows[0][key] ?? 0);
  const last = Number(rows[rows.length - 1][key] ?? 0);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
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
  const map: Record<string, { bg: string; color: string; label: string }> = {
    kpi: { bg: T.greenDim, color: T.green, label: 'KPI' },
    bar: { bg: T.accentDim, color: T.accent, label: 'BAR' },
    line: { bg: T.purpleDim, color: T.purple, label: 'LINE' },
    area: { bg: T.purpleDim, color: T.purple, label: 'AREA' },
    scatter: { bg: T.yellowDim, color: T.yellow, label: 'SCATTER' },
    donut: { bg: T.accentDim, color: T.accent, label: 'DONUT' },
    table: { bg: T.s3, color: T.text2, label: 'TABLE' },
  };
  return map[vizType] || map.table;
}

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

  if (widget.viz_type === 'kpi') {
    return <KpiCard widget={widget} onDelete={onDelete} onUpdateWidget={onUpdateWidget} size={size} />;
  }

  const isBar = widget.viz_type === 'bar';
  const barOrientation = widget.bar_orientation || 'horizontal';

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,14,26,0.98))',
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div className="widget-drag-handle" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isBar ? '16px 18px 12px' : '12px 16px 10px', borderBottom: `1px solid ${T.border}`, cursor: 'default' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: isBar ? '1.15rem' : '0.92rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: isBar ? 0.1 : 0 }}>
            {widget.title}
          </div>
          <div style={{ fontSize: isBar ? '0.78rem' : '0.64rem', color: T.text3, fontFamily: T.fontMono, marginTop: 2 }}>
            {widget.rows.length} rows · {widget.cadence}
          </div>
        </div>

        {isBar && (
          <button
            onClick={() => onUpdateWidget(widget.id, { bar_orientation: barOrientation === 'horizontal' ? 'vertical' : 'horizontal' })}
            style={{
              fontSize: '0.62rem',
              fontFamily: T.fontMono,
              padding: '2px 8px',
              borderRadius: 5,
              border: `1px solid ${T.border}`,
              background: T.s2,
              color: T.text2,
              cursor: 'pointer',
            }}
            title="Toggle X/Y orientation"
          >
            {barOrientation === 'horizontal' ? 'Y-AXIS' : 'X-AXIS'}
          </button>
        )}

        <button
          onClick={() => onUpdateWidget(widget.id, { size: size === 'full' ? 'half' : 'full' })}
          style={{
            fontSize: '0.62rem',
            fontFamily: T.fontMono,
            padding: '2px 8px',
            borderRadius: 5,
            border: `1px solid ${T.border}`,
            background: T.s2,
            color: T.text2,
            cursor: 'pointer',
          }}
          title="Toggle widget width"
        >
          {size === 'full' ? 'FULL' : 'HALF'}
        </button>
        <span style={{ fontSize: isBar ? '0.7rem' : '0.62rem', fontFamily: T.fontMono, padding: isBar ? '3px 10px' : '2px 8px', borderRadius: isBar ? 6 : 5, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}33`, fontWeight: isBar ? 600 : 400 }}>
          {badge.label}
        </span>
        <button
          onClick={() => onDelete(widget.id)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.text3,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          x
        </button>
      </div>

      <div style={{ padding: isBar ? '2px 14px 10px' : size === 'full' ? '14px 16px 18px' : '12px 14px 16px' }}>
        {(widget.viz_type === 'line' || widget.viz_type === 'area' || widget.viz_type === 'scatter') && <LineLikeViz widget={widget} />}
        {widget.viz_type === 'bar' && <BarViz widget={widget} />}
        {widget.viz_type === 'donut' && <DonutViz widget={widget} />}
        {widget.viz_type === 'table' && <TableViz columns={widget.columns} rows={widget.rows} compact={size !== 'full'} />}
      </div>
    </div>
  );
}

function KpiCard({ widget, onDelete, onUpdateWidget, size }: { widget: DashboardWidgetItem; onDelete: (id: string) => void; onUpdateWidget: (id: string, patch: UpdateDashboardWidgetRequest) => void; size: WidgetSize }) {
  const metricCol = (widget.chart_config?.y_columns || []).find(Boolean) || widget.columns.find((c) => widget.rows.some((r) => typeof r[c] === 'number'));
  const labelCol = widget.chart_config?.x_column || widget.columns.find((c) => c !== metricCol);
  const primaryRow = widget.rows[widget.rows.length - 1] || widget.rows[0] || {};
  const metric = metricCol ? primaryRow[metricCol] : undefined;
  const label = labelCol ? String(primaryRow[labelCol] ?? '') : '';
  const change = inferChangePercent(widget.rows, metricCol);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,14,26,0.98))',
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 190,
      }}
    >
      <div className="widget-drag-handle" style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'move' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: T.accentDim, border: '1px solid rgba(0,229,255,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, fontSize: '0.72rem' }}>
          $
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.92rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {widget.title}
          </div>
          <div style={{ fontSize: '0.64rem', color: T.text3, fontFamily: T.fontMono }}>{label || 'live metric'}</div>
        </div>
        {change !== null && (
          <span style={{ fontSize: '0.67rem', fontFamily: T.fontMono, color: change >= 0 ? T.green : T.red, background: change >= 0 ? T.greenDim : T.redDim, borderRadius: 999, padding: '3px 8px' }}>
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        )}
        <button
          onClick={() => onUpdateWidget(widget.id, { size: size === 'full' ? 'half' : 'full' })}
          style={{ fontSize: '0.6rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.s2, color: T.text2, cursor: 'pointer' }}
          title="Toggle widget width"
        >
          {size === 'full' ? 'FULL' : 'HALF'}
        </button>
        <button onClick={() => onDelete(widget.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer' }}>
          x
        </button>
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '2.2rem', color: T.text, letterSpacing: -1 }}>
          {formatMetric(metric)}
        </div>
        <div style={{ fontSize: '0.74rem', color: T.text3 }}>{metricCol || 'value'}</div>
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        <Sparkline rows={widget.rows} yColumn={metricCol} color={T.accent} />
      </div>
    </div>
  );
}

function Sparkline({ rows, yColumn, color }: { rows: Array<Record<string, unknown>>; yColumn?: string; color: string }) {
  if (!yColumn || rows.length < 2) {
    return <div style={{ height: 36, borderTop: `1px dashed ${T.border}`, marginTop: 4 }} />;
  }

  const values = rows.slice(-16).map((r) => Number(r[yColumn] ?? 0));
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const w = 260;
  const h = 46;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * (w - 2) + 1;
      const y = h - ((v - minV) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 40 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TableViz({ columns, rows, compact }: { columns: string[]; rows: Array<Record<string, unknown>>; compact: boolean }) {
  const visible = rows.slice(0, compact ? 6 : 10);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ background: T.s2, color: T.text3, fontFamily: T.fontMono, fontSize: '0.64rem', textTransform: 'uppercase', textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col} style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, color: T.text2, fontFamily: T.fontMono, maxWidth: compact ? 180 : 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(row[col] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarViz({ widget }: { widget: DashboardWidgetItem }) {
  const labelCol = widget.chart_config?.x_column || widget.columns[0];
  const valueCol = (widget.chart_config?.y_columns || [])[0] || widget.columns[1];
  if (!labelCol || !valueCol) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data</div>;

  const orientation = widget.bar_orientation || 'horizontal';
  const items = widget.rows
    .map((r) => ({ label: String(r[labelCol] ?? ''), value: Number(r[valueCol] ?? 0) }))
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => (orientation === 'horizontal' ? b.value - a.value : 0));
  const viewportPx = Math.max(150, Math.min(420, widget.h * 42));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  if (orientation === 'vertical') {
    const maxVal = Math.max(...items.map((item) => item.value), 1);
    const chartH = Math.max(200, viewportPx - 10);
    const topPad = 22;
    const colW = 36;
    const gap = 12;
    const contentW = Math.max(320, items.length * (colW + gap) + 40);

    return (
      <div style={{ overflowX: 'auto', overflowY: 'hidden', maxHeight: viewportPx, position: 'relative' }}>
        <svg viewBox={`0 0 ${contentW} ${chartH}`} style={{ width: contentW, height: chartH }}>
          <defs>
            <linearGradient id={`barVGrad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <line x1={30} y1={chartH - 28} x2={contentW - 10} y2={chartH - 28} stroke={T.border} />
          {items.map((item, index) => {
            const barH = (item.value / maxVal) * (chartH - topPad - 46);
            const x = 36 + index * (colW + gap);
            const y = chartH - 28 - barH;
            const isHovered = hoveredIndex === index;
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={colW}
                  height={barH}
                  rx={4}
                  fill={`url(#barVGrad-${widget.id})`}
                  opacity={isHovered ? 1 : 0.95 - (index % 6) * 0.07}
                  stroke={isHovered ? '#ffffff' : 'transparent'}
                  strokeWidth={isHovered ? 1.2 : 0}
                  onMouseEnter={(e) => {
                    setHoveredIndex(index);
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      x: e.clientX - rect.left + 12,
                      y: e.clientY - rect.top - 10,
                      label: item.label,
                      value: item.value,
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip((prev) =>
                      prev
                        ? { ...prev, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 }
                        : prev
                    );
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setTooltip(null);
                  }}
                />
                <text x={x + colW / 2} y={y - 6} textAnchor="middle" fontFamily={T.fontMono} fontSize={10} fill={T.text} fontWeight={600}>
                  {formatMetric(item.value)}
                </text>
                <text x={x + colW / 2} y={chartH - 10} textAnchor="middle" fontFamily={T.fontMono} fontSize={10} fill={T.text3}>
                  {item.label.length > 8 ? `${item.label.slice(0, 8)}...` : item.label}
                </text>
              </g>
            );
          })}
        </svg>
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              pointerEvents: 'none',
              zIndex: 3,
              background: 'rgba(10, 16, 30, 0.96)',
              border: `1px solid ${T.border2}`,
              borderRadius: 10,
              padding: '8px 10px',
              minWidth: 140,
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: T.text2, marginBottom: 3 }}>{tooltip.label}</div>
            <div style={{ fontSize: '0.75rem', color: T.accent, fontFamily: T.fontMono }}>
              {valueCol}: {Number.isFinite(tooltip.value) ? tooltip.value.toLocaleString() : tooltip.value}
            </div>
          </div>
        )}
      </div>
    );
  }

  const maxVal = Math.max(...items.map((item) => item.value), 1);
  const rowH = 38;
  const rowBarH = 26;
  const barStart = 120;
  const barAreaW = 220;
  const valueColX = barStart + barAreaW + 10;
  const contentH = Math.max(80, items.length * rowH + 2);
  const railX = barStart - 4;
  const gradientId = `barHGrad-${widget.id}`;
  const svgW = 440;

  return (
    <div style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: viewportPx, position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <svg viewBox={`0 0 ${svgW} ${contentH}`} style={{ width: '100%', flexShrink: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <line x1={railX} y1={0} x2={railX} y2={contentH - 3} stroke={T.border} />
        {items.map((item, index) => {
          const width = (item.value / maxVal) * barAreaW;
          const y = index * rowH;
          const isHovered = hoveredIndex === index;
          return (
            <g key={index}>
              <rect
                x={barStart}
                y={y}
                width={barAreaW}
                height={rowBarH}
                rx={6}
                fill="rgba(26, 44, 70, 0.35)"
                stroke="rgba(67, 84, 110, 0.18)"
                strokeWidth={0.5}
              />
              <rect
                x={barStart}
                y={y}
                width={width}
                height={rowBarH}
                rx={6}
                fill={`url(#${gradientId})`}
                opacity={isHovered ? 1 : 0.95 - (index % 6) * 0.07}
                stroke={isHovered ? '#ffffff' : 'transparent'}
                strokeWidth={isHovered ? 1.2 : 0}
                onMouseEnter={(e) => {
                  setHoveredIndex(index);
                  const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    x: e.clientX - rect.left + 12,
                    y: e.clientY - rect.top - 10,
                    label: item.label,
                    value: item.value,
                  });
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip((prev) =>
                    prev
                      ? { ...prev, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 }
                      : prev
                  );
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setTooltip(null);
                }}
              />
              <text x={barStart - 10} y={y + 17} textAnchor="end" fontFamily={T.fontMono} fontSize={13} fill={T.text2} fontWeight={500}>
                {item.label.length > 14 ? `${item.label.slice(0, 14)}...` : item.label}
              </text>
              <text
                x={valueColX}
                y={y + 17}
                textAnchor="start"
                fontFamily={T.fontMono}
                fontSize={13}
                fontWeight={700}
                fill={isHovered ? T.text : T.text2}
              >
                {item.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: 'none',
            zIndex: 3,
            background: 'rgba(10, 16, 30, 0.96)',
            border: `1px solid ${T.border2}`,
            borderRadius: 10,
            padding: '8px 10px',
            minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: T.text2, marginBottom: 3 }}>{tooltip.label}</div>
          <div style={{ fontSize: '0.75rem', color: T.accent, fontFamily: T.fontMono }}>
            {valueCol}: {Number.isFinite(tooltip.value) ? tooltip.value.toLocaleString() : tooltip.value}
          </div>
        </div>
      )}
    </div>
  );
}

function LineLikeViz({ widget }: { widget: DashboardWidgetItem }) {
  const xCol = widget.chart_config?.x_column || widget.columns[0];
  const yCol = (widget.chart_config?.y_columns || [])[0] || widget.columns[1];
  if (!xCol || !yCol) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data</div>;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const rows = widget.rows.slice(-14);
  const values = rows.map((r) => Number(r[yCol] ?? 0));
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;
  const w = 520;
  const h = 220;
  const padL = 56;
  const padR = 18;
  const padT = 18;
  const padB = 42;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const points = values
    .map((v, i) => {
      const x = padL + (i / Math.max(values.length - 1, 1)) * chartW;
      const y = padT + chartH - ((v - minV) / range) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const first = points.split(' ')[0];
  const last = points.split(' ')[points.split(' ').length - 1];
  const areaPath = `M${first} L${points} L${last.split(',')[0]},${padT + chartH} L${first.split(',')[0]},${padT + chartH} Z`;
  const isArea = widget.viz_type === 'area';
  const isScatter = widget.viz_type === 'scatter';
  const yTicks = 4;
  const xTickStep = Math.max(1, Math.floor((rows.length - 1) / 5));
  const formatTick = (v: number) => {
    if (!Number.isFinite(v)) return '-';
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return `${Math.round(v)}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%' }}>
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padT + (chartH / yTicks) * i;
          const tickVal = (maxV - ((maxV - minV) / yTicks) * i).toLocaleString(undefined, { maximumFractionDigits: 0 });
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke={T.border} strokeDasharray="2 4" />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontFamily={T.fontMono} fontSize={9} fill={T.text3}>
                {formatTick(Number(tickVal.replace(/,/g, '')))}
              </text>
            </g>
          );
        })}

        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={T.border} />
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke={T.border} />

        {(isArea || !isScatter) && <path d={areaPath} fill={isArea ? `${T.purple}33` : `${T.accent}22`} />}
        {!isScatter && <polyline points={points} fill="none" stroke={isArea ? T.purple : T.accent} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />}

        {points.split(' ').map((point, idx) => {
          const [cx, cy] = point.split(',');
          const xVal = String(rows[idx]?.[xCol] ?? '');
          const yVal = Number(rows[idx]?.[yCol] ?? 0);
          const isHovered = hoveredIndex === idx;
          return (
            <circle
              key={idx}
              cx={Number(cx)}
              cy={Number(cy)}
              r={isHovered ? 4.2 : isScatter ? 3.4 : 2.5}
              fill={CHART_COLORS[idx % CHART_COLORS.length]}
              stroke={isHovered ? '#fff' : 'transparent'}
              strokeWidth={isHovered ? 1.2 : 0}
              onMouseEnter={(e) => {
                setHoveredIndex(idx);
                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({
                  x: e.clientX - rect.left + 12,
                  y: e.clientY - rect.top - 10,
                  label: xVal,
                  value: yVal,
                });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!rect) return;
                setTooltip((prev) => (prev ? { ...prev, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 } : prev));
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setTooltip(null);
              }}
            />
          );
        })}

        {rows.map((row, i) => {
          if (i % xTickStep !== 0 && i !== rows.length - 1) return null;
          const x = padL + (i / Math.max(rows.length - 1, 1)) * chartW;
          const text = String(row[xCol] ?? '');
          return (
            <text key={`x-${i}`} x={x} y={h - 16} textAnchor="middle" fontFamily={T.fontMono} fontSize={9} fill={T.text3}>
              {text.length > 8 ? `${text.slice(0, 8)}...` : text}
            </text>
          );
        })}
      </svg>

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: 'none',
            zIndex: 3,
            background: 'rgba(10, 16, 30, 0.96)',
            border: `1px solid ${T.border2}`,
            borderRadius: 10,
            padding: '8px 10px',
            minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: T.text2, marginBottom: 3 }}>{xCol}: {tooltip.label}</div>
          <div style={{ fontSize: '0.75rem', color: T.accent, fontFamily: T.fontMono }}>
            {yCol}: {Number.isFinite(tooltip.value) ? tooltip.value.toLocaleString() : tooltip.value}
          </div>
        </div>
      )}
    </div>
  );
}

function DonutViz({ widget }: { widget: DashboardWidgetItem }) {
  const xCol = widget.chart_config?.x_column || widget.columns[0];
  const yCol = (widget.chart_config?.y_columns || [])[0] || widget.columns[1];
  if (!xCol || !yCol) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data</div>;

  const items = widget.rows.slice(0, 5).map((row) => ({ label: String(row[xCol] ?? ''), value: Math.abs(Number(row[yCol] ?? 0)) }));
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 54;
  const center = 68;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let start = -90;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 136 136" style={{ width: 136, flexShrink: 0 }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={T.s4} strokeWidth={stroke} />
        {items.map((item, index) => {
          const pct = item.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const rotation = start;
          start += pct * 360;
          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${center} ${center})`}
            />
          );
        })}
        <text x={center} y={center - 2} textAnchor="middle" fill={T.text} fontFamily={T.fontHead} fontSize={13} fontWeight={700}>
          {total.toLocaleString()}
        </text>
        <text x={center} y={center + 13} textAnchor="middle" fill={T.text3} fontFamily={T.fontMono} fontSize={7}>
          TOTAL
        </text>
      </svg>

      <div style={{ flex: 1, display: 'grid', gap: 6 }}>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[index % CHART_COLORS.length], flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.75rem', color: T.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            <span style={{ fontSize: '0.72rem', color: T.text, fontFamily: T.fontMono }}>{((item.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
