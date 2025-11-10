# Common Modules & Shared Infrastructure Plan

## 0. 목적 및 참고 문서
- 참고: `docs/requirment.md`, `docs/persona.md`, `docs/techstack.md`, `docs/structure.md`, `docs/prd.md`, `docs/userflow.md`, `docs/database.md`, `docs/external.md/gemini_api.md`, `docs/rules/tdd.md`.
- 목표: 페이지 단위 개발 전에 모든 공용 로직/라이브러리/테스트 환경을 정의해 병렬 작업 시 충돌을 방지한다. 요구사항에 적힌 범위 밖 기능은 포함하지 않는다.

## 1. 코드베이스 현황 요약
- **Stack**: Next.js 15(App Router) + Hono API(`/src/backend` + `/src/app/api/[[...hono]]`), Supabase(인증/DB/스토리지), Gemini, Toss.
- **Existing modules**: Supabase browser/server client helpers, 기본 Auth 컨텍스트, 예시 Hono 라우트/미들웨어, Shadcn 기반 UI 컴포넌트 셋.
- **Gaps**: 실제 비즈니스 도메인(질문/답변/포인트/결제/AI) 로직, Storage/Payout 연동, 테스트/CI 세팅 미구현.

## 2. 공통 모듈 로드맵
각 모듈은 특정 페이지와 무관하게 재사용되며, 이하 항목이 완료된 뒤 페이지 개발을 병렬 진행한다.

### 2.1 환경 변수 & 구성 레이어
- **Scope**: `src/constants/env.ts` 강화 → Zod 기반 런타임 검증, 서버/클라이언트 안전 분리, 테스트용 `.env.test` 지원.
- **Deliverables**:
  - `env.server.ts`, `env.client.ts` 구분 모듈.
  - `config/app-config.ts`: 서비스 전역 상수(포인트 단가 1000, 질문 삭제 제한 1h 등) 중앙 관리.
- **Testing**: Vitest로 env 파서 단위 테스트 (누락/잘못된 key 시 throw 확인).

### 2.2 Supabase 인프라 래퍼
- **Scope**: 브라우저/서버/Edge(함수) 클라이언트 팩토리 일원화, RPC/트랜잭션 helper.
- **Deliverables**:
  - `src/lib/supabase/server-actions.ts`: Next Server Action용 클라이언트 getter.
  - `src/backend/supabase/transaction.ts`: 질문 삭제/포인트 환불 등 단일 트랜잭션 헬퍼.
  - `src/lib/supabase/types.ts` 자동 생성(현재 schema 기반) + type-safe query builder alias.
- **Testing**: Vitest에서 Supabase client mock으로 helper 동작 검증.

### 2.3 인증 & 세션 상태 계층
- **Scope**: 이미 존재하는 `CurrentUserProvider` 기반으로 SSR/CSR 모두에서 현재 사용자 스냅샷을 주입하고, 역할(Role) 파생 selector 제공.
- **Deliverables**:
  - `src/features/auth/server/load-current-user.ts` 확장 → `role`, `verificationStatus` 포함.
  - `src/features/auth/hooks/useRequireRole.ts`: 페이지/컴포넌트 단위 접근 제어 훅.
  - `src/backend/middleware/authz.ts`: Hono 라우트용 role guard (admin, lawyer 전용 등).
- **Testing**: React Testing Library로 컨텍스트 훅 검증, Vitest로 Hono middleware 단위 테스트.

### 2.4 권한/정책 서비스 (`PolicyService`)
- **Scope**: 질문 삭제 1시간 제한, 변호사 답변 가능 조건(approved + balance), 채택 단일성 등 비즈니스 규칙을 한 곳에서 평가.
- **Deliverables**:
  - `src/domain/policies/qna-policy.ts`: `canDeleteQuestion`, `canSubmitAnswer`, `canAdoptAnswer` 함수.
  - `src/domain/policies/verification-policy.ts`: 업로드 상태 전이 검증.
- **Testing**: Vitest로 입력 시나리오별 true/false, 에러 메시지 검증 (TDD 사이클 준수).

