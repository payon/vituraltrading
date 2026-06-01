/**
 * Unified Market Service
 * 통합 시세 서비스 - KIS, Naver Finance, Upbit, Yahoo Finance 통합
 * 
 * Features:
 * - API 우선순위: Naver Finance (국내주식 실시간) > KIS > Yahoo Finance
 * - API 우선순위: Upbit (코인)
 * - 캐싱 및 요청 중복 방지
 * - API 장애 시 모의 데이터 폴백
 * - 데이터 소스 선택 가능 (DB 설정에서)
 */

import { marketCache } from './cache';
import { kisService, StockQuote as KISStockQuote, ChartData as KISChartData } from './kis-service';
import { upbitService, CoinQuote, CoinChartData } from './upbit-service';
import { yahooFinanceService, GlobalQuote, GlobalChartData } from './yahoo-finance-service';
import { getNaverStockPrice, getNaverStockPrices, getNaverDailyChart, NaverStockData } from './naver-finance-service';
import { db } from '@/lib/db';

// 데이터 소스 타입
export type StockDataSource = 'naver' | 'kis' | 'yahoo' | 'mock';
export type CoinDataSource = 'upbit' | 'mock';

// Unified types
export type AssetType = 'STOCK' | 'COIN' | 'GLOBAL';

export interface UnifiedQuote {
  symbol: string;
  name: string;
  type: AssetType;
  market?: string;
  sector?: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  sign: 'UPPER_LIMIT' | 'UP' | 'UNCHANGED' | 'DOWN' | 'LOWER_LIMIT' | 'RISE' | 'FALL' | 'EVEN';
  volume: number;
  tradeValue?: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  high52w: number;
  low52w: number;
  marketCap?: number | null;
  per?: number | null;
  pbr?: number | null;
  currency?: string;
  warning?: boolean;
}

export interface UnifiedChartData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 한국 주식 심볼 매핑 (Yahoo Finance용)
// .KS = KOSPI, .KQ = KOSDAQ
export const KOREAN_STOCK_SYMBOLS: Record<string, { name: string; market: string; sector: string; yahooSymbol: string }> = {
  '005930': { name: '삼성전자', market: 'KOSPI', sector: '반도체', yahooSymbol: '005930.KS' },
  '000660': { name: 'SK하이닉스', market: 'KOSPI', sector: '반도체', yahooSymbol: '000660.KS' },
  '373220': { name: 'LG에너지솔루션', market: 'KOSPI', sector: '2차전지', yahooSymbol: '373220.KS' },
  '207940': { name: '삼성바이오로직스', market: 'KOSPI', sector: '바이오', yahooSymbol: '207940.KS' },
  '005380': { name: '현대차', market: 'KOSPI', sector: '자동차', yahooSymbol: '005380.KS' },
  '035420': { name: 'NAVER', market: 'KOSPI', sector: '플랫폼', yahooSymbol: '035420.KS' },
  '051910': { name: 'LG화학', market: 'KOSPI', sector: '화학', yahooSymbol: '051910.KS' },
  '006400': { name: '삼성SDI', market: 'KOSPI', sector: '2차전지', yahooSymbol: '006400.KS' },
  '035720': { name: '카카오', market: 'KOSPI', sector: '플랫폼', yahooSymbol: '035720.KS' },
  '086790': { name: '하나금융지주', market: 'KOSPI', sector: '금융', yahooSymbol: '086790.KS' },
  '042660': { name: '두산에너빌리티', market: 'KOSDAQ', sector: '에너지', yahooSymbol: '042660.KQ' },
  '247540': { name: '에코프로비엠', market: 'KOSDAQ', sector: '2차전지', yahooSymbol: '247540.KQ' },
  '068270': { name: '셀트리온', market: 'KOSPI', sector: '바이오', yahooSymbol: '068270.KS' },
  '009150': { name: '삼성전기', market: 'KOSPI', sector: '전자부품', yahooSymbol: '009150.KS' },
  '018260': { name: '삼성에스디에스', market: 'KOSPI', sector: 'IT서비스', yahooSymbol: '018260.KS' },
  '028260': { name: '삼성물산', market: 'KOSPI', sector: '건설', yahooSymbol: '028260.KS' },
  '055550': { name: '신한지주', market: 'KOSPI', sector: '금융', yahooSymbol: '055550.KS' },
  '105560': { name: 'KB금융', market: 'KOSPI', sector: '금융', yahooSymbol: '105560.KS' },
  '034730': { name: 'SK', market: 'KOSPI', sector: '지주사', yahooSymbol: '034730.KS' },
  '032830': { name: '삼성생명', market: 'KOSPI', sector: '보험', yahooSymbol: '032830.KS' },
};

