-- Migration: core schema for AI 부동산 스캐너 MVP
do $$ begin
  create extension if not exists "pgcrypto";
end $$;

-- Clean up starter artefacts not used by the product scope
DROP TABLE IF EXISTS public.example CASCADE;

-- Enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'lawyer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_status AS ENUM ('awaiting_answer', 'adopted', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE answer_status AS ENUM ('submitted', 'adopted', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE point_tx_type AS ENUM ('charge', 'answer_deduction', 'answer_refund');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('LAWYER_VERIFICATION_UPDATED', 'NEW_ANSWER', 'ANSWER_ADOPTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Core tables
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role user_role NOT NULL,
  nickname TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_consents_unique_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.lawyer_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bar_registration_number TEXT NOT NULL UNIQUE,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verification_changed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.verification_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_user_id UUID NOT NULL REFERENCES public.lawyer_profiles (user_id) ON DELETE CASCADE,
  status verification_status NOT NULL DEFAULT 'in_review',
  document_path TEXT NOT NULL,
  file_ext TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);

CREATE TABLE IF NOT EXISTS public.questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asker_user_id UUID NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL,
  status question_status NOT NULL DEFAULT 'awaiting_answer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.question_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions (question_id) ON DELETE CASCADE,
  sender message_role NOT NULL,
  content TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_messages_unique_position UNIQUE (question_id, position)
);

CREATE TABLE IF NOT EXISTS public.answers (
  answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions (question_id) ON DELETE CASCADE,
  lawyer_user_id UUID NOT NULL REFERENCES public.lawyer_profiles (user_id),
  content TEXT NOT NULL,
  status answer_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  adopted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS answers_unique_adopted_per_question
  ON public.answers (question_id)
  WHERE status = 'adopted';

CREATE TABLE IF NOT EXISTS public.point_wallets (
  lawyer_user_id UUID PRIMARY KEY REFERENCES public.lawyer_profiles (user_id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
  tx_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_user_id UUID NOT NULL REFERENCES public.lawyer_profiles (user_id) ON DELETE CASCADE,
  tx_type point_tx_type NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  related_question_id UUID REFERENCES public.questions (question_id) ON DELETE SET NULL,
  related_answer_id UUID REFERENCES public.answers (answer_id) ON DELETE SET NULL,
  external_payment_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_questions_public_status
  ON public.questions (is_public, created_at)
  WHERE status = 'awaiting_answer';

CREATE INDEX IF NOT EXISTS idx_point_transactions_lawyer_created
  ON public.point_transactions (lawyer_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications (recipient_user_id, is_read);
