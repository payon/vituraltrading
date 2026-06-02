/**
 * 감사 로그 서비스
 * - 사용자 활동 추적
 * - 보안 이벤트 기록
 * - 로그 조회 및 분석
 */

import { db } from '@/lib/db';
import { AuditAction } from '@prisma/client';

interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

interface AuditLogQueryParams {
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 감사 로그 생성
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const log = await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
      },
    });
    
    return { success: true, log };
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return { success: false, error: 'Failed to create audit log' };
  }
}

/**
 * 감사 로그 조회
 */
export async function getAuditLogs(params: AuditLogQueryParams) {
  try {
    const where: any = {};
    
    if (params.userId) {
      where.userId = params.userId;
    }
    
    if (params.action) {
      where.action = params.action;
    }
    
    if (params.success !== undefined) {
      where.success = params.success;
    }
    
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }
    
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);
    
    // metadata 파싱
    const parsedLogs = logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
    
    return { success: true, logs: parsedLogs, total };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return { success: false, error: 'Failed to get audit logs', logs: [], total: 0 };
  }
}

/**
 * 사용자별 감사 로그 요약
 */
export async function getUserAuditSummary(userId: string) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [loginCount, tradeCount, failedAttempts] = await Promise.all([
      db.auditLog.count({
        where: {
          userId,
          action: 'LOGIN',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      db.auditLog.count({
        where: {
          userId,
          action: { in: ['TRADE_BUY', 'TRADE_SELL'] },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      db.auditLog.count({
        where: {
          userId,
          success: false,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);
    
    // 마지막 로그인
    const lastLogin = await db.auditLog.findFirst({
      where: {
        userId,
        action: 'LOGIN',
        success: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return {
      success: true,
      summary: {
        loginCount,
        tradeCount,
        failedAttempts,
        lastLoginAt: lastLogin?.createdAt || null,
      },
    };
  } catch (error) {
    console.error('Failed to get audit summary:', error);
    return { success: false, error: 'Failed to get audit summary' };
  }
}

/**
 * 의심스러운 활동 감지
 */
export async function detectSuspiciousActivity(userId: string) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // 1시간 내 실패한 로그인 시도
    const failedLogins = await db.auditLog.count({
      where: {
        userId,
        action: 'LOGIN',
        success: false,
        createdAt: { gte: oneHourAgo },
      },
    });
    
    // 1시간 내 거래 횟수
    const trades = await db.auditLog.count({
      where: {
        userId,
        action: { in: ['TRADE_BUY', 'TRADE_SELL'] },
        createdAt: { gte: oneHourAgo },
      },
    });
    
    // 다른 IP에서의 로그인
    const recentLogins = await db.auditLog.findMany({
      where: {
        userId,
        action: 'LOGIN',
        success: true,
        createdAt: { gte: oneHourAgo },
      },
      select: { ipAddress: true },
      distinct: ['ipAddress'],
    });
    
    const warnings: string[] = [];
    
    if (failedLogins >= 5) {
      warnings.push(`1시간 내 ${failedLogins}회 로그인 실패`);
    }
    
    if (trades >= 20) {
      warnings.push(`1시간 내 ${trades}건 거래`);
    }
    
    if (recentLogins.length > 1) {
      warnings.push(`${recentLogins.length}개 다른 IP에서 로그인`);
    }
    
    return {
      success: true,
      isSuspicious: warnings.length > 0,
      warnings,
    };
  } catch (error) {
    console.error('Failed to detect suspicious activity:', error);
    return { success: false, isSuspicious: false, warnings: [] };
  }
}

/**
 * 로그인 기록 로깅
 */
export async function logLogin(
  userId: string,
  success: boolean,
  request: Request,
  errorMessage?: string
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;
  
  return createAuditLog({
    userId,
    action: 'LOGIN',
    description: success ? '로그인 성공' : '로그인 실패',
    ipAddress: ip,
    userAgent,
    success,
    errorMessage,
  });
}

/**
 * 거래 기록 로깅
 */
export async function logTrade(
  userId: string,
  type: 'BUY' | 'SELL',
  symbol: string,
  quantity: number,
  price: number,
  request: Request
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  
  return createAuditLog({
    userId,
    action: type === 'BUY' ? 'TRADE_BUY' : 'TRADE_SELL',
    description: `${symbol} ${type === 'BUY' ? '매수' : '매도'}: ${quantity}주 @ ${price.toLocaleString()}원`,
    metadata: { symbol, quantity, price, total: quantity * price },
    ipAddress: ip,
  });
}

/**
 * 액션 한글명 반환
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    LOGIN: '로그인',
    LOGOUT: '로그아웃',
    REGISTER: '회원가입',
    PASSWORD_CHANGE: '비밀번호 변경',
    PROFILE_UPDATE: '프로필 수정',
    TRADE_BUY: '매수',
    TRADE_SELL: '매도',
    ACCOUNT_RESET: '계좌 초기화',
    SETTINGS_CHANGE: '설정 변경',
    API_ACCESS: 'API 접근',
    SECURITY_ALERT: '보안 알림',
  };
  
  return labels[action] || action;
}

export default {
  createAuditLog,
  getAuditLogs,
  getUserAuditSummary,
  detectSuspiciousActivity,
  logLogin,
  logTrade,
  getActionLabel,
};
