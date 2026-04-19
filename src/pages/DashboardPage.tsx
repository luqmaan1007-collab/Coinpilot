import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import { TrendingUp, TrendingDown, DollarSign, Bot, CreditCard, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { fetchTopCoins } from '../lib/crypto';
import type { CoinMarket } from '../lib/crypto';

type Transaction = { id: string; type: string; amount_usd: number; coin_symbol: string | null; created_at: string; };
type PortfolioItem = { id: string; coin_symbol: string; coin_name: string; coin_image: string | null; amount: number; avg_buy_price: number; current_price: number; };

const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('portfolio').select('*').eq('user_id', user.id).order('amount', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      fetchTopCoins(20),
    ]).then(([pRes, txRes, coinsData]) => {
      setPortfolio((pRes.data ?? []) as PortfolioItem[]);
      setTransactions((txRes.data ?? []) as Transaction[]);
      setCoins(coinsData);
      setLoading(false);
    });
  }, [user]);

  const totalPortfolioValue = portfolio.reduce((sum, item) => {
    const coin = coins.find(c => c.symbol.toLowerCase() === item.coin_symbol.toLowerCase());
    return sum + item.amount * (coin?.current_price ?? item.current_price);
  }, 0);

  const totalValue = (profile?.balance_usd ?? 0) + totalPortfolioValue;

  if (profileLoading || loading) return <div className="page-loading"><Loader2 size={32} className="spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Dashboard</h2><p>Welcome back, {profile?.full_name || user?.email?.split('@')[0]}</p></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-content"><span className="stat-label">Total Value</span><span className="stat-value">{fmtUSD(totalValue)}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-content"><span className="stat-label">Cash Balance</span><span className="stat-value">{fmtUSD(profile?.balance_usd ?? 0)}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-content"><span className="stat-label">Portfolio Value</span><span className="stat-value">{fmtUSD(totalPortfolioValue)}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Bot size={22} /></div>
          <div className="stat-content">
            <span className="stat-label">AI Mode</span>
            <span className={`stat-badge ${profile?.ai_mode_enabled ? 'badge-active' : 'badge-inactive'}`}>
              {profile?.ai_mode_enabled ? 'Active' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/deposit" className="quick-btn"><CreditCard size={18} />Deposit</Link>
        <Link to="/withdraw" className="quick-btn"><ArrowUpFromLine size={18} />Withdraw</Link>
        <Link to="/ai-trade" className="quick-btn accent"><Bot size={18} />AI Trade</Link>
        <Link to="/markets" className="quick-btn"><TrendingUp size={18} />Markets</Link>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>My Portfolio</h3></div>
          {portfolio.length === 0 ? (
            <div className="empty-state"><Bot size={32} /><p>No coins yet. Activate AI Trade to start!</p><Link to="/ai-trade" className="btn-primary">Start AI Trading</Link></div>
          ) : (
            <div className="portfolio-list">
              {portfolio.map(item => {
                const coin = coins.find(c => c.symbol.toLowerCase() === item.coin_symbol.toLowerCase());
                const price = coin?.current_price ?? item.current_price;
                const value = item.amount * price;
                const pnl = (price - item.avg_buy_price) / item.avg_buy_price * 100;
                return (
                  <div key={item.id} className="portfolio-item">
                    <img src={item.coin_image ?? ''} alt={item.coin_name} className="coin-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="portfolio-info">
                      <span className="coin-name">{item.coin_name}</span>
                      <span className="coin-amount">{item.amount.toFixed(6)} {item.coin_symbol.toUpperCase()}</span>
                    </div>
                    <div className="portfolio-value">
                      <span className="value">{fmtUSD(value)}</span>
                      <span className={`pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                        {pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{pnl.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Transactions</h3></div>
          {transactions.length === 0 ? (
            <div className="empty-state"><DollarSign size={32} /><p>No transactions yet.</p></div>
          ) : (
            <div className="tx-list">
              {transactions.map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className={`tx-icon tx-${tx.type}`}>
                    {tx.type === 'deposit' && <CreditCard size={14} />}
                    {tx.type === 'withdrawal' && <ArrowUpFromLine size={14} />}
                    {(tx.type === 'buy' || tx.type === 'sell') && <TrendingUp size={14} />}
                  </div>
                  <div className="tx-info">
                    <span className="tx-type">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}{tx.coin_symbol ? ` ${tx.coin_symbol.toUpperCase()}` : ''}</span>
                    <span className="tx-date">{fmtDate(tx.created_at)}</span>
                  </div>
                  <span className={`tx-amount ${tx.type === 'deposit' ? 'positive' : tx.type === 'withdrawal' ? 'negative' : ''}`}>
                    {tx.type === 'deposit' ? '+' : tx.type === 'withdrawal' ? '-' : ''}{fmtUSD(tx.amount_usd)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
