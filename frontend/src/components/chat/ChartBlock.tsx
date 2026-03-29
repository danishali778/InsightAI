import { useRef, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { T } from '../dashboard/tokens';
import type { ChatChartBlockProps } from '../../types/chat';

const COLORS = ['#00e5ff', '#7c3aff', '#22d3a5', '#f59e0b', '#f87171', '#a29bfe', '#fab1a0', '#81ecec'];

function ChartTooltip({ active, payload, label, normalizedColMaxes }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; payload: Record<string, unknown> }>;
  label?: string;
  normalizedColMaxes: Record<string, number> | null;
}) {
  if (!active || !payload?.length) return null;
  const tt = { borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '0.78rem', background: '#1e1e2e', color: '#e2e8f0', padding: '10px 14px' };
  return (
    <div style={tt}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.7)' }}>{label}</div>
      {payload.map((entry, i) => {
        const rawKey = `_raw_${entry.dataKey}`;
        const rawValue = entry.payload[rawKey] as number | undefined;
        const displayValue = normalizedColMaxes
          ? `${typeof rawValue === 'number' ? rawValue.toLocaleString() : rawValue} (${entry.value}%)`
          : (typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value);
        return (
          <div key={i} style={{ color: entry.color, marginBottom: 2 }}>
            {entry.dataKey} : {displayValue}
          </div>
        );
      })}
    </div>
  );
}

