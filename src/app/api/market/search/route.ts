import { NextResponse } from 'next/server';
import { marketService, AssetType } from '@/lib/services/market-service';

/**
 * 종목 검색 API
 * GET /api/market/search
 * 
 * Query Parameters:
 * - q: 검색어 (필수)
 * - type: 자산 유형 필터 (stock, coin, global) - 선택
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const type = searchParams.get('type') as AssetType | null;

    if (!query) {
      return NextResponse.json(
        { success: false, error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    const results = await marketService.searchAssets(query, type || undefined);

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        type: type || 'all',
        count: results.length
      }
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: '검색에 실패했습니다.' },
      { status: 500 }
    );
  }
}
