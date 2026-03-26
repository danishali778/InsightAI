import { useCallback, useEffect, useState } from 'react';
import { createDashboard, listDashboards } from '../services/api';
import type { DashboardItem } from '../types/dashboard';

interface CreateDashboardInput {
  name: string;
  icon?: string;
}

interface UseDashboardCatalogOptions {
  autoLoad?: boolean;
}

export function useDashboardCatalog(options: UseDashboardCatalogOptions = {}) {
  const { autoLoad = true } = options;
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listDashboards();
      setDashboards(items);
      return items;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboards');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewDashboard = useCallback(async ({ name, icon }: CreateDashboardInput) => {
    setCreating(true);
    setError(null);
    try {
      const created = await createDashboard({ name, icon });
      const items = await listDashboards();
      setDashboards(items);
      return items.find((item) => item.id === created.id) ?? { ...created, widget_count: 0 };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dashboard');
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    reloadDashboards();
  }, [autoLoad, reloadDashboards]);

  return {
    dashboards,
    loading,
    creating,
    error,
    setDashboards,
    reloadDashboards,
    createNewDashboard,
  };
}
