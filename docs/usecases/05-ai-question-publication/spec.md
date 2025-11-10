# 유스케이스 ID: UC-05

## 제목
AI 상담 질문 저장 및 공개 전환

---

## 1. 개요
- **Primary Actor**: 일반 사용자 (질문 작성자)
- **Supporting Actors**: FE(`/ai-qna`), BE(`/api/ai/qna`), Gemini API, Supabase Database
- **목적**: AI와의 대화 로그를 기반으로 질문을 생성하고, "변호사 공개" 여부에 따라 `questions`와 `question_messages`에 저장해 변호사 게시판에 노출한다.
- **범위**: 채팅 입력, Gemini 호출, 메시지 스트림 저장, 대화 종료 시 질문 레코드 작성. 변호사 답변은 제외.

## 2. Precondition (사용자 관점)
- 사용자는 로그인된 상태이며 `/ai-qna` 페이지에 접근했다.
- 최소 한 차례 AI 대화를 진행 중이다.

## 3. Trigger
- 사용자가 "대화 종료" 버튼을 클릭하고 "이 질문을 변호사에게 공개" 체크 상태를 확정한다.

## 4. Main Scenario
1. **User → FE**: 질문 문장을 입력하고 전송한다.
2. **FE → BE**: `/api/ai/qna/stream`으로 현재 대화 히스토리를 전송.
3. **BE → Gemini**: gemini-2.5-flash 모델을 호출하고 스트리밍 응답을 수신.
4. **BE → Database**: 각 메시지를 `question_messages`에 순차 저장(`sender=user/ai`).
5. **BE → FE**: AI 응답을 스트리밍으로 전달, FE는 채팅 UI에 표시.
6. **User → FE**: 대화 종료 및 공개 여부를 결정한다.
7. **FE → BE**: POST `/api/qna/questions` 요청에 공개 여부, 메시지 스레드, 요약 제목을 포함.
8. **BE → Database**: 트랜잭션으로 `questions`를 생성(`is_public`값 포함)하고 메시지 묶음을 연결한다.
9. **Database → BE**: 커밋 완료.
10. **BE → FE/User**: 저장 성공 메시지와 공개 시 변호사 답변 대기 안내를 반환.

## 5. Edge Cases
- Gemini API 실패 → BE가 에러를 반환하고 FE는 "AI 답변 생성 실패" 토스트를 보여주며 재시도 버튼을 활성화.
- 대화 종료 시 DB 저장 실패 → 트랜잭션 롤백 후 사용자에게 실패 알림 및 재시도 옵션 제공.
- 공개 옵션 해제 → 질문은 `is_public=false`로 저장되어 변호사 게시판에 노출되지 않는다.

## 6. Business Rules
- 질문 생성 시각이 삭제 가능 시간(1시간) 판단 근거가 된다.
- `is_public=true`인 질문만 `/lawyer-board`에 노출된다.
- 모든 메시지는 순서를 유지해야 하며 수정 불가.
- AI 답변에는 필수 면책 문구가 포함되어야 한다 (FE/BE 레이어에서 주입).

## 7. Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 질문 입력
FE -> BE: POST /api/ai/qna/stream
BE -> Database: INSERT question_messages (user 메시지)
BE -> Database: INSERT question_messages (ai 응답)
BE --> FE: AI 응답 스트림
User -> FE: 대화 종료 + 공개 여부
FE -> BE: POST /api/qna/questions
BE -> Database: INSERT questions + link messages
Database --> BE: Commit OK
BE --> FE: 저장 성공
FE --> User: 공개 완료 안내
@enduml

## 8. Post-conditions
- **성공**: `questions` 레코드 생성, 모든 메시지가 질문 ID와 연결.
- **실패**: 메시지는 롤백 전 상태 유지하나 질문 레코드는 생성되지 않는다.

## 9. 관련 유스케이스
- **선행**: UC-01 일반 가입
- **후행**: UC-07 변호사 답변 작성, UC-08 질문 삭제, UC-09 답변 채택

## 10. 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-10 | Codex | 초기 작성 |
