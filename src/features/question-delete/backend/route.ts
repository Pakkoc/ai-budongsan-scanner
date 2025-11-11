/**
 * 질문 삭제 라우트
 * 참조: docs/usecases/08-question-delete-within-1h/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import {
  DeleteQuestionRequestSchema,
  type DeleteQuestionResponse,
} from './schema';
import { deleteQuestion } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerQuestionDeleteRoutes(app: Hono<AppEnv>) {
  // 질문 삭제
  app.delete('/api/qna/questions/:questionId', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const questionId = c.req.param('questionId');

    // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
    const userId = 'temp-user-id';

    try {
      const result = await deleteQuestion({ supabase, userId }, { questionId });

      logger.info('Question deleted', {
        questionId,
        refundedPoints: result.refundedPoints,
      });

      return respond<DeleteQuestionResponse, string>(c, success(result, 200));
    } catch (error) {
      logger.error('Delete question failed', { error });

      if (error instanceof AppError) {
        return respond(
          c,
          failure(error.statusCode, error.code, error.message, error.details)
        );
      }

      return respond(
        c,
        failure(500, 'INTERNAL_SERVER_ERROR', '질문 삭제 중 오류가 발생했습니다')
      );
    }
  });
}

