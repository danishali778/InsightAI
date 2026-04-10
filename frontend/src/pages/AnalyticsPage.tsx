import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { MainShell } from '../components/common/MainShell';
import { AnalyticsHero } from '../components/analytics/AnalyticsHero';
import { AnalyticsSectionCard } from '../components/analytics/AnalyticsSectionCard';
import { AnalyticsStatCard } from '../components/analytics/AnalyticsStatCard';
import { AnalyticsQueryTable } from '../components/analytics/AnalyticsQueryTable';
import { T } from '../components/dashboard/tokens';
import { getAnalyticsOverview } from '../services/api';
import type { AnalyticsOverviewResponse } from '../types/api';

const HEALTH_COLORS = [T.green, T.red];

function AnalyticsEmptyState() {
  return (
    <div style={{ 
      border: `1px solid ${T.border}`, 
      borderRadius: 18, 
      padding: '80px 40px', 
      background: T.s1, 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20
    }}>
      <div style={{ 
        width: 64, 
        height: 64, 
        borderRadius: 20, 
        background: `rgba(0,229,255,0.1)`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '1.8rem'
      }}>
        📊
      </div>
      <div style={{ maxWidth: 460 }}>
        <h2 style={{ fontFamily: T.fontHead, fontSize: '1.4rem', color: T.text, marginBottom: 12 }}>No activity recorded yet</h2>
        <p style={{ color: T.text2, lineHeight: 1.6, fontSize: '0.94rem', marginBottom: 24 }}>
          Your analytics dashboard is calculated on-the-fly based on your query history and dashboard activity. 
          Run your first query in Chat to start seeing performance insights here.
        </p>
        <a 
          href="/chat" 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            borderRadius: 12,
            background: T.accent,
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'transform 0.2s ease',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Start Chatting
        </a>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAnalyticsOverview();
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const overview = data?.overview;
  const queryHealth = data?.query_health;
  const library = data?.library;
  const dashboards = data?.dashboards;
  const healthData = queryHealth
    ? [
        { name: 'Successful', value: queryHealth.successful },
        { name: 'Failed', value: queryHealth.failed },
      ]
    : [];

  return (
    <MainShell
      title="Performance Insights"
      subtitle="Universal analytics across all connections"
      badge={{
        text: 'Live Data',
        color: T.green,
        icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
      }}
    >
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: '0 2px 30px' }}>
        <AnalyticsHero />

        {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center', color: T.text3 }}>Loading insights...</div>
        ) : error ? (
          <div style={{ padding: '100px 0', textAlign: 'center', color: T.red }}>{error}</div>
        ) : overview && overview.total_queries === 0 ? (
          <AnalyticsEmptyState />
        ) : overview ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
              <AnalyticsStatCard label="Active Connections" value={String(overview.active_connections)} hint="Connected databases available to chat, library, and dashboards." />
              <AnalyticsStatCard label="Queries Run" value={String(overview.total_queries)} hint={`${overview.success_rate}% success rate across recorded executions.`} tone="green" />
              <AnalyticsStatCard label="Saved Queries" value={String(overview.saved_queries)} hint={`${overview.scheduled_queries} scheduled queries currently configured.`} tone="purple" />
              <AnalyticsStatCard label="Dashboards" value={String(overview.dashboards)} hint={`${overview.total_widgets} widgets created from query output.`} tone="yellow" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <AnalyticsSectionCard eyebrow="Query health" title="Execution quality">
                <div style={{ height: 240, width: '100%', display: 'flex', alignItems: 'center' }}>
                  <ResponsiveContainer width="40%" height="100%">
                    <PieChart>
                      <Pie data={healthData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {healthData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={HEALTH_COLORS[index % HEALTH_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        itemStyle={{ color: T.text }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div style={{ flex: 1, paddingLeft: 30 }}>
                    <div style={{ fontSize: '2.2rem', fontFamily: T.fontHead, color: T.green }}>{overview.success_rate}%</div>
                    <div style={{ color: T.text3, fontSize: '0.8rem', marginTop: 4, letterSpacing: 0.5, fontWeight: 500 }}>OVERALL RELIABILITY</div>
                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green }} />
                        <span style={{ fontSize: '0.85rem', color: T.text2 }}>{queryHealth?.successful} Successful</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.red }} />
                        <span style={{ fontSize: '0.85rem', color: T.text2 }}>{queryHealth?.failed} Failed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnalyticsSectionCard>

              <AnalyticsSectionCard eyebrow="Asset summary" title="Library and dashboards">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ color: T.text3, fontSize: '0.7rem', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>SAVED IN LIBRARY</div>
                      <div style={{ fontSize: '1.4rem', fontFamily: T.fontHead }}>{library?.total_queries || 0} Queries</div>
                    </div>
                    <div style={{ height: 40, width: 60 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{v: 4}, {v: 7}, {v: 5}, {v: 9}]}>
                          <Bar dataKey="v" fill={T.accent} radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div style={{ height: 1, background: T.border, opacity: 0.5 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ color: T.text3, fontSize: '0.7rem', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>DASHBOARD ASSETS</div>
                      <div style={{ fontSize: '1.4rem', fontFamily: T.fontHead }}>{dashboards?.total_widgets || 0} Widgets</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Object.entries(dashboards?.viz_breakdown || {}).slice(0, 3).map(([key, val]) => (
                        <div key={key} title={`${key}: ${val}`} style={{ width: 24, height: 24, borderRadius: 6, background: T.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: `1px solid ${T.border}` }}>
                          📈
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnalyticsSectionCard>
            </div>

            <AnalyticsQueryTable queries={data?.recent_queries || []} />
          </>
        ) : null}
      </div>
    </MainShell>
  );
}
