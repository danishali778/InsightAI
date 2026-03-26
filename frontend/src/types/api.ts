export interface ApiMessageResponse {
  message: string;
  status?: string | null;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Array<Record<string, unknown>>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface ChartRecommendation {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  x_column: string;
  y_columns: string[];
  title: string;
  x_label: string;
  y_label: string;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  db_type: string;
  database: string;
  host: string;
  port?: number | null;
  username?: string | null;
  status: string;
  tables_count: number;
}

export interface ConnectDatabaseRequest {
  name?: string;
  db_type: string;
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
}

export interface ConnectDatabaseResponse extends DatabaseConnection {
  message: string;
}

export interface TestConnectionRequest {
  db_type: string;
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  tables_found?: number | null;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

export interface SchemaForeignKey {
  column: string;
  referred_table: string;
  referred_column: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  foreign_keys: SchemaForeignKey[];
  row_count?: number | null;
}

export interface SchemaResponse {
  connection_id: string;
  database: string;
  tables: SchemaTable[];
}

export interface ChatRequest {
  connection_id: string;
  session_id?: string;
  message: string;
}

export interface ChatMessageRecord {
  role: 'user' | 'assistant';
  content: string;
  connection_id?: string | null;
  sql?: string | null;
  results?: { row_count?: number } | null;
  error?: string | null;
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  connection_ids: string[];
  last_connection_id: string | null;
  title: string | null;
  message_count: number;
  created_at: string;
}

export interface SessionMessagesResponse {
  session_id: string;
  connection_ids: string[];
  last_connection_id: string | null;
  messages: ChatMessageRecord[];
}

export interface UpdateSessionRequest {
  title?: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  sql?: string | null;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  row_count: number;
  execution_time_ms: number;
  chart_recommendation?: ChartRecommendation | null;
  error?: string | null;
}

export interface ChatUiMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  columns?: string[];
  rows?: Array<Record<string, unknown>>;
  row_count?: number;
  truncated?: boolean;
  execution_time_ms?: number;
  chart_recommendation?: ChartRecommendation;
  error?: string;
}

export interface QueryRecord {
  id: string;
  connection_id: string;
  sql: string;
  success: boolean;
  error?: string | null;
  execution_time_ms?: number | null;
  row_count?: number | null;
  timestamp: string;
}

export interface QueryStats {
  total: number;
  successful: number;
  failed: number;
  avg_time_ms: number;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: string | null;
  day_of_month: number | null;
  hour: number;
  minute: number;
  timezone: string;
  next_run_at: string | null;
}

export interface ScheduleStatusResponse {
  query_id: string;
  schedule: ScheduleConfig | null;
  schedule_label: string | null;
  message: string;
}

export interface SavedQuery {
  id: string;
  title: string;
  sql: string;
  description: string;
  folder_name: string;
  connection_id: string | null;
  icon: string;
  icon_bg: string;
  tags: string[];
  schedule: ScheduleConfig | null;
  schedule_label: string | null;
  created_at: string;
  updated_at: string;
  run_count: number;
  last_run_at: string | null;
}

export interface SaveQueryRequest {
  title: string;
  sql: string;
  description?: string;
  folder_name?: string;
  connection_id?: string;
  icon?: string;
  icon_bg?: string;
  tags?: string[];
  schedule?: ScheduleConfig;
}

export interface SaveQueryResponse extends SavedQuery {
  created: boolean;
}

export interface UpdateSavedQueryRequest extends Partial<SaveQueryRequest> {}

export interface RunSavedQueryResponse {
  query_id: string;
  success: boolean;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  row_count: number;
  execution_time_ms: number;
  error?: string | null;
}

export interface QueryRunHistoryRecord {
  id: string;
  query_id: string;
  success: boolean;
  row_count: number;
  execution_time_ms: number;
  error?: string | null;
  triggered_by: 'manual' | 'schedule';
  ran_at: string;
}

export interface FolderSummary {
  name: string;
  count: number;
}

export interface LibraryStats {
  total_queries: number;
  scheduled: number;
  total_runs: number;
  recently_run: number;
  folders: number;
}

export interface CreateDashboardRequest {
  name: string;
  icon?: string;
}

export interface DashboardSummary {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  widget_count: number;
}

export interface DashboardChartConfig {
  x_column?: string;
  y_columns?: string[];
  title?: string;
  x_label?: string;
  y_label?: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  title: string;
  viz_type: string;
  size: string;
  connection_id?: string | null;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  chart_config?: DashboardChartConfig | null;
  cadence: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
  bar_orientation: 'horizontal' | 'vertical';
  created_at: string;
}

export interface AddDashboardWidgetRequest {
  dashboard_id: string;
  title: string;
  viz_type: string;
  size: string;
  connection_id?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  chart_config?: DashboardChartConfig;
  cadence?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  minH?: number;
  bar_orientation?: 'horizontal' | 'vertical';
}

export interface UpdateDashboardWidgetRequest {
  title?: string;
  size?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  minH?: number;
  bar_orientation?: 'horizontal' | 'vertical';
}

export interface DashboardStats {
  total_widgets: number;
  viz_breakdown: Record<string, number>;
}
