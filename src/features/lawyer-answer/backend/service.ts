/**
 * 변호사 답변 서비스
 * 참조: docs/usecases/07-lawyer-answer-submission/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubmitAnswerRequest, SubmitAnswerResponse } from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';
import { canSubmitAnswer } from '@/domain/policies/qna-policy';
import { deductForAnswer } from '@/domain/services/points-service';
import { APP_CONFIG } from '@/constants/app-config';

type AnswerServiceDeps = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * 답변 작성 및 포인트 차감
 */
export async function submitAnswer(
  deps: AnswerServiceDeps,
  request: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  const { supabase, userId } = deps;

  // 변호사 프로필 조회
  const { data: lawyer, error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .select('lawyer_profile_id, verification_status')
    .eq('user_id', userId)
    .single();

  if (lawyerError || !lawyer) {
    throw createAppError(ERROR_CODES.AUTH_LAWYER_NOT_APPROVED, 403);
  }

  // 질문 조회
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('question_id, status, is_public, asker_user_id')
    .eq('question_id', request.questionId)
    .single();

  if (questionError || !question) {
    throw createAppError(ERROR_CODES.QNA_QUESTION_NOT_FOUND, 404);
  }

  // 포인트 잔액 조회
  const { data: wallet, error: walletError } = await supabase
    .from('point_wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    throw createAppError(ERROR_CODES.PAYMENT_INSUFFICIENT_BALANCE, 400);
  }

  // 답변 제출 가능 여부 검증
  const policy = canSubmitAnswer({
    lawyerVerificationStatus: lawyer.verification_status as any,
    lawyerBalance: wallet.balance,
    questionStatus: question.status as any,
    questionIsPublic: question.is_public,
  });

  if (policy.blocked) {
    throw createAppError(
      ERROR_CODES.QNA_QUESTION_NOT_OPEN,
      403,
      policy.reason
    );
  }

  // 트랜잭션: 답변 저장 + 포인트 차감
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .insert({
      question_id: request.questionId,
      lawyer_profile_id: lawyer.lawyer_profile_id,
      content: request.content,
      status: 'active',
    })
    .select('answer_id')
    .single();

  if (answerError || !answer) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, answerError);
  }

  // 포인트 차감
  const pointResult = await deductForAnswer(
    { supabase },
    {
      userId,
      answerId: answer.answer_id,
      questionId: request.questionId,
    }
  );

  // 질문 상태 업데이트
  await supabase
    .from('questions')
    .update({ status: 'answered' })
    .eq('question_id', request.questionId);

  // 질문자에게 알림 생성
  await supabase.from('notifications').insert({
    user_id: question.asker_user_id,
    type: 'answer_received',
    title: '새로운 답변이 도착했습니다',
    message: '변호사가 회원님의 질문에 답변을 작성했습니다.',
    related_id: answer.answer_id,
  });

  return {
    answerId: answer.answer_id,
    deductedPoints: APP_CONFIG.ANSWER_DEDUCTION_POINTS,
    remainingBalance: pointResult.newBalance,
    redirectTo: `/qna/${request.questionId}`,
  };
}

