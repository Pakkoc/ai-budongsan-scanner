/**
 * 관리자 승인 서비스
 * 참조: docs/usecases/04-admin-lawyer-approval/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  VerificationRequestList,
  ProcessVerificationRequest,
  ProcessVerificationResponse,
} from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';
import { evaluateAdminDecision } from '@/domain/policies/verification-policy';

type AdminServiceDeps = {
  supabase: SupabaseClient;
  adminUserId: string;
};

/**
 * 인증 요청 목록 조회
 */
export async function listVerificationRequests(
  deps: AdminServiceDeps
): Promise<VerificationRequestList> {
  const { supabase } = deps;

  const { data: requests, error } = await supabase
    .from('verification_requests')
    .select(
      `
      request_id,
      lawyer_profile_id,
      status,
      submitted_at,
      documents,
      lawyer_profiles!inner (
        full_name,
        bar_number
      )
    `
    )
    .order('submitted_at', { ascending: false });

  if (error) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, error);
  }

  return {
    requests: (requests || []).map((req: any) => ({
      requestId: req.request_id,
      lawyerProfileId: req.lawyer_profile_id,
      lawyerName: req.lawyer_profiles.full_name,
      barNumber: req.lawyer_profiles.bar_number,
      status: req.status,
      submittedAt: req.submitted_at,
      documents: req.documents || [],
    })),
    total: requests?.length || 0,
  };
}

/**
 * 승인/반려 처리
 */
export async function processVerificationRequest(
  deps: AdminServiceDeps,
  request: ProcessVerificationRequest
): Promise<ProcessVerificationResponse> {
  const { supabase } = deps;

  // 인증 요청 조회
  const { data: verificationRequest, error: requestError } = await supabase
    .from('verification_requests')
    .select('request_id, lawyer_profile_id, status')
    .eq('request_id', request.requestId)
    .single();

  if (requestError || !verificationRequest) {
    throw createAppError(ERROR_CODES.VERIFICATION_NOT_IN_REVIEW, 404);
  }

  // 처리 가능 여부 검증
  const policy = evaluateAdminDecision({
    currentStatus: verificationRequest.status as any,
  });

  if (policy.blocked) {
    throw createAppError(
      ERROR_CODES.VERIFICATION_ALREADY_APPROVED,
      403,
      policy.reason
    );
  }

  const newStatus = request.decision === 'approve' ? 'approved' : 'rejected';
  const verificationStatus = request.decision === 'approve' ? 'approved' : 'rejected';

  // 트랜잭션: 요청 상태 업데이트 + 변호사 프로필 상태 업데이트
  await supabase
    .from('verification_requests')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      admin_comment: request.adminComment,
    })
    .eq('request_id', request.requestId);

  await supabase
    .from('lawyer_profiles')
    .update({ verification_status: verificationStatus })
    .eq('lawyer_profile_id', verificationRequest.lawyer_profile_id);

  // 변호사에게 알림 생성
  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('user_id')
    .eq('lawyer_profile_id', verificationRequest.lawyer_profile_id)
    .single();

  if (lawyerProfile) {
    await supabase.from('notifications').insert({
      user_id: lawyerProfile.user_id,
      type: request.decision === 'approve' ? 'verification_approved' : 'verification_rejected',
      title:
        request.decision === 'approve'
          ? '변호사 인증이 승인되었습니다'
          : '변호사 인증이 반려되었습니다',
      message:
        request.decision === 'approve'
          ? '축하합니다! 변호사 인증이 완료되었습니다.'
          : request.adminComment || '인증 요청이 반려되었습니다.',
      related_id: request.requestId,
    });
  }

  return {
    requestId: request.requestId,
    status: newStatus,
    redirectTo: '/admin/verifications',
  };
}