// Yahoo Finance용 한국 주식 심볼 리스트
const KOREAN_STOCK_YAHOO_SYMBOLS = Object.keys(KOREAN_STOCK_SYMBOLS);

const MOCK_COINS: UnifiedQuote[] = [
  { symbol: 'KRW-BTC', name: '비트코인', type: 'COIN', market: 'UPBIT', currentPrice: 185000000, changeAmount: 5500000, changeRate: 3.06, sign: 'RISE', volume: 15000, tradeValue: 2775000000000, openPrice: 179500000, highPrice: 188000000, lowPrice: 177000000, previousClose: 179500000, high52w: 250000000, low52w: 65000000, currency: 'KRW' },
  { symbol: 'KRW-ETH', name: '이더리움', type: 'COIN', market: 'UPBIT', currentPrice: 8500000, changeAmount: 250000, changeRate: 3.03, sign: 'RISE', volume: 250000, tradeValue: 2125000000000, openPrice: 8250000, highPrice: 8700000, lowPrice: 8100000, previousClose: 8250000, high52w: 12000000, low52w: 2500000, currency: 'KRW' },
  { symbol: 'KRW-XRP', name: '리플', type: 'COIN', market: 'UPBIT', currentPrice: 3500, changeAmount: 150, changeRate: 4.48, sign: 'RISE', volume: 150000000, tradeValue: 525000000000, openPrice: 3350, highPrice: 3600, lowPrice: 3200, previousClose: 3350, high52w: 5500, low52w: 800, currency: 'KRW' },
  { symbol: 'KRW-SOL', name: '솔라나', type: 'COIN', market: 'UPBIT', currentPrice: 450000, changeAmount: 22000, changeRate: 5.14, sign: 'RISE', volume: 850000, tradeValue: 382500000000, openPrice: 428000, highPrice: 465000, lowPrice: 420000, previousClose: 428000, high52w: 650000, low52w: 45000, currency: 'KRW' },
  { symbol: 'KRW-DOGE', name: '도지코인', type: 'COIN', market: 'UPBIT', currentPrice: 850, changeAmount: 45, changeRate: 5.59, sign: 'RISE', volume: 500000000, tradeValue: 425000000000, openPrice: 805, highPrice: 880, lowPrice: 780, previousClose: 805, high52w: 1500, low52w: 100, currency: 'KRW' },
  { symbol: 'KRW-ADA', name: '에이다', type: 'COIN', market: 'UPBIT', currentPrice: 1850, changeAmount: 75, changeRate: 4.23, sign: 'RISE', volume: 120000000, tradeValue: 222000000000, openPrice: 1775, highPrice: 1920, lowPrice: 1720, previousClose: 1775, high52w: 3500, low52w: 350, currency: 'KRW' },
  { symbol: 'KRW-AVAX', name: '아발란체', type: 'COIN', market: 'UPBIT', currentPrice: 85000, changeAmount: 4500, changeRate: 5.59, sign: 'RISE', volume: 1500000, tradeValue: 127500000000, openPrice: 80500, highPrice: 88000, lowPrice: 78000, previousClose: 80500, high52w: 180000, low52w: 15000, currency: 'KRW' },
  { symbol: 'KRW-DOT', name: '폴카닷', type: 'COIN', market: 'UPBIT', currentPrice: 18500, changeAmount: 850, changeRate: 4.82, sign: 'RISE', volume: 10000000, tradeValue: 185000000000, openPrice: 17650, highPrice: 19200, lowPrice: 17000, previousClose: 17650, high52w: 45000, low52w: 5000, currency: 'KRW' },
  { symbol: 'KRW-MATIC', name: '폴리곤', type: 'COIN', market: 'UPBIT', currentPrice: 3500, changeAmount: 120, changeRate: 3.55, sign: 'RISE', volume: 150000000, tradeValue: 525000000000, openPrice: 3380, highPrice: 3600, lowPrice: 3250, previousClose: 3380, high52w: 6500, low52w: 800, currency: 'KRW' },
  { symbol: 'KRW-LINK', name: '체인링크', type: 'COIN', market: 'UPBIT', currentPrice: 45000, changeAmount: 2500, changeRate: 5.88, sign: 'RISE', volume: 3500000, tradeValue: 157500000000, openPrice: 42500, highPrice: 46500, lowPrice: 41000, previousClose: 42500, high52w: 85000, low52w: 8000, currency: 'KRW' },
];

