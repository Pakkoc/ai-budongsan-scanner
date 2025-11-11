/**
 * 포인트 충전 라우트
 * 참조: docs/usecases/06-lawyer-point-topup/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import {
  CreateTopupSessionRequestSchema,
  ConfirmPaymentRequestSchema,
  type CreateTopupSessionResponse,
  type ConfirmPaymentResponse,
} from './schema';
import { createTopupSession, confirmPayment } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerPointTopupRoutes(app: Hono<AppEnv>) {
  // 충전 세션 생성
  app.post(
    '/api/points/topup/session',
    zValidator('json', CreateTopupSessionRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const config = c.get('config');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
      const userId = 'temp-user-id';

      try {
        const result = await createTopupSession(
          {
            supabase,
            userId,
            tossClientKey: config.TOSS_CLIENT_KEY,
            tossSecretKey: config.TOSS_SECRET_KEY,
          },
          request
        );

        logger.info('Topup session created', { sessionId: result.sessionId });

        return respond<CreateTopupSessionResponse, string>(c, success(result, 201));
      } catch (error) {
        logger.error('Create topup session failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '충전 세션 생성 중 오류가 발생했습니다')
        );
      }
    }
  );

  // 결제 확인
  app.post(
    '/api/points/topup/confirm',
    zValidator('json', ConfirmPaymentRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const config = c.get('config');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
      const userId = 'temp-user-id';

      try {
        const result = await confirmPayment(
          {
            supabase,
            userId,
            tossClientKey: config.TOSS_CLIENT_KEY,
            tossSecretKey: config.TOSS_SECRET_KEY,
          },
          request
        );

        logger.info('Payment confirmed', { transactionId: result.transactionId });

        return respond<ConfirmPaymentResponse, string>(c, success(result, 200));
      } catch (error) {
        logger.error('Confirm payment failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '결제 확인 중 오류가 발생했습니다')
        );
      }
    }
  );
}

