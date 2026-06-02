import { NextResponse } from 'next/server';
import { marketService } from '@/lib/services/market-service';

/**
 * 주식 시세 조회 API
 * GET /api/market/stocks
 * 
 * Query Parameters:
 * - symbol: 종목 코드 (선택, 단일 조회 시 사용)
 * - symbols: 종목 코드 목록 (선택, 쉼표로 구분)
 * - market: 시장 구분 (KOSPI, KOSDAQ)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols');
    const market = searchParams.get('market');

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
        data: quote,
        source: marketService.isKISAvailable() ? 'KIS' : 'MOCK'
      });
    }

    // 다중 종목 조회
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim());
      const quotes = await marketService.getStockQuotes(symbolList);
      
      return NextResponse.json({
        success: true,
        data: quotes,
        source: marketService.isKISAvailable() ? 'KIS' : 'MOCK'
      });
    }

    // 전체 종목 조회
    const allStocks = await marketService.getAllStocks();
    
    // 시장 필터링
    let filteredStocks = allStocks;
    if (market) {
      filteredStocks = allStocks.filter(s => s.market === market);
    }

    return NextResponse.json({
      success: true,
      data: filteredStocks,
      source: marketService.isKISAvailable() ? 'KIS' : 'MOCK',
      count: filteredStocks.length
    });
  } catch (error) {
    console.error('Stock market API error:', error);
    return NextResponse.json(
      { success: false, error: '주식 시세를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
