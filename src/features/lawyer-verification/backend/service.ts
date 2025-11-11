/**
 * 변호사 인증 서비스
 * 참조: docs/usecases/03-lawyer-verification-upload/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UploadVerificationDocRequest,
  UploadVerificationDocResponse,
  SubmitVerificationRequest,
  SubmitVerificationResponse,
} from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';
import { evaluateUploadEligibility } from '@/domain/policies/verification-policy';

type VerificationServiceDeps = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * 서류 업로드 URL 생성
 */
export async function createUploadUrl(
  deps: VerificationServiceDeps,
  request: UploadVerificationDocRequest
): Promise<UploadVerificationDocResponse> {
  const { supabase, userId } = deps;

  // 변호사 프로필 조회
  const { data: lawyer, error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .select('lawyer_profile_id, verification_status')
    .eq('user_id', userId)
    .single();

  if (lawyerError || !lawyer) {
    throw createAppError(ERROR_CODES.AUTH_LAWYER_NOT_APPROVED, 403);
  }

  // 업로드 가능 여부 검증
  const policy = evaluateUploadEligibility({
    currentStatus: lawyer.verification_status as any,
  });

  if (policy.blocked) {
    throw createAppError(
      ERROR_CODES.VERIFICATION_ALREADY_IN_REVIEW,
      403,
      policy.reason
    );
  }

  // 문서 레코드 생성
  const documentId = crypto.randomUUID();
  const filePath = `lawyer-docs/${userId}/${documentId}-${request.fileName}`;

  // Supabase Storage 업로드 URL 생성 (signed URL)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('verification-documents')
    .createSignedUploadUrl(filePath);

  if (urlError || !urlData) {
    throw createAppError(ERROR_CODES.STORAGE_UPLOAD_FAILED, 500, urlError);
  }

  return {
    uploadUrl: urlData.signedUrl,
    documentId,
  };
}

/**
 * 인증 요청 제출
 */
export async function submitVerificationRequest(
  deps: VerificationServiceDeps,
  request: SubmitVerificationRequest
): Promise<SubmitVerificationResponse> {
  const { supabase, userId } = deps;

  // 변호사 프로필 조회
  const { data: lawyer, error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .select('lawyer_profile_id, verification_status')
    .eq('user_id', userId)
    .single();

  if (lawyerError || !lawyer) {
    throw createAppError(ERROR_CODES.AUTH_LAWYER_NOT_APPROVED, 403);
  }

  // 업로드 가능 여부 재검증
  const policy = evaluateUploadEligibility({
    currentStatus: lawyer.verification_status as any,
  });

  if (policy.blocked) {
    throw createAppError(
      ERROR_CODES.VERIFICATION_ALREADY_IN_REVIEW,
      403,
      policy.reason
    );
  }

  // 인증 요청 생성
  const { data: verificationRequest, error: requestError } = await supabase
    .from('verification_requests')
    .insert({
      lawyer_profile_id: lawyer.lawyer_profile_id,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      documents: request.documentIds,
      message: request.message,
    })
    .select('request_id')
    .single();

  if (requestError || !verificationRequest) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, requestError);
  }

  // 변호사 프로필 상태 업데이트
  await supabase
    .from('lawyer_profiles')
    .update({ verification_status: 'in_review' })
    .eq('lawyer_profile_id', lawyer.lawyer_profile_id);

  return {
    requestId: verificationRequest.request_id,
    redirectTo: '/my-page',
  };
}

