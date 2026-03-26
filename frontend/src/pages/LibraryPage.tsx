import { useState, useEffect, useCallback } from 'react';
import { LibrarySidebar } from '../components/library/LibrarySidebar';
import { LibraryTopbar } from '../components/library/LibraryTopbar';
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

  const handleDelete = async (id: string) => {
    await deleteSavedQuery(id);
    if (selectedId === id) setSelectedId(null);
    fetchAll();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: T.bg, color: T.text, fontFamily: T.fontBody }}>
      <LibrarySidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <LibraryTopbar stats={stats} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <FolderSidebar
            folders={folders}
            tags={tags}
            stats={stats}
            activeFolder={activeFolder}
            activeTag={activeTag}
            onFolderChange={(f: string) => { setActiveFolder(f); setSelectedId(null); }}
            onTagChange={(t: string | null) => { setActiveTag(t); setSelectedId(null); }}
          />
          <QueryList
            queries={queries}
            stats={stats}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onRefresh={fetchAll}
          />
        </div>
      </div>
    </div>
  );
}
