# 04. 관리자 변호사 승인 — Implementation Plan

## Overview
- **LawyerApprovalContext (`src/features/admin-lawyer-approval/context/approval-context.tsx`)**: 승인 목록, 필터, 상세 패널, 결정 드래프트 상태를 보관하는 Provider.
- **VerificationRequests Query Hooks (`src/features/admin-lawyer-approval/hooks/use-verification-requests.ts`)**: React Query 기반 목록/상세 fetcher와 cursor pagination 관리.
- **Admin UI Components (`src/features/admin-lawyer-approval/components/{filter-bar,requests-table,detail-panel,decision-form}.tsx`)**: Context 상태로 테이블, 상세 정보, 승인/반려 폼을 렌더링.
- **Admin Approval Backend (`src/features/admin-lawyer-approval/backend/{schema,route,service}.ts`)**: `/api/admin/lawyer-approval` GET/PATCH 라우트. Supabase 트랜잭션으로 `verification_requests`, `lawyer_profiles`, `notifications` 업데이트.
- **Role Guard Hook (`src/features/auth/hooks/useRequireRole.ts`)**: Admin 페이지 접근 시 클라이언트/서버 모두에서 역할 검증.

## Diagram
```mermaid
graph TD
  AdminPage --> Guard[useRequireRole('admin')]
  Guard --> Provider[LawyerApprovalProvider]
  Provider --> FilterBar
  Provider --> RequestsTable
  Provider --> DetailPanel
  DetailPanel --> DecisionForm
  RequestsTable --> QueryHook[useVerificationRequests]
  QueryHook --> ApiClient --> HonoRouteGET
  DecisionForm --> MutationHook
  MutationHook --> ApiClient --> HonoRoutePATCH --> Service --> DB[(verification_requests + lawyer_profiles + notifications)]
```

## Implementation Plan
### 1. LawyerApprovalContext
1. `"use client"` Provider와 reducer (`approval-reducer.ts`) 생성. 초기 상태는 서버 컴포넌트에서 전달하는 prefetch 데이터를 활용.
2. 액션: `SET_FILTER`, `FETCH_REQUESTS_PENDING/SUCCESS/FAILURE`, `SELECT_REQUEST`, `FETCH_DETAIL_SUCCESS`, `SET_DECISION`, `DECISION_SUBMIT_PENDING/SUCCESS/FAILURE`, `SHOW_TOAST`, `CLEAR_TOAST`.
3. Provider는 `useReducer`와 `useMemo`를 통해 selectors(`selectedRequest`, `isDecisionDisabled`)를 노출.
- **단위 테스트**: reducer 테스트에서 (a) 승인 성공 시 리스트에서 제거, (b) 반려 시 업데이트 여부 등을 Vitest로 TDD.
- **충돌 검토**: Admin 기능 전용 Context, 다른 페이지와 독립. 폴더명 `admin-lawyer-approval` 고유.

### 2. Query Hooks
1. `useVerificationRequests(filters)`는 React Query `useQuery`로 `/api/admin/lawyer-approval` 호출 후 Context dispatch.
2. `useVerificationRequestDetail(id)`는 캐시 키 `['verification-request', id]`로 상세 정보를 관리.
3. Hook 내부에서 `extractApiErrorMessage`로 에러 문자열을 통일하고, 403 시 `/login`으로 이동하도록 `onError` 처리.
- **단위 테스트**: HTTP helper를 분리(`fetchVerificationRequests`)하고 Vitest로 403/200 케이스를 검증.
- **충돌 검토**: Query key는 고유, 기존 `['currentUser']` 캐시와 겹치지 않음.

### 3. Admin UI Components
1. `FilterBar`: 상태 필터 select, 검색어 input, refresh 버튼. 입력 Debounce 후 `setFilters` dispatch.
2. `RequestsTable`: shadcn `Table`로 목록, 상태 Badge, pagination controls(`cursor`). 행 클릭 시 `selectRequest`.
3. `DetailPanel`: `selectedRequestId`와 `detailCache`를 기준으로 문서 링크, 업로드 메타, action 버튼을 표시. 승인/반려 버튼 -> `DecisionForm` 제출.
- **QA 시트**:
  | 시나리오 | 절차 | 기대 결과 |
  | --- | --- | --- |
  | 권한 없음 접근 | 일반 계정으로 `/admin/lawyer-approval` | Guard가 403 처리 → 로그인 페이지 이동 |
  | 승인 성공 | 대기 행 선택 → 승인 | 테이블에서 해당 행 제거, 성공 토스트 |
  | 반려 시 사유 누락 | action='reject'로 선택 후 note 비움 | CTA disabled, helper text 표시 |
  | 네트워크 오류 | PATCH 응답 500 | Error toast + decisionStatus reset |
- **충돌 검토**: Admin UI는 신규 경로 `/app/(protected)/dashboard`와 겹치지 않도록 `/app/(protected)/dashboard/admin/...` 구조 고려. 기존 UI 없음으로 충돌 없음.

### 4. Backend Routes & Service
1. `schema.ts`: 
   - `VerificationRequestListQuerySchema` (status/searchText/cursor).
   - `AdminDecisionSchema` (`action`, `note` required when reject).
2. `route.ts`: 
   - GET `/api/admin/lawyer-approval` → Supabase view join, pagination 구현.
   - PATCH `/api/admin/lawyer-approval/:requestId` → `evaluateAdminDecision` 호출 후 서비스 실행.
3. `service.ts`: 트랜잭션으로 `verification_requests.status`, `lawyer_profiles.verification_status`, `notifications` insert. 승인 시 `lawyer_profiles.verification_status='approved'`.
4. `AppLogger`로 모든 결정 로그 기록 (`logger.info('admin-decision', { requestId, action })`).
- **단위 테스트**: `service.test.ts`에서 (a) happy path approve, (b) 이미 in_review 아님 → failure, (c) notification insert 실패 → rollback. 각 테스트는 Red 단계에서 실패를 먼저 작성.
- **충돌 검토**: 기존 example 라우트 외 새 admin 라우트 추가. 경로 `/api/admin/lawyer-approval`은 고유. Supabase 권한은 service-role key 사용으로 허용.

### 5. useRequireRole Hook
1. 위치: `src/features/auth/hooks/useRequireRole.ts`; `useCurrentUser` + `useRouter`. 요구 역할과 현재 유저의 `appMetadata.role` 비교.
2. 미충족 시 `/login?redirectedFrom=${encodeURIComponent(currentPath)}`로 이동.
3. SSR 버전은 Server Component에서 `redirect`를 활용 (`src/features/auth/server/require-role.ts` 추가 가능) — Admin page는 server guard로도 보호.
- **단위 테스트**: hook은 navigation을 포함하므로 `@testing-library/react` + `next-router-mock`으로 happy/forbidden 케이스 TDD.
- **충돌 검토**: 기존 auth 훅들과 네임스페이스 공유하지만 파일명이 다르고 기능 중복 없음.

### 테스트 & E2E 전략
- **Unit**: reducer, fetch helper, service, role guard 모두 Vitest. 테스트마다 `docs/rules/tdd.md` 준수 주석 추가.
- **E2E**: `tests/e2e/admin-lawyer-approval.spec.ts`
  1. 관리자 계정으로 로그인.
  2. 승인 대기 목록이 로드되고 행 클리ック 시 상세가 뜨는지 확인.
  3. 승인/반려 플로우 각각 검증, 반려 사유 필수 확인.
- **E2E 준비**: Playwright에서 MSW 또는 Supabase 시드 데이터를 활용해 stable fixtures 세팅.
