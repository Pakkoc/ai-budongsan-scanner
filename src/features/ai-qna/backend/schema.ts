/**
 * AI 질문 API 스키마
 * 참조: docs/usecases/05-ai-question-publication/spec.md
 */

import { z } from 'zod';

// Gemini 스트리밍 요청
export const GeminiStreamRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
});

export type GeminiStreamRequest = z.infer<typeof GeminiStreamRequestSchema>;

// 질문 저장 요청
export const SaveQuestionRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'ai']),
      content: z.string().min(1),
      position: z.number().int().min(0),
    })
  ),
  isPublic: z.boolean(),
  disclaimerAcknowledged: z.boolean().refine((val) => val === true, {
    message: 'AI 면책 문구에 동의해야 합니다',
  }),
});

export type SaveQuestionRequest = z.infer<typeof SaveQuestionRequestSchema>;

// 질문 저장 응답
export const SaveQuestionResponseSchema = z.object({
  questionId: z.string().uuid(),
  redirectTo: z.string(),
});

export type SaveQuestionResponse = z.infer<typeof SaveQuestionResponseSchema>;

