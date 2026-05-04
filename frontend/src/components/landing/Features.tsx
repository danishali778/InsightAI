import { T } from '../dashboard/tokens';
import { Cpu, BarChart3, Zap, Shield, Library, Users } from 'lucide-react';

const features = [
    { icon: <Cpu size={20} />, name: 'NATURAL_LANGUAGE_ENGINE', desc: 'Describe your question in plain English and get production-ready SQL in under 2 seconds.' },
    { icon: <BarChart3 size={20} />, name: 'AUTO_VISUALIZATION_NODE', desc: 'Automatically selects bar charts, line graphs, pie charts, or scatter plots based on your data type.' },
    { icon: <Zap size={20} />, name: 'REAL_TIME_EXECUTION', desc: 'Query runs directly on your database — no data copying, no latency, always fresh results.' },
    { icon: <Shield size={20} />, name: 'SECURE_BY_DEFAULT', desc: 'Read-only access, end-to-end encryption, and role-based permissions keep your data safe.' },
    { icon: <Library size={20} />, name: 'QUERY_MANIFEST_LIBRARY', desc: 'Save, schedule, and share queries across your team. Build a living library of business intelligence.' },
    { icon: <Users size={20} />, name: 'TEAM_SYNC_COLLABORATION', desc: 'Comment on queries, share dashboards, and set up automated reports to any Slack channel or inbox.' },
];

export function Features() {
    return (
        <section id="features" style={{ background: T.s1, padding: '120px 60px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 80 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 40, height: 1, background: T.accent }} />
                      <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', color: T.accent, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 950 }}>SYSTEM_CAPABILITIES</span>
                    </div>
                    <h2 style={{ fontFamily: T.fontHead, fontWeight: 950, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: -3, lineHeight: 0.9, color: T.text, textTransform: 'uppercase' }}>
                        ENGINEERED_FOR_DATA_PRECISION
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: T.border }}>
                    {features.map((f, i) => (
                        <div
                            key={f.name}
                            style={{ 
                              background: T.s1, padding: '48px 40px', transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', 
                              cursor: 'default', position: 'relative', overflow: 'hidden' 
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = T.s2; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = T.s1; }}
                        >
                            <div style={{ color: T.accent, marginBottom: 24 }}>
                                {f.icon}
                            </div>
                            <div style={{ fontFamily: T.fontHead, fontWeight: 950, fontSize: '1.1rem', marginBottom: 16, color: T.text, letterSpacing: '-1px' }}>{f.name}</div>
                            <div style={{ fontSize: '0.72rem', color: T.text3, lineHeight: 1.8, fontFamily: T.fontMono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.desc}</div>
                            
                            {/* Decorative ID */}
                            <div style={{ position: 'absolute', top: 20, right: 20, fontSize: '0.5rem', color: T.border, fontFamily: T.fontMono, fontWeight: 950 }}>
                              NODE_0{i+1}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
