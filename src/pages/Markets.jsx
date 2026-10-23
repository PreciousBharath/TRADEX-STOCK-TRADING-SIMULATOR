import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ArrowUpDown } from 'lucide-react';
import { useMarket, chg, px, STOCKS, SECTORS } from '../lib/market.jsx';
import { Spark } from '../lib/charts.jsx';
import { Card, PageHead, Badge } from '../core/ui.jsx';
import { SymBadge } from './Dashboard.jsx';

export default function Markets() {
  const m = useMarket(); const nav = useNavigate();
  const [q, setQ] = useState(''); const [sec, setSec] = useState('All'); const [sort, setSort] = useState({ k: 'c', d: -1 });
  const rows = STOCKS.map((s) => ({ ...s, q: m.quotes[s.sym], c: chg(m.quotes[s.sym]), p: m.quotes[s.sym].price, v: m.quotes[s.sym].volume }))
    .filter((s) => (sec === 'All' || s.sector === sec) && (s.sym + s.name).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.d);
  const breadth = STOCKS.filter((s) => chg(m.quotes[s.sym]) >= 0).length;
  const H = ({ k, children }) => <th className="clickable" onClick={() => setSort({ k, d: sort.k === k ? -sort.d : -1 })}>{children} <ArrowUpDown size={11} /></th>;
  const toggleWatch = (sym) => m.setWatch((w) => (w.includes(sym) ? w.filter((x) => x !== sym) : [...w, sym]));
  return (
    <>
      <PageHead title="Markets" crumbs="TradeX / Markets" sub="NIFTY heavyweights with live simulated quotes">
        <Badge kind="ok">▲ {breadth} advancing</Badge><Badge kind="bad">▼ {STOCKS.length - breadth} declining</Badge>
      </PageHead>
      <div className="grid fade-up" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12, marginBottom: 18 }}>
        {SECTORS.map((s) => { const list = STOCKS.filter((x) => x.sector === s); const avg = list.reduce((a, x) => a + chg(m.quotes[x.sym]), 0) / list.length; return (
          <div key={s} className="card hover clickable" onClick={() => setSec(sec === s ? 'All' : s)} style={{ padding: 14, borderColor: sec === s ? 'var(--accent)' : undefined, background: `color-mix(in srgb, ${avg >= 0 ? 'var(--ok)' : 'var(--bad)'} ${Math.min(30, Math.abs(avg) * 12 + 4)}%, var(--surface))` }}>
            <div className="small bold">{s}</div><div className={`bold ${avg >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 18 }}>{avg >= 0 ? '+' : ''}{avg.toFixed(2)}%</div><div className="small muted">{list.length} stocks</div>
          </div>); })}
      </div>
      <Card>
        <div className="row wrap mb16">
          <div className="search" style={{ maxWidth: 320 }}><Search size={16} /><input placeholder="Search symbol or company" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="row wrap">{['All', ...SECTORS].map((s) => <button key={s} className={`chip ${sec === s ? 'on' : ''}`} onClick={() => setSec(s)}>{s}</button>)}</div>
        </div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th></th><H k="sym">Symbol</H><th>Sector</th><H k="p">LTP</H><H k="c">Change</H><th>Day range</th><H k="v">Volume</H><th>Trend</th><th></th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.sym}>
              <td><Star size={16} className="clickable" color={m.watch.includes(s.sym) ? '#f59e0b' : 'var(--faint)'} fill={m.watch.includes(s.sym) ? '#f59e0b' : 'none'} onClick={() => toggleWatch(s.sym)} /></td>
              <td><div className="row clickable" onClick={() => nav('/trade?s=' + s.sym)}><SymBadge sym={s.sym} /><div><b>{s.sym}</b><div className="small muted">{s.name}</div></div></div></td>
              <td><Badge kind="mute">{s.sector}</Badge></td>
              <td className="mono bold"><span key={s.p} className={s.q.dir > 0 ? 'f-up' : s.q.dir < 0 ? 'f-down' : ''} style={{ padding: '2px 4px' }}>{px(s.p)}</span></td>
              <td><Badge kind={s.c >= 0 ? 'ok' : 'bad'}>{s.c >= 0 ? '▲' : '▼'} {Math.abs(s.c).toFixed(2)}%</Badge></td>
              <td><div className="small mono muted">{s.q.low.toFixed(1)} – {s.q.high.toFixed(1)}</div>
                <div className="progress" style={{ height: 5, width: 110 }}><i style={{ width: ((s.p - s.q.low) / (s.q.high - s.q.low || 1)) * 100 + '%' }} /></div></td>
              <td className="mono small">{(s.v / 100000).toFixed(2)}L</td>
              <td><Spark data={s.q.spark} w={100} h={30} /></td>
              <td><div className="row" style={{ gap: 6 }}><button className="btn btn-sm btn-ok" onClick={() => nav('/trade?s=' + s.sym + '&side=BUY')}>Buy</button>
                <button className="btn btn-sm btn-bad" onClick={() => nav('/trade?s=' + s.sym + '&side=SELL')}>Sell</button></div></td>
            </tr>))}</tbody></table></div>
      </Card>
    </>
  );
}
