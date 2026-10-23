import { CandlestickChart, LayoutDashboard, LineChart, ArrowLeftRight, Briefcase, ClipboardList, Star, ShieldCheck, Zap, BarChart3, BellRing, Trophy } from 'lucide-react';
import createApp from './core/createApp.jsx';
import { MarketProvider } from './lib/market.jsx';
import './lib/tradex.css';
import Dashboard from './pages/Dashboard.jsx';
import Markets from './pages/Markets.jsx';
import Trade from './pages/Trade.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Orders from './pages/Orders.jsx';
import Watchlist from './pages/Watchlist.jsx';

export default createApp({
  name: 'TradeX',
  storageKey: 'tradex',
  logo: CandlestickChart,
  accent: ['#10b981', '#0d9488'],
  defaultTheme: 'dark',
  github: 'https://github.com/PreciousBharath/TRADEX-STOCK-TRADING-SIMULATOR',
  stack: 'Live tick engine · SVG candlesticks',
  Provider: MarketProvider,
  heroTitle: 'Learn to trade the Indian market — risk-free, in real time.',
  heroText: 'Start with ₹10,00,000 of virtual cash. Watch live-simulated NSE ticks, read candlesticks with SMA, EMA & RSI, place market or limit orders and track every rupee of P&L.',
  heroFeatures: [
    [Zap, 'Live tick engine', '20 NIFTY stocks update every second'],
    [BarChart3, 'Pro charting', 'Candles, volume, SMA 20, EMA 9, RSI 14, order book'],
    [ShieldCheck, 'Zero risk', 'Paper trading with brokerage & charge estimates'],
  ],
  heroStats: [['₹10L', 'virtual cash'], ['20', 'NSE stocks'], ['1s', 'tick speed']],
  registerText: 'Get ₹10,00,000 virtual cash to start paper trading',
  roles: ['Beginner', 'Investor', 'Swing trader', 'Student', 'Analyst'],
  demo: { name: 'Bharath Kumar', email: 'demo@tradex.app', password: 'Demo@1234', role: 'Swing trader' },
  promo: ['🏆 Trading challenge', 'Beat NIFTY 50 this week with your virtual portfolio.'],
  notifications: [
    [Trophy, 'You are in the top 10%', 'Your returns beat 90% of traders'],
    [BellRing, 'Limit orders are live', 'They fill automatically when price crosses'],
    [LineChart, 'New indicator: RSI 14', 'Spot overbought & oversold zones'],
  ],
  nav: [
    { section: 'Trading', items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, page: Dashboard },
      { to: '/markets', label: 'Markets', icon: LineChart, page: Markets },
      { to: '/trade', label: 'Trade', icon: ArrowLeftRight, page: Trade, tag: 'Live' },
    ] },
    { section: 'My account', items: [
      { to: '/portfolio', label: 'Portfolio', icon: Briefcase, page: Portfolio },
      { to: '/orders', label: 'Orders', icon: ClipboardList, page: Orders },
      { to: '/watchlist', label: 'Watchlist & alerts', icon: Star, page: Watchlist },
    ] },
  ],
});
