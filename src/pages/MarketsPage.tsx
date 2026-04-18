import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Loader2, RefreshCw } from 'lucide-react';
import { fetchTopCoins } from '../lib/crypto';
import type { CoinMarket } from '../lib/crypto';

function fmtUSD(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtPrice(n: number) { return n >= 1 ? fmtUSD(n) : `$${n.toFixed(6)}`; }

export default function MarketsPage() {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadCoins = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchTopCoins(100);
    setCoins(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadCoins();
    const interval = setInterval(() => loadCoins(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Markets</h2><p>Live prices across all major blockchains</p></div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={() => loadCoins(true)}><RefreshCw size={16} /></button>
      </div>
      <div className="markets-search">
        <Search size={16} className="search-icon" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coins..." className="search-input" />
      </div>
      <div className="markets-table-wrapper">
        <table className="markets-table">
          <thead>
            <tr><th>#</th><th>Coin</th><th>Price</th><th>24h Change</th><th>Market Cap</th><th>Volume (24h)</th></tr>
          </thead>
          <tbody>
            {filtered.map(coin => (
              <tr key={coin.id} className="market-row">
                <td className="rank">{coin.market_cap_rank}</td>
                <td>
                  <div className="coin-cell">
                    <img src={coin.image} alt={coin.name} className="coin-img-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div><div className="coin-name-bold">{coin.name}</div><div className="coin-symbol">{coin.symbol.toUpperCase()}</div></div>
                  </div>
                </td>
                <td className="price">{fmtPrice(coin.current_price)}</td>
                <td>
                  <span className={`change-badge ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                    {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </td>
                <td className="muted">{fmtUSD(coin.market_cap)}</td>
                <td className="muted">{fmtUSD(coin.total_volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><Search size={32} /><p>No coins found for "{search}"</p></div>}
      </div>
    </div>
  );
}
