# 주식·코인 투자 학습 & 모의투자 앱 개발 로그

## 프로젝트 개요
- **기술스택**: Next.js 16, TypeScript, Tailwind CSS, Prisma, Recharts
- **주요 기능**: 학습 콘텐츠, 모의투자, 투자일기 AI분석, 포트폴리오 분석
- **다국어**: 한국어 기본, 다국어 지원
- **UI**: 모바일 앱 스타일 / 데스크탑 대시보드

---
Task ID: 0
Agent: Main Coordinator
Task: 프로젝트 초기화 및 작업 분배

Work Log:
- 프로젝트 구조 분석 완료
- 필수 의존성 확인 (recharts, zustand, next-intl, prisma 등)
- 10개 주요 작업으로 분리하여 에이전트 할당 계획 수립

Stage Summary:
- Next.js 16 프로젝트 기반 구조 확인
- 병렬 개발을 위한 작업 분배 계획 완료

---
Task ID: 1-c
Agent: Frontend Styling Expert
Task: 모바일 앱 UI / 데스크탑 대시보드 반응형 레이아웃 구현

Work Log:

### 1. Tailwind 설정 업데이트 (`tailwind.config.ts`)
- 주식/코인 색상 시스템 추가 (RGB)
  - 주식 상승: `rgb(255, 82, 82)` (빨강)
  - 주식 하락: `rgb(39, 125, 255)` (파랑)
  - 코인 상승: `rgb(255, 193, 7)` (노랑)
  - 코인 하락: `rgb(156, 39, 176)` (보라)
- 커스텀 프라이머리/세컨더리 색상 추가
- 반응형 브레이크포인트 정의
  - 모바일: < 768px
  - 태블릿: 768px ~ 1024px
  - 데스크탑: > 1024px
- Safe Area spacing 변수 추가

### 2. CSS 변수 및 스타일 (`globals.css`)
- 주식/코인 색상 CSS 변수 추가
- Safe Area 대응 CSS 클래스
- Pull to Refresh 애니메이션
- 스와이프 카드 효과
- 모바일 터치 하이라이트 제거
- 커스텀 스크롤바 스타일링

### 3. 테마 시스템 구현
- `ThemeProvider` 컴포넌트 (next-themes 활용)
- 라이트/다크 모드 지원
- 시스템 설정 자동 감지

### 4. 레이아웃 컴포넌트 구현
#### 공통 컴포넌트 (`/src/components/layout/`)
- `theme-provider.tsx`: 테마 프로바이더
- `header.tsx`: 상단 헤더 (타이틀, 알림, 프로필, 테마 토글)
- `bottom-nav.tsx`: 하단 탭 네비게이션 (홈, 학습, 투자, 포트폴리오, 더보기)
- `sidebar.tsx`: 사이드바 네비게이션 (접기/펼치기 지원)
- `navigation.tsx`: 네비게이션 링크 컴포넌트

#### 레이아웃 컴포넌트
- `mobile-layout.tsx`:
  - 하단 탭 네비게이션
  - Safe Area 대응
  - Pull to Refresh 효과
  - 최대 너비 제한 (모바일 앱 스타일)
  
- `desktop-layout.tsx`:
  - 왼쪽 사이드바 네비게이션
  - 사이드바 접기/펼치기
  - 대시보드 그리드 레이아웃
  - `DashboardCard`, `DashboardSection` 컴포넌트
  
- `responsive-layout.tsx`:
  - 자동 레이아웃 전환 (모바일/데스크탑)
  - `ResponsiveContainer`, `ResponsiveGrid` 컴포넌트
  - `useResponsiveBreakpoint` 훅

### 5. 커스텀 훅 (`/src/hooks/`)
- `use-responsive.ts`:
  - `useIsMobile()`: 모바일 여부 확인
  - `useIsTablet()`: 태블릿 여부 확인
  - `useIsDesktop()`: 데스크탑 여부 확인
  - `useResponsive()`: 통합 반응형 상태
  - `useBreakpoint()`: 현재 브레이크포인트 반환

### 6. 앱 설정 업데이트
- `layout.tsx`: ThemeProvider 적용, viewport 설정, 한글 메타데이터
- `page.tsx`: 반응형 레이아웃 데모 페이지

Stage Summary:
- 모바일 앱 스타일 UI 구현 완료
- 데스크탑 대시보드 레이아웃 구현 완료
- 반응형 자동 전환 시스템 구축
- 주식/코인 색상 시스템 적용
- 라이트/다크 모드 지원

---
## Task ID: 1-a - Prisma 스키마 설계 에이전트
### Work Task
주식·코인 투자 학습 & 모의투자 앱의 Prisma 데이터베이스 스키마 설계

### Work Summary

#### 설계한 모델 (총 10개)

1. **User (사용자)**
   - 기본 정보: id, email, name, createdAt, updatedAt
   - 사용자 설정: language(언어), theme(테마), investmentStyle(투자성향)
   - 모의투자 계좌: initialBalance(초기자금 1000만원), currentBalance(현재잔고)

2. **Settings (설정)**
   - User와 1:1 관계
   - 알림 설정: pushNotification, emailNotification, priceAlertEnabled
   - 표시 설정: currencyUnit, chartStyle, darkModeEnabled

3. **LearningContent (학습 콘텐츠)**
   - 카테고리 Enum: STOCK_BASICS, CHART_ANALYSIS, INVESTMENT_STRATEGY, RISK_MANAGEMENT
   - 콘텐츠: title, description, content(Markdown), example
   - 메타 정보: difficulty(1-5), order, isActive, estimatedMinutes

