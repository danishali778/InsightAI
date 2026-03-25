import { T } from './tokens';

interface WidgetData {
  id: string;
  title: string;
  viz_type: string;
  size: string;
  columns: string[];
  rows: Record<string, any>[];
  chart_config?: { x_column?: string; y_columns?: string[]; title?: string; x_label?: string; y_label?: string };
  cadence: string;
  created_at: string;
}

const CHART_COLORS = [T.accent, T.purple, T.green, T.yellow, T.orange, '#f87171', '#c084fc', '#60a5fa'];

export function WidgetRenderer({ widget, onDelete }: { widget: WidgetData; onDelete: (id: string) => void }) {
  const vizBadge: Record<string, { bg: string; color: string; label: string }> = {
    bar: { bg: T.greenDim, color: T.green, label: 'BAR' },
    line: { bg: T.accentDim, color: T.accent, label: 'LINE' },
    donut: { bg: T.purpleDim, color: T.purple, label: 'DONUT' },
    table: { bg: T.accentDim, color: T.accent, label: 'TABLE' },
    kpi: { bg: T.yellowDim, color: T.yellow, label: 'KPI' },
  };
  const badge = vizBadge[widget.viz_type] || vizBadge.table;

  return (
    <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.border2}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.88rem', color: T.text }}>{widget.title}</div>
          <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono }}>{widget.rows.length} rows · {widget.cadence}</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 7px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}22` }}>{badge.label}</span>
        <button onClick={() => onDelete(widget.id)} style={{
          width: 22, height: 22, borderRadius: 5, background: 'transparent', border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.65rem',
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = T.red; e.currentTarget.style.background = T.redDim; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}
        >✕</button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 18px 16px' }}>
        {widget.viz_type === 'table' && <TableViz columns={widget.columns} rows={widget.rows} />}
        {widget.viz_type === 'bar' && <BarViz widget={widget} />}
        {widget.viz_type === 'line' && <LineViz widget={widget} />}
        {widget.viz_type === 'donut' && <DonutViz widget={widget} />}
        {widget.viz_type === 'kpi' && <KpiViz widget={widget} />}
      </div>
    </div>
  );
}

/* ═══ TABLE ═══ */
function TableViz({ columns, rows }: { columns: string[]; rows: Record<string, any>[] }) {
  const display = rows.slice(0, 10);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c} style={{
                background: T.s2, padding: '9px 14px', textAlign: 'left',
                fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 600,
                color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase',
                borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((row, i) => (
            <tr key={i} style={{ transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(c => (
                <td key={c} style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, color: T.text2, fontFamily: T.fontMono, fontSize: '0.75rem', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 10 && (
        <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono, padding: '8px 0', textAlign: 'center' }}>
          Showing 10 of {rows.length} rows
        </div>
      )}
    </div>
  );
}

/* ═══ BAR ═══ */
function BarViz({ widget }: { widget: WidgetData }) {
  const xCol = widget.chart_config?.x_column || widget.columns[0];
  const yCol = (widget.chart_config?.y_columns || [])[0] || widget.columns[1];
  if (!xCol || !yCol) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data to chart</div>;

  const items = widget.rows.slice(0, 8).map(r => ({ label: String(r[xCol] ?? ''), value: Number(r[yCol] ?? 0) }));
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <svg viewBox="0 0 260 150" style={{ width: '100%' }}>
      <defs><linearGradient id="wBarG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00e5ff" /><stop offset="100%" stopColor="#7c3aff" /></linearGradient></defs>
      <line x1={70} y1={0} x2={70} y2={items.length * 25 + 5} stroke="rgba(255,255,255,0.08)" />
      {items.map((item, i) => {
        const barW = (item.value / maxVal) * 170;
        return (
          <g key={i}>
            <rect x={70} y={5 + i * 25} width={barW} height={18} rx={3} fill="url(#wBarG)" opacity={0.95 - i * 0.08} />
            <text x={64} y={18 + i * 25} textAnchor="end" fontFamily="DM Mono,monospace" fontSize={9} fill="#4a5568">
              {item.label.length > 10 ? item.label.substring(0, 10) + '…' : item.label}
            </text>
            <text x={76 + barW} y={18 + i * 25} fontFamily="DM Mono,monospace" fontSize={9} fill="#94a3b8">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══ LINE ═══ */
function LineViz({ widget }: { widget: WidgetData }) {
  const xCol = widget.chart_config?.x_column || widget.columns[0];
  const yCols = widget.chart_config?.y_columns || (widget.columns.length > 1 ? [widget.columns[1]] : []);
  if (!xCol || yCols.length === 0) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data to chart</div>;

  const data = widget.rows.slice(0, 20);
  const w = 480, h = 140, padL = 40, padR = 10, padT = 10, padB = 25;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%' }}>
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.08)" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="rgba(255,255,255,0.08)" />
      {yCols.map((yCol, ci) => {
        const values = data.map(r => Number(r[yCol] ?? 0));
        const maxV = Math.max(...values, 1);
        const minV = Math.min(...values, 0);
        const range = maxV - minV || 1;
        const color = CHART_COLORS[ci % CHART_COLORS.length];

        const points = values.map((v, i) => {
          const x = padL + (i / Math.max(values.length - 1, 1)) * chartW;
          const y = padT + chartH - ((v - minV) / range) * chartH;
          return `${x},${y}`;
        }).join(' ');

        const areaPath = `M${points.split(' ')[0]} L${points} L${padL + chartW},${padT + chartH} L${padL},${padT + chartH}Z`;

        return (
          <g key={yCol}>
            <defs>
              <linearGradient id={`lg${ci}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#lg${ci})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {values.map((v, i) => {
              const x = padL + (i / Math.max(values.length - 1, 1)) * chartW;
              const y = padT + chartH - ((v - minV) / range) * chartH;
              return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
            })}
          </g>
        );
      })}
      {/* X labels (show a few) */}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map((r, i, arr) => {
        const idx = widget.rows.indexOf(r);
        const x = padL + (idx / Math.max(data.length - 1, 1)) * chartW;
        return (
          <text key={i} x={x} y={h - 3} textAnchor="middle" fontFamily="DM Mono,monospace" fontSize={8} fill="#4a5568">
            {String(r[xCol] ?? '').substring(0, 8)}
          </text>
        );
      })}
    </svg>
  );
}

