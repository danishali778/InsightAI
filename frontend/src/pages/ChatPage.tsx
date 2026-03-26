import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatTopbar } from '../components/chat/ChatTopbar';
import { ChatInput } from '../components/chat/ChatInput';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ConnectionModal } from '../components/chat/ConnectionModal';
import { SchemaPanel } from '../components/chat/SchemaPanel';
import { T } from '../components/dashboard/tokens';
import * as api from '../services/api';
import type { ChatMessageView } from '../types/chat';
import type { DatabaseConnection, SessionSummary } from '../types/api';

export function ChatPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState('');
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    api.listConnections().then(conns => {
      setConnections(conns);
      if (conns.length > 0) setActiveConnectionId(conns[0].id);
    });
    api.listSessions().then(setSessions);
  }, []);

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    api.getSessionMessages(activeSessionId).then(data => {
      const msgs: ChatMessageView[] = data.messages.map((message) => ({
        role: message.role,
        content: message.content,
        sql: message.sql || undefined,
        error: message.error || undefined,
      }));
      setMessages(msgs);
      // Auto-switch to the session's last-used connection
      if (data.last_connection_id && connections.some(c => c.id === data.last_connection_id)) {
        setActiveConnectionId(data.last_connection_id);
      }
    });
  }, [activeSessionId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (message: string) => {
    if (!activeConnectionId) return;
    const userMsg: ChatMessageView = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const r = await api.sendMessage({ connection_id: activeConnectionId, session_id: activeSessionId || undefined, message });
      const assistantMsg: ChatMessageView = {
        role: 'assistant',
        content: r.message,
        sql: r.sql || undefined,
        columns: r.columns,
        rows: r.rows,
        row_count: r.row_count,
        execution_time_ms: r.execution_time_ms,
        chart_recommendation: r.chart_recommendation || undefined,
        error: r.error || undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (!activeSessionId && r.session_id) {
        skipNextFetch.current = true;
        setActiveSessionId(r.session_id);
        api.listSessions().then(setSessions);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '', error: err instanceof Error ? err.message : 'Something went wrong.' }]);
    } finally { setLoading(false); }
  };

  const handleNewChat = () => { setActiveSessionId(null); setMessages([]); };
  const handleDeleteSession = async (sid: string) => {
    await api.deleteSession(sid);
    setSessions(prev => prev.filter(s => s.id !== sid));
    if (activeSessionId === sid) { setActiveSessionId(null); setMessages([]); }
  };
  const handleRenameSession = async (sid: string, title: string) => {
    await api.renameSession(sid, title);
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, title } : s));
  };
  const handleRefreshConnections = () => {
    api.listConnections().then(conns => {
      setConnections(conns);
      if (conns.length > 0 && !activeConnectionId) setActiveConnectionId(conns[0].id);
      else if (conns.length > 0) setActiveConnectionId(conns[conns.length - 1].id);
    });
  };

  const activeConn = connections.find(c => c.id === activeConnectionId);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: T.bg, fontFamily: T.fontBody }}>
      <Sidebar
        sessions={sessions} activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId} onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession} onRenameSession={handleRenameSession}
        onOpenConnect={() => setShowConnectModal(true)}
        connections={connections}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <ChatTopbar
          sessionId={activeSessionId} sessionTitle={activeSession?.title}
          dbType={activeConn?.db_type} dbName={activeConn?.database}
          onToggleSchema={() => setSchemaOpen(p => !p)} schemaOpen={schemaOpen}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#000', boxShadow: '0 4px 20px rgba(0,229,255,0.25)', marginBottom: 8, fontFamily: T.fontHead }}>Q</div>
                  <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '1.4rem', color: T.text }}>What would you like to know?</div>
                  <div style={{ fontSize: '0.88rem', color: T.text3, maxWidth: 420, textAlign: 'center', lineHeight: 1.65, fontWeight: 300 }}>
                    Ask a question in plain English. QueryMind will write the SQL, run it, and show you the results.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10, justifyContent: 'center' }}>
                    {['Show me all tables', 'How many records per table?', 'Describe the database'].map(s => (
                      <button key={s} onClick={() => handleSend(s)} disabled={!activeConnectionId || loading} style={{
                        padding: '6px 13px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.s1,
                        color: T.text3, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; e.currentTarget.style.background = T.s1; }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => <MessageBubble key={i} message={msg} connectionId={activeConnectionId} />)}

              {loading && (
                <div style={{ padding: '6px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 8 }}>
                  <div style={{
                    maxWidth: 400, background: T.s1, border: `1px solid ${T.border}`,
                    borderRadius: '4px 14px 14px 14px', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: '50%', background: T.accent,
                          animation: `thinkbounce 1.2s ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: T.text3, fontFamily: T.fontMono }}>Generating SQL...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              connections={connections} activeConnectionId={activeConnectionId}
              onConnectionChange={setActiveConnectionId} onSend={handleSend} loading={loading}
            />
          </div>

          <SchemaPanel connectionId={activeConnectionId} visible={schemaOpen} />
        </div>
      </div>

      <ConnectionModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} onConnected={handleRefreshConnections} />

      <style>{`
        @keyframes thinkbounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  );
}
