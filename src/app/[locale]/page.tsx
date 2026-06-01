'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Bitcoin, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Menu,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  AlertTriangle,
  Shield
} from 'lucide-react';

// 다국어 컴포넌트
import { LanguageSwitcher } from '@/components/language-switcher';

// 모의투자 컴포넌트
import { AccountCard } from '@/components/trading/account-card';
import { StockList } from '@/components/trading/stock-list';
import { PriceChart } from '@/components/trading/price-chart';
import { TradingPanel } from '@/components/trading/trading-panel';
import { PortfolioTable } from '@/components/trading/portfolio-table';
import { HistoryPanel } from '@/components/trading/history-panel';
import { Stock, AssetType } from '@/lib/trading';
import { useRealtimePrice } from '@/hooks/use-realtime-price';

// 학습 컴포넌트
import { LearningCardList } from '@/components/learning/learning-card';
import { LearningContent, TopicSidebar } from '@/components/learning/learning-content';
import { QuizModal } from '@/components/learning/quiz-modal';
import { ProgressTracker, LearningSummary } from '@/components/learning/progress-tracker';
import { 
  learningCategories, 
  getTopicsByCategory, 
  getTopicBySlug,
  getCategoryBySlug,
  type LearningTopic,
  type QuizQuestion
} from '@/data/learning-content';

// 분석 컴포넌트
import { 
  PortfolioPieChart, 
  ReturnLineChart, 
  BenchmarkComparison, 
  RiskMeter, 
  AssetAllocation, 
  AnalysisSummary 
} from '@/components/analysis';

// 광고 컴포넌트
import { AdProvider, AdBannerCompact, useRewardedAd } from '@/components/ads';

// 면책 고지 컴포넌트
import { DisclaimerModal, DisclaimerBanner } from '@/components/common';

// 관리자 컴포넌트
import { AdminSettings } from '@/components/admin/AdminSettings';

// 인증 컴포넌트
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthProvider } from '@/components/auth/AuthProvider';

// 새로운 기능 컴포넌트
import { OrderBook } from '@/components/trading/order-book';
import { Watchlist } from '@/components/trading/watchlist';
import { AccountSettings } from '@/components/trading/account-settings';
import { Leaderboard } from '@/components/trading/leaderboard';

// 학습 관련 타입
interface CategoryProgress {
  categorySlug: string;
  topics: { topicSlug: string; completed: boolean }[];
}

interface ProgressStats {
  completedTopics: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  lastLearnDate: string | null;
  totalQuizScore: number;
  totalQuizTaken: number;
}

// 분석 데이터 타입
interface AnalysisData {
  sectorAllocation: Array<{
    sector: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  returnData: {
    daily: Array<{ date: string; returnRate: number; cumulativeReturn: number; profit: number }>;
    weekly: Array<{ week: string; returnRate: number; cumulativeReturn: number }>;
    monthly: Array<{ month: string; returnRate: number; cumulativeReturn: number }>;
    realizedProfit: number;
    unrealizedProfit: number;
    totalReturn: number;
    totalReturnRate: number;
  };
  assetAllocation: {
    stock: { amount: number; percentage: number };
    coin: { amount: number; percentage: number };
    cash: { amount: number; percentage: number };
  };
  riskMetrics: {
    standardDeviation: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskLevel: '안전' | '보통' | '위험';
    riskScore: number;
  };
  summary: {
    totalAssets: number;
    initialBalance: number;
    totalProfit: number;
    totalProfitRate: number;
    stockCount: number;
    coinCount: number;
  };
}

interface BenchmarkData {
  indices: {
    kospi: { name: string; value: number; change: number; changeRate: number };
    kosdaq: { name: string; value: number; change: number; changeRate: number };
    sp500: { name: string; value: number; change: number; changeRate: number };
  };
  historicalData: {
    kospi: Array<{ date: string; value: number; change: number; changeRate: number; cumulativeReturn: number }>;
    kosdaq: Array<{ date: string; value: number; change: number; changeRate: number; cumulativeReturn: number }>;
    sp500: Array<{ date: string; value: number; change: number; changeRate: number; cumulativeReturn: number }>;
  };
  periodReturns: {
    kospi: { '1w': number; '1m': number; '3m': number; '1y': number };
    kosdaq: { '1w': number; '1m': number; '3m': number; '1y': number };
    sp500: { '1w': number; '1m': number; '3m': number; '1y': number };
  };
}

function MainContent() {
  // 다국어 번역 - 도메인별 분리
  const t = useTranslations();
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tTrading = useTranslations('trading');
  const tLearning = useTranslations('learning');
  const tDiary = useTranslations('diary');
  const tAnalysis = useTranslations('analysis');

  // 모의투자 상태
  const [assetType, setAssetType] = useState<AssetType>('STOCK');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('trading');

  // 학습 상태
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<CategoryProgress[]>([]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    completedTopics: 0,
    totalTopics: 20,
    currentStreak: 0,
    longestStreak: 0,
    lastLearnDate: null,
    totalQuizScore: 0,
    totalQuizTaken: 0,
  });

