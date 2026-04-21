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
    // ... (rest of user bubble)
    return (
      <div style={{ padding: '6px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{
          maxWidth: 520, background: T.s3, border: `1px solid ${T.border}`,
          borderRadius: '16px 16px 4px 16px', padding: '12px 18px',
          fontSize: '0.88rem', lineHeight: 1.6, color: T.text,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}>
          {message.content}
        </div>
        <div style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono, marginTop: 5, display: 'flex', gap: 8 }}>
          <span>You</span><span>·</span><span>Just now</span>
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div id={message.id ? `msg-${message.id}` : undefined} style={{ padding: '6px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 8 }}>
      <div style={{
        maxWidth: 820, width: '100%', 
        background: 'rgba(255, 255, 255, 0.75)', 
        backdropFilter: T.glass.blur,
        border: `1px solid ${T.border}`,
        borderRadius: '4px 20px 20px 20px', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
      }}>
        {/* Summary */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: `1px solid ${T.border}` }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff', fontWeight: 800,
            fontFamily: T.fontHead,
          }}>Q</div>
          <div style={{ fontSize: '0.87rem', lineHeight: 1.65, color: T.text2 }}>
            {message.error ? (
              <span style={{ color: T.red }}>❌ {message.error}</span>
            ) : (
              message.content
            )}
          </div>
        </div>

        {/* SQL */}
        {message.sql && (
          <SqlBlock
            sql={message.sql}
            defaultOpen
            title="GENERATED SQL"
            onSave={onSqlSave && message.id ? async (newSql) => {
              setIsSavingSql(true);
              try {
                await onSqlSave(message.id!, newSql);
              } finally {
                setIsSavingSql(false);
              }
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

        {/* Empty result notice */}
        {!message.error && message.columns && message.rows && message.rows.length === 0 && (
          <div style={{
            padding: '16px 20px',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: '1rem' }}>🔍</span>
            <div>
              <div style={{ fontSize: '0.84rem', color: T.text2, fontWeight: 600 }}>
                No results found
              </div>
              <div style={{ fontSize: '0.78rem', color: T.text3, marginTop: 2 }}>
                The query ran successfully but returned 0 rows. Try adjusting your filters, date range, or search terms.
              </div>
            </div>
          </div>
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

        {/* Action bar */}
        {!message.error && (
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={handleLibraryClick}
              disabled={!!saveLabel || !message.sql || isSmartSaving}
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: isSmartSaving ? T.s2 : 'transparent',
                color: saveLabel ? T.green : T.text3,
                fontSize: '0.72rem', cursor: (!!saveLabel || !message.sql || isSmartSaving) ? 'default' : 'pointer', fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!saveLabel && message.sql && !isSmartSaving) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
              onMouseLeave={e => { if (!saveLabel && message.sql && !isSmartSaving) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = saveLabel ? T.green : T.text3; } }}
            >
              {isSmartSaving ? '⏳...' : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saveLabel ? '✅' : <Save size={14} />}
                  {saveLabel || 'Save Query'}
                </div>
              )}
            </button>
            <button
              onClick={handleDashboardClick}
              disabled={isSmartSaving}
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: isSmartSaving ? T.s2 : 'transparent',
                color: T.text3,
                fontSize: '0.72rem', cursor: isSmartSaving ? 'default' : 'pointer', fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                opacity: isSmartSaving ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!isSmartSaving) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
              onMouseLeave={e => { if (!isSmartSaving) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; } }}
            >
              {isSmartSaving ? '⏳...' : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} />
                  Dashboard
                </div>
              )}
            </button>
            {onTogglePin && message.id && (
              <button
                onClick={async () => {
                  if (onTogglePin && message.id) {
                    setIsPinning(true);
                    try {
                      await onTogglePin(message.id, !message.is_pinned);
                    } finally {
                      setIsPinning(false);
                    }
                  }
                }}
                disabled={isPinning}
                style={{
                  padding: '5px 12px', borderRadius: 6, 
                  border: `1px solid ${message.is_pinned ? T.accent : T.border}`,
                  background: message.is_pinned ? T.accentDim : 'transparent',
                  color: message.is_pinned ? T.accent : T.text3,
                  fontSize: '0.72rem', cursor: isPinning ? 'default' : 'pointer', fontFamily: T.fontBody,
                  display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isPinning && !message.is_pinned) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
                onMouseLeave={e => { if (!isPinning && !message.is_pinned) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; } }}
              >
                {isPinning ? '...' : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pin size={14} style={{ transform: message.is_pinned ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }} />
                    {message.is_pinned ? 'Pinned' : 'Pin Chat'}
                  </div>
                )}
              </button>
            )}
            <button
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.accent}`,
                background: 'transparent',
                color: T.accent,
                fontSize: '0.72rem', cursor: 'pointer', fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.accent; }}
            >
              <RotateCcw size={14} />
              Regenerate
            </button>
            <span style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 12, color: T.text3, opacity: 0.6 }}>
              <ThumbsUp size={14} style={{ cursor: 'pointer' }} aria-label="Like" />
              <ThumbsDown size={14} style={{ cursor: 'pointer' }} aria-label="Dislike" />
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
    </div>
  );
}
