/**
 * 네이버 금융 주식 시세 API (백엔드 프록시)
 * 클라이언트에서 직접 호출하면 CORS 문제가 발생하므로 백엔드에서 프록시
 */

import { NextRequest, NextResponse } from 'next/server';

interface NaverStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  sign: 'UPPER_LIMIT' | 'UP' | 'UNCHANGED' | 'DOWN' | 'LOWER_LIMIT';
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  per: number | null;
  pbr: number | null;
}

// 종목명 매핑
const STOCK_NAMES: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '373220': 'LG에너지솔루션',
  '207940': '삼성바이오로직스',
  '005380': '현대차',
  '035420': 'NAVER',
  '051910': 'LG화학',
  '006400': '삼성SDI',
  '035720': '카카오',
  '086790': '하나금융지주',
  '042660': '두산에너빌리티',
  '247540': '에코프로비엠',
  '068270': '셀트리온',
  '009150': '삼성전기',
  '018260': '삼성에스디에스',
  '028260': '삼성물산',
  '055550': '신한지주',
  '105560': 'KB금융',
  '034730': 'SK',
  '032830': '삼성생명',
};

// 네이버 금융에서 실시간 시세 가져오기
async function fetchNaverStockPrice(symbol: string): Promise<NaverStockData | null> {
  const paddedSymbol = symbol.padStart(6, '0');
  
  try {
    // 네이버 금융 현재가 API
    const url = `https://finance.naver.com/item/main.naver?code=${paddedSymbol}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    
    if (!response.ok) {
      console.error(`Naver fetch failed: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // 현재가 파싱 - 여러 패턴 시도
    let currentPrice = 0;
    
    // 패턴 1
    const priceMatch1 = html.match(/p_no_today[^>]*>[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    if (priceMatch1) {
      currentPrice = parseInt(priceMatch1[1].replace(/,/g, ''), 10);
    }
    
    // 패턴 2
    if (currentPrice === 0) {
      const priceMatch2 = html.match(/<em class="no_up[^>]*>[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
      if (priceMatch2) {
        currentPrice = parseInt(priceMatch2[1].replace(/,/g, ''), 10);
      }
    }
    
    // 패턴 3 - JSON 데이터에서 추출
    if (currentPrice === 0) {
      const jsonMatch = html.match(/var\s+_today\s*=\s*(\{[^}]+\})/);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1].replace(/'/g, '"');
          const data = JSON.parse(jsonStr);
          if (data.nowVal) {
            currentPrice = parseInt(data.nowVal, 10);
          }
        } catch {
          // ignore
        }
      }
    }
    
    if (currentPrice === 0) {
      console.error(`Failed to parse price for ${symbol}`);
      return null;
    }
    
    // 전일비
    let changeAmount = 0;
    const changeMatch = html.match(/p_no_yday[^>]*>[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    if (changeMatch) {
      changeAmount = parseInt(changeMatch[1].replace(/,/g, ''), 10);
    }
    
    // 등락률
    let changeRate = 0;
    const rateMatch = html.match(/p_no_rate[^>]*>[\s\S]*?<span class="blind">([\d.]+)%<\/span>/);
    if (rateMatch) {
      changeRate = parseFloat(rateMatch[1]);
    }
    
    // 등락 부호 확인
    let sign: NaverStockData['sign'] = 'UNCHANGED';
    if (html.includes('class="no_up"') || html.includes('class="blind up"')) {
      sign = 'UP';
    } else if (html.includes('class="no_down"') || html.includes('class="blind down"')) {
      sign = 'DOWN';
    }
    
    // 거래량
    let volume = 0;
    const volumeMatch = html.match(/거래량[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    if (volumeMatch) {
      volume = parseInt(volumeMatch[1].replace(/,/g, ''), 10);
    }
    
    // 시가, 고가, 저가
    let openPrice = currentPrice;
    let highPrice = currentPrice;
    let lowPrice = currentPrice;
    
    const openMatch = html.match(/시가[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    if (openMatch) openPrice = parseInt(openMatch[1].replace(/,/g, ''), 10);
    
    const highMatch = html.match(/고가[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    if (highMatch) highPrice = parseInt(highMatch[1].replace(/,/g, ''), 10);
    
    const lowMatch = html.match(/저가[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    if (lowMatch) lowPrice = parseInt(lowMatch[1].replace(/,/g, ''), 10);
    
    return {
      symbol: paddedSymbol,
      name: STOCK_NAMES[symbol] || symbol,
      currentPrice,
      changeAmount,
      changeRate,
      sign,
      volume,
      openPrice,
      highPrice,
      lowPrice,
      previousClose: sign === 'DOWN' ? currentPrice + changeAmount : currentPrice - changeAmount,
      per: null,
      pbr: null,
    };
  } catch (error) {
    console.error(`Failed to fetch Naver price for ${symbol}:`, error);
    return null;
  }
}

// GET 요청 처리
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');
  
  try {
    if (symbol) {
      // 단일 종목
      const data = await fetchNaverStockPrice(symbol);
      if (!data) {
        return NextResponse.json({ error: 'Failed to fetch stock price' }, { status: 500 });
      }
      return NextResponse.json(data);
    }
    
    if (symbols) {
      // 여러 종목
      const symbolList = symbols.split(',').map(s => s.trim());
      const results = await Promise.all(
        symbolList.map(s => fetchNaverStockPrice(s))
      );
      return NextResponse.json(results.filter((r): r is NaverStockData => r !== null));
    }
    
    return NextResponse.json({ error: 'Symbol parameter required' }, { status: 400 });
  } catch (error) {
    console.error('Naver API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
