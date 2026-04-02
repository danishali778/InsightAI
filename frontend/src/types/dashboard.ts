import type { DashboardChartConfig, DashboardStats, DashboardSummary, DashboardWidget } from './api';

export type DashboardItem = DashboardSummary;
export type DashboardWidgetItem = DashboardWidget;
export type DashboardMetrics = DashboardStats;
export type WidgetChartConfig = DashboardChartConfig | null | undefined;
export type WidgetVizType = 'kpi' | 'bar' | 'line' | 'area' | 'scatter' | 'donut' | 'table';
export type WidgetSize = 'quarter' | 'half' | 'three-quarter' | 'full';

export function resolveWidgetSize(
  size: string | undefined,
  vizType: string | undefined,
  rowCount?: number,
): WidgetSize {
  if (vizType === 'kpi') return 'quarter';
  if (size === 'quarter' || size === 'half' || size === 'three-quarter' || size === 'full') return size as WidgetSize;
  
  // Auto-assign based on widget type
  if (vizType === 'pie' || vizType === 'donut') return 'half';
  if (vizType === 'table') return 'full';
  if (vizType === 'bar' && (rowCount ?? 0) > 6) return 'full';
  
  return 'half';
}
