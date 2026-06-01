/**
 * 관리자 설정 API
 * - 시스템 설정 조회/수정
 * - 데이터 소스 변경
 * - API 키 관리
 */

import { NextRequest, NextResponse } from 'next/server';

// 인메모리 설정 저장 (임시)
let settings = {
  stockDataSource: 'mock',
  coinDataSource: 'mock',
  kisEnabled: false,
  upbitEnabled: false,
  maintenanceMode: false,
  allowRegistration: true,
  defaultInitialBalance: 10000000,
};

// 시스템 설정 조회
export async function GET() {
  try {
    // API 키는 마스킹해서 반환
    const safeSettings = {
      ...settings,
      id: 'default',
      kisAppKey: null,
      kisAppSecret: null,
      kisAccountNo: null,
      upbitAccessKey: null,
      upbitSecretKey: null,
    };
    
    // 데이터 소스 상태
    const dataSourceStatus = {
      mock: {
        available: true,
        name: '목업 데이터 (2026년 시나리오)',
        description: '개발/테스트용 가상 데이터',
        requiresApiKey: false,
      },
      naver: {
        available: true,
        name: '네이버 금융',
        description: '실시간 한국 주식 (API 키 불필요)',
        requiresApiKey: false,
      },
      kis: {
        available: false,
        name: '한국투자증권 KIS',
        description: '실시간 한국 주식 (API 키 필요)',
        requiresApiKey: true,
      },
      yahoo: {
        available: true,
        name: 'Yahoo Finance',
        description: '해외 주식 (지연 데이터)',
        requiresApiKey: false,
      },
      upbit: {
        available: false,
        name: '업비트',
        description: '실시간 코인 시세',
        requiresApiKey: true,
      },
    };
    
    return NextResponse.json({
      settings: safeSettings,
      dataSourceStatus,
    });
  } catch (error) {
    console.error('Failed to get system settings:', error);
    return NextResponse.json(
      { error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 시스템 설정 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 데이터 소스 업데이트
    if (body.stockDataSource && ['mock', 'naver', 'kis', 'yahoo'].includes(body.stockDataSource)) {
      settings.stockDataSource = body.stockDataSource;
    }
    if (body.coinDataSource && ['mock', 'upbit'].includes(body.coinDataSource)) {
      settings.coinDataSource = body.coinDataSource;
    }
    
    // 시스템 설정
    if (typeof body.maintenanceMode === 'boolean') {
      settings.maintenanceMode = body.maintenanceMode;
    }
    if (typeof body.allowRegistration === 'boolean') {
      settings.allowRegistration = body.allowRegistration;
    }
    if (typeof body.defaultInitialBalance === 'number' && body.defaultInitialBalance > 0) {
      settings.defaultInitialBalance = body.defaultInitialBalance;
    }
    
    // API 키 마스킹
    const safeSettings = {
      ...settings,
      id: 'default',
      kisAppKey: null,
      kisAppSecret: null,
      kisAccountNo: null,
      upbitAccessKey: null,
      upbitSecretKey: null,
    };
    
    return NextResponse.json({
      success: true,
      settings: safeSettings,
      message: '설정이 저장되었습니다.',
    });
  } catch (error) {
    console.error('Failed to update system settings:', error);
    return NextResponse.json(
      { error: '설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