4. **Quiz (퀴즈)**
   - LearningContent와 N:1 관계
   - 문제: question, options(JSON), correctAnswer, explanation

5. **LearningProgress (학습 진도)**
   - User와 LearningContent의 N:N 관계 테이블
   - 진도: isCompleted, completedAt, quizScore, quizAttempts, timeSpent

6. **Portfolio (모의투자 포트폴리오)**
   - 종목 정보: assetType(STOCK/COIN), symbol, name
   - 매입 정보: buyPrice, quantity, totalCost
   - 현재 정보: currentPrice, evaluatedAmount, profitRate, profitAmount

7. **Transaction (거래 내역)**
   - 거래 정보: transactionType(BUY/SELL), orderType(MARKET/LIMIT)
   - 주문: price, quantity, totalAmount, fee
   - 상태: PENDING/COMPLETED/CANCELLED

8. **InvestmentDiary (투자 일기)**
   - 일기: date, tradeSummary, emotionState, tradeReason
   - AI 분석: aiAnalysis, improvements

9. **EmotionAnalysis (감정 분석)**
   - 감정 유형 Enum: GREED, FEAR, HOPE, ANXIETY, CONFIDENCE
   - 분석: emotionType, intensity(1-10), aiComment

10. **PriceHistory (시세 데이터)**
    - OHLCV: openPrice, highPrice, lowPrice, closePrice, volume
    - 시간: timestamp, interval(1m, 5m, 15m, 1h, 4h, 1d, 1w)

#### 보안 고려사항
- 모든 관계에 onDelete: Cascade 적용으로 고아 데이터 방지
- @@unique 제약조건으로 중복 데이터 방지
- @@index로 쿼리 성능 최적화
- Prisma ORM 사용으로 SQL Injection 방지

#### 완료 작업
- ✅ Prisma 스키마 설계 완료
- ✅ npm run db:push 실행하여 DB 동기화 완료
- ✅ Prisma Client 자동 생성 완료

---
## Task ID: 1-b - 다국어 시스템 구현 에이전트
### Work Task
next-intl을 활용한 다국어 시스템 구현 (한국어 기본)

### Work Summary

#### 지원 언어
- 한국어 (ko) - 기본 언어
- 영어 (en)
- 일본어 (ja)
- 중국어 (zh)

#### 생성한 파일 구조
```
/src/
  ├── i18n/
  │   ├── routing.ts      # 라우팅 설정 (locales, defaultLocale)
  │   └── request.ts      # 요청별 메시지 로딩
  ├── locales/
  │   ├── ko/             # 한국어 번역
  │   │   ├── common.json
  │   │   ├── learning.json
  │   │   ├── trading.json
  │   │   ├── diary.json
  │   │   └── analysis.json
  │   ├── en/             # 영어 번역
  │   │   └── ...
  │   ├── ja/             # 일본어 번역
  │   │   └── ...
  │   └── zh/             # 중국어 번역
  │       └── ...
  ├── components/
  │   └── language-switcher.tsx  # 언어 전환 드롭다운 컴포넌트
  └── app/
      └── [locale]/       # 다국어 라우팅
          ├── layout.tsx  # NextIntlClientProvider 설정
          └── page.tsx    # 다국어 적용된 홈페이지
```

#### 번역 파일 구성
1. **common.json**: 네비게이션, 공통 UI, 언어 설정, 시간, 유효성 검사, 오류 메시지, 앱 정보
2. **learning.json**: 학습 센터, 카테고리, 진도, 레슨, 퀴즈, 수료증
3. **trading.json**: 모의투자, 계좌 잔고, 주문, 포지션, 종목 정보, 투자 용어
4. **diary.json**: 투자 일기, 작성, 목록, AI 분석, 통계, 감정 상태
5. **analysis.json**: 포트폴리오 분석, 개요, 수익률, 리스크, 분산투자, 비교 분석

#### 주요 번역 키
- **네비게이션**: 홈, 학습, 모의투자, 포트폴리오, 일기, 설정
- **공통 UI**: 확인, 취소, 저장, 삭제, 로딩중, 오류, 성공 등
- **투자 용어**: 매수, 매도, 시장가, 지정가, 수익률, 손실, 레버리지, 리밸런싱 등

#### 설정 파일
- **next.config.ts**: next-intl 플러그인 적용
- **middleware.ts**: locale 감지 및 리다이렉트 처리
- **[locale]/layout.tsx**: NextIntlClientProvider로 메시지 제공

#### 언어 전환 컴포넌트
- 드롭다운 메뉴 방식
- 현재 언어 표시 (국기 아이콘 + 언어명)
- 선택된 언어 체크 표시
- 반응형 디자인 (모바일: 국기만 표시, 데스크탑: 국기+언어명)

#### 완료 작업
- ✅ i18n 설정 파일 생성 (routing.ts, request.ts)
- ✅ 4개 언어 번역 파일 생성 (총 20개 파일)
- ✅ 미들웨어 설정으로 locale 라우팅 구현
- ✅ next.config.ts에 next-intl 플러그인 적용
- ✅ 언어 전환 컴포넌트 구현
- ✅ [locale] 기반 라우팅 구조 적용
- ✅ 다국어 홈페이지 구현
- ✅ lint 검증 완료

---
## Task ID: 2-b - 모의투자 시스템 개발
### Work Task
주식/코인 모의투자 시스템 개발 (계좌 시스템, 매수/매도, 실시간 시세, 포트폴리오, 거래 내역)

### Work Summary

