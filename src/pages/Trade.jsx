import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, YAxis, ReferenceLine, XAxis } from 'recharts';
import { CandlestickChart, LineChart as LineIcon, Info } from 'lucide-react';
import { useMarket, chg, px, STOCKS, meta } from '../lib/market.jsx';
import { CandleChart, rsi } from '../lib/charts.jsx';
import { Card, PageHead, Badge, Tabs, Field } from '../core/ui.jsx';
import { useApp } from '../core/context.jsx';
import { SymBadge } from './Dashboard.jsx';

export default function Trade() {
  const m = useMarket(); const { toast } = useApp();
  const [params, setParams] = useSearchParams();
  const sym = params.get('s') || 'RELIANCE';
  const [side, setSide] = useState(params.get('side') || 'BUY');
  const [type, setType] = useState('MARKET');
  const [qty, setQty] = useState(10);
  const [limit, setLimit] = useState('');
  const [chart, setChart] = useState('candle');
  const [ov, setOv] = useState({ sma: true, ema: false });
  const q = m.quotes[sym]; const s = meta(sym); const c = chg(q);
  const price = type === 'LIMIT' && Number(limit) ? Number(limit) : q.price;
  const value = qty * price; const brokerage = Math.min(20, value * 0.0003); const taxes = value * 0.001;
  const held = m.holdings[sym]?.qty || 0;
  const rsiData = useMemo(() => rsi(q.candles.map((x) => x.c)).map((v, i) => ({ i, v })), [q.candles]);
  const lastRsi = rsiData[rsiData.length - 1]?.v;

  // simulated depth around LTP
  const book = useMemo(() => {
    const tick = q.price > 1000 ? 0.5 : 0.05; let seed = Math.round(q.price * 100) % 997;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const bids = Array.from({ length: 6 }, (_, i) => ({ p: q.price - (i + 1) * tick * (1 + rnd()), q: Math.round(50 + rnd() * 900) }));
    const asks = Array.from({ length: 6 }, (_, i) => ({ p: q.price + (i + 1) * tick * (1 + rnd()), q: Math.round(50 + rnd() * 900) }));
    return { bids, asks, max: Math.max(...bids.map((b) => b.q), ...asks.map((a) => a.q)) };
  }, [q.price]);

  function submit(e) {
    e.preventDefault();
    try { const o = m.placeOrder({ side, sym, qty: Number(qty), type, limit }); toast(`${type === 'MARKET' ? 'Executed' : 'Placed'}: ${side} ${o.qty} ${sym} ${type === 'MARKET' ? '@ ' + px(o.price) : 'limit ' + px(o.limit)}`, 'ok'); }
    catch (ex) { toast(ex.message, 'bad'); }
  }

  return (
    <>
      <PageHead title="Trade" crumbs="TradeX / Trade">
        <select className="input" style={{ width: 260 }} value={sym} onChange={(e) => setParams({ s: e.target.value })}>
          {STOCKS.map((x) => <option key={x.sym} value={x.sym}>{x.sym} — {x.name}</option>)}</select>
      </PageHead>
      <div className="card fade-up mb16" style={{ padding: 18 }}>
        <div className="row wrap" style={{ gap: 18 }}>
          <SymBadge sym={sym} /><div><h2 style={{ fontSize: 20 }}>{sym} <Badge kind="mute">{s.sector}</Badge></h2><div className="muted small">{s.name} · NSE (simulated)</div></div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div key={q.price} className={`mono ${q.dir > 0 ? 'f-up' : q.dir < 0 ? 'f-down' : ''}`} style={{ fontSize: 28, fontWeight: 800, padding: '0 6px' }}>{px(q.price)}</div>
            <div className={`bold ${c >= 0 ? 'pos' : 'neg'}`}>{c >= 0 ? '+' : ''}{(q.price - q.prevClose).toFixed(2)} ({c.toFixed(2)}%)</div></div>
        </div>
        <div className="grid mt16" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10 }}>
          {[['Open', px(q.open)], ['High', px(q.high)], ['Low', px(q.low)], ['Prev close', px(q.prevClose)], ['Volume', (q.volume / 100000).toFixed(2) + 'L'], ['RSI (14)', lastRsi ? lastRsi.toFixed(1) : '—'], ['You hold', held + ' sh']].map(([k, v]) => (
            <div key={k} className="tile" style={{ padding: 10 }}><div className="small muted">{k}</div><b className="mono small">{v}</b></div>))}
        </div>
      </div>
      <div className="grid g-2-1 stagger">
        <div className="grid" style={{ gap: 18 }}>
          <Card title="Price chart" sub="1 candle = 15 seconds of live simulated trading" action={
            <div className="row wrap"><Tabs value={chart} onChange={setChart} options={[{ id: 'candle', label: <CandlestickChart size={15} /> }, { id: 'line', label: <LineIcon size={15} /> }]} />
              <button className={`chip ${ov.sma ? 'on' : ''}`} onClick={() => setOv({ ...ov, sma: !ov.sma })}>SMA 20</button>
              <button className={`chip ${ov.ema ? 'on' : ''}`} onClick={() => setOv({ ...ov, ema: !ov.ema })}>EMA 9</button></div>}>
            <CandleChart candles={q.candles} overlays={ov} chartType={chart} />
          </Card>
          <Card title="RSI (14)" sub={lastRsi > 70 ? 'Overbought zone' : lastRsi < 30 ? 'Oversold zone' : 'Neutral momentum'}>
            <div style={{ height: 120 }}><ResponsiveContainer><LineChart data={rsiData} margin={{ left: -24, right: 8 }}>
              <XAxis dataKey="i" hide /><YAxis domain={[0, 100]} ticks={[30, 50, 70]} tickLine={false} axisLine={false} />
              <ReferenceLine y={70} stroke="var(--bad)" strokeDasharray="4 4" /><ReferenceLine y={30} stroke="var(--ok)" strokeDasharray="4 4" />
              <Line dataKey="v" stroke="#8b5cf6" dot={false} strokeWidth={2} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
          </Card>
        </div>
        <div className="grid" style={{ gap: 18, alignContent: 'start' }}>
          <Card title="Place order">
            <form onSubmit={submit}>
              <div className="side-tabs mb16"><button type="button" className={`buy ${side === 'BUY' ? 'on' : ''}`} onClick={() => setSide('BUY')}>BUY</button>
                <button type="button" className={`sell ${side === 'SELL' ? 'on' : ''}`} onClick={() => setSide('SELL')}>SELL</button></div>
              <div className="mb12"><Tabs value={type} onChange={setType} options={['MARKET', 'LIMIT']} /></div>
              <div className="grid g2">
                <Field label="Quantity"><input className="input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
                <Field label="Price"><input className="input" type="number" step="0.05" disabled={type === 'MARKET'} placeholder={q.price.toFixed(2)} value={type === 'MARKET' ? '' : limit} onChange={(e) => setLimit(e.target.value)} /></Field>
              </div>
              <div className="row wrap mb12">{[1, 5, 10, 25, 50, 100].map((n) => <button type="button" key={n} className="chip" onClick={() => setQty(n)}>{n}</button>)}</div>
              <div className="tile small" style={{ display: 'grid', gap: 6 }}>
                <div className="between"><span className="muted">Order value</span><b className="mono">{px(value || 0)}</b></div>
                <div className="between"><span className="muted">Brokerage (0.03%, max ₹20)</span><span className="mono">{px(brokerage || 0)}</span></div>
                <div className="between"><span className="muted">STT & charges (est.)</span><span className="mono">{px(taxes || 0)}</span></div>
                <div className="between"><span className="muted">Available cash</span><span className="mono">{px(m.cash)}</span></div>
              </div>
              <button className={`btn btn-block mt16 ${side === 'BUY' ? 'btn-ok' : 'btn-bad'}`}>{side} {qty || 0} {sym}</button>
              <p className="small faint mt8 row"><Info size={13} /> Virtual money only — no real orders are placed.</p>
            </form>
          </Card>
          <Card title="Market depth" sub="Simulated order book">
            <div className="book-row small muted" style={{ fontWeight: 700 }}><span>Bid</span><span>Qty</span><span style={{ textAlign: 'right' }}>Orders</span></div>
            {book.bids.map((b, i) => <div className="book-row" key={'b' + i}><i style={{ width: (b.q / book.max) * 100 + '%', background: 'var(--ok)' }} /><span className="pos">{b.p.toFixed(2)}</span><span>{b.q}</span><span style={{ textAlign: 'right' }}>{(b.q % 9) + 1}</span></div>)}
            <div className="book-row small muted mt8" style={{ fontWeight: 700 }}><span>Ask</span><span>Qty</span><span style={{ textAlign: 'right' }}>Orders</span></div>
            {book.asks.map((a, i) => <div className="book-row" key={'a' + i}><i style={{ width: (a.q / book.max) * 100 + '%', background: 'var(--bad)' }} /><span className="neg">{a.p.toFixed(2)}</span><span>{a.q}</span><span style={{ textAlign: 'right' }}>{(a.q % 7) + 1}</span></div>)}
          </Card>
        </div>
      </div>
    </>
  );
}
