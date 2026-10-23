import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePersist, useApp } from '../core/context.jsx';
import { rng, gauss, uid } from '../core/store.js';

// Simulated NSE universe (prices are illustrative, movements are random-walk simulated)
export const STOCKS = [
  ['RELIANCE', 'Reliance Industries', 'Energy', 2920], ['TCS', 'Tata Consultancy Services', 'IT', 4110], ['INFY', 'Infosys', 'IT', 1865],
  ['HDFCBANK', 'HDFC Bank', 'Banking', 1712], ['ICICIBANK', 'ICICI Bank', 'Banking', 1268], ['SBIN', 'State Bank of India', 'Banking', 812],
  ['BHARTIARTL', 'Bharti Airtel', 'Telecom', 1640], ['ITC', 'ITC Ltd', 'FMCG', 488], ['HINDUNILVR', 'Hindustan Unilever', 'FMCG', 2790],
  ['LT', 'Larsen & Toubro', 'Infra', 3620], ['TATAMOTORS', 'Tata Motors', 'Auto', 935], ['MARUTI', 'Maruti Suzuki', 'Auto', 12450],
  ['SUNPHARMA', 'Sun Pharma', 'Pharma', 1790], ['WIPRO', 'Wipro', 'IT', 548], ['ADANIENT', 'Adani Enterprises', 'Infra', 3080],
  ['ASIANPAINT', 'Asian Paints', 'FMCG', 3020], ['TITAN', 'Titan Company', 'Consumer', 3480], ['ZOMATO', 'Zomato', 'Consumer', 262],
  ['TATASTEEL', 'Tata Steel', 'Metals', 158], ['HCLTECH', 'HCL Technologies', 'IT', 1830],
].map(([sym, name, sector, price], i) => ({ sym, name, sector, base: price, vol: 0.0016 + (i % 5) * 0.0004 }));

export const SECTORS = [...new Set(STOCKS.map((s) => s.sector))];
const CANDLE_MS = 15000; // one live candle every 15 seconds
const HIST = 90;

function initialState() {
  const r = rng(20261023); const state = {};
  for (const s of STOCKS) {
    const prev = s.base * (0.985 + r() * 0.03); let p = prev; const candles = []; const t0 = Date.now() - HIST * CANDLE_MS;
    const drift = (r() - 0.5) * 0.0006;
    for (let i = 0; i < HIST; i++) {
      const o = p; let h = o, l = o; let c = o;
      for (let k = 0; k < 4; k++) { c = c * (1 + gauss(r) * s.vol * 0.55 + drift + (prev - c) / prev * 0.01); h = Math.max(h, c); l = Math.min(l, c); }
      candles.push({ t: t0 + i * CANDLE_MS, o, h, l, c, v: Math.round(2000 + r() * 9000) }); p = c;
    }
    const prevClose = prev;
    state[s.sym] = { price: p, prevClose, open: candles[0].o, high: Math.max(...candles.map((c) => c.h)), low: Math.min(...candles.map((c) => c.l)),
      volume: candles.reduce((a, c) => a + c.v, 0) * 40, candles, spark: candles.slice(-30).map((c) => c.c), dir: 0 };
  }
  return state;
}

const Ctx = createContext(null);
export const useMarket = () => useContext(Ctx);

