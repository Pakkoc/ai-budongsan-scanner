# 유스케이스 ID: UC-04

## 제목
관리자 변호사 승인/반려 처리

---

## 1. 개요
- **Primary Actor**: 서비스 관리자
- **Supporting Actors**: FE(`/admin/lawyer-approval`), BE(`/api/admin/lawyer-approval`), Database
- **목적**: 관리자 페이지에서 제출된 변호사 자격 서류를 검토하고 승인 또는 반려하여 활동 권한을 제어한다.
- **범위**: 승인 대기 목록 조회, 서류 경로 확인, 승인/반려 처리, `lawyer_profiles` 상태 변경, 알림 발송.

## 2. Precondition (사용자 관점)
- 관리자는 관리자 권한 계정으로 `/admin`에 로그인했다.
- 최소 한 건의 `verification_requests(status='in_review')`가 존재한다.

## 3. Trigger
- 관리자가 특정 신청 건의 "승인" 또는 "반려" 버튼을 클릭한다.

## 4. Main Scenario
1. **Admin(User) → FE**: 승인 대기 목록에서 신청 상세를 열고 결정을 선택.
2. **FE → BE**: PATCH `/api/admin/lawyer-approval/{requestId}` 요청에 `action=approve|reject`, 선택 시 반려 사유 포함.
3. **BE → Database**: 트랜잭션 내에서 `verification_requests.status`와 `reviewed_by`, `reviewed_at`, `review_note`를 업데이트하고 `lawyer_profiles.verification_status`를 `approved` 또는 `rejected`로 변경.
4. **Database → BE**: 커밋 성공.
5. **BE → Database**: `notifications`에 변호사용 알림(`LAWYER_VERIFICATION_UPDATED`)을 추가.
6. **BE → FE**: 처리 완료 응답과 최신 상태 payload 반환.
7. **FE → User**: 목록에서 해당 건을 제거하고 토스트 메시지로 결과 표시.

## 5. Edge Cases
- 권한 없는 계정 → BE가 403 응답.
- 이미 처리된 요청에 대한 중복 승인 → BE가 409와 현재 상태를 전달.
- DB 업데이트 실패 → 트랜잭션 롤백 후 500, FE는 재시도/문의 안내.

## 6. Business Rules
- 승인 시 `lawyer_profiles.verification_status`는 즉시 `approved`가 되어야 하며 포인트·답변 기능 접근이 허용된다.
- 반려 시 `review_note`가 필수이며 상태는 `rejected`.
- 모든 변경은 `reviewed_by`(관리자 user_id)와 시간 스탬프로 추적된다.

## 7. Sequence Diagram
@startuml
actor User as Admin
participant FE
participant BE
database Database

Admin -> FE: 승인/반려 액션 선택
FE -> BE: PATCH /api/admin/lawyer-approval/{id}
BE -> Database: UPDATE verification_requests & lawyer_profiles
Database --> BE: Commit OK
BE -> Database: INSERT notification
Database --> BE: Notification logged
BE --> FE: 처리 결과
FE --> Admin: 성공 메시지/목록 갱신
@enduml

## 8. Post-conditions
- **승인**: `lawyer_profiles.verification_status='approved'`, 신청건 `status='approved'`, 알림 생성.
- **반려**: 상태가 `rejected`, 반려 사유 저장.

## 9. 관련 유스케이스
- **선행**: UC-03 변호사 서류 업로드
- **후행**: UC-06 포인트 충전, UC-07 답변 작성

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
