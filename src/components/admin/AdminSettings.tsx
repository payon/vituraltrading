'use client';

/**
 * 관리자 설정 컴포넌트
 * - 데이터 소스 선택
 * - API 키 관리
 * - 시스템 설정
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Key, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  RefreshCw,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataSourceStatus {
  available: boolean;
  name: string;
  description: string;
  requiresApiKey: boolean;
}

interface SystemSettings {
  id: string;
  stockDataSource: string;
  coinDataSource: string;
  kisAppKey: string | null;
  kisAppSecret: string | null;
  kisAccountNo: string | null;
  kisEnabled: boolean;
  upbitAccessKey: string | null;
  upbitSecretKey: string | null;
  upbitEnabled: boolean;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultInitialBalance: number;
}

interface SettingsResponse {
  settings: SystemSettings;
  dataSourceStatus: Record<string, DataSourceStatus>;
}

export function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SettingsResponse | null>(null);
  
  // Form state
  const [stockDataSource, setStockDataSource] = useState('naver');
  const [coinDataSource, setCoinDataSource] = useState('upbit');
  const [kisAppKey, setKisAppKey] = useState('');
  const [kisAppSecret, setKisAppSecret] = useState('');
  const [kisAccountNo, setKisAccountNo] = useState('');
  const [upbitAccessKey, setUpbitAccessKey] = useState('');
  const [upbitSecretKey, setUpbitSecretKey] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [defaultInitialBalance, setDefaultInitialBalance] = useState(10000000);

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      
      const result: SettingsResponse = await response.json();
      setData(result);
      
      // 폼 상태 설정
      setStockDataSource(result.settings.stockDataSource);
      setCoinDataSource(result.settings.coinDataSource);
      setKisAppKey(result.settings.kisAppKey || '');
      setKisAppSecret(result.settings.kisAppSecret || '');
      setKisAccountNo(result.settings.kisAccountNo || '');
      setUpbitAccessKey(result.settings.upbitAccessKey || '');
      setUpbitSecretKey(result.settings.upbitSecretKey || '');
      setMaintenanceMode(result.settings.maintenanceMode);
      setAllowRegistration(result.settings.allowRegistration);
      setDefaultInitialBalance(result.settings.defaultInitialBalance);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: '오류',
        description: '설정을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockDataSource,
          coinDataSource,
          kisAppKey: kisAppKey || undefined,
          kisAppSecret: kisAppSecret || undefined,
          kisAccountNo: kisAccountNo || undefined,
          upbitAccessKey: upbitAccessKey || undefined,
          upbitSecretKey: upbitSecretKey || undefined,
          maintenanceMode,
          allowRegistration,
          defaultInitialBalance,
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      const result = await response.json();
      
      toast({
        title: '저장 완료',
        description: result.message || '설정이 저장되었습니다.',
      });
      
      // 설정 다시 로드
      await loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: '오류',
        description: '설정 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stockSources = ['naver', 'kis', 'yahoo', 'mock'];
  const coinSources = ['upbit', 'mock'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">시스템 설정</h2>
          <p className="text-muted-foreground">
            데이터 소스, API 키, 시스템 설정을 관리합니다.
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          설정 저장
        </Button>
      </div>

      <Tabs defaultValue="datasource" className="space-y-4">
        <TabsList>
          <TabsTrigger value="datasource">
            <Database className="mr-2 h-4 w-4" />
            데이터 소스
          </TabsTrigger>
          <TabsTrigger value="apikeys">
            <Key className="mr-2 h-4 w-4" />
            API 키
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            시스템
          </TabsTrigger>
        </TabsList>

        {/* 데이터 소스 탭 */}
        <TabsContent value="datasource" className="space-y-4">
          {/* 주식 데이터 소스 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                주식 데이터 소스
              </CardTitle>
              <CardDescription>
                한국 주식 시세를 가져올 데이터 소스를 선택하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {stockSources.map((source) => {
                  const status = data?.dataSourceStatus[source];
                  const isSelected = stockDataSource === source;
                  
                  return (
                    <div
                      key={source}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setStockDataSource(source)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{status?.name || source}</div>
                          <div className="text-sm text-muted-foreground">
                            {status?.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status?.requiresApiKey && (
                          <Badge variant="outline">
                            <Key className="mr-1 h-3 w-3" />
                            API 키 필요
                          </Badge>
                        )}
                        {status?.available ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            사용 가능
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            설정 필요
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 코인 데이터 소스 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                코인 데이터 소스
              </CardTitle>
              <CardDescription>
                암호화폐 시세를 가져올 데이터 소스를 선택하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {coinSources.map((source) => {
                  const status = data?.dataSourceStatus[source];
                  const isSelected = coinDataSource === source;
                  
                  return (
                    <div
                      key={source}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setCoinDataSource(source)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{status?.name || source}</div>
                          <div className="text-sm text-muted-foreground">
                            {status?.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status?.requiresApiKey && (
                          <Badge variant="outline">
                            <Key className="mr-1 h-3 w-3" />
                            API 키 필요
                          </Badge>
                        )}
                        {status?.available ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            사용 가능
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            설정 필요
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API 키 탭 */}
        <TabsContent value="apikeys" className="space-y-4">
          {/* KIS API 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                한국투자증권 KIS API
              </CardTitle>
              <CardDescription>
                KIS Open API 키를 입력하세요. 
                <a 
                  href="https://apiportal.koreainvestment.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary ml-1 hover:underline"
                >
                  KIS API 포털
                </a>에서 발급 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kisAppKey">App Key</Label>
                  <Input
                    id="kisAppKey"
                    type="password"
                    placeholder="PSxxxxxxxxxxxxxx"
                    value={kisAppKey}
                    onChange={(e) => setKisAppKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kisAppSecret">App Secret</Label>
                  <Input
                    id="kisAppSecret"
                    type="password"
                    placeholder="앱 시크릿 키"
                    value={kisAppSecret}
                    onChange={(e) => setKisAppSecret(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kisAccountNo">계좌번호</Label>
                <Input
                  id="kisAccountNo"
                  placeholder="00000000-00"
                  value={kisAccountNo}
                  onChange={(e) => setKisAccountNo(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {data?.dataSourceStatus.kis.available 
                    ? 'API 키가 설정되어 있습니다.' 
                    : 'API 키를 입력하면 KIS 데이터 소스를 사용할 수 있습니다.'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Upbit API 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                업비트 API
              </CardTitle>
              <CardDescription>
                업비트 Open API 키를 입력하세요.
                <a 
                  href="https://upbit.com/mypage/open_api_auth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary ml-1 hover:underline"
                >
                  업비트 API 설정
                </a>에서 발급 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upbitAccessKey">Access Key</Label>
                  <Input
                    id="upbitAccessKey"
                    type="password"
                    placeholder="Access Key"
                    value={upbitAccessKey}
                    onChange={(e) => setUpbitAccessKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upbitSecretKey">Secret Key</Label>
                  <Input
                    id="upbitSecretKey"
                    type="password"
                    placeholder="Secret Key"
                    value={upbitSecretKey}
                    onChange={(e) => setUpbitSecretKey(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {data?.dataSourceStatus.upbit.available 
                    ? 'API 키가 설정되어 있습니다.' 
                    : 'API 키를 입력하면 업비트 데이터 소스를 사용할 수 있습니다.'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 탭 */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                시스템 운영 관련 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 유지보수 모드 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>유지보수 모드</Label>
                  <p className="text-sm text-muted-foreground">
                    활성화하면 일반 사용자가 서비스에 접근할 수 없습니다.
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              {/* 회원가입 허용 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>회원가입 허용</Label>
                  <p className="text-sm text-muted-foreground">
                    새로운 사용자의 회원가입을 허용합니다.
                  </p>
                </div>
                <Switch
                  checked={allowRegistration}
                  onCheckedChange={setAllowRegistration}
                />
              </div>

              {/* 기본 초기 자금 */}
              <div className="space-y-2">
                <Label htmlFor="initialBalance">기본 초기 자금 (원)</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  value={defaultInitialBalance}
                  onChange={(e) => setDefaultInitialBalance(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  새로운 사용자에게 지급될 모의투자 초기 자금입니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
