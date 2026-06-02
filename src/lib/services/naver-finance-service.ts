/**
 * Naver Finance Stock Price Service
 * 네이버 금융 주식 시세 스크래핑 서비스
 * 
 * 실시간 한국 주식 데이터를 네이버 금융에서 가져옵니다.
 * API 키 없이 사용 가능합니다.
 */

interface NaverStockData {
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
  per: number | null;
  pbr: number | null;
  marketCap: number | null;
}

interface NaverChartItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 종목 코드로 네이버 금융 페이지에서 데이터 가져오기
async function fetchNaverStockPage(symbol: string): Promise<string> {
  const paddedSymbol = symbol.padStart(6, '0');
  const url = `https://finance.naver.com/item/main.naver?code=${paddedSymbol}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Naver finance page: ${response.status}`);
  }
  
  return response.text();
}

// HTML에서 주식 데이터 파싱
function parseStockData(html: string, symbol: string): NaverStockData | null {
  try {
    // 종목명 추출
    const nameMatch = html.match(/<h2 class="blind">([^<]+)<\/h2>/);
    const name = nameMatch ? nameMatch[1].replace(/\s*\(주\)\s*/, '').trim() : symbol;
    
    // 현재가 추출 (동적 스크립트에서)
    const priceMatch = html.match(/p_no_today[^>]*>[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    const currentPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
    
    // 전일비 추출
    const changeMatch = html.match(/p_no_yday[^>]*>[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    const changeAmount = changeMatch ? parseInt(changeMatch[1].replace(/,/g, ''), 10) : 0;
    
    // 등락률 추출
    const rateMatch = html.match(/p_no_rate[^>]*>[\s\S]*?<span class="blind">([\d.]+)%<\/span>/);
    const changeRate = rateMatch ? parseFloat(rateMatch[1]) : 0;
    
    // 등락 부호 확인
    const signMatch = html.match(/class="([^"]*)(?:blind\s+)?(?:up|down|flat)([^"]*)"/);
    let sign: NaverStockData['sign'] = 'UNCHANGED';
    if (signMatch) {
      if (signMatch[0].includes('up')) {
        sign = changeRate >= 29 ? 'UPPER_LIMIT' : 'UP';
      } else if (signMatch[0].includes('down')) {
        sign = changeRate <= -29 ? 'LOWER_LIMIT' : 'DOWN';
      }
    }
    
    // 거래량 추출
    const volumeMatch = html.match(/거래량[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    const volume = volumeMatch ? parseInt(volumeMatch[1].replace(/,/g, ''), 10) : 0;
    
    // 전일 종가 (이전 종가)
    const previousClose = currentPrice - (sign === 'UP' || sign === 'UPPER_LIMIT' ? changeAmount : -changeAmount);
    
    // 시가, 고가, 저가 추출
    const dayTableMatch = html.match(/<table class="no_info[\s\S]*?<\/table>/);
    let openPrice = currentPrice;
    let highPrice = currentPrice;
    let lowPrice = currentPrice;
    
    if (dayTableMatch) {
      const dayHtml = dayTableMatch[0];
      
      const openMatch = dayHtml.match(/시가[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
      openPrice = openMatch ? parseInt(openMatch[1].replace(/,/g, ''), 10) : currentPrice;
      
      const highMatch = dayHtml.match(/고가[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
      highPrice = highMatch ? parseInt(highMatch[1].replace(/,/g, ''), 10) : currentPrice;
      
      const lowMatch = dayHtml.match(/저가[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
      lowPrice = lowMatch ? parseInt(lowMatch[1].replace(/,/g, ''), 10) : currentPrice;
    }
    
    // PER, PBR 추출
    const perMatch = html.match(/PER[\s\S]*?<em[^>]*>([\d.]+)<\/em>/);
    const per = perMatch ? parseFloat(perMatch[1]) : null;
    
    const pbrMatch = html.match(/PBR[\s\S]*?<em[^>]*>([\d.]+)<\/em>/);
    const pbr = pbrMatch ? parseFloat(pbrMatch[1]) : null;
    
    return {
      symbol: symbol.padStart(6, '0'),
      name,
      currentPrice,
      changeAmount,
      changeRate,
      sign,
      volume,
      tradeValue: volume * currentPrice,
      openPrice,
      highPrice,
      lowPrice,
      previousClose,
      per,
      pbr,
      marketCap: null,
    };
  } catch (error) {
    console.error('Error parsing Naver stock data:', error);
    return null;
  }
}

// 네이버 금융 JSON API 사용 (더 안정적인 방식)
async function fetchNaverSiseApi(symbol: string): Promise<NaverStockData | null> {
  const paddedSymbol = symbol.padStart(6, '0');
  
  try {
    // 네이버 금융 시세 API
    const url = `https://api.finance.naver.com/siseJson.naver?symbol=${paddedSymbol}&requestType=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com/',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const text = await response.text();
    
    // JSON 형태로 파싱 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      
      if (data.resultCode === 'success' && data.result) {
        const result = data.result;
        
        let sign: NaverStockData['sign'] = 'UNCHANGED';
        if (result.risySign === '1') sign = 'UPPER_LIMIT';
        else if (result.risySign === '2') sign = 'UP';
        else if (result.risySign === '3') sign = 'UNCHANGED';
        else if (result.risySign === '4') sign = 'DOWN';
        else if (result.risySign === '5') sign = 'LOWER_LIMIT';
        
        return {
          symbol: paddedSymbol,
          name: result.name || symbol,
          currentPrice: parseInt(result.nowVal, 10) || 0,
          changeAmount: parseInt(result.risyVal, 10) || 0,
          changeRate: parseFloat(result.risyRate) || 0,
          sign,
          volume: parseInt(result.accumVol, 10) || 0,
          tradeValue: parseInt(result.accumAmt, 10) || 0,
          openPrice: parseInt(result.openVal, 10) || 0,
          highPrice: parseInt(result.highVal, 10) || 0,
          lowPrice: parseInt(result.lowVal, 10) || 0,
          previousClose: parseInt(result.prevVal, 10) || 0,
          per: parseFloat(result.per) || null,
          pbr: parseFloat(result.pbr) || null,
          marketCap: parseInt(result.markCap, 10) || null,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Naver API error:', error);
    return null;
  }
}

/**
 * 네이버 금융에서 주식 가격 가져오기
 */
export async function getNaverStockPrice(symbol: string): Promise<NaverStockData | null> {
  try {
    // 먼저 JSON API 시도
    const apiData = await fetchNaverSiseApi(symbol);
    if (apiData && apiData.currentPrice > 0) {
      return apiData;
    }
    
    // JSON API 실패 시 웹 스크래핑
    const html = await fetchNaverStockPage(symbol);
    return parseStockData(html, symbol);
  } catch (error) {
    console.error(`Failed to fetch Naver stock price for ${symbol}:`, error);
    return null;
  }
}

/**
 * 여러 종목 가격 가져오기
 */
export async function getNaverStockPrices(symbols: string[]): Promise<NaverStockData[]> {
  const results: NaverStockData[] = [];
  
  // 병렬로 요청하되 너무 많으면 분할
  const batchSize = 5;
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(symbol => getNaverStockPrice(symbol));
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter((r): r is NaverStockData => r !== null));
    
    // 요청 간 지연 (부하 방지)
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * 네이버 금융에서 일봉 차트 데이터 가져오기
 */
export async function getNaverDailyChart(
  symbol: string,
  days: number = 365
): Promise<NaverChartItem[]> {
  const paddedSymbol = symbol.padStart(6, '0');
  
  try {
    const url = `https://api.finance.naver.com/siseJson.naver?symbol=${paddedSymbol}&requestType=2&startDate=&endDate=&count=${days}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com/',
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const text = await response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      
      if (data.resultCode === 'success' && Array.isArray(data.result)) {
        return data.result.map((item: Record<string, unknown>) => ({
          date: String(item.date || ''),
          open: parseInt(String(item.open), 10) || 0,
          high: parseInt(String(item.high), 10) || 0,
          low: parseInt(String(item.low), 10) || 0,
          close: parseInt(String(item.close), 10) || 0,
          volume: parseInt(String(item.volume), 10) || 0,
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch Naver chart data:', error);
    return [];
  }
}

// Export types
export type { NaverStockData, NaverChartItem };