#### 1. Prisma 스키마 정의
- **Account**: 모의투자 계좌 (시작 자금 1000만원)
- **Holding**: 보유 종목 (평균 매입가, 수량, 섹터)
- **Order**: 주문 (시장가/지정가, 매수/매도, 상태 관리)
- **Transaction**: 거래 내역 (체결 가격, 수수료)
- **StockInfo**: 종목 정보 (현재가, 등락률, 시가총액)
- **ChartData**: 차트 데이터 (OHLCV)

#### 2. API 라우트 개발
- `/api/trading/account` - 계좌 정보 조회 (예수금, 평가금액, 총 수익률)
- `/api/trading/order` - 주문 처리 (매수/매도, 시장가/지정가, 수수료 계산)
- `/api/trading/portfolio` - 포트폴리오 조회 (보유 종목, 수익률, 섹터 분포)
- `/api/trading/history` - 거래 내역 (주문/체결 내역, 일별 요약)
- `/api/trading/stocks` - 주식 종목 리스트 (삼성전자, SK하이닉스 등 20종목)
- `/api/trading/coins` - 코인 종목 리스트 (비트코인, 이더리움 등 20종목)
- `/api/trading/chart` - 차트 데이터 (분봉/일봉/주봉)
- `/api/trading/update-prices` - 실시간 가격 업데이트

#### 3. 프론트엔드 컴포넌트 개발
- **AccountCard**: 계좌 정보 카드 (총 자산, 예수금, 평가금액, 수익률)
- **StockList**: 종목 리스트 (검색, 인기/상승/하락 탭, 선택 기능)
- **PriceChart**: 가격 차트 (Recharts AreaChart, 거래량 바차트, 인터벌 전환)
- **TradingPanel**: 매매 패널 (호가창, 주문 폼)
- **OrderForm**: 주문 폼 (시장가/지정가, 수량 입력, 수수료 계산, 주문 확인 모달)
- **PortfolioTable**: 포트폴리오 테이블 (보유 종목, 평가금액, 수익률)
- **HistoryPanel**: 거래 내역 (체결 내역, 주문 내역 탭)

#### 4. 상태 관리
- **Zustand Store** (`useTradingStore`): 계좌, 선택 종목, 자산 타입, 포트폴리오, 주문 내역, 차트 데이터

#### 5. 실시간 기능
- **useRealtimePrice**: 10초마다 자동 새로고침 (Polling 방식)
- 실시간 상태 토글 (Wifi/WifiOff 아이콘)
- 수동 새로고침 버튼

#### 6. 색상 시스템
- 상승: `rgb(255, 82, 82)` (빨강)
- 하락: `rgb(39, 125, 255)` (파랑)
- 보합: `rgb(128, 128, 128)` (회색)

#### 7. 수수료 계산
- 주식: 0.015%
- 코인 (업비트): 0.05%

#### 8. 보안 고려사항
- 거래 금액 검증 (잔고 확인)
- 수량 유효성 검사
- 보유 수량 확인 (매도 시)
- 트랜잭션 처리 (Prisma)

#### 완료 작업
- ✅ Prisma 스키마 정의 및 DB 동기화
- ✅ 8개 API 라우트 개발
- ✅ 7개 프론트엔드 컴포넌트 개발
- ✅ Zustand 상태 관리 구현
- ✅ 실시간 가격 업데이트 기능
- ✅ 메인 페이지 통합
- ✅ lint 검증 완료

---
## Task ID: 2-a - 투자 학습 콘텐츠 시스템 개발
### Work Task
투자 학습 콘텐츠 시스템 개발 (학습 카테고리, 퀴즈 시스템, 진도 추적)

### Work Summary

#### 1. Prisma 스키마 확장
- **LearningCategory**: 학습 카테고리 (주식 기초, 차트 분석, 투자 전략, 위험 관리)
- **LearningTopic**: 학습 토픽 (제목, 내용-Markdown, 순서)
- **Quiz**: 퀴즈 (JSON 형식 문제, 정답, 해설)
- **LearningProgress**: 학습 진도 (완료 여부, 완료 일시)
- **QuizResult**: 퀴즈 결과 (점수, 총 문제 수, 답안)
- **LearningStreak**: 연속 학습 기록 (현재/최장 스트릭, 마지막 학습일)

#### 2. 학습 콘텐츠 데이터 (한국어)
**4개 카테고리, 20개 토픽, 40개 퀴즈 문제**

##### 주식 기초 (5개 토픽)
1. PER (주가수익비율) - 계산법, 해석법, 실전 활용
2. PBR (주가순자산비율) - 자산가치 분석
3. ROE (자기자본이익률) - 수익성 분석, 듀폰 분석
4. 배당주 투자 - 현금흐름, 배당 성장주
5. 주식 시장 구조 - 발행시장, 유통시장, 거래 시간

##### 차트 분석 (5개 토픽)
1. 이동평균선 (MA) - 골든크로스, 데드크로스
2. MACD - 모멘텀 분석, 다이버전스
3. RSI - 과매수/과매도 판단
4. 볼린저 밴드 - 스퀴즈, 밴드폭 분석
5. 거래량 분석 - OBV, 수급 분석

##### 투자 전략 (4개 토픽)
1. 가치투자 - 안전마진, 내재가치, 워렌 버핏 원칙
2. 성장주 투자 - PEG 비율, 성장률 분석
3. 배당투자 - 배당 성장주, 고배당주 전략
4. 모멘텀 투자 - 듀얼 모멘텀, 절대/상대 모멘텀

##### 위험 관리 (4개 토픽)
1. 포트폴리오 분산 - 자산군/지역/섹터 분산
2. 손절매 전략 - 고정 비율, 트레일링 스톱
3. 포지션 사이징 - 켈리 공식, 리스크 패리티
4. 리스크 관리 - VaR, MDD, 베타

