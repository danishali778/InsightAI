import { useState, useEffect } from 'react';
import { ConnectionsSidebar } from '../components/connections/ConnectionsSidebar';
import { ConnectionsTopbar } from '../components/connections/ConnectionsTopbar';
import { ConnectionListPanel } from '../components/connections/ConnectionListPanel';
import type { ConnectionData } from '../components/connections/ConnectionListPanel';
import { ConnectionDetail } from '../components/connections/ConnectionDetail';
import { NewConnectionModal } from '../components/connections/NewConnectionModal';
import { T } from '../components/dashboard/tokens';
import { listConnections, disconnectDatabase, getSchema, getQueryHistory } from '../services/api';

// Map db_type to a display icon and color
const DB_ICONS: Record<string, { icon: string; color: string }> = {
  postgresql: { icon: '🐘', color: 'rgba(51,103,145,0.2)' },
  mysql:      { icon: '🐬', color: 'rgba(0,117,143,0.15)' },
  sqlite:     { icon: '🔵', color: 'rgba(59,130,246,0.15)' },
  bigquery:   { icon: '🔶', color: 'rgba(255,153,0,0.15)' },
  snowflake:  { icon: '❄️', color: 'rgba(41,182,246,0.15)' },
  redshift:   { icon: '🟠', color: 'rgba(255,107,53,0.15)' },
};

function mapApiToConnectionData(apiConn: any): ConnectionData {
  const dbType = (apiConn.db_type || '').toLowerCase();
  const iconInfo = DB_ICONS[dbType] || { icon: '🗄️', color: 'rgba(100,100,100,0.15)' };
  return {
    id: apiConn.id,
    name: apiConn.name || apiConn.database,
    type: apiConn.db_type,
    status: apiConn.status === 'connected' ? 'live' : 'offline',
    queries: 0,
    icon: iconInfo.icon,
    color: iconInfo.color,
    host: apiConn.host,
    port: apiConn.port,
    database: apiConn.database,
    username: apiConn.username,
    tables_count: apiConn.tables_count,
  };
}

export function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);

  // Fetch connections from API on mount
  const fetchConnections = async () => {
    try {
      const data = await listConnections();
      const mapped = (data as any[]).map(mapApiToConnectionData);
      setConnections(mapped);
      // Auto-select the first connection
      if (mapped.length > 0 && !activeId) {
        setActiveId(mapped[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Fetch schema when active connection changes
  useEffect(() => {
    if (!activeId) { setSchema(null); return; }
    getSchema(activeId)
      .then(s => setSchema(s))
      .catch(() => setSchema(null));
    getQueryHistory(activeId, 20)
      .then(h => setQueryHistory(h))
      .catch(() => setQueryHistory([]));
  }, [activeId]);

  const handleDelete = async (connId: string) => {
    try {
      await disconnectDatabase(connId);
      setConnections(prev => prev.filter(c => c.id !== connId));
      if (activeId === connId) {
        setActiveId(connections.find(c => c.id !== connId)?.id || null);
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleConnectionAdded = () => {
    setIsModalOpen(false);
    fetchConnections();
  };

  const activeConnection = connections.find(c => c.id === activeId) || null;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: T.bg, color: T.text, fontFamily: T.fontBody }}>
      
      {/* LEFT NAV SIDEBAR */}
      <ConnectionsSidebar />

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        
        {/* TOPBAR */}
        <ConnectionsTopbar onNewConnection={() => setIsModalOpen(true)} />

        {/* BODY (ListPanel + Detail) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ConnectionListPanel 
            connections={connections} 
            activeId={activeId} 
            onSelect={setActiveId}
            onAdd={() => setIsModalOpen(true)}
          />
          <ConnectionDetail 
            connection={activeConnection} 
            schema={schema}
            queryHistory={queryHistory}
            onDelete={handleDelete}
            onRefreshSchema={() => {
              if (activeId) getSchema(activeId).then(s => setSchema(s)).catch(() => {});
            }}
          />
        </div>

      </div>

      <NewConnectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSaved={handleConnectionAdded}
      />
    </div>
  );
}
