# 📈 투자학습 모의투자 앱

주식·코인 투자 학습과 모의투자를 결합한 PWA 웹 애플리케이션입니다.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)

## 🌟 주요 기능

### 📚 학습 콘텐츠
- **4개 카테고리**: 주식 기초, 차트 분석, 투자 전략, 위험 관리
- **20개 학습 토픽**: PER, PBR, ROE, 이동평균선, MACD, RSI 등
- **40개 퀴즈**: 각 토픽별 2문제, 해설 포함
- **진도 추적**: 연속 학습 일수, 완료율, 퀴즈 점수

### 💰 모의투자
- **시작 자금**: 1,000만원
- **주식 거래**: 20개 주요 종목 (삼성전자, SK하이닉스 등)
- **코인 거래**: 20개 주요 코인 (비트코인, 이더리움 등)
- **주문 유형**: 시장가, 지정가
- **실시간 시세**: API 연동 (한국투자증권/업비트)

### 📝 투자 일기 & AI 분석
- **일기 작성**: 매매 내역, 감정 상태, 자가 평가
- **감정 체크**: 5가지 감정 (욕심/공포/희망/불안/자신감)
- **Claude AI 분석**: 매매 패턴, 투자 성향, 개선점 제안
- **누적 통계**: 감정 패턴, 투자 성향 변화

### 📊 포트폴리오 분석
- **섹터별 분산도**: 파이 차트
- **수익률 추이**: 라인 차트
- **벤치마크 비교**: 코스피, 코스닥, S&P500
- **리스크 지표**: 표준편차, 샤프 지수, MDD

## 🎨 UI/UX 특징

### 반응형 디자인
- **모바일**: 안드로이드/iOS 스타일 하단 탭 네비게이션
- **데스크탑**: 사이드바 대시보드 레이아웃
- **자동 전환**: 화면 크기에 따른 레이아웃 최적화

### 색상 시스템
- 📈 **주식 상승**: `rgb(255, 82, 82)` 빨강
- 📉 **주식 하락**: `rgb(39, 125, 255)` 파랑
- ⬆️ **코인 상승**: `rgb(255, 193, 7)` 노랑
- ⬇️ **코인 하락**: `rgb(156, 39, 176)` 보라

### 테마
- 라이트/다크 모드 지원
- 시스템 설정 자동 감지

## 🌍 다국어 지원

| 언어 | 코드 | 상태 |
|------|------|------|
| 한국어 | `ko` | ✅ 기본 언어 |
| 영어 | `en` | ✅ 지원 |
| 일본어 | `ja` | ✅ 지원 |
| 중국어 | `zh` | ✅ 지원 |

## 🔧 기술 스택

### 프론트엔드
- **Next.js 16** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안전성
- **Tailwind CSS 4** - 스타일링
- **shadcn/ui** - UI 컴포넌트
- **Recharts** - 차트 라이브러리
- **Zustand** - 상태 관리
- **next-intl** - 다국어

### 백엔드
- **Prisma** - ORM
- **SQLite** - 데이터베이스
- **z-ai-web-dev-sdk** - AI 분석 (Claude)

### API 연동
- **한국투자증권 API** - 주식 시세
- **업비트 API** - 코인 시세
- **Yahoo Finance** - 해외 주식/지수

### PWA
- **Service Worker** - 오프라인 지원
- **Web App Manifest** - 앱 설치

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
bun install
```

### 2. 환경변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 API 키를 입력하세요.

### 3. 데이터베이스 초기화
```bash
bun run db:push
```

### 4. 개발 서버 실행
```bash
bun run dev
```

### 5. 브라우저 접속
우측 Preview 패널에서 앱을 확인하세요.

## 🔐 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `DATABASE_URL` | SQLite 데이터베이스 경로 | ✅ |
| `KIS_APP_KEY` | 한국투자증권 앱키 | ❌ |
| `KIS_APP_SECRET` | 한국투자증권 시크릿키 | ❌ |
| `KIS_ACCOUNT_NO` | 한국투자증권 계좌번호 | ❌ |
| `UPBIT_ACCESS_KEY` | 업비트 액세스키 | ❌ |
| `UPBIT_SECRET_KEY` | 업비트 시크릿키 | ❌ |
| `ANTHROPIC_API_KEY` | Claude API 키 | ❌ |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | AdSense 클라이언트 ID | ❌ |

> API 키가 없어도 모의 데이터로 앱을 사용할 수 있습니다.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── trading/       # 모의투자 API
│   │   ├── learning/      # 학습 API
│   │   ├── diary/         # 투자일기 API
│   │   ├── analysis/      # 분석 API
│   │   └── market/        # 시세 API
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   ├── trading/           # 모의투자 컴포넌트
│   ├── learning/          # 학습 컴포넌트
│   ├── diary/             # 투자일기 컴포넌트
│   ├── analysis/          # 분석 컴포넌트
│   ├── common/            # 공통 컴포넌트
│   └── ads/               # 광고 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/
│   ├── services/          # 외부 API 서비스
│   ├── security/          # 보안 모듈
│   ├── validations/       # 입력 검증 스키마
│   └── utils/             # 유틸리티 함수
├── locales/               # 다국어 번역 파일
│   ├── ko/               # 한국어
│   ├── en/               # 영어
│   ├── ja/               # 일본어
│   └── zh/               # 중국어
└── i18n/                  # 다국어 설정

prisma/
└── schema.prisma          # 데이터베이스 스키마

public/
├── images/                # 이미지 리소스
├── manifest.json          # PWA 매니페스트
└── sw.js                  # 서비스 워커
```

## 🔒 보안 기능

### 입력 검증
- Zod 스키마로 모든 API 입력 검증
- XSS 방지 (HTML 이스케이프)
- SQL Injection 방지 (Prisma 파라미터)

### API 보안
- Rate Limiting (분당 100회 기본)
- 요청 크기 제한
- 보안 헤더 설정

### 면책 고지
- 앱 시작 시 모달 표시
- 하단 배너 상시 표시
- "투자 권유가 아니며, 모의투자는 실제 손익과 무관함"

## 📱 PWA 기능

- **홈 화면 설치**: 앱처럼 설치 가능
- **오프라인 지원**: 네트워크 없이도 기본 기능 사용
- **푸시 알림**: (설정 시) 알림 수신

## 💵 수익화 (AdSense)

### 배너 광고
- 학습 목록 하단
- 포트폴리오 페이지 하단

### 보상형 광고
- AI 투자 일기 분석 사용 전 광고 시청

## 🚀 배포

### Vercel (권장)
```bash
vercel deploy
```

### Docker
```bash
docker build -t invest-app .
docker run -p 3000:3000 invest-app
```

## 📄 라이선스

MIT License

## ⚠️ 주의사항

1. **투자 권유 아님**: 본 앱은 교육 목적이며, 실제 투자 권유가 아닙니다.
2. **모의 데이터**: API 키 없이 사용 시 모의 데이터가 표시됩니다.
3. **실제 자금 미사용**: 모의투자는 가상 자금으로 진행됩니다.

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Made with ❤️ for investment education**
