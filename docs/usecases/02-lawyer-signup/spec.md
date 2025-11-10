# 유스케이스 ID: UC-02

## 제목
변호사 회원 가입

---

## 1. 개요
- **Primary Actor**: 변호사로 가입하려는 사용자
- **Supporting Actors**: FE(Next.js `/sign-up?type=lawyer`), BE(Hono Auth API), Supabase Auth/DB
- **목적**: 변호사가 일반 가입과 동일한 크레덴셜을 생성하되, 추가 정보(실명, 등록번호)를 수집하고 인증 상태를 `pending`으로 설정한다.
- **범위**: 변호사 탭의 가입 UX, `/api/auth/sign-up` 변형 로직, `lawyer_profiles` 초기화. 자격 서류 업로드는 UC-03에서 다룬다.

## 2. Precondition (사용자 관점)
- 사용자는 `/sign-up?type=lawyer` 탭에 접근했고 로그아웃 상태다.
- 이메일·비밀번호·닉네임 외에 실명과 변호사 등록번호를 확보했다.

## 3. Trigger
- 사용자가 변호사 가입 폼 제출 버튼을 클릭한다.

## 4. Main Scenario
1. **User → FE**: 이메일, 비밀번호, 닉네임, 실명, 등록번호, 약관 동의를 입력한다.
2. **FE**: 필수 필드 및 등록번호 패턴을 검증한 후 `/api/auth/lawyer-sign-up` (동일 핸들러)로 요청을 전송한다.
3. **BE**: Supabase Auth에 계정을 생성하고 세션을 발급한다.
4. **BE → Database**: 트랜잭션 내에서 `profiles(role='lawyer')`, `lawyer_profiles`(full_name, bar_number, verification_status='pending'), `user_consents`를 저장한다.
5. **Database → BE**: 커밋.
6. **BE → FE**: 성공 응답 + 세션 정보를 반환하며 `/my-page` 리디렉션 지시.
7. **FE → User**: 마이페이지로 이동시키고 "자격 서류를 업로드하세요" 안내를 표시한다.

## 5. Edge Cases
- 등록번호 형식 오류 → FE가 즉시 에러 메시지로 제출을 차단.
- Auth 생성은 성공했으나 DB 삽입 실패 → BE가 롤백 후 Auth 사용자 삭제를 시도, 실패 시 관리자 알림 로그 남김.
- 이미 변호사로 가입된 이메일 → Auth 중복 오류 반환.

## 6. Business Rules
- 변호사 가입 시 기본 인증 상태는 `pending` 이어야 하며 승인 전까지 답변/포인트 기능 접근 불가.
- `bar_registration_number`는 전역 유일.
- 성공 시 즉시 로그인 상태로 마이페이지에 입장해야 한다.

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 변호사 가입 정보 입력
FE -> FE: 확장 필드 검증
FE -> BE: POST /api/auth/sign-up (type=lawyer)
BE -> Database: Supabase Auth 계정 생성
Database --> BE: Auth ID
BE -> Database: INSERT profiles, lawyer_profiles, user_consents
Database --> BE: Commit OK
BE --> FE: Success + session
FE --> User: /my-page 이동 및 업로드 안내
@enduml

## 8. Post-conditions
- **성공**: Auth 계정 + `profiles(role='lawyer')` + `lawyer_profiles(status='pending')` + `user_consents` 생성, 세션 활성화.
- **실패**: 어떤 테이블도 남지 않으며 사용자에게 오류 메시지 표출.

## 9. 관련 유스케이스
- **선행**: UC-01(컨셉 공유)
- **후행**: UC-03(자격 서류 업로드), UC-06(포인트 충전)

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
