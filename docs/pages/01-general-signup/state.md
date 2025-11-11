# 01. 일반 회원 가입 — State Design

## Scope & References
- **Relevant docs**: `docs/requirment.md`(회원 분리 및 즉시 AI 진입), `docs/userflow.md` #1, `docs/usecases/01-general-signup/spec.md`
- **Page surface**: `/sign-up` 일반 탭. 공용 `SignUpLayout` 내에서 `SignUpContext`(Context+useReducer)로 상태를 공급하고, 일반/변호사 탭이 같은 Context를 공유한다.
- **External deps**: Supabase Auth admin endpoint, `profiles`, `user_consents` repositories, env-configured Gemini disclaimer copy (display-only).

## Managed State Inventory
### Reducer Shape (SignUpState)
| key | type | description |
| --- | --- | --- |
| `activeTab` | `'user' \| 'lawyer'` | 공용 탭 전환 상태. 일반 탭 진입 시 `'user'` 고정되지만 lawyer 탭과 공유한다.
| `formValues.user` | `{ email, password, confirmPassword, nickname, agreeTerms: boolean }` | 일반 가입 폼 입력값.
| `fieldErrors.user` | `Partial<Record<'email' \| 'password' \| 'confirmPassword' \| 'nickname' \| 'agreeTerms', string>>` | 실시간/서버 검증 메시지.
| `touched.user` | `Record<string, boolean>` | blur 여부 → 에러 노출 제어.
| `submitStatus.user` | `'idle' \| 'validating' \| 'submitting' \| 'success' \| 'error'` | CTA 버튼 disable/스피너 제어.
| `serverError` | `string \| null` | Auth/DB 레벨 오류 코드.
| `redirectCountdown` | `number` | 성공 후 `/ai-qna` 리디렉션까지 남은 초 (0이면 즉시 이동).
| `consentVersions` | `{ terms: string; privacy: string; loaded: boolean }` | 전역 약관 버전. Context에서 최초 1회 fetch.

### Display-only / Derived Data (NOT stored)
- 약관 전문, 랜딩 copy, FAQ 링크 → CMS/static content이므로 상태 아님.
- 비밀번호 강도 게이지 → `formValues.user.password` 길이/문자 조합으로 즉시 계산.
- CTA disable 여부 → `submitStatus.user === 'submitting'` 또는 필수값 미입력 여부로 계산.
- 에러 요약 배너 → `Object.values(fieldErrors.user)` 필터링으로만 구성.

## State Transition Table
| State slice | Action (Reducer type) | Guard / Condition | View impact |
| --- | --- | --- | --- |
| `activeTab` | `SWITCH_TAB('user' \| 'lawyer')` | 항상 허용. 라우터 쿼리 `type` 변화에 sync. | 탭 헤더 활성화, 각 탭 폼 mount 여부 결정. |
| `formValues.user` | `CHANGE_FIELD({ target:'email', value })` 등 | 입력 길이 제한(100자)와 invalid char 필터 | 인풋 value 반영, 관련 `fieldErrors` 즉시 clear. |
| `fieldErrors.user` | `VALIDATION_FAILED({ target, message })` | `touched` true 또는 submit 시 | 인풋 하단 helper text, aria-invalid 적용. |
| `touched.user` | `MARK_TOUCHED(target)` | blur 이벤트 발생 시 | Invalid input outline, 에러 메시지 노출 조건 활성.
| `submitStatus.user` | `SUBMIT_REQUEST('user')` | 모든 필수값 존재 시만 dispatch | CTA 스피너 on, 폼 disable, progress bar 노출. |
| `submitStatus.user` | `SUBMIT_SUCCESS('user')` | BE 200 응답 & 세션 쿠키 세팅 성공 시 | 성공 토스트, 리디렉션 카운트다운 표시, 폼 reset. |
| `submitStatus.user` & `serverError` | `SUBMIT_FAILURE({ code, message })` | BE 4xx/5xx | 에러 배너 표시, 특정 필드 focus, CTA 재활성화. |
| `redirectCountdown` | `TICK_REDIRECT()` | `submitStatus.user === 'success'`일 때 interval tick | Countdown chip 갱신, 0 도달 시 router push. |
| `consentVersions` | `CONSENT_LOADED(payload)` | 최초 effect fetch 성공 | 약관 박스 푸터에 버전 문자열 표시.

## Flux Flow (Action → Store → View)
```mermaid
digraph Flux {
  rankdir=LR
  node [shape=box]
  CHANGE_FIELD -> SignUpStore
  MARK_TOUCHED -> SignUpStore
  SUBMIT_REQUEST -> SignUpStore
  API_SUCCESS[label="Auth API success"]
  API_FAILURE[label="Auth API failure"]
  SignUpStore -> UserFormView[label="state → props"]
  UserFormView -> SUBMIT_REQUEST[label="onSubmit"]
  UserFormView -> CHANGE_FIELD[label="onChange"]
  SignUpStore -> RouterView[label="redirectCountdown"]
  SUBMIT_REQUEST -> AuthUseCase[label="call UC-01"]
  AuthUseCase -> API_SUCCESS
  AuthUseCase -> API_FAILURE
  API_SUCCESS -> SignUpStore[label="SUBMIT_SUCCESS"]
  API_FAILURE -> SignUpStore[label="SUBMIT_FAILURE"]
}
```

## Context Loading & Exposure
### Flow
```mermaid
flowchart TD
  A[SignUpPageProvider] -->|useEffect| B[loadConsentVersions()]
  A --> C[useReducer(SignUpReducer, initialState)]
  C --> D[/SignUpContext/]
  D --> E[GeneralTabForm]
  D --> F[LawyerTabForm]
  E -->|dispatch CHANGE_FIELD| C
  E -->|dispatch SUBMIT_REQUEST| G[signUpUseCase (UC-01)]
  G -->|POST /api/auth/sign-up| H[(Supabase Auth + DB)]
  H -->|success/error| C
```

### Exposed Interface (`useSignUpContext`)
- **State selectors**
  - `activeTab`
  - `formValues.user`, `fieldErrors.user`, `touched.user`
  - `submitStatus.user`
  - `serverError`, `redirectCountdown`
  - `consentVersions`
- **Actions**
  - `setActiveTab(tab)` → dispatch `SWITCH_TAB`
  - `updateField(tab, key, value)` → dispatch `CHANGE_FIELD`
  - `markTouched(tab, key)`
  - `submitUserForm()` → runs client validation then dispatch `SUBMIT_REQUEST` → execute UC-01 use case → handle success/failure.
  - `dismissError()` → clears `serverError`
```