#### 3. API 라우트 개발
- `/api/learning` - 학습 데이터 CRUD
  - GET: 전체 토픽 목록, 카테고리별 진도, 통계
  - POST: 학습 완료 표시, 스트릭 업데이트
- `/api/quiz` - 퀴즈 시스템
  - GET: 퀴즈 조회
  - POST: 퀴즈 결과 저장 (최고 점수 유지)

#### 4. 프론트엔드 컴포넌트 개발
- **LearningCard**: 학습 카테고리 카드 (진행률, 완료 상태)
- **LearningCardList**: 카테고리 목록 그리드
- **LearningContent**: 학습 상세 화면 (Markdown 렌더링, 이전/다음 네비게이션)
- **TopicSidebar**: 토픽 목록 사이드바 (완료 상태 표시)
- **QuizModal**: 퀴즈 모달 (객관식, 정답 확인, 해설, 점수)
- **ProgressTracker**: 진도 통계 카드 (진행률, 연속 학습, 퀴즈 평균)
- **LearningSummary**: 학습 요약 카드

#### 5. 주요 기능
- **Markdown 렌더링**: react-markdown으로 학습 콘텐츠 표시
- **퀴즈 시스템**: 4지선다형, 정답 확인, 해설 제공, 점수 기록
- **진도 추적**: 완료한 토픽 표시, 전체 진행률
- **연속 학습**: 스트릭 시스템 (연속 학습 일수 추적)
- **탭 전환**: 모의투자/학습센터 탭 분리

#### 6. UI/UX 특징
- 카드 기반 카테고리 목록
- 사이드바 토픽 네비게이션
- 프로그레스 바로 진행률 시각화
- 뱃지로 완료/진행중 상태 표시
- 반응형 디자인 (모바일/데스크탑)

#### 완료 작업
- ✅ Prisma 스키마 확장 및 DB 동기화
- ✅ 20개 학습 토픽 콘텐츠 작성 (한국어)
- ✅ 40개 퀴즈 문제 작성 (토픽별 2문제)
- ✅ 2개 API 라우트 개발
- ✅ 7개 프론트엔드 컴포넌트 개발
- ✅ 메인 페이지 통합 (탭 구조)
- ✅ lint 검증 완료

---
## Task ID: 3-d - 시큐어코딩 & 보안 기능 구현
### Work Task
시큐어코딩 및 보안 기능 구현 (환경변수 관리, 입력 검증, API 보안, 면책 고지)

### Work Summary

#### 1. 환경변수 관리
- **`.env.example`**: 모든 환경변수 예시 파일 작성
  - 데이터베이스: DATABASE_URL
  - 한국투자증권 API: KIS_APP_KEY, KIS_APP_SECRET, KIS_ACCOUNT_NO
  - 업비트 API: UPBIT_ACCESS_KEY, UPBIT_SECRET_KEY
  - AI API: ANTHROPIC_API_KEY
  - AdSense: NEXT_PUBLIC_ADSENSE_CLIENT_ID, NEXT_PUBLIC_ADSENSE_SLOT_ID
  - 보안 설정: NEXTAUTH_SECRET, NEXTAUTH_URL
  - Rate Limiting: RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MINUTES
  - 로깅: LOG_LEVEL, LOG_SENSITIVE_DATA

- **`/src/lib/env.ts`**: 환경변수 검증 및 관리
  - Zod 스키마로 타입 안전한 환경변수 접근
  - 필수 환경변수 검증
  - 기본값 제공 (개발 환경)
  - API 설정 상태 확인 함수 (`isKisConfigured`, `isUpbitConfigured`, `isAiConfigured`)

#### 2. 입력 검증 스키마 (Zod)

##### `/src/lib/validations/trading.ts` - 거래 검증
- `createOrderSchema`: 주문 생성 검증
  - 종목 코드: 대문자 영문+숫자, 1-20자
  - 수량: 양수, 최대 1,000,000
  - 가격: 양수, 최대 1,000억
  - 지정가 주문 시 가격 필수 검증
- `cancelOrderSchema`: 주문 취소 검증
- `getTransactionHistorySchema`: 거래 내역 조회 검증
- `getChartDataSchema`: 차트 데이터 조회 검증

##### `/src/lib/validations/diary.ts` - 일기 검증
- `createDiarySchema`: 일기 작성 검증
  - 내용: 1-5,000자
  - 매매 내역: 최대 1,000자
  - 감정 상태: 최대 500자
- `createEmotionAnalysisSchema`: 감정 분석 검증
  - 감정 유형: GREED, FEAR, HOPE, ANXIETY, CONFIDENCE
  - 감정 강도: 1-10

##### `/src/lib/validations/auth.ts` - 인증 검증
- `signUpSchema`: 회원가입 검증
  - 이메일: 유효한 이메일 형식
  - 사용자명: 2-30자, 한글/영문/숫자/언더스코어
  - 비밀번호: 8자 이상, 대소문자+숫자+특수문자 포함
- `signInSchema`: 로그인 검증
- `changePasswordSchema`: 비밀번호 변경 검증

#### 3. 보안 미들웨어

##### `/src/lib/security/rate-limit.ts` - Rate Limiting
- 메모리 기반 요청 제한 (프로덕션에서는 Redis 권장)
- 슬라이딩 윈도우 알고리즘
- IP + 엔드포인트 기반 추적
- 기본 설정: 분당 100회 요청
- 커스텀 Rate Limiter 지원
  - `strictRateLimiter`: 분당 10회 (민감 엔드포인트용)
  - `authRateLimiter`: 15분당 5회 (로그인 무차별 대입 방지)
- 응답 헤더: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

