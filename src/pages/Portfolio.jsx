import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Briefcase, Download, RotateCcw } from 'lucide-react';
import { useMarket, px, meta, chg } from '../lib/market.jsx';
import { Card, PageHead, Stat, Badge, Empty, HEX } from '../core/ui.jsx';
import { useApp } from '../core/context.jsx';
import { downloadText, toCSV } from '../core/store.js';
import { SymBadge } from './Dashboard.jsx';
import { TrendingUp, Wallet, Percent } from 'lucide-react';

export default function Portfolio() {
  const m = useMarket(); const nav = useNavigate(); const { toast } = useApp();
  const rows = Object.entries(m.holdings).map(([sym, h]) => { const q = m.quotes[sym]; const cur = h.qty * q.price, inv = h.qty * h.avg;
    return { sym, ...h, ltp: q.price, cur, inv, pnl: cur - inv, pct: ((cur - inv) / inv) * 100, day: h.qty * (q.price - q.prevClose), dayPct: chg(q), sector: meta(sym).sector }; });
  const total = rows.reduce((a, r) => a + r.pnl, 0);
  const sectors = Object.values(rows.reduce((a, r) => { a[r.sector] = a[r.sector] || { name: r.sector, value: 0 }; a[r.sector].value += r.cur; return a; }, {}));
  const exportCsv = () => downloadText('tradex-holdings.csv', toCSV(rows.map((r) => ({ symbol: r.sym, qty: r.qty, avg: r.avg.toFixed(2), ltp: r.ltp.toFixed(2), invested: r.inv.toFixed(2), current: r.cur.toFixed(2), pnl: r.pnl.toFixed(2) }))), 'text/csv');
  return (
    <>
      <PageHead title="Portfolio" crumbs="TradeX / Portfolio" sub="Holdings, allocation and performance">
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={15} /> Export CSV</button>
        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Reset to ₹10,00,000 virtual cash and clear holdings?')) { m.resetAccount(); toast('Account reset', 'warn'); } }}><RotateCcw size={15} /> Reset account</button>
      </PageHead>
      <div className="grid g4 stagger">
        <Stat icon={Wallet} label="Invested" value={m.invested} prefix="₹" />
        <Stat icon={Briefcase} label="Current value" value={m.holdingsValue} prefix="₹" color="#8b5cf6" />
        <Stat icon={TrendingUp} label="Total P&L" value={total} format={(v) => (total < 0 ? '-₹' : '+₹') + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })} color={total >= 0 ? '#10b981' : '#ef4444'} />
        <Stat icon={Percent} label="Return" value={m.invested ? (total / m.invested) * 100 : 0} suffix="%" decimals={2} color="#f59e0b" />
      </div>
      {!rows.length ? <Card className="mt16"><Empty icon={Briefcase} title="No holdings yet" text="Buy your first stock to build a portfolio." action={<button className="btn btn-primary" onClick={() => nav('/markets')}>Explore markets</button>} /></Card> : (<>
        <Card className="mt16 fade-up" title="Holdings" sub={`${rows.length} stocks`}>
          <div className="table-wrap"><table className="tbl"><thead><tr><th>Stock</th><th>Qty</th><th>Avg cost</th><th>LTP</th><th>Invested</th><th>Current</th><th>P&L</th><th>Day</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.sym}><td><div className="row"><SymBadge sym={r.sym} /><div><b>{r.sym}</b><div className="small muted">{r.sector}</div></div></div></td>
                <td className="mono">{r.qty}</td><td className="mono">{px(r.avg)}</td><td className="mono bold">{px(r.ltp)}</td><td className="mono">{px(r.inv)}</td><td className="mono">{px(r.cur)}</td>
                <td><div className={`mono bold ${r.pnl >= 0 ? 'pos' : 'neg'}`}>{r.pnl >= 0 ? '+' : ''}{px(r.pnl)}</div><Badge kind={r.pnl >= 0 ? 'ok' : 'bad'}>{r.pct.toFixed(2)}%</Badge></td>
                <td className={`mono small ${r.day >= 0 ? 'pos' : 'neg'}`}>{r.day >= 0 ? '+' : ''}{r.day.toFixed(0)}</td>
                <td><div className="row" style={{ gap: 6 }}><button className="btn btn-sm btn-ok" onClick={() => nav('/trade?s=' + r.sym + '&side=BUY')}>Add</button><button className="btn btn-sm btn-bad" onClick={() => nav('/trade?s=' + r.sym + '&side=SELL')}>Exit</button></div></td></tr>))}</tbody></table></div>
        </Card>
        <div className="grid g2 mt16 stagger">
          <Card title="Allocation by sector">
            <div style={{ height: 260 }}><ResponsiveContainer><PieChart>
              <Pie data={sectors} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} label={(e) => e.name}>
                {sectors.map((s, i) => <Cell key={s.name} fill={HEX[i % HEX.length]} />)}</Pie><Tooltip formatter={(v) => px(v)} /></PieChart></ResponsiveContainer></div>
          </Card>
          <Card title="P&L by stock">
            <div style={{ height: 260 }}><ResponsiveContainer><BarChart data={rows} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="sym" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(v) => '₹' + Math.round(v / 1000) + 'k'} />
              <Tooltip formatter={(v) => px(v)} /><Bar dataKey="pnl" name="P&L" radius={[6, 6, 0, 0]} isAnimationActive={false}>{rows.map((r) => <Cell key={r.sym} fill={r.pnl >= 0 ? '#10b981' : '#ef4444'} />)}</Bar>
            </BarChart></ResponsiveContainer></div>
          </Card>
        </div>
      </>)}
    </>
  );
}
