import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Palette, Menu, PanelLeftClose, PanelLeftOpen, LogOut, Settings, User, Sparkles, Github } from 'lucide-react';
import { useApp, THEMES, ACCENTS } from './context.jsx';
import { initials } from './store.js';
import { useClickAway } from './ui.jsx';

function ThemePop() {
  const { theme, setTheme, accent, setAccent, animations, setAnimations } = useApp();
  return (
    <div className="popover" style={{ width: 300 }}>
      <div className="small bold muted mb12">Theme</div>
      <div className="theme-swatches">
        {THEMES.map((t) => (
          <div key={t.id} title={t.name} className={`theme-sw ${theme === t.id ? 'on' : ''}`} onClick={() => setTheme(t.id)}
            style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.fg} 50%)` }} />))}
      </div>
      <div className="small bold muted mt16 mb12">Accent</div>
      <div className="accent-row">
        {ACCENTS.map((a) => (
          <div key={a[0]} className={`accent-dot ${accent[0] === a[0] ? 'on' : ''}`} onClick={() => setAccent(a)}
            style={{ background: `linear-gradient(135deg, ${a[0]}, ${a[1]})` }} />))}
      </div>
      <label className="check mt16 between" style={{ justifyContent: 'space-between' }}>
        <span><Sparkles size={14} style={{ verticalAlign: -2 }} /> Animations</span>
        <input type="checkbox" checked={animations} onChange={(e) => setAnimations(e.target.checked)} /></label>
    </div>
  );
}

export default function Layout({ children }) {
  const { config, user, logout, toast } = useApp();
  const [mini, setMini] = useState(false);
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(null);
  const [q, setQ] = useState('');
  const [read, setRead] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const close = useCallback(() => setPop(null), []);
  const popRef = useClickAway(close);
  const searchRef = useRef(null);
  const Logo = config.logo;

  useEffect(() => { setOpen(false); setPop(null); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  const allItems = useMemo(() => config.nav.flatMap((s) => s.items), [config]);
  const matches = q ? allItems.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : [];
  const current = allItems.find((i) => i.to === loc.pathname) || { label: '' };

  return (
    <div className="shell">
      <div className={`scrim ${open ? 'on' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${mini ? 'mini' : ''} ${open ? 'open' : ''}`}>
        <div className="sb-brand"><div className="sb-logo"><Logo size={20} /></div><span className="lbl">{config.name}</span></div>
        <nav className="sb-nav">
          {config.nav.map((s) => (
            <div key={s.section} style={{ display: 'grid', gap: 3 }}>
              <div className="sb-sec">{s.section}</div>
              {s.items.map((i) => (
                <NavLink key={i.to} to={i.to} end className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`} title={i.label}>
                  <i.icon size={19} /><span className="lbl">{i.label}</span>{i.tag && <span className="tag">{i.tag}</span>}
                </NavLink>))}
            </div>))}
        </nav>
        <div className="sb-foot">
          {config.promo && <div className="sb-promo"><b>{config.promo[0]}</b><div style={{ opacity: .9, marginTop: 3 }}>{config.promo[1]}</div></div>}
          <button className="sb-link" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer' }} onClick={() => { logout(); toast('Signed out', 'info'); }}>
            <LogOut size={19} /><span className="lbl">Sign out</span></button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => (window.innerWidth <= 960 ? setOpen(true) : setMini(!mini))} aria-label="Toggle menu">
            {window.innerWidth <= 960 ? <Menu size={18} /> : mini ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
          <div className="search">
            <Search size={16} />
            <input ref={searchRef} placeholder={config.searchPlaceholder || 'Search pages…'} value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { nav(matches[0].to); setQ(''); } }} />
            <kbd>Ctrl K</kbd>
            {matches.length > 0 && (
              <div className="popover" style={{ left: 0, right: 'auto', width: '100%' }}>
                {matches.map((m) => <button key={m.to} className="pop-item" onClick={() => { nav(m.to); setQ(''); }}><m.icon size={16} />{m.label}</button>)}
              </div>)}
          </div>
          <div className="tb-right" ref={popRef}>
            {config.github && <a className="icon-btn hide-sm" href={config.github} target="_blank" rel="noreferrer" title="Source on GitHub"><Github size={18} /></a>}
            <div className="pop-wrap">
              <button className="icon-btn" onClick={() => setPop(pop === 'theme' ? null : 'theme')} title="Appearance"><Palette size={18} /></button>
              {pop === 'theme' && <ThemePop />}
            </div>
            <div className="pop-wrap">
              <button className="icon-btn" onClick={() => { setPop(pop === 'notif' ? null : 'notif'); setRead(true); }} title="Notifications">
                <Bell size={18} />{!read && <span className="dot" />}</button>
              {pop === 'notif' && (
                <div className="popover" style={{ width: 340 }}>
                  <div className="between mb12"><b>Notifications</b><span className="badge b-acc">{config.notifications.length} new</span></div>
                  {config.notifications.map(([I, t, s], k) => (
                    <div className="notif" key={k}><div className="ic"><I size={16} /></div><div><div className="small bold">{t}</div><small>{s}</small></div></div>))}
                </div>)}
            </div>
            <div className="pop-wrap">
              <div className="user-chip" onClick={() => setPop(pop === 'user' ? null : 'user')}>
                <div className="avatar sm">{initials(user.name)}</div>
                <div className="uc-text"><b>{user.name}</b><small>{user.role}</small></div>
              </div>
              {pop === 'user' && (
                <div className="popover" style={{ width: 240 }}>
                  <div className="row mb12" style={{ padding: 6 }}><div className="avatar">{initials(user.name)}</div>
                    <div style={{ minWidth: 0 }}><b className="small">{user.name}</b><div className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div></div></div>
                  <button className="pop-item" onClick={() => nav('/settings')}><User size={16} /> My profile</button>
                  <button className="pop-item" onClick={() => nav('/settings')}><Settings size={16} /> Settings</button>
                  <button className="pop-item" style={{ color: 'var(--bad)' }} onClick={() => { logout(); toast('Signed out', 'info'); }}><LogOut size={16} /> Sign out</button>
                </div>)}
            </div>
          </div>
        </header>
        <main className="content" key={loc.pathname}>{children}</main>
        <footer className="footer"><span>© {new Date().getFullYear()} {config.name} · {current.label}</span>
          <span>Built by <a href="https://github.com/PreciousBharath" target="_blank" rel="noreferrer">Bharath</a> · React {config.stack ? '· ' + config.stack : ''}</span></footer>
      </div>
    </div>
  );
}
