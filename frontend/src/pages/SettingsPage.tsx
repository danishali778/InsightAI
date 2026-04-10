import { useState } from 'react';
import { MainShell } from '../components/common/MainShell';
import { T } from '../components/dashboard/tokens';

type Section = 'profile' | 'security' | 'appearance' | 'ai' | 'notifications' | 'apikeys' | 'billing';

const NAV: { id: Section; label: string; icon: string; badge?: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'security',      label: 'Security',       icon: '🔒' },
  { id: 'appearance',    label: 'Appearance',     icon: '🎨' },
  { id: 'ai',            label: 'AI & Queries',   icon: '⚡' },
  { id: 'notifications', label: 'Notifications',  icon: '🔔' },
  { id: 'apikeys',       label: 'API Keys',       icon: '🔑' },
  { id: 'billing',       label: 'Billing',        icon: '💳', badge: 'PRO' },
];

export function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');

  return (
    <MainShell
      title="User Settings"
      subtitle="Manage your profile, security, and preferences"
      badge={{
        text: 'PRO',
        color: T.purple,
        icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.purple }} />
      }}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Settings nav */}
        <aside style={{
          width: 200, flexShrink: 0, background: T.s1,
          borderRight: `1px solid ${T.border}`,
          padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.5, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, padding: '0 6px 10px' }}>
            Settings
          </div>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: section === item.id ? T.s3 : 'transparent',
                color: section === item.id ? T.text : T.text3,
                fontSize: '0.82rem', fontFamily: T.fontBody,
                textAlign: 'left', width: '100%', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (section !== item.id) { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text2; } }}
              onMouseLeave={e => { if (section !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; } }}
            >
              <span style={{ fontSize: '0.78rem', width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: '0.55rem', fontFamily: T.fontMono, padding: '1px 5px', borderRadius: 4, background: T.purpleDim, color: T.purple, border: '1px solid rgba(124,58,255,0.2)' }}>{item.badge}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }} className="settings-scroll">
          {section === 'profile'       && <ProfileSection />}
          {section === 'security'      && <SecuritySection />}
          {section === 'appearance'    && <AppearanceSection />}
          {section === 'ai'            && <AISection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'apikeys'       && <ApiKeysSection />}
          {section === 'billing'       && <BillingSection />}
        </main>
      </div>

      <style>{`
        .settings-scroll::-webkit-scrollbar { width: 4px; }
        .settings-scroll::-webkit-scrollbar-thumb { background: ${T.s4}; border-radius: 2px; }
      `}</style>
    </MainShell>
  );
}

// ── Shared layout helpers ──────────────────────────────────

function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.4rem', color: T.text, margin: 0, marginBottom: 4 }}>{title}</h1>
      <p style={{ fontSize: '0.82rem', color: T.text3, margin: 0, fontFamily: T.fontBody }}>{sub}</p>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: '20px 22px', marginBottom: 16, ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 1.2, color: T.text3, textTransform: 'uppercase', fontFamily: T.fontMono, marginBottom: 14 }}>
      {label}
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: '0.84rem', color: T.text2, fontFamily: T.fontBody }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: T.text3, fontFamily: T.fontMono, marginTop: 2 }}>{sub}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 36, height: 20, borderRadius: 20,
      background: on ? T.accent : T.s4,
      cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s',
    }}>
      <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: on ? '#000' : T.text3, top: 3, left: on ? 19 : 3, transition: 'left 0.2s' }} />
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', width = 220 }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; width?: number }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width, padding: '7px 12px', borderRadius: 8,
        background: T.s2, border: `1px solid ${T.border}`,
        color: T.text, fontSize: '0.82rem', fontFamily: T.fontBody,
        outline: 'none',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)')}
      onBlur={e => (e.currentTarget.style.borderColor = T.border)}
    />
  );
}

function SaveBtn({ label = 'Save Changes', onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      marginTop: 16, padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(0,229,255,0.25)',
      background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.08))',
      color: T.accent, fontSize: '0.82rem', fontFamily: T.fontBody, cursor: 'pointer',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(124,58,255,0.14))'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(124,58,255,0.08))'; }}
    >
      {label}
    </button>
  );
}