export function ChartBlock({ recommendation, rows }: ChatChartBlockProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>(
    recommendation.type as 'bar' | 'line' | 'pie' | 'area'
  );
  const [normalized, setNormalizedRaw] = useState(false);
  // When normalizing, auto-switch away from Pie (pie of percentages is meaningless)
  const setNormalized = (updater: boolean | ((prev: boolean) => boolean)) => {
    setNormalizedRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next && chartType === 'pie') setChartType('bar');
      return next;
    });
  };
  // Per-chart-type multi toggle: true = small multiples view
  const [barMulti, setBarMulti] = useState(false);
  const [lineMulti, setLineMulti] = useState(false);
  // Pie sub-toggles: donut shape + top-N aggregation
  const [pieDonut, setPieDonut] = useState(false);
  const [pieTopN, setPieTopN] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { x_column, y_columns } = recommendation;

  const isMulti = (chartType === 'bar' && barMulti) || (chartType === 'line' && lineMulti);

  const rawData = rows.map(row => {
    const item: Record<string, unknown> = { [x_column]: row[x_column] };
    y_columns.forEach(col => { const v = row[col]; item[col] = typeof v === 'number' ? v : parseFloat(String(v)) || 0; });
    return item;
  });
  const filteredData = rawData;

  const colMaxes: Record<string, number> = Object.fromEntries(
    y_columns.map(c => [c, Math.max(...filteredData.map(d => Math.abs(Number(d[c]) || 0))) || 1])
  );

  const data = normalized
    ? filteredData.map(row => {
        const item: Record<string, unknown> = { [x_column]: row[x_column] };
        y_columns.forEach(c => {
          item[`_raw_${c}`] = row[c];
          item[c] = Math.round(((Number(row[c]) || 0) / colMaxes[c]) * 1000) / 10;
        });
        return item;
      })
    : filteredData;

  const types = [
    { key: 'bar' as const, label: 'Bar' }, { key: 'line' as const, label: 'Line' },
    { key: 'pie' as const, label: 'Pie' }, { key: 'area' as const, label: 'Area' },
  ];

  const gs = 'rgba(255,255,255,0.06)';
  const ts = { fontSize: 11, fill: 'rgba(255,255,255,0.4)' };
  const tt = { borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '0.78rem', background: '#1e1e2e', color: '#e2e8f0' };

  // ── Scroll logic ──────────────────────────────────────────
  const SCROLL_THRESHOLD = 20;
  const needsScroll = !isMulti && chartType !== 'pie' && data.length > SCROLL_THRESHOLD;
  const fixedWidth = Math.max(600, data.length * 48);

  // Smart X-axis label handling: rotate and skip labels when dense
  const isDenseX = data.length > 8;
  const xLabelInterval = data.length > 20 ? Math.ceil(data.length / 12) - 1 : isDenseX ? 1 : 0;
  const scrolledMargin = { top: 10, right: 20, left: 10, bottom: 60 };
  const normalMargin = isDenseX
    ? { top: 10, right: 20, left: 10, bottom: 52 }
    : { top: 10, right: 20, left: 10, bottom: 5 };
  const xAxisProps = needsScroll
    ? { dataKey: x_column, tick: { ...ts, textAnchor: 'end' as const }, angle: -40, height: 60, axisLine: { stroke: gs }, interval: xLabelInterval }
    : isDenseX
      ? { dataKey: x_column, tick: { ...ts, textAnchor: 'end' as const }, angle: -35, height: 52, axisLine: { stroke: gs }, interval: xLabelInterval }
      : { dataKey: x_column, tick: ts, axisLine: { stroke: gs }, interval: 0 };

  // ── Dual-axis logic ────────────────────────────────────────
  const fmtColLabel = (col: string) =>
    col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const sortedBySca = [...y_columns].sort((a, b) => (colMaxes[b] || 0) - (colMaxes[a] || 0));
  const maxVal = colMaxes[sortedBySca[0]] || 1;
  const minMax = colMaxes[sortedBySca[sortedBySca.length - 1]] || 1;

  const leftCols = sortedBySca.filter(c => (colMaxes[c] || 0) >= maxVal / 10);
  const rightCols = sortedBySca.filter(c => (colMaxes[c] || 0) < maxVal / 10);

  const hasMixedScales = y_columns.length > 1 && minMax > 0 && maxVal / minMax > 10;
  const needsDualAxis =
    !normalized && !isMulti &&
    (chartType === 'line' || chartType === 'area') &&
    rightCols.length > 0;
  const getAxisId = (col: string): 'left' | 'right' =>
    needsDualAxis && rightCols.includes(col) ? 'right' : 'left';

  const chartHeight = hasMixedScales ? 320 : 280;

  const leftAxisColor = COLORS[y_columns.indexOf(leftCols[0]) % COLORS.length];
  const rightAxisColor = COLORS[y_columns.indexOf(rightCols[0] ?? '') % COLORS.length];

  const leftAxisLabel = (() => {
    const full = leftCols.map(fmtColLabel).join(' / ');
    return full.length > 24 ? fmtColLabel(leftCols[0]) : full;
  })();
  const rightAxisLabel = (() => {
    const full = rightCols.map(fmtColLabel).join(' / ');
    return full.length > 24 ? fmtColLabel(rightCols[0]) : full;
  })();

  // ── Axis label renderer ────────────────────────────────────
  const AXIS_W = 72;
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

  // ── Small multiples renderer ──────────────────────────────
  const renderSmallMultiples = (style: 'bar' | 'spark') => {
    const fmtVal = (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
      if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
      if (abs < 10 && abs !== 0) return v.toFixed(2);
      return Math.round(v).toLocaleString();
    };
    const xTick = { fontSize: 9, fill: 'rgba(255,255,255,0.35)' };
    const yTick = { fontSize: 9, fill: 'rgba(255,255,255,0.3)' };
    const tipStyle = { background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.72rem' };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {y_columns.map((col, i) => {
          const color = COLORS[i % COLORS.length];
          const firstVal = Number(rawData[0]?.[col]) || 0;
          const lastVal = Number(rawData[rawData.length - 1]?.[col]) || 0;
          const pctChange = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : 0;
          const firstX = String(rawData[0]?.[x_column] ?? '');
          const isDown = pctChange < 0;
          const gradId = `sm-grad-${i}`;

          return (
            <div key={col} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px 10px', minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                {fmtColLabel(col)}
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.1, marginBottom: 3 }}>
                {fmtVal(lastVal)}
              </div>
              <div style={{ fontSize: '0.7rem', color: isDown ? '#f87171' : '#22d3a5', marginBottom: 10 }}>
                {isDown ? '▼' : '▲'} {Math.abs(pctChange).toFixed(0)}% since {firstX}
              </div>

              {style === 'bar' ? (
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={rawData} margin={{ top: 4, right: 4, bottom: 16, left: 4 }} barCategoryGap="25%">
                    <XAxis dataKey={x_column} tick={xTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={yTick} axisLine={false} tickLine={false} tickFormatter={fmtVal} width={36} tickCount={4} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={tipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }} itemStyle={{ color }}
                      formatter={(v: any) => [typeof v === 'number' ? v.toLocaleString() : v, fmtColLabel(col)] as any}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey={col} fill={color} radius={[3, 3, 0, 0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={90}>
                  <AreaChart data={rawData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey={x_column} tick={xTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={tipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }} itemStyle={{ color }}
                      formatter={(v: any) => [typeof v === 'number' ? v.toLocaleString() : v, fmtColLabel(col)] as any} />
                    <Area type="monotone" dataKey={col} stroke={color} fill={`url(#${gradId})`} strokeWidth={2} dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Main chart renderer ───────────────────────────────────
  const renderChart = () => {
    const baseMargin = needsScroll ? scrolledMargin : normalMargin;
    const yMarginLeft = needsDualAxis ? 4 : 8;
    const margin = { ...baseMargin, left: yMarginLeft, right: needsDualAxis ? 4 : 8 };
    const cp = { data, margin };
    const dims = needsScroll ? { width: fixedWidth, height: chartHeight } : {};

    // Smart Y-axis number formatting to prevent label clipping
    const yFmt = (v: number) => {
      if (normalized) return `${v}%`;
      const abs = Math.abs(v);
      if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
      if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
      if (abs < 10 && abs !== 0) return v.toFixed(1);
      return String(Math.round(v));
    };
    const yAxisFmt = yFmt;
    const Y_SINGLE_W = 56;
    const yLeft = (
      <YAxis yAxisId="left" width={AXIS_W} tickCount={9}
        tick={{ fontSize: 11, fill: leftAxisColor, opacity: 0.75 }}
        axisLine={{ stroke: leftAxisColor, strokeOpacity: 0.45 }}
        tickLine={{ stroke: leftAxisColor, strokeOpacity: 0.3 }}
        tickFormatter={yFmt} label={makeAxisLabel(leftAxisLabel, leftAxisColor, 'left')} />
    );
    const yRight = needsDualAxis ? (
      <YAxis yAxisId="right" orientation="right" width={AXIS_W} tickCount={9}
        tick={{ fontSize: 11, fill: rightAxisColor, opacity: 0.75 }}
        axisLine={{ stroke: rightAxisColor, strokeOpacity: 0.45 }}
        tickLine={{ stroke: rightAxisColor, strokeOpacity: 0.3 }}
        tickFormatter={yFmt} label={makeAxisLabel(rightAxisLabel, rightAxisColor, 'right')} />
    ) : null;
    const ySingle = <YAxis width={Y_SINGLE_W} tickCount={9} tick={ts} axisLine={{ stroke: gs }} tickFormatter={yAxisFmt} />;
    const tooltipEl = <Tooltip content={<ChartTooltip normalizedColMaxes={normalized ? colMaxes : null} />} />;
    const legendEl = <Legend wrapperStyle={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }} />;

    switch (chartType) {
      case 'bar': return (
        <BarChart {...dims} {...cp}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs}/>
          <XAxis {...xAxisProps}/>{ySingle}{tooltipEl}{legendEl}
          {y_columns.map((c,i)=>(<Bar key={c} dataKey={c} fill={COLORS[i%COLORS.length]} radius={[4,4,0,0]}/>))}
        </BarChart>
      );
      case 'line': return (
        <LineChart {...dims} {...cp}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs}/>
          <XAxis {...xAxisProps}/>{yLeft}{yRight}{tooltipEl}{legendEl}
          {y_columns.map((c,i)=>(
            <Line key={c} yAxisId={getAxisId(c)} type="monotone" dataKey={c} stroke={COLORS[i%COLORS.length]} strokeWidth={2.5} dot={{r:3}} connectNulls/>
          ))}
        </LineChart>
      );
      case 'area': return (
        <AreaChart {...dims} {...cp}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs}/>
          <XAxis {...xAxisProps}/>{yLeft}{yRight}{tooltipEl}{legendEl}
          {y_columns.map((c,i)=>(
            <Area key={c} yAxisId={getAxisId(c)} type="monotone" dataKey={c} stroke={COLORS[i%COLORS.length]} fill={COLORS[i%COLORS.length]} fillOpacity={0.15} strokeWidth={2} connectNulls/>
          ))}
        </AreaChart>
      );
      case 'pie': {
        const TOP_N = 8;
        const yCol = y_columns[0];
        const shouldAggregate = pieTopN && data.length > TOP_N;
        const pieData = shouldAggregate
          ? (() => {
              const sorted = [...data].sort((a, b) => (Number(b[yCol]) || 0) - (Number(a[yCol]) || 0));
              const top = sorted.slice(0, TOP_N);
              const rest = sorted.slice(TOP_N);
              const otherVal = rest.reduce((sum, r) => sum + (Number(r[yCol]) || 0), 0);
              return [...top, { [x_column]: 'Other', [yCol]: otherVal } as Record<string, unknown>];
            })()
          : data;
        const outerR = 90;
        const innerR = pieDonut ? 52 : 0;
        const DONUT_COLORS = [...COLORS];
        // Use a muted gray for the "Other" slice
        if (shouldAggregate) DONUT_COLORS[TOP_N] = 'rgba(255,255,255,0.15)';
        return (
          <PieChart>
            <Pie data={pieData} dataKey={yCol} nameKey={x_column} cx="50%" cy="50%"
              outerRadius={outerR} innerRadius={innerR}
              label={({percent}: {name?: string; percent?: number}) => {
                const pct = (percent || 0) * 100;
                if (pct < 2) return null;
                return `${pct.toFixed(0)}%`;
              }}
              labelLine={{stroke:'rgba(255,255,255,0.25)', strokeWidth: 1}}
              paddingAngle={pieDonut ? 2 : 0}
              strokeWidth={0}>
              {pieData.map((_,i)=>(<Cell key={i} fill={DONUT_COLORS[i%DONUT_COLORS.length]}/>))}
            </Pie>
            <Tooltip contentStyle={tt}/>
            <Legend
              wrapperStyle={{fontSize:'0.72rem',color:'rgba(255,255,255,0.5)', maxHeight: 100, overflowY: 'auto'}}
              formatter={(value: string) => <span style={{ color: value === 'Other' ? 'rgba(255,255,255,0.4)' : undefined }}>{value}</span>}
            />
          </PieChart>
        );
      }
      default: return null;
    }
  };

  // Show % button when multiple y columns and not in multi view
  const showNormalizeBtn = !isMulti && y_columns.length > 1;
  // Multi sub-toggle: hidden when normalized (all data fits one axis already)
  const showMultiToggle = !normalized && y_columns.length > 1 && (chartType === 'bar' || chartType === 'line');
  // Filter out Pie from chart type buttons when normalized
  const visibleTypes = normalized ? types.filter(t => t.key !== 'pie') : types;
  // Pie sub-toggle: always show for pie, top-N only when lots of data
  const showPieToggle = chartType === 'pie' && !normalized;
  const showPieTopN = chartType === 'pie' && !normalized && data.length > 10;

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: T.s2 }}>
        <span style={{ fontSize: '0.65rem', fontFamily: T.fontMono, fontWeight: 600, letterSpacing: 1, color: T.purple, background: T.purpleDim, border: '1px solid rgba(124,58,255,0.25)', padding: '2px 8px', borderRadius: 4 }}>CHART</span>
        <span style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono, flex: 1, marginLeft: 4 }}>
          Auto-selected: {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
          {needsScroll && <span style={{ marginLeft: 8, opacity: 0.5 }}>· scroll →</span>}
          {needsDualAxis && <span style={{ marginLeft: 8, opacity: 0.5 }}>· dual axis</span>}
          {normalized && <span style={{ marginLeft: 8, color: T.green, opacity: 0.8 }}>· normalized</span>}
          {isMulti && <span style={{ marginLeft: 8, color: T.purple, opacity: 0.8 }}>· multiples</span>}
          {chartType === 'pie' && pieDonut && <span style={{ marginLeft: 8, color: T.cyan, opacity: 0.8 }}>· donut</span>}
          {chartType === 'pie' && pieTopN && <span style={{ marginLeft: 8, color: '#f59e0b', opacity: 0.8 }}>· top 8</span>}
          {rangeFilter !== 'all' && <span style={{ marginLeft: 8, color: '#a78bfa', opacity: 0.8 }}>· {rangeFilter.toUpperCase()}</span>}
        </span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {showNormalizeBtn && (
            <button onClick={() => setNormalized(n => !n)} style={{
              padding: '3px 8px', borderRadius: 4,
              border: `1px solid ${normalized ? 'rgba(34,211,165,0.4)' : T.border}`,
              background: normalized ? 'rgba(34,211,165,0.1)' : 'transparent',
              color: normalized ? T.green : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>%</button>
          )}
          {visibleTypes.map(t => (
            <button key={t.key} onClick={() => setChartType(t.key)} style={{
              padding: '3px 8px', borderRadius: 4,
              border: `1px solid ${chartType === t.key ? 'rgba(124,58,255,0.3)' : T.border}`,
              background: chartType === t.key ? T.purpleDim : 'transparent',
              color: chartType === t.key ? T.purple : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {needsDualAxis && (
        <div style={{ padding: '6px 20px', background: 'rgba(124,58,255,0.06)', borderTop: `1px solid rgba(124,58,255,0.12)`, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: T.fontMono }}>
          Two independent y-axes — <span style={{ color: leftAxisColor }}>{leftAxisLabel}</span> on left · <span style={{ color: rightAxisColor }}>{rightAxisLabel}</span> on right
        </div>
      )}
      {chartType === 'bar' && !barMulti && hasMixedScales && !normalized && (
        <div style={{ padding: '6px 20px', background: 'rgba(245,158,11,0.06)', borderTop: `1px solid rgba(245,158,11,0.15)`, fontSize: '0.7rem', color: 'rgba(245,158,11,0.7)', fontFamily: T.fontMono }}>
          Columns have very different scales — smaller bars may not be visible. Click <strong>%</strong> to normalize or <strong>Multi</strong> to split into panels.
        </div>
      )}
      <div ref={chartRef} style={{ padding: isMulti ? '12px 16px 8px' : hasMixedScales ? '12px 8px 8px' : '16px 20px 10px', overflowX: needsScroll ? 'auto' : 'visible' }}>
        {chartType === 'bar' && barMulti
          ? renderSmallMultiples('bar')
          : chartType === 'line' && lineMulti
            ? renderSmallMultiples('spark')
            : needsScroll
              ? <div style={{ width: fixedWidth }}>{renderChart()}</div>
              : <ResponsiveContainer width="100%" height={chartHeight}>{renderChart() as React.ReactElement}</ResponsiveContainer>
        }
      </div>
      {/* Single / Multi footer — only for bar and line with multiple columns */}
      {showMultiToggle && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 20px 10px', borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, alignSelf: 'center', marginRight: 4, opacity: 0.6 }}>
            {chartType === 'bar' ? 'Bar view' : 'Line view'}:
          </span>
          <button
            onClick={() => chartType === 'bar' ? setBarMulti(false) : setLineMulti(false)}
            style={{
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${!isMulti ? 'rgba(124,58,255,0.35)' : T.border}`,
              background: !isMulti ? T.purpleDim : 'transparent',
              color: !isMulti ? T.purple : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>Single</button>
          <button
            onClick={() => chartType === 'bar' ? setBarMulti(true) : setLineMulti(true)}
            style={{
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${isMulti ? 'rgba(124,58,255,0.35)' : T.border}`,
              background: isMulti ? T.purpleDim : 'transparent',
              color: isMulti ? T.purple : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>Multi</button>
        </div>
      )}
      {/* Pie footer — Pie/Donut shape + All/Top 8 data toggle */}
      {showPieToggle && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 20px 10px', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
          {/* Shape toggle: Pie vs Donut */}
          <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, alignSelf: 'center', marginRight: 4, opacity: 0.6 }}>Shape:</span>
          <button onClick={() => setPieDonut(false)} style={{
            padding: '3px 10px', borderRadius: 4,
            border: `1px solid ${!pieDonut ? 'rgba(0,229,255,0.35)' : T.border}`,
            background: !pieDonut ? 'rgba(0,229,255,0.08)' : 'transparent',
            color: !pieDonut ? T.accent : T.text3,
            fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
          }}>Pie</button>
          <button onClick={() => setPieDonut(true)} style={{
            padding: '3px 10px', borderRadius: 4,
            border: `1px solid ${pieDonut ? 'rgba(0,229,255,0.35)' : T.border}`,
            background: pieDonut ? 'rgba(0,229,255,0.08)' : 'transparent',
            color: pieDonut ? T.accent : T.text3,
            fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
          }}>Donut</button>
          {/* Data toggle: All vs Top 8 — only when lots of data */}
          {showPieTopN && (
            <>
              <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, alignSelf: 'center', marginLeft: 12, marginRight: 4, opacity: 0.6 }}>Data:</span>
              <button onClick={() => setPieTopN(false)} style={{
                padding: '3px 10px', borderRadius: 4,
                border: `1px solid ${!pieTopN ? 'rgba(245,158,11,0.35)' : T.border}`,
                background: !pieTopN ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: !pieTopN ? '#f59e0b' : T.text3,
                fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
              }}>All ({data.length})</button>
              <button onClick={() => setPieTopN(true)} style={{
                padding: '3px 10px', borderRadius: 4,
                border: `1px solid ${pieTopN ? 'rgba(245,158,11,0.35)' : T.border}`,
                background: pieTopN ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: pieTopN ? '#f59e0b' : T.text3,
                fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
              }}>Top 8</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
