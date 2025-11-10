# 유스케이스 ID: UC-08

## 제목
질문자 질문 삭제 (1시간 이내) 및 포인트 환불

---

## 1. 개요
- **Primary Actor**: 질문 작성자(일반 사용자)
- **Supporting Actors**: FE(`/qna/{id}` 또는 `/my-page`), BE(`/api/qna/{id}` DELETE), Database
- **목적**: 공개된 질문을 등록 1시간 이내에 삭제하고 해당 질문에 달린 모든 변호사 답변의 포인트를 환불한다.
- **범위**: 질문자 권한 확인, 시간 제한 검증, 답변 조회, 환불 트랜잭션, 소프트 삭제 플래그 업데이트.

## 2. Precondition (사용자 관점)
- 로그인한 사용자이며 삭제하려는 질문의 작성자다.
- 질문 생성 후 1시간이 지나지 않았다.

## 3. Trigger
- 사용자가 "삭제하기" 버튼을 클릭하고 확인 모달에서 승인을 눌렀다.

## 4. Main Scenario
1. **User → FE**: 삭제 액션 수행.
2. **FE → BE**: DELETE `/api/qna/{questionId}` 호출.
3. **BE → Database**: 질문 존재, 작성자 일치, `now() - created_at <= 1 hour` 조건 검증.
4. **BE → Database**: 질문에 연관된 모든 `answers`를 조회.
5. **BE**: 트랜잭션 시작.
6. **BE → Database**: 각 답변별 1,000P 환불 `point_transactions(type='answer_refund')` 생성 및 `point_wallets` 업데이트.
7. **BE → Database**: `answers.deleted_at` 및 `questions.deleted_at` 기록, `status='deleted'` 변경.
8. **Database → BE**: 커밋 확인.
9. **BE → FE/User**: 삭제 성공 응답 및 리다이렉션 안내.

## 5. Edge Cases
- 1시간 초과 → BE가 403/422 반환, FE는 버튼 비활성화 또는 경고 메시지 표시.
- 환불 중 일부 UPDATE 실패 → 트랜잭션 전체 롤백 후 에러 메시지.
- 질문자가 아님 → 403 반환.

## 6. Business Rules
- 삭제는 생성 후 1시간 내 단회 가능.
- 환불 금액은 답변 수 × 1,000P.
- 삭제는 소프트 삭제 방식으로 기록 유지(`deleted_at`).
- 환불 트랜잭션에는 관련 질문/답변 ID가 저장되어야 한다.

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 삭제 확인
FE -> BE: DELETE /api/qna/{id}
BE -> Database: Validate owner & time window
Database --> BE: 검증 결과 + 답변 목록
BE -> Database: INSERT refund transactions & update wallets
BE -> Database: UPDATE answers/questions deleted_at
Database --> BE: Commit OK
BE --> FE: 삭제 성공 응답
FE --> User: 목록으로 리디렉션
@enduml

## 8. Post-conditions
- **성공**: 질문/답변이 소프트 삭제되고 포인트가 환불, 변호사 잔액이 복구.
- **실패**: 질문 상태 변화 없음, 환불도 수행되지 않는다.

## 9. 관련 유스케이스
- **선행**: UC-05 질문 공개, UC-07 답변 작성
- **후행**: 없음

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
