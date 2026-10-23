import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, PieChart, Briefcase, Pause, Play, Flame, TrendingDown } from 'lucide-react';
import { useMarket, chg, px, STOCKS, meta } from '../lib/market.jsx';
import { Spark, TickerTape } from '../lib/charts.jsx';
import { Card, PageHead, Stat, Badge } from '../core/ui.jsx';
import { useApp } from '../core/context.jsx';
import { HEX } from '../core/ui.jsx';

export const symColor = (sym) => HEX[[...sym].reduce((a, c) => a + c.charCodeAt(0), 0) % HEX.length];
export const SymBadge = ({ sym }) => <div className="sym-badge" style={{ background: `linear-gradient(135deg, ${symColor(sym)}, ${symColor(sym + 'x')})` }}>{sym.slice(0, 2)}</div>;

export default function Dashboard() {
  const { user } = useApp();
  const m = useMarket(); const nav = useNavigate();
  const sorted = [...STOCKS].map((s) => ({ ...s, q: m.quotes[s.sym], c: chg(m.quotes[s.sym]) })).sort((a, b) => b.c - a.c);
  const gainers = sorted.slice(0, 5), losers = sorted.slice(-5).reverse();
  const eq = m.equity.length > 3 ? m.equity : Array.from({ length: 40 }, (_, i) => ({ t: Date.now() - (40 - i) * 5000, v: Math.round(m.netWorth * (0.985 + Math.sin(i / 5) * 0.006 + i * 0.0004)) }));
  const pnl = m.netWorth - 1000000;
  const go = (sym) => nav('/trade?s=' + sym);
  return (
    <>
      <PageHead title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.name.split(' ')[0]} 📈`} crumbs="TradeX / Dashboard"
        sub={<span className="row" style={{ gap: 8 }}><span className="live-dot" style={m.running ? {} : { background: 'var(--faint)' }} /> {m.running ? 'Market simulation live — ticks every second' : 'Simulation paused'}</span>}>
        <button className="btn btn-ghost btn-sm" onClick={() => m.setRunning(!m.running)}>{m.running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Resume</>}</button>
        <button className="btn btn-primary btn-sm" onClick={() => nav('/trade')}>Start trading</button>
      </PageHead>
      <TickerTape />
      <div className="grid g4 stagger">
        <Stat icon={Wallet} label="Net worth" value={m.netWorth} prefix="₹" delta={+((pnl / 1000000) * 100).toFixed(2)} />
        <Stat icon={Briefcase} label="Holdings value" value={m.holdingsValue} prefix="₹" color="#8b5cf6" />
        <Stat icon={TrendingUp} label="Today's P&L" value={m.dayPnl} prefix={m.dayPnl < 0 ? '-₹' : '₹'} format={(v) => (m.dayPnl < 0 ? '-₹' : '₹') + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })} color={m.dayPnl >= 0 ? '#10b981' : '#ef4444'} />
        <Stat icon={PieChart} label="Available cash" value={m.cash} prefix="₹" color="#f59e0b" />
      </div>
      <div className="grid g-2-1 mt16 stagger">
        <Card title="Portfolio equity curve" sub="Net worth sampled every 5 seconds" action={<Badge kind={pnl >= 0 ? 'ok' : 'bad'}>{pnl >= 0 ? '+' : ''}{px(pnl)} all-time</Badge>}>
          <div style={{ height: 340 }}><ResponsiveContainer><AreaChart data={eq} margin={{ left: 10 }}>
            <defs><linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".4" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleTimeString('en-IN', { minute: '2-digit', second: '2-digit' })} tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis domain={['auto', 'auto']} tickFormatter={(v) => '₹' + (v / 100000).toFixed(2) + 'L'} tickLine={false} axisLine={false} width={70} />
            <Tooltip formatter={(v) => px(v)} labelFormatter={(t) => new Date(t).toLocaleTimeString('en-IN')} />
            <Area dataKey="v" name="Net worth" stroke="var(--accent)" strokeWidth={2.5} fill="url(#eqg)" isAnimationActive={false} />
          </AreaChart></ResponsiveContainer></div>
        </Card>
        <div className="grid" style={{ gap: 14 }}>
          {[['NIFTY 50', m.nifty, 24350, 'linear-gradient(135deg,#6366f1,#8b5cf6)'], ['SENSEX', m.sensex, 80120, 'linear-gradient(135deg,#0ea5e9,#2563eb)']].map(([n, v, b, g]) => (
            <div key={n} className="idx-card" style={{ background: g }}>
              <div className="small" style={{ opacity: .85 }}>{n} · simulated</div>
              <div style={{ fontSize: 28, fontWeight: 800 }} className="mono">{v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div className="small bold">{v >= b ? '▲' : '▼'} {(v - b).toFixed(2)} ({(((v - b) / b) * 100).toFixed(2)}%)</div>
            </div>))}
          <Card title="Watchlist" action={<a className="small bold" onClick={() => nav('/watchlist')} style={{ cursor: 'pointer' }}>Manage</a>}>
            {m.watch.slice(0, 4).map((s) => { const q = m.quotes[s]; const c = chg(q); return (
              <div className="list-item clickable" key={s} onClick={() => go(s)}>
                <b className="small" style={{ width: 90 }}>{s}</b><Spark data={q.spark} w={80} h={26} />
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div className={`small bold mono ${q.dir > 0 ? 'f-up' : q.dir < 0 ? 'f-down' : ''}`} key={q.price}>{px(q.price)}</div>
                  <div className={`small ${c >= 0 ? 'pos' : 'neg'}`}>{c >= 0 ? '+' : ''}{c.toFixed(2)}%</div></div>
              </div>); })}
          </Card>
        </div>
      </div>
      <div className="grid g2 mt16 stagger">
        {[['Top gainers', gainers, Flame], ['Top losers', losers, TrendingDown]].map(([t, list, I]) => (
          <Card key={t} title={t} action={<I size={18} color={t === 'Top gainers' ? 'var(--ok)' : 'var(--bad)'} />}>
            {list.map((s) => (
              <div className="list-item clickable" key={s.sym} onClick={() => go(s.sym)}>
                <SymBadge sym={s.sym} /><div style={{ minWidth: 0 }}><b className="small">{s.sym}</b><div className="small muted">{meta(s.sym).name}</div></div>
                <div style={{ marginLeft: 'auto' }}><Spark data={s.q.spark} w={90} h={30} /></div>
                <div style={{ width: 110, textAlign: 'right' }}><div className="small bold mono">{px(s.q.price)}</div><Badge kind={s.c >= 0 ? 'ok' : 'bad'}>{s.c >= 0 ? '+' : ''}{s.c.toFixed(2)}%</Badge></div>
              </div>))}
          </Card>))}
      </div>
    </>
  );
}
