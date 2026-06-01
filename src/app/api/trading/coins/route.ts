import { NextResponse } from 'next/server';
import { marketService } from '@/lib/services/market-service';

/**
 * 코인 종목 리스트 조회 API (업비트 실시간 시세 연동)
 * GET /api/trading/coins
 * 
 * Query Parameters:
 * - search: 검색어
 * - symbol: 단일 코인 조회
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const symbol = searchParams.get('symbol');

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
        data: {
          symbol: quote.symbol,
          name: quote.name,
          type: 'COIN',
          market: quote.market || 'UPBIT',
          currentPrice: quote.currentPrice,
          changeRate: quote.changeRate,
          changeAmount: quote.changeAmount,
          volume: quote.volume,
          high52w: quote.high52w,
          low52w: quote.low52w,
          marketCap: quote.marketCap,
          warning: quote.warning,
        },
        source: marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK'
      });
    }

    // 검색어가 있는 경우 검색
    if (search) {
      const results = await marketService.searchAssets(search, 'COIN');
      
      return NextResponse.json({
        success: true,
        data: results.map(quote => ({
          symbol: quote.symbol,
          name: quote.name,
          type: 'COIN',
          market: quote.market,
          currentPrice: quote.currentPrice,
          changeRate: quote.changeRate,
          changeAmount: quote.changeAmount,
          volume: quote.volume,
          high52w: quote.high52w,
          low52w: quote.low52w,
          marketCap: quote.marketCap,
        })),
        source: marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK'
      });
    }

    // 전체 코인 조회
    const coins = await marketService.getAllCoins();

    return NextResponse.json({
      success: true,
      data: coins.map(quote => ({
        symbol: quote.symbol,
        name: quote.name,
        type: 'COIN',
        market: quote.market,
        currentPrice: quote.currentPrice,
        changeRate: quote.changeRate,
        changeAmount: quote.changeAmount,
        volume: quote.volume,
        high52w: quote.high52w,
        low52w: quote.low52w,
        marketCap: quote.marketCap,
        warning: quote.warning,
      })),
      source: marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK'
    });
  } catch (error) {
    console.error('Coins fetch error:', error);
    return NextResponse.json(
      { success: false, error: '코인 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
