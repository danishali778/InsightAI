import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartModuleProps } from '../types';
import { COLORS, formatYAxisValue } from '../utils/dataProcessors';
import { T } from '../../dashboard/tokens';

export function PieChartModule({
  data,
  xColumn,
  yColumns,
  normalized,
  column_metadata
}: ChartModuleProps) {
  const [pieDonut, setPieDonut] = useState(false);
  const [pieTopN, setPieTopN] = useState(false);

  const chartHeight = 280;
  const showPieTopN = !normalized && data.length > 10;

  const TOP_N = 8;
  const yCol = yColumns[0];
  const isColCurrency = column_metadata?.[yCol] === 'currency';
  const shouldAggregate = pieTopN && data.length > TOP_N;

  const pieData = shouldAggregate
    ? (() => {
        const sorted = [...data].sort((a, b) => (Number(b[yCol]) || 0) - (Number(a[yCol]) || 0));
        const top = sorted.slice(0, TOP_N);
        const rest = sorted.slice(TOP_N);
        const otherVal = rest.reduce((sum, r) => sum + (Number(r[yCol]) || 0), 0);
        return [...top, { [xColumn]: 'Other', [yCol]: otherVal } as Record<string, unknown>];
      })()
    : data;

  const outerR = "80%";
  const innerR = pieDonut ? "50%" : 0;

  const DONUT_COLORS = [...COLORS];
  if (shouldAggregate) {
    DONUT_COLORS[TOP_N] = T.border;
  }

  const total = pieData.reduce((sum, r) => sum + (Number(r[yCol]) || 0), 0) || 1;

  const ttStyle = {
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    fontSize: '0.78rem',
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(10px)',
    color: T.text,
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 10px', gap: 16 }}>
        {/* Left: pie / donut chart + total */}
        <div style={{ flex: '0 0 52%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey={yCol}
                nameKey={xColumn}
                cx="50%"
                cy="50%"
                outerRadius={outerR}
                innerRadius={innerR}
                paddingAngle={pieDonut ? 2 : 0}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={ttStyle}
                formatter={(value: unknown) => {
                  const formatted = formatYAxisValue(Number(value) || 0, false, isColCurrency);
                  return [formatted, yCol] as [string, string];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono, marginTop: -8, paddingBottom: 6, letterSpacing: 0.5 }}>
            TOTAL · <span style={{ color: T.text2, fontWeight: 700 }}>{formatYAxisValue(total, false, isColCurrency)}</span>
          </div>
        </div>

        {/* Right: custom legend — dot + name + % */}
        <div style={{ flex: 1, minWidth: 0, maxHeight: chartHeight, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {pieData.map((row, i) => {
            const val = Number(row[yCol]) || 0;
            const pct = (val / total * 100).toFixed(1);
            const name = String(row[xColumn] || '');
            const color = DONUT_COLORS[i % DONUT_COLORS.length];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: T.text2, fontFamily: T.fontMono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {name}
                </span>
                <span style={{ fontSize: '0.72rem', color: color, fontFamily: T.fontMono, flexShrink: 0, fontWeight: 600 }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 20px 10px', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
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
    </>
  );
}
