import { useState, useEffect, useCallback } from 'react';
import { MainShell } from '../components/common/MainShell';
import { HeaderIcons } from '../components/common/AppHeader';
import { FolderSidebar } from '../components/library/FolderSidebar';
import { QueryList } from '../components/library/QueryList';
import { T } from '../components/dashboard/tokens';
import { listSavedQueries, listLibraryFolders, listLibraryTags, getLibraryStats, deleteSavedQuery } from '../services/api';
import type { FolderSummary, LibraryStats } from '../types/api';
import type { LibraryQuery } from '../types/library';

export function LibraryPage() {
  const [queries, setQueries] = useState<LibraryQuery[]>([]);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<LibraryStats>({ total_queries: 0, scheduled: 0, total_runs: 0, recently_run: 0, folders: 0 });
  const [activeFolder, setActiveFolder] = useState('All Queries');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [q, f, t, s] = await Promise.all([
        listSavedQueries(activeFolder !== 'All Queries' ? activeFolder : undefined, activeTag || undefined),
        listLibraryFolders(),
        listLibraryTags(),
        getLibraryStats(),
      ]);
      setQueries(q);
      setFolders(f);
      setTags(t);
      setStats(s);
    } catch {
      // silently handle for now
    }
  }, [activeFolder, activeTag]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredQueries = search.trim()
    ? queries.filter(q => q.title.toLowerCase().includes(search.toLowerCase()) || q.sql.toLowerCase().includes(search.toLowerCase()))
    : queries;

  const handleDelete = async (id: string) => {
    await deleteSavedQuery(id);
    if (selectedId === id) setSelectedId(null);
    fetchAll();
  };

  return (
    <MainShell
      title={activeFolder}
      subtitle={activeTag ? `Filtered by ${activeTag}` : `${stats.total_queries} items in library`}
      badge={{
        text: 'Library',
        color: T.purple,
        icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.purple }} />
      }}
      headerActions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Universal Search in Header */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.text3 }}>
              <HeaderIcons.Search />
            </div>
            <input 
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 220, padding: '7px 12px 7px 32px', borderRadius: 8,
                background: T.s2, border: `1px solid ${T.border}`,
                fontSize: '0.78rem', outline: 'none', fontFamily: T.fontBody, color: T.text,
              }}
            />
          </div>
          <button style={headerIconBtnStyle} title="New Folder"><HeaderIcons.Plus /></button>
          <button style={headerActionBtnStyle} title="Import"><HeaderIcons.Download /> Import</button>
        </div>
      }
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <FolderSidebar
          folders={folders}
          tags={tags}
          stats={stats}
          activeFolder={activeFolder}
          activeTag={activeTag}
          search={search}
          onFolderChange={(f: string) => { setActiveFolder(f); setSelectedId(null); }}
          onTagChange={(t: string | null) => { setActiveTag(t); setSelectedId(null); }}
          onSearchChange={setSearch}
          onFolderCreated={fetchAll}
        />
        <QueryList
          queries={filteredQueries}
          stats={stats}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDelete}
          onRefresh={fetchAll}
          activeFolder={activeFolder}
        />
      </div>
    </MainShell>
  );
}

const headerActionBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: 'transparent',
  color: T.text2, fontSize: '0.76rem',
  cursor: 'pointer', fontFamily: T.fontBody,
  transition: 'all 0.18s ease',
};

const headerIconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent',
  color: T.text3, cursor: 'pointer', transition: 'all 0.18s ease',
};
