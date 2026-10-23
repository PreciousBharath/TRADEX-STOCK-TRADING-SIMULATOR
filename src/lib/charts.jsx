import { useMemo, useState } from 'react';
import { useMarket, chg, px, STOCKS } from './market.jsx';

export function Spark({ data, w = 110, h = 34, color }) {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data); const up = data[data.length - 1] >= data[0];
  const c = color || (up ? 'var(--ok)' : 'var(--bad)');
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / (mx - mn || 1)) * (h - 4) - 2}`).join(' ');
  const id = 'sg' + Math.round(data[0] * 1000) % 100000;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity=".3" /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

const sma = (arr, n) => arr.map((_, i) => (i < n - 1 ? null : arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n));
const ema = (arr, n) => { const k = 2 / (n + 1); let e = arr[0]; return arr.map((v) => (e = v * k + e * (1 - k))); };
export function rsi(closes, n = 14) {
  const out = []; let g = 0, l = 0;
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]; const gain = Math.max(0, d), loss = Math.max(0, -d);
    if (i <= n) { g += gain / n; l += loss / n; out.push(null); continue; }
    g = (g * (n - 1) + gain) / n; l = (l * (n - 1) + loss) / n; out.push(100 - 100 / (1 + g / (l || 1e-9)));
  }
  return [null, ...out];
}

export function CandleChart({ candles, height = 380, overlays = { sma: true, ema: false }, chartType = 'candle' }) {
  const [hover, setHover] = useState(null);
  const W = 900, H = height, padR = 64, volH = 60, top = 10;
  const closes = candles.map((c) => c.c);
  const s20 = useMemo(() => sma(closes, 20), [candles]); // eslint-disable-line
  const e9 = useMemo(() => ema(closes, 9), [candles]); // eslint-disable-line
  const hi = Math.max(...candles.map((c) => c.h)), lo = Math.min(...candles.map((c) => c.l));
  const pad = (hi - lo) * 0.08; const yMax = hi + pad, yMin = lo - pad;
  const plotH = H - volH - top - 18; const cw = (W - padR) / candles.length;
  const y = (v) => top + ((yMax - v) / (yMax - yMin)) * plotH;
  const vMax = Math.max(...candles.map((c) => c.v));
  const last = candles[candles.length - 1];
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const line = (arr) => arr.map((v, i) => (v == null ? null : `${i * cw + cw / 2},${y(v)}`)).filter(Boolean).join(' ');
  const hv = hover != null ? candles[hover] : last;

  return (
    <div style={{ position: 'relative' }}>
      <div className="row wrap small mono" style={{ gap: 14, marginBottom: 6 }}>
        <span>O <b>{hv.o.toFixed(2)}</b></span><span>H <b style={{ color: 'var(--ok)' }}>{hv.h.toFixed(2)}</b></span>
        <span>L <b style={{ color: 'var(--bad)' }}>{hv.l.toFixed(2)}</b></span><span>C <b>{hv.c.toFixed(2)}</b></span>
        <span className="muted">{new Date(hv.t).toLocaleTimeString('en-IN')}</span>
        {overlays.sma && <span style={{ color: '#f59e0b' }}>— SMA 20</span>}{overlays.ema && <span style={{ color: '#0ea5e9' }}>— EMA 9</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W; const i = Math.floor(x / cw); setHover(i >= 0 && i < candles.length ? i : null); }}
        onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (<g key={t}><line x1="0" x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeDasharray="3 4" />
          <text x={W - padR + 6} y={y(t) + 4} fontSize="11" fill="var(--faint)">{t.toFixed(t > 1000 ? 0 : 1)}</text></g>))}
        {candles.map((c, i) => { const up = c.c >= c.o; const col = up ? '#10b981' : '#ef4444'; const x = i * cw; return (
          <g key={c.t}>
            <rect x={x + cw * 0.15} width={cw * 0.7} y={H - 16 - (c.v / vMax) * volH} height={(c.v / vMax) * volH} fill={col} opacity=".25" />
            {chartType === 'candle' && <>
              <line x1={x + cw / 2} x2={x + cw / 2} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1.2" />
              <rect x={x + cw * 0.18} width={cw * 0.64} y={y(Math.max(c.o, c.c))} height={Math.max(1.2, Math.abs(y(c.o) - y(c.c)))} fill={col} rx="1.5" />
            </>}
          </g>); })}
        {chartType === 'line' && <>
          <polygon points={`${cw / 2},${y(yMin)} ${line(closes)} ${(candles.length - 0.5) * cw},${y(yMin)}`} fill="var(--accent)" opacity=".12" />
          <polyline points={line(closes)} fill="none" stroke="var(--accent)" strokeWidth="2.2" />
        </>}
        {overlays.sma && <polyline points={line(s20)} fill="none" stroke="#f59e0b" strokeWidth="1.6" />}
        {overlays.ema && <polyline points={line(e9)} fill="none" stroke="#0ea5e9" strokeWidth="1.6" />}
        <line x1="0" x2={W - padR} y1={y(last.c)} y2={y(last.c)} stroke={last.c >= last.o ? '#10b981' : '#ef4444'} strokeDasharray="2 3" />
        <rect x={W - padR + 2} y={y(last.c) - 10} width={padR - 4} height="20" rx="5" fill={last.c >= last.o ? '#10b981' : '#ef4444'} />
        <text x={W - padR + 7} y={y(last.c) + 4} fontSize="11.5" fill="#fff" fontWeight="700">{last.c.toFixed(2)}</text>
        {hover != null && <line x1={hover * cw + cw / 2} x2={hover * cw + cw / 2} y1={top} y2={H - 16} stroke="var(--muted)" strokeDasharray="3 3" />}
      </svg>
    </div>
  );
}

export function TickerTape() {
  const { quotes } = useMarket();
  const items = STOCKS.map((s) => ({ s: s.sym, p: quotes[s.sym].price, c: chg(quotes[s.sym]) }));
  return (
    <div className="tape">
      <div className="tape-track">
        {[...items, ...items].map((i, k) => (
          <span key={k} className="tape-item"><b>{i.s}</b> {px(i.p)} <span style={{ color: i.c >= 0 ? 'var(--ok)' : 'var(--bad)' }}>{i.c >= 0 ? '▲' : '▼'} {Math.abs(i.c).toFixed(2)}%</span></span>))}
      </div>
    </div>
  );
}
