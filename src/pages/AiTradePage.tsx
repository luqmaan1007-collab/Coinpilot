import { useState, useEffect } from 'react';
import { Bot, Zap, TrendingUp, CheckCircle, Loader2, AlertCircle, Power } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { fetchTopCoins, selectBestCoins, getAiReason } from '../lib/crypto';
import type { CoinMarket } from '../lib/crypto';

type AiTrade = { id: string; coin_symbol: string; coin_name: string; coin_image: string | null; amount_usd: number; coin_amount: number; price_at_buy: number; ai_reason: string | null; created_at: string; };

const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const AI_INVEST_PERCENT = 0.25;

export default function AiTradePage() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile(user?.id);
  const [aiTrades, setAiTrades] = useState<AiTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<CoinMarket[]>([]);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const aiActive = profile?.ai_mode_enabled ?? false;
  const balance = profile?.balance_usd ?? 0;

  useEffect(() => {
    if (!user) return;
    supabase.from('ai_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(res => { setAiTrades((res.data ?? []) as AiTrade[]); setLoading(false); });
  }, [user, tick]);

  const handleToggleAi = async () => {
    if (!user || !profile) return;
    setError('');
    const newState = !aiActive;
    if (newState && balance < 10) { setError('You need at least $10 to activate AI mode. Please deposit funds first.'); return; }
    setActivating(true);
    await supabase.from('profiles').update({ ai_mode_enabled: newState }).eq('id', user.id);
    await refetch();
    if (newState) await runAiAnalysis();
    setActivating(false);
  };

  const runAiAnalysis = async () => {
    if (!user) return;
    setAnalyzing(true);
    setError('');
    try {
      const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const currentBalance = (currentProfile as { balance_usd?: number } | null)?.balance_usd ?? 0;
      if (currentBalance < 10) { setError('Insufficient balance for AI trading.'); setAnalyzing(false); return; }
      await new Promise(r => setTimeout(r, 2000));
      const freshCoins = await fetchTopCoins(100);
      const best = selectBestCoins(freshCoins, currentBalance);
      setSelectedCoins(best);
      if (best.length === 0) { setError('AI could not find suitable coins at this time.'); setAnalyzing(false); return; }
      const investPerCoin = (currentBalance * AI_INVEST_PERCENT) / best.length;
      let totalSpent = 0;
      for (const coin of best) {
        if (investPerCoin < 1) break;
        const coinAmount = investPerCoin / coin.current_price;
        const reason = getAiReason(coin);
        await supabase.from('ai_trades').insert({ user_id: user.id, coin_symbol: coin.symbol, coin_name: coin.name, coin_image: coin.image, amount_usd: investPerCoin, coin_amount: coinAmount, price_at_buy: coin.current_price, ai_reason: reason });
        await supabase.from('transactions').insert({ user_id: user.id, type: 'buy', amount_usd: investPerCoin, coin_symbol: coin.symbol, coin_name: coin.name, coin_amount: coinAmount, coin_price_usd: coin.current_price, status: 'completed' });
        const { data: existing } = await supabase.from('portfolio').select('*').eq('user_id', user.id).eq('coin_symbol', coin.symbol).maybeSingle();
        if (existing) {
          const ex = existing as { id: string; amount: number; avg_buy_price: number };
          const newAmount = ex.amount + coinAmount;
          const newAvg = (ex.avg_buy_price * ex.amount + coin.current_price * coinAmount) / newAmount;
          await supabase.from('portfolio').update({ amount: newAmount, avg_buy_price: newAvg, current_price: coin.current_price, coin_image: coin.image, updated_at: new Date().toISOString() }).eq('id', ex.id);
        } else {
          await supabase.from('portfolio').insert({ user_id: user.id, coin_symbol: coin.symbol, coin_name: coin.name, coin_image: coin.image, amount: coinAmount, avg_buy_price: coin.current_price, current_price: coin.current_price });
        }
        totalSpent += investPerCoin;
      }
      await supabase.from('profiles').update({ balance_usd: currentBalance - totalSpent }).eq('id', user.id);
      await refetch();
      setTick(t => t + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI trading failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /></div>;

  return (
    <div className="page">
      <div className="page-header"><div><h2>AI Trade</h2><p>Let AI analyse all coins and invest for you</p></div></div>

      <div className="ai-hero">
        <div className="ai-hero-content">
          <div className={`ai-orb ${aiActive ? 'active' : ''} ${analyzing ? 'analyzing' : ''}`}>
            <Bot size={40} />
            {analyzing && <div className="ai-orb-ring"></div>}
          </div>
          <div className="ai-hero-text">
            <h3>CoinPilot AI</h3>
            <p>{analyzing ? 'Analysing all blockchains and finding the best opportunities...' : aiActive ? 'AI mode is active. Your portfolio is being optimised.' : 'AI will scan hundreds of coins across all blockchains and automatically buy the best ones based on momentum, volume, and market position.'}</p>
          </div>
        </div>

        <div className="ai-stats">
          <div className="ai-stat"><span>Available Balance</span><strong>{fmtUSD(balance)}</strong></div>
          <div className="ai-stat"><span>AI Will Invest</span><strong>{fmtUSD(balance * AI_INVEST_PERCENT)}</strong></div>
          <div className="ai-stat"><span>Strategy</span><strong>Multi-coin {(AI_INVEST_PERCENT * 100).toFixed(0)}% per run</strong></div>
        </div>

        {error && <div className="alert alert-error"><AlertCircle size={16} /><span>{error}</span></div>}

        <div className="ai-buttons">
          <button className={`ai-toggle-btn ${aiActive ? 'active' : ''}`} onClick={handleToggleAi} disabled={activating || analyzing}>
            {activating || analyzing ? <Loader2 size={20} className="spin" /> : <Power size={20} />}
            {analyzing ? 'AI Analysing...' : aiActive ? 'Deactivate AI Mode' : 'Activate AI Mode'}
          </button>
          {aiActive && !analyzing && (
            <button className="ai-run-btn" onClick={runAiAnalysis} disabled={analyzing || balance < 10}>
              <Zap size={18} />Run AI Now
            </button>
          )}
        </div>

        {analyzing && (
          <div className="ai-analysis-steps">
            <div className="analysis-step done"><CheckCircle size={14} /> Connecting to all blockchain networks</div>
            <div className="analysis-step done"><CheckCircle size={14} /> Fetching live prices for 100+ coins</div>
            <div className="analysis-step active"><Loader2 size={14} className="spin" /> Scoring coins by momentum &amp; volume</div>
            <div className="analysis-step"><div className="step-dot" /> Executing optimal buy orders</div>
          </div>
        )}

        {selectedCoins.length > 0 && !analyzing && (
          <div className="selected-coins">
            <h4>AI Selected Coins</h4>
            <div className="selected-coins-grid">
              {selectedCoins.map(c => (
                <div key={c.id} className="selected-coin-card">
                  <img src={c.image} alt={c.name} className="coin-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div>
                    <div className="coin-name">{c.name}</div>
                    <div className={`coin-change ${c.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>{c.price_change_percentage_24h >= 0 ? '+' : ''}{c.price_change_percentage_24h.toFixed(2)}%</div>
                  </div>
                  <div className="coin-price">{fmtUSD(c.current_price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h3>AI Trade History</h3><TrendingUp size={18} /></div>
        {aiTrades.length === 0 ? (
          <div className="empty-state"><Bot size={32} /><p>No AI trades yet. Activate AI Mode to start.</p></div>
        ) : (
          <div className="ai-trades-list">
            {aiTrades.map(trade => (
              <div key={trade.id} className="ai-trade-item">
                <img src={trade.coin_image ?? ''} alt={trade.coin_name} className="coin-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="trade-info">
                  <div className="trade-coin">{trade.coin_name} <span>{trade.coin_symbol.toUpperCase()}</span></div>
                  <div className="trade-reason">{trade.ai_reason}</div>
                  <div className="trade-date">{fmtDate(trade.created_at)}</div>
                </div>
                <div className="trade-amounts">
                  <div className="trade-usd">{fmtUSD(trade.amount_usd)}</div>
                  <div className="trade-coins">{trade.coin_amount.toFixed(6)} {trade.coin_symbol.toUpperCase()}</div>
                  <div className="trade-price">@ {fmtUSD(trade.price_at_buy)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