##### `/src/lib/security/sanitize.ts` - 입력 정제
- `escapeHtml`: HTML 특수 문자 이스케이프 (XSS 방지)
- `stripDangerousTags`: 위험한 HTML 태그 제거 (script, iframe, etc.)
- `sanitizeText`: XSS 방지 텍스트 정제
- `sanitizeHtml`: HTML 콘텐츠 정제 (Markdown 등)
- `sanitizeUrl`: URL 프로토콜 검증
- `sanitizeEmail`: 이메일 정제
- `sanitizeNumber`: 숫자 입력 정제 (범위, 정수 여부)
- `sanitizeFilename`: 파일명 정제 (경로 탐색 방지)
- `sanitizeObject`: 객체 전체 정제
- `escapeSql`: SQL 이스케이프 (Raw 쿼리용)

#### 4. 면책 고지 컴포넌트

##### `/src/components/common/disclaimer-modal.tsx`
- 앱 시작 시 자동 표시 모달
- "다시 보지 않기" 옵션 (localStorage 저장)
- 3개 섹션 구성:
  - 주의사항 (투자 권유 아님, 모의투자 안내)
  - 위험 고지 (투자 위험성 안내)
  - 데이터 보안 (암호화, 실제 자금 미저장)

##### `/src/components/common/disclaimer-banner.tsx`
- 하단 고정 배너
- 확장/축소 기능
- 닫기 버튼
- 3개 변형:
  - `DisclaimerBanner`: 하단 고정 배너
  - `DisclaimerInline`: 페이지 내부 인라인
  - `DisclaimerText`: 간단 텍스트

#### 5. 보안 유틸리티 함수

##### `/src/lib/utils/security.ts`
- **마스킹 함수**:
  - `maskSensitiveData`: 민감 정보 마스킹 (앞뒤 일부만 표시)
  - `maskEmail`: 이메일 마스킹 (a***b@domain.com)
  - `maskPhoneNumber`: 전화번호 마스킹 (010-****-1234)
  - `maskCardNumber`: 카드번호 마스킹
  - `maskAccountNumber`: 계좌번호 마스킹

- **보안 로깅**:
  - `secureLog`: 민감 정보 자동 마스킹 로깅
  - `logger`: 편의 로깅 함수 (debug, info, warn, error)
  - 민감 키 자동 감지 (password, secret, token, api_key 등)

- **토큰 생성**:
  - `generateRandomToken`: 랜덤 토큰 생성 (crypto API 사용)
  - `generateUuid`: UUID v4 생성
  - `simpleHash`: SHA-256 해시 생성
  - `generateRequestId`: 요청 추적용 ID 생성

- **보안 헤더**: `getSecurityHeaders()`
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
  - Content-Security-Policy

- **유틸리티**:
  - `formatValidationErrors`: 검증 에러 포맷팅
  - `safeJsonParse`: 안전한 JSON 파싱
  - `validateInputLength`: 입력 길이 검증
  - `detectCspViolation`: CSP 위반 감지

#### 6. API 보안 적용

##### 주문 API (`/api/trading/order/route.ts`)
- Rate Limiting 적용
- Zod 스키마로 입력 검증
- 보안 로깅 적용
- Prisma 파라미터로 SQL Injection 방지

##### 학습 API (`/api/learning/route.ts`)
- Rate Limiting 적용 (POST 메서드)
- Zod 스키마로 입력 검증

#### 7. 메인 페이지 통합
- `DisclaimerModal`: 앱 시작 시 자동 표시
- `DisclaimerBanner`: 하단 고정 배너
- 배너 공간 확보를 위한 하단 패딩 추가

#### 생성한 파일 목록
```
/src/lib/
├── env.ts                    # 환경변수 검증
├── validations/
│   ├── index.ts              # 검증 스키마 통합
│   ├── trading.ts            # 거래 검증
│   ├── diary.ts              # 일기 검증
│   └── auth.ts               # 인증 검증
├── security/
│   ├── index.ts              # 보안 모듈 통합
│   ├── rate-limit.ts         # Rate Limiting
│   └── sanitize.ts           # 입력 정제
└── utils/
    └── security.ts           # 보안 유틸리티

/src/components/common/
├── index.ts                  # 공통 컴포넌트 통합
├── disclaimer-modal.tsx      # 면책 고지 모달
└── disclaimer-banner.tsx     # 면책 고지 배너

/.env.example                 # 환경변수 예시
```

#### 완료 작업
- ✅ 환경변수 관리 (.env.example, 검증 로직)
- ✅ 입력 검증 스키마 작성 (trading, diary, auth)
- ✅ 보안 미들웨어 구현 (Rate Limiting, sanitize)
- ✅ 면책 고지 컴포넌트 구현 (모달, 배너)
- ✅ 보안 유틸리티 함수 작성
- ✅ 메인 페이지에 보안 기능 통합
- ✅ API에 Rate Limiting 및 입력 검증 적용

---
## Task ID: 3-e - PWA 설정 & Google AdSense 통합
### Work Task
PWA(Progressive Web App) 설정 및 Google AdSense 광고 통합

### Work Summary

#### 1. PWA 아이콘 생성
- **icon-192x192.png**: PWA 필수 아이콘 (192x192)
- **icon-512x512.png**: PWA 고해상도 아이콘 (512x512)
- **apple-touch-icon.png**: iOS 홈 화면 아이콘 (180x180)
- **favicon.png**: 브라우저 탭 파비콘 (32x32)
- 아이콘 디자인: 상승 차트 + 학사모, 빨강-파랑 그라데이션 배경

