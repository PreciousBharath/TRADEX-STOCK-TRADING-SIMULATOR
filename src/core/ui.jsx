import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApp } from './context.jsx';

export function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  const cur = useRef(0);
  const { animations } = useApp();
  useEffect(() => {
    if (!animations) { setV(target); cur.current = target; return; }
    let raf; const t0 = performance.now(); const from = cur.current;
    const step = (t) => { const p = Math.min(1, (t - t0) / duration); const e = 1 - Math.pow(1 - p, 3);
      const val = from + (target - from) * e; cur.current = val; setV(val); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [target, duration, animations]);
  return v;
}

export function PageHead({ title, sub, crumbs, children }) {
  return (
    <div className="page-head fade-up">
      <div>{crumbs && <div className="crumbs">{crumbs}</div>}<h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}

export function Card({ title, sub, action, children, className = '', style, hover }) {
  return (
    <div className={`card ${hover ? 'hover' : ''} ${className}`} style={style}>
      {(title || action) && (
        <div className="card-head"><div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{action}</div>
      )}
      {children}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, prefix = '', suffix = '', decimals = 0, delta, color = 'var(--accent)', format }) {
  const v = useCountUp(Number(value) || 0);
  const shown = format ? format(v) : prefix + v.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix;
  return (
    <div className="card stat hover">
      <div className="between">
        <div className="ic" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{Icon && <Icon size={21} />}</div>
        {delta != null && <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%</span>}
      </div>
      <div className="val">{shown}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export const Badge = ({ kind = 'acc', children }) => <span className={`badge b-${kind}`}>{children}</span>;

export function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return; const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="between mb16"><h3 style={{ fontSize: 19, fontWeight: 800 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
        {footer && <div className="row mt20" style={{ justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  const icons = { ok: CheckCircle2, bad: XCircle, warn: AlertTriangle, info: Info };
  const colors = { ok: 'var(--ok)', bad: 'var(--bad)', warn: 'var(--warn)', info: 'var(--accent)' };
  return (
    <div className="toasts">
      {toasts.map((t) => { const I = icons[t.kind] || Info; return (
        <div key={t.id} className={`toast ${t.kind}`}><I size={19} color={colors[t.kind]} /><span>{t.msg}</span></div>); })}
    </div>
  );
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="tabs">
      {options.map((o) => { const id = o.id ?? o; return (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>{o.label ?? o}</button>); })}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">{Icon && <div className="ic"><Icon size={28} /></div>}
      <h3 style={{ color: 'var(--text)', fontSize: 16 }}>{title}</h3>{text && <p className="small mt8">{text}</p>}
      {action && <div className="mt16">{action}</div>}</div>
  );
}

export function Ring({ value, size = 120, stroke = 11, color = 'var(--accent)', label, sub }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const v = useCountUp(value);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, v) / 100)} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div><div style={{ fontSize: size / 4.6, fontWeight: 800, lineHeight: 1 }}>{label ?? Math.round(v) + '%'}</div>
          {sub && <div className="small muted" style={{ marginTop: 3 }}>{sub}</div>}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, error }) {
  return <label className="field"><span>{label}</span>{children}{error && <span className="err-text">{error}</span>}</label>;
}

export function Slider({ label, value, min, max, step = 1, onChange, unit = '', fmt }) {
  return (
    <div className="field">
      <div className="between"><span className="small bold muted">{label}</span>
        <span className="badge b-acc mono">{fmt ? fmt(value) : value}{unit}</span></div>
      <input type="range" className="rng" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: `linear-gradient(90deg, var(--accent) ${((value - min) / (max - min || 1)) * 100}%, var(--surface2) ${((value - min) / (max - min || 1)) * 100}%)` }} />
    </div>
  );
}

export function useClickAway(onAway) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onAway();
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [onAway]);
  return ref;
}

export const CHART_COLORS = ['var(--accent)', 'var(--accent2)', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#ec4899', '#14b8a6'];
export const HEX = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#ec4899', '#14b8a6', '#84cc16', '#f97316'];
