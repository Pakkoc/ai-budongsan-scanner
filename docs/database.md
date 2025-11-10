# AI 부동산 스캐너 데이터베이스 설계 (개선판)

참고 문서: `/docs/requirment.md`, `/docs/persona.md`, `/docs/techstack.md`, `/docs/structure.md`, `/docs/prd.md`, `/docs/userflow.md`.

## 1. 데이터 플로우 (유저플로우 기준)
1. **회원 가입 & 동의 (Userflow #1, #2)**
   - Supabase Auth가 이메일/비밀번호를 관리한다.
   - 가입 직후 `profiles`에 역할(`user`/`lawyer`)과 닉네임을 기록하고, 약관·개인정보 동의 버전을 `user_consents`에 저장한다.
2. **변호사 자격 업로드 & 심사 (Userflow #3, #4)**
   - 변호사 회원이 `.jpg/.pdf` 증빙을 업로드하면 Storage 경로/파일 메타를 `verification_requests`에 적재하고 상태를 `in_review`로 둔다.
   - 관리자가 `/admin/lawyer-approval`에서 승인/반려를 결정하면 해당 요청의 `status`가 갱신되고, 최신 결과가 `lawyer_profiles.verification_status`에 반영되며 `notifications`로 결과가 전달된다.
3. **AI 상담 → 질문 저장 (Userflow #5)**
   - `/ai-qna`에서 발생한 대화 메시지는 `question_messages`에 순차 저장된다 (sender=`user`/`ai`).
   - 사용자가 "변호사에게 공개" 상태로 대화를 종료하면 `questions`가 생성되어 공개 여부, 생성 시각, 현재 상태(`awaiting_answer`)를 기록한다.
4. **변호사 포인트 충전 (Userflow #6)**
   - Toss Payments 성공 콜백마다 `point_transactions`에 `charge` 트랜잭션을 쌓고, 동일 트랜잭션으로 `point_wallets.balance`를 증가시킨다.
5. **변호사 답변 작성 (Userflow #7)**
   - 답변 시점에 변호사 승인 여부(`lawyer_profiles.verification_status='approved'`)와 최소 잔액(1,000P)을 확인한다.
   - 트랜잭션 안에서 1,000P 차감(`point_transactions` type `answer_deduction`, `point_wallets` 감소)과 `answers` 레코드 생성을 동시에 수행한다.
   - 질문 작성자는 `notifications(type='NEW_ANSWER')`로 새 답변을 수신한다.
6. **질문 삭제 & 포인트 환불 (Userflow #8)**
   - 질문자가 생성 1시간 이내 삭제 요청 시, 해당 질문과 연결된 모든 답변을 찾아 차감된 포인트만큼 `answer_refund` 트랜잭션을 만들고 환불한다.
   - `answers`와 `questions`의 `deleted_at`을 채워 이력을 남긴다.
7. **답변 채택 (Userflow #9)**
   - 질문 작성자만 채택 가능하며 기존 채택 여부를 검사한다.
   - 선택된 `answers.status`를 `adopted`, 질문을 `adopted`로 바꾸고 `adopted_at`을 기록한다.
   - 채택된 변호사에게 `notifications(type='ANSWER_ADOPTED')`를 발송한다.

> 상기 흐름 외 데이터는 저장하지 않는다. (예: 변호사 공개 프로필 내용, 결제 영수증 세부 필드 등은 유저플로우에 없으므로 제외)

## 2. PostgreSQL 스키마
### 2.1 Enum 정의
```sql
CREATE TYPE user_role AS ENUM ('user', 'lawyer', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
CREATE TYPE question_status AS ENUM ('awaiting_answer', 'adopted', 'deleted');
CREATE TYPE answer_status AS ENUM ('submitted', 'adopted', 'deleted');
CREATE TYPE point_tx_type AS ENUM ('charge', 'answer_deduction', 'answer_refund');
CREATE TYPE notification_type AS ENUM ('LAWYER_VERIFICATION_UPDATED', 'NEW_ANSWER', 'ANSWER_ADOPTED');
CREATE TYPE message_role AS ENUM ('user', 'ai');
```

### 2.2 테이블 상세
| Table | 핵심 컬럼 | 목적 |
| --- | --- | --- |
| `profiles` | `user_id` (PK, FK→`auth.users.id`), `role user_role NOT NULL`, `nickname TEXT UNIQUE NOT NULL`, `created_at TIMESTAMPTZ DEFAULT now()` | Auth 유저의 역할(일반/변호사/관리자)과 닉네임을 저장. 모든 도메인 테이블의 기준 키. |
| `user_consents` | `consent_id UUID PK`, `user_id` FK→`profiles`, `terms_version TEXT NOT NULL`, `privacy_version TEXT NOT NULL`, `agreed_at TIMESTAMPTZ DEFAULT now()`, `UNIQUE(user_id)` | 회원가입 시 약관/개인정보 동의 시점을 기록 (Userflow #1,#2). |
| `lawyer_profiles` | `user_id` PK FK→`profiles`, `full_name TEXT NOT NULL`, `bar_registration_number TEXT UNIQUE NOT NULL`, `verification_status verification_status DEFAULT 'pending'`, `verification_changed_at TIMESTAMPTZ` | 변호사 가입 정보와 현재 인증 상태를 추적. 승인 여부 판단에 직접 사용. |
| `verification_requests` | `request_id UUID PK`, `lawyer_user_id` FK→`lawyer_profiles`, `status verification_status DEFAULT 'in_review'`, `document_path TEXT NOT NULL`, `file_ext TEXT NOT NULL`, `file_size_bytes INT NOT NULL`, `submitted_at TIMESTAMPTZ DEFAULT now()`, `reviewed_by UUID FK→`profiles``, `reviewed_at TIMESTAMPTZ`, `review_note TEXT` | 자격 서류 업로드부터 관리자 검토까지의 상태 추적 (Userflow #3,#4). 최신 승인 결과가 `lawyer_profiles`에 반영된다. |
| `questions` | `question_id UUID PK`, `asker_user_id` FK→`profiles`, `is_public BOOLEAN NOT NULL`, `status question_status DEFAULT 'awaiting_answer'`, `created_at TIMESTAMPTZ DEFAULT now()`, `deleted_at TIMESTAMPTZ` | AI 상담을 공개 저장한 질문 본문. 생성 시각으로 삭제 가능 시간(1시간)을 판정하며, `deleted_at`으로 삭제 여부를 표시. |
| `question_messages` | `message_id UUID PK`, `question_id` FK→`questions` ON DELETE CASCADE, `sender message_role NOT NULL`, `content TEXT NOT NULL`, `position INT NOT NULL`, `created_at TIMESTAMPTZ DEFAULT now()`, `UNIQUE(question_id, position)` | `/ai-qna` 채팅 로그. 변호사가 질문 상세에서 AI/사용자 대화를 그대로 확인 가능. |
| `answers` | `answer_id UUID PK`, `question_id` FK→`questions` ON DELETE CASCADE, `lawyer_user_id` FK→`lawyer_profiles`, `content TEXT NOT NULL`, `status answer_status DEFAULT 'submitted'`, `created_at TIMESTAMPTZ DEFAULT now()`, `adopted_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`, `UNIQUE(question_id) WHERE status = 'adopted'` | 변호사 답변 데이터를 저장. 채택/삭제 시각 기록으로 상태 변화 추적. |
| `point_wallets` | `lawyer_user_id UUID PK FK→`lawyer_profiles`, `balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0)`, `updated_at TIMESTAMPTZ DEFAULT now()` | 변호사별 현재 포인트 잔액을 빠르게 조회. 변호사 가입 시 0원으로 생성. |
| `point_transactions` | `tx_id UUID PK`, `lawyer_user_id` FK→`lawyer_profiles`, `tx_type point_tx_type NOT NULL`, `amount INT NOT NULL CHECK (amount > 0)`, `balance_after INT NOT NULL CHECK (balance_after >= 0)`, `related_question_id` FK→`questions`, `related_answer_id` FK→`answers`, `external_payment_id TEXT UNIQUE`, `created_at TIMESTAMPTZ DEFAULT now()` | 충전/차감/환불 이력. `balance_after`는 해당 시점 잔액 스냅샷이며, 어플리케이션 트랜잭션에서 `point_wallets.balance`와 동기화한다. |
| `notifications` | `notification_id UUID PK`, `recipient_user_id` FK→`profiles`, `type notification_type NOT NULL`, `payload JSONB`, `is_read BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ DEFAULT now()` | 시스템 알림 (심사 결과, 새 답변, 채택) 기록. `payload`에는 관련 question/answer id를 JSON으로 저장. |

### 2.3 제약 & 운용 규칙
1. **역할 기반 제약**: `lawyer_profiles`와 연결된 모든 FK는 `profiles.role='lawyer'`인 값만 허용되도록 애플리케이션 레이어가 검증하고, RLS 정책에서 동일 조건을 강제한다.
2. **단일 동의 기록**: `user_consents`의 `UNIQUE(user_id)`로 중복 동의를 차단하여 가입 시점만 보존한다.
3. **자격 심사 동기화**: 관리자가 요청을 승인/반려하면 애플리케이션이 동일 트랜잭션에서 `verification_requests.status`와 `lawyer_profiles.verification_status`를 함께 갱신하고 `notifications`를 생성한다.
4. **질문 삭제 정책**: 삭제 유스케이스는 `questions.created_at`과 현재 시각 차이를 검사한다. DB에는 `deleted_at`만 기록해 감사 로그를 남기고, 실제 삭제 대신 소프트 삭제한다.
5. **포인트 일관성**: 포인트 차감·환불·충전은 반드시 하나의 DB 트랜잭션에서 `point_transactions` → `point_wallets` → (`answers` 또는 `questions`) 순으로 처리하여 잔액이 음수가 되지 않도록 한다. `balance_after`를 저장해 UI에서 합산 없이 즉시 노출 가능하도록 한다.
6. **채택 단일성**: `answers`에 `UNIQUE(question_id) WHERE status = 'adopted'` 제약을 두어 질문당 한 번만 채택 가능하도록 강제한다.
7. **메시지 순서**: `question_messages`의 `UNIQUE(question_id, position)`으로 AI 대화 순서를 보존한다.

이 설계는 유저플로우에 등장한 데이터만 보존하면서, Supabase(PostgreSQL)로 빠르게 구현할 수 있는 최소 스펙을 정의한다. 애플리케이션 계층은 각 유스케이스를 단일 트랜잭션으로 감싸 무결성을 유지한다.
