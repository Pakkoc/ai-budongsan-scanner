# 01. 일반 회원 가입 — Implementation Plan

## Overview
- **SignUpProvider & Reducer (`src/features/signup/context/sign-up-context.tsx`, `sign-up-reducer.ts`)**: UC-01/02 공용 상태를 제공하는 Context와 reducer. 탭, 폼 값, 제출 상태, 약관 버전 로딩을 한 곳에서 관리.
- **General SignUp Mutation Hook (`src/features/signup/hooks/use-general-sign-up.ts`)**: `@tanstack/react-query` `useMutation`을 이용해 `/api/auth/sign-up` 호출과 상태 업데이트를 캡슐화.
- **GeneralSignUpForm Component (`src/features/signup/components/general-sign-up-form.tsx`)**: Context를 구독하여 입력, 검증, CTA, 약관 UI를 렌더링하는 클라이언트 컴포넌트.
- **SignUp Page Shell (`src/app/signup/page.tsx`)**: 기존 임시 페이지를 SignUpLayout + 탭 구조로 교체하고 Context Provider, Hero, FAQ CTA 등을 배치.
- **Auth Sign-up Route & Service (`src/features/signup/backend/{schema,service,route}.ts`)**: Hono 라우트, Zod 스키마, Supabase Admin 호출 및 DB 트랜잭션으로 `profiles`, `user_consents`를 생성하는 서비스.

## Diagram
```mermaid
graph TD
  Page["signup/page.tsx (use client)"] --> Provider[SignUpProvider]
  Provider --> GeneralForm[GeneralSignUpForm]
  GeneralForm --> Context[SignUpReducer]
  GeneralForm --> Mutation[useGeneralSignUpMutation]
  Mutation --> ApiClient[`@/lib/remote/api-client`]
  ApiClient --> HonoRoute[`/api/auth/sign-up`]
  HonoRoute --> Service[SignUpService]
  Service --> Supabase[(Supabase Auth + DB)]
```

## Implementation Plan
### 1. SignUpProvider & Reducer
1. 생성: `src/features/signup/context/sign-up-context.tsx`에 `"use client"` 선언 후 `createContext`, `useReducer`, `useMemo`로 state/actions를 노출. Reducer는 `sign-up-reducer.ts`로 분리해 테스트 용이성 확보.
2. 초기 상태는 `consentVersions.loaded=false`, `activeTab`은 URL query(`type`)와 동기화하도록 Provider에서 제어.
3. 액션 타입: `SWITCH_TAB`, `CHANGE_FIELD`, `MARK_TOUCHED`, `VALIDATION_FAILED`, `SUBMIT_REQUEST/SUCCESS/FAILURE`, `CONSENT_LOADED`, `TICK_REDIRECT`, `CLEAR_ERROR`.
4. Provider는 `useEffect`로 `/api/system/consents`(임시 mock, 추후 실제 데이터) 호출 후 `CONSENT_LOADED` dispatch.
5. Context hook (`useSignUpContext`)를 작성해 null 보호 및 메모이제이션.
- **단위 테스트**: `sign-up-reducer.test.ts`에서 Vitest로 상태 전이를 Red→Green→Refactor 순으로 검증. 시나리오: `SWITCH_TAB`이 uniq하게 작동, 제출 성공 시 `redirectCountdown` 감소, `VALIDATION_FAILED`가 기존 메시지를 유지. 각 테스트는 TDD 규칙에 맞춰 실패 케이스 작성 후 최소 구현.
- **충돌 검토**: 현재 `src/features`에 `signup` 디렉터리가 없어 신규 추가해도 영향 없음. 기존 `useCurrentUser`와 역할이 겹치지 않음.

### 2. useGeneralSignUpMutation
1. 파일 위치: `src/features/signup/hooks/use-general-sign-up.ts` (`"use client"`).
2. `useMutation`으로 `/api/auth/sign-up` POST를 호출하고 성공 시 Context dispatch(`SUBMIT_SUCCESS` + countdown start), 실패 시 `SUBMIT_FAILURE` + 필드별 에러를 반환.
3. 요청 전 `zod` 스키마(`SignUpRequestSchema`)를 재사용해 클라이언트 검증. HTTP 요청은 `apiClient.post('/api/auth/sign-up', payload)`로 수행.
4. Supabase 세션 발급 후 `useCurrentUser().refresh()` 호출하도록 옵션 제공.
- **단위 테스트**: Hook 자체는 React 환경이 필요하므로 로직을 `callGeneralSignUp` helper로 분리하고 Vitest로 HTTP mock → 실패/성공 브랜치 TDD.
- **충돌 검토**: `@/lib/remote/api-client`를 공통 HTTP 파이프라인으로 사용하여 AGENTS 룰 준수. 기존 코드에서 동일 endpoint를 사용하는 곳이 없어 충돌 없음.

