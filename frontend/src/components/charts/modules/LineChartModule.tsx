import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartModuleProps } from '../types';
import { CustomTooltip } from '../shared/CustomTooltip';
import { formatYAxisValue, formatColLabel, COLORS } from '../utils/dataProcessors';
import { chartStyles } from '../utils/config';
import { T } from '../../dashboard/tokens';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TruncatedXTick = ({ x, y, payload }: any) => {
  const raw = String(payload?.value ?? '');
  const label = raw.length > 8 ? raw.slice(0, 8) + '…' : raw;
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={4} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={11} transform="rotate(-45)">
        {label}
      </text>
    </g>
  );
};

export function LineChartModule({
  data,
  rawData,
  xColumn,
  yColumns,
  colMaxes,
  normalized,
  column_metadata,
  xLabel,
  yLabel,
  tooltipColumns,
  isDualAxis: isDualAxisProp,
}: ChartModuleProps) {
  const [isMulti, setIsMulti] = useState(false);

  const SCROLL_THRESHOLD = 20;
  const effectivePointCount = data.length * Math.max(1, yColumns.length);
  const needsScroll = !isMulti && effectivePointCount > SCROLL_THRESHOLD;
  const fixedWidth = Math.max(600, data.length * Math.max(48, yColumns.length * 22));

  const xLabelInterval = needsScroll ? 0 : (data.length > 20 ? Math.ceil(data.length / 12) - 1 : 0);
  const chartMargin = { top: 10, right: 20, left: 50, bottom: 10 };

  const xAxisProps = {
    dataKey: xColumn,
    tick: TruncatedXTick,
    height: xLabel && !needsScroll ? 70 : 55,
    axisLine: { stroke: chartStyles.gridStroke },
    interval: xLabelInterval,
    ...(xLabel && !needsScroll ? {
      label: {
        value: xLabel,
        position: 'insideBottom' as const,
        offset: -6,
        fill: 'rgba(255,255,255,0.35)',
        fontSize: 11,
      }
    } : {}),
  };

  const isColCurrency = (colName: string) => column_metadata?.[colName] === 'currency';

  // ── Dual-axis logic ────────────────────────────────────────
  const sortedBySca = [...yColumns].sort((a, b) => (colMaxes[b] || 0) - (colMaxes[a] || 0));
  const maxVal = colMaxes[sortedBySca[0]] || 1;

  const leftCols = sortedBySca.filter(c => (colMaxes[c] || 0) >= maxVal / 10);
  const rightCols = sortedBySca.filter(c => (colMaxes[c] || 0) < maxVal / 10);

  const needsDualAxis = !normalized && !isMulti && (isDualAxisProp || rightCols.length > 0);
  const getAxisId = (col: string): 'left' | 'right' => (needsDualAxis && rightCols.includes(col)) ? 'right' : 'left';

  const chartHeight = 360;

  const leftAxisColor = COLORS[yColumns.indexOf(leftCols[0]) % COLORS.length];
  const rightAxisColor = COLORS[yColumns.indexOf(rightCols[0] ?? '') % COLORS.length];

  const leftAxisLabel = (() => {
    const full = leftCols.map(formatColLabel).join(' / ');
    return full.length > 24 ? formatColLabel(leftCols[0]) : full;
  })();
  const rightAxisLabel = (() => {
    const full = rightCols.map(formatColLabel).join(' / ');
    return full.length > 24 ? formatColLabel(rightCols[0]) : full;
  })();

  const AXIS_W = 72;
  const makeAxisLabel = (value: string, color: string, side: 'left' | 'right') => ({
    value,
    angle: side === 'left' ? -90 : 90,
    position: (side === 'left' ? 'insideLeft' : 'insideRight') as 'insideLeft' | 'insideRight',
    fill: color,
    fontSize: 10,
    opacity: 0.85,
    style: { textAnchor: 'middle' as const },
  });

  const yAxisLabelText = yLabel || (yColumns.length === 1 ? formatColLabel(yColumns[0]) : 'Value');
  const yAxisLabelSingle = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: (props: any) => {
      const vb = props.viewBox;
      if (!vb) return null;
      const cx = vb.x - 32;
      const cy = vb.y + vb.height / 2;
      return (
        <text x={cx} y={cy} transform={`rotate(-90, ${cx}, ${cy})`}
          textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11}>
          {yAxisLabelText}
        </text>
      );
    }
  };

  const showMultiToggle = !normalized && yColumns.length > 1;

  const renderSmallMultiples = () => {
    const getFmtVal = (colName: string) => (v: number) => {
      const isCurr = isColCurrency(colName);
      const prefix = isCurr ? '$' : '';
      const abs = Math.abs(v);
      if (abs >= 1e9) return `${prefix}${(v / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${prefix}${(v / 1e6).toFixed(2)}M`;
      if (abs >= 1e3) return `${prefix}${(v / 1e3).toFixed(1)}k`;
      if (abs < 10 && abs !== 0) return `${prefix}${v.toFixed(2)}`;
      return `${prefix}${Math.round(v).toLocaleString()}`;
    };
    const xTick = { fontSize: 9, fill: 'rgba(255,255,255,0.35)' };
    const tipStyle = { background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.72rem' };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {yColumns.map((col, i) => {
          const color = COLORS[i % COLORS.length];
          const firstVal = Number(rawData[0]?.[col]) || 0;
          const lastVal = Number(rawData[rawData.length - 1]?.[col]) || 0;
          const pctChange = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : 0;
          const firstX = String(rawData[0]?.[xColumn] ?? '');
          const isDown = pctChange < 0;
          const gradId = `sm-grad-${i}`;

          return (
            <div key={col} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px 10px', minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                {formatColLabel(col)}
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.1, marginBottom: 3 }}>
                {getFmtVal(col)(lastVal)}
              </div>
              <div style={{ fontSize: '0.7rem', color: isDown ? '#f87171' : '#22d3a5', marginBottom: 10 }}>
                {isDown ? '▼' : '▲'} {Math.abs(pctChange).toFixed(0)}% since {firstX}
              </div>

              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={rawData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey={xColumn} tick={xTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip contentStyle={tipStyle} labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }} itemStyle={{ color }}
                    formatter={(v: any) => [typeof v === 'number' ? (isColCurrency(col) ? `$${v.toLocaleString()}` : v.toLocaleString()) : v, formatColLabel(col)] as any} />
                  <Area type="monotone" dataKey={col} stroke={color} fill={`url(#${gradId})`} strokeWidth={2} dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleChart = () => {
    const margin = needsDualAxis ? { ...chartMargin, left: 40, right: 40 } : chartMargin;
    const cp = { data, margin };
    const dims = needsScroll ? { width: fixedWidth, height: chartHeight } : {};
    const yAxisFmtLeft = (v: number) => formatYAxisValue(v, normalized, leftCols.some(isColCurrency));
    const yAxisFmtRight = (v: number) => formatYAxisValue(v, normalized, rightCols.some(isColCurrency));
    const yAxisFmtSingle = (v: number) => formatYAxisValue(v, normalized, yColumns.some(isColCurrency));

    const yLeft = (
      <YAxis yAxisId="left" width={AXIS_W} tickCount={9}
        tick={{ fontSize: 11, fill: leftAxisColor, opacity: 0.75 }}
        axisLine={{ stroke: leftAxisColor, strokeOpacity: 0.45 }}
        tickLine={{ stroke: leftAxisColor, strokeOpacity: 0.3 }}
        tickFormatter={yAxisFmtLeft} label={makeAxisLabel(leftAxisLabel, leftAxisColor, 'left')} />
    );
    const yRight = needsDualAxis ? (
      <YAxis yAxisId="right" orientation="right" width={AXIS_W} tickCount={9}
        tick={{ fontSize: 11, fill: rightAxisColor, opacity: 0.75 }}
        axisLine={{ stroke: rightAxisColor, strokeOpacity: 0.45 }}
        tickLine={{ stroke: rightAxisColor, strokeOpacity: 0.3 }}
        tickFormatter={yAxisFmtRight} label={makeAxisLabel(rightAxisLabel, rightAxisColor, 'right')} />
    ) : null;

    return (
      <LineChart {...dims} {...cp}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke}/>
        <XAxis {...xAxisProps} />
        {needsDualAxis ? (
          <>{yLeft}{yRight}</>
        ) : (
          <YAxis yAxisId="left" width={65} tickCount={9} tick={chartStyles.textStyle} axisLine={{ stroke: chartStyles.gridStroke }} tickFormatter={yAxisFmtSingle} label={yAxisLabelSingle} />
        )}
        <Tooltip content={<CustomTooltip normalizedColMaxes={normalized ? colMaxes : null} tooltipColumns={tooltipColumns} />} />
        {yColumns.map((c, i) => (
          <Line key={c} yAxisId={getAxisId(c)} type="monotone" dataKey={c} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
        ))}
      </LineChart>
    );
  };

  return (
    <>
      {needsDualAxis && (
        <div style={{ padding: '6px 20px', background: 'rgba(124,58,255,0.06)', borderTop: `1px solid rgba(124,58,255,0.12)`, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: T.fontMono }}>
          Two independent y-axes — <span style={{ color: leftAxisColor }}>{leftAxisLabel}</span> on left · <span style={{ color: rightAxisColor }}>{rightAxisLabel}</span> on right
        </div>
      )}

      <div style={{ padding: isMulti ? '12px 16px 8px' : '16px 20px 0', overflowX: needsScroll ? 'auto' : 'visible' }}>
        {isMulti
          ? renderSmallMultiples()
          : needsScroll
            ? <div style={{ width: fixedWidth }}>{renderSingleChart()}</div>
            : <ResponsiveContainer width="100%" height={chartHeight}>{renderSingleChart() as React.ReactElement}</ResponsiveContainer>
        }
      </div>

      {needsScroll && xLabel && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: T.fontMono, padding: '2px 0 6px' }}>
          {xLabel}
        </div>
      )}

      {yColumns.length > 1 && !isMulti && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, padding: '4px 20px 10px' }}>
          {yColumns.map((col, i) => (
            <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: T.fontMono }}>{xLabel && col === xColumn ? xLabel : formatColLabel(col)}</span>
            </div>
          ))}
        </div>
      )}

      {showMultiToggle && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 20px 10px', borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, alignSelf: 'center', marginRight: 4, opacity: 0.6 }}>
            Line view:
          </span>
          <button
            onClick={() => setIsMulti(false)}
            style={{
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${!isMulti ? 'rgba(124,58,255,0.35)' : T.border}`,
              background: !isMulti ? T.purpleDim : 'transparent',
              color: !isMulti ? T.purple : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>Single</button>
          <button
            onClick={() => setIsMulti(true)}
            style={{
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${isMulti ? 'rgba(124,58,255,0.35)' : T.border}`,
              background: isMulti ? T.purpleDim : 'transparent',
              color: isMulti ? T.purple : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>Multi</button>
        </div>
      )}
    </>
  );
}