// 한국 주식 Mock 데이터 (2026년 미래 시나리오)
// AI 반도체 호황, 자율주행차 상용화, 2차전지 시장 확대 등을 반영한 시뮬레이션
const MOCK_STOCKS: UnifiedQuote[] = [
  { symbol: '005930', name: '삼성전자', type: 'STOCK', market: 'KOSPI', sector: '반도체', currentPrice: 125000, changeAmount: 2500, changeRate: 2.04, sign: 'UP', volume: 18500000, openPrice: 122500, highPrice: 126500, lowPrice: 121000, previousClose: 122500, high52w: 145000, low52w: 75000, per: 15.2, pbr: 2.8, currency: 'KRW' },
  { symbol: '000660', name: 'SK하이닉스', type: 'STOCK', market: 'KOSPI', sector: '반도체', currentPrice: 385000, changeAmount: 8500, changeRate: 2.26, sign: 'UP', volume: 5200000, openPrice: 376500, highPrice: 390000, lowPrice: 372000, previousClose: 376500, high52w: 450000, low52w: 180000, per: 12.8, pbr: 3.5, currency: 'KRW' },
  { symbol: '373220', name: 'LG에너지솔루션', type: 'STOCK', market: 'KOSPI', sector: '2차전지', currentPrice: 680000, changeAmount: 15000, changeRate: 2.26, sign: 'UP', volume: 850000, openPrice: 665000, highPrice: 690000, lowPrice: 660000, previousClose: 665000, high52w: 850000, low52w: 320000, per: 22.5, pbr: 4.8, currency: 'KRW' },
  { symbol: '207940', name: '삼성바이오로직스', type: 'STOCK', market: 'KOSPI', sector: '바이오', currentPrice: 1250000, changeAmount: 25000, changeRate: 2.04, sign: 'UP', volume: 250000, openPrice: 1225000, highPrice: 1265000, lowPrice: 1210000, previousClose: 1225000, high52w: 1500000, low52w: 850000, per: 45.2, pbr: 6.2, currency: 'KRW' },
  { symbol: '005380', name: '현대차', type: 'STOCK', market: 'KOSPI', sector: '자동차', currentPrice: 420000, changeAmount: 8500, changeRate: 2.06, sign: 'UP', volume: 4500000, openPrice: 411500, highPrice: 425000, lowPrice: 408000, previousClose: 411500, high52w: 500000, low52w: 220000, per: 4.2, pbr: 1.2, currency: 'KRW' },
  { symbol: '035420', name: 'NAVER', type: 'STOCK', market: 'KOSPI', sector: '플랫폼', currentPrice: 385000, changeAmount: -5500, changeRate: -1.41, sign: 'DOWN', volume: 1200000, openPrice: 390500, highPrice: 395000, lowPrice: 380000, previousClose: 390500, high52w: 480000, low52w: 250000, per: 18.5, pbr: 4.2, currency: 'KRW' },
  { symbol: '051910', name: 'LG화학', type: 'STOCK', market: 'KOSPI', sector: '화학', currentPrice: 520000, changeAmount: 8000, changeRate: 1.56, sign: 'UP', volume: 650000, openPrice: 512000, highPrice: 530000, lowPrice: 508000, previousClose: 512000, high52w: 650000, low52w: 320000, per: 12.5, pbr: 2.1, currency: 'KRW' },
  { symbol: '006400', name: '삼성SDI', type: 'STOCK', market: 'KOSPI', sector: '2차전지', currentPrice: 720000, changeAmount: 12000, changeRate: 1.69, sign: 'UP', volume: 580000, openPrice: 708000, highPrice: 735000, lowPrice: 705000, previousClose: 708000, high52w: 920000, low52w: 380000, per: 14.2, pbr: 3.2, currency: 'KRW' },
  { symbol: '035720', name: '카카오', type: 'STOCK', market: 'KOSPI', sector: '플랫폼', currentPrice: 75000, changeAmount: 1200, changeRate: 1.63, sign: 'UP', volume: 6500000, openPrice: 73800, highPrice: 76500, lowPrice: 73000, previousClose: 73800, high52w: 110000, low52w: 42000, per: 22.5, pbr: 3.8, currency: 'KRW' },
  { symbol: '086790', name: '하나금융지주', type: 'STOCK', market: 'KOSPI', sector: '금융', currentPrice: 85000, changeAmount: 1200, changeRate: 1.43, sign: 'UP', volume: 4800000, openPrice: 83800, highPrice: 86500, lowPrice: 83000, previousClose: 83800, high52w: 98000, low52w: 55000, per: 4.2, pbr: 0.72, currency: 'KRW' },
  { symbol: '042660', name: '두산에너빌리티', type: 'STOCK', market: 'KOSDAQ', sector: '에너지', currentPrice: 285000, changeAmount: 6500, changeRate: 2.33, sign: 'UP', volume: 2200000, openPrice: 278500, highPrice: 290000, lowPrice: 275000, previousClose: 278500, high52w: 380000, low52w: 120000, per: 28.5, pbr: 8.5, currency: 'KRW' },
  { symbol: '247540', name: '에코프로비엠', type: 'STOCK', market: 'KOSDAQ', sector: '2차전지', currentPrice: 520000, changeAmount: -8500, changeRate: -1.61, sign: 'DOWN', volume: 950000, openPrice: 528500, highPrice: 535000, lowPrice: 512000, previousClose: 528500, high52w: 780000, low52w: 280000, per: 35.2, pbr: 8.2, currency: 'KRW' },
  { symbol: '068270', name: '셀트리온', type: 'STOCK', market: 'KOSPI', sector: '바이오', currentPrice: 285000, changeAmount: 5500, changeRate: 1.97, sign: 'UP', volume: 1500000, openPrice: 279500, highPrice: 290000, lowPrice: 276000, previousClose: 279500, high52w: 380000, low52w: 160000, per: 15.2, pbr: 3.5, currency: 'KRW' },
  { symbol: '009150', name: '삼성전기', type: 'STOCK', market: 'KOSPI', sector: '전자부품', currentPrice: 185000, changeAmount: 2500, changeRate: 1.37, sign: 'UP', volume: 1200000, openPrice: 182500, highPrice: 188000, lowPrice: 180000, previousClose: 182500, high52w: 250000, low52w: 120000, per: 11.5, pbr: 2.2, currency: 'KRW' },
  { symbol: '018260', name: '삼성에스디에스', type: 'STOCK', market: 'KOSPI', sector: 'IT서비스', currentPrice: 185000, changeAmount: -2500, changeRate: -1.33, sign: 'DOWN', volume: 620000, openPrice: 187500, highPrice: 190000, lowPrice: 182000, previousClose: 187500, high52w: 250000, low52w: 130000, per: 9.8, pbr: 1.5, currency: 'KRW' },
  { symbol: '028260', name: '삼성물산', type: 'STOCK', market: 'KOSPI', sector: '건설', currentPrice: 185000, changeAmount: 3000, changeRate: 1.65, sign: 'UP', volume: 980000, openPrice: 182000, highPrice: 188000, lowPrice: 180000, previousClose: 182000, high52w: 240000, low52w: 120000, per: 7.2, pbr: 1.1, currency: 'KRW' },
  { symbol: '055550', name: '신한지주', type: 'STOCK', market: 'KOSPI', sector: '금융', currentPrice: 68000, changeAmount: 850, changeRate: 1.27, sign: 'UP', volume: 7500000, openPrice: 67150, highPrice: 69000, lowPrice: 66500, previousClose: 67150, high52w: 82000, low52w: 42000, per: 4.5, pbr: 0.62, currency: 'KRW' },
  { symbol: '105560', name: 'KB금융', type: 'STOCK', market: 'KOSPI', sector: '금융', currentPrice: 85000, changeAmount: 1200, changeRate: 1.43, sign: 'UP', volume: 5500000, openPrice: 83800, highPrice: 86500, lowPrice: 83000, previousClose: 83800, high52w: 100000, low52w: 55000, per: 3.8, pbr: 0.58, currency: 'KRW' },
  { symbol: '034730', name: 'SK', type: 'STOCK', market: 'KOSPI', sector: '지주사', currentPrice: 385000, changeAmount: 5500, changeRate: 1.45, sign: 'UP', volume: 580000, openPrice: 379500, highPrice: 392000, lowPrice: 375000, previousClose: 379500, high52w: 480000, low52w: 220000, per: 5.2, pbr: 0.95, currency: 'KRW' },
  { symbol: '032830', name: '삼성생명', type: 'STOCK', market: 'KOSPI', sector: '보험', currentPrice: 125000, changeAmount: 2000, changeRate: 1.63, sign: 'UP', volume: 1800000, openPrice: 123000, highPrice: 128000, lowPrice: 121500, previousClose: 123000, high52w: 155000, low52w: 75000, per: 5.8, pbr: 0.82, currency: 'KRW' },
];