### 3. GeneralSignUpForm Component
1. 위치: `src/features/signup/components/general-sign-up-form.tsx`; 상단에 `"use client"` 선언.
2. `useSignUpContext`로 상태/dispatch를 가져와 `Input`, `Password`, `Checkbox`, `Button`(shadcn)을 조합. 비밀번호 강도 게이지와 에러 메시지는 selector 기반 렌더.
3. 면책/약관 섹션은 `consentVersions`가 로드될 때까지 skeleton을 보여주고, 동의 체크 여부에 따라 CTA disable.
4. CTA 클릭 → `submitUserForm()` 컨텍스트 액션을 호출하여 mutation 트리거.
5. `redirectCountdown` > 0 시 상단 배너에 남은 시간을 표시하고 0일 때 `router.replace('/ai-qna')` 호출.
- **QA 시트**:
  | 시나리오 | 절차 | 기대 결과 |
  | --- | --- | --- |
  | 비밀번호 불일치 | confirmPassword를 다르게 입력 후 제출 | `fieldErrors.password` 표시, CTA disable |
  | 이메일 중복 409 | 서버가 `EMAIL_TAKEN` 반환하도록 mock → 제출 | 에러 배너가 서버 메시지 노출, 입력 focus 유지 |
  | 성공 & 리디렉션 | 올바른 값 제출 | 성공 토스트 + 3초 카운트 후 `/ai-qna`로 이동 |
  | 약관 미동의 | `agreeTerms=false` 상태에서 submit | 약관 영역에 경고 copy, CTA disabled |
- **충돌 검토**: 기존 `src/app/signup/page.tsx`의 단순 폼은 이 컴포넌트로 대체. 동일 경로에 새로운 UI를 렌더하지만 API 의존성은 새 Hono 라우트라 충돌 없음.

### 4. SignUp Page Shell
1. `src/app/signup/page.tsx`를 SignUpLayout 컴포넌트로 교체. 레이아웃은 Hero, 탭, FAQ 섹션을 포함하고 탭에 따라 `GeneralSignUpForm` 또는 `LawyerSignUpForm`(UC-02) 렌더.
2. `SignUpProvider`를 page 최상위에 배치해 모든 탭이 동일 상태를 공유. `useSearchParams`로 `type` query를 감지해 `setActiveTab`.
3. 기존 supabase 직접 호출 로직 삭제하고 모듈화된 액션만 사용.
4. `layout`은 Memoized `SignUpTabs` 컴포넌트를 사용해 `activeTab` 변경 시 URL 업데이트(`router.replace('?type=lawyer')`).
- **QA 시트**:
  | 시나리오 | 절차 | 기대 결과 |
  | --- | --- | --- |
  | 탭 전환 | lawyer 탭 클릭 | Provider 상태의 `activeTab` 변하고 폼 스크롤 유지 |
  | redirectFrom 처리 | `/signup?redirectedFrom=/ai-qna`로 접근 후 가입 성공 | countdown 후 `/ai-qna`로 이동 |
  | 모바일 레이아웃 | viewport 375px에서 테스트 | Hero → 폼 순으로 세로 배치, 버튼 full-width |
- **충돌 검토**: 페이지는 이미 `"use client"` 구성이라 새 구현도 동일 지침 준수. 기존 이미지 `picsum` 사용 룰도 유지.

### 5. Auth Sign-up Route & Service
1. Backend 구조: `src/features/signup/backend/schema.ts`(Zod request/response), `service.ts`(Supabase 로직), `route.ts`(Hono 등록). 파일 내에서 `SignUpType = 'user'|'lawyer'`를 지원하되 UC-01은 `'user'` 전용 유스케이스로 분기.
2. `service.ts`: Supabase Admin client로 `auth.admin.createUser`, `profiles`, `user_consents` INSERT를 동일 트랜잭션으로 실행. 실패 시 auth user 삭제 시도 후 error 반환.
3. `route.ts`: `app.post('/api/auth/sign-up', ...)` 등록, body parse 후 `SignUpService` 호출, 성공 시 201과 redirectTo(`/ai-qna`).
4. `src/backend/hono/app.ts`에서 `registerSignUpRoutes(app)` 호출 추가.
5. Supabase RPC 미사용, Query builder + `serverEnv` config 사용.
- **단위 테스트**: `service.test.ts`에서 Supabase client mock으로 성공/중복 이메일/DB 실패 시 롤백 여부를 TDD. 특히 `user_consents` 누락 시 실패하는 케이스를 먼저 작성.
- **충돌 검토**: 기존 Hono 앱은 example 라우트만 등록되어 있어 신규 route 추가 시 네임스페이스가 겹치지 않는다.

### 테스트 & TDD Strategy
- **Unit**: Reducer, mutation helper, backend service 각각 독립 Vitest 스위트를 만들고 모든 테스트는 `docs/rules/tdd.md`의 Red→Green→Refactor 순서 메모를 주석으로 남김.
- **E2E (Playwright)**: 시나리오 `tests/e2e/signup-general.spec.ts`
  1. Given 비회원이 `/signup` 진입.
  2. When 올바른 정보를 입력하고 제출.
  3. Then 성공 토스트, `/ai-qna` 네비게이션, Supabase에 신규 `profiles` row 생성(테스트용 stub). 실패 케이스(이메일 중복) 포함.
- **Regression guard**: React Query mutation 성공 후 Query cache `['currentUser']` invalidate 하여 기존 `useCurrentUser`와 충돌 방지.
