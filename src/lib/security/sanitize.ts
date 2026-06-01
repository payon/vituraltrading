/**
 * 입력 정제 (Sanitization) 유틸리티
 * - XSS 방지
 * - HTML 이스케이프
 * - 입력 필터링
 */

// HTML 특수 문자 이스케이프 맵
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// 위험한 HTML 태그 패턴
const DANGEROUS_TAGS_REGEX = /<(script|iframe|object|embed|form|input|button|textarea|select|style|link|meta|base)[^>]*>/gi;
const DANGEROUS_ATTRS_REGEX = /\s(on\w+|javascript:|data:|vbscript:)\s*=/gi;

/**
 * HTML 이스케이프
 * XSS 공격 방지를 위해 특수 문자를 HTML 엔티티로 변환
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * HTML 언이스케이프
 */
export function unescapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
}

/**
 * 위험한 HTML 태그 제거
 */
export function stripDangerousTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(DANGEROUS_TAGS_REGEX, '')
    .replace(DANGEROUS_ATTRS_REGEX, '');
}

/**
 * 텍스트 정제 (XSS 방지)
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // 연속 공백 제거
  let sanitized = input.trim().replace(/\s+/g, ' ');
  
  // 위험한 태그 제거
  sanitized = stripDangerousTags(sanitized);
  
  // HTML 이스케이프
  sanitized = escapeHtml(sanitized);
  
  return sanitized;
}

/**
 * HTML 콘텐츠 정제 (Markdown 등 허용되는 경우)
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // 위험한 태그와 속성 제거
  let sanitized = stripDangerousTags(input);
  
  // 위험한 URL 스킴 제거
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*(javascript:|data:|vbscript:)/gi, '$1=""');
  
  return sanitized;
}

/**
 * URL 정제
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  
  // 허용된 프로토콜만 통과
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:', '/'];
  const hasAllowedProtocol = allowedProtocols.some(p => 
    trimmed.toLowerCase().startsWith(p)
  );
  
  if (!hasAllowedProtocol) {
    return ''; // 또는 `https://${trimmed}` 반환 가능
  }
  
  // javascript:, data: 등 위험한 프로토콜 차단
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];
  const isDangerous = dangerousProtocols.some(p => 
    trimmed.toLowerCase().startsWith(p)
  );
  
  if (isDangerous) {
    return '';
  }
  
  return trimmed;
}

/**
 * 이메일 정제
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // 소문자 변환 및 공백 제거
  const sanitized = email.toLowerCase().trim();
  
  // 기본 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * 전화번호 정제
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  
  // 한국 전화번호 형식 검증 (10-11자리)
  if (digits.length < 10 || digits.length > 11) {
    return '';
  }
  
  return digits;
}

/**
 * 숫자 입력 정제
 */
export function sanitizeNumber(input: string | number, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): number | null {
  if (input === null || input === undefined) {
    return null;
  }
  
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  let result = num;
  
  if (options?.integer) {
    result = Math.floor(result);
  }
  
  if (options?.min !== undefined && result < options.min) {
    result = options.min;
  }
  
  if (options?.max !== undefined && result > options.max) {
    result = options.max;
  }
  
  return result;
}

/**
 * 파일명 정제
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  // 위험한 문자 제거
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\.\./g, '') // 경로 탐색 방지
    .trim();
  
  // 길이 제한
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, -(ext.length + 1));
    sanitized = name.slice(0, 250 - ext.length) + '.' + ext;
  }
  
  return sanitized;
}

/**
 * JSON 정제 (순환 참조 및 함수 제거)
 */
export function sanitizeJson(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }
  
  if (typeof input === 'function') {
    return undefined;
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeJson);
  }
  
  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // 프로토타입 오염 방지
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      result[key] = sanitizeJson(value);
    }
    return result;
  }
  
  return input;
}

/**
 * SQL Injection 방지를 위한 문자열 이스케이프
 * (Prisma를 사용하므로 일반적으로 필요 없지만, Raw 쿼리용)
 */
export function escapeSql(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0')
    .replace(/\x1a/g, '\\Z');
}

/**
 * 객체 전체 정제
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: {
    escapeHtml?: boolean;
    trimStrings?: boolean;
    removeNulls?: boolean;
  }
): Partial<T> {
  const result: Record<string, unknown> = {};
  const opts = {
    escapeHtml: true,
    trimStrings: true,
    removeNulls: false,
    ...options,
  };
  
  for (const [key, value] of Object.entries(obj)) {
    // 위험한 키 제거
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    if (value === null || value === undefined) {
      if (!opts.removeNulls) {
        result[key] = value;
      }
      continue;
    }
    
    if (typeof value === 'string') {
      let processed = value;
      if (opts.trimStrings) {
        processed = processed.trim();
      }
      if (opts.escapeHtml) {
        processed = sanitizeText(processed);
      }
      result[key] = processed;
    } else if (typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }
  
  return result as Partial<T>;
}

export default {
  escapeHtml,
  unescapeHtml,
  stripDangerousTags,
  sanitizeText,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeNumber,
  sanitizeFilename,
  sanitizeJson,
  escapeSql,
  sanitizeObject,
};