// ── Profile ───────────────────────────────────────────────

function ProfileSection() {
  const [name, setName] = useState('Ahmad Khan');
  const [email, setEmail] = useState('ahmad@querymind.io');
  const [role, setRole] = useState('Data Analyst');

  return (
    <>
      <PageTitle title="Profile" sub="Manage your personal information and workspace display name." />

      <Card>
        <CardLabel label="Avatar" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: '#fff', fontFamily: T.fontHead, flexShrink: 0,
          }}>AK</div>
          <div>
            <div style={{ fontSize: '0.82rem', color: T.text2, marginBottom: 6 }}>JPG, PNG or GIF · Max 2MB</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.border2}`, background: T.s2, color: T.text2, fontSize: '0.78rem', fontFamily: T.fontBody, cursor: 'pointer' }}>Upload Photo</button>
              <button style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: '0.78rem', fontFamily: T.fontBody, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>

        <Row label="Full Name">
          <TextInput value={name} onChange={setName} />
        </Row>
        <Row label="Email Address" sub="Used for schedule result delivery">
          <TextInput value={email} onChange={setEmail} type="email" />
        </Row>
        <Row label="Job Title">
          <TextInput value={role} onChange={setRole} placeholder="e.g. Data Analyst" />
        </Row>
        <Row label="Timezone" sub="Used for scheduled query times">
          <select style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontBody, outline: 'none', cursor: 'pointer' }}>
            <option>Asia/Karachi (PKT, UTC+5)</option>
            <option>UTC</option>
            <option>America/New_York (ET, UTC−5)</option>
            <option>Europe/London (GMT, UTC+0)</option>
            <option>Asia/Kolkata (IST, UTC+5:30)</option>
          </select>
        </Row>
        <SaveBtn />
      </Card>
    </>
  );
}

// ── Security ──────────────────────────────────────────────

function SecuritySection() {
  const [twoFa, setTwoFa] = useState(false);
  const [sessions] = useState([
    { device: 'Chrome on Windows', location: 'Karachi, PK', last: 'Active now', current: true },
    { device: 'Firefox on macOS', location: 'Lahore, PK', last: '2 days ago', current: false },
    { device: 'Safari on iPhone', location: 'Karachi, PK', last: '5 days ago', current: false },
  ]);

  return (
    <>
      <PageTitle title="Security" sub="Manage your password, two-factor authentication, and active sessions." />

      <Card>
        <CardLabel label="Change Password" />
        <Row label="Current Password">
          <TextInput value="" onChange={() => {}} type="password" placeholder="••••••••" />
        </Row>
        <Row label="New Password">
          <TextInput value="" onChange={() => {}} type="password" placeholder="••••••••" />
        </Row>
        <Row label="Confirm Password">
          <TextInput value="" onChange={() => {}} type="password" placeholder="••••••••" />
        </Row>
        <SaveBtn label="Update Password" />
      </Card>

      <Card>
        <CardLabel label="Two-Factor Authentication" />
        <Row label="Authenticator App" sub="Use Google Authenticator or Authy">
          <Toggle on={twoFa} onToggle={() => setTwoFa(!twoFa)} />
        </Row>
        {twoFa && (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 8, background: T.greenDim, border: '1px solid rgba(34,211,165,0.2)', fontSize: '0.78rem', color: T.green }}>
            2FA is enabled. Scan the QR code in your authenticator app to get started.
          </div>
        )}
      </Card>

      <Card>
        <CardLabel label="Active Sessions" />
        {sessions.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < sessions.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.s3, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>💻</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', color: T.text2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.device}
                {s.current && <span style={{ fontSize: '0.6rem', fontFamily: T.fontMono, padding: '1px 6px', borderRadius: 4, background: T.greenDim, color: T.green, border: '1px solid rgba(34,211,165,0.2)' }}>current</span>}
              </div>
              <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono, marginTop: 2 }}>{s.location} · {s.last}</div>
            </div>
            {!s.current && (
              <button style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: T.red, fontSize: '0.72rem', fontFamily: T.fontMono, cursor: 'pointer' }}>Revoke</button>
            )}
          </div>
        ))}
      </Card>
    </>
  );
}

// ── Appearance ────────────────────────────────────────────

function AppearanceSection() {
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [accentIdx, setAccentIdx] = useState(0);
  const accents = [
    { label: 'Cyan',   color: '#00e5ff' },
    { label: 'Purple', color: '#7c3aff' },
    { label: 'Green',  color: '#22d3a5' },
    { label: 'Orange', color: '#ff6b35' },
    { label: 'Pink',   color: '#f472b6' },
  ];

  return (
    <>
      <PageTitle title="Appearance" sub="Customize the look and feel of your workspace." />

      <Card>
        <CardLabel label="Theme" />
        <div style={{ display: 'flex', gap: 10 }}>
          {['Dark', 'Darker', 'OLED'].map((t, i) => (
            <button key={t} onClick={() => {}} style={{
              padding: '10px 22px', borderRadius: 9, fontSize: '0.82rem', fontFamily: T.fontBody, cursor: 'pointer',
              border: `1px solid ${i === 0 ? 'rgba(0,229,255,0.35)' : T.border}`,
              background: i === 0 ? T.accentDim : T.s2,
              color: i === 0 ? T.accent : T.text3,
              transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel label="Accent Color" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {accents.map((a, i) => (
            <div key={a.label} onClick={() => setAccentIdx(i)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: a.color,
                border: `3px solid ${accentIdx === i ? '#fff' : 'transparent'}`,
                boxShadow: accentIdx === i ? `0 0 0 1px ${a.color}` : 'none',
                transition: 'all 0.15s',
              }} />
              <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, color: accentIdx === i ? T.text2 : T.text3 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel label="Density" />
        <div style={{ display: 'flex', gap: 10 }}>
          {(['comfortable', 'compact'] as const).map(d => (
            <button key={d} onClick={() => setDensity(d)} style={{
              padding: '10px 22px', borderRadius: 9, fontSize: '0.82rem', fontFamily: T.fontBody, cursor: 'pointer',
              border: `1px solid ${density === d ? 'rgba(0,229,255,0.35)' : T.border}`,
              background: density === d ? T.accentDim : T.s2,
              color: density === d ? T.accent : T.text3,
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>{d}</button>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel label="Display" />
        <Row label="Show run counts on query cards">
          <Toggle on={true} onToggle={() => {}} />
        </Row>
        <Row label="Animate chart renders">
          <Toggle on={true} onToggle={() => {}} />
        </Row>
        <Row label="Show SQL syntax highlighting">
          <Toggle on={true} onToggle={() => {}} />
        </Row>
      </Card>
    </>
  );
}

// ── AI & Queries ──────────────────────────────────────────

function AISection() {
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [rowLimit, setRowLimit] = useState('500');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [streamResults, setStreamResults] = useState(true);

  return (
    <>
      <PageTitle title="AI & Queries" sub="Configure the AI model, query execution behavior, and defaults." />

      <Card>
        <CardLabel label="AI Model" />
        <Row label="Default Model" sub="Used for all SQL generation requests">
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontMono, outline: 'none', cursor: 'pointer' }}
          >
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-opus-4-6">Claude Opus 4.6</option>
            <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
          </select>
        </Row>
        <Row label="Stream responses">
          <Toggle on={streamResults} onToggle={() => setStreamResults(!streamResults)} />
        </Row>
      </Card>

      <Card>
        <CardLabel label="Query Execution" />
        <Row label="Default Row Limit" sub="Max rows returned per query">
          <select
            value={rowLimit}
            onChange={e => setRowLimit(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontMono, outline: 'none', cursor: 'pointer' }}
          >
            {['100', '250', '500', '1000', '2500', '5000'].map(v => (
              <option key={v} value={v}>{v} rows</option>
            ))}
          </select>
        </Row>
        <Row label="Auto-save queries to Library" sub="Save every AI-generated query automatically">
          <Toggle on={autoSave} onToggle={() => setAutoSave(!autoSave)} />
        </Row>
      </Card>

      <Card>
        <CardLabel label="System Prompt" />
        <div style={{ fontSize: '0.78rem', color: T.text3, marginBottom: 10 }}>
          Appended to every AI request. Use it to provide business context (e.g. "Our fiscal year starts in April").
        </div>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="e.g. Our company uses UTC for all timestamps. The 'orders' table uses soft deletes via deleted_at..."
          style={{
            width: '100%', minHeight: 100, background: T.s2, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '12px 14px', fontFamily: T.fontMono, fontSize: '0.78rem',
            lineHeight: 1.7, color: T.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)')}
          onBlur={e => (e.currentTarget.style.borderColor = T.border)}
        />
        <SaveBtn />
      </Card>
    </>
  );
}

// ── Notifications ─────────────────────────────────────────

function NotificationsSection() {
  const [emailScheduled, setEmailScheduled] = useState(true);
  const [emailFailed, setEmailFailed] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');

  return (
    <>
      <PageTitle title="Notifications" sub="Control how and when QueryMind contacts you." />

      <Card>
        <CardLabel label="Email Notifications" />
        <Row label="Scheduled query results" sub="Receive results when a scheduled query runs">
          <Toggle on={emailScheduled} onToggle={() => setEmailScheduled(!emailScheduled)} />
        </Row>
        <Row label="Query run failures" sub="Get notified when a scheduled query fails">
          <Toggle on={emailFailed} onToggle={() => setEmailFailed(!emailFailed)} />
        </Row>
        <Row label="Alert triggers" sub="Notify when an alert condition is met">
          <Toggle on={emailAlerts} onToggle={() => setEmailAlerts(!emailAlerts)} />
        </Row>
        <Row label="Delivery format">
          <select style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontBody, outline: 'none', cursor: 'pointer' }}>
            <option>CSV + Chart PNG</option>
            <option>CSV only</option>
            <option>Summary only</option>
          </select>
        </Row>
      </Card>

      <Card>
        <CardLabel label="Slack Integration" />
        <Row label="Enable Slack notifications">
          <Toggle on={slackEnabled} onToggle={() => setSlackEnabled(!slackEnabled)} />
        </Row>
        {slackEnabled && (
          <>
            <Row label="Webhook URL" sub="Slack incoming webhook for your channel">
              <TextInput value={slackWebhook} onChange={setSlackWebhook} placeholder="https://hooks.slack.com/..." width={260} />
            </Row>
            <Row label="Channel">
              <TextInput value="#data-alerts" onChange={() => {}} width={160} />
            </Row>
          </>
        )}
        <SaveBtn />
      </Card>
    </>
  );
}

// ── API Keys ──────────────────────────────────────────────

function ApiKeysSection() {
  const [keys] = useState([
    { name: 'Production Dashboard', prefix: 'qm_live_4xK9', created: 'Jan 12, 2026', last: '2 hours ago', scopes: ['read', 'execute'] },
    { name: 'Data Pipeline Script', prefix: 'qm_live_8mR2', created: 'Feb 3, 2026',  last: '5 days ago',  scopes: ['read'] },
  ]);

  return (
    <>
      <PageTitle title="API Keys" sub="Programmatic access to your QueryMind workspace." />

      <Card>
        <CardLabel label="Active Keys" />
        {keys.map((k, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < keys.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.84rem', color: T.text2, fontWeight: 600, marginBottom: 4 }}>{k.name}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: '0.72rem', color: T.accent, marginBottom: 6 }}>{k.prefix}••••••••••••</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                  {k.scopes.map(s => (
                    <span key={s} style={{ fontSize: '0.6rem', fontFamily: T.fontMono, padding: '1px 6px', borderRadius: 4, background: T.accentDim, color: T.accent, border: '1px solid rgba(0,229,255,0.2)' }}>{s}</span>
                  ))}
                </div>
                <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>Created {k.created} · Last used {k.last}</div>
              </div>
              <button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: T.red, fontSize: '0.72rem', fontFamily: T.fontMono, cursor: 'pointer', flexShrink: 0 }}>Revoke</button>
            </div>
          </div>
        ))}
        <button style={{
          marginTop: 14, padding: '9px 18px', borderRadius: 8,
          border: `1px solid ${T.border2}`, background: T.s2,
          color: T.text2, fontSize: '0.82rem', fontFamily: T.fontBody, cursor: 'pointer',
        }}>
          + Generate New Key
        </button>
      </Card>

      <Card style={{ background: T.yellowDim, borderColor: 'rgba(245,158,11,0.2)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <div style={{ fontSize: '0.78rem', color: T.yellow, lineHeight: 1.6 }}>
            API keys grant full access to your workspace. Never share them in client-side code or public repositories. Revoke and rotate keys if you suspect they've been compromised.
          </div>
        </div>
      </Card>
    </>
  );
}

// ── Billing ───────────────────────────────────────────────

function BillingSection() {
  const usage = { queries: 2847, limit: 5000, ai: 384, aiLimit: 500 };

  return (
    <>
      <PageTitle title="Billing & Plan" sub="Manage your subscription, usage, and payment details." />

      {/* Current Plan */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(124,58,255,0.08), rgba(0,229,255,0.05))', borderColor: 'rgba(124,58,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.1rem', color: T.text }}>Pro Plan</span>
              <span style={{ fontSize: '0.62rem', fontFamily: T.fontMono, padding: '2px 8px', borderRadius: 4, background: T.purpleDim, color: T.purple, border: '1px solid rgba(124,58,255,0.3)' }}>ACTIVE</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: T.text3, marginBottom: 10 }}>Billed monthly · Next renewal Mar 29, 2026</div>
            <div style={{ fontSize: '1.3rem', fontFamily: T.fontHead, color: T.text }}>$49<span style={{ fontSize: '0.82rem', color: T.text3, fontFamily: T.fontBody }}>/month</span></div>
          </div>
          <button style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)',
            background: 'transparent', color: T.red, fontSize: '0.78rem', fontFamily: T.fontBody, cursor: 'pointer',
          }}>Cancel Plan</button>
        </div>
      </Card>

      {/* Usage */}
      <Card>
        <CardLabel label="This Month's Usage" />
        <UsageBar label="Query Runs" value={usage.queries} max={usage.limit} color={T.accent} />
        <UsageBar label="AI Requests" value={usage.ai} max={usage.aiLimit} color={T.purple} />
        <UsageBar label="Saved Queries" value={47} max={200} color={T.green} />
        <UsageBar label="Dashboards" value={6} max={20} color={T.yellow} />
      </Card>

      {/* Payment method */}
      <Card>
        <CardLabel label="Payment Method" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 28, borderRadius: 6, background: T.s3, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontFamily: T.fontMono, color: T.accent }}>VISA</div>
            <div>
              <div style={{ fontSize: '0.82rem', color: T.text2 }}>Visa ending in 4242</div>
              <div style={{ fontSize: '0.68rem', color: T.text3, fontFamily: T.fontMono }}>Expires 08/2027</div>
            </div>
          </div>
          <button style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.border2}`, background: T.s2, color: T.text2, fontSize: '0.72rem', fontFamily: T.fontBody, cursor: 'pointer' }}>Update</button>
        </div>
      </Card>

      {/* Billing history */}
      <Card>
        <CardLabel label="Billing History" />
        {[
          { date: 'Feb 28, 2026', amount: '$49.00', status: 'Paid' },
          { date: 'Jan 31, 2026', amount: '$49.00', status: 'Paid' },
          { date: 'Dec 31, 2025', amount: '$49.00', status: 'Paid' },
        ].map((inv, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: '0.82rem', color: T.text2, fontFamily: T.fontMono }}>{inv.date}</span>
            <span style={{ fontSize: '0.82rem', color: T.text2 }}>{inv.amount}</span>
            <span style={{ fontSize: '0.68rem', fontFamily: T.fontMono, padding: '2px 8px', borderRadius: 4, background: T.greenDim, color: T.green, border: '1px solid rgba(34,211,165,0.2)' }}>{inv.status}</span>
            <button style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: '0.68rem', fontFamily: T.fontMono, cursor: 'pointer' }}>PDF</button>
          </div>
        ))}
      </Card>
    </>
  );
}

function UsageBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.78rem', color: T.text2 }}>{label}</span>
        <span style={{ fontSize: '0.72rem', fontFamily: T.fontMono, color: T.text3 }}>{value.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: T.s3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}
