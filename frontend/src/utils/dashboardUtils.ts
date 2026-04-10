import type { AddToDashboardModalProps } from '../types/chat';
import type { WidgetSize, WidgetVizType } from '../types/dashboard';

/* ─── helpers ─── */
export function isNumericValue(v: unknown) {
  return typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)));
}

export function inferViz(message: AddToDashboardModalProps['message']): WidgetVizType {
  const cols = message.columns || [];
  const rows = message.rows || [];
  if (rows.length === 1 && cols.some(c => rows.some(r => isNumericValue(r[c])))) return 'kpi';
  const rec = message.chart_recommendation?.type;
  if (rec === 'bar') return 'bar';
  if (rec === 'line') return 'line';
  if (rec === 'area') return 'area';
  if (rec === 'pie') return 'donut';
  return 'table';
}

export function autoTitle(message: AddToDashboardModalProps['message']) {
  return message.title || message.chart_recommendation?.title || 'Untitled Widget';
}

export function layoutDims(size: WidgetSize, vizType?: string) {
  // KPI Header Standard: 25% Width (5 columns), Compact Height (5 units)
  if (vizType === 'kpi') {
    return { w: 5, h: 5, minW: 5, maxW: 5, minH: 5, maxH: 5 };
  }

  if (size === 'quarter') return { w: 5, h: 7, minW: 3, minH: 4 };
  if (size === 'three-quarter') return { w: 13, h: 7, minW: 10, minH: 5 };
  return size === 'full'
    ? { w: 20, h: 7, minW: 10, minH: 5 }
    : { w: 10, h: 7, minW: 5, minH: 5 };
}
