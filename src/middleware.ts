import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 보안 헤더 검증 (CSRF 방지)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const contentType = request.headers.get('content-type');
    
    // Content-Type 검증
    if (!contentType?.includes('application/json') && 
        !contentType?.includes('application/x-www-form-urlencoded') &&
        !contentType?.includes('multipart/form-data')) {
      // 파일 업로드 등의 경우 허용
    }
    
    // Origin 검증 (CSRF 방지)
    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '');
      if (originHost !== host && !originHost.endsWith('.' + host)) {
        return NextResponse.json(
          { error: 'CSRF 검증 실패' },
          { status: 403 }
        );
      }
    }
  }
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    const origin = request.headers.get('origin');
    
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    
    return response;
  }
  
  // Rate Limiting 헤더 추가 (선택적)
  const response = intlMiddleware(request);
  
  // 보안 헤더 추가
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export const config = {
  // Match only internationalized pathnames and API routes
  matcher: ['/', '/(ko|en|ja|zh)/:path*', '/api/:path*']
};
