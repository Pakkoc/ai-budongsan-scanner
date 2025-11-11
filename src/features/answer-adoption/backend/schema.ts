/**
 * 답변 채택 API 스키마
 * 참조: docs/usecases/09-answer-adoption/spec.md
 */

import { z } from 'zod';

// 답변 채택 요청
export const AdoptAnswerRequestSchema = z.object({
  questionId: z.string().uuid(),
  answerId: z.string().uuid(),
});

export type AdoptAnswerRequest = z.infer<typeof AdoptAnswerRequestSchema>;

// 답변 채택 응답
export const AdoptAnswerResponseSchema = z.object({
  adoptedAnswerId: z.string().uuid(),
  redirectTo: z.string(),
});

export type AdoptAnswerResponse = z.infer<typeof AdoptAnswerResponseSchema>;