### 2.5 데이터 접근 계층 (Repository Interfaces)
- **Scope**: 질문/답변/포인트/알림 관련 CRUD를 표준화하여 페이지/API 양쪽에서 재사용.
- **Deliverables**:
  - 인터페이스: `src/domain/repositories/{questions,answers,points,notifications}.ts`.
  - 구현: `src/infrastructure/persistence/supabase-{entity}.repository.ts` (단, 실제 SQL/RPC는 페이지 개발 전 연결만 제공).
- **Testing**: Repository는 Supabase client mock으로 단위 테스트, 통합 테스트는 나중에 작성.

### 2.6 Zod 기반 DTO & 폼 밸리데이션
- **Scope**: 회원가입, 변호사 인증 업로드 메타, 포인트 충전 요청, 답변 제출 등 모든 입력을 `zod` 스키마로 표준화.
- **Deliverables**:
  - `src/domain/dto/auth.ts`, `qna.ts`, `payment.ts` 등.
  - FE 폼 훅용 `resolver` 내보내기 (React Hook Form).
- **Testing**: 각 DTO에 대해 유효/무효 입력 테스트.

### 2.7 공통 API 응답/에러 포맷
- **Scope**: Hono API 응답 일관성(`{data, error}`), 도메인별 에러 코드 상수, 에러 로깅.
- **Deliverables**:
  - `src/backend/http/response.ts` 확장(현재 파일 존재) → `ok`, `fail` helper.
  - `src/backend/errors/codes.ts` 및 `AppError` 구현.
  - FE axios/fetch 래퍼 `src/lib/http/client.ts` (401/403/422 공통 처리, 토스트 연동).
- **Testing**: Vitest로 helper 함수, axios mock으로 클라이언트 유닛 테스트.

### 2.8 파일 업로드 서비스 (Supabase Storage)
- **Scope**: 변호사 자격 서류 업로드 전용이지만 다수 페이지에서 재사용되므로 공용화.
- **Deliverables**:
  - `src/lib/storage/upload.ts`: 서명 URL 발급 + MIME 검증 + 크기 제한(요구사항 기반) 상수 재사용.
  - 백엔드 라우트 `/api/storage/sign` 템플릿(권한 검사 포함).
- **Testing**: Vitest로 허용 MIME/Size 체크, Hono route handler 테스트 (mock storage client).

### 2.9 Gemini Service Wrapper
- **Scope**: `/ai-qna`뿐 아니라 향후 RAG 확장 대비 최소 기능으로 Gemini 호출을 표준화.
- **Deliverables**:
  - `src/infrastructure/ai/gemini.service.ts`: 프롬프트 템플릿, 면책문구 자동 삽입, 에러 리트라이 정책.
  - 스트리밍 응답을 Server-Sent Events 형태로 변환하는 유틸 (`src/backend/ai/stream.ts`).
- **Testing**: Vitest에서 SDK mock, 면책문구 포함 여부 검증.

### 2.10 Toss Payments Integration Layer
- **Scope**: 결제 세션 생성 + 웹훅 처리 + 서명 검증 공용 모듈.
- **Deliverables**:
  - `src/infrastructure/payment/toss.client.ts`: API 호출, 시그니처 검증.
  - `src/backend/payment/webhook-handler.ts`: 콜백 검증 후 `point_transactions` 호출.
  - 환경설정: Toss Secret/Client Key env binding.
- **Testing**: Vitest로 시그니처 검증 함수, webhook handler happy-path 테스트 (mock repository).

### 2.11 포인트 트랜잭션 & 환불 엔진
- **Scope**: 답변 차감, 질문 삭제 환불 등 복수 유스케이스에서 동일 로직 사용.
- **Deliverables**:
  - `src/domain/services/points.service.ts`: `charge`, `deductForAnswer`, `refundForAnswerDeletion` 등.
  - 각 서비스는 repository 인터페이스에만 의존.
- **Testing**: 포인트 변동 및 balance_after 계산을 Vitest로 시나리오별 검증.