#### 2. PWA manifest.json 설정
```json
{
  "name": "투자학습 모의투자",
  "short_name": "투자학습",
  "display": "standalone",
  "theme_color": "#ef4444",
  "start_url": "/",
  "icons": [192x192, 512x512],
  "shortcuts": [모의투자, 학습센터]
}
```

#### 3. Service Worker 구현 (`public/sw.js`)
- **캐시 전략**: Stale-while-revalidate
- **코어 자산 캐싱**: /, manifest.json, 아이콘 파일
- **API 요청**: Network-first (오프라인 시 503 응답)
- **백그라운드 동기화**: 오프라인 주문 동기화
- **푸시 알림**: 알림 수신 및 클릭 핸들러

#### 4. next-pwa 통합 (`next.config.ts`)
- next-pwa 플러그인 설치 및 설정
- 개발 모드에서 PWA 비활성화
- 런타임 캐싱 규칙:
  - 폰트: Cache-first (365일)
  - 이미지: Stale-while-revalidate (30일)
  - 정적 자산: Stale-while-revalidate (24시간)
  - API 데이터: Network-first (24시간)

#### 5. PWA 메타 태그 (`src/app/layout.tsx`)
- viewport 설정 (theme-color, mobile-web-app-capable)
- Apple Web App 설정
- Open Graph / Twitter Card 설정
- manifest.json 링크

#### 6. Google AdSense 컴포넌트 개발 (`/src/components/ads/`)

##### ad-provider.tsx
- AdSense 스크립트 로드
- 광고 차단기 감지
- 컨텍스트 API로 상태 공유

##### ad-banner.tsx
- 배너 광고 컴포넌트
- 포맷 지원: auto, horizontal, vertical, rectangle
- 광고 차단 시 대체 콘텐츠
- 개발 모드에서 설정 안내 표시

##### rewarded-ad.tsx
- 보상형 광고 컴포넌트
- 5초 카운트다운 광고 시청
- 광고 완료 후 콜백 실행
- AI 투자 일기 분석 기능에 연동

#### 7. 광고 배치 위치
- **학습 목록 하단**: AdBannerCompact
- **포트폴리오 페이지 하단**: AdBannerCompact
- **푸터 하단**: AdBannerCompact
- **AI 분석 버튼**: 보상형 광고 연동

#### 8. 환경변수 설정 (`.env.example`)
```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_BANNER=xxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_REWARDED=xxxxxxxx
```

#### 9. 오프라인 페이지 (`public/offline.html`)
- 네트워크 연결 실패 시 표시
- 다시 시도 버튼

### 생성한 파일
```
/public/
├── manifest.json       # PWA 매니페스트
├── sw.js              # 서비스 워커
├── offline.html       # 오프라인 페이지
├── icon-192x192.png   # PWA 아이콘
├── icon-512x512.png   # PWA 아이콘
├── apple-touch-icon.png
└── favicon.png

/src/components/ads/
├── ad-provider.tsx    # AdSense 프로바이더
├── ad-banner.tsx      # 배너 광고
├── rewarded-ad.tsx    # 보상형 광고
└── index.ts           # 내보내기

/.env.example          # 환경변수 예시
```

### 완료 작업
- ✅ PWA 아이콘 4종 생성
- ✅ manifest.json 작성
- ✅ Service Worker 구현
- ✅ next-pwa 통합 설정
- ✅ AdSense 컴포넌트 3개 개발
- ✅ 메인 페이지에 광고 통합
- ✅ 오프라인 페이지 작성
- ✅ 환경변수 예시 파일 생성
- ✅ lint 검증 완료

---
## Task ID: 3-b - 투자 일기 & Claude AI 분석 기능 구현
### Work Task
투자 일기 작성, 감정 상태 체크, Claude AI 분석, 누적 통계 기능 구현

### Work Summary

#### 1. Prisma 스키마 확장
**InvestmentDiary 모델 확장**
- `content`: 일기 내용 (자유 텍스트)
- `emotionScore`: 감정 강도 (1-10)
- `emotions`: 감정 리스트 (JSON: [{type, intensity}])
- `selfRating`: 자가평가 (1-5점)
- `investmentStyle`: 분석된 투자 성향

#### 2. API 라우트 개발

##### `/api/diary/route.ts` - 일기 CRUD
- **GET**: 일기 목록 조회 (페이지네이션, 날짜별 조회)
- **POST**: 일기 작성/업데이트 (같은 날짜 자동 업데이트)
- **PUT**: 일기 수정
- **DELETE**: 일기 삭제
- 감정 분석 데이터 자동 생성

##### `/api/diary/analyze/route.ts` - AI 분석
- **POST**: Claude AI 분석 요청
  - 매매 패턴 분석
  - 감정 영향 분석
  - 투자 성향 진단 (보수적/중립적/공격적)
  - 개선점 제안
  - 칭찬할 점
  - 주의할 점
  - 종합 코멘트
- **GET (action=cumulative)**: 누적 분석
  - 투자 성향 변화 추이
  - 감정 패턴 통계
  - 성장 영역 분석
- z-ai-web-dev-sdk 사용
- 분석 결과 DB 저장 (캐싱)

##### `/api/diary/stats/route.ts` - 통계
- 총 일기 수 / 이번 달 작성 수
- 연속 작성 일수 / 최장 연속 기록
- 감정 분포 통계
- 투자 성향 분포
- 평균 자가평가
- 최근 7일 작성 현황

#### 3. 프론트엔드 컴포넌트 개발

##### emotion-checker.tsx - 감정 체크
- 5가지 감정 유형 지원:
  - 욕심 (GREED): 주황 `rgb(255, 152, 0)`
  - 공포 (FEAR): 보라 `rgb(156, 39, 176)`
  - 희망 (HOPE): 녹색 `rgb(76, 175, 80)`
  - 불안 (ANXIETY): 빨강 `rgb(255, 82, 82)`
  - 자신감 (CONFIDENCE): 파랑 `rgb(33, 150, 243)`