// Global mock stocks for Yahoo Finance fallback
const MOCK_GLOBAL_STOCKS: UnifiedQuote[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'GLOBAL', market: 'NASDAQ', currentPrice: 178.52, changeAmount: 2.35, changeRate: 1.33, sign: 'UP', volume: 52840000, openPrice: 176.17, highPrice: 179.23, lowPrice: 175.85, previousClose: 176.17, high52w: 199.62, low52w: 124.17, marketCap: 2780000000000, currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'GLOBAL', market: 'NASDAQ', currentPrice: 378.91, changeAmount: 4.56, changeRate: 1.22, sign: 'UP', volume: 21560000, openPrice: 374.35, highPrice: 380.12, lowPrice: 373.80, previousClose: 374.35, high52w: 384.30, low52w: 245.61, marketCap: 2810000000000, currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'GLOBAL', market: 'NASDAQ', currentPrice: 141.80, changeAmount: -0.85, changeRate: -0.60, sign: 'DOWN', volume: 18920000, openPrice: 142.65, highPrice: 143.50, lowPrice: 140.90, previousClose: 142.65, high52w: 153.78, low52w: 83.34, marketCap: 1780000000000, currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'GLOBAL', market: 'NASDAQ', currentPrice: 178.25, changeAmount: 3.12, changeRate: 1.78, sign: 'UP', volume: 42180000, openPrice: 175.13, highPrice: 179.40, lowPrice: 174.80, previousClose: 175.13, high52w: 189.77, low52w: 88.12, marketCap: 1850000000000, currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'GLOBAL', market: 'NASDAQ', currentPrice: 875.28, changeAmount: 25.67, changeRate: 3.02, sign: 'UP', volume: 35420000, openPrice: 849.61, highPrice: 882.50, lowPrice: 845.30, previousClose: 849.61, high52w: 974.00, low52w: 138.84, marketCap: 2160000000000, currency: 'USD' },
];

