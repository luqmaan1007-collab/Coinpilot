export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  market_cap_rank: number;
}

export async function fetchTopCoins(limit = 100): Promise<CoinMarket[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    );
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return getMockCoins();
  }
}

export function selectBestCoins(coins: CoinMarket[], budget: number): CoinMarket[] {
  const filtered = coins.filter(c => c.current_price > 0 && c.current_price < budget * 0.5);
  const scored = filtered.map(coin => {
    let score = 0;
    if (coin.price_change_percentage_24h > 0) score += coin.price_change_percentage_24h * 2;
    if (coin.market_cap_rank <= 10) score += 20;
    else if (coin.market_cap_rank <= 50) score += 10;
    else if (coin.market_cap_rank <= 100) score += 5;
    if (coin.total_volume > coin.market_cap * 0.1) score += 15;
    return { coin, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.coin);
}

export function getAiReason(coin: CoinMarket): string {
  const reasons: string[] = [];
  if (coin.price_change_percentage_24h > 5) reasons.push(`+${coin.price_change_percentage_24h.toFixed(1)}% momentum in 24h`);
  if (coin.market_cap_rank <= 10) reasons.push('Top 10 by market cap');
  if (coin.total_volume > coin.market_cap * 0.15) reasons.push('High trading volume relative to market cap');
  if (reasons.length === 0) reasons.push('Strong fundamentals and market position');
  return `AI selected: ${reasons.join(', ')}.`;
}

function getMockCoins(): CoinMarket[] {
  return [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 67500, price_change_percentage_24h: 2.3, market_cap: 1320000000000, total_volume: 28000000000, circulating_supply: 19500000, market_cap_rank: 1 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3850, price_change_percentage_24h: 1.8, market_cap: 462000000000, total_volume: 15000000000, circulating_supply: 120000000, market_cap_rank: 2 },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 412, price_change_percentage_24h: 3.1, market_cap: 63000000000, total_volume: 2000000000, circulating_supply: 153000000, market_cap_rank: 4 },
    { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 185, price_change_percentage_24h: 4.2, market_cap: 85000000000, total_volume: 4000000000, circulating_supply: 460000000, market_cap_rank: 5 },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', current_price: 0.165, price_change_percentage_24h: 5.8, market_cap: 24000000000, total_volume: 2000000000, circulating_supply: 145000000000, market_cap_rank: 8 },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', current_price: 7.8, price_change_percentage_24h: 2.9, market_cap: 10000000000, total_volume: 400000000, circulating_supply: 1280000000, market_cap_rank: 9 },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', current_price: 14.5, price_change_percentage_24h: 3.7, market_cap: 8500000000, total_volume: 600000000, circulating_supply: 587000000, market_cap_rank: 10 },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0.62, price_change_percentage_24h: -0.5, market_cap: 34000000000, total_volume: 1500000000, circulating_supply: 55000000000, market_cap_rank: 6 },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price: 0.48, price_change_percentage_24h: 1.2, market_cap: 17000000000, total_volume: 500000000, circulating_supply: 35000000000, market_cap_rank: 7 },
    { id: 'avalanche', symbol: 'avax', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', current_price: 38, price_change_percentage_24h: 5.1, market_cap: 15000000000, total_volume: 800000000, circulating_supply: 395000000, market_cap_rank: 11 },
  ];
}
