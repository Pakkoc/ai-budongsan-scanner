-- AI 부동산 스캐너: 초기 데이터베이스 스키마
-- 참조: docs/database.md

-- ============================================================
-- 1. ENUM 타입 정의
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'lawyer', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
CREATE TYPE question_status AS ENUM ('awaiting_answer', 'adopted', 'deleted');
CREATE TYPE answer_status AS ENUM ('submitted', 'adopted', 'deleted');
CREATE TYPE point_tx_type AS ENUM ('charge', 'answer_deduction', 'answer_refund');
CREATE TYPE notification_type AS ENUM ('LAWYER_VERIFICATION_UPDATED', 'NEW_ANSWER', 'ANSWER_ADOPTED');
CREATE TYPE message_role AS ENUM ('user', 'ai');

-- ============================================================
-- 2. 핵심 테이블
-- ============================================================

-- 2.1 프로필 (Auth 유저 확장)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 사용자 약관 동의
CREATE TABLE user_consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2.3 변호사 프로필
CREATE TABLE lawyer_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bar_registration_number TEXT UNIQUE NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verification_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 변호사 자격 인증 요청
CREATE TABLE verification_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_user_id UUID NOT NULL REFERENCES lawyer_profiles(user_id) ON DELETE CASCADE,
  status verification_status NOT NULL DEFAULT 'in_review',
  document_path TEXT NOT NULL,
  file_ext TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES profiles(user_id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);

-- 2.5 질문
CREATE TABLE questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asker_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  status question_status NOT NULL DEFAULT 'awaiting_answer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2.6 질문 메시지 (AI 대화 로그)
CREATE TABLE question_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  sender message_role NOT NULL,
  content TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, position)
);

-- 2.7 답변
CREATE TABLE answers (
  answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  lawyer_user_id UUID NOT NULL REFERENCES lawyer_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status answer_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  adopted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 채택 단일성 제약
CREATE UNIQUE INDEX answers_adopted_unique 
ON answers(question_id) 
WHERE status = 'adopted';

-- 2.8 포인트 지갑
CREATE TABLE point_wallets (
  lawyer_user_id UUID PRIMARY KEY REFERENCES lawyer_profiles(user_id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 포인트 트랜잭션
CREATE TABLE point_transactions (
  tx_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_user_id UUID NOT NULL REFERENCES lawyer_profiles(user_id) ON DELETE CASCADE,
  tx_type point_tx_type NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  related_question_id UUID REFERENCES questions(question_id),
  related_answer_id UUID REFERENCES answers(answer_id),
  external_payment_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 알림
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. 인덱스
-- ============================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_nickname ON profiles(nickname);

CREATE INDEX idx_lawyer_profiles_verification_status ON lawyer_profiles(verification_status);
CREATE INDEX idx_lawyer_profiles_bar_number ON lawyer_profiles(bar_registration_number);

CREATE INDEX idx_verification_requests_lawyer ON verification_requests(lawyer_user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

CREATE INDEX idx_questions_asker ON questions(asker_user_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_is_public ON questions(is_public);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

CREATE INDEX idx_question_messages_question ON question_messages(question_id);
CREATE INDEX idx_question_messages_position ON question_messages(question_id, position);

CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_lawyer ON answers(lawyer_user_id);
CREATE INDEX idx_answers_status ON answers(status);
CREATE INDEX idx_answers_created_at ON answers(created_at DESC);

CREATE INDEX idx_point_transactions_lawyer ON point_transactions(lawyer_user_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_external_payment ON point_transactions(external_payment_id);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 4. RLS (Row Level Security) 정책
-- ============================================================

-- 4.1 Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 4.2 Lawyer Profiles
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyer profiles are viewable by everyone"
ON lawyer_profiles FOR SELECT
USING (true);

CREATE POLICY "Lawyers can update own profile"
ON lawyer_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 4.3 Questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public questions are viewable by everyone"
ON questions FOR SELECT
USING (is_public = true OR asker_user_id = auth.uid());

CREATE POLICY "Users can create questions"
ON questions FOR INSERT
WITH CHECK (asker_user_id = auth.uid());

CREATE POLICY "Users can update own questions"
ON questions FOR UPDATE
USING (asker_user_id = auth.uid());

-- 4.4 Answers
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answers are viewable by everyone"
ON answers FOR SELECT
USING (true);

CREATE POLICY "Lawyers can create answers"
ON answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lawyer_profiles
    WHERE user_id = auth.uid()
    AND verification_status = 'approved'
  )
);

-- 4.5 Point Wallets
ALTER TABLE point_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view own wallet"
ON point_wallets FOR SELECT
USING (lawyer_user_id = auth.uid());

-- 4.6 Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (recipient_user_id = auth.uid());

-- ============================================================
-- 5. 트리거 (자동 타임스탬프 업데이트)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_profiles_updated_at
BEFORE UPDATE ON lawyer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_point_wallets_updated_at
BEFORE UPDATE ON point_wallets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 초기 데이터 (테스트용)
-- ============================================================

-- 관리자 계정은 Supabase Auth에서 수동으로 생성 후
-- 다음 쿼리로 role을 'admin'으로 변경:
-- UPDATE profiles SET role = 'admin' WHERE user_id = '<admin-user-id>';

COMMENT ON TABLE profiles IS '사용자 프로필 (Auth 유저 확장)';
COMMENT ON TABLE lawyer_profiles IS '변호사 전용 프로필';
COMMENT ON TABLE verification_requests IS '변호사 자격 인증 요청 이력';
COMMENT ON TABLE questions IS 'AI 상담 질문';
COMMENT ON TABLE question_messages IS 'AI 대화 메시지 로그';
COMMENT ON TABLE answers IS '변호사 답변';
COMMENT ON TABLE point_wallets IS '변호사 포인트 지갑';
COMMENT ON TABLE point_transactions IS '포인트 거래 내역';
COMMENT ON TABLE notifications IS '시스템 알림';

