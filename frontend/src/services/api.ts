const API_BASE = 'http://localhost:8000/api';

// ─── Database ──────────────────────────────────────────────

export async function connectDatabase(config: {
    db_type: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}) {
    const res = await fetch(`${API_BASE}/database/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
}

export async function testConnection(config: {
    db_type: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}) {
    const res = await fetch(`${API_BASE}/database/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    return res.json();
}

export async function listConnections() {
    const res = await fetch(`${API_BASE}/database/connections`);
    return res.json();
}

export async function disconnectDatabase(connectionId: string) {
    const res = await fetch(`${API_BASE}/database/connections/${connectionId}`, {
        method: 'DELETE',
    });
    return res.json();
}

// ─── Chat ──────────────────────────────────────────────────

export async function sendMessage(data: {
    connection_id: string;
    session_id?: string;
    message: string;
}) {
    const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
}

export async function listSessions() {
    const res = await fetch(`${API_BASE}/chat/sessions`);
    return res.json();
}

export async function getSessionMessages(sessionId: string) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`);
    return res.json();
}

export async function deleteSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
    });
    return res.json();
}

export async function createSession(connectionId: string) {
    const res = await fetch(`${API_BASE}/chat/sessions?connection_id=${connectionId}`, {
        method: 'POST',
    });
    return res.json();
}

// ─── Schema ────────────────────────────────────────────────

export async function getSchema(connectionId: string) {
    const res = await fetch(`${API_BASE}/database/connections/${connectionId}/schema`);
    if (!res.ok) throw new Error('Failed to fetch schema');
    return res.json();
}

// ─── Query History ─────────────────────────────────────────

export async function getQueryHistory(connectionId?: string, limit: number = 20) {
    const params = new URLSearchParams();
    if (connectionId) params.set('connection_id', connectionId);
    params.set('limit', String(limit));
    const res = await fetch(`${API_BASE}/query-history?${params}`);
    return res.json();
}

export async function getQueryStats(connectionId: string) {
    const res = await fetch(`${API_BASE}/query-history/stats?connection_id=${connectionId}`);
    return res.json();
}

// ─── Query Library ─────────────────────────────────────────

export async function listSavedQueries(folder?: string, tag?: string, connectionId?: string) {
    const params = new URLSearchParams();
    if (folder) params.set('folder', folder);
    if (tag) params.set('tag', tag);
    if (connectionId) params.set('connection_id', connectionId);
    const res = await fetch(`${API_BASE}/library/queries?${params}`);
    return res.json();
}

export async function saveQuery(data: {
    title: string; sql: string; description?: string; folder_name?: string;
    connection_id?: string; icon?: string; icon_bg?: string; tags?: string[]; schedule?: string;
}) {
    const res = await fetch(`${API_BASE}/library/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
}

export async function getSavedQuery(queryId: string) {
    const res = await fetch(`${API_BASE}/library/queries/${queryId}`);
    return res.json();
}

export async function updateSavedQuery(queryId: string, data: Record<string, any>) {
    const res = await fetch(`${API_BASE}/library/queries/${queryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteSavedQuery(queryId: string) {
    const res = await fetch(`${API_BASE}/library/queries/${queryId}`, { method: 'DELETE' });
    return res.json();
}

export async function runSavedQuery(queryId: string) {
    const res = await fetch(`${API_BASE}/library/queries/${queryId}/run`, { method: 'POST' });
    return res.json();
}

export async function listLibraryFolders() {
    const res = await fetch(`${API_BASE}/library/folders`);
    return res.json();
}

export async function listLibraryTags() {
    const res = await fetch(`${API_BASE}/library/tags`);
    return res.json();
}

export async function getLibraryStats() {
    const res = await fetch(`${API_BASE}/library/stats`);
    return res.json();
}

// ─── Dashboard ─────────────────────────────────────────────

export async function listDashboards() {
    const res = await fetch(`${API_BASE}/dashboard/dashboards`);
    return res.json();
}

export async function createDashboard(data: { name: string; icon?: string }) {
    const res = await fetch(`${API_BASE}/dashboard/dashboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteDashboard(dashboardId: string) {
    const res = await fetch(`${API_BASE}/dashboard/dashboards/${dashboardId}`, { method: 'DELETE' });
    return res.json();
}

// ─── Dashboard Widgets ─────────────────────────────────────

export async function listDashboardWidgets(dashboardId?: string) {
    const params = dashboardId ? `?dashboard_id=${dashboardId}` : '';
    const res = await fetch(`${API_BASE}/dashboard/widgets${params}`);
    return res.json();
}

export async function addDashboardWidget(data: {
    dashboard_id: string; title: string; viz_type: string; size: string;
    connection_id?: string; columns: string[]; rows: Record<string, any>[];
    chart_config?: { x_column?: string; y_columns?: string[]; title?: string; x_label?: string; y_label?: string };
    cadence?: string;
}) {
    const res = await fetch(`${API_BASE}/dashboard/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
}

export async function deleteDashboardWidget(widgetId: string) {
    const res = await fetch(`${API_BASE}/dashboard/widgets/${widgetId}`, { method: 'DELETE' });
    return res.json();
}

export async function getDashboardStats(dashboardId?: string) {
    const params = dashboardId ? `?dashboard_id=${dashboardId}` : '';
    const res = await fetch(`${API_BASE}/dashboard/stats${params}`);
    return res.json();
}
