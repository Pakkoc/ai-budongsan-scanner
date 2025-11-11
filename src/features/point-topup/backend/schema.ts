/**
 * 포인트 충전 API 스키마
 * 참조: docs/usecases/06-lawyer-point-topup/spec.md
 */

import { z } from 'zod';
import { APP_CONFIG } from '@/constants/app-config';

// 충전 세션 생성 요청
export const CreateTopupSessionRequestSchema = z.object({
  amount: z
    .number()
    .int()
    .min(APP_CONFIG.MIN_TOPUP_AMOUNT, '최소 충전 금액은 10,000원입니다')
    .max(APP_CONFIG.MAX_TOPUP_AMOUNT, '최대 충전 금액은 1,000,000원입니다'),
});

export type CreateTopupSessionRequest = z.infer<typeof CreateTopupSessionRequestSchema>;

// 충전 세션 응답
export const CreateTopupSessionResponseSchema = z.object({
  sessionId: string,
  checkoutUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

export type CreateTopupSessionResponse = z.infer<typeof CreateTopupSessionResponseSchema>;

// 결제 확인 요청
export const ConfirmPaymentRequestSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number().int().positive(),
});

export type ConfirmPaymentRequest = z.infer<typeof ConfirmPaymentRequestSchema>;

// 결제 확인 응답
export const ConfirmPaymentResponseSchema = z.object({
  transactionId: z.string().uuid(),
  newBalance: z.number().int(),
  redirectTo: z.string(),
});

export type ConfirmPaymentResponse = z.infer<typeof ConfirmPaymentResponseSchema>;

