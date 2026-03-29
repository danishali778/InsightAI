import { useEffect, useRef, useState } from 'react';
import { T } from '../dashboard/tokens';
import { saveQuery, listLibraryFolders } from '../../services/api';
import type { FolderSummary } from '../../types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sql: string;
  defaultTitle?: string;
  connectionId?: string;
  onSaved: (created: boolean) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: T.s2, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '8px 12px', color: T.text,
  fontFamily: T.fontBody, fontSize: '0.82rem', outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.8px',
  textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono,
  marginBottom: 6, display: 'block',
};

export function SaveQueryModal({ isOpen, onClose, sql, defaultTitle, connectionId, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('Uncategorized');
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle || 'Saved from Chat');
    setSelectedFolder('Uncategorized');
    setNewFolderMode(false);
    setNewFolderName('');
    setError('');
    listLibraryFolders().then(setFolders).catch(() => {});
    setTimeout(() => titleRef.current?.select(), 50);
  }, [isOpen, defaultTitle]);

  if (!isOpen) return null;

  const handleFolderChange = (value: string) => {
    if (value === '__new__') {
      setNewFolderMode(true);
      setSelectedFolder('__new__');
    } else {
      setNewFolderMode(false);
      setSelectedFolder(value);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { setError('Query title is required.'); return; }
    if (newFolderMode && !newFolderName.trim()) { setError('Enter a name for the new folder.'); return; }

    const folderName = newFolderMode ? newFolderName.trim() : selectedFolder;
    setSaving(true);
    setError('');
    try {
      const result = await saveQuery({
        title: trimmedTitle,
        sql,
        connection_id: connectionId,
        folder_name: folderName,
      });
      onSaved(result.created);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && !e.shiftKey) handleSave();
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 420, background: T.s1, border: `1px solid ${T.border2}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: '0.95rem', color: T.text }}>
              Save Query to Library
            </div>
            <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono, marginTop: 2 }}>
              Choose a folder or create a new one
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, background: 'transparent',
            border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Query Title</label>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Monthly Revenue by Region"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>

          {/* Folder */}
          <div>
            <label style={labelStyle}>Folder</label>
            <select
              value={selectedFolder}
              onChange={e => handleFolderChange(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            >
              <option value="Uncategorized">📁 Uncategorized</option>
              {folders
                .filter(f => f.name !== 'Uncategorized' && f.name !== 'Public Library')
                .map(f => (
                  <option key={f.name} value={f.name}>📁 {f.name}</option>
                ))}
              <option disabled style={{ color: T.text3 }}>──────────────</option>
              <option value="__new__">＋ Create new folder…</option>
            </select>

            {/* New folder input — appears inline */}
            {newFolderMode && (
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                style={{ ...inputStyle, marginTop: 8 }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, background: `${T.red}18`,
              border: `1px solid ${T.red}44`, color: T.red, fontSize: '0.75rem',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: '0.78rem',
            fontFamily: T.fontBody, cursor: 'pointer',
            border: `1px solid ${T.border}`, background: 'transparent', color: T.text3,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
            fontFamily: T.fontBody, cursor: saving ? 'default' : 'pointer',
            border: `1px solid rgba(0,229,255,0.3)`, background: T.accentDim, color: T.accent,
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? '⏳ Saving…' : '📌 Save to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}