class MarketService {
  private useMockFallback: boolean;
  private cachedDataSource: StockDataSource | null = null;
  private dataSourceCacheTime: number = 0;
  private readonly DATA_SOURCE_CACHE_TTL = 60000; // 1분 캐시

  constructor() {
    this.useMockFallback = process.env.USE_MOCK_DATA_FALLBACK !== 'false';
  }

  /**
   * DB에서 데이터 소스 설정 가져오기
   */
  private async getStockDataSource(): Promise<StockDataSource> {
    // 캐시된 값이 있으면 반환
    const now = Date.now();
    if (this.cachedDataSource && (now - this.dataSourceCacheTime) < this.DATA_SOURCE_CACHE_TTL) {
      return this.cachedDataSource;
    }

    try {
      const settings = await db.systemSettings.findFirst();
      if (settings?.stockDataSource) {
        this.cachedDataSource = settings.stockDataSource as StockDataSource;
        this.dataSourceCacheTime = now;
        return this.cachedDataSource;
      }
    } catch (error) {
      console.error('Failed to get data source from DB:', error);
    }

    // 기본값: mock (2026년 시뮬레이션 데이터)
    return 'mock';
  }

  /**
   * 데이터 소스 캐시 초기화
   */
  clearDataSourceCache(): void {
    this.cachedDataSource = null;
    this.dataSourceCacheTime = 0;
  }

  /**
   * Check if KIS API is available
   */
  isKISAvailable(): boolean {
    return kisService.isConfigured();
  }

  /**
   * Check if Naver Finance is available (always true - no API key needed)
   */
  isNaverAvailable(): boolean {
    return true;
  }

  /**
   * Check if Upbit API is available
   */
  isUpbitAvailable(): boolean {
    return upbitService.isConfigured();
  }

  /**
   * Get stock quote (Korean stocks via selected data source)
   * Default: mock (2026년 시뮬레이션 데이터)
   */
  async getStockQuote(symbol: string): Promise<UnifiedQuote | null> {
    const cacheKey = `stock:quote:${symbol}`;
    
    return marketCache.getOrSet(cacheKey, async () => {
      const dataSource = await this.getStockDataSource();
      
      // 0. Mock 데이터 (2026년 시뮬레이션) - 기본값
      if (dataSource === 'mock') {
        const mockQuote = MOCK_STOCKS.find(s => s.symbol === symbol);
        if (mockQuote) {
          return mockQuote;
        }
      }

      // 1. Try Naver Finance (실시간 한국 주식, API 키 불필요)
      if (dataSource === 'naver') {
        try {
          const quote = await getNaverStockPrice(symbol);
          if (quote && quote.currentPrice > 0) {
            return this.convertNaverQuoteToUnified(quote);
          }
        } catch (error) {
          console.error(`Naver Finance API error for ${symbol}:`, error);
        }
      }

      // 2. Try KIS API (실시간, API 키 필요)
      if (dataSource === 'kis' && kisService.isConfigured()) {
        try {
          const quote = await kisService.getStockPrice(symbol);
          return this.convertKISQuoteToUnified(quote);
        } catch (error) {
          console.error(`KIS API error for ${symbol}:`, error);
        }
      }

      // 3. Try Yahoo Finance
      if (dataSource === 'yahoo') {
        const stockInfo = KOREAN_STOCK_SYMBOLS[symbol];
        if (stockInfo) {
          try {
            const quote = await yahooFinanceService.getQuote(stockInfo.yahooSymbol);
            const unified = this.convertGlobalQuoteToUnified(quote);
            return {
              ...unified,
              symbol: symbol,
              name: stockInfo.name,
              market: stockInfo.market,
              sector: stockInfo.sector,
              type: 'STOCK',
              currency: 'KRW',
            };
          } catch (error) {
            console.error(`Yahoo Finance API error for ${symbol}:`, error);
          }
        }
      }

      // 4. Fallback to mock data
      const mockQuote = MOCK_STOCKS.find(s => s.symbol === symbol);
      if (mockQuote) {
        return mockQuote;
      }

      throw new Error(`Stock quote not found: ${symbol}`);
    }, 30000); // 30초 캐시
  }

