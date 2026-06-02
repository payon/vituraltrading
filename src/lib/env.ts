/**
 * 환경변수 검증 및 관리
 * - 필수 환경변수 검증
 * - 타입 안전한 환경변수 접근
 * - 기본값 제공
 */

import { z } from 'zod';

// 환경변수 스키마 정의
const envSchema = z.object({
  // 데이터베이스
  DATABASE_URL: z.string().default('file:./db/custom.db'),
  
  // 한국투자증권 API (선택사항)
  KIS_APP_KEY: z.string().optional(),
  KIS_APP_SECRET: z.string().optional(),
  KIS_ACCOUNT_NO: z.string().optional(),
  
  // 업비트 API (선택사항)
  UPBIT_ACCESS_KEY: z.string().optional(),
  UPBIT_SECRET_KEY: z.string().optional(),
  
  // AI API
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // AdSense (선택사항)
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_SLOT_ID: z.string().optional(),
  
  // 앱 설정
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('투자 학습 & 모의투자'),
  
  // 보안 설정
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MINUTES: z.string().transform(Number).default('1'),
  
  // 로깅
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_SENSITIVE_DATA: z.string().transform(v => v === 'true').default('false'),
  
  // Node 환경
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// 클라이언트에서 접근 가능한 환경변수
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('투자 학습 & 모의투자'),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_SLOT_ID: z.string().optional(),
});

// 서버 환경변수 파싱
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('환경변수 검증 오류:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    
    // 개발 환경에서는 기본값으로 진행
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ 일부 환경변수가 누락되었습니다. 기본값을 사용합니다.');
      return envSchema.parse({
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'file:./db/custom.db',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || '투자 학습 & 모의투자',
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        RATE_LIMIT_WINDOW_MINUTES: process.env.RATE_LIMIT_WINDOW_MINUTES || '1',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        LOG_SENSITIVE_DATA: process.env.LOG_SENSITIVE_DATA || 'false',
        NODE_ENV: process.env.NODE_ENV || 'development',
      });
    }
    
    throw new Error('환경변수 검증에 실패했습니다.');
  }
}

// 클라이언트 환경변수 파싱
function parseClientEnv() {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
      NEXT_PUBLIC_ADSENSE_SLOT_ID: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID,
    });
  } catch {
    // 기본값 반환
    return {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: '투자 학습 & 모의투자',
    };
  }
}

// 서버용 환경변수 (서버 컴포넌트/API에서만 사용)
export const env = parseEnv();

// 클라이언트용 환경변수
export const clientEnv = parseClientEnv();

// 환경변수 타입
export type Env = z.infer<typeof envSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// 환경변수 검증 유틸리티 함수들
export const envUtils = {
  /**
   * 필수 환경변수가 설정되어 있는지 확인
   */
  isConfigured(keys: (keyof Env)[]): boolean {
    return keys.every(key => {
      const value = env[key];
      return value !== undefined && value !== '';
    });
  },
  
  /**
   * 한국투자증권 API 사용 가능 여부
   */
  isKisConfigured(): boolean {
    return this.isConfigured(['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_ACCOUNT_NO']);
  },
  
  /**
   * 업비트 API 사용 가능 여부
   */
  isUpbitConfigured(): boolean {
    return this.isConfigured(['UPBIT_ACCESS_KEY', 'UPBIT_SECRET_KEY']);
  },
  
  /**
   * AI API 사용 가능 여부
   */
  isAiConfigured(): boolean {
    return this.isConfigured(['ANTHROPIC_API_KEY']);
  },
  
  /**
   * AdSense 사용 가능 여부
   */
  isAdSenseConfigured(): boolean {
    return this.isConfigured(['NEXT_PUBLIC_ADSENSE_CLIENT_ID', 'NEXT_PUBLIC_ADSENSE_SLOT_ID']);
  },
  
  /**
   * 프로덕션 환경 여부
   */
  isProduction(): boolean {
    return env.NODE_ENV === 'production';
  },
  
  /**
   * 개발 환경 여부
   */
  isDevelopment(): boolean {
    return env.NODE_ENV === 'development';
  },
  
  /**
   * 민감 정보 로깅 가능 여부
   */
  canLogSensitiveData(): boolean {
    return env.LOG_SENSITIVE_DATA && this.isDevelopment();
  },
};

export default env;
