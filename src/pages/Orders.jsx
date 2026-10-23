import { useState } from 'react';
import { ClipboardList, X } from 'lucide-react';
import { useMarket, px } from '../lib/market.jsx';
import { Card, PageHead, Badge, Tabs, Empty } from '../core/ui.jsx';
import { useApp } from '../core/context.jsx';

export default function Orders() {
  const m = useMarket(); const { toast } = useApp();
  const [tab, setTab] = useState('ALL');
  const list = m.orders.filter((o) => tab === 'ALL' || o.status === tab);
  const count = (s) => m.orders.filter((o) => o.status === s).length;
  const kind = { FILLED: 'ok', OPEN: 'info', CANCELLED: 'mute' };
  return (
    <>
      <PageHead title="Orders" crumbs="TradeX / Orders" sub="Market orders execute instantly; limit orders fill automatically when the price crosses your limit">
        <Tabs value={tab} onChange={setTab} options={[{ id: 'ALL', label: `All (${m.orders.length})` }, { id: 'OPEN', label: `Open (${count('OPEN')})` }, { id: 'FILLED', label: `Executed (${count('FILLED')})` }, { id: 'CANCELLED', label: 'Cancelled' }]} />
      </PageHead>
      <Card className="fade-up">
        {!list.length ? <Empty icon={ClipboardList} title="No orders here" text="Place a market or limit order from the Trade page." /> : (
          <div className="table-wrap"><table className="tbl"><thead><tr><th>Order ID</th><th>Time</th><th>Side</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>LTP</th><th>Status</th><th></th></tr></thead>
            <tbody>{list.map((o) => (
              <tr key={o.id}><td className="mono small">#{o.id}</td><td className="small">{new Date(o.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                <td><Badge kind={o.side === 'BUY' ? 'ok' : 'bad'}>{o.side}</Badge></td><td className="bold">{o.sym}</td><td className="small">{o.type}</td><td className="mono">{o.qty}</td>
                <td className="mono">{px(o.fillPrice ?? o.limit)}</td><td className="mono muted">{px(m.quotes[o.sym].price)}</td><td><Badge kind={kind[o.status]}>{o.status}</Badge></td>
                <td>{o.status === 'OPEN' && <button className="btn btn-sm btn-danger" onClick={() => { m.cancelOrder(o.id); toast('Order cancelled', 'info'); }}><X size={14} /> Cancel</button>}</td></tr>))}</tbody></table></div>)}
      </Card>
    </>
  );
}
