'use client';

/**
 * 계좌 설정 컴포넌트
 * - 계좌 초기화
 * - 초기 자금 설정
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccountSettingsProps {
  onReset?: () => void;
}

export function AccountSettings({ onReset }: AccountSettingsProps) {
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [initialBalance, setInitialBalance] = useState('10000000');

  // 계좌 초기화
  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await fetch('/api/trading/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialBalance: parseInt(initialBalance) || 10000000,
        }),
      });

      if (!response.ok) throw new Error('Reset failed');

      toast({
        title: '초기화 완료',
        description: `계좌가 ${parseInt(initialBalance).toLocaleString()}원으로 초기화되었습니다.`,
      });

      onReset?.();
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: '오류',
        description: '계좌 초기화에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  // 초기 자금 프리셋
  const presets = [
    { label: '1천만원', value: '10000000' },
    { label: '5천만원', value: '50000000' },
    { label: '1억원', value: '100000000' },
    { label: '10억원', value: '1000000000' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          계좌 관리
        </CardTitle>
        <CardDescription>
          모의투자 계좌를 초기화하거나 초기 자금을 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 초기 자금 설정 */}
        <div className="space-y-2">
          <Label htmlFor="initial-balance">초기 자금</Label>
          <div className="flex gap-2">
            <Input
              id="initial-balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="10000000"
            />
            <Select
              value={initialBalance}
              onValueChange={setInitialBalance}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            초기화 시 설정한 금액으로 잔고가 설정됩니다.
          </p>
        </div>

        {/* 경고 메시지 */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">주의사항</p>
            <p className="text-amber-600 dark:text-amber-300">
              계좌 초기화 시 모든 포트폴리오와 거래 내역이 삭제되며 복구할 수 없습니다.
            </p>
          </div>
        </div>

        {/* 초기화 버튼 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2">
              <Trash2 className="w-4 h-4" />
              계좌 초기화
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>계좌를 초기화하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 모든 보유 종목과 거래 내역이 삭제되며,
                <br />
                <strong>{parseInt(initialBalance).toLocaleString()}원</strong>으로 잔고가 초기화됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                disabled={resetting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  '초기화'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
