# 유스케이스 ID: UC-03

## 제목
변호사 자격 서류 업로드 및 심사 대기 등록

---

## 1. 개요
- **Primary Actor**: 승인 대기 중인 변호사 회원
- **Supporting Actors**: FE(`/my-page` 변호사 인증 관리), BE(`/api/lawyer/verification`), Supabase Storage & DB, 관리자 알림 시스템
- **목적**: 변호사가 자격을 증명하는 문서를 업로드하여 심사 상태를 `in_review`로 전환한다.
- **범위**: 서류 선택/업로드, 스토리지 저장, `verification_requests` 생성, `lawyer_profiles.verification_status` 갱신. 관리자 리뷰(UC-04)는 제외.

## 2. Precondition (사용자 관점)
- 변호사 계정으로 로그인했고 현재 상태가 `pending` 또는 `rejected`다.
- 업로드할 .jpg 또는 .pdf 파일을 준비했다.

## 3. Trigger
- 사용자가 "서류 업로드" 버튼을 클릭하고 파일 선택 후 업로드를 확정한다.

## 4. Main Scenario
1. **User → FE**: 파일을 선택하고 업로드 버튼을 누른다.
2. **FE**: 파일 확장자/크기를 선검증하고 업로드 Progress UI 표시.
3. **FE → BE**: 서명된 업로드 URL을 요청한다.
4. **BE → Storage**: Supabase Storage Private 버킷에 대한 사전 서명 URL을 생성 후 FE로 전달.
5. **FE → Storage**: 사용자가 선택한 파일을 직접 업로드한다.
6. **FE → BE**: 업로드 완료 콜백(파일 경로, 메타데이터)을 `/api/lawyer/verification`에 POST.
7. **BE → Database**: 트랜잭션 내에서 `verification_requests`(status=`in_review`, document_path, file metadata)를 생성하고 `lawyer_profiles.verification_status='in_review'`로 변경.
8. **Database → BE**: 커밋.
9. **BE → FE/User**: "제출 완료, 관리자 검토 중" 메시지 반환.
10. **BE → Notifications**: 관리자용 대기 큐(별도 시스템) 또는 내부 알림을 생성(선택적).

## 5. Edge Cases
- 파일 확장자가 허용되지 않음 → FE에서 즉시 차단.
- Storage 업로드 실패 → FE가 오류를 표시하고 재시도 옵션 제공.
- 이미 `in_review` 상태에서 재업로드 시도 → BE가 409 응답과 현재 상태 안내.

## 6. Business Rules
- 허용 확장자: jpg, jpeg, png, pdf (요구사항에 따라 jpg/pdf 최소 기준 포함).
- 업로드 후 상태는 반드시 `in_review`로 변경된다.
- 모든 제출은 `verification_requests`에 히스토리로 남는다.
- File path는 Private 버킷 경로만 허용.

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 서류 파일 선택/업로드 요청
FE -> BE: POST /api/lawyer/verification/url
BE --> FE: Signed URL
FE -> Database: (via Storage) Upload file
FE -> BE: POST /api/lawyer/verification {path, meta}
BE -> Database: INSERT verification_requests + UPDATE lawyer_profiles
Database --> BE: Commit OK
BE --> FE: 제출 완료 응답
FE --> User: 검토 대기 안내
@enduml

## 8. Post-conditions
- **성공**: 새 `verification_requests` 레코드, `lawyer_profiles.verification_status='in_review'`.
- **실패**: 상태 변화 없음, 사용자는 기존 상태 유지.

## 9. 관련 유스케이스
- **선행**: UC-02 변호사 회원 가입
- **후행**: UC-04 관리자 승인 처리

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
