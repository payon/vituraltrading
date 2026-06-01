/**
 * Korea Investment & Securities (KIS) API Service
 * 한국투자증권 Open API 연동 서비스
 * 
 * API Documentation: https://apiportal.koreainvestment.com/
 */

// Types for KIS API responses
interface KISTokenResponse {
  access_token: string;
  access_token_token_expired: string;
  token_type: string;
  expires_in: number;
}

interface KISStockPrice {
  stck_shrn_iscd: string;      // 종목코드
  stck_prpr: string;           // 현재가
  prdy_vrss: string;           // 전일대비
  prdy_vrss_sign: string;      // 전일대비부호 (1:상한, 2:상승, 3:보합, 4:하락, 5:하한)
  prdy_ctrt: string;           // 전일대비율
  acml_vol: string;            // 누적거래량
  acml_tr_pbmn: string;        // 누적거래대금
  hts_kor_isnm: string;        // 한글종목명
  stck_mxpr: string;           // 상한가
  stck_llam: string;           // 하한가
  stck_oprc: string;           // 시가
  stck_hgpr: string;           // 고가
  stck_lwpr: string;           // 저가
  stck_sdpr: string;           // 기준가
  stck_prdy_clpr: string;      // 전일종가
  per: string;                 // PER
  pbr: string;                 // PBR
  stck_mxpr_date: string;      // 52주최고가일자
  stck_llam_date: string;      // 52주최저가일자
  w52_hgpr: string;            // 52주최고가
  w52_lwpr: string;            // 52주최저가
}

interface KISChartItem {
  stck_bsop_date: string;      // 주식영업일자
  stck_clpr: string;           // 주식종가
  stck_oprc: string;           // 주식시가
  stck_hgpr: string;           // 주식고가
  stck_lwpr: string;           // 주식저가
  acml_vol: string;            // 누적거래량
  acml_tr_pbmn: string;        // 누적거래대금
}

interface KISMinuteChartItem {
  stck_bsop_date: string;      // 주식영업일자
  stck_cntg_hour: string;      // 주식체결시간
  stck_prpr: string;           // 주식현재가
  stck_oprc: string;           // 주식시가
  stck_hgpr: string;           // 주식고가
  stck_lwpr: string;           // 주식저가
  cntg_vol: string;            // 체결거래량
  acml_tr_pbmn: string;        // 누적거래대금
}

// Export types for our application
export interface StockQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  sign: 'UPPER_LIMIT' | 'UP' | 'UNCHANGED' | 'DOWN' | 'LOWER_LIMIT';
  volume: number;
  tradeValue: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  upperLimit: number;
  lowerLimit: number;
  per: number | null;
  pbr: number | null;
  high52w: number;
  low52w: number;
}

export interface ChartData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Sign mapping
const SIGN_MAP: Record<string, StockQuote['sign']> = {
  '1': 'UPPER_LIMIT',
  '2': 'UP',
  '3': 'UNCHANGED',
  '4': 'DOWN',
  '5': 'LOWER_LIMIT',
};

class KISService {
  private appKey: string;
  private appSecret: string;
  private accountNo: string;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private usePaperTrading: boolean;

  constructor() {
    // Check if using paper trading
    this.usePaperTrading = process.env.KIS_APP_KEY_PAPER ? true : false;
    
    if (this.usePaperTrading) {
      this.appKey = process.env.KIS_APP_KEY_PAPER || '';
      this.appSecret = process.env.KIS_APP_SECRET_PAPER || '';
      this.accountNo = process.env.KIS_ACCOUNT_NO_PAPER || '';
      this.baseUrl = process.env.KIS_BASE_URL_PAPER || 'https://openapivts.koreainvestment.com:29443';
    } else {
      this.appKey = process.env.KIS_APP_KEY || '';
      this.appSecret = process.env.KIS_APP_SECRET || '';
      this.accountNo = process.env.KIS_ACCOUNT_NO || '';
      this.baseUrl = process.env.KIS_BASE_URL || 'https://openapi.koreainvestment.com:9443';
    }
  }

