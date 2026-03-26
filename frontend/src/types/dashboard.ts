import type { DashboardChartConfig, DashboardStats, DashboardSummary, DashboardWidget } from './api';

export type DashboardItem = DashboardSummary;
export type DashboardWidgetItem = DashboardWidget;
export type DashboardMetrics = DashboardStats;
export type WidgetChartConfig = DashboardChartConfig | null | undefined;
export type WidgetVizType = 'kpi' | 'bar' | 'line' | 'area' | 'scatter' | 'donut' | 'table';
export type WidgetSize = 'half' | 'full';

export function resolveWidgetSize(
  size: string | undefined,
  vizType: string | undefined,
  rowCount?: number,
): WidgetSize {
  if (size === 'half' || size === 'full') return size;
  // Auto-assign based on widget type
  if (vizType === 'table') return 'full';
  if (vizType === 'bar' && (rowCount ?? 0) > 6) return 'full';
  return 'half';
}
