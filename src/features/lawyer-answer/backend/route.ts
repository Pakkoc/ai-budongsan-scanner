/**
 * 변호사 답변 라우트
 * 참조: docs/usecases/07-lawyer-answer-submission/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import {
  SubmitAnswerRequestSchema,
  type SubmitAnswerResponse,
} from './schema';
import { submitAnswer } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerLawyerAnswerRoutes(app: Hono<AppEnv>) {
  // 답변 작성
  app.post(
    '/api/qna/answers',
    zValidator('json', SubmitAnswerRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
      const userId = 'temp-user-id';

      try {
        const result = await submitAnswer({ supabase, userId }, request);

        logger.info('Answer submitted', {
          answerId: result.answerId,
          questionId: request.questionId,
        });

        return respond<SubmitAnswerResponse, string>(c, success(result, 201));
      } catch (error) {
        logger.error('Submit answer failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '답변 작성 중 오류가 발생했습니다')
        );
      }
    }
  );
}

