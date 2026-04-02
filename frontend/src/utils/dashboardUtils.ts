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

export function layoutDims(size: WidgetSize) {
  if (size === 'quarter') return { w: 0.5, h: 5, minW: 0.5, minH: 4 };
  return size === 'full'
    ? { w: 2, h: 8, minW: 2, minH: 6 }
    : { w: 1, h: 7, minW: 1, minH: 5 };
}
