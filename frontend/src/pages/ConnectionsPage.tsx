import { useState, useEffect } from 'react';
import { AppSidebar } from '../components/common/AppSidebar';
import { ConnectionsTopbar } from '../components/connections/ConnectionsTopbar';
import { ConnectionListPanel } from '../components/connections/ConnectionListPanel';
import { ConnectionDetail } from '../components/connections/ConnectionDetail';
import { NewConnectionModal } from '../components/connections/NewConnectionModal';
import { T } from '../components/dashboard/tokens';
import { listConnections, disconnectDatabase, getSchema, getQueryHistory } from '../services/api';
import type { QueryRecord, SchemaResponse } from '../types/api';
import type { ConnectionListItem } from '../types/connections';
import { mapConnectionRecord } from '../mappers/connections';

export function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryRecord[]>([]);

  const fetchConnections = async () => {
    try {
      const data = await listConnections();
      const mapped = data.map(mapConnectionRecord);
      setConnections(mapped);
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

  useEffect(() => {
    if (!activeId) { setSchema(null); return; }
    getSchema(activeId)
      .then(setSchema)
      .catch(() => setSchema(null));
    getQueryHistory(activeId, 20)
      .then(setQueryHistory)
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
      <AppSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <ConnectionsTopbar onNewConnection={() => setIsModalOpen(true)} />

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
              if (activeId) getSchema(activeId).then(setSchema).catch(() => {});
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
