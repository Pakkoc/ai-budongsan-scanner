/**
 * 질문 삭제 서비스
 * 참조: docs/usecases/08-question-delete-within-1h/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeleteQuestionRequest, DeleteQuestionResponse } from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';
import { evaluateQuestionDeletion } from '@/domain/policies/qna-policy';
import { refundForAnswerDeletion } from '@/domain/services/points-service';

type DeleteServiceDeps = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * 질문 삭제 및 포인트 환불
 */
export async function deleteQuestion(
  deps: DeleteServiceDeps,
  request: DeleteQuestionRequest
): Promise<DeleteQuestionResponse> {
  const { supabase, userId } = deps;

  // 질문 조회
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('question_id, asker_user_id, created_at')
    .eq('question_id', request.questionId)
    .is('deleted_at', null)
    .single();

  if (questionError || !question) {
    throw createAppError(ERROR_CODES.QNA_QUESTION_NOT_FOUND, 404);
  }

  // 소유권 확인
  if (question.asker_user_id !== userId) {
    throw createAppError(ERROR_CODES.QNA_NOT_OWNER, 403);
  }

  // 답변 조회 (환불 대상)
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('answer_id, lawyer_profile_id, status')
    .eq('question_id', request.questionId)
    .eq('status', 'active');

  if (answersError) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, answersError);
  }

  // 삭제 가능 여부 검증
  const policy = evaluateQuestionDeletion({
    questionCreatedAt: new Date(question.created_at),
    refundableAnswers: (answers || []).map((a) => ({
      answerId: a.answer_id,
      lawyerId: a.lawyer_profile_id,
    })),
  });

  if (policy.blocked) {
    throw createAppError(
      ERROR_CODES.QNA_WINDOW_EXPIRED,
      403,
      policy.reason
    );
  }

  // 트랜잭션: 질문 소프트 삭제 + 답변 환불
  const now = new Date().toISOString();

  // 질문 소프트 삭제
  await supabase
    .from('questions')
    .update({ deleted_at: now })
    .eq('question_id', request.questionId);

  // 답변 소프트 삭제
  if (answers && answers.length > 0) {
    await supabase
      .from('answers')
      .update({ deleted_at: now })
      .in(
        'answer_id',
        answers.map((a) => a.answer_id)
      );
  }

  // 포인트 환불
  let totalRefunded = 0;
  for (const answer of answers || []) {
    const { data: lawyerProfile } = await supabase
      .from('lawyer_profiles')
      .select('user_id')
      .eq('lawyer_profile_id', answer.lawyer_profile_id)
      .single();

    if (lawyerProfile) {
      const refundResult = await refundForAnswerDeletion(
        { supabase },
        {
          userId: lawyerProfile.user_id,
          answerId: answer.answer_id,
          questionId: request.questionId,
        }
      );
      totalRefunded += refundResult.refundedAmount;
    }
  }

  return {
    refundedPoints: totalRefunded,
    refundedAnswerCount: answers?.length || 0,
    redirectTo: '/my-page',
  };
}

