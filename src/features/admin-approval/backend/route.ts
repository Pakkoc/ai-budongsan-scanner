/**
 * 관리자 승인 라우트
 * 참조: docs/usecases/04-admin-lawyer-approval/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import {
  ProcessVerificationRequestSchema,
  type VerificationRequestList,
  type ProcessVerificationResponse,
} from './schema';
import { listVerificationRequests, processVerificationRequest } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerAdminApprovalRoutes(app: Hono<AppEnv>) {
  // 인증 요청 목록 조회
  app.get('/api/admin/verifications', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    // TODO: 실제 adminUserId는 인증 미들웨어에서 가져와야 함
    const adminUserId = 'temp-admin-id';

    try {
      const result = await listVerificationRequests({ supabase, adminUserId });

      return respond<VerificationRequestList, string>(c, success(result, 200));
    } catch (error) {
      logger.error('List verification requests failed', { error });

      if (error instanceof AppError) {
        return respond(
          c,
          failure(error.statusCode, error.code, error.message, error.details)
        );
      }

      return respond(
        c,
        failure(500, 'INTERNAL_SERVER_ERROR', '목록 조회 중 오류가 발생했습니다')
      );
    }
  });

  // 승인/반려 처리
  app.post(
    '/api/admin/verifications/process',
    zValidator('json', ProcessVerificationRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 adminUserId는 인증 미들웨어에서 가져와야 함
      const adminUserId = 'temp-admin-id';

      try {
        const result = await processVerificationRequest(
          { supabase, adminUserId },
          request
        );

        logger.info('Verification request processed', {
          requestId: result.requestId,
          status: result.status,
        });

        return respond<ProcessVerificationResponse, string>(c, success(result, 200));
      } catch (error) {
        logger.error('Process verification request failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '처리 중 오류가 발생했습니다')
        );
      }
    }
  );
}

