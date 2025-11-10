# 유스케이스 ID: UC-07

## 제목
변호사 답변 작성 및 포인트 차감

---

## 1. 개요
- **Primary Actor**: 승인된 변호사 회원
- **Supporting Actors**: FE(`/lawyer-board`, `/qna/{id}`), BE(`/api/qna/{id}/answers`), Database
- **목적**: 변호사가 공개 질문에 답변을 작성하면서 건당 1,000포인트를 차감하고 질문자에게 알림을 보낸다.
- **범위**: 질문 상세 조회, 포인트 잔액 검증, 답변 저장, 트랜잭션 처리, 알림 생성.

## 2. Precondition (사용자 관점)
- 변호사는 `approved` 상태이며 `point_wallets.balance >= 1000`.
- 답변하려는 질문이 `is_public=true`이고 삭제되지 않았다.

## 3. Trigger
- 변호사가 질문 상세 화면에서 답변 내용을 입력 후 "답변 등록" 버튼을 클릭한다.

## 4. Main Scenario
1. **User → FE**: 답변 내용을 작성하고 제출.
2. **FE → BE**: POST `/api/qna/{questionId}/answers` 요청(본문: content).
3. **BE → Database**: 질문 존재/상태 확인.
4. **BE → Database**: 변호사 잔액 조회, 부족 시 에러.
5. **BE**: 트랜잭션 시작.
6. **BE → Database**: `point_transactions`에 `answer_deduction` 1,000P 삽입, `point_wallets.balance -= 1000`.
7. **BE → Database**: `answers` 레코드 생성(status='submitted').
8. **BE → Database**: 질문자 대상 `notifications(type='NEW_ANSWER')` 작성.
9. **BE → Database**: 트랜잭션 커밋.
10. **BE → FE/User**: 성공 응답과 잔액/답변 데이터 반환. FE는 답변 리스트 갱신.

## 5. Edge Cases
- 포인트 부족 → BE가 402/409 응답, FE는 충전 페이지 링크 제공.
- 질문이 삭제되었거나 비공개 전환 → BE가 404/410 반환, FE는 안내 토스트 후 목록으로 이동.
- 트랜잭션 중 오류 → 전체 롤백 후 "답변 등록 실패" 메시지.

## 6. Business Rules
- 답변 건당 1,000포인트 실시간 차감.
- 승인된 변호사만 답변 가능.
- 하나의 질문에 여러 변호사 답변 가능하나 채택은 단일 (UC-09).
- 답변 저장 후 알림 발송은 필수.

## 7. Sequence Diagram
@startuml
actor User as Lawyer
participant FE
participant BE
database Database

Lawyer -> FE: 답변 작성/제출
FE -> BE: POST /api/qna/{id}/answers
BE -> Database: Validate question & balance
Database --> BE: 상태/잔액 정보
BE -> Database: INSERT point_transactions & UPDATE point_wallets
BE -> Database: INSERT answers
BE -> Database: INSERT notification (질문자)
Database --> BE: Commit OK
BE --> FE: 답변/잔액 정보
FE --> Lawyer: 성공 안내
@enduml

## 8. Post-conditions
- **성공**: 1,000P 차감, `answers` 레코드 생성, 질문자 알림 발행.
- **실패**: 포인트/알림/답변 변경 없음.

## 9. 관련 유스케이스
- **선행**: UC-04 승인, UC-06 포인트 충전
- **후행**: UC-09 질문자 답변 채택

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
