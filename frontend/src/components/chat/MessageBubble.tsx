import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { SqlBlock } from './SqlBlock';
import { ResultsTable } from './ResultsTable';
import { ChartBlock } from './ChartBlock';
import { AddToDashboardModal } from './AddToDashboardModal';
import { SaveQueryModal } from './SaveQueryModal';
import type { ChatMessageView } from '../../types/chat';

export function MessageBubble({ message, connectionId }: { message: ChatMessageView, connectionId?: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);

  const handleSaved = (created: boolean) => {
    setSaveLabel(created ? '✅ Saved!' : '📌 Already saved');
    setTimeout(() => setSaveLabel(null), 3000);
  };

  if (message.role === 'user') {
    return (
      <div style={{ padding: '6px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{
          maxWidth: 520, background: T.s2, border: `1px solid ${T.border}`,
          borderRadius: '14px 14px 4px 14px', padding: '12px 16px',
          fontSize: '0.88rem', lineHeight: 1.6, color: T.text,
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
    <div style={{ padding: '6px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 8 }}>
      <div style={{
        maxWidth: 820, width: '100%', background: T.s1, border: `1px solid ${T.border}`,
        borderRadius: '4px 14px 14px 14px', overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Summary */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: `1px solid ${T.border}` }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000', fontWeight: 800,
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

        {/* Chart */}
        {message.chart_recommendation && message.rows && message.columns && (
          <ChartBlock
            recommendation={message.chart_recommendation}
            rows={message.rows}
            columns={message.columns}
          />
        )}

        {/* Action bar */}
        {!message.error && (
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => { if (message.sql) setSaveModalOpen(true); }}
              disabled={!!saveLabel || !message.sql}
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: 'transparent',
                color: saveLabel ? T.green : T.text3,
                fontSize: '0.72rem', cursor: (!!saveLabel || !message.sql) ? 'default' : 'pointer', fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!saveLabel && message.sql) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
              onMouseLeave={e => { if (!saveLabel && message.sql) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = saveLabel ? T.green : T.text3; } }}
            >
              {saveLabel || '📌 Save Query'}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: 'transparent',
                color: T.text3,
                fontSize: '0.72rem', cursor: 'pointer', fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
            >
              ➕ Dashboard
            </button>
            <button
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid rgba(0,229,255,0.25)`,
                background: T.accentDim,
                color: T.accent,
                fontSize: '0.72rem', cursor: 'pointer', fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.accentDim; e.currentTarget.style.color = T.accent; }}
            >
              🔄 Regenerate
            </button>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: '0.65rem', color: T.text3, fontFamily: T.fontMono }}>👍 &nbsp; 👎</span>
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
          }}
        />
      </div>
    </div>
  );
}
