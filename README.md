# AI 부동산 스캐너

부동산 관련 법률 상담을 위한 AI 기반 Q&A 플랫폼

## 📋 프로젝트 개요

일반 사용자가 AI를 통해 부동산 관련 법률 질문을 하고, 변호사가 답변을 작성하며, 답변 채택 시스템을 통해 신뢰성 있는 법률 정보를 제공하는 서비스입니다.

## 🛠 기술 스택

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **React Query** (@tanstack/react-query)
- **Zod** (스키마 검증)

### Backend
- **Hono** (Edge Functions)
- **Supabase** (PostgreSQL, Auth, Storage)
- **Google Gemini API** (AI 상담)
- **Toss Payments** (결제)

### Deployment
- **Vercel** (Frontend + Edge Functions)
- **Supabase** (Database + Auth + Storage)

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Toss Payments
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 데이터베이스 마이그레이션

Supabase 대시보드에서 SQL 에디터를 열고 `supabase/migrations/20250111000000_initial_schema.sql` 파일의 내용을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
├── backend/                # 백엔드 레이어
│   ├── config/            # 환경 설정
│   ├── errors/            # 에러 코드 & AppError
│   ├── hono/              # Hono 앱 설정
│   ├── http/              # HTTP 응답 헬퍼
│   └── middleware/        # 미들웨어 (인증, 로깅 등)
├── components/            # 공통 UI 컴포넌트
│   └── ui/               # Shadcn UI 컴포넌트
├── constants/             # 앱 설정 상수
├── domain/                # 도메인 레이어
│   ├── policies/         # 비즈니스 정책
│   ├── services/         # 도메인 서비스
│   └── types/            # 도메인 타입
├── features/              # 기능별 모듈
│   ├── signup/           # 회원가입
│   ├── ai-qna/           # AI 질문
│   ├── point-topup/      # 포인트 충전
│   ├── lawyer-answer/    # 변호사 답변
│   ├── question-delete/  # 질문 삭제
│   ├── answer-adoption/  # 답변 채택
│   ├── lawyer-verification/ # 변호사 인증
│   └── admin-approval/   # 관리자 승인
├── hooks/                 # 공통 React 훅
├── infrastructure/        # 인프라 레이어
│   ├── ai/               # Gemini 서비스
│   ├── payment/          # Toss Payments 서비스
│   └── storage/          # Supabase Storage 서비스
└── lib/                   # 유틸리티
    ├── query/            # React Query 설정
    ├── remote/           # API 클라이언트
    └── supabase/         # Supabase 클라이언트
```

## 🎯 주요 기능

### 일반 사용자
- ✅ 회원가입 및 로그인
- ✅ AI 부동산 상담 (Gemini API)
- ✅ 질문 공개/비공개 설정
- ✅ 변호사 답변 확인
- ✅ 답변 채택
- ✅ 질문 삭제 (1시간 이내, 포인트 환불)

### 변호사
- ✅ 변호사 회원가입 (등록번호 검증)
- ✅ 자격 서류 업로드
- ✅ 포인트 충전 (Toss Payments)
- ✅ 공개 질문 답변 작성 (포인트 차감)
- ✅ 답변 채택 알림

### 관리자
- ✅ 변호사 인증 요청 목록 조회
- ✅ 변호사 승인/반려 처리
- ✅ 알림 발송

## 🔐 인증 & 권한

### 역할 (Role)
- `user`: 일반 사용자
- `lawyer`: 변호사
- `admin`: 관리자

### 미들웨어
- `requireAuth()`: 인증 필수
- `requireRole(['lawyer'])`: 역할 기반 접근 제어
- `requireApprovedLawyer()`: 승인된 변호사만 접근

### 프론트엔드 훅
- `useRequireAuth()`: 인증 필수 페이지
- `useRequireLawyer()`: 변호사 전용 페이지
- `useRequireAdmin()`: 관리자 전용 페이지

## 📊 데이터베이스 스키마

주요 테이블:
- `profiles`: 사용자 프로필
- `lawyer_profiles`: 변호사 프로필
- `verification_requests`: 변호사 인증 요청
- `questions`: 질문
- `question_messages`: AI 대화 메시지
- `answers`: 답변
- `point_wallets`: 포인트 지갑
- `point_transactions`: 포인트 거래 내역
- `notifications`: 알림

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트 (TODO)
npm run test:e2e
```

## 📝 API 문서

자세한 API 문서는 `PROJECT_IMPLEMENTATION_STATUS.md` 파일을 참조하세요.

## 🚀 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 환경 변수 설정
Vercel 대시보드에서 환경 변수를 설정하세요.

## 📄 라이선스

MIT License

## 👥 기여

이 프로젝트는 TDD 원칙과 클린 아키텍처를 따릅니다. 기여하기 전에 `docs/rules/tdd.md`를 참조하세요.

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
