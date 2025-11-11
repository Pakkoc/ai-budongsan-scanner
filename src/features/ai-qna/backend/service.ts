/**
 * AI QnA 서비스
 * 참조: docs/usecases/05-ai-question-publication/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SaveQuestionRequest, SaveQuestionResponse } from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';

type AiQnaServiceDeps = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * 질문 저장 (AI 대화 포함)
 */
export async function saveQuestion(
  deps: AiQnaServiceDeps,
  request: SaveQuestionRequest
): Promise<SaveQuestionResponse> {
  const { supabase, userId } = deps;

  // 트랜잭션으로 질문과 메시지 저장
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({
      asker_user_id: userId,
      is_public: request.isPublic,
      status: 'awaiting_answer',
    })
    .select('question_id')
    .single();

  if (questionError || !question) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, questionError);
  }

  const questionId = question.question_id;

  // 메시지 저장
  const messages = request.messages.map((msg) => ({
    question_id: questionId,
    sender: msg.role,
    content: msg.content,
    position: msg.position,
  }));

  const { error: messagesError } = await supabase
    .from('question_messages')
    .insert(messages);

  if (messagesError) {
    // 실패 시 질문 삭제
    await supabase.from('questions').delete().eq('question_id', questionId);
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, messagesError);
  }

  return {
    questionId,
    redirectTo: request.isPublic ? `/qna/${questionId}` : '/my-page',
  };
}

