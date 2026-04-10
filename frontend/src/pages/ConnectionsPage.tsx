import { useState, useEffect } from 'react';
import { MainShell } from '../components/common/MainShell';
import { HeaderIcons } from '../components/common/AppHeader';
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
    <MainShell
      title="Database Connections"
      subtitle={`${connections.length} active database bridges`}
      badge={{
        text: 'Bridge',
        color: T.accent,
        icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
      }}
      headerActions={
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: `1px solid ${T.accent}`, background: T.accent,
            color: '#fff', fontSize: '0.76rem', cursor: 'pointer', fontFamily: T.fontBody,
            transition: 'all 0.18s ease', fontWeight: 600,
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
          }}
        >
          <HeaderIcons.Plus /> New Connection
        </button>
      }
    >
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

      <NewConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleConnectionAdded}
      />
    </MainShell>
  );
}
