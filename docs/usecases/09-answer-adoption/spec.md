# 유스케이스 ID: UC-09

## 제목
질문자 답변 채택

---

## 1. 개요
- **Primary Actor**: 질문 작성자
- **Supporting Actors**: FE(`/qna/{id}`), BE(`/api/qna/{id}/answers/{answerId}/adopt`), Database
- **목적**: 질문자가 가장 만족스러운 변호사 답변을 채택하여 답변 목록에서 강조하고 질문 상태를 종료한다.
- **범위**: 채택 가능 여부 검증, 답변/질문 상태 업데이트, 알림 전송. 추가 보상 로직은 없음.

## 2. Precondition (사용자 관점)
- 질문 작성자가 로그인한 상태로 질문 상세 페이지를 보고 있다.
- 최소 한 개 이상의 변호사 답변이 존재하며 질문이 삭제되지 않았다.

## 3. Trigger
- 질문자가 특정 답변의 "답변 채택하기" 버튼을 클릭한다.

## 4. Main Scenario
1. **User → FE**: 채택 버튼 클릭.
2. **FE → BE**: POST `/api/qna/{questionId}/answers/{answerId}/adopt` 요청.
3. **BE → Database**: 질문 작성자 일치, 기존 채택 여부(`answers.status='adopted'`) 확인.
4. **BE → Database**: 트랜잭션으로 목표 답변 `status='adopted'`, `adopted_at` 업데이트.
5. **BE → Database**: 질문 `status='adopted'`로 변경.
6. **BE → Database**: `notifications(type='ANSWER_ADOPTED')`를 변호사에게 생성.
7. **Database → BE**: 커밋.
8. **BE → FE/User**: 성공 응답과 최신 답변 목록을 반환, FE는 채택 배지를 표시하고 다른 채택 버튼을 비활성화.

## 5. Edge Cases
- 이미 채택된 답변 존재 → BE가 409 응답, FE는 토스트로 안내.
- 질문자가 아닌 사용자가 시도 → 403 응답.
- 대상 답변이 삭제됨 → 404 응답.

## 6. Business Rules
- 질문당 채택은 단 한 번(데이터베이스 제약)만 허용된다.
- 채택되면 답변은 목록 상단에 고정되고 시각적 배지를 표시해야 한다.
- 채택 후 질문 상태는 "채택 완료"로 표시되어 추가 채택이 불가능하다.

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 채택 버튼 클릭
FE -> BE: POST /api/qna/{q}/answers/{a}/adopt
BE -> Database: Validate owner & adoption status
Database --> BE: 검증 결과
BE -> Database: UPDATE answer status/adopted_at
BE -> Database: UPDATE question status
BE -> Database: INSERT notification (lawyer)
Database --> BE: Commit OK
BE --> FE: 채택 성공 응답
FE --> User: 채택 배지 표시
@enduml

## 8. Post-conditions
- **성공**: 특정 답변 `status='adopted'`, 질문 상태 업데이트, 변호사 알림 생성.
- **실패**: 질문/답변 상태 변동 없음.

## 9. 관련 유스케이스
- **선행**: UC-05 질문 공개, UC-07 변호사 답변 작성
- **후행**: 없음

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
