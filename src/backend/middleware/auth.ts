/**
 * 인증 미들웨어
 * 참조: docs/common-modules.md
 */

import type { Context, Next } from 'hono';
import { contextKeys, type AppEnv } from '@/backend/hono/context';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';

const BEARER_PREFIX = 'Bearer ';

const extractBearerToken = (headerValue?: string | null) => {
  if (!headerValue) {
    return null;
  }

  if (!headerValue.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = headerValue.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
};

/**
 * 인증 필수 미들웨어
 */
export function requireAuth() {
  return async (c: Context<AppEnv>, next: Next) => {
    const supabase = c.get(contextKeys.supabase);
    const authHeader = c.req.header('Authorization');
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      const appError = createAppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        401
      );
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      const appError = createAppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        401
      );
    }

    // Context에 userId 저장
    c.set(contextKeys.userId, user.id);

    await next();
  };
}

/**
 * 역할 기반 접근 제어 미들웨어
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const supabase = c.get(contextKeys.supabase);
    const userId = c.get(contextKeys.userId);

    if (!userId) {
      const appError = createAppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        401
      );
    }

    // 프로필에서 역할 조회
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      const appError = createAppError(ERROR_CODES.AUTH_USER_NOT_FOUND, 404);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        404
      );
    }

    if (!allowedRoles.includes(profile.role)) {
      const appError = createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        403
      );
    }

    await next();
  };
}

/**
 * 변호사 승인 상태 확인 미들웨어
 */
export function requireApprovedLawyer() {
  return async (c: Context<AppEnv>, next: Next) => {
    const supabase = c.get(contextKeys.supabase);
    const userId = c.get(contextKeys.userId);

    if (!userId) {
      const appError = createAppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        401
      );
    }

    // 변호사 프로필 조회
    const { data: lawyer, error } = await supabase
      .from('lawyer_profiles')
      .select('verification_status')
      .eq('user_id', userId)
      .single();

    if (error || !lawyer) {
      const appError = createAppError(ERROR_CODES.AUTH_LAWYER_NOT_APPROVED, 403);
      return c.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        403
      );
    }

    if (lawyer.verification_status !== 'approved') {
      const appError = createAppError(ERROR_CODES.AUTH_LAWYER_NOT_APPROVED, 403);
      return c.json(
        {
          error: {
            code: appError.code,
            message: '변호사 인증이 승인되지 않았습니다',
          },
        },
        403
      );
    }

    await next();
  };
}