- 감정별 아이콘 및 색상
- 강도 조절 슬라이더 (1-10)
- 다중 감정 선택 가능

##### diary-editor.tsx - 일기 작성 에디터
- 날짜 선택 (기본: 오늘)
- 매매 내역 자동 불러오기
- 매매 이유 입력
- 감정 체크 통합
- 일기 내용 작성
- 자가평가 (별점 1-5)
- 작성 내용 요약 표시

##### ai-analysis.tsx - AI 분석 결과
- 로딩 상태 표시
- 투자 성향 뱃지
- 매매 패턴 분석
- 감정 영향 분석
- 칭찬할 점 리스트
- 개선 제안 리스트
- 주의할 점 리스트
- 종합 코멘트
- 캐시된 분석 표시

##### diary-history.tsx - 일기 목록
- 페이지네이션 (무한 스크롤)
- 일기 카드 표시
  - 날짜, 투자 성향, AI 분석 완료 여부
  - 내용 요약
  - 주요 감정 뱃지
  - 자가평가 별점
- 삭제 기능
- 선택 시 상세 표시

##### investment-pattern.tsx - 투자 패턴 차트
- 통계 요약 카드 (총 일기, 이번 달, 연속 작성, 평균 자가평가)
- 주요 감정 표시
- 최근 7일 작성 현황 (BarChart)
- 감정 분포 (가로 BarChart)
- 투자 성향 분포 (PieChart)
- Recharts 라이브러리 사용

#### 4. 메인 페이지 통합
- 3개 탭 구조: 모의투자 / 학습센터 / 투자일기
- 일기 탭 3열 레이아웃:
  - 왼쪽: 일기 목록
  - 중앙: 일기 작성 에디터
  - 오른쪽: AI 분석 & 통계

#### 5. 다국어 업데이트
- `diary.json` 한국어 번역 확장
- 감정, 분석, 통계 관련 키 추가

### 생성한 파일
```
/src/app/api/diary/
├── route.ts           # 일기 CRUD
├── analyze/route.ts   # AI 분석
└── stats/route.ts     # 통계

/src/components/diary/
├── emotion-checker.tsx    # 감정 체크
├── diary-editor.tsx       # 일기 작성
├── ai-analysis.tsx        # AI 분석 결과
├── diary-history.tsx      # 일기 목록
└── investment-pattern.tsx # 투자 패턴 차트
```

### 기술 특징
- **AI 분석**: z-ai-web-dev-sdk 사용 (백엔드)
- **차트**: Recharts (BarChart, PieChart, LineChart)
- **상태 관리**: React useState (일기 선택, 분석 결과)
- **색상 시스템**: 감정별 고유 RGB 색상

### 완료 작업
- ✅ Prisma 스키마 확장 및 DB 동기화
- ✅ 3개 API 라우트 개발
- ✅ 5개 프론트엔드 컴포넌트 개발
- ✅ Claude AI 분석 연동
- ✅ 메인 페이지에 일기 탭 추가
- ✅ 다국어 파일 업데이트
- ✅ lint 검증 완료

---
## Task ID: 4 - 이미지 리소스 생성 & README 작성
### Work Task
앱 아이콘 및 히어로 이미지 생성, README 문서 작성

### Work Summary

#### 1. AI 이미지 생성 (z-ai-web-dev-sdk)
- **PWA 아이콘 (192x192, 512x512)**: 상승 차트 + 금융 아이콘, 빨강-파랑 그라데이션
- **Apple Touch Icon**: 학사모 + 차트 결합 디자인
- **학습 히어로 이미지**: 주식 교육 일러스트레이션
- **투자일기 히어로 이미지**: 노트와 차트, 펜 일러스트
- **포트폴리오 히어로 이미지**: 대시보드 분석 시각화
- **모의투자 히어로 이미지**: 스마트폰 매매 인터페이스

#### 2. README.md 작성
- 프로젝트 개요 및 기술 스택
- 주요 기능 설명 (학습, 모의투자, 일기, 분석)
- UI/UX 특징 (반응형, 색상, 테마)
- 다국어 지원 표
- 설치 및 실행 가이드
- 환경변수 설명
- 프로젝트 구조
- 보안 기능 설명
- PWA 기능 설명
- 라이선스 및 주의사항

#### 3. 이미지 저장 위치
```
/public/
├── icon-192x192.png      # PWA 아이콘
├── icon-512x512.png      # PWA 고해상도 아이콘
├── apple-touch-icon.png  # iOS 홈화면 아이콘
└── images/
    ├── learning-hero.png    # 학습 히어로
    ├── diary-hero.png       # 투자일기 히어로
    ├── portfolio-hero.png   # 포트폴리오 히어로
    └── trading-hero.png     # 모의투자 히어로
```

### 완료 작업
- ✅ PWA 아이콘 3종 생성
- ✅ 히어로 이미지 4종 생성
- ✅ README.md 작성
- ✅ worklog.md 업데이트

---
## 🎉 프로젝트 완료 요약