  /**
   * Get multiple stock quotes
   */
  async getStockQuotes(symbols: string[]): Promise<UnifiedQuote[]> {
    const quotes = await Promise.all(
      symbols.map(s => this.getStockQuote(s).catch(() => null))
    );
    return quotes.filter((q): q is UnifiedQuote => q !== null);
  }

  /**
   * Get all Korean stocks
   */
  async getAllStocks(): Promise<UnifiedQuote[]> {
    const cacheKey = 'stocks:all';
    
    return marketCache.getOrSet(cacheKey, async () => {
      const dataSource = await this.getStockDataSource();
      
      // 0. Mock 데이터 (2026년 시뮬레이션) - 기본값
      if (dataSource === 'mock') {
        return MOCK_STOCKS;
      }

      // 1. Try Naver Finance (실시간, API 키 불필요)
      if (dataSource === 'naver') {
        try {
          const quotes = await getNaverStockPrices(KOREAN_STOCK_YAHOO_SYMBOLS);
          if (quotes.length > 0) {
            return quotes.map(q => this.convertNaverQuoteToUnified(q));
          }
        } catch (error) {
          console.error('Naver Finance API error:', error);
        }
      }

      // 2. Try KIS
      if (dataSource === 'kis' && kisService.isConfigured()) {
        try {
          const quotes = await kisService.getStockPrices(KOREAN_STOCK_YAHOO_SYMBOLS);
          return quotes.map(q => this.convertKISQuoteToUnified(q));
        } catch (error) {
          console.error('KIS API error:', error);
        }
      }

      // 3. Try Yahoo Finance
      if (dataSource === 'yahoo') {
        try {
          const quotes = await Promise.all(
            Object.entries(KOREAN_STOCK_SYMBOLS).map(async ([symbol, info]) => {
              try {
                const quote = await yahooFinanceService.getQuote(info.yahooSymbol);
                const unified = this.convertGlobalQuoteToUnified(quote);
                return {
                  ...unified,
                  symbol,
                  name: info.name,
                  market: info.market,
                  sector: info.sector,
                  type: 'STOCK' as const,
                  currency: 'KRW',
                };
              } catch (err) {
                console.error(`Failed to fetch ${symbol}:`, err);
                return null;
              }
            })
          );
          
          const validQuotes = quotes.filter((q): q is UnifiedQuote => q !== null);
          if (validQuotes.length > 0) {
            return validQuotes;
          }
        } catch (error) {
          console.error('Yahoo Finance API error:', error);
        }
      }

      // 4. Fallback to mock
      return MOCK_STOCKS;
    }, 30000); // 30초 캐시
  }

  /**
   * Get coin quote (via Upbit)
   */
  async getCoinQuote(symbol: string): Promise<UnifiedQuote | null> {
    const cacheKey = `coin:quote:${symbol}`;
    
    return marketCache.getOrSet(cacheKey, async () => {
      try {
        if (upbitService.isConfigured()) {
          const quote = await upbitService.getCoinPrice(symbol);
          return this.convertCoinQuoteToUnified(quote);
        }
      } catch (error) {
        console.error(`Upbit API error for ${symbol}:`, error);
      }

      // Fallback to mock data
      if (this.useMockFallback) {
        const mockQuote = MOCK_COINS.find(c => c.symbol === symbol || c.symbol === `KRW-${symbol}`);
        if (mockQuote) {
          return { ...mockQuote, _fallback: true } as UnifiedQuote;
        }
      }

      throw new Error(`Coin quote not found: ${symbol}`);
    }, 60000);
  }

  /**
   * Get multiple coin quotes
   */
  async getCoinQuotes(symbols: string[]): Promise<UnifiedQuote[]> {
    const quotes = await Promise.all(
      symbols.map(s => this.getCoinQuote(s).catch(() => null))
    );
    return quotes.filter((q): q is UnifiedQuote => q !== null);
  }

