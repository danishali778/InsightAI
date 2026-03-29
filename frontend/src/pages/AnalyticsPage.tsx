import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AnalyticsHero } from '../components/analytics/AnalyticsHero';
import { AnalyticsSectionCard } from '../components/analytics/AnalyticsSectionCard';
import { AnalyticsStatCard } from '../components/analytics/AnalyticsStatCard';
import { AppSidebar } from '../components/common/AppSidebar';
import { T } from '../components/dashboard/tokens';
import { getAnalyticsOverview } from '../services/api';
import type { AnalyticsOverviewResponse } from '../types/api';

const HEALTH_COLORS = [T.green, T.red];
const BAR_COLOR = '#33d4ff';

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
  const healthData = queryHealth
    ? [
        { name: 'Successful', value: queryHealth.successful },
        { name: 'Failed', value: queryHealth.failed },
      ]
    : [];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: T.bg, color: T.text, fontFamily: T.fontBody }}>
      <AppSidebar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 26px 30px', background: `radial-gradient(circle at top right, rgba(0,229,255,0.08), transparent 28%), ${T.bg}` }}>
        <AnalyticsHero />

        {loading ? (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: '48px 28px', background: T.s1, color: T.text2 }}>
            Loading analytics...
          </div>
        ) : error ? (
          <div style={{ border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 18, padding: '24px 22px', background: T.s1, color: T.red }}>
            {error}
          </div>
        ) : overview ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
              <AnalyticsStatCard label="Active Connections" value={String(overview.active_connections)} hint="Connected databases available to chat, library, and dashboards." />
              <AnalyticsStatCard label="Queries Run" value={String(overview.total_queries)} hint={`${overview.success_rate}% success rate across recorded executions.`} tone="green" />
              <AnalyticsStatCard label="Saved Queries" value={String(overview.saved_queries)} hint={`${overview.scheduled_queries} scheduled queries currently configured.`} tone="purple" />
              <AnalyticsStatCard label="Dashboards" value={String(overview.dashboards)} hint={`${overview.total_widgets} widgets created from query output.`} tone="yellow" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 16, marginBottom: 20 }}>
              <AnalyticsSectionCard eyebrow="Query health" title="Execution quality">
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, alignItems: 'center' }}>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={healthData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2}>
                          {healthData.map((entry, index) => (
                            <Cell key={entry.name} fill={HEALTH_COLORS[index % HEALTH_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: T.s1, border: `1px solid ${T.border}` }}>
                      <div style={{ color: T.text3, fontFamily: T.fontMono, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 }}>
                        Average latency
                      </div>
                      <div style={{ color: T.text, fontFamily: T.fontHead, fontSize: '1.6rem', fontWeight: 700 }}>{overview.avg_time_ms} ms</div>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: T.s1, border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: T.text2, fontSize: '0.84rem' }}>
                        <span>Successful</span>
                        <strong style={{ color: T.green }}>{overview.successful_queries}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: T.text2, fontSize: '0.84rem', marginTop: 10 }}>
                        <span>Failed</span>
                        <strong style={{ color: T.red }}>{overview.failed_queries}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </AnalyticsSectionCard>

              <AnalyticsSectionCard eyebrow="Asset summary" title="Library and dashboards">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: T.s1, border: `1px solid ${T.border}` }}>
                    <div style={{ color: T.text3, fontFamily: T.fontMono, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8 }}>
                      Library footprint
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: T.text2, fontSize: '0.84rem' }}>
                      <span>Total queries</span>
                      <strong style={{ color: T.text }}>{data.library.total_queries}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: T.text2, fontSize: '0.84rem', marginTop: 8 }}>
                      <span>Total runs</span>
                      <strong style={{ color: T.text }}>{data.library.total_runs}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: T.text2, fontSize: '0.84rem', marginTop: 8 }}>
                      <span>Folders</span>
                      <strong style={{ color: T.text }}>{data.library.folders}</strong>
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', borderRadius: 14, background: T.s1, border: `1px solid ${T.border}` }}>
                    <div style={{ color: T.text3, fontFamily: T.fontMono, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8 }}>
                      Dashboard footprint
                    </div>
                    {Object.entries(data.dashboards.viz_breakdown).length > 0 ? (
                      Object.entries(data.dashboards.viz_breakdown).map(([vizType, count]) => (
                        <div key={vizType} style={{ display: 'flex', justifyContent: 'space-between', color: T.text2, fontSize: '0.84rem', marginTop: 8 }}>
                          <span>{vizType}</span>
                          <strong style={{ color: T.text }}>{count}</strong>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: T.text2, fontSize: '0.84rem' }}>No widgets created yet.</div>
                    )}
                  </div>
                </div>
              </AnalyticsSectionCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <AnalyticsSectionCard eyebrow="Connection usage" title="Most-used connections">
                {data.top_connections.length > 0 ? (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={data.top_connections} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke={T.text3} tick={{ fill: T.text2, fontSize: 11 }} />
                        <YAxis stroke={T.text3} tick={{ fill: T.text2, fontSize: 11 }} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="query_count" fill={BAR_COLOR} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ color: T.text2, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    No connection activity yet. Connect a database and run queries from Chat to populate this section.
                  </div>
                )}
              </AnalyticsSectionCard>

              <AnalyticsSectionCard eyebrow="Recent activity" title="Latest query executions">
                {data.recent_queries.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {data.recent_queries.map((query) => (
                      <div key={query.id} style={{ padding: '13px 14px', borderRadius: 14, background: T.s1, border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: query.success ? T.green : T.red, flexShrink: 0 }} />
                            <strong style={{ color: T.text, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {query.connection_name}
                            </strong>
                          </div>
                          <div style={{ color: T.text3, fontFamily: T.fontMono, fontSize: '0.68rem' }}>
                            {new Date(query.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ color: T.text2, fontFamily: T.fontMono, fontSize: '0.72rem', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {query.sql}
                        </div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 10, color: T.text3, fontSize: '0.72rem', flexWrap: 'wrap' }}>
                          <span>{query.execution_time_ms ?? 0} ms</span>
                          <span>{query.row_count ?? 0} rows</span>
                          <span style={{ color: query.success ? T.green : T.red }}>{query.success ? 'Successful' : query.error || 'Failed'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: T.text2, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    No query executions recorded yet. Ask something in Chat and this feed will start filling in.
                  </div>
                )}
              </AnalyticsSectionCard>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
