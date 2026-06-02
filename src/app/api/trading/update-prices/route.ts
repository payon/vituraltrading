import { NextResponse } from 'next/server';
import { marketService } from '@/lib/services/market-service';
import { db } from '@/lib/db';

/**
 * 실시간 가격 업데이트 API
 * POST /api/trading/update-prices
 * 
 * Body:
 * - symbols: 종목 코드 목록 (선택)
 * 
 * KIS/Upbit API를 통해 실시간 시세를 가져와 Portfolio DB를 업데이트합니다.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { symbols } = body as { symbols?: string[] };
    
    // 기본 사용자 조회
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {},
        meta: { message: '사용자가 없습니다.' }
      });
    }
    
    // 포트폴리오에서 종목 조회
    const portfolios = await db.portfolio.findMany({
      where: { userId: user.id }
    });
    
    // 업데이트할 종목 결정
    const symbolsToUpdate = symbols || portfolios.map(p => p.symbol);
    
    if (symbolsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        data: {},
        meta: { message: '업데이트할 종목이 없습니다.' }
      });
    }
    
    const updatedPrices: Record<string, { 
      price: number; 
      changeRate: number; 
      changeAmount: number;
      source: string;
    }> = {};
    
    for (const portfolio of portfolios) {
      const symbol = portfolio.symbol;
      try {
        const isCoin = portfolio.assetType === 'COIN';
        
        let quote;
        if (isCoin) {
          quote = await marketService.getCoinQuote(symbol);
        } else {
          quote = await marketService.getStockQuote(symbol);
        }
        
        if (quote) {
          const source = isCoin 
            ? (marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK')
            : (marketService.isKISAvailable() ? 'KIS' : 'MOCK');
          
          // Portfolio 테이블 업데이트
          await db.portfolio.update({
            where: { id: portfolio.id },
            data: {
              currentPrice: quote.currentPrice,
              evaluatedAmount: quote.currentPrice * portfolio.quantity,
              profitRate: ((quote.currentPrice - portfolio.buyPrice) / portfolio.buyPrice * 100),
              profitAmount: (quote.currentPrice - portfolio.buyPrice) * portfolio.quantity,
            }
          });
          
          updatedPrices[symbol] = {
            price: quote.currentPrice,
            changeRate: quote.changeRate,
            changeAmount: quote.changeAmount,
            source,
          };
        }
      } catch (error) {
        console.error(`Failed to update price for ${symbol}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPrices,
      meta: {
        requested: symbolsToUpdate.length,
        updated: Object.keys(updatedPrices).length,
        kisAvailable: marketService.isKISAvailable(),
        upbitAvailable: marketService.isUpbitAvailable(),
      }
    });
  } catch (error) {
    console.error('Price update error:', error);
    return NextResponse.json(
      { success: false, error: '가격 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
