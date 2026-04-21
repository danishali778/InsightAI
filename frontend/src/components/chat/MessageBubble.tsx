import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { SqlBlock } from './SqlBlock';
import { ResultsTable } from './ResultsTable';
import { BaseChartContainer } from '../charts/BaseChartContainer';
import { AddToDashboardModal } from './AddToDashboardModal';
import { SaveQueryModal } from './SaveQueryModal';
import { useSmartSave } from '../../hooks/useSmartSave';
import { inferViz, autoTitle, layoutDims } from '../../utils/dashboardUtils';
import { Pin, Save, Plus, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ChatMessageView } from '../../types/chat';

export function MessageBubble({ 
  message, 
  connectionId,
  onSqlSave,
  onTogglePin
}: { 
  message: ChatMessageView, 
  connectionId?: string,
  onSqlSave?: (messageId: string, newSql: string) => Promise<void>,
  onTogglePin?: (messageId: string, isPinned: boolean) => Promise<void>
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const [isSavingSql, setIsSavingSql] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  
  const { smartAddToDashboard, smartSaveToLibrary, isSaving: isSmartSaving } = useSmartSave();

  const handleSaved = (created: boolean) => {
    setSaveLabel(created ? '✅ Saved!' : '📌 Already saved');
    setTimeout(() => setSaveLabel(null), 3000);
  };

  const handleDashboardClick = () => {
    if (!connectionId) return;
    smartAddToDashboard(message, connectionId, () => setModalOpen(true));
  };

  const handleLibraryClick = () => {
    if (!message.sql || !connectionId) return;
    smartSaveToLibrary(
      message.sql,
      connectionId,
      message.chart_recommendation?.title || 'Saved from Chat',
      () => setSaveModalOpen(true),
      () => {
        setSaveLabel('✅ Saved!');
        setTimeout(() => setSaveLabel(null), 3000);
      }
    );
  };

  if (message.role === 'user') {
    return (
      <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 12 }}>
        <div style={{
          maxWidth: '70%', background: '#fafafa', border: `1px solid ${T.border}`,
          borderRadius: '16px 16px 4px 16px', padding: '10px 16px',
          fontSize: '0.92rem', lineHeight: 1.5, color: T.text,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}>
          {message.content}
        </div>
      </div>
    );
  }
// Assistant
  return (
    <div id={message.id ? `msg-${message.id}` : undefined} style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* AI Header & Content */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '0 12px 20px' }}>
        {/* Grid Logo Icon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, width: 20, height: 20, marginTop: 4, flexShrink: 0 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 2 }} />
          <div style={{ background: T.accent, borderRadius: 2 }} />
          <div style={{ background: T.purple, borderRadius: 2 }} />
          <div style={{ background: '#d1d1d1', borderRadius: 2 }} />
        </div>
        
        <div style={{ fontSize: '1rem', lineHeight: 1.6, color: T.text, fontWeight: 450, flex: 1 }}>
          {message.error ? (
            <div style={{ color: T.red, background: 'rgba(239, 68, 68, 0.05)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.red}20` }}>
              <span style={{ fontWeight: 700, marginRight: 8 }}>Error</span>
              {message.error}
            </div>
          ) : (
            message.content
          )}
        </div>
      </div>

      {/* Technical Result Box (SQL, Table, Charts) */}
      {(message.sql || message.rows) && !message.error && (
        <div style={{
          marginLeft: 34, // Alignment with text
          background: '#fff', 
          border: `1px solid #e5e5e5`,
          borderRadius: 16, 
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>
          {/* Metadata Header */}
          <div style={{ 
            padding: '10px 16px', 
            background: '#fcfcfc', 
            borderBottom: `1px solid #e5e5e5`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: T.text3, fontWeight: 600, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
              {message.sql ? `SQL generated - ${message.sql.length} chars` : 'Data results'}
            </div>
            <button 
              onClick={() => message.sql && navigator.clipboard.writeText(message.sql)}
              style={{ background: 'none', border: 'none', color: T.accent, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: T.fontBody }}
            >
              Copy
            </button>
          </div>

          {/* SQL Block */}
          {message.sql && (
            <SqlBlock
              sql={message.sql}
              defaultOpen={false} // Match the reference: collapsed by default or integrated
              onSave={onSqlSave && message.id ? async (newSql) => {
                setIsSavingSql(true);
                try { await onSqlSave(message.id!, newSql); } finally { setIsSavingSql(false); }
              } : undefined}
              isSaving={isSavingSql}
            />
          )}

          {/* Results Table */}
          {message.columns && message.rows && message.rows.length > 0 && (
            <ResultsTable
              columns={message.columns}
              rows={message.rows}
              rowCount={message.row_count}
              executionTime={message.execution_time_ms}
            />
          )}

          {/* Chart Section */}
          {message.chart_recommendation && message.chart_recommendation.type !== 'table' && message.rows && message.columns && (
            <BaseChartContainer
              recommendation={message.chart_recommendation}
              rows={message.rows}
              columns={message.columns}
              column_metadata={message.column_metadata}
            />
          )}

          {/* Assistant Action Bar (Inside Box) */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid #e5e5e5`, display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa' }}>
            <button
              onClick={handleLibraryClick}
              disabled={!!saveLabel || !message.sql || isSmartSaving}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                background: '#fff', color: saveLabel ? T.green : T.text2,
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saveLabel ? 'Saved' : 'Save to Library'}
            </button>

            <button
              onClick={handleDashboardClick}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                background: '#fff', color: T.text2,
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Add to Dashboard
            </button>

            <div style={{ flex: 1 }} />
            
            <div style={{ display: 'flex', gap: 14, color: T.text3 }}>
              <ThumbsUp size={16} strokeWidth={2} style={{ cursor: 'pointer', opacity: 0.5 }} />
              <ThumbsDown size={16} strokeWidth={2} style={{ cursor: 'pointer', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      )}
      
      <SaveQueryModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        sql={message.sql || ''}
        defaultTitle={message.chart_recommendation?.title || 'Saved from Chat'}
        connectionId={connectionId}
        onSaved={handleSaved}
      />
      <AddToDashboardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={{
          title: message.chart_recommendation?.title || 'Data Query',
          dbName: 'database',
          rowCount: message.row_count || message.rows?.length,
          sql: message.sql,
          columns: message.columns,
          rows: message.rows,
          connectionId: connectionId,
          chart_recommendation: message.chart_recommendation,
          column_metadata: message.column_metadata,
        }}
      />
    </div>
  );
}
