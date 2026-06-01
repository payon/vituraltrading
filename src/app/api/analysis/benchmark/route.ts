import { NextResponse } from 'next/server';

// 벤치마크 지수 데이터
// 실제 환경에서는 외부 API에서 데이터를 가져와야 함
export async function GET() {
  try {
    const today = new Date();
    
    // 코스피 지수 데이터 (최근 30일)
    const kospiData = generateBenchmarkData(today, 2600, 0.0003, 'KOSPI');
    
    // 코스닥 지수 데이터 (최근 30일)
    const kosdaqData = generateBenchmarkData(today, 850, 0.0005, 'KOSDAQ');
    
    // S&P500 지수 데이터 (최근 30일)
    const sp500Data = generateBenchmarkData(today, 5200, 0.0004, 'S&P500');

    // 현재 지수 정보
    const currentIndices = {
      kospi: {
        name: '코스피',
        value: kospiData[kospiData.length - 1].value,
        change: kospiData[kospiData.length - 1].change,
        changeRate: kospiData[kospiData.length - 1].changeRate,
      },
      kosdaq: {
        name: '코스닥',
        value: kosdaqData[kosdaqData.length - 1].value,
        change: kosdaqData[kosdaqData.length - 1].change,
        changeRate: kosdaqData[kosdaqData.length - 1].changeRate,
      },
      sp500: {
        name: 'S&P500',
        value: sp500Data[sp500Data.length - 1].value,
        change: sp500Data[sp500Data.length - 1].change,
        changeRate: sp500Data[sp500Data.length - 1].changeRate,
      },
    };

    // 기간별 수익률
    const periodReturns = {
      kospi: {
        '1w': calculatePeriodReturn(kospiData, 7),
        '1m': calculatePeriodReturn(kospiData, 30),
        '3m': calculatePeriodReturn(kospiData, 30) * 3, // 근사치
        '1y': calculatePeriodReturn(kospiData, 30) * 12, // 근사치
      },
      kosdaq: {
        '1w': calculatePeriodReturn(kosdaqData, 7),
        '1m': calculatePeriodReturn(kosdaqData, 30),
        '3m': calculatePeriodReturn(kosdaqData, 30) * 3,
        '1y': calculatePeriodReturn(kosdaqData, 30) * 12,
      },
      sp500: {
        '1w': calculatePeriodReturn(sp500Data, 7),
        '1m': calculatePeriodReturn(sp500Data, 30),
        '3m': calculatePeriodReturn(sp500Data, 30) * 3,
        '1y': calculatePeriodReturn(sp500Data, 30) * 12,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        indices: currentIndices,
        historicalData: {
          kospi: kospiData,
          kosdaq: kosdaqData,
          sp500: sp500Data,
        },
        periodReturns,
      }
    });
  } catch (error) {
    console.error('Benchmark fetch error:', error);
    return NextResponse.json(
      { success: false, error: '벤치마크 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 벤치마크 데이터 생성
function generateBenchmarkData(
  today: Date,
  baseValue: number,
  volatility: number,
  _indexName: string
) {
  const data: Array<{
    date: string;
    value: number;
    change: number;
    changeRate: number;
    cumulativeReturn: number;
  }> = [];
  
  let currentValue = baseValue;
  const baseValueForReturn = baseValue;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 랜덤 변동 생성 (변동성 반영)
    const randomChange = (Math.random() - 0.48) * volatility * baseValue;
    const previousValue = currentValue;
    currentValue = currentValue + randomChange;
    
    // 최소값 보장
    currentValue = Math.max(currentValue, baseValue * 0.8);
    
    const change = currentValue - previousValue;
    const changeRate = (change / previousValue) * 100;
    const cumulativeReturn = ((currentValue - baseValueForReturn) / baseValueForReturn) * 100;
    
    data.push({
      date: dateStr,
      value: Number(currentValue.toFixed(2)),
      change: Number(change.toFixed(2)),
      changeRate: Number(changeRate.toFixed(2)),
      cumulativeReturn: Number(cumulativeReturn.toFixed(2)),
    });
  }
  
  return data;
}

// 기간별 수익률 계산
function calculatePeriodReturn(data: Array<{ value: number }>, days: number) {
  if (data.length < days) return 0;
  
  const startValue = data[data.length - days].value;
  const endValue = data[data.length - 1].value;
  
  return ((endValue - startValue) / startValue) * 100;
}