  /**
   * Get all coins
   */
  async getAllCoins(): Promise<UnifiedQuote[]> {
    const cacheKey = 'coins:all';
    
    return marketCache.getOrSet(cacheKey, async () => {
      try {
        if (upbitService.isConfigured()) {
          const quotes = await upbitService.getAllKRWCoinPrices();
          return quotes.map(q => this.convertCoinQuoteToUnified(q));
        }
      } catch (error) {
        console.error('Upbit API error:', error);
      }

      // Fallback to mock data
      if (this.useMockFallback) {
        return MOCK_COINS;
      }

      return [];
    }, 60000);
  }

  /**
   * Get global stock quote (via Yahoo Finance)
   */
  async getGlobalQuote(symbol: string): Promise<UnifiedQuote | null> {
    const cacheKey = `global:quote:${symbol}`;
    
    return marketCache.getOrSet(cacheKey, async () => {
      try {
        const quote = await yahooFinanceService.getQuote(symbol);
        return this.convertGlobalQuoteToUnified(quote);
      } catch (error) {
        console.error(`Yahoo Finance API error for ${symbol}:`, error);
      }

      // Fallback to mock data
      if (this.useMockFallback) {
        const mockQuote = MOCK_GLOBAL_STOCKS.find(s => s.symbol === symbol);
        if (mockQuote) {
          return { ...mockQuote, _fallback: true } as UnifiedQuote;
        }
      }

      throw new Error(`Global quote not found: ${symbol}`);
    }, 60000);
  }

  /**
   * Get chart data for stocks
   */
  async getStockChart(symbol: string, interval: string = '1d'): Promise<UnifiedChartData[]> {
    const cacheKey = `stock:chart:${symbol}:${interval}`;
    
    return marketCache.getOrSet(cacheKey, async () => {
      try {
        if (kisService.isConfigured()) {
          if (interval.includes('m') || interval === '1h') {
            const minute = interval.replace('m', '') as '1' | '3' | '5' | '10' | '15' | '30' | '60';
            const data = await kisService.getMinuteChart(symbol, minute);
            return data.map(d => this.convertChartData(d));
          } else {
            const data = await kisService.getDailyChart(symbol);
            return data.map(d => this.convertChartData(d));
          }
        }
      } catch (error) {
        console.error(`KIS chart API error for ${symbol}:`, error);
      }

      // Generate mock chart data
      return this.generateMockChartData(symbol, interval);
    }, 60000);
  }

  /**
   * Get chart data for coins
   */
  async getCoinChart(symbol: string, interval: string = '1d'): Promise<UnifiedChartData[]> {
    const cacheKey = `coin:chart:${symbol}:${interval}`;
    
    return marketCache.getOrSet(cacheKey, async () => {
      try {
        if (upbitService.isConfigured()) {
          const data = await upbitService.getChartData(symbol, interval);
          return data.map(d => this.convertCoinChartData(d));
        }
      } catch (error) {
        console.error(`Upbit chart API error for ${symbol}:`, error);
      }

      // Generate mock chart data
      return this.generateMockChartData(symbol, interval);
    }, 60000);
  }