### 개발 완료 기능
1. ✅ **데이터베이스 스키마** (Prisma) - 10개 모델
2. ✅ **다국어 시스템** (next-intl) - 한국어/영어/일본어/중국어
3. ✅ **반응형 레이아웃** - 모바일 앱 UI / 데스크탑 대시보드
4. ✅ **학습 콘텐츠** - 4카테고리, 20토픽, 40퀴즈
5. ✅ **모의투자** - 주식/코인 매매, 실시간 시세
6. ✅ **실시간 시세 API** - 한국투자증권/업비트/Yahoo Finance
7. ✅ **투자 일기** - 감정 체크, AI 분석 (Claude)
8. ✅ **포트폴리오 분석** - Recharts 차트, 리스크 지표
9. ✅ **보안 기능** - Rate Limiting, 입력 검증, 면책 고지
10. ✅ **PWA & AdSense** - 오프라인 지원, 광고 통합
11. ✅ **이미지 리소스** - AI 생성 아이콘 및 히어로 이미지

### 기술 스택
- Next.js 16 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma + SQLite
- Recharts + Zustand
- z-ai-web-dev-sdk (Claude AI)
- next-intl (다국어)

---
## Task ID: 5 - 최종 버그 수정
### Work Task
API 라우트 버그 수정 및 다국어 번역 업데이트

### Work Summary

#### 1. API 라우트 수정
- `account/route.ts`: `db.account` → `db.user` 로 수정
- `portfolio/route.ts`: `db.holding` → `db.portfolio` 로 수정
- `history/route.ts`: `db.transaction` 모델 사용하도록 수정
- `order/route.ts`: `User`, `Portfolio`, `Transaction` 모델 사용하도록 재작성

#### 2. 다국어 번역 업데이트
- `ko/common.json`: 모든 키 추가 (trading, learning, diary, analysis)
- `en/common.json`: 영어 번역 업데이트

#### 3. 페이지 라우팅 수정
- `/src/app/page.tsx` 삭제 (다국어 라우팅 사용)
- `/src/app/[locale]/page.tsx` 메인 앱으로 통합
- ThemeProvider 추가

- 면책 고지 컴포넌트 통합

### 완료 작업
- ✅ API 라우트 버그 수정
- ✅ 다국어 번역 파일 업데이트
- ✅ 페이지 라우팅 정리
- ✅ Lint 검증 통과 (0 errors, 3 warnings)

---
## 🎉 프로젝트 최종 완료

### 실행 방법
1. **Preview 패널**에서 앱을 확인하세요
2. **"Open in New Tab"** 버튼으로 새 탭에서 열 수 있습니다

### 주요 기능
- 📚 **학습 콘텐츠**: 4개 카테고리, 20개 토픽, 40개 퀴즈
- 💰 **모의투자**: 주식/코인 매매, 실시간 시세
- 📝 **투자 일기**: 감정 체크, AI 분석
- 📊 **포트폴리오 분석**: Recharts 차트, 리스크 지표
- 🌍 **다국어**: 한국어/영어/일본어/중국어
- 🔒 **보안**: Rate Limiting, 입력 검증, 면책 고지
- 📲 **PWA**: 오프라인 지원, 앱 설치
- 💵 **AdSense**: 배너 광고, 보상형 광고

---
## Task ID: 6 - 모의투자 기능 수정 및 활성화
### Work Task
모의투자 기능이 제대로 작동하지 않던 문제 수정

### Work Summary

#### 1. OrderForm 계좌 정보 로드 문제 수정
**문제**: OrderForm 컴포넌트에서 `useTradingStore`의 `account`를 사용했으나, account가 null로 초기화되어 주문 폼이 표시되지 않음

**해결**: OrderForm 컴포넌트를 직접 계좌 정보를 fetch하도록 수정
- `fetchAccount()`: `/api/trading/account` 호출
- `fetchHoldings()`: `/api/trading/portfolio` 호출하여 보유 종목 조회
- 매도 시 보유 수량 확인 로직 추가
- 주문 완료 후 계좌 정보 자동 갱신

#### 2. 실시간 가격 업데이트 API 수정
**문제**: `/api/trading/update-prices`가 존재하지 않는 `StockInfo` 모델을 참조

**해결**: Portfolio 모델의 currentPrice를 업데이트하도록 수정
- 사용자 포트폴리오 조회 후 각 종목 시세 업데이트
- 평가금액, 수익률, 수익금액 자동 계산

#### 3. PortfolioTable 컴포넌트 개선
- `refreshKey` prop 추가로 외부에서 새로고침 트리거 가능
- 실시간 가격 업데이트 버튼 추가
- 로딩 상태 개선

#### 4. AccountCard 컴포넌트 개선
- `refreshKey` prop 추가
- `useCallback`으로 fetch 함수 최적화

#### 5. 루트 페이지 리다이렉트 추가
**문제**: `/src/app/page.tsx` 파일이 없어 404 오류 발생

**해결**: 기본 언어(ko)로 리다이렉트하는 페이지 생성
```typescript
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/ko');
}
```

#### 6. 의존성 설치
- `@swc/helpers` 패키지 설치

### 수정한 파일
```
/src/app/page.tsx                    # 루트 리다이렉트 페이지 생성
/src/components/trading/order-form.tsx    # 계좌 정보 직접 로드
/src/components/trading/portfolio-table.tsx  # 새로고침 기능 추가
/src/components/trading/account-card.tsx    # refreshKey prop 추가
/src/app/api/trading/update-prices/route.ts # Portfolio 업데이트로 수정
/src/lib/trading.ts                   # Account 인터페이스 수정
```

### 완료 작업
- ✅ OrderForm 계좌 정보 로드 수정
- ✅ 매도 시 보유 수량 확인 추가
- ✅ 실시간 가격 업데이트 API 수정
- ✅ PortfolioTable 새로고침 기능 추가
- ✅ 루트 페이지 리다이렉트 추가
- ✅ @swc/helpers 의존성 설치
- ✅ Lint 검증 통과 (0 errors, 3 warnings)
- ✅ Dev 서버 정상 작동 확인
