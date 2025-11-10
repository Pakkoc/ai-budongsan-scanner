# 유스케이스 ID: UC-06

## 제목
변호사 포인트 충전 (Toss Payments 연동)

---

## 1. 개요
- **Primary Actor**: 승인 완료된 변호사 회원
- **Supporting Actors**: FE(`/my-page` 포인트 관리), BE(`/api/payments/toss`), Toss Payments, Database
- **목적**: 변호사가 답변 활동에 필요한 포인트를 선불로 충전하여 `point_wallets` 잔액을 늘린다.
- **범위**: 결제 금액 선택, 결제 세션 생성, Toss 결제 완료 콜백 처리, 포인트 트랜잭션 적재.

## 2. Precondition (사용자 관점)
- 변호사 계정이 `approved` 상태이다.
- 최소 10,000원 이상 충전 가능한 결제수단을 보유하고 있다.

## 3. Trigger
- 사용자가 포인트 관리 화면에서 충전 금액을 선택하고 "충전하기" 버튼을 누른다.

## 4. Main Scenario
1. **User → FE**: 충전 금액을 입력/선택 후 충전 요청.
2. **FE → BE**: POST `/api/payments/toss/session`에 금액과 리디렉션 URL 전달.
3. **BE → Toss**: 결제 세션을 생성하고 결제 URL을 수신.
4. **BE → FE**: 결제 페이지 URL 반환, FE는 Toss 결제 창으로 리디렉션.
5. **User**: Toss 결제 페이지에서 결제를 완료.
6. **Toss → BE**: 성공 콜백/웹훅을 호출.
7. **BE → Database**: 트랜잭션으로 `point_transactions(tx_type='charge', amount)`, `point_wallets.balance += amount`를 기록.
8. **Database → BE**: 커밋.
9. **BE → FE/User**: 마이페이지로 돌아왔을 때 잔액을 갱신하고 성공 토스트 표시.

## 5. Edge Cases
- 결제 세션 생성 실패 → BE가 오류 응답, FE는 "결제 생성 실패" 메시지와 재시도 버튼을 표시.
- 사용자가 결제를 취소 → Toss가 취소 콜백 제공, FE는 "사용자에 의해 취소" 안내.
- Toss 콜백 도착했으나 DB 업데이트 실패 → BE가 롤백하고 관리자 알림/재처리 큐에 적재, 사용자에게는 문의 안내.

## 6. Business Rules
- 1포인트 = 1원, 정수 금액만 허용.
- 모든 결제 완료는 `point_transactions.external_payment_id`로 추적되어 중복 적립을 방지한다.
- 콜백 검증(시그니처, 금액)은 BE에서 수행해야 한다.

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 충전 금액 선택
FE -> BE: POST /api/payments/toss/session
BE --> FE: Toss 결제 URL
User -> FE: 결제 완료 후 리디렉션
BE -> Database: INSERT point_transactions + UPDATE point_wallets
Database --> BE: Commit OK
BE --> FE: 잔액 갱신 데이터
FE --> User: 성공 알림
@enduml

## 8. Post-conditions
- **성공**: `point_wallets.balance`가 증가하고 `point_transactions`에 `charge` 기록이 추가.
- **실패**: 잔액 변화 없으며 결제 재시도 가능.

## 9. 관련 유스케이스
- **선행**: UC-04 관리자 승인
- **후행**: UC-07 변호사 답변 작성

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
