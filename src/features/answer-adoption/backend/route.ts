/**
 * 답변 채택 라우트
 * 참조: docs/usecases/09-answer-adoption/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import {
  AdoptAnswerRequestSchema,
  type AdoptAnswerResponse,
} from './schema';
import { adoptAnswer } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerAnswerAdoptionRoutes(app: Hono<AppEnv>) {
  // 답변 채택
  app.post(
    '/api/qna/answers/adopt',
    zValidator('json', AdoptAnswerRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
      const userId = 'temp-user-id';

      try {
        const result = await adoptAnswer({ supabase, userId }, request);

        logger.info('Answer adopted', {
          answerId: result.adoptedAnswerId,
          questionId: request.questionId,
        });

        return respond<AdoptAnswerResponse, string>(c, success(result, 200));
      } catch (error) {
        logger.error('Adopt answer failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '답변 채택 중 오류가 발생했습니다')
        );
      }
    }
  );
}

