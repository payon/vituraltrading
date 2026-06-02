/**
 * 암호화 유틸리티
 * - API 키 등 민감 정보 암호화 저장
 * - AES-256-CBC 알고리즘 사용
 * - Node.js crypto 모듈 활용
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// 암호화 설정
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT = 'vituraltrading-encryption-salt';

// 환경 변수에서 암호화 키 가져오기
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET 또는 NEXTAUTH_SECRET 환경 변수가 필요합니다.');
  }
  
  // 비밀번호에서 키 유도
  return scryptSync(secret, SALT, KEY_LENGTH);
}

/**
 * 문자열 암호화
 * @param plaintext 암호화할 평문
 * @returns 암호화된 문자열 (iv:encrypted 형식)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('암호화할 문자열이 필요합니다.');
  }
  
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // iv와 암호문을 결합하여 저장
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('암호화에 실패했습니다.');
  }
}

/**
 * 문자열 복호화
 * @param encryptedData 암호화된 문자열 (iv:encrypted 형식)
 * @returns 복호화된 평문
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('복호화할 문자열이 필요합니다.');
  }
  
  try {
    const key = getEncryptionKey();
    const [ivHex, encrypted] = encryptedData.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('잘못된 암호화 데이터 형식입니다.');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('복호화 실패:', error);
    throw new Error('복호화에 실패했습니다.');
  }
}

/**
 * 암호화 데이터 검증
 */
export function isEncrypted(data: string): boolean {
  const parts = data.split(':');
  if (parts.length !== 2) return false;
  
  const [ivHex, encrypted] = parts;
  // IV가 16바이트(32 hex chars)인지 확인
  if (ivHex.length !== 32) return false;
  // 암호문이 hex 형식인지 확인
  return /^[0-9a-f]+$/i.test(ivHex) && /^[0-9a-f]+$/i.test(encrypted);
}

/**
 * 해시 생성 (단방향)
 */
export function hash(data: string): string {
  const key = getEncryptionKey();
  const hashBuffer = scryptSync(data, key.toString('hex'), 64);
  return hashBuffer.toString('hex');
}

/**
 * 해시 검증
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const dataHash = hash(data);
    const dataBuffer = Buffer.from(dataHash, 'hex');
    const hashedBuffer = Buffer.from(hashedData, 'hex');
    
    if (dataBuffer.length !== hashedBuffer.length) {
      return false;
    }
    
    // 타이밍 공격 방지
    return timingSafeEqual(dataBuffer, hashedBuffer);
  } catch {
    return false;
  }
}

/**
 * 안전한 랜덤 토큰 생성
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * API 키 마스킹 (표시용)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  const visibleStart = apiKey.slice(0, 4);
  const visibleEnd = apiKey.slice(-4);
  const masked = '*'.repeat(Math.min(apiKey.length - 8, 20));
  
  return `${visibleStart}${masked}${visibleEnd}`;
}

/**
 * 객체 필드 암호화
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value && !isEncrypted(value)) {
      result[field] = encrypt(value) as T[keyof T];
    }
  }
  
  return result;
}

/**
 * 객체 필드 복호화
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value && isEncrypted(value)) {
      try {
        result[field] = decrypt(value) as T[keyof T];
      } catch {
        // 복호화 실패 시 원본 유지
        console.warn(`Failed to decrypt field: ${String(field)}`);
      }
    }
  }
  
  return result;
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  hash,
  verifyHash,
  generateSecureToken,
  maskApiKey,
  encryptFields,
  decryptFields,
};
