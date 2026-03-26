import { useRef, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { T } from '../dashboard/tokens';
import type { ChatChartBlockProps } from '../../types/chat';

const COLORS = ['#00e5ff', '#7c3aff', '#22d3a5', '#f59e0b', '#f87171', '#a29bfe', '#fab1a0', '#81ecec'];

export function ChartBlock({ recommendation, rows }: ChatChartBlockProps) {
  const [chartType, setChartType] = useState(recommendation.type);
  const chartRef = useRef<HTMLDivElement>(null);
  const { x_column, y_columns } = recommendation;

  const data = rows.map(row => {
    const item: Record<string, unknown> = { [x_column]: row[x_column] };
    y_columns.forEach(col => { const v = row[col]; item[col] = typeof v === 'number' ? v : parseFloat(String(v)) || 0; });
    return item;
  });

  const types = [
    { key: 'bar' as const, label: 'Bar' }, { key: 'line' as const, label: 'Line' },
    { key: 'pie' as const, label: 'Pie' }, { key: 'area' as const, label: 'Area' },
  ];

  const gs = 'rgba(255,255,255,0.06)';
  const ts = { fontSize: 11, fill: 'rgba(255,255,255,0.4)' };
  const tt = { borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '0.78rem', background: '#1e1e2e', color: '#e2e8f0' };

  const renderChart = () => {
    const cp = { data, margin: { top: 10, right: 20, left: 10, bottom: 5 } };
    switch (chartType) {
      case 'bar': return (<ResponsiveContainer width="100%" height={240}><BarChart {...cp}><CartesianGrid strokeDasharray="3 3" stroke={gs}/><XAxis dataKey={x_column} tick={ts} axisLine={{stroke:gs}}/><YAxis tick={ts} axisLine={{stroke:gs}}/><Tooltip contentStyle={tt}/><Legend wrapperStyle={{fontSize:'0.72rem',color:'rgba(255,255,255,0.5)'}}/>{y_columns.map((c,i)=>(<Bar key={c} dataKey={c} fill={COLORS[i%COLORS.length]} radius={[4,4,0,0]}/>))}</BarChart></ResponsiveContainer>);
      case 'line': return (<ResponsiveContainer width="100%" height={240}><LineChart {...cp}><CartesianGrid strokeDasharray="3 3" stroke={gs}/><XAxis dataKey={x_column} tick={ts} axisLine={{stroke:gs}}/><YAxis tick={ts} axisLine={{stroke:gs}}/><Tooltip contentStyle={tt}/><Legend wrapperStyle={{fontSize:'0.72rem',color:'rgba(255,255,255,0.5)'}}/>{y_columns.map((c,i)=>(<Line key={c} type="monotone" dataKey={c} stroke={COLORS[i%COLORS.length]} strokeWidth={2.5} dot={{r:3}}/>))}</LineChart></ResponsiveContainer>);
      case 'area': return (<ResponsiveContainer width="100%" height={240}><AreaChart {...cp}><CartesianGrid strokeDasharray="3 3" stroke={gs}/><XAxis dataKey={x_column} tick={ts} axisLine={{stroke:gs}}/><YAxis tick={ts} axisLine={{stroke:gs}}/><Tooltip contentStyle={tt}/><Legend wrapperStyle={{fontSize:'0.72rem',color:'rgba(255,255,255,0.5)'}}/>{y_columns.map((c,i)=>(<Area key={c} type="monotone" dataKey={c} stroke={COLORS[i%COLORS.length]} fill={COLORS[i%COLORS.length]} fillOpacity={0.15} strokeWidth={2}/>))}</AreaChart></ResponsiveContainer>);
      case 'pie': return (<ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data} dataKey={y_columns[0]} nameKey={x_column} cx="50%" cy="50%" outerRadius={90} label={({name,percent}: {name?: string; percent?: number})=>`${name || ''} ${((percent || 0)*100).toFixed(0)}%`} labelLine={{stroke:'rgba(255,255,255,0.25)'}}>{data.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Tooltip contentStyle={tt}/><Legend wrapperStyle={{fontSize:'0.72rem',color:'rgba(255,255,255,0.5)'}}/></PieChart></ResponsiveContainer>);
      default: return null;
    }
  };

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: T.s2 }}>
        <span style={{ fontSize: '0.65rem', fontFamily: T.fontMono, fontWeight: 600, letterSpacing: 1, color: T.purple, background: T.purpleDim, border: '1px solid rgba(124,58,255,0.25)', padding: '2px 8px', borderRadius: 4 }}>CHART</span>
        <span style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono, flex: 1, marginLeft: 4 }}>
          Auto-selected: {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {types.map(t => (
            <button key={t.key} onClick={() => setChartType(t.key)} style={{
              padding: '3px 8px', borderRadius: 4, border: `1px solid ${chartType === t.key ? 'rgba(124,58,255,0.3)' : T.border}`,
              background: chartType === t.key ? T.purpleDim : 'transparent',
              color: chartType === t.key ? T.purple : T.text3,
              fontSize: '0.68rem', cursor: 'pointer', fontFamily: T.fontMono,
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div ref={chartRef} style={{ padding: '16px 20px 10px' }}>{renderChart()}</div>
    </div>
  );
}
