'use client';

/**
 * 사용자 메뉴 컴포넌트
 * - 로그인 상태 표시
 * - 사용자 정보 드롭다운
 */

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  LogOut,
  Wallet,
  TrendingUp,
  Loader2,
  LogIn,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { useTheme } from 'next-themes';

interface UserInfo {
  id: string;
  email: string;
  name?: string | null;
  initialBalance: number;
  currentBalance: number;
  investmentStyle?: string | null;
}

interface UserMenuProps {
  onSignIn?: () => void;
}

export function UserMenu({ onSignIn }: UserMenuProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 마운트 상태 확인 (hydration 오류 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 세션 확인
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setUser(null);
    window.location.reload();
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 투자 성향 표시
  const getInvestmentStyleLabel = (style?: string | null) => {
    switch (style) {
      case 'conservative':
        return '안정형';
      case 'moderate':
        return '중립형';
      case 'aggressive':
        return '공격형';
      default:
        return '미설정';
    }
  };

  // 수익률 계산
  const getReturnRate = () => {
    if (!user) return 0;
    return ((user.currentBalance - user.initialBalance) / user.initialBalance) * 100;
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  // 비로그인 상태
  if (!user) {
    return (
      <>
        <Button onClick={() => setShowAuthModal(true)} className="gap-2">
          <LogIn className="w-4 h-4" />
          로그인
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  // 로그인 상태
  const returnRate = getReturnRate();
  const isPositiveReturn = returnRate >= 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{user.name || '사용자'}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(user.currentBalance)}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span>{user.name || '사용자'}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* 계좌 정보 */}
          <div className="px-2 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">총 자산</span>
              <span className="font-bold">{formatCurrency(user.currentBalance)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">총 수익률</span>
              <span className={`font-bold ${isPositiveReturn ? 'text-red-500' : 'text-blue-500'}`}>
                {isPositiveReturn ? '+' : ''}{returnRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">투자 성향</span>
              <Badge variant="outline">{getInvestmentStyleLabel(user.investmentStyle)}</Badge>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => {}}>
            <Wallet className="mr-2 h-4 w-4" />
            내 포트폴리오
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            <TrendingUp className="mr-2 h-4 w-4" />
            거래 내역
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            <Settings className="mr-2 h-4 w-4" />
            설정
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 테마 설정 */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            테마 설정
          </DropdownMenuLabel>
          {mounted && (
            <>
              <DropdownMenuItem onClick={() => setTheme('light')} className="justify-between">
                <div className="flex items-center">
                  <Sun className="mr-2 h-4 w-4" />
                  라이트 모드
                </div>
                {theme === 'light' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="justify-between">
                <div className="flex items-center">
                  <Moon className="mr-2 h-4 w-4" />
                  다크 모드
                </div>
                {theme === 'dark' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="justify-between">
                <div className="flex items-center">
                  <Monitor className="mr-2 h-4 w-4" />
                  시스템 설정
                </div>
                {theme === 'system' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
