/**
 * Rate Limiting 구현
 * - 메모리 기반 요청 제한
 * - IP별 요청 추적
 * - 슬라이딩 윈도우 알고리즘
 */

import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

// 요청 기록 인터페이스
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 메모리 저장소 (프로덕션에서는 Redis 사용 권장)
const rateLimitStore = new Map<string, RateLimitRecord>();

// 설정
const RATE_LIMIT_MAX = env.RATE_LIMIT_MAX_REQUESTS || 100;
const RATE_LIMIT_WINDOW_MS = (env.RATE_LIMIT_WINDOW_MINUTES || 1) * 60 * 1000;

// 정리 주기 (5분마다 오래된 기록 삭제)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// 정리 작업 시작
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * 클라이언트 IP 추출
 */
function getClientIp(request: Request): string {
  // 다양한 헤더에서 IP 확인
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // 첫 번째 IP 사용 (가장 원본에 가까운 IP)
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // 기본값 (로컬 개발용)
  return 'unknown';
}

/**
 * Rate Limit 키 생성
 * IP + 엔드포인트 조합
 */
function getRateLimitKey(request: Request): string {
  const ip = getClientIp(request);
  const url = new URL(request.url);
  const endpoint = url.pathname;
  return `${ip}:${endpoint}`;
}

/**
 * Rate Limit 체크
 */
export function checkRateLimit(request: Request): {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // 새 윈도우 시작
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(key, newRecord);
    
    return {
      success: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetTime: newRecord.resetTime,
      limit: RATE_LIMIT_MAX,
    };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    // 제한 초과
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      limit: RATE_LIMIT_MAX,
    };
  }
  
  // 요청 증가
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    success: true,
    remaining: RATE_LIMIT_MAX - record.count,
    resetTime: record.resetTime,
    limit: RATE_LIMIT_MAX,
  };
}

/**
 * Rate Limit 응답 생성
 */
export function createRateLimitResponse(result: ReturnType<typeof checkRateLimit>): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Rate Limit 헤더 추가
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: ReturnType<typeof checkRateLimit>
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return response;
}

/**
 * Rate Limit 미들웨어
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const result = checkRateLimit(request);
    
    if (!result.success) {
      return createRateLimitResponse(result);
    }
    
    const response = await handler(request);
    return addRateLimitHeaders(response, result);
  };
}

/**
 * 엔드포인트별 커스텀 Rate Limit
 */
export function createRateLimiter(options: {
  maxRequests: number;
  windowMinutes: number;
}) {
  const store = new Map<string, RateLimitRecord>();
  const windowMs = options.windowMinutes * 60 * 1000;
  
  return {
    check(request: Request): ReturnType<typeof checkRateLimit> {
      const key = getRateLimitKey(request);
      const now = Date.now();
      const record = store.get(key);
      
      if (!record || now > record.resetTime) {
        const newRecord: RateLimitRecord = {
          count: 1,
          resetTime: now + windowMs,
        };
        store.set(key, newRecord);
        
        return {
          success: true,
          remaining: options.maxRequests - 1,
          resetTime: newRecord.resetTime,
          limit: options.maxRequests,
        };
      }
      
      if (record.count >= options.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetTime: record.resetTime,
          limit: options.maxRequests,
        };
      }
      
      record.count++;
      store.set(key, record);
      
      return {
        success: true,
        remaining: options.maxRequests - record.count,
        resetTime: record.resetTime,
        limit: options.maxRequests,
      };
    },
    
    reset(request: Request): void {
      const key = getRateLimitKey(request);
      store.delete(key);
    },
  };
}

/**
 * 민감한 엔드포인트용 엄격한 Rate Limiter
 */
export const strictRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMinutes: 1,
});

/**
 * 인증 엔드포인트용 Rate Limiter (로그인 무차별 대입 방지)
 */
export const authRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMinutes: 15,
});

export default {
  checkRateLimit,
  withRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  createRateLimiter,
  strictRateLimiter,
  authRateLimiter,
};
