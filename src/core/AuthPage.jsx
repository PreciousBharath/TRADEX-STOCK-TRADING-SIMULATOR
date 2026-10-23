import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight, Moon, Sun, ShieldCheck } from 'lucide-react';
import { useApp } from './context.jsx';

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const S_LABEL = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const S_COLOR = ['var(--bad)', 'var(--bad)', 'var(--warn)', 'var(--info)', 'var(--ok)'];

export default function AuthPage() {
  const { config, login, register, toast, theme, setTheme } = useApp();
  const [mode, setMode] = useState('login');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', role: config.roles[0], remember: true, terms: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const Logo = config.logo;
  const st = strength(f.password);

  async function submit(e) {
    e.preventDefault(); setErr('');
    try {
      setBusy(true);
      if (mode === 'login') {
        if (!f.email || !f.password) throw new Error('Enter your email and password');
        const u = await login(f.email.trim(), f.password, f.remember);
        toast(`Welcome back, ${u.name.split(' ')[0]}!`, 'ok');
      } else {
        if (f.name.trim().length < 3) throw new Error('Please enter your full name');
        if (!/^\S+@\S+\.\S+$/.test(f.email)) throw new Error('Enter a valid email address');
        if (st < 3) throw new Error('Use 8+ characters with upper/lower case, a number and a symbol');
        if (f.password !== f.confirm) throw new Error('Passwords do not match');
        if (!f.terms) throw new Error('Please accept the terms to continue');
        await register({ name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role });
        toast('Account created — welcome aboard! 🎉', 'ok');
      }
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }
  async function demo() {
    setBusy(true); setErr('');
    try { const u = await login(config.demo.email, config.demo.password, true); toast(`Signed in as ${u.name}`, 'ok'); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div className="auth anim">
      <section className="auth-hero">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" /><div className="gridlines" />
        <div className="auth-brand fade-up"><div className="auth-logo"><Logo size={24} /></div>{config.name}</div>
        <div>
          <h1 className="fade-up">{config.heroTitle}</h1>
          <p className="lead fade-up">{config.heroText}</p>
          <div className="auth-feats stagger">
            {config.heroFeatures.map(([I, t, s]) => (
              <div className="auth-feat" key={t}><div className="ic"><I size={18} /></div>
                <div><b style={{ fontSize: 14 }}>{t}</b><div style={{ fontSize: 12.5, opacity: .85 }}>{s}</div></div></div>
            ))}
          </div>
        </div>
        <div className="auth-stats fade-up">{config.heroStats.map(([v, l]) => <div key={l}><b>{v}</b>{l}</div>)}</div>
      </section>

      <section className="auth-side">
        <div className="auth-top">
          <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(theme === 'light' || theme === 'sunset' ? 'dark' : 'light')}>
            {theme === 'light' || theme === 'sunset' ? <Moon size={17} /> : <Sun size={17} />}</button>
        </div>
        <form className="auth-card fade-up" onSubmit={submit} noValidate>
          <div className="row mb16" style={{ gap: 10 }}>
            <div className="sb-logo"><Logo size={20} /></div><b style={{ fontSize: 18 }}>{config.name}</b>
          </div>
          <h2>{mode === 'login' ? 'Welcome back 👋' : 'Create your account'}</h2>
          <p className="sub">{mode === 'login' ? `Sign in to continue to ${config.name}` : config.registerText}</p>
          <div className="auth-tabs">
            <div className="ind" style={{ left: mode === 'login' ? 4 : 'calc(50%)' }} />
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); }}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setErr(''); }}>Register</button>
          </div>

          {mode === 'register' && (
            <label className="field"><span>Full name</span>
              <div className="input-wrap"><User size={17} /><input className="input" placeholder="e.g. Priya Raman" value={f.name} onChange={set('name')} /></div></label>
          )}
          <label className="field"><span>Email address</span>
            <div className="input-wrap"><Mail size={17} /><input className="input" type="email" placeholder="you@example.com" value={f.email} onChange={set('email')} autoComplete="email" /></div></label>
          <label className="field"><span>Password</span>
            <div className="input-wrap"><Lock size={17} />
              <input className="input" type={show ? 'text' : 'password'} placeholder="••••••••" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Show password">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            {mode === 'register' && f.password && (<>
              <div className="strength">{[0, 1, 2, 3].map((i) => <i key={i} style={{ background: i < st ? S_COLOR[st] : undefined }} />)}</div>
              <span className="small" style={{ color: S_COLOR[st] }}>{S_LABEL[st]}</span></>)}
          </label>
          {mode === 'register' && (<>
            <label className="field"><span>Confirm password</span>
              <div className="input-wrap"><ShieldCheck size={17} /><input className={`input ${f.confirm && f.confirm !== f.password ? 'err' : ''}`} type={show ? 'text' : 'password'} placeholder="Repeat password" value={f.confirm} onChange={set('confirm')} /></div></label>
            <div className="field"><span>I am a</span>
              <div className="role-grid">{config.roles.map((r) => (
                <button type="button" key={r} className={f.role === r ? 'on' : ''} onClick={() => setF({ ...f, role: r })}>{r}</button>))}</div></div>
            <label className="check mb16"><input type="checkbox" checked={f.terms} onChange={set('terms')} />I agree to the Terms &amp; Privacy Policy</label>
          </>)}
          {mode === 'login' && (
            <div className="between mb16"><label className="check"><input type="checkbox" checked={f.remember} onChange={set('remember')} />Remember me</label>
              <a href="#" onClick={(e) => { e.preventDefault(); toast('Password reset link sent (demo)', 'info'); }} className="small bold">Forgot password?</a></div>
          )}
          {err && <div className="badge b-bad mb12" style={{ whiteSpace: 'normal', padding: '9px 12px', borderRadius: 10, display: 'flex' }}>{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></>}</button>
          <div className="divider">or</div>
          <button type="button" className="btn btn-ghost btn-block" onClick={demo} disabled={busy}><Zap size={17} /> Try the demo account</button>
          <p className="small faint mt12" style={{ textAlign: 'center' }}>Demo: {config.demo.email} · {config.demo.password}</p>
        </form>
      </section>
    </div>
  );
}