  /**
   * Search assets
   */
  async searchAssets(keyword: string, type?: AssetType): Promise<UnifiedQuote[]> {
    const results: UnifiedQuote[] = [];

    try {
      // Search stocks via KIS
      if (!type || type === 'STOCK') {
        if (kisService.isConfigured()) {
          const stocks = await kisService.searchStocks(keyword);
          for (const stock of stocks.slice(0, 10)) {
            const quote = await this.getStockQuote(stock.symbol);
            if (quote) results.push(quote);
          }
        } else {
          // Search in mock data
          const filtered = MOCK_STOCKS.filter(s => 
            s.name.includes(keyword) || s.symbol.includes(keyword)
          );
          results.push(...filtered);
        }
      }

      // Search coins via Upbit
      if (!type || type === 'COIN') {
        if (upbitService.isConfigured()) {
          const coins = await upbitService.searchCoins(keyword);
          for (const coin of coins.slice(0, 10)) {
            const quote = await this.getCoinQuote(coin.symbol);
            if (quote) results.push(quote);
          }
        } else {
          // Search in mock data
          const filtered = MOCK_COINS.filter(c => 
            c.name.includes(keyword) || c.symbol.toLowerCase().includes(keyword.toLowerCase())
          );
          results.push(...filtered);
        }
      }

      // Search global stocks via Yahoo Finance
      if (!type || type === 'GLOBAL') {
        const globalResults = await yahooFinanceService.searchSymbols(keyword);
        for (const item of globalResults.slice(0, 5)) {
          try {
            const quote = await this.getGlobalQuote(item.symbol);
            if (quote) results.push(quote);
          } catch {
            // Skip if quote fetch fails
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    return results;
  }

  // Conversion methods
  private convertNaverQuoteToUnified(quote: NaverStockData): UnifiedQuote {
    const stockInfo = KOREAN_STOCK_SYMBOLS[quote.symbol];
    return {
      symbol: quote.symbol,
      name: quote.name || stockInfo?.name || quote.symbol,
      type: 'STOCK',
      market: stockInfo?.market || 'KOSPI',
      sector: stockInfo?.sector,
      currentPrice: quote.currentPrice,
      changeAmount: quote.changeAmount,
      changeRate: quote.changeRate,
      sign: quote.sign,
      volume: quote.volume,
      tradeValue: quote.tradeValue,
      openPrice: quote.openPrice,
      highPrice: quote.highPrice,
      lowPrice: quote.lowPrice,
      previousClose: quote.previousClose,
      high52w: quote.highPrice * 1.3, // 52주 고가/저가는 별도 조회 필요
      low52w: quote.lowPrice * 0.7,
      per: quote.per,
      pbr: quote.pbr,
      marketCap: quote.marketCap,
      currency: 'KRW',
    };
  }

  private convertKISQuoteToUnified(quote: KISStockQuote): UnifiedQuote {
    return {
      symbol: quote.symbol,
      name: quote.name,
      type: 'STOCK',
      currentPrice: quote.currentPrice,
      changeAmount: quote.changeAmount,
      changeRate: quote.changeRate,
      sign: quote.sign,
      volume: quote.volume,
      tradeValue: quote.tradeValue,
      openPrice: quote.openPrice,
      highPrice: quote.highPrice,
      lowPrice: quote.lowPrice,
      previousClose: quote.previousClose,
      high52w: quote.high52w,
      low52w: quote.low52w,
      per: quote.per,
      pbr: quote.pbr,
    };
  }

  private convertCoinQuoteToUnified(quote: CoinQuote): UnifiedQuote {
    return {
      symbol: quote.symbol,
      name: quote.name,
      type: 'COIN',
      market: 'UPBIT',
      currentPrice: quote.currentPrice,
      changeAmount: quote.changeAmount,
      changeRate: quote.changeRate,
      sign: quote.sign,
      volume: quote.volume,
      tradeValue: quote.tradeValue24h,
      openPrice: quote.openPrice,
      highPrice: quote.highPrice,
      lowPrice: quote.lowPrice,
      previousClose: quote.previousClose,
      high52w: quote.high52w,
      low52w: quote.low52w,
      warning: quote.warning,
    };
  }

  private convertGlobalQuoteToUnified(quote: GlobalQuote): UnifiedQuote {
    return {
      symbol: quote.symbol,
      name: quote.name,
      type: 'GLOBAL',
      market: quote.exchange,
      currentPrice: quote.currentPrice,
      changeAmount: quote.changeAmount,
      changeRate: quote.changeRate,
      sign: quote.sign,
      volume: quote.volume,
      openPrice: quote.openPrice,
      highPrice: quote.highPrice,
      lowPrice: quote.lowPrice,
      previousClose: quote.previousClose,
      high52w: quote.high52w,
      low52w: quote.low52w,
      marketCap: quote.marketCap,
      currency: quote.currency,
    };
  }

  private convertChartData(data: KISChartData): UnifiedChartData {
    return {
      timestamp: data.timestamp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    };
  }

  private convertCoinChartData(data: CoinChartData): UnifiedChartData {
    return {
      timestamp: data.timestamp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    };
  }

  /**
   * Generate mock chart data for fallback
   */
  private generateMockChartData(symbol: string, interval: string): UnifiedChartData[] {
    const basePrice = symbol.includes('BTC') ? 95000000 : 
                      symbol.includes('ETH') ? 3850000 : 
                      50000;
    const now = new Date();
    const data: UnifiedChartData[] = [];
    
    const intervalMs: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    
    const ms = intervalMs[interval] || intervalMs['1d'];
    const count = interval.includes('m') || interval === '1h' ? 200 : 100;
    
    let currentPrice = basePrice * 0.8;
    
    for (let i = count; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * ms);
      const volatility = basePrice * 0.02;
      const change = (Math.random() - 0.48) * volatility;
      currentPrice = Math.max(currentPrice + change, basePrice * 0.5);
      
      const open = currentPrice;
      const range = currentPrice * (0.005 + Math.random() * 0.015);
      const high = currentPrice + range * Math.random();
      const low = currentPrice - range * Math.random();
      const close = low + (high - low) * Math.random();
      const volume = Math.floor((100000 + Math.random() * 500000) * (basePrice / 50000));
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
    }
    
    return data;
  }
}

// Export singleton instance
export const marketService = new MarketService();
