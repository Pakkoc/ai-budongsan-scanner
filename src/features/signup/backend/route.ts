/**
 * 회원가입 라우트
 * 참조: docs/usecases/01-general-signup/spec.md, docs/usecases/02-lawyer-signup/spec.md
 */

import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { zValidator } from '@hono/zod-validator';
import {
  SignUpRequestSchema,
  CheckBarNumberRequestSchema,
  type SignUpResponse,
  type CheckBarNumberResponse,
} from './schema';
import { executeSignUp, checkBarNumberAvailability } from './service';
import { respond, success, failure } from '@/backend/http/response';
import { AppError } from '@/backend/errors/codes';

export function registerSignUpRoutes(app: Hono<AppEnv>) {
  // 회원가입 (일반/변호사 통합)
  app.post(
    '/api/auth/sign-up',
    zValidator('json', SignUpRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const request = c.req.valid('json');

      try {
        const result = await executeSignUp({ supabase }, request);

        logger.info('User signed up successfully', {
          userId: result.userId,
          type: request.type,
        });

        return respond<SignUpResponse, string>(c, success(result, 201));
      } catch (error) {
        logger.error('Sign up failed', { error, request: { ...request, password: '[REDACTED]' } });

        if (error instanceof AppError) {
          return respond(
            c,
            failure(error.statusCode, error.code, error.message, error.details)
          );
        }

        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '회원가입 처리 중 오류가 발생했습니다')
        );
      }
    }
  );

  // 변호사 등록번호 중복 확인
  app.get(
    '/api/auth/bar-number/check',
    zValidator('query', CheckBarNumberRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const { barNumber } = c.req.valid('query');

      try {
        const result = await checkBarNumberAvailability({ supabase }, barNumber);

        return respond<CheckBarNumberResponse, string>(c, success(result, 200));
      } catch (error) {
        return respond(
          c,
          failure(500, 'INTERNAL_SERVER_ERROR', '등록번호 확인 중 오류가 발생했습니다')
        );
      }
    }
  );
}

