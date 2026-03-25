import { useState } from 'react';
import { T } from '../dashboard/tokens';
import { connectDatabase } from '../../services/api';

export function NewConnectionModal({ isOpen, onClose, onSaved }: { isOpen: boolean, onClose: () => void, onSaved?: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', host: 'localhost', port: '', database: '', username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.85)', backdropFilter: 'blur(8px)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody }}>
      <div style={{ width: 680, maxHeight: '88vh', background: T.s2, border: `1px solid ${T.border2}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: '1rem', color: T.text }}>New Connection</span>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: '0.8rem', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          
          {/* Wizard */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 22 }}>
            <WizardStep num={1} label="Choose type" active={step === 1} done={step > 1} />
            <WizardLine done={step > 1} />
            <WizardStep num={2} label="Credentials" active={step === 2} done={step > 2} />
            <WizardLine done={step > 2} />
            <WizardStep num={3} label="Test & Save" active={step === 3} done={step > 3} />
          </div>

          {/* Steps Content */}
          {step === 1 && (
            <div>
              <Section label="Databases">
                <Grid>
                  <Card icon="🐘" name="PostgreSQL" type="Database" selected={selectedConnector === 'pg'} onClick={() => setSelectedConnector('pg')} popular />
                  <Card icon="🐬" name="MySQL" type="Database" selected={selectedConnector === 'my'} onClick={() => setSelectedConnector('my')} />
                  <Card icon="🔷" name="SQL Server" type="Database" selected={selectedConnector === 'sql'} onClick={() => setSelectedConnector('sql')} />
                  <Card icon="🔵" name="SQLite" type="Database" selected={selectedConnector === 'sqlite'} onClick={() => setSelectedConnector('sqlite')} />
                </Grid>
              </Section>
              <Section label="Cloud Warehouses">
                <Grid>
                  <Card icon="❄️" name="Snowflake" type="Warehouse" selected={selectedConnector === 'snow'} onClick={() => setSelectedConnector('snow')} />
                  <Card icon="🔶" name="BigQuery" type="Warehouse" selected={selectedConnector === 'bq'} onClick={() => setSelectedConnector('bq')} />
                  <Card icon="🟠" name="Redshift" type="Warehouse" selected={selectedConnector === 'rs'} onClick={() => setSelectedConnector('rs')} />
                  <Card icon="🧱" name="Databricks" type="Warehouse" selected={selectedConnector === 'dbx'} onClick={() => setSelectedConnector('dbx')} />
                </Grid>
              </Section>
              <Section label="Files & Spreadsheets">
                <Grid>
                  <Card icon="📗" name="Excel" type="Spreadsheet" selected={selectedConnector === 'xls'} onClick={() => setSelectedConnector('xls')} />
                  <Card icon="📊" name="Google Sheets" type="Spreadsheet" selected={selectedConnector === 'gs'} onClick={() => setSelectedConnector('gs')} />
                  <Card icon="📄" name="CSV Upload" type="File" selected={selectedConnector === 'csv'} onClick={() => setSelectedConnector('csv')} />
                  <Card icon="🦆" name="DuckDB" type="Embedded" selected={selectedConnector === 'duck'} onClick={() => setSelectedConnector('duck')} />
                </Grid>
              </Section>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <ModalInput label="Connection Name" placeholder="e.g. prod-postgres" value={formData.name} onChange={v => setFormData(prev => ({...prev, name: v}))} />
                <ModalInput label="Host" placeholder="localhost" value={formData.host} onChange={v => setFormData(prev => ({...prev, host: v}))} />
                <ModalInput label="Port" placeholder="5432" value={formData.port} onChange={v => setFormData(prev => ({...prev, port: v}))} />
                <ModalInput label="Database" placeholder="mydb" value={formData.database} onChange={v => setFormData(prev => ({...prev, database: v}))} />
                <ModalInput label="Username" placeholder="user" value={formData.username} onChange={v => setFormData(prev => ({...prev, username: v}))} />
                <ModalInput label="Password" placeholder="••••••" value={formData.password} onChange={v => setFormData(prev => ({...prev, password: v}))} password />
              </div>
              {error && <div style={{ marginTop: 12, padding: '9px 14px', borderRadius: 8, background: T.redDim, color: T.red, fontSize: '0.78rem', border: `1px solid rgba(248,113,113,0.2)` }}>{error}</div>}
            </div>
          )}
          {step === 3 && (
             <div style={{ color: T.text2, textAlign: 'center', padding: '40px 0' }}>Test & Save coming soon...</div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0, background: T.s2 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontFamily: T.fontBody, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.15s' }}>Cancel</button>
          
          {step > 1 && (
             <button onClick={() => setStep(step - 1)} style={{ padding: '10px 18px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontFamily: T.fontBody, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.15s' }}>← Back</button>
          )}

          <button onClick={async () => {
            if (step < 2) { setStep(step + 1); return; }
            // Step 2: submit
            const connectorMap: Record<string, string> = { pg: 'postgresql', my: 'mysql', sqlite: 'sqlite', sql: 'mssql', snow: 'snowflake', bq: 'bigquery', rs: 'redshift', dbx: 'databricks', xls: 'excel', gs: 'gsheets', csv: 'csv', duck: 'duckdb' };
            setSaving(true); setError(null);
            try {
              await connectDatabase({
                db_type: connectorMap[selectedConnector || ''] || selectedConnector || '',
                host: formData.host || 'localhost',
                port: parseInt(formData.port) || 5432,
                database: formData.database,
                username: formData.username,
                password: formData.password,
                name: formData.name || undefined,
              } as any);
              onSaved?.();
              // Reset form
              setStep(1); setSelectedConnector(null); setFormData({ name: '', host: 'localhost', port: '', database: '', username: '', password: '' });
            } catch (err: any) {
              setError(err.message || 'Failed to connect');
            } finally {
              setSaving(false);
            }
          }} disabled={!selectedConnector || saving} style={{ padding: '10px 20px', borderRadius: 9, border: `1px solid rgba(0,229,255,0.25)`, background: T.accentDim, color: T.accent, fontFamily: T.fontBody, fontSize: '0.83rem', fontWeight: 600, cursor: selectedConnector && !saving ? 'pointer' : 'not-allowed', opacity: selectedConnector && !saving ? 1 : 0.5 }}>
            {saving ? 'Connecting...' : step === 2 ? 'Save Connection' : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ------------------------
// Sub-components
// ------------------------

function WizardStep({ num, label, active, done }: { num: number, label: string, active: boolean, done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${active ? T.accent : (done ? T.green : T.border)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontFamily: T.fontMono, color: active ? '#000' : (done ? '#000' : T.text3), background: active ? T.accent : (done ? T.green : 'transparent'), fontWeight: active ? 700 : 400, flexShrink: 0, transition: 'all 0.2s' }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontSize: '0.74rem', color: active || done ? T.text : T.text3 }}>{label}</span>
    </div>
  );
}

function WizardLine({ done }: { done: boolean }) {
  return <div style={{ flex: 1, height: 1, background: done ? T.green : T.border, opacity: done ? 0.5 : 1, margin: '0 4px' }} />
}

function Section({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.text3, fontFamily: T.fontMono, marginBottom: 10, display: 'block' }}>{label}</span>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>{children}</div>
}

function Card({ icon, name, type, popular, selected, onClick }: { icon: string, name: string, type: string, popular?: boolean, selected?: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? T.accentDim : T.s3, border: `1px solid ${selected ? 'rgba(0,229,255,0.45)' : T.border}`, borderRadius: 11,
      padding: '14px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
      boxShadow: selected ? '0 0 0 1px rgba(0,229,255,0.15)' : 'none'
    }}
    onMouseEnter={e => {
      if(!selected) {
        e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
      }
    }}
    onMouseLeave={e => {
      if(!selected) {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
    >
      {popular && (
        <span style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', background: T.accent, color: '#000', fontSize: '0.55rem', fontFamily: T.fontMono, fontWeight: 600, padding: '1px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>Popular</span>
      )}
      <span style={{ fontSize: '1.6rem', marginBottom: 8, display: 'block' }}>{icon}</span>
      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: T.text2 }}>{name}</div>
      <div style={{ fontSize: '0.62rem', color: T.text3, fontFamily: T.fontMono, marginTop: 1 }}>{type}</div>
    </div>
  );
}

function ModalInput({ label, placeholder, value, onChange, password }: { label: string, placeholder: string, value: string, onChange: (v: string) => void, password?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.72rem', color: T.text2, fontWeight: 600, fontFamily: T.fontMono }}>{label}</label>
      <input
        type={password ? 'password' : 'text'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: T.s3, border: `1px solid ${T.border}`, borderRadius: 9,
          padding: '9px 13px', color: T.text, fontFamily: T.fontBody, fontSize: '0.83rem',
          outline: 'none', width: '100%', transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.3)'}
        onBlur={e => e.target.style.borderColor = T.border}
      />
    </div>
  );
}
