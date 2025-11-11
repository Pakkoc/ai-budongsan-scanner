/**
 * 변호사 답변 API 스키마
 * 참조: docs/usecases/07-lawyer-answer-submission/spec.md
 */

import { z } from 'zod';
import { APP_CONFIG } from '@/constants/app-config';

// 답변 작성 요청
export const SubmitAnswerRequestSchema = z.object({
  questionId: z.string().uuid(),
  content: z
    .string()
    .min(APP_CONFIG.MIN_ANSWER_LENGTH, `답변은 최소 ${APP_CONFIG.MIN_ANSWER_LENGTH}자 이상이어야 합니다`)
    .max(APP_CONFIG.MAX_ANSWER_LENGTH, `답변은 최대 ${APP_CONFIG.MAX_ANSWER_LENGTH}자까지 가능합니다`),
});

export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>;

// 답변 작성 응답
export const SubmitAnswerResponseSchema = z.object({
  answerId: z.string().uuid(),
  deductedPoints: z.number().int(),
  remainingBalance: z.number().int(),
  redirectTo: z.string(),
});

export type SubmitAnswerResponse = z.infer<typeof SubmitAnswerResponseSchema>;

