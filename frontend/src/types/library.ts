import type { LibraryStats, RunSavedQueryResponse, SavedQuery } from './api';

export type LibraryQuery = SavedQuery;
export type LibraryRunResult = RunSavedQueryResponse | { success: false; error: string };

export interface QueryListProps {
  queries: LibraryQuery[];
  stats: LibraryStats;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export interface FolderSidebarProps {
  folders: Array<{ name: string; count: number }>;
  tags: string[];
  stats: {
    total_queries: number;
    scheduled: number;
    total_runs: number;
    recently_run?: number;
  };
  activeFolder: string;
  activeTag: string | null;
  search: string;
  onFolderChange: (folder: string) => void;
  onTagChange: (tag: string | null) => void;
  onSearchChange: (value: string) => void;
  onFolderCreated: () => void;
}
