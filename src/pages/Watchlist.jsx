import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellPlus, Trash2, Star, Bell } from 'lucide-react';
import { useMarket, px, chg, STOCKS } from '../lib/market.jsx';
import { Spark } from '../lib/charts.jsx';
import { Card, PageHead, Badge, Empty, Field } from '../core/ui.jsx';
import { useApp } from '../core/context.jsx';
import { uid } from '../core/store.js';
import { SymBadge } from './Dashboard.jsx';

export default function Watchlist() {
  const m = useMarket(); const nav = useNavigate(); const { toast } = useApp();
  const [f, setF] = useState({ sym: 'RELIANCE', dir: 'above', price: '' });
  function addAlert(e) {
    e.preventDefault(); if (!(Number(f.price) > 0)) return toast('Enter a target price', 'warn');
    m.setPriceAlerts([...m.priceAlerts, { ...f, price: Number(f.price), id: uid(), done: false }]); toast('Price alert set', 'ok'); setF({ ...f, price: '' });
  }
  return (
    <>
      <PageHead title="Watchlist & alerts" crumbs="TradeX / Watchlist" sub="Track favourites and get notified when a price is crossed">
        <select className="input" style={{ width: 220 }} value="" onChange={(e) => e.target.value && m.setWatch((w) => [...new Set([...w, e.target.value])])}>
          <option value="">+ Add to watchlist</option>{STOCKS.filter((s) => !m.watch.includes(s.sym)).map((s) => <option key={s.sym} value={s.sym}>{s.sym}</option>)}</select>
      </PageHead>
      {!m.watch.length ? <Card><Empty icon={Star} title="Watchlist is empty" /></Card> : (
        <div className="grid g3 stagger">
          {m.watch.map((s) => { const q = m.quotes[s]; const c = chg(q); return (
            <div key={s} className="card hover">
              <div className="between"><div className="row clickable" onClick={() => nav('/trade?s=' + s)}><SymBadge sym={s} /><div><b>{s}</b><div className="small muted">{STOCKS.find((x) => x.sym === s).name}</div></div></div>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => m.setWatch(m.watch.filter((x) => x !== s))}><Trash2 size={15} /></button></div>
              <div className="between mt12"><div><div key={q.price} className={`mono bold ${q.dir > 0 ? 'f-up' : q.dir < 0 ? 'f-down' : ''}`} style={{ fontSize: 22 }}>{px(q.price)}</div>
                <Badge kind={c >= 0 ? 'ok' : 'bad'}>{c >= 0 ? '+' : ''}{c.toFixed(2)}%</Badge></div><Spark data={q.spark} w={130} h={48} /></div>
            </div>); })}
        </div>)}
      <div className="grid g-1-2 mt16 stagger">
        <Card title="New price alert" action={<BellPlus size={18} color="var(--accent)" />}>
          <form onSubmit={addAlert}>
            <Field label="Stock"><select className="input" value={f.sym} onChange={(e) => setF({ ...f, sym: e.target.value })}>{STOCKS.map((s) => <option key={s.sym}>{s.sym}</option>)}</select></Field>
            <div className="grid g2"><Field label="When price goes"><select className="input" value={f.dir} onChange={(e) => setF({ ...f, dir: e.target.value })}><option value="above">above</option><option value="below">below</option></select></Field>
              <Field label="Target ₹"><input className="input" type="number" step="0.05" placeholder={m.quotes[f.sym].price.toFixed(2)} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field></div>
            <button className="btn btn-primary btn-block">Create alert</button>
          </form>
        </Card>
        <Card title="Active & triggered alerts">
          {!m.priceAlerts.length ? <Empty icon={Bell} title="No alerts yet" text="Alerts fire as a toast the moment the live price crosses your target." /> : m.priceAlerts.map((a) => (
            <div className="list-item" key={a.id}><SymBadge sym={a.sym} /><div style={{ flex: 1 }}><b className="small">{a.sym} {a.dir} {px(a.price)}</b><div className="small muted">Now {px(m.quotes[a.sym].price)}</div></div>
              <Badge kind={a.done ? 'ok' : 'info'}>{a.done ? 'Triggered' : 'Watching'}</Badge>
              <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => m.setPriceAlerts(m.priceAlerts.filter((x) => x.id !== a.id))}><Trash2 size={15} /></button></div>))}
        </Card>
      </div>
    </>
  );
}
