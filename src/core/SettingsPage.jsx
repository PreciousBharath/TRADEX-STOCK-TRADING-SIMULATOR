import { useState } from 'react';
import { Check, Download, Trash2 } from 'lucide-react';
import { useApp, THEMES, ACCENTS } from './context.jsx';
import { initials, downloadText } from './store.js';
import { Card, PageHead, Field } from './ui.jsx';

export default function SettingsPage() {
  const { config, user, updateProfile, changePassword, theme, setTheme, accent, setAccent, animations, setAnimations, toast, logout } = useApp();
  const [p, setP] = useState({ name: user.name, role: user.role });
  const [pw, setPw] = useState({ old: '', n: '', c: '' });

  async function savePw(e) {
    e.preventDefault();
    try {
      if (pw.n.length < 8) throw new Error('New password must be at least 8 characters');
      if (pw.n !== pw.c) throw new Error('Passwords do not match');
      await changePassword(pw.old, pw.n); setPw({ old: '', n: '', c: '' }); toast('Password updated', 'ok');
    } catch (ex) { toast(ex.message, 'bad'); }
  }
  function exportData() {
    const dump = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i);
      if (k.startsWith(`${config.storageKey}:${user.id}:`)) dump[k] = JSON.parse(localStorage.getItem(k)); } } catch { /* ignore */ }
    downloadText(`${config.storageKey}-data.json`, JSON.stringify(dump, null, 2), 'application/json'); toast('Data exported', 'ok');
  }
  function resetData() {
    try { Object.keys(localStorage).filter((k) => k.startsWith(`${config.storageKey}:${user.id}:`)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    toast('Workspace reset — reloading', 'warn'); setTimeout(() => location.reload(), 700);
  }

  return (
    <>
      <PageHead title="Settings" sub="Manage your profile, appearance and security" crumbs="Account / Settings" />
      <div className="grid g-1-2 stagger">
        <Card>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="avatar lg" style={{ margin: '0 auto' }}>{initials(user.name)}</div>
            <h3 className="mt12" style={{ fontSize: 19 }}>{user.name}</h3>
            <div className="muted small">{user.email}</div>
            <div className="mt12"><span className="badge b-acc">{user.role}</span></div>
            <div className="small faint mt12">Member since {new Date(user.created || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="grid mt16" style={{ gap: 10 }}>
            <button className="btn btn-ghost" onClick={exportData}><Download size={16} /> Export my data</button>
            <button className="btn btn-danger" onClick={resetData}><Trash2 size={16} /> Reset workspace data</button>
            <button className="btn btn-ghost" onClick={logout}>Sign out</button>
          </div>
        </Card>
        <div className="grid" style={{ gap: 18 }}>
          <Card title="Profile" sub="This is how you appear across the app">
            <div className="grid g2">
              <Field label="Full name"><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
              <Field label="Role"><select className="input" value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })}>
                {config.roles.map((r) => <option key={r}>{r}</option>)}</select></Field>
            </div>
            <button className="btn btn-primary" onClick={() => { updateProfile(p); toast('Profile saved', 'ok'); }}><Check size={16} /> Save changes</button>
          </Card>
          <Card title="Appearance" sub="Pick a theme and accent — saved to this browser">
            <div className="grid g3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: 10 }}>
              {THEMES.map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)} className="card" style={{ padding: 10, cursor: 'pointer', borderColor: theme === t.id ? 'var(--accent)' : undefined, boxShadow: theme === t.id ? '0 0 0 3px var(--accent-soft)' : 'none' }}>
                  <div style={{ height: 46, borderRadius: 9, background: `linear-gradient(135deg, ${t.bg} 50%, ${t.fg} 50%)`, border: '1px solid var(--border)' }} />
                  <div className="small bold mt8">{t.name}</div></button>))}
            </div>
            <div className="accent-row mt16">{ACCENTS.map((a) => <div key={a[0]} className={`accent-dot ${accent[0] === a[0] ? 'on' : ''}`} onClick={() => setAccent(a)} style={{ background: `linear-gradient(135deg, ${a[0]}, ${a[1]})` }} />)}</div>
            <label className="check mt16"><input type="checkbox" checked={animations} onChange={(e) => setAnimations(e.target.checked)} /> Enable animations &amp; motion</label>
          </Card>
          <Card title="Security" sub="Passwords are SHA-256 hashed in this browser">
            <form onSubmit={savePw} className="grid g3" style={{ alignItems: 'end' }}>
              <Field label="Current password"><input className="input" type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
              <Field label="New password"><input className="input" type="password" value={pw.n} onChange={(e) => setPw({ ...pw, n: e.target.value })} /></Field>
              <Field label="Confirm"><input className="input" type="password" value={pw.c} onChange={(e) => setPw({ ...pw, c: e.target.value })} /></Field>
              <div><button className="btn btn-primary">Update password</button></div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
