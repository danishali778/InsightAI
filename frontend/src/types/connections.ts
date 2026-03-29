import type { DatabaseConnection, QueryRecord, SchemaResponse } from './api';

export type ConnectionStatus = 'live' | 'offline' | 'warning';

export interface ConnectionListItem {
  id: string;
  name: string;
  type: string;
  version?: string;
  status: ConnectionStatus;
  latency?: number;
  queries: number;
  icon: string;
  color: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  tables_count?: number;
  ssl_mode?: string;
  readonly?: boolean;
}

export interface ConnectionDetailData {
  connection: ConnectionListItem | null;
  schema?: SchemaResponse | null;
  queryHistory?: QueryRecord[];
  onDelete?: (id: string) => void;
  onRefreshSchema?: () => void;
}

export type ConnectionApiRecord = DatabaseConnection;

export interface ConnectionDetailProps extends ConnectionDetailData {}

export type ConnectionDetailTab = 'overview' | 'credentials' | 'schema' | 'security' | 'activity';