  /**
   * Check if KIS API is configured
   */
  isConfigured(): boolean {
    return !!(this.appKey && this.appSecret);
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    if (!this.isConfigured()) {
      throw new Error('KIS API credentials not configured');
    }

    const response = await fetch(`${this.baseUrl}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: this.appKey,
        appsecret: this.appSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`KIS token request failed: ${response.status}`);
    }

    const data: KISTokenResponse = await response.json();
    this.token = data.access_token;
    // Set expiry 5 minutes before actual expiry
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
    
    return this.token;
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    trId: string,
    params: Record<string, string>
  ): Promise<T> {
    const token = await this.getAccessToken();
    
    const url = new URL(`${this.baseUrl}/uapi/domestic-stock/v1/quotations/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'appkey': this.appKey,
        'appsecret': this.appSecret,
        'tr_id': trId,
        'content-type': 'application/json; charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KIS API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Check for API error messages
    if (data.rt_cd !== '0') {
      throw new Error(`KIS API error: ${data.msg1}`);
    }

    return data;
  }

  /**
   * Get stock current price (현재가 조회)
   * FID_COND_MRKT_DIV_CODE: J (KOSPI/KOSDAQ)
   * FID_INPUT_ISCD: 종목코드 (6자리)
   */
  async getStockPrice(symbol: string): Promise<StockQuote> {
    if (!this.isConfigured()) {
      throw new Error('KIS API not configured');
    }

    const response = await this.makeRequest<{
      output: KISStockPrice;
    }>('inquire-price', 'FHKST01010100', {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol.padStart(6, '0'),
    });

    const data = response.output;
    
    return {
      symbol: data.stck_shrn_iscd,
      name: data.hts_kor_isnm,
      currentPrice: parseInt(data.stck_prpr, 10),
      changeAmount: parseInt(data.prdy_vrss, 10),
      changeRate: parseFloat(data.prdy_ctrt),
      sign: SIGN_MAP[data.prdy_vrss_sign] || 'UNCHANGED',
      volume: parseInt(data.acml_vol, 10),
      tradeValue: parseInt(data.acml_tr_pbmn, 10),
      openPrice: parseInt(data.stck_oprc, 10),
      highPrice: parseInt(data.stck_hgpr, 10),
      lowPrice: parseInt(data.stck_lwpr, 10),
      previousClose: parseInt(data.stck_prdy_clpr, 10),
      upperLimit: parseInt(data.stck_mxpr, 10),
      lowerLimit: parseInt(data.stck_llam, 10),
      per: data.per ? parseFloat(data.per) : null,
      pbr: data.pbr ? parseFloat(data.pbr) : null,
      high52w: parseInt(data.w52_hgpr, 10),
      low52w: parseInt(data.w52_lwpr, 10),
    };
  }

  /**
   * Get multiple stock prices
   */
  async getStockPrices(symbols: string[]): Promise<StockQuote[]> {
    const results: StockQuote[] = [];
    
    // KIS API doesn't support batch requests, so we need to make individual requests
    // But we can do them in parallel
    const promises = symbols.map(async (symbol) => {
      try {
        return await this.getStockPrice(symbol);
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return null;
      }
    });

    const quotes = await Promise.all(promises);
    return quotes.filter((q): q is StockQuote => q !== null);
  }

  /**
   * Get daily chart data (일봉 차트)
   */
  async getDailyChart(
    symbol: string,
    startDate?: string,
    endDate?: string,
    periodCode: string = 'D' // D: 일봉, W: 주봉, M: 월봉, Y: 년봉
  ): Promise<ChartData[]> {
    if (!this.isConfigured()) {
      throw new Error('KIS API not configured');
    }

    const today = new Date();
    const defaultStartDate = startDate || 
      new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        .toISOString().slice(0, 10).replace(/-/g, '');
    const defaultEndDate = endDate || today.toISOString().slice(0, 10).replace(/-/g, '');

    const response = await this.makeRequest<{
      output2: KISChartItem[];
    }>('inquire-daily-itemchartprice', 'FHKST03010100', {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol.padStart(6, '0'),
      FID_INPUT_DATE_1: defaultStartDate,
      FID_INPUT_DATE_2: defaultEndDate,
      FID_PERIOD_DIV_CODE: periodCode,
      FID_ORG_ADJ_PRC: '0', // 0: 수정주가, 1: 원주가
    });

    return response.output2.map((item) => ({
      timestamp: this.parseDate(item.stck_bsop_date),
      open: parseInt(item.stck_oprc, 10),
      high: parseInt(item.stck_hgpr, 10),
      low: parseInt(item.stck_lwpr, 10),
      close: parseInt(item.stck_clpr, 10),
      volume: parseInt(item.acml_vol, 10),
    }));
  }

  /**
   * Get minute chart data (분봉 차트)
   */
  async getMinuteChart(
    symbol: string,
    minute: '1' | '3' | '5' | '10' | '15' | '30' | '60' = '1'
  ): Promise<ChartData[]> {
    if (!this.isConfigured()) {
      throw new Error('KIS API not configured');
    }

    const response = await this.makeRequest<{
      output2: KISMinuteChartItem[];
    }>('inquire-time-itemchartprice', 'FHKST03010200', {
      FID_ETC_CLS_CODE: '',
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol.padStart(6, '0'),
      FID_INPUT_HOUR_1: '100000', // 시작시간
      FID_PW_DATA_INCU_YN: '1', // 과거데이터 포함 여부
    });

    return response.output2.map((item) => ({
      timestamp: this.parseDateTime(item.stck_bsop_date, item.stck_cntg_hour),
      open: parseInt(item.stck_oprc, 10),
      high: parseInt(item.stck_hgpr, 10),
      low: parseInt(item.stck_lwpr, 10),
      close: parseInt(item.stck_prpr, 10),
      volume: parseInt(item.cntg_vol, 10),
    }));
  }

  /**
   * Search stocks by name or code
   */
  async searchStocks(keyword: string): Promise<Array<{
    symbol: string;
    name: string;
    market: string;
  }>> {
    if (!this.isConfigured()) {
      throw new Error('KIS API not configured');
    }

    const response = await this.makeRequest<{
      output: Array<{
        std_pdno: string;      // 표준상품번호
        prdt_name: string;     // 상품명
        pdno: string;          // 상품번호
      }>;
    }>('inquire-search', 'CTPF1604R', {
      PRDT_TYPE_CD: '300', // 주식
      PDNO: '',
      PRDT_NAME: keyword,
      FMT_OFL_YN: 'Y',
      ICLD_INFR_YN: 'Y',
      PAGE_COUNT: '50',
      PAGE_NO: '1',
    });

    return response.output?.map((item) => ({
      symbol: item.pdno,
      name: item.prdt_name,
      market: 'KOSPI/KOSDAQ',
    })) || [];
  }

  /**
   * Parse date string (YYYYMMDD) to Date
   */
  private parseDate(dateStr: string): Date {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    return new Date(year, month, day);
  }

  /**
   * Parse date and time string to Date
   */
  private parseDateTime(dateStr: string, timeStr: string): Date {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    const hour = parseInt(timeStr.slice(0, 2), 10);
    const minute = parseInt(timeStr.slice(2, 4), 10);
    const second = parseInt(timeStr.slice(4, 6), 10);
    return new Date(year, month, day, hour, minute, second);
  }
}

// Export singleton instance
export const kisService = new KISService();