export function MarketProvider({ children }) {
  const { toast } = useApp();
  const [quotes, setQuotes] = useState(initialState);
  const [running, setRunning] = useState(true);
  const [cash, setCash] = usePersist('cash', 730200);
  const [holdings, setHoldings] = usePersist('holdings', { TCS: { qty: 20, avg: 3980 }, HDFCBANK: { qty: 60, avg: 1650 }, ZOMATO: { qty: 400, avg: 228 } });
  const [orders, setOrders] = usePersist('orders', []);
  const [watch, setWatch] = usePersist('watch', ['RELIANCE', 'INFY', 'TATAMOTORS', 'SBIN', 'TITAN']);
  const [priceAlerts, setPriceAlerts] = usePersist('palerts', []);
  const [equity, setEquity] = usePersist('equity', []);
  const ref = useRef({ quotes, orders, priceAlerts, holdings, cash });
  ref.current = { quotes, orders, priceAlerts, holdings, cash };
  const seed = useRef(rng(Date.now() % 100000));

  // tick engine
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const r = seed.current; const marketMood = gauss(r) * 0.0006;
      setQuotes((q) => {
        const n = {};
        for (const s of STOCKS) {
          const cur = q[s.sym]; const ret = gauss(r) * s.vol * 0.6 + marketMood + (cur.prevClose - cur.price) / cur.prevClose * 0.004;
          const price = Math.max(1, cur.price * (1 + ret));
          let candles = cur.candles; const last = candles[candles.length - 1]; const now = Date.now();
          if (now - last.t >= CANDLE_MS) candles = [...candles.slice(-HIST + 1), { t: last.t + CANDLE_MS, o: last.c, h: Math.max(last.c, price), l: Math.min(last.c, price), c: price, v: Math.round(r() * 3000) }];
          else candles = [...candles.slice(0, -1), { ...last, c: price, h: Math.max(last.h, price), l: Math.min(last.l, price), v: last.v + Math.round(r() * 400) }];
          n[s.sym] = { ...cur, price, high: Math.max(cur.high, price), low: Math.min(cur.low, price), volume: cur.volume + Math.round(r() * 5000), candles, dir: Math.sign(price - cur.price), spark: [...cur.spark.slice(-29), price] };
        }
        return n;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // limit order matching + price alerts + equity curve
  useEffect(() => {
    const { quotes: q, orders: os, priceAlerts: pa } = ref.current;
    let changed = false;
    const next = os.map((o) => {
      if (o.status !== 'OPEN') return o; const p = q[o.sym].price;
      const hit = o.side === 'BUY' ? p <= o.limit : p >= o.limit;
      if (!hit) return o; changed = true; applyFill(o.side, o.sym, o.qty, o.limit, true);
      toast(`✅ Limit ${o.side} ${o.qty} ${o.sym} filled @ ₹${o.limit.toFixed(2)}`, 'ok');
      return { ...o, status: 'FILLED', fillPrice: o.limit, filledAt: Date.now() };
    });
    if (changed) setOrders(next);
    const fired = pa.filter((a) => !a.done && (a.dir === 'above' ? q[a.sym].price >= a.price : q[a.sym].price <= a.price));
    if (fired.length) { fired.forEach((a) => toast(`🔔 ${a.sym} crossed ${a.dir} ₹${a.price}`, 'warn')); setPriceAlerts(pa.map((a) => (fired.includes(a) ? { ...a, done: true } : a))); }
  }, [quotes]); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      const { quotes: q, holdings: h, cash: c } = ref.current;
      const val = c + Object.entries(h).reduce((a, [s, x]) => a + x.qty * q[s].price, 0);
      setEquity((e) => [...e.slice(-119), { t: Date.now(), v: Math.round(val) }]);
    }, 5000);
    return () => clearInterval(id);
  }, [setEquity]);

  const applyFill = useCallback((side, sym, qty, price, reserved = false) => {
    const brokerage = Math.min(20, qty * price * 0.0003);
    if (side === 'BUY') {
      if (!reserved) setCash((c) => c - qty * price - brokerage); else setCash((c) => c - brokerage);
      setHoldings((h) => { const cur = h[sym] || { qty: 0, avg: 0 }; const nq = cur.qty + qty; return { ...h, [sym]: { qty: nq, avg: (cur.qty * cur.avg + qty * price) / nq } }; });
    } else {
      setCash((c) => c + qty * price - brokerage);
      setHoldings((h) => { const cur = h[sym]; const nq = cur.qty - qty; const n = { ...h }; if (nq <= 0) delete n[sym]; else n[sym] = { ...cur, qty: nq }; return n; });
    }
  }, [setCash, setHoldings]);

  const placeOrder = useCallback(({ side, sym, qty, type, limit }) => {
    const { quotes: q, holdings: h, cash: c } = ref.current; const p = q[sym].price; qty = Math.floor(qty);
    if (!qty || qty <= 0) throw new Error('Enter a valid quantity');
    if (side === 'SELL' && (h[sym]?.qty || 0) < qty) throw new Error(`You hold only ${h[sym]?.qty || 0} shares of ${sym}`);
    const px = type === 'LIMIT' ? Number(limit) : p;
    if (type === 'LIMIT' && !(px > 0)) throw new Error('Enter a valid limit price');
    if (side === 'BUY' && qty * px > c) throw new Error('Insufficient funds');
    const order = { id: uid().toUpperCase(), side, sym, qty, type, limit: type === 'LIMIT' ? px : null, price: p, at: Date.now() };
    if (type === 'MARKET') { applyFill(side, sym, qty, p); setOrders((o) => [{ ...order, status: 'FILLED', fillPrice: p, filledAt: Date.now() }, ...o]); }
    else { if (side === 'BUY') setCash((cc) => cc - qty * px); setOrders((o) => [{ ...order, status: 'OPEN' }, ...o]); }
    return order;
  }, [applyFill, setOrders, setCash]);

  const cancelOrder = useCallback((id) => {
    setOrders((os) => os.map((o) => { if (o.id !== id || o.status !== 'OPEN') return o; if (o.side === 'BUY') setCash((c) => c + o.qty * o.limit); return { ...o, status: 'CANCELLED' }; }));
  }, [setOrders, setCash]);

  const resetAccount = () => { setCash(1000000); setHoldings({}); setOrders([]); setEquity([]); };
  const holdingsValue = Object.entries(holdings).reduce((a, [s, x]) => a + x.qty * quotes[s].price, 0);
  const invested = Object.values(holdings).reduce((a, x) => a + x.qty * x.avg, 0);
  const dayPnl = Object.entries(holdings).reduce((a, [s, x]) => a + x.qty * (quotes[s].price - quotes[s].prevClose), 0);
  const idx = (w) => STOCKS.reduce((a, s) => a + (quotes[s.sym].price / quotes[s.sym].prevClose) * w, 0) / STOCKS.length;
  const nifty = 24350 * idx(1), sensex = 80120 * idx(1);

  return (
    <Ctx.Provider value={{ quotes, running, setRunning, cash, holdings, orders, watch, setWatch, priceAlerts, setPriceAlerts, equity, placeOrder, cancelOrder, resetAccount,
      holdingsValue, invested, dayPnl, nifty, sensex, netWorth: cash + holdingsValue }}>
      {children}
    </Ctx.Provider>
  );
}

export const chg = (q) => ((q.price - q.prevClose) / q.prevClose) * 100;
export const px = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const meta = (sym) => STOCKS.find((s) => s.sym === sym);
