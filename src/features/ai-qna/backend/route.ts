/**
 * AI QnA 라우트
 * 참조: docs/usecases/05-ai-question-publication/spec.md
 */

import type { Hono } from 'hono';
import { getUserId, type AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import { stream } from 'hono/streaming';
import {
  GeminiStreamRequestSchema,
  SaveQuestionRequestSchema,
  type SaveQuestionResponse,
} from './schema';
import { saveQuestion } from './service';
import { streamGeminiResponse } from '@/infrastructure/ai/gemini.service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError, ERROR_CODES } from '@/backend/errors/codes';
import { requireAuth } from '@/backend/middleware/auth';

export function registerAiQnaRoutes(app: Hono<AppEnv>) {
  // Gemini AI 스트리밍
  app.post(
    '/api/ai/qna/stream',
    requireAuth(),
    zValidator('json', GeminiStreamRequestSchema),
    async (c) => {
      const config = c.get('config');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      try {
        const messages = request.messages.map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('model' as const),
          parts: msg.content,
        }));

        return stream(c, async (stream) => {
          for await (const chunk of streamGeminiResponse({
            apiKey: config.gemini.apiKey,
            messages,
            includeDisclaimer: true,
          })) {
            await stream.write(chunk);
          }
        });
      } catch (error) {
        logger.error('Gemini stream failed', { error });
        return c.json(
          { error: { code: 'AI_ERROR', message: 'AI 응답 생성에 실패했습니다' } },
          500
        );
      }
    }
  );

  // 질문 저장
  app.post(
    '/api/qna/questions',
    requireAuth(),
    zValidator('json', SaveQuestionRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      const userId = getUserId(c);

      if (!userId) {
        return respond(
          c,
          failure(401, ERROR_CODES.AUTH_UNAUTHORIZED, '로그인이 필요합니다.')
        );
      }

      try {
        const result = await saveQuestion({ supabase, userId }, request);

        logger.info('Question saved', { questionId: result.questionId });

        return respond<SaveQuestionResponse, string>(c, success(result, 201));
      } catch (error) {
        logger.error('Save question failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '질문 저장 중 오류가 발생했습니다')
        );
      }
    }
  );
}

