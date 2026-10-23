import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { store, sha256, uid } from './store.js';

export const THEMES = [
  { id: 'light', name: 'Light', bg: '#f4f6fb', fg: '#ffffff' },
  { id: 'dark', name: 'Dark', bg: '#0d1017', fg: '#1c2230' },
  { id: 'midnight', name: 'Midnight', bg: '#070b1c', fg: '#15204a' },
  { id: 'sunset', name: 'Sunset', bg: '#fff6ef', fg: '#ffd9bf' },
  { id: 'forest', name: 'Forest', bg: '#0c1511', fg: '#22392d' },
];
export const ACCENTS = [
  ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#2563eb'], ['#10b981', '#0d9488'],
  ['#f43f5e', '#ec4899'], ['#f59e0b', '#ef4444'], ['#8b5cf6', '#d946ef'],
];

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ config, children }) {
  const ns = config.storageKey;
  const [theme, setTheme] = useState(() => store.get(ns + ':theme', config.defaultTheme || 'light'));
  const [accent, setAccent] = useState(() => store.get(ns + ':accent', config.accent || ACCENTS[0]));
  const [animations, setAnimations] = useState(() => store.get(ns + ':anim', true));
  const [user, setUser] = useState(() => store.get(ns + ':session', null));
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--accent', accent[0]);
    root.style.setProperty('--accent2', accent[1]);
    document.body.classList.toggle('anim', animations);
    document.body.classList.toggle('noanim', !animations);
    store.set(ns + ':theme', theme); store.set(ns + ':accent', accent); store.set(ns + ':anim', animations);
  }, [theme, accent, animations, ns]);

  const toast = useCallback((msg, kind = 'info') => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  // ---- auth (client-side demo: users stored in this browser, passwords SHA-256 hashed) ----
  const users = () => store.get(ns + ':users', []);
  const ensureDemo = useCallback(async () => {
    const list = users();
    if (!list.find((u) => u.email === config.demo.email)) {
      list.push({ id: 'demo', name: config.demo.name, email: config.demo.email, role: config.demo.role,
        hash: await sha256(config.demo.password + ns), created: Date.now() });
      store.set(ns + ':users', list);
    }
  }, [config, ns]);

  const register = useCallback(async ({ name, email, password, role, extra }) => {
    await ensureDemo();
    const list = users();
    if (list.find((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists');
    const u = { id: uid(), name, email, role, extra, hash: await sha256(password + ns), created: Date.now() };
    list.push(u); store.set(ns + ':users', list);
    const session = { id: u.id, name, email, role, created: u.created };
    setUser(session); store.set(ns + ':session', session);
    return session;
  }, [ensureDemo, ns]);

  const login = useCallback(async (email, password, remember = true) => {
    await ensureDemo();
    const u = users().find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.hash !== (await sha256(password + ns))) throw new Error('Invalid email or password');
    const session = { id: u.id, name: u.name, email: u.email, role: u.role, created: u.created };
    setUser(session); if (remember) store.set(ns + ':session', session);
    return session;
  }, [ensureDemo, ns]);

  const logout = useCallback(() => { setUser(null); store.del(ns + ':session'); }, [ns]);
  const updateProfile = useCallback((patch) => {
    setUser((s) => { const n = { ...s, ...patch }; store.set(ns + ':session', n);
      store.set(ns + ':users', users().map((u) => (u.id === n.id ? { ...u, ...patch } : u))); return n; });
  }, [ns]);
  const changePassword = useCallback(async (oldPw, newPw) => {
    const list = users(); const u = list.find((x) => x.id === user.id);
    if (!u || u.hash !== (await sha256(oldPw + ns))) throw new Error('Current password is incorrect');
    u.hash = await sha256(newPw + ns); store.set(ns + ':users', list);
  }, [user, ns]);

  const value = useMemo(() => ({ config, theme, setTheme, accent, setAccent, animations, setAnimations,
    user, login, register, logout, updateProfile, changePassword, toast, toasts }),
  [config, theme, accent, animations, user, login, register, logout, updateProfile, changePassword, toast, toasts]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

// per-user persisted state hook
export function usePersist(key, initial) {
  const { config, user } = useApp();
  const k = `${config.storageKey}:${user?.id || 'anon'}:${key}`;
  const [v, setV] = useState(() => store.get(k, typeof initial === 'function' ? initial() : initial));
  useEffect(() => { store.set(k, v); }, [k, v]);
  return [v, setV];
}
