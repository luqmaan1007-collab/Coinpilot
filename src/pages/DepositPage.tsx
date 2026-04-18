import { useState } from 'react';
import { CheckCircle, Loader2, Shield } from 'lucide-react';
import CardInput from '../components/CardInput';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

const PRESETS = [50, 100, 250, 500, 1000, 2500];
const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

type CardData = { number: string; name: string; expiry: string; cvc: string; valid: boolean; };

export default function DepositPage() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile(user?.id);
  const [amount, setAmount] = useState('');
  const [card, setCard] = useState<CardData>({ number: '', name: '', expiry: '', cvc: '', valid: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { setError('Minimum deposit is $10'); return; }
    if (!card.valid) { setError('Please enter valid card details'); return; }
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'Apikey': supabaseKey },
        body: JSON.stringify({ type: 'deposit', amount: amt, card: { last4: card.number.slice(-4), expiry: card.expiry }, userId: user?.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Payment failed');
      const newBalance = (profile?.balance_usd ?? 0) + amt;
      await supabase.from('profiles').update({ balance_usd: newBalance }).eq('id', user!.id);
      await supabase.from('transactions').insert({ user_id: user!.id, type: 'deposit', amount_usd: amt, status: 'completed' });
      await refetch();
      setSuccess(true);
      setAmount('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="page">
      <div className="success-screen">
        <div className="success-icon"><CheckCircle size={56} /></div>
        <h2>Deposit Successful!</h2>
        <p>Your funds have been added to your account.</p>
        <p className="success-balance">New balance: <strong>{fmtUSD(profile?.balance_usd ?? 0)}</strong></p>
        <button className="btn-primary" onClick={() => setSuccess(false)}>Make Another Deposit</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header"><div><h2>Deposit Funds</h2><p>Add money to your CoinPilot account</p></div></div>
      <div className="payment-layout">
        <div className="payment-form-card">
          <form onSubmit={handleDeposit}>
            <div className="section-title">Choose Amount</div>
            <div className="preset-amounts">
              {PRESETS.map(a => (
                <button key={a} type="button" className={`preset-btn ${amount === String(a) ? 'active' : ''}`} onClick={() => setAmount(String(a))}>{fmtUSD(a)}</button>
              ))}
            </div>
            <div className="form-group">
              <label>Custom Amount (USD)</label>
              <div className="input-with-prefix">
                <span className="input-prefix">$</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="10" step="0.01" />
              </div>
            </div>
            <div className="section-title">Payment Details</div>
            <CardInput onCardChange={setCard} />
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn-primary btn-full btn-large" disabled={loading || !card.valid || !amount}>
              {loading ? <><Loader2 size={18} className="spin" /> Processing...</> : <>Deposit {amount ? fmtUSD(parseFloat(amount) || 0) : 'Funds'}</>}
            </button>
          </form>
        </div>
        <div className="payment-info-card">
          <div className="info-section"><Shield size={24} /><h4>Secure Payment</h4><p>Your card details are encrypted with 256-bit SSL. We never store your full card number.</p></div>
          <div className="balance-info"><span>Current Balance</span><strong>{fmtUSD(profile?.balance_usd ?? 0)}</strong></div>
          {amount && parseFloat(amount) > 0 && (
            <div className="balance-info highlight"><span>After Deposit</span><strong>{fmtUSD((profile?.balance_usd ?? 0) + parseFloat(amount))}</strong></div>
          )}
          <div className="info-limits">
            <div className="limit-row"><span>Minimum</span><span>$10.00</span></div>
            <div className="limit-row"><span>Maximum</span><span>$50,000.00</span></div>
            <div className="limit-row"><span>Processing</span><span>Instant</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
