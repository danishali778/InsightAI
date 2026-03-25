export function ChartsShowcase() {
    return (
        <section id="charts" className="charts-glow" style={{ background: 'var(--bg)', padding: '100px 60px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }} className="reveal">
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, display: 'block' }}>Live Visualizations</span>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 16, fontStyle: 'normal' }}>
                    Your data, beautifully rendered
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 520, margin: '0 auto', fontWeight: 300 }}>
                    Every query automatically generates the most suitable chart — from bar charts to cohort analysis, all in real-time.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gridTemplateRows: 'auto auto', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
                {/* Featured: Line Chart */}
                <div className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, gridRow: 'span 2', transition: 'border-color 0.3s, transform 0.3s' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> REVENUE TREND
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 20, color: 'var(--text)', fontStyle: 'normal' }}>Monthly Revenue vs Target — 2024</div>
                    <svg style={{ width: '100%', height: 220, overflow: 'visible' }} viewBox="0 0 480 200">
                        <defs>
                            <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aff" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#7c3aff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {[40, 80, 120, 160].map(y => (
                            <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        ))}
                        <path d="M 0,120 L 40,115 L 80,110 L 120,105 L 160,100 L 200,92 L 240,88 L 280,82 L 320,78 L 360,72 L 400,65 L 440,60 L 480,55 L 480,200 L 0,200 Z" fill="url(#lg2)" />
                        <path d="M 0,120 L 40,115 L 80,110 L 120,105 L 160,100 L 200,92 L 240,88 L 280,82 L 320,78 L 360,72 L 400,65 L 440,60 L 480,55" fill="none" stroke="#7c3aff" strokeWidth="2" strokeDasharray="6,4" opacity={0.6} />
                        <path d="M 0,140 L 40,128 L 80,118 L 120,122 L 160,105 L 200,90 L 240,82 L 280,72 L 320,65 L 360,55 L 400,48 L 440,42 L 480,36 L 480,200 L 0,200 Z" fill="url(#lg1)" />
                        <path d="M 0,140 L 40,128 L 80,118 L 120,122 L 160,105 L 200,90 L 240,82 L 280,72 L 320,65 L 360,55 L 400,48 L 440,42 L 480,36" fill="none" stroke="#00e5ff" strokeWidth="2.5" />
                        <circle cx="480" cy="36" r="5" fill="#00e5ff" />
                        <circle cx="360" cy="55" r="4" fill="#00e5ff" opacity={0.7} />
                        <circle cx="240" cy="82" r="4" fill="#00e5ff" opacity={0.7} />
                        {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m, i) => (
                            <text key={m} x={i * 80} y="195" fill="#6b7a99" fontSize="10" fontFamily="DM Mono">{m}</text>
                        ))}
                        <rect x="0" y="0" width="12" height="3" rx="2" fill="#00e5ff" />
                        <text x="16" y="8" fill="#a0aec0" fontSize="9" fontFamily="DM Mono">Actual</text>
                        <rect x="60" y="0" width="12" height="3" rx="2" fill="#7c3aff" />
                        <text x="76" y="8" fill="#a0aec0" fontSize="9" fontFamily="DM Mono">Target</text>
                    </svg>
                </div>

                {/* Bar Chart */}
                <div className="reveal reveal-delay-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, transition: 'border-color 0.3s, transform 0.3s' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6b35' }} /> SALES BY REGION
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 20, color: 'var(--text)', fontStyle: 'normal' }}>Top Regions Q3 2024</div>
                    <svg style={{ width: '100%', height: 180, overflow: 'visible' }} viewBox="0 0 220 160">
                        <defs>
                            <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00e5ff" />
                                <stop offset="100%" stopColor="#7c3aff" />
                            </linearGradient>
                        </defs>
                        {[
                            { x: 8, y: 20, h: 120, o: 0.95, label: 'NA', val: '$4.2M' },
                            { x: 48, y: 45, h: 95, o: 0.8, label: 'EU' },
                            { x: 88, y: 60, h: 80, o: 0.65, label: 'APAC' },
                            { x: 128, y: 80, h: 60, o: 0.5, label: 'LATAM' },
                            { x: 168, y: 95, h: 45, o: 0.38, label: 'MEA' },
                        ].map(b => (
                            <g key={b.label}>
                                <rect className="bar-anim" x={b.x} y={b.y} width="28" height={b.h} rx="4" fill="url(#bar1)" opacity={b.o} />
                                <text x={b.x + 14} y="152" fill="#6b7a99" fontSize="8" fontFamily="DM Mono" textAnchor="middle">{b.label}</text>
                                {b.val && <text x={b.x + 14} y="16" fill="#e8edf5" fontSize="9" fontFamily="DM Mono" textAnchor="middle">{b.val}</text>}
                            </g>
                        ))}
                    </svg>
                </div>

                {/* Donut */}
                <div className="reveal reveal-delay-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, transition: 'border-color 0.3s, transform 0.3s' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aff' }} /> PRODUCT MIX
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 20, color: 'var(--text)', fontStyle: 'normal' }}>Revenue Breakdown</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <svg viewBox="0 0 110 110" style={{ width: 110, flexShrink: 0 }}>
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#1a2235" strokeWidth="14" />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#00e5ff" strokeWidth="14" strokeDasharray="105 159" strokeLinecap="round" transform="rotate(-90 55 55)" />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#7c3aff" strokeWidth="14" strokeDasharray="65 199" strokeLinecap="round" transform="rotate(27 55 55)" />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#ff6b35" strokeWidth="14" strokeDasharray="40 224" strokeLinecap="round" transform="rotate(134 55 55)" />
                            <text x="55" y="51" fill="#e8edf5" fontSize="12" fontFamily="Syne,sans-serif" fontWeight="700" textAnchor="middle">40%</text>
                            <text x="55" y="63" fill="#6b7a99" fontSize="7" fontFamily="DM Mono" textAnchor="middle">SAAS</text>
                        </svg>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { color: '#00e5ff', text: 'SaaS — 40%' },
                                { color: '#7c3aff', text: 'Enterprise — 25%' },
                                { color: '#ff6b35', text: 'Services — 15%' },
                                { color: '#4ade80', text: 'Other — 20%' },
                            ].map(l => (
                                <div key={l.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                                    {l.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
