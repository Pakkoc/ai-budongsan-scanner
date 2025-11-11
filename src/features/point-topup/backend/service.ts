/**
 * 포인트 충전 서비스
 * 참조: docs/usecases/06-lawyer-point-topup/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateTopupSessionRequest,
  CreateTopupSessionResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
} from './schema';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';
import { createTossPaymentSession, confirmTossPayment } from '@/infrastructure/payment/toss.service';
import { applyCharge } from '@/domain/services/points-service';

type TopupServiceDeps = {
  supabase: SupabaseClient;
  userId: string;
  tossClientKey: string;
  tossSecretKey: string;
};

/**
 * 충전 세션 생성
 */
export async function createTopupSession(
  deps: TopupServiceDeps,
  request: CreateTopupSessionRequest
): Promise<CreateTopupSessionResponse> {
  const { supabase, userId, tossClientKey } = deps;

  // 변호사 프로필 확인
  const { data: lawyer, error } = await supabase
    .from('lawyer_profiles')
    .select('lawyer_profile_id, full_name')
    .eq('user_id', userId)
    .single();

  if (error || !lawyer) {
    throw createAppError(ERROR_CODES.AUTH_LAWYER_NOT_APPROVED, 403);
  }

  // 주문 ID 생성
  const orderId = `ORDER-${Date.now()}-${userId.slice(0, 8)}`;

  // Toss Payments 세션 생성
  const { checkoutUrl } = await createTossPaymentSession(tossClientKey, {
    orderId,
    amount: request.amount,
    orderName: `포인트 충전 ${request.amount.toLocaleString()}원`,
    customerName: lawyer.full_name,
  });

  // 세션 정보 저장 (임시 테이블 또는 Redis)
  // TODO: 실제로는 payment_sessions 테이블에 저장

  return {
    sessionId: orderId,
    checkoutUrl,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30분
  };
}

/**
 * 결제 확인 및 포인트 충전
 */
export async function confirmPayment(
  deps: TopupServiceDeps,
  request: ConfirmPaymentRequest
): Promise<ConfirmPaymentResponse> {
  const { supabase, userId, tossSecretKey } = deps;

  // Toss Payments 결제 승인
  const { transactionId } = await confirmTossPayment(tossSecretKey, {
    paymentKey: request.paymentKey,
    orderId: request.orderId,
    amount: request.amount,
  });

  // 중복 처리 방지 (idempotency)
  const { data: existing } = await supabase
    .from('point_transactions')
    .select('transaction_id')
    .eq('external_transaction_id', transactionId)
    .single();

  if (existing) {
    throw createAppError(ERROR_CODES.PAYMENT_ALREADY_PROCESSED, 409);
  }

  // 포인트 충전
  const result = await applyCharge(
    { supabase },
    {
      userId,
      amount: request.amount,
      externalTransactionId: transactionId,
    }
  );

  return {
    transactionId: result.transactionId,
    newBalance: result.newBalance,
    redirectTo: '/my-page',
  };
}

