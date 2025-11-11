/**
 * 회원가입 서비스
 * 참조: docs/usecases/01-general-signup/spec.md, docs/usecases/02-lawyer-signup/spec.md
 * TDD: Red → Green → Refactor
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SignUpRequest, SignUpResponse } from './schema';
import { APP_CONFIG } from '@/constants/app-config';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';

type SignUpServiceDeps = {
  supabase: SupabaseClient;
};

/**
 * 회원가입 처리 (일반/변호사 통합)
 */
export async function executeSignUp(
  deps: SignUpServiceDeps,
  request: SignUpRequest
): Promise<SignUpResponse> {
  const { supabase } = deps;

  // 1. Supabase Auth로 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: request.email,
    password: request.password,
    email_confirm: true, // 이메일 인증 자동 완료 (MVP)
  });

  if (authError || !authData.user) {
    // 이메일 중복 에러
    if (authError?.message?.includes('already registered')) {
      throw createAppError(ERROR_CODES.AUTH_EMAIL_TAKEN, 409);
    }
    throw createAppError(ERROR_CODES.INTERNAL_SERVER_ERROR, 500, authError);
  }

  const userId = authData.user.id;

  try {
    // 2. profiles 테이블에 기본 정보 저장
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      role: request.type === 'lawyer' ? 'lawyer' : 'user',
      nickname: request.nickname,
    });

    if (profileError) {
      // 닉네임 중복
      if (profileError.code === '23505') {
        throw createAppError(ERROR_CODES.VALIDATION_ERROR, 409, {
          field: 'nickname',
          message: '이미 사용 중인 닉네임입니다',
        });
      }
      throw profileError;
    }

    // 3. user_consents 테이블에 약관 동의 기록
    const { error: consentError } = await supabase.from('user_consents').insert({
      user_id: userId,
      terms_version: APP_CONFIG.CONSENT_VERSIONS.TERMS,
      privacy_version: APP_CONFIG.CONSENT_VERSIONS.PRIVACY,
    });

    if (consentError) {
      throw consentError;
    }

    // 4. 변호사 회원인 경우 추가 처리
    if (request.type === 'lawyer') {
      // 변호사 등록번호 중복 확인
      const { data: existingLawyer } = await supabase
        .from('lawyer_profiles')
        .select('user_id')
        .eq('bar_registration_number', request.barRegistrationNumber)
        .single();

      if (existingLawyer) {
        throw createAppError(ERROR_CODES.LAWYER_BAR_NUMBER_TAKEN, 409);
      }

      // lawyer_profiles 생성
      const { error: lawyerError } = await supabase
        .from('lawyer_profiles')
        .insert({
          user_id: userId,
          full_name: request.fullName,
          bar_registration_number: request.barRegistrationNumber,
          verification_status: 'pending',
        });

      if (lawyerError) {
        throw lawyerError;
      }

      // point_wallets 초기화
      const { error: walletError } = await supabase
        .from('point_wallets')
        .insert({
          lawyer_user_id: userId,
          balance: 0,
        });

      if (walletError) {
        throw walletError;
      }

      return {
        userId,
        redirectTo: '/my-page',
        message: '변호사 회원가입이 완료되었습니다. 자격 서류를 업로드해주세요.',
      };
    }

    // 일반 회원
    return {
      userId,
      redirectTo: '/ai-qna',
      message: '회원가입이 완료되었습니다.',
    };
  } catch (error) {
    // 실패 시 Auth 사용자 삭제 시도
    await supabase.auth.admin.deleteUser(userId).catch(() => {
      // 삭제 실패 시 로그만 남기고 계속 진행
      console.error('Failed to cleanup auth user:', userId);
    });

    throw error;
  }
}

/**
 * 변호사 등록번호 중복 확인
 */
export async function checkBarNumberAvailability(
  deps: SignUpServiceDeps,
  barNumber: string
): Promise<{ available: boolean; message?: string }> {
  const { supabase } = deps;

  // 형식 검증
  if (!APP_CONFIG.BAR_NUMBER_PATTERN.test(barNumber)) {
    return {
      available: false,
      message: '올바르지 않은 변호사 등록번호 형식입니다',
    };
  }

  // 중복 확인
  const { data } = await supabase
    .from('lawyer_profiles')
    .select('user_id')
    .eq('bar_registration_number', barNumber)
    .single();

  if (data) {
    return {
      available: false,
      message: '이미 등록된 변호사 등록번호입니다',
    };
  }

  return {
    available: true,
  };
}

