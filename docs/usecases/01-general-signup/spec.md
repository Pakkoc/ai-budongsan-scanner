# 유스케이스 ID: UC-01

## 제목
일반 회원 가입

---

## 1. 개요
- **Primary Actor**: 일반 사용자(실거주자)
- **Supporting Actors**: 프론트엔드(Next.js App Router), 백엔드 API(Hono), Supabase Auth/DB
- **목적**: 일반 사용자가 이메일·비밀번호 기반 계정을 생성하고 AI 빠른상담에 바로 진입할 수 있도록 한다.
- **범위**: `/sign-up` 페이지(일반 탭), `/api/auth/sign-up` 엔드포인트, Supabase Auth 계정 생성 및 `profiles`, `user_consents` 레코드 작성. 변호사 가입, 소셜 로그인은 제외.

## 2. Precondition (사용자 관점)
- 사용자는 로그아웃 상태이며 `/sign-up` 일반 회원 탭에 접근한다.
- 유효한 이메일·비밀번호·닉네임을 준비하고 약관/개인정보 처리방침 내용을 확인했다.

## 3. Trigger
- 사용자가 "가입 완료" 버튼을 클릭한다.

## 4. Main Scenario
1. **User → FE**: 이메일, 비밀번호, 닉네임, 약관 동의 체크를 입력/선택 후 제출.
2. **FE**: 클라이언트 검증(형식, 비밀번호 길이, 닉네임 최소 길이)을 통과시키고 `/api/auth/sign-up` POST 요청을 생성.
3. **FE → BE**: 요청 페이로드 `{email, password, nickname, consentVersions}` 전송.
4. **BE**: Supabase Auth Admin API로 사용자 계정을 생성하고 세션 토큰을 발급받는다.
5. **BE → Database**: `profiles`에 `role='user'`, 닉네임을 저장하고 `user_consents`에 약관/개인정보 동의 버전을 기록한다.
6. **Database → BE**: 트랜잭션 성공을 반환.
7. **BE → FE**: 세션 쿠키/토큰을 포함한 성공 응답과 리디렉션 목적지(`/ai-qna`).
8. **FE → User**: 가입 성공 메시지와 함께 AI 빠른상담 페이지로 이동시킨다.

## 5. Edge Cases
- 잘못된 입력 형식 → FE가 필드별 오류 메시지를 표시하고 제출을 차단.
- 이메일 중복 → BE가 Supabase Auth 오류를 FE에 전달, FE는 "이미 가입된 이메일" 안내 모달 표시.
- DB 트랜잭션 실패 → BE가 롤백 후 500 응답, FE는 재시도 안내와 고객센터 링크 제공.

## 6. Business Rules
- 닉네임은 서비스 내 고유해야 한다.
- 회원가입 직후 역할은 반드시 `user`로 설정된다.
- 약관·개인정보 동의는 가입과 동시에 동일 트랜잭션으로 저장되어야 한다.
- 성공 시 즉시 인증 세션을 생성해 `/ai-qna` 접근을 허용한다.

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 가입 정보 입력/제출
FE -> FE: 폼 검증
FE -> BE: POST /api/auth/sign-up
BE -> Database: Supabase Auth 계정 생성
Database --> BE: Auth 사용자 ID
BE -> Database: INSERT profiles & user_consents
Database --> BE: Commit OK
BE --> FE: 가입 성공 + 세션 토큰
FE --> User: 성공 알림 및 /ai-qna 리디렉션
@enduml

## 8. Post-conditions
- **성공**: 새 Supabase Auth 계정, `profiles(role='user')`, `user_consents` 레코드가 생성되고 사용자 세션이 활성화된다.
- **실패**: 생성 시도는 롤백되며 세션이 열리지 않는다.

## 9. 관련 유스케이스
- **선행**: 없음
- **후행**: UC-05 (AI 질문 공개)
- **연관**: UC-02 (변호사 회원 가입)

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
