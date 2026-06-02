/**
 * Upbit API Service
 * 업비트 Open API 연동 서비스
 * 
 * API Documentation: https://docs.upbit.com/
 */

import crypto from 'crypto';

// Types for Upbit API responses
interface UpbitMarket {
  market: string;           // 마켓 코드 (ex. KRW-BTC)
  korean_name: string;      // 한글 이름
  english_name: string;     // 영어 이름
  market_warning: 'NONE' | 'CAUTION';  // 유의 종목 여부
}

interface UpbitTicker {
  market: string;           // 마켓 코드
  trade_date: string;       // 최근 거래 일자(UTC)
  trade_time: string;       // 최근 거래 시각(UTC)
  trade_date_kst: string;   // 최근 거래 일자(KST)
  trade_time_kst: string;   // 최근 거래 시각(KST)
  trade_timestamp: number;  // 최근 거래 일시(UTC)
  opening_price: number;    // 시가
  high_price: number;       // 고가
  low_price: number;        // 저가
  trade_price: number;      // 종가(현재가)
  prev_closing_price: number;  // 전일 종가
  change: 'RISE' | 'FALL' | 'EVEN';  // 전일 대비
  change_price: number;     // 전일 대비 값
  change_rate: number;      // 전일 대비 부호 있는 비율
  signed_change_price: number;  // 전일 대비 값(부호 화)
  signed_change_rate: number;   // 전일 대비 부호 있는 비율
  trade_volume: number;     // 가장 최근 거래량
  acc_trade_price: number;  // 누적 거래대금(UTC 0시 기준)
  acc_trade_price_24h: number;  // 24시간 누적 거래대금
  acc_trade_volume: number; // 누적 거래량(UTC 0시 기준)
  acc_trade_volume_24h: number; // 24시간 누적 거래량
  highest_52_week_price: number;  // 52주 신고가
  highest_52_week_date: string;   // 52주 신고가 달성일
  lowest_52_week_price: number;   // 52주 신저가
  lowest_52_week_date: string;    // 52주 신저가 달성일
  timestamp: number;        // 타임스탬프
}

interface UpbitCandle {
  market: string;           // 마켓 코드
  candle_date_time_utc: string;  // 캔들 기준 시각(UTC)
  candle_date_time_kst: string;  // 캔들 기준 시각(KST)
  opening_price: number;    // 시가
  high_price: number;       // 고가
  low_price: number;        // 저가
  trade_price: number;      // 종가
  timestamp: number;        // 마지막 틱이 저장된 시각
  candle_acc_trade_price: number;  // 누적 거래 금액
  candle_acc_trade_volume: number; // 누적 거래량
  unit?: number;            // 분 단위(분봉인 경우)
}

// Export types for our application
export interface CoinQuote {
  symbol: string;
  name: string;
  englishName: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  sign: 'RISE' | 'FALL' | 'EVEN';
  volume: number;
  tradeValue24h: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  high52w: number;
  low52w: number;
  timestamp: Date;
  warning: boolean;
}

export interface CoinChartData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 메이저 코인 순서 (우선 표시)
const MAJOR_COINS = [
  'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE', 
  'KRW-ADA', 'KRW-AVAX', 'KRW-DOT', 'KRW-LINK', 'KRW-MATIC',
  'KRW-TRX', 'KRW-SUI', 'KRW-SEI', 'KRW-APT', 'KRW-ARB',
  'KRW-OP', 'KRW-ATOM', 'KRW-NEAR', 'KRW-FIL', 'KRW-INJ'
];

class UpbitService {
  private accessKey: string;
  private secretKey: string;
  private baseUrl: string = 'https://api.upbit.com/v1';

  constructor() {
    this.accessKey = process.env.UPBIT_ACCESS_KEY || '';
    this.secretKey = process.env.UPBIT_SECRET_KEY || '';
  }

  /**
   * Check if Upbit API is configured
   * 공개 API는 인증 없이도 사용 가능하므로 항상 true 반환
   */
  isConfigured(): boolean {
    return true; // 공개 API는 인증 없이 사용 가능
  }
  
  /**
   * Check if authenticated API is available (for private endpoints)
   */
  isAuthenticated(): boolean {
    return !!(this.accessKey && this.secretKey);
  }

