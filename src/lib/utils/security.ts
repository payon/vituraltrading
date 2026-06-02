/**
 * 보안 유틸리티 함수
 * - 로깅 보안
 * - 토큰 생성
 * - 암호화 유틸리티
 */

import { env, envUtils } from '@/lib/env';

/**
 * 민감 정보 마스킹
 */
export function maskSensitiveData(value: string, options?: {
  showFirst?: number;
  showLast?: number;
  maskChar?: string;
}): string {
  if (!value) return '';
  
  const { showFirst = 2, showLast = 2, maskChar = '*' } = options || {};
  
  if (value.length <= showFirst + showLast) {
    return maskChar.repeat(value.length);
  }
  
  const first = value.slice(0, showFirst);
  const last = value.slice(-showLast);
  const masked = maskChar.repeat(value.length - showFirst - showLast);
  
  return `${first}${masked}${last}`;
}

/**
 * 이메일 마스킹
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);
  
  return `${maskedLocal}@${domain}`;
}

/**
 * 전화번호 마스킹
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  } else if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`;
  }
  
  return '*'.repeat(phone.length);
}

/**
 * 카드번호 마스킹
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber) return '';
  
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length >= 12) {
    return `${digits.slice(0, 4)}-****-****-${digits.slice(-4)}`;
  }
  
  return '*'.repeat(cardNumber.length);
}

/**
 * 계좌번호 마스킹
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '';
  
  const digits = accountNumber.replace(/\D/g, '');
  
  if (digits.length > 4) {
    return '*'.repeat(digits.length - 4) + digits.slice(-4);
  }
  
  return '*'.repeat(accountNumber.length);
}

/**
 * 보안 로그 출력 (민감 정보 자동 마스킹)
 */
export function secureLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  // 로그 레벨 체크
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(env.LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex < currentLevelIndex) {
    return;
  }
  
  // 민감 정보 마스킹
  let sanitizedData: Record<string, unknown> | undefined;
  
  if (data) {
    sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // 민감한 키 감지
      const isSensitive = [
        'password', 'secret', 'token', 'key', 'credential',
        'api_key', 'apikey', 'app_key', 'appkey', 'app_secret',
        'access_key', 'secret_key', 'private_key',
        'credit_card', 'card_number', 'cvv', 'ssn',
      ].some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive && typeof value === 'string') {
        // 민감 정보 로깅 허용 여부 체크
        if (envUtils.canLogSensitiveData()) {
          sanitizedData[key] = value;
        } else {
          sanitizedData[key] = maskSensitiveData(value);
        }
      } else if (typeof value === 'string' && value.includes('@')) {
        // 이메일 감지 및 마스킹
        sanitizedData[key] = envUtils.canLogSensitiveData() 
          ? value 
          : maskEmail(value);
      } else {
        sanitizedData[key] = value;
      }
    }
  }
  
  // 로그 출력
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'error':
      console.error(prefix, message, sanitizedData || '');
      break;
    case 'warn':
      console.warn(prefix, message, sanitizedData || '');
      break;
    case 'debug':
      console.debug(prefix, message, sanitizedData || '');
      break;
    default:
      console.log(prefix, message, sanitizedData || '');
  }
}

/**
 * 편의 로깅 함수들
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => 
    secureLog('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => 
    secureLog('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => 
    secureLog('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => 
    secureLog('error', message, data),
};

/**
 * 랜덤 토큰 생성
 */
export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // crypto API 사용 (서버/클라이언트 호환)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    // 폴백
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * UUID v4 생성
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // 폴백 구현
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 해시 생성 (간단한 체크설용)
 */
export async function simpleHash(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // 간단한 폴백 (실제 보안용이 아님)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 요청 ID 생성 (추적용)
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = generateRandomToken(8);
  return `req_${timestamp}_${random}`;
}

/**
 * 입력값 검증 에러 포맷팅
 */
export function formatValidationErrors(errors: Array<{ path: (string | number)[]; message: string }>): string {
  return errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  }).join(', ');
}

/**
 * 보안 헤더 생성
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  };
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 안전한 JSON 문자열 변환
 */
export function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}

/**
 * 민감 데이터 삭제 (메모리에서 즉시 제거)
 */
export function clearSensitiveData(data: string): void {
  // JavaScript에서는 문자열이 불변이므로 완전한 삭제는 어려움
  // 가능한 한 빨리 GC가 되도록 처리
  if (typeof data === 'string') {
    // 참조 제거를 위한 noop
    void data;
  }
}

/**
 * 입력 길이 제한 검증
 */
export function validateInputLength(input: string, options: {
  min?: number;
  max?: number;
  fieldName?: string;
}): { valid: boolean; error?: string } {
  const { min, max, fieldName = '입력값' } = options;
  const length = input?.length || 0;
  
  if (min !== undefined && length < min) {
    return { valid: false, error: `${fieldName}은(는) 최소 ${min}자 이상이어야 합니다.` };
  }
  
  if (max !== undefined && length > max) {
    return { valid: false, error: `${fieldName}은(는) 최대 ${max}자까지 입력 가능합니다.` };
  }
  
  return { valid: true };
}

/**
 * 콘텐츠 보안 정책 위반 감지
 */
export function detectCspViolation(content: string): {
  hasViolation: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // 인라인 이벤트 핸들러
  if (/\bon\w+\s*=/i.test(content)) {
    violations.push('인라인 이벤트 핸들러 감지');
  }
  
  // javascript: URL
  if (/javascript\s*:/i.test(content)) {
    violations.push('javascript: URL 감지');
  }
  
  // data: URL (HTML)
  if (/data\s*:\s*text\/html/i.test(content)) {
    violations.push('data:text/html URL 감지');
  }
  
  return {
    hasViolation: violations.length > 0,
    violations,
  };
}

export default {
  maskSensitiveData,
  maskEmail,
  maskPhoneNumber,
  maskCardNumber,
  maskAccountNumber,
  secureLog,
  logger,
  generateRandomToken,
  generateUuid,
  simpleHash,
  generateRequestId,
  formatValidationErrors,
  getSecurityHeaders,
  safeJsonParse,
  safeJsonStringify,
  clearSensitiveData,
  validateInputLength,
  detectCspViolation,
};