  // 퀴즈 상태
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTopicTitle, setQuizTopicTitle] = useState('');

  // AI 분석 관련 상태
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const { requestAd, RewardedAdComponent } = useRewardedAd();

  // 분석 상태
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 모의투자 핸들러
  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleOrderComplete = useCallback(() => {
    setRefreshKey(k => k + 1);
    fetchAnalysisData();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    fetchAnalysisData();
  };

  const handleRealtimeUpdate = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const { startPolling, stopPolling } = useRealtimePrice({
    interval: 10000,
    onUpdate: handleRealtimeUpdate,
    enabled: isRealtimeEnabled && activeTab === 'trading',
  });

  // 분석 데이터 로드
  const fetchAnalysisData = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const [analysisRes, benchmarkRes] = await Promise.all([
        fetch('/api/analysis/portfolio'),
        fetch('/api/analysis/benchmark'),
      ]);

      if (analysisRes.ok) {
        const analysis = await analysisRes.json();
        setAnalysisData(analysis.data);
      }

      if (benchmarkRes.ok) {
        const benchmark = await benchmarkRes.json();
        setBenchmarkData(benchmark.data);
      }
    } catch (error) {
      console.error('Failed to fetch analysis data:', error);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // 학습 데이터 로드 함수
  const fetchLearningData = useCallback(async () => {
    try {
      const statsRes = await fetch('/api/learning?action=stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setProgressStats(stats);
      }

      const progressRes = await fetch('/api/learning?action=category-progress');
      if (progressRes.ok) {
        const progress = await progressRes.json();
        setProgressData(progress);

        const completed: string[] = [];
        progress.forEach((cat: CategoryProgress) => {
          cat.topics.forEach((t: { topicSlug: string; completed: boolean }) => {
            if (t.completed) {
              completed.push(t.topicSlug);
            }
          });
        });
        setCompletedTopics(completed);
      }
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
    }
  }, []);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'learning') {
      fetchLearningData();
    } else if (activeTab === 'analysis') {
      fetchAnalysisData();
    }
  }, [activeTab, fetchLearningData, fetchAnalysisData]);

  // 학습 카테고리 선택
  const handleSelectCategory = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
    const topics = getTopicsByCategory(categorySlug);
    if (topics.length > 0) {
      setSelectedTopicSlug(topics[0].slug);
    }
  };

  // 학습 토픽 선택
  const handleSelectTopic = async (topicSlug: string) => {
    setSelectedTopicSlug(topicSlug);
  };

  // 학습 완료 표시
  const handleMarkComplete = async () => {
    if (!selectedTopicSlug) return;

    const topic = getTopicBySlug(selectedTopicSlug);
    if (!topic) return;

    try {
      const res = await fetch('/api/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, completed: true }),
      });

      if (res.ok) {
        setCompletedTopics(prev => {
          if (!prev.includes(selectedTopicSlug)) {
            return [...prev, selectedTopicSlug];
          }
          return prev;
        });
        fetchLearningData();
      }
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  // 퀴즈 열기
  const handleOpenQuiz = () => {
    if (!selectedTopicSlug) return;

    const topic = getTopicBySlug(selectedTopicSlug);
    if (!topic || !topic.quiz) return;

    setQuizQuestions(topic.quiz);
    setQuizTopicTitle(topic.title);
    setIsQuizOpen(true);
  };

  // 퀴즈 완료
  const handleQuizComplete = async (score: number, totalQuestions: number) => {
    if (!selectedTopicSlug) return;

    const topic = getTopicBySlug(selectedTopicSlug);
    if (!topic) return;

    try {
      const topicRes = await fetch(`/api/learning?topic=${selectedTopicSlug}`);
      if (topicRes.ok) {
        const topicData = await topicRes.json();
        if (topicData.topic?.quiz) {
          await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: topicData.topic.quiz.id,
              score,
              totalQuestions,
              answers: [],
            }),
          });
        }
      }
      fetchLearningData();
    } catch (error) {
      console.error('Failed to save quiz result:', error);
    }
  };

  // 이전/다음 토픽
  const handlePrevTopic = () => {
    if (!selectedCategorySlug || !selectedTopicSlug) return;

    const topics = getTopicsByCategory(selectedCategorySlug);
    const currentIndex = topics.findIndex(t => t.slug === selectedTopicSlug);
    if (currentIndex > 0) {
      setSelectedTopicSlug(topics[currentIndex - 1].slug);
    }
  };

  const handleNextTopic = () => {
    if (!selectedCategorySlug || !selectedTopicSlug) return;

    const topics = getTopicsByCategory(selectedCategorySlug);
    const currentIndex = topics.findIndex(t => t.slug === selectedTopicSlug);
    if (currentIndex < topics.length - 1) {
      setSelectedTopicSlug(topics[currentIndex + 1].slug);
    }
  };

  // AI 분석 요청
  const handleRequestAIAnalysis = () => {
    requestAd(() => {
      setShowAIAnalysis(true);
    });
  };

  // 현재 토픽 관련 정보
  const currentCategory = selectedCategorySlug ? getCategoryBySlug(selectedCategorySlug) : null;
  const currentTopic = selectedTopicSlug ? getTopicBySlug(selectedTopicSlug) : null;
  const categoryTopics = selectedCategorySlug ? getTopicsByCategory(selectedCategorySlug) : [];
  const topicIndex = currentTopic ? categoryTopics.findIndex(t => t.slug === currentTopic.slug) : -1;
  const hasNext = topicIndex < categoryTopics.length - 1;
  const hasPrev = topicIndex > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-blue-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('app.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('app.slogan')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 메인 탭 전환 */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-9">
                  <TabsTrigger value="trading" className="text-sm gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">{tNav('trading')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="text-sm gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">{tNav('portfolio')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="learning" className="text-sm gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <GraduationCap className="w-4 h-4" />
                    <span className="hidden sm:inline">{tNav('learning')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-sm gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">관리자</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* 언어 전환 */}
              <LanguageSwitcher />
              
              {/* 사용자 메뉴 */}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* 모의투자 탭 */}
      {activeTab === 'trading' && (
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`gap-1 cursor-pointer ${isRealtimeEnabled ? 'border-green-500 text-green-600' : 'border-gray-400 text-gray-500'}`}
                onClick={() => setIsRealtimeEnabled(!isRealtimeEnabled)}
              >
                {isRealtimeEnabled ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    {tTrading('realtime')}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    {tTrading('paused')}
                  </>
                )}
              </Badge>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {tCommon('refresh')}
              </Button>
            </div>
            
            {/* 자산 타입 전환 */}
            <Tabs value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
              <TabsList className="h-9">
                <TabsTrigger value="STOCK" className="text-sm gap-1 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4" />
                  {tTrading('stockTab')}
                </TabsTrigger>
                <TabsTrigger value="COIN" className="text-sm gap-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <Bitcoin className="w-4 h-4" />
                  {tTrading('coinTab')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* 왼쪽 사이드바 - 종목 리스트 & 관심종목 */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <StockList 
                assetType={assetType} 
                onSelectStock={handleSelectStock}
                selectedSymbol={selectedStock?.symbol}
              />
              <Watchlist
                assetType={assetType}
                onSelectStock={handleSelectStock}
                selectedSymbol={selectedStock?.symbol}
                stocks={[]}
              />
            </div>

            {/* 메인 영역 */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              {/* 계좌 카드 */}
              <AccountCard key={`account-${refreshKey}`} />
              
              {/* 차트 */}
              <PriceChart stock={selectedStock} />
              
              {/* 포트폴리오 */}
              <PortfolioTable key={`portfolio-${refreshKey}`} />
              
              {/* 거래 내역 */}
              <HistoryPanel key={`history-${refreshKey}`} />

              {/* AI 분석 버튼 */}
              <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-800">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">{tDiary('aiAnalysis')}</p>
                        <p className="text-sm text-muted-foreground">
                          {tDiary('aiAnalysisDesc')}
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleRequestAIAnalysis} className="bg-purple-500 hover:bg-purple-600">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {tCommon('analyze')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 포트폴리오 페이지 하단 광고 배너 */}
              <AdBannerCompact className="mt-4" />
            </div>

            {/* 오른쪽 사이드바 - 호가창 & 매매 패널 */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <OrderBook stock={selectedStock} />
              <TradingPanel 
                stock={selectedStock} 
                onOrderComplete={handleOrderComplete}
              />
            </div>
          </div>
        </main>
      )}

      {/* 분석 탭 */}
      {activeTab === 'analysis' && (
        <main className="container mx-auto px-4 py-6">
          {analysisLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 분석 요약 */}
              {analysisData?.summary && (
                <AnalysisSummary 
                  summary={analysisData.summary} 
                  riskLevel={analysisData.riskMetrics?.riskLevel}
                />
              )}

              {/* 차트 그리드 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 섹터 분산도 */}
                {analysisData?.sectorAllocation && (
                  <PortfolioPieChart data={analysisData.sectorAllocation} />
                )}

                {/* 자산 배분 */}
                {analysisData?.assetAllocation && (
                  <AssetAllocation data={analysisData.assetAllocation} />
                )}

                {/* 수익률 차트 */}
                {analysisData?.returnData && (
                  <ReturnLineChart data={analysisData.returnData} />
                )}

                {/* 리스크 분석 */}
                {analysisData?.riskMetrics && (
                  <RiskMeter data={analysisData.riskMetrics} />
                )}
              </div>

              {/* 벤치마크 비교 */}
              {benchmarkData && analysisData?.returnData && (
                <BenchmarkComparison 
                  benchmarkData={benchmarkData}
                  portfolioReturn={analysisData.returnData.totalReturnRate}
                  portfolioData={analysisData.returnData}
                />
              )}

              {/* 랭킹 & 계좌 관리 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Leaderboard />
                <AccountSettings onRefresh={fetchAnalysisData} />
              </div>

              {/* 분석 탭 하단 광고 배너 */}
              <AdBannerCompact className="mt-6" />
            </div>
          )}
        </main>
      )}

      {/* 학습센터 탭 */}
      {activeTab === 'learning' && (
        <main className="container mx-auto px-4 py-6">
          {/* 진도 추적 */}
          <div className="mb-6">
            <ProgressTracker stats={progressStats} />
          </div>

          {!selectedCategorySlug ? (
            // 카테고리 목록
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{tLearning('category.title')}</h2>
                <Badge variant="secondary">
                  {tLearning('category.total', { count: learningCategories.length })}
                </Badge>
              </div>
              <LearningCardList
                progressData={progressData}
                onSelectCategory={handleSelectCategory}
              />
              
              {/* 학습 목록 하단 광고 배너 */}
              <AdBannerCompact className="mt-6" />
            </div>
          ) : (
            // 학습 상세 화면
            <div className="grid grid-cols-12 gap-4">
              {/* 왼쪽 사이드바 - 토픽 목록 */}
              <div className="col-span-12 lg:col-span-3">
                <TopicSidebar
                  category={currentCategory!}
                  topics={categoryTopics}
                  currentTopicSlug={selectedTopicSlug || ''}
                  completedTopics={completedTopics}
                  onSelectTopic={handleSelectTopic}
                />
                <Button 
                  variant="ghost" 
                  className="mt-2 w-full"
                  onClick={() => {
                    setSelectedCategorySlug(null);
                    setSelectedTopicSlug(null);
                  }}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {tLearning('backToCategory')}
                </Button>
              </div>

              {/* 메인 영역 - 학습 콘텐츠 */}
              <div className="col-span-12 lg:col-span-9">
                <Card className="h-[calc(100vh-200px)]">
                  {currentTopic && currentCategory && (
                    <LearningContent
                      topic={currentTopic}
                      category={currentCategory}
                      isCompleted={completedTopics.includes(currentTopic.slug)}
                      hasNext={hasNext}
                      hasPrev={hasPrev}
                      onMarkComplete={handleMarkComplete}
                      onOpenQuiz={handleOpenQuiz}
                      onPrev={handlePrevTopic}
                      onNext={handleNextTopic}
                    />
                  )}
                </Card>
              </div>
            </div>
          )}
        </main>
      )}

      {/* 관리자 탭 */}
      {activeTab === 'admin' && (
        <main className="container mx-auto px-4 py-6">
          <AdminSettings />
        </main>
      )}

      {/* 퀴즈 모달 */}
      <QuizModal
        open={isQuizOpen}
        onOpenChange={setIsQuizOpen}
        questions={quizQuestions}
        topicTitle={quizTopicTitle}
        onComplete={handleQuizComplete}
      />

      {/* 보상형 광고 컴포넌트 */}
      {RewardedAdComponent}

      {/* 푸터 */}
      <footer className="bg-white dark:bg-gray-800 border-t mt-8 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t('app.disclaimer')}
          </p>
          <p className="text-xs mt-1">{t('app.copyright')}</p>
        </div>
        {/* 푸터 광고 배너 */}
        <div className="container mx-auto px-4 mt-4">
          <AdBannerCompact />
        </div>
      </footer>
      
      {/* 면책 고지 배너 */}
      <DisclaimerBanner />
    </div>
  );
}

export default function TradingPage() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  
  return (
    <AuthProvider>
      <AdProvider clientId={clientId}>
        <DisclaimerModal />
        <MainContent />
      </AdProvider>
    </AuthProvider>
  );
}
