import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../components/common/MainShell';
import { T } from '../components/dashboard/tokens';
import { useSettingsStore } from '../store/settingsStore';
import { useAuth } from '../context/AuthContext';

type Section = 'profile' | 'security' | 'ai' | 'notifications' | 'apikeys' | 'billing';

const NAV: { id: Section; label: string; icon: string; badge?: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'security',      label: 'Security',       icon: '🔒' },
  { id: 'ai',            label: 'AI & Queries',   icon: '⚡' },
  { id: 'notifications', label: 'Notifications',  icon: '🔔' },
  { id: 'apikeys',       label: 'API Keys',       icon: '🔑' },
  { id: 'billing',       label: 'Billing',        icon: '💳', badge: 'PRO' },
];

export function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const { settings, isLoading, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoading && !settings) {
    return (
      <MainShell title="User Settings" subtitle="Manage your profile, security, and preferences">
        <div style={{ padding: 40, color: T.text3, fontFamily: T.fontBody }}>Loading preferences...</div>
      </MainShell>
    );
  }

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
      <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: on ? '#fff' : T.text3, top: 3, left: on ? 19 : 3, transition: 'left 0.2s' }} />
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
  const { settings, updateSetting } = useSettingsStore();
  const { user, signOut } = useAuth();
  const defaultNameFromEmail = user?.email ? user.email.split('@')[0] : '';
  const [name, setName] = useState(settings?.full_name || defaultNameFromEmail);
  const [role, setRole] = useState(settings?.job_title || '');
  const [timezone, setTimezone] = useState(settings?.timezone || 'UTC');

  const handleSave = () => {
    updateSetting({ full_name: name, job_title: role, timezone });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth'; // Hard redirect to clear out all state
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.4rem', color: T.text, margin: 0, marginBottom: 4 }}>Profile</h1>
          <p style={{ fontSize: '0.82rem', color: T.text3, margin: 0, fontFamily: T.fontBody }}>Manage your personal information and workspace display name.</p>
        </div>
        <button 
          onClick={handleSignOut}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)',
            background: 'transparent', color: T.red, fontSize: '0.8rem', fontFamily: T.fontBody, cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      <Card>
        <CardLabel label="Avatar" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${T.purple}, ${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: '#fff', fontFamily: T.fontHead, flexShrink: 0,
          }}>
            {name ? name.substring(0, 2).toUpperCase() : (user?.email?.substring(0, 2).toUpperCase() || 'U')}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: T.text2, marginBottom: 6 }}>JPG, PNG or GIF · Max 2MB (Mocked)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.border2}`, background: T.s2, color: T.text2, fontSize: '0.78rem', fontFamily: T.fontBody, cursor: 'pointer' }}>Upload Photo</button>
              <button style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: '0.78rem', fontFamily: T.fontBody, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>

        <Row label="Full Name">
          <TextInput value={name} onChange={setName} placeholder="e.g. Ahmad Khan" />
        </Row>
        <Row label="Email Address" sub="Managed securely by Supabase Auth">
          <input type="email" value={user?.email || 'dev@insightai.com'} readOnly style={{ width: 220, padding: '7px 12px', borderRadius: 10, background: T.s3, border: `1px solid ${T.border}`, color: T.text3, fontSize: '0.86rem', fontFamily: T.fontMono, outline: 'none', cursor: 'not-allowed' }} />
        </Row>
        <Row label="Job Title">
          <TextInput value={role} onChange={setRole} placeholder="e.g. Data Analyst" />
        </Row>
        <Row label="Timezone" sub="Used for scheduled query times">
          <select 
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontBody, outline: 'none', cursor: 'pointer' }}
          >
            <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (ET, UTC−5)</option>
            <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
          </select>
        </Row>
        <SaveBtn onClick={handleSave} />
      </Card>
    </>
  );
}

// ── Security (Mocked) ──────────────────────────────────────

function SecuritySection() {
  const [twoFa, setTwoFa] = useState(false);
  const [sessions] = useState([
    { device: 'Chrome on Windows', location: 'Karachi, PK', last: 'Active now', current: true },
  ]);

  return (
    <>
      <PageTitle title="Security" sub="Manage your password, two-factor authentication, and active sessions." />

      <Card>
        <CardLabel label="Two-Factor Authentication (Demo View)" />
        <Row label="Authenticator App" sub="Use Google Authenticator or Authy">
          <Toggle on={twoFa} onToggle={() => setTwoFa(!twoFa)} />
        </Row>
      </Card>

      <Card>
        <CardLabel label="Active Sessions (Demo View)" />
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
          </div>
        ))}
      </Card>
    </>
  );
}

// ── AI & Queries ──────────────────────────────────────────

function AISection() {
  const { settings, updateSetting } = useSettingsStore();
  const [prompt, setPrompt] = useState(settings?.system_prompt || '');

  if (!settings) return null;

  return (
    <>
      <PageTitle title="AI & Queries" sub="Configure the AI model, query execution behavior, and defaults." />

      <Card>
        <CardLabel label="AI Model" />
        <Row label="Default Model" sub="Used for all SQL generation requests">
          <select
            value={settings.ai_model}
            onChange={e => updateSetting({ ai_model: e.target.value })}
            style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontMono, outline: 'none', cursor: 'pointer' }}
          >
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-opus-4-6">Claude Opus 4.6</option>
            <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
          </select>
        </Row>
        <Row label="Stream responses">
          <Toggle on={settings.stream_responses} onToggle={() => updateSetting({ stream_responses: !settings.stream_responses })} />
        </Row>
      </Card>

      <Card>
        <CardLabel label="Query Execution" />
        <Row label="Default Row Limit" sub="Max rows returned per query">
          <select
            value={settings.default_row_limit.toString()}
            onChange={e => updateSetting({ default_row_limit: parseInt(e.target.value, 10) })}
            style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontMono, outline: 'none', cursor: 'pointer' }}
          >
            {['100', '250', '500', '1000', '2500', '5000'].map(v => (
              <option key={v} value={v}>{v} rows</option>
            ))}
          </select>
        </Row>
        <Row label="Auto-save queries to Library" sub="Save every AI-generated query automatically">
          <Toggle on={settings.auto_save_queries} onToggle={() => updateSetting({ auto_save_queries: !settings.auto_save_queries })} />
        </Row>
      </Card>

      <Card>
        <CardLabel label="System Prompt" />
        <div style={{ fontSize: '0.78rem', color: T.text3, marginBottom: 10 }}>
          Appended to every AI request. Use it to provide business context (e.g. "Our fiscal year starts in April").
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Our company uses UTC for all timestamps. The 'orders' table uses soft deletes via deleted_at..."
          style={{
            width: '100%', minHeight: 100, background: T.s2, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '12px 14px', fontFamily: T.fontMono, fontSize: '0.78rem',
            lineHeight: 1.7, color: T.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)')}
          onBlur={e => (e.currentTarget.style.borderColor = T.border)}
        />
        <SaveBtn onClick={() => updateSetting({ system_prompt: prompt })} />
      </Card>
    </>
  );
}

// ── Notifications ─────────────────────────────────────────

function NotificationsSection() {
  const { settings, updateSetting } = useSettingsStore();
  const [webhook, setWebhook] = useState(settings?.slack_webhook || '');
  const [channel, setChannel] = useState(settings?.slack_channel || '');

  if (!settings) return null;

  return (
    <>
      <PageTitle title="Notifications" sub="Control how and when QueryMind contacts you." />

      <Card>
        <CardLabel label="Email Notifications" />
        <Row label="Scheduled query results" sub="Receive results when a scheduled query runs">
          <Toggle on={settings.email_scheduled} onToggle={() => updateSetting({ email_scheduled: !settings.email_scheduled })} />
        </Row>
        <Row label="Query run failures" sub="Get notified when a scheduled query fails">
          <Toggle on={settings.email_failed} onToggle={() => updateSetting({ email_failed: !settings.email_failed })} />
        </Row>
        <Row label="Alert triggers" sub="Notify when an alert condition is met">
          <Toggle on={settings.email_alerts} onToggle={() => updateSetting({ email_alerts: !settings.email_alerts })} />
        </Row>
        <Row label="Delivery format">
          <select 
            value={settings.delivery_format}
            onChange={e => updateSetting({ delivery_format: e.target.value })}
            style={{ padding: '7px 12px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.text2, fontSize: '0.82rem', fontFamily: T.fontBody, outline: 'none', cursor: 'pointer' }}
          >
            <option value="CSV + Chart PNG">CSV + Chart PNG</option>
            <option value="CSV only">CSV only</option>
            <option value="Summary only">Summary only</option>
          </select>
        </Row>
      </Card>

      <Card>
        <CardLabel label="Slack Integration" />
        <Row label="Enable Slack notifications">
          <Toggle on={settings.slack_enabled} onToggle={() => updateSetting({ slack_enabled: !settings.slack_enabled })} />
        </Row>
        {settings.slack_enabled && (
          <>
            <Row label="Webhook URL" sub="Slack incoming webhook for your channel">
              <TextInput value={webhook} onChange={setWebhook} placeholder="https://hooks.slack.com/..." width={260} />
            </Row>
            <Row label="Channel">
              <TextInput value={channel} onChange={setChannel} placeholder="#data-alerts" width={160} />
            </Row>
          </>
        )}
        <SaveBtn onClick={() => updateSetting({ slack_webhook: webhook, slack_channel: channel })} />
      </Card>
    </>
  );
}

// ── API Keys (Mocked) ─────────────────────────────────────

function ApiKeysSection() {
  const [keys] = useState([
    { name: 'Production Dashboard', prefix: 'qm_live_4xK9', created: 'Jan 12, 2026', last: '2 hours ago', scopes: ['read', 'execute'] },
  ]);

  return (
    <>
      <PageTitle title="API Keys" sub="Programmatic access to your QueryMind workspace." />

      <Card>
        <CardLabel label="Active Keys (Demo View)" />
        {keys.map((k, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < keys.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.84rem', color: T.text2, fontWeight: 600, marginBottom: 4 }}>{k.name}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: '0.72rem', color: T.accent, marginBottom: 6 }}>{k.prefix}••••••••••••</div>
              </div>
              <button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: T.red, fontSize: '0.72rem', fontFamily: T.fontMono, cursor: 'pointer', flexShrink: 0 }}>Revoke</button>
            </div>
          </div>
        ))}
      </Card>
      
      <Card style={{ background: T.yellowDim, borderColor: 'rgba(245,158,11,0.2)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <div style={{ fontSize: '0.78rem', color: T.yellow, lineHeight: 1.6 }}>
            API keys management requires Kong integration and is currently read-only in this environment.
          </div>
        </div>
      </Card>
    </>
  );
}

// ── Billing (Mocked) ──────────────────────────────────────

import { getBillingInfo } from '../services/api';
import type { UserSubscription } from '../services/api';

function BillingSection() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<UserSubscription | null>(null);

  useEffect(() => {
    getBillingInfo().then(setSub).catch(console.error);
  }, []);

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  if (!sub) return <div style={{ color: T.text3, fontSize: '0.85rem' }}>Loading subscription details...</div>;

  const isPro = sub.plan_type === 'pro';

  return (
    <>
      <PageTitle title="Billing & Plan" sub="Manage your subscription, usage, and payment details." />

      {/* Current Plan */}
      <Card style={{ background: isPro ? 'linear-gradient(135deg, rgba(124,58,255,0.08), rgba(0,229,255,0.05))' : T.s2, borderColor: isPro ? 'rgba(124,58,255,0.2)' : T.border }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.2rem', color: isPro ? T.purple : T.text, textTransform: 'capitalize' }}>
                {isPro ? 'Pro Plan' : 'Free Plan'} {isPro && '(Active)'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: T.text3 }}>{isPro ? 'Billed via Enterprise licensing' : 'Basic limits. Upgrade to unlock.'}</div>
          </div>
          {!isPro && (
            <button 
              onClick={handleUpgrade}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              Upgrade to PRO
            </button>
          )}
        </div>
      </Card>

      {/* Usage */}
      <Card>
        <CardLabel label="Estimated This Month's Usage" />
        <UsageBar label="Query Runs" value={sub.queries_used} max={sub.queries_limit} color={T.accent} />
        <UsageBar label="AI Requests" value={sub.ai_used} max={sub.ai_limit} color={T.purple} />
      </Card>
      
      <div style={{ fontSize: '0.75rem', color: T.text3, marginTop: 24 }}>
        * Billing panels are integrated via independent Stripe checkout links handled by account administrators.
      </div>
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
