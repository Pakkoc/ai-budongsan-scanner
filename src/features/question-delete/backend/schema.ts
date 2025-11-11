/**
 * 질문 삭제 API 스키마
 * 참조: docs/usecases/08-question-delete-within-1h/spec.md
 */

import { z } from 'zod';

// 질문 삭제 요청
export const DeleteQuestionRequestSchema = z.object({
  questionId: z.string().uuid(),
});

export type DeleteQuestionRequest = z.infer<typeof DeleteQuestionRequestSchema>;

// 질문 삭제 응답
export const DeleteQuestionResponseSchema = z.object({
  refundedPoints: z.number().int(),
  refundedAnswerCount: z.number().int(),
  redirectTo: z.string(),
});

export type DeleteQuestionResponse = z.infer<typeof DeleteQuestionResponseSchema>;

