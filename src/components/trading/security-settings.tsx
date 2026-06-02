'use client';

/**
 * 보안 설정 컴포넌트
 * - 세션 관리
 * - 활동 로그
 * - 보안 경고
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  ShieldAlert,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  sessionToken: string;
  isCurrent: boolean;
  createdAt: string;
  expiresAt: string;
  lastAccessed: string;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  success: boolean;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditSummary {
  loginCount: number;
  tradeCount: number;
  failedAttempts: number;
  lastLoginAt: string | null;
}

interface SuspiciousActivity {
  isSuspicious: boolean;
  warnings: string[];
}

// 액션 라벨 맵
const actionLabels: Record<string, string> = {
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

// 기기 아이콘 감지
function getDeviceIcon(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="w-4 h-4" />;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return <Tablet className="w-4 h-4" />;
  }
  return <Monitor className="w-4 h-4" />;
}

// 날짜 포맷팅
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SecuritySettings() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'activity' | 'overview'>('overview');

  // 데이터 로드
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, logsRes, summaryRes, suspiciousRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/audit-logs?limit=20'),
        fetch('/api/audit-logs?type=summary'),
        fetch('/api/audit-logs?type=suspicious'),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setAuditSummary(data.summary);
      }

      if (suspiciousRes.ok) {
        const data = await suspiciousRes.json();
        setSuspiciousActivity(data);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 다른 기기 로그아웃
  const handleLogoutOtherDevices = async () => {
    try {
      const response = await fetch('/api/sessions?all=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: '로그아웃 완료',
          description: '다른 모든 기기에서 로그아웃되었습니다.',
        });
        loadSecurityData();
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '로그아웃 처리에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 특정 세션 종료
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: '세션 종료',
          description: '해당 기기에서 로그아웃되었습니다.',
        });
        loadSecurityData();
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '세션 종료에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 보안 상태 개요 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {suspiciousActivity?.isSuspicious ? (
              <ShieldAlert className="w-4 h-4 text-red-500" />
            ) : (
              <Shield className="w-4 h-4 text-green-500" />
            )}
            보안 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{auditSummary?.loginCount || 0}</p>
              <p className="text-xs text-muted-foreground">30일 로그인</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{auditSummary?.tradeCount || 0}</p>
              <p className="text-xs text-muted-foreground">30일 거래</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${auditSummary?.failedAttempts ? 'text-red-500' : ''}`}>
                {auditSummary?.failedAttempts || 0}
              </p>
              <p className="text-xs text-muted-foreground">실패 시도</p>
            </div>
          </div>

          {/* 보안 경고 */}
          {suspiciousActivity?.isSuspicious && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400 text-sm">의심스러운 활동 감지</p>
                  <ul className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {suspiciousActivity.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          개요
        </Button>
        <Button
          variant={activeTab === 'sessions' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('sessions')}
        >
          세션 관리
        </Button>
        <Button
          variant={activeTab === 'activity' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('activity')}
        >
          활동 로그
        </Button>
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">활성 세션</CardTitle>
            <CardDescription className="text-xs">
              현재 {sessions.length}개 기기에서 로그인됨
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.isCurrent ? '현재 기기' : '다른 기기'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session.createdAt)} 접속
                      </p>
                    </div>
                  </div>
                  {session.isCurrent && (
                    <Badge variant="outline" className="text-xs">활성</Badge>
                  )}
                </div>
              ))}
            </div>
            
            {sessions.length > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <LogOut className="w-4 h-4 mr-2" />
                    다른 기기 모두 로그아웃
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>다른 기기 로그아웃</AlertDialogTitle>
                    <AlertDialogDescription>
                      현재 기기를 제외한 모든 기기에서 로그아웃됩니다.
                      계속하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogoutOtherDevices}>
                      로그아웃
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      )}

      {/* 세션 관리 탭 */}
      {activeTab === 'sessions' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">세션 관리</CardTitle>
            <CardDescription className="text-xs">
              로그인된 기기 목록을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      session.isCurrent ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {session.isCurrent ? '현재 기기' : '다른 기기'}
                          </p>
                          {session.isCurrent && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              활성
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>접속: {formatDate(session.createdAt)}</span>
                          <span>•</span>
                          <span>만료: {formatDate(session.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleTerminateSession(session.id)}
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 활동 로그 탭 */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              활동 로그
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-2 border-b last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      {log.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {actionLabels[log.action] || log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(log.createdAt)}
                          {log.ipAddress && ` • ${log.ipAddress}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">활동 기록이 없습니다</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