### 2.12 시스템 알림 브로커
- **Scope**: 변호사 승인 결과, 새 답변, 채택 알림 공통 처리.
- **Deliverables**:
  - `src/domain/services/notification.service.ts`: `notifyLawyerVerification`, `notifyNewAnswer`, `notifyAnswerAdopted`.
  - FE용 데이터 훅 `useNotifications` (React Query 기반) + 토스트 연동.
- **Testing**: Service unit tests, hook test with React Testing Library + MSW mocking.

### 2.13 UI/UX 공통 구성 요소
- **Scope**: 페이지와 무관한 재사용 요소 사전 정의로 스타일 충돌 방지.
- **Deliverables**:
  - `AppShell`(헤더/사이드) 레이아웃 컴포넌트.
  - `FormField` 패턴(라벨, 에러, 설명) 래퍼.
  - Toast/Modal primitives wiring (Shadcn toaster already exists → 설정만 공유).
- **Testing**: Storybook 수준은 요구되지 않음. 렌더 스냅샷 또는 RTL smoke test.

### 2.14 상태 관리 & 데이터 패턴
- **Scope**: React Query 기본 설정(Provider, suspense, 에러 처리)과 공통 훅.
- **Deliverables**:
  - `src/app/providers.tsx` 내 React Query/TanStack Query 설정 확정(캐시 전략, suspense 등).
  - `src/lib/query/keys.ts`: 질문, 답변, 포인트 잔액, 알림 등 키 상수.
- **Testing**: Hook-level tests verifying caching behavior (React Testing Library + QueryClientProvider in tests).

### 2.15 로깅 & 모니터링 최소 셋업
- **Scope**: Hono middleware 및 Next 서버 액션에서 공통 로깅 포맷.
- **Deliverables**:
  - `src/lib/logging/logger.ts` (console 기반 structured logger).
  - Error boundary ↔ logger 연결.
- **Testing**: Logger 단위 테스트 (ensuring metadata format) optional but recommended.

## 3. 테스트/품질 환경 세팅
### 3.1 단위 테스트 (TDD 기반)
- 선택: **Vitest + React Testing Library**.
- 작업 항목:
  - `vitest.config.ts` 생성 (DOM 환경, path alias 설정).
  - `setupTests.ts`에서 `@testing-library/jest-dom`, Supabase/TanStack mocks 설정.
  - `package.json` scripts → `"test": "vitest"`, `"test:watch"`, CI 명령 추가.
  - TDD 규칙(`docs/rules/tdd.md`) 준수를 위해 PR 템플릿에 Red/Green/Refactor 체크리스트 추가.

### 3.2 통합/계약 테스트
- Hono 라우트별 supertest 또는 `vitest` + `hono/testing`. Supabase는 test double로 대체.
- Toss/Gemini 외부 호출은 MSW/Mock Service Worker 사용.

### 3.3 E2E 테스트
- **Tool**: Playwright.
- 환경 준비:
  - `playwright.config.ts`, auth/seed 스크립트(로컬 Supabase, stub 데이터) 작성.
  - 주요 플로우: 일반 가입, 변호사 가입→업로드, AI 질문 저장(모의), 포인트 충전(모의), 답변 작성/삭제/채택.

## 4. 작업 우선순위 & 일정 힌트
1. 환경 & Supabase 래퍼 (2.1~2.2)
2. 인증/권한 계층 (2.3~2.4)
3. Repository & DTO & Validation (2.5~2.6)
4. API 에러/응답, Query provider (2.7, 2.14)
5. Storage, Gemini, Toss, Points, Notification 서비스 (2.8~2.12)
6. UI Shell & Logging (2.13, 2.15)
7. 테스트 인프라 (3.x)

## 5. Conflict Prevention Compliance Checks
- **Check #1**: 본 문서는 페이지 의존성이 없는 공통 모듈과 테스트 환경만을 다루고 있음을 재확인했다.
- **Check #2**: 병렬 페이지 개발 시 충돌 우려가 있는 인증/데이터/서비스/빌드/테스트 모듈을 모두 포함했음을 다시 검증했다.
- **Check #3**: 요구사항 문서에 명시된 기능 외 항목은 배제했음을 최종 검토했다.
