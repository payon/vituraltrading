// 거래 관련 타입 정의

export type AssetType = 'STOCK' | 'COIN';

export type OrderType = 'BUY' | 'SELL';

export type PriceType = 'MARKET' | 'LIMIT';

export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED';

export interface Stock {
  symbol: string;
  name: string;
  type: AssetType;
  market?: string;
  sector?: string;
  currentPrice: number;
  changeRate: number;
  changeAmount: number;
  volume: number;
  high52w?: number;
  low52w?: number;
  marketCap?: number;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  evaluation: number;
  investment: number;
  profit: number;
  profitRate: number;
  sector?: string;
  weight: number;
  changeRate: number;
}

export interface Order {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  orderType: OrderType;
  priceType: PriceType;
  price: number;
  quantity: number;
  status: OrderStatus;
  filledPrice?: number;
  filledQuantity?: number;
  filledAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  transactionType: OrderType;
  price: number;
  quantity: number;
  amount: number;
  fee: number;
  createdAt: string;
}

export interface Account {
  id: string;
  balance: number;
  totalAssets: number;
  evaluation: number;
  profit: number;
  realizedProfit?: number;
  profitRate: number;
  initialBalance?: number;
  stockCount?: number;
  coinCount?: number;
}

export interface ChartDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DailySummary {
  date: string;
  buy: number;
  sell: number;
  count: number;
}

// 색상 상수
export const COLORS = {
  RISE: 'rgb(255, 82, 82)',    // 상승: 빨강
  FALL: 'rgb(39, 125, 255)',   // 하락: 파랑
  FLAT: 'rgb(128, 128, 128)',  // 보합: 회색
} as const;

// 수수료 계산
export function calculateFee(amount: number, type: AssetType): number {
  if (type === 'COIN') {
    return Math.floor(amount * 0.0005); // 업비트 수수료 0.05%
  }
  return Math.floor(amount * 0.00015); // 주식 수수료 0.015%
}

// 가격 포맷팅
export function formatPrice(price: number, type: AssetType = 'STOCK'): string {
  if (type === 'COIN' && price < 100) {
    return price.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }
  return Math.floor(price).toLocaleString('ko-KR');
}

// 수익률 포맷팅
export function formatRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(2)}%`;
}

// 색상 결정
export function getPriceColor(rate: number): string {
  if (rate > 0) return COLORS.RISE;
  if (rate < 0) return COLORS.FALL;
  return COLORS.FLAT;
}
