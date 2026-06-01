/**
 * Yahoo Finance API Service
 * Yahoo Finance API 연동 서비스 (해외 주식, 지수 백업)
 * 
 * Uses RapidAPI or direct Yahoo Finance API
 */

// Types for Yahoo Finance API responses
interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  currency?: string;
  exchange?: string;
}

interface YahooChartCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Export types for our application
export interface GlobalQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  sign: 'UP' | 'DOWN' | 'UNCHANGED';
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  high52w: number;
  low52w: number;
  marketCap: number | null;
  currency: string;
  exchange: string;
}

export interface GlobalChartData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Popular indices symbols
export const POPULAR_INDICES = {
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  DOW: '^DJI',
  RUSSELL: '^RUT',
  VIX: '^VIX',
};

// Popular US stocks
export const POPULAR_US_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B',
  'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'BAC', 'ADBE',
  'CRM', 'NFLX', 'CMCSA', 'PFE', 'KO', 'PEP', 'TMO', 'ABT', 'COST',
  'AVGO', 'MRK', 'ACN', 'CSCO', 'NKE', 'MDT', 'DHR', 'TXN', 'QCOM',
];

class YahooFinanceService {
  private apiKey: string;
  private useRapidAPI: boolean;
  private rapidApiHost: string = 'yahoo-finance15.p.rapidapi.com';
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.YAHOO_FINANCE_API_KEY || '';
    this.useRapidAPI = !!this.apiKey;
    this.baseUrl = this.useRapidAPI
      ? `https://${this.rapidApiHost}`
      : 'https://query1.finance.yahoo.com';
  }

  /**
   * Check if Yahoo Finance API is configured
   */
  isConfigured(): boolean {
    return true; // Yahoo Finance has public endpoints
  }

  /**
   * Make API request
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.useRapidAPI) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] = this.rapidApiHost;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get quote for a single symbol using Yahoo Finance v8 API
   */
  async getQuote(symbol: string): Promise<GlobalQuote> {
    try {
      // Use Yahoo Finance v8 chart API which is publicly accessible
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch quote for ${symbol}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        throw new Error(`No data found for ${symbol}`);
      }

      const meta = result.meta || {};
      const quote = result.indicators?.quote?.[0] || {};
      const timestamp = result.timestamp?.[result.timestamp.length - 1] || Date.now() / 1000;
      
      const currentPrice = meta.regularMarketPrice || quote.close?.[quote.close.length - 1] || 0;
      const previousClose = meta.chartPreviousClose || meta.previousClose || quote.open?.[0] || currentPrice;
      const change = currentPrice - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      return {
        symbol: meta.symbol || symbol,
        name: meta.shortName || meta.symbol || symbol,
        currentPrice,
        changeAmount: change,
        changeRate: changePercent,
        sign: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'UNCHANGED',
        volume: quote.volume?.[quote.volume.length - 1] || 0,
        openPrice: quote.open?.[quote.open.length - 1] || currentPrice,
        highPrice: quote.high?.[quote.high.length - 1] || currentPrice,
        lowPrice: quote.low?.[quote.low.length - 1] || currentPrice,
        previousClose,
        high52w: meta.fiftyTwoWeekHigh || currentPrice * 1.2,
        low52w: meta.fiftyTwoWeekLow || currentPrice * 0.8,
        marketCap: meta.marketCap || null,
        currency: meta.currency || 'USD',
        exchange: meta.exchangeName || 'Unknown',
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols: string[]): Promise<GlobalQuote[]> {
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          return await this.getQuote(symbol);
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
          return null;
        }
      })
    );

    return quotes.filter((q): q is GlobalQuote => q !== null);
  }

  /**
   * Get chart data
   */
  async getChartData(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1w' | '1mo' = '1d',
    range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1y'
  ): Promise<GlobalChartData[]> {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data for ${symbol}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        throw new Error(`No chart data found for ${symbol}`);
      }

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};

      return timestamps
        .map((ts: number, i: number) => ({
          timestamp: new Date(ts * 1000),
          open: quote.open?.[i] || 0,
          high: quote.high?.[i] || 0,
          low: quote.low?.[i] || 0,
          close: quote.close?.[i] || 0,
          volume: quote.volume?.[i] || 0,
        }))
        .filter((d) => d.close > 0); // Filter out invalid data
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Search for symbols
   */
  async searchSymbols(keyword: string): Promise<Array<{
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }>> {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(keyword)}&quotesCount=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed for ${keyword}`);
      }

      const data = await response.json();
      
      return (data.quotes || []).map((q: {
        symbol: string;
        shortname?: string;
        longname?: string;
        exchange: string;
        quoteType: string;
      }) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType,
      }));
    } catch (error) {
      console.error(`Error searching for ${keyword}:`, error);
      return [];
    }
  }

  /**
   * Get popular indices prices
   */
  async getIndicesPrices(): Promise<GlobalQuote[]> {
    return this.getQuotes(Object.values(POPULAR_INDICES));
  }

  /**
   * Get popular US stocks prices
   */
  async getPopularStocksPrices(): Promise<GlobalQuote[]> {
    return this.getQuotes(POPULAR_US_STOCKS);
  }
}

// Export singleton instance
export const yahooFinanceService = new YahooFinanceService();
