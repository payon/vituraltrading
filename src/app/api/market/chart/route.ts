import { NextResponse } from 'next/server';
import { marketService } from '@/lib/services/market-service';

/**
 * 차트 데이터 조회 API
 * GET /api/market/chart
 * 
 * Query Parameters:
 * - symbol: 종목 코드 (필수)
 * - type: 자산 유형 (stock, coin, global) - 기본값: symbol 형식으로 자동 감지
 * - interval: 차트 간격 (1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M) - 기본값: 1d
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');
    const interval = searchParams.get('interval') || '1d';

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: '종목 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 자산 유형 자동 감지
    let assetType = type;
    if (!assetType) {
      if (symbol.startsWith('KRW-') || symbol.includes('-')) {
        assetType = 'coin';
      } else if (/^\d{6}$/.test(symbol)) {
        assetType = 'stock';
      } else if (/^[A-Z]{1,5}$/.test(symbol)) {
        assetType = 'stock'; // 기본값은 주식으로 처리
      } else {
        assetType = 'stock';
      }
    }

    let chartData;
    let source = 'MOCK';

    if (assetType === 'coin') {
      chartData = await marketService.getCoinChart(symbol, interval);
      source = marketService.isUpbitAvailable() ? 'UPBIT' : 'MOCK';
    } else {
      chartData = await marketService.getStockChart(symbol, interval);
      source = marketService.isKISAvailable() ? 'KIS' : 'MOCK';
    }

    return NextResponse.json({
      success: true,
      data: chartData,
      meta: {
        symbol,
        type: assetType,
        interval,
        source,
        count: chartData.length
      }
    });
  } catch (error) {
    console.error('Chart data API error:', error);
    return NextResponse.json(
      { success: false, error: '차트 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