/* ═══ DONUT ═══ */
function DonutViz({ widget }: { widget: WidgetData }) {
  const xCol = widget.chart_config?.x_column || widget.columns[0];
  const yCol = (widget.chart_config?.y_columns || [])[0] || widget.columns[1];
  if (!xCol || !yCol) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data to chart</div>;

  const items = widget.rows.slice(0, 6).map(r => ({ label: String(r[xCol] ?? ''), value: Math.abs(Number(r[yCol] ?? 0)) }));
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = 50, cx = 65, cy = 65, sw = 18;
  const circumference = 2 * Math.PI * r;

  let offset = -90; // start from top

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 130 130" style={{ width: 130, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.s4} strokeWidth={sw} />
        {items.map((item, i) => {
          const pct = item.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const color = CHART_COLORS[i % CHART_COLORS.length];
          const rotate = offset;
          offset += pct * 360;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
              transform={`rotate(${rotate} ${cx} ${cy})`} opacity={0.9}
            />
          );
        })}
        <text x={cx} y={cy - 2} fill={T.text} fontSize={12} fontFamily="Syne,sans-serif" fontWeight={800} textAnchor="middle">
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 12} fill={T.text3} fontSize={7} fontFamily="DM Mono,monospace" textAnchor="middle">TOTAL</text>
      </svg>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: T.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              <span style={{ fontSize: '0.75rem', fontFamily: T.fontMono, color: T.text }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ KPI ═══ */
function KpiViz({ widget }: { widget: WidgetData }) {
  const firstRow = widget.rows[0];
  if (!firstRow) return <div style={{ color: T.text3, fontSize: '0.78rem' }}>No data</div>;

  const entries = widget.columns.map(c => ({ label: c, value: firstRow[c] })).slice(0, 4);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(entries.length, 4)}, 1fr)`, gap: 12 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, ${CHART_COLORS[i]}22 0%, transparent 70%)`, transform: 'translate(20px, -20px)' }} />
          <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.5rem', color: T.text, letterSpacing: -0.5, marginBottom: 4 }}>
            {typeof e.value === 'number' ? e.value.toLocaleString() : String(e.value ?? '—')}
          </div>
          <div style={{ fontSize: '0.72rem', color: T.text3, fontFamily: T.fontMono }}>{e.label}</div>
        </div>
      ))}
    </div>
  );
}
