import React, { useState } from 'react';
import type { DashboardWidget } from '../../types/api';
import { T } from './tokens';
import { resolveWidgetSize } from '../../types/dashboard';
import { DashboardBarChart } from './charts/DashboardBarChart';
import { DashboardLineChart } from './charts/DashboardLineChart';
import { DashboardAreaChart } from './charts/DashboardAreaChart';
import { DashboardPieChart } from './charts/DashboardPieChart';
import { exportToPNG, exportToCSV } from '../../utils/exportUtils';

/* ── SVG Icons ─────────────────────────────────────────────────── */

function IconDrag() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg className={spinning ? 'refresh-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

/* ── KPI Formatting ────────────────────────────────────────────── */

function formatMetric(value: unknown) {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  }
  return String(value ?? '-');
}

/* ── KPI Card Component ────────────────────────────────────────── */

function KpiCard({ widget }: { widget: DashboardWidget }) {
  // Extract primary metric
  const metricCol = (widget.chart_config?.y_columns || []).find(Boolean) 
    || widget.columns.find(c => widget.rows.some(r => typeof r[c] === 'number'));
  
  const labelCol = widget.chart_config?.x_column || widget.columns.find(c => c !== metricCol);
  
  const primaryRow = widget.rows[widget.rows.length - 1] || widget.rows[0] || {};
  const metric = metricCol ? primaryRow[metricCol] : undefined;
  const label = labelCol ? String(primaryRow[labelCol] ?? '') : '';

  return (
    <div style={{
      background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', height: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(124,58,255,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, fontWeight: 700
        }}>
          $
        </div>
        <div>
          <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.9rem', color: T.text }}>{widget.title}</div>
          <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, marginTop: 1 }}>{label || 'metric'}</div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '2.2rem', color: T.text, lineHeight: 1.1 }}>
          {formatMetric(metric)}
        </div>
        <div style={{ fontSize: '0.72rem', color: T.text3, marginTop: 2 }}>{metricCol || 'value'}</div>
      </div>
    </div>
  );
}

/* ── Main Widget Renderer ─────────────────────────────────────── */

export function WidgetRenderer({
  widget,
  onDelete,
  onUpdateWidget,
}: {
  widget: DashboardWidget;
  onDelete: (id: string) => void;
  onUpdateWidget: (id: string, patch: any) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const size = resolveWidgetSize(widget.size, widget.viz_type, widget.rows.length);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Optimization: we could call the API here to refresh the background SQL
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleExportPNG = async () => {
    await exportToPNG(`widget-${widget.id}`, `${widget.title}_Chart`);
  };

  const handleExportCSV = () => {
    exportToCSV(widget.rows, `${widget.title}_Data`);
  };

  if (widget.viz_type === 'kpi') {
    return (
      <div id={`widget-${widget.id}`} className="widget-card" style={{ height: '100%', position: 'relative' }}>
         {/* Drag Handle Overlay */}
         <div className="widget-drag-handle" style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          opacity: 0, transition: 'opacity 0.2s', cursor: 'grab'
        }}>
          <button className="dash-action-btn" style={{ width: 24, height: 24 }}><IconDrag /></button>
        </div>
        <style>{`.widget-card:hover .widget-drag-handle { opacity: 1; }`}</style>
        <KpiCard widget={widget} />
      </div>
    );
  }

  return (
    <div id={`widget-${widget.id}`} className="widget-card" style={{
      background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', height: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    }}>
      {/* Widget Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '13px 16px 11px',
        borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.3)'
      }}>
        <div className="widget-drag-handle" style={{ cursor: 'grab', color: T.text3, marginRight: 8, marginTop: 2 }}>
          <IconDrag />
        </div>
        <div style={{ flex: 1, fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.93rem', color: T.text }}>
          {widget.title}
        </div>
        
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={handleRefresh} className="dash-action-btn" title="Refresh"><IconRefresh spinning={refreshing} /></button>
          <button onClick={handleExportPNG} className="dash-action-btn" title="Export PNG"><IconDownload /></button>
          <button onClick={handleExportCSV} className="dash-action-btn" title="Export CSV"><IconDownload /></button>
          <button onClick={() => onDelete(widget.id)} className="dash-action-btn dash-action-btn--danger" title="Delete"><IconTrash /></button>
        </div>
      </div>

      {/* Widget Content */}
      <div style={{ flex: 1, padding: '12px 16px 16px', position: 'relative' }}>
        {widget.viz_type === 'bar' && <DashboardBarChart widget={widget as any} size={size} />}
        {widget.viz_type === 'line' && <DashboardLineChart widget={widget as any} size={size} />}
        {widget.viz_type === 'area' && <DashboardAreaChart widget={widget as any} size={size} />}
        {(widget.viz_type === 'pie' || widget.viz_type === 'donut') && <DashboardPieChart widget={widget as any} size={size} />}
        {widget.viz_type === 'table' && (
          <div style={{ overflow: 'auto', maxHeight: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {widget.columns.map(c => <th key={c} style={{ textAlign: 'left', padding: '8px 12px', color: T.text3, fontWeight: 600 }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {widget.rows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}40` }}>
                    {widget.columns.map(c => <td key={c} style={{ padding: '8px 12px', color: T.text2 }}>{String(r[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