  /**
   * Generate JWT token for authenticated requests
   */
  private generateToken(queryString?: string): string {
    if (!this.isAuthenticated()) {
      throw new Error('Upbit API credentials not configured');
    }

    const payload: {
      access_key: string;
      nonce: string;
      query?: string;
    } = {
      access_key: this.accessKey,
      nonce: Date.now().toString(),
    };

    if (queryString) {
      const hash = crypto
        .createHash('sha512')
        .update(queryString)
        .digest('hex');
      payload.query_hash = hash;
      payload.query_hash_alg = 'SHA512';
    }

    // Simple JWT generation (header.payload.signature)
    // In production, use a proper JWT library
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Make public API request (no authentication needed)
   */
  private async makePublicRequest<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upbit API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Make private API request (authentication needed)
   */
  private async makePrivateRequest<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const queryString = params
      ? Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
      : '';

    const token = this.generateToken(queryString);
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upbit API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get all market codes
   */
  async getMarkets(): Promise<UpbitMarket[]> {
    return this.makePublicRequest<UpbitMarket[]>('/market/all', {
      isDetails: 'true',
    });
  }

  /**
   * Get KRW market coins only
   */
  async getKRWCoinMarkets(): Promise<UpbitMarket[]> {
    const markets = await this.getMarkets();
    return markets.filter((m) => m.market.startsWith('KRW-'));
  }

  /**
   * Get ticker information (current prices)
   */
  async getTickers(markets: string[]): Promise<UpbitTicker[]> {
    if (markets.length === 0) return [];
    return this.makePublicRequest<UpbitTicker[]>('/ticker', {
      markets: markets.join(','),
    });
  }

  /**
   * Get single coin price
   */
  async getCoinPrice(symbol: string): Promise<CoinQuote> {
    // Ensure symbol has KRW- prefix
    const marketCode = symbol.includes('-') ? symbol : `KRW-${symbol}`;
    
    const tickers = await this.getTickers([marketCode]);
    if (tickers.length === 0) {
      throw new Error(`Coin not found: ${symbol}`);
    }

    const ticker = tickers[0];
    const markets = await this.getMarkets();
    const marketInfo = markets.find((m) => m.market === marketCode);

    return {
      symbol: ticker.market,
      name: marketInfo?.korean_name || ticker.market,
      englishName: marketInfo?.english_name || ticker.market,
      currentPrice: ticker.trade_price,
      changeAmount: ticker.signed_change_price,
      changeRate: ticker.signed_change_rate * 100,
      sign: ticker.change,
      volume: ticker.acc_trade_volume_24h,
      tradeValue24h: ticker.acc_trade_price_24h,
      openPrice: ticker.opening_price,
      highPrice: ticker.high_price,
      lowPrice: ticker.low_price,
      previousClose: ticker.prev_closing_price,
      high52w: ticker.highest_52_week_price,
      low52w: ticker.lowest_52_week_price,
      timestamp: new Date(ticker.timestamp),
      warning: marketInfo?.market_warning === 'CAUTION',
    };
  }

  /**
   * Get multiple coin prices
   */
  async getCoinPrices(symbols: string[]): Promise<CoinQuote[]> {
    if (symbols.length === 0) return [];
    
    // Ensure all symbols have KRW- prefix
    const marketCodes = symbols.map((s) => (s.includes('-') ? s : `KRW-${s}`));
    
    const [tickers, markets] = await Promise.all([
      this.getTickers(marketCodes),
      this.getMarkets(),
    ]);

    return tickers.map((ticker) => {
      const marketInfo = markets.find((m) => m.market === ticker.market);
      return {
        symbol: ticker.market,
        name: marketInfo?.korean_name || ticker.market,
        englishName: marketInfo?.english_name || ticker.market,
        currentPrice: ticker.trade_price,
        changeAmount: ticker.signed_change_price,
        changeRate: ticker.signed_change_rate * 100,
        sign: ticker.change,
        volume: ticker.acc_trade_volume_24h,
        tradeValue24h: ticker.acc_trade_price_24h,
        openPrice: ticker.opening_price,
        highPrice: ticker.high_price,
        lowPrice: ticker.low_price,
        previousClose: ticker.prev_closing_price,
        high52w: ticker.highest_52_week_price,
        low52w: ticker.lowest_52_week_price,
        timestamp: new Date(ticker.timestamp),
        warning: marketInfo?.market_warning === 'CAUTION',
      };
    });
  }

  /**
   * Get all KRW coins with prices (sorted by major coins first, then by volume)
   */
  async getAllKRWCoinPrices(): Promise<CoinQuote[]> {
    const markets = await this.getKRWCoinMarkets();
    const marketCodes = markets.map((m) => m.market);
    const quotes = await this.getCoinPrices(marketCodes);
    
    // 정렬: 메이저 코인 먼저, 그 다음 거래대금 순
    const sortedQuotes = quotes.sort((a, b) => {
      const aMajorIndex = MAJOR_COINS.indexOf(a.symbol);
      const bMajorIndex = MAJOR_COINS.indexOf(b.symbol);
      
      // 메이저 코인이면 앞으로
      if (aMajorIndex !== -1 && bMajorIndex === -1) return -1;
      if (aMajorIndex === -1 && bMajorIndex !== -1) return 1;
      if (aMajorIndex !== -1 && bMajorIndex !== -1) return aMajorIndex - bMajorIndex;
      
      // 둘 다 메이저가 아니면 거래대금 순
      return b.tradeValue24h - a.tradeValue24h;
    });
    
    return sortedQuotes;
  }

  /**
   * Get minute candle chart data
   * unit: 1, 3, 5, 10, 15, 30, 60, 240
   */
  async getMinuteCandles(
    symbol: string,
    unit: 1 | 3 | 5 | 10 | 15 | 30 | 60 | 240 = 1,
    count: number = 200
  ): Promise<CoinChartData[]> {
    const marketCode = symbol.includes('-') ? symbol : `KRW-${symbol}`;
    
    const candles = await this.makePublicRequest<UpbitCandle[]>(
      `/candles/minutes/${unit}`,
      { market: marketCode, count }
    );

    return candles.map((candle) => ({
      timestamp: new Date(candle.timestamp),
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
      volume: candle.candle_acc_trade_volume,
    }));
  }

  /**
   * Get daily candle chart data
   */
  async getDailyCandles(
    symbol: string,
    count: number = 200
  ): Promise<CoinChartData[]> {
    const marketCode = symbol.includes('-') ? symbol : `KRW-${symbol}`;
    
    const candles = await this.makePublicRequest<UpbitCandle[]>(
      '/candles/days',
      { market: marketCode, count }
    );

    return candles.map((candle) => ({
      timestamp: new Date(candle.timestamp),
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
      volume: candle.candle_acc_trade_volume,
    }));
  }

  /**
   * Get weekly candle chart data
   */
  async getWeeklyCandles(
    symbol: string,
    count: number = 100
  ): Promise<CoinChartData[]> {
    const marketCode = symbol.includes('-') ? symbol : `KRW-${symbol}`;
    
    const candles = await this.makePublicRequest<UpbitCandle[]>(
      '/candles/weeks',
      { market: marketCode, count }
    );

    return candles.map((candle) => ({
      timestamp: new Date(candle.timestamp),
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
      volume: candle.candle_acc_trade_volume,
    }));
  }

  /**
   * Search coins by keyword
   */
  async searchCoins(keyword: string): Promise<Array<{
    symbol: string;
    name: string;
    englishName: string;
  }>> {
    const markets = await this.getMarkets();
    const lowerKeyword = keyword.toLowerCase();
    
    return markets
      .filter((m) => 
        m.market.startsWith('KRW-') && (
          m.korean_name.includes(keyword) ||
          m.english_name.toLowerCase().includes(lowerKeyword) ||
          m.market.toLowerCase().includes(lowerKeyword)
        )
      )
      .map((m) => ({
        symbol: m.market,
        name: m.korean_name,
        englishName: m.english_name,
      }));
  }

  /**
   * Get chart data based on interval
   */
  async getChartData(
    symbol: string,
    interval: string = '1d',
    count: number = 200
  ): Promise<CoinChartData[]> {
    switch (interval) {
      case '1m':
        return this.getMinuteCandles(symbol, 1, count);
      case '3m':
        return this.getMinuteCandles(symbol, 3, count);
      case '5m':
        return this.getMinuteCandles(symbol, 5, count);
      case '10m':
        return this.getMinuteCandles(symbol, 10, count);
      case '15m':
        return this.getMinuteCandles(symbol, 15, count);
      case '30m':
        return this.getMinuteCandles(symbol, 30, count);
      case '1h':
        return this.getMinuteCandles(symbol, 60, count);
      case '4h':
        return this.getMinuteCandles(symbol, 240, count);
      case '1d':
        return this.getDailyCandles(symbol, count);
      case '1w':
        return this.getWeeklyCandles(symbol, count);
      default:
        return this.getDailyCandles(symbol, count);
    }
  }
}

// Export singleton instance
export const upbitService = new UpbitService();
