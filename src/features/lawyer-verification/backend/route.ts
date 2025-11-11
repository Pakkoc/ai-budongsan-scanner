/**
 * 변호사 인증 라우트
 * 참조: docs/usecases/03-lawyer-verification-upload/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import {
  UploadVerificationDocRequestSchema,
  SubmitVerificationRequestSchema,
  type UploadVerificationDocResponse,
  type SubmitVerificationResponse,
} from './schema';
import { createUploadUrl, submitVerificationRequest } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerLawyerVerificationRoutes(app: Hono<AppEnv>) {
  // 서류 업로드 URL 생성
  app.post(
    '/api/lawyer/verification/upload-url',
    zValidator('json', UploadVerificationDocRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
      const userId = 'temp-user-id';

      try {
        const result = await createUploadUrl({ supabase, userId }, request);

        logger.info('Upload URL created', { documentId: result.documentId });

        return respond<UploadVerificationDocResponse, string>(c, success(result, 200));
      } catch (error) {
        logger.error('Create upload URL failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '업로드 URL 생성 중 오류가 발생했습니다')
        );
      }
    }
  );

  // 인증 요청 제출
  app.post(
    '/api/lawyer/verification/submit',
    zValidator('json', SubmitVerificationRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      // TODO: 실제 userId는 인증 미들웨어에서 가져와야 함
      const userId = 'temp-user-id';

      try {
        const result = await submitVerificationRequest({ supabase, userId }, request);

        logger.info('Verification request submitted', { requestId: result.requestId });

        return respond<SubmitVerificationResponse, string>(c, success(result, 201));
      } catch (error) {
        logger.error('Submit verification request failed', { error });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '인증 요청 제출 중 오류가 발생했습니다')
        );
      }
    }
  );
}

