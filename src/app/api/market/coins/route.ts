import { NextResponse } from 'next/server';
import { marketService } from '@/lib/services/market-service';

/**
 * 코인 시세 조회 API
 * GET /api/market/coins
 * 
 * Query Parameters:
 * - symbol: 코인 코드 (선택, 단일 조회 시 사용, 예: KRW-BTC, BTC)
 * - symbols: 코인 코드 목록 (선택, 쉼표로 구분)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols');

    // 단일 코인 조회
    if (symbol) {
      const quote = await marketService.getCoinQuote(symbol);
      
      if (!quote) {
        return NextResponse.json(
          { success: false, error: '코인을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: quote,
        source: marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK'
      });
    }

    // 다중 코인 조회
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim());
      const quotes = await marketService.getCoinQuotes(symbolList);
      
      return NextResponse.json({
        success: true,
        data: quotes,
        source: marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK'
      });
    }

    // 전체 코인 조회
    const allCoins = await marketService.getAllCoins();

    return NextResponse.json({
      success: true,
      data: allCoins,
      source: marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK',
      count: allCoins.length
    });
  } catch (error) {
    console.error('Coin market API error:', error);
    return NextResponse.json(
      { success: false, error: '코인 시세를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
