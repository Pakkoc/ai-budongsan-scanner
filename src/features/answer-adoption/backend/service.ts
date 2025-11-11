/**
 * 답변 채택 서비스
 * 참조: docs/usecases/09-answer-adoption/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdoptAnswerRequest, AdoptAnswerResponse } from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';
import { canAdoptAnswer } from '@/domain/policies/qna-policy';

type AdoptionServiceDeps = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * 답변 채택
 */
export async function adoptAnswer(
  deps: AdoptionServiceDeps,
  request: AdoptAnswerRequest
): Promise<AdoptAnswerResponse> {
  const { supabase, userId } = deps;

  // 질문 조회
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('question_id, asker_user_id, status, adopted_answer_id')
    .eq('question_id', request.questionId)
    .single();

  if (questionError || !question) {
    throw createAppError(ERROR_CODES.QNA_QUESTION_NOT_FOUND, 404);
  }

  // 소유권 확인
  if (question.asker_user_id !== userId) {
    throw createAppError(ERROR_CODES.QNA_NOT_OWNER, 403);
  }

  // 답변 조회
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('answer_id, question_id, status, lawyer_profile_id')
    .eq('answer_id', request.answerId)
    .single();

  if (answerError || !answer) {
    throw createAppError(ERROR_CODES.QNA_ANSWER_NOT_FOUND, 404);
  }

  // 채택 가능 여부 검증
  const policy = canAdoptAnswer({
    questionStatus: question.status as any,
    questionAdoptedAnswerId: question.adopted_answer_id,
    answerStatus: answer.status as any,
    answerQuestionId: answer.question_id,
    requestQuestionId: request.questionId,
  });

  if (policy.blocked) {
    throw createAppError(
      ERROR_CODES.QNA_ALREADY_ADOPTED,
      400,
      policy.reason
    );
  }

  // 답변 채택
  await supabase
    .from('questions')
    .update({ adopted_answer_id: request.answerId })
    .eq('question_id', request.questionId);

  // 변호사에게 알림 생성
  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('user_id')
    .eq('lawyer_profile_id', answer.lawyer_profile_id)
    .single();

  if (lawyerProfile) {
    await supabase.from('notifications').insert({
      user_id: lawyerProfile.user_id,
      type: 'answer_adopted',
      title: '답변이 채택되었습니다',
      message: '회원님의 답변이 채택되었습니다.',
      related_id: request.answerId,
    });
  }

  return {
    adoptedAnswerId: request.answerId,
    redirectTo: `/qna/${request.questionId}`,
  };
}

