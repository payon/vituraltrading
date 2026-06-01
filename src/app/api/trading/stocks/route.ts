import { NextResponse } from 'next/server';
import { marketService } from '@/lib/services/market-service';

/**
 * 주식 종목 리스트 조회 API (실시간 시세 연동)
 * GET /api/trading/stocks
 * 
 * Query Parameters:
 * - search: 검색어
 * - market: 시장 구분 (KOSPI, KOSDAQ)
 * - symbol: 단일 종목 조회
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const market = searchParams.get('market');
    const symbol = searchParams.get('symbol');

    // 단일 종목 조회
    if (symbol) {
      const quote = await marketService.getStockQuote(symbol);
      
      if (!quote) {
        return NextResponse.json(
          { success: false, error: '종목을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          symbol: quote.symbol,
          name: quote.name,
          type: 'STOCK',
          market: quote.market || 'KOSPI',
          sector: quote.sector,
          currentPrice: quote.currentPrice,
          changeRate: quote.changeRate,
          changeAmount: quote.changeAmount,
          volume: quote.volume,
          high52w: quote.high52w,
          low52w: quote.low52w,
          marketCap: quote.marketCap,
          per: quote.per,
          pbr: quote.pbr,
        },
        source: marketService.isKISAvailable() ? 'KIS' : 'MOCK'
      });
    }

    // 검색어가 있는 경우 검색
    if (search) {
      const results = await marketService.searchAssets(search, 'STOCK');
      let filtered = results;
      if (market) {
        filtered = results.filter(s => s.market === market);
      }
      
      return NextResponse.json({
        success: true,
        data: filtered.map(quote => ({
          symbol: quote.symbol,
          name: quote.name,
          type: 'STOCK',
          market: quote.market,
          sector: quote.sector,
          currentPrice: quote.currentPrice,
          changeRate: quote.changeRate,
          changeAmount: quote.changeAmount,
          volume: quote.volume,
          high52w: quote.high52w,
          low52w: quote.low52w,
          marketCap: quote.marketCap,
        })),
        source: marketService.isKISAvailable() ? 'KIS' : 'MOCK'
      });
    }

    // 전체 종목 조회
    let stocks = await marketService.getAllStocks();
    
    // 시장 필터링
    if (market) {
      stocks = stocks.filter(s => s.market === market);
    }

    return NextResponse.json({
      success: true,
      data: stocks.map(quote => ({
        symbol: quote.symbol,
        name: quote.name,
        type: 'STOCK',
        market: quote.market,
        sector: quote.sector,
        currentPrice: quote.currentPrice,
        changeRate: quote.changeRate,
        changeAmount: quote.changeAmount,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        marketCap: quote.marketCap,
        per: quote.per,
        pbr: quote.pbr,
      })),
      source: marketService.isKISAvailable() ? 'KIS' : 'MOCK'
    });
  } catch (error) {
    console.error('Stocks fetch error:', error);
    return NextResponse.json(
      { success: false, error: '주식 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
