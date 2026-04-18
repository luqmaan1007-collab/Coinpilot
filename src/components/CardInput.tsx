import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface CardData { number: string; name: string; expiry: string; cvc: string; valid: boolean; }
interface CardInputProps { onCardChange: (card: CardData) => void; }

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function getCardType(number: string) {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'generic';
}

export default function CardInput({ onCardChange }: CardInputProps) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [focused, setFocused] = useState('');

  const notify = (n: string, nm: string, e: string, c: string) => {
    const valid = n.replace(/\s/g, '').length === 16 && nm.length > 0 && e.length === 5 && c.length >= 3;
    onCardChange({ number: n, name: nm, expiry: e, cvc: c, valid });
  };

  const isValid = number.replace(/\s/g, '').length === 16 && name.length > 0 && expiry.length === 5 && cvc.length >= 3;
  const cardType = getCardType(number);

  return (
    <div className="card-input-container">
      <div className={`card-preview ${focused ? 'card-focused' : ''}`}>
        <div className="card-preview-top">
          <div className="card-chip"></div>
          <div className="card-brand">
            {cardType === 'visa' && <span className="brand-visa">VISA</span>}
            {cardType === 'mastercard' && <div className="mc-circles"><div className="mc-circle mc-red"></div><div className="mc-circle mc-orange"></div></div>}
            {cardType === 'amex' && <span className="brand-amex">AMEX</span>}
            {cardType === 'generic' && <CreditCard size={24} color="white" />}
          </div>
        </div>
        <div className="card-preview-number">{number || '•••• •••• •••• ••••'}</div>
        <div className="card-preview-bottom">
          <div><div className="card-preview-label">Card Holder</div><div className="card-preview-value">{name || 'YOUR NAME'}</div></div>
          <div><div className="card-preview-label">Expires</div><div className="card-preview-value">{expiry || 'MM/YY'}</div></div>
          <div><div className="card-preview-label">CVC</div><div className="card-preview-value">{focused === 'cvc' ? cvc || '•••' : '•••'}</div></div>
        </div>
      </div>
      <div className="card-fields">
        <div className="form-group">
          <label>Card Number</label>
          <div className="input-with-icon">
            <input type="text" value={number}
              onChange={e => { const v = formatCardNumber(e.target.value); setNumber(v); notify(v, name, expiry, cvc); }}
              onFocus={() => setFocused('number')} onBlur={() => setFocused('')}
              placeholder="1234 5678 9012 3456" maxLength={19} />
            <CreditCard size={16} className="input-icon" />
          </div>
        </div>
        <div className="form-group">
          <label>Card Holder Name</label>
          <input type="text" value={name}
            onChange={e => { const v = e.target.value.toUpperCase(); setName(v); notify(number, v, expiry, cvc); }}
            onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
            placeholder="JOHN DOE" />
        </div>
        <div className="card-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input type="text" value={expiry}
              onChange={e => { const v = formatExpiry(e.target.value); setExpiry(v); notify(number, name, v, cvc); }}
              onFocus={() => setFocused('expiry')} onBlur={() => setFocused('')}
              placeholder="MM/YY" maxLength={5} />
          </div>
          <div className="form-group">
            <label>CVC</label>
            <div className="input-with-icon">
              <input type="password" value={cvc}
                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCvc(v); notify(number, name, expiry, v); }}
                onFocus={() => setFocused('cvc')} onBlur={() => setFocused('')}
                placeholder="•••" maxLength={4} />
              <Lock size={14} className="input-icon" />
            </div>
          </div>
        </div>
      </div>
      <div className={`card-valid-indicator ${isValid ? 'valid' : ''}`}>
        {isValid && <><Lock size={12} /> Card verified</>}
      </div>
    </div>
  );
}
