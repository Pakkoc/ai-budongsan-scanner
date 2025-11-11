/**
 * Toss Payments 서비스
 * 참조: docs/pages/06-lawyer-point-topup/plan.md
 */

import { APP_CONFIG } from '@/constants/app-config';

export type TossPaymentSession = {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
};

export type TossPaymentConfirm = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

/**
 * Toss Payments 세션 생성
 * 참조: https://docs.tosspayments.com/reference/widget-sdk
 */
export async function createTossPaymentSession(
  clientKey: string,
  session: TossPaymentSession
): Promise<{ checkoutUrl: string }> {
  // Toss Payments는 클라이언트 SDK를 통해 결제창을 띄우는 방식
  // 서버에서는 결제 정보를 반환하고, 클라이언트에서 SDK로 처리
  // 여기서는 결제 정보를 담은 URL을 생성하여 반환
  
  // 실제로는 프론트엔드에서 @tosspayments/payment-widget-sdk를 사용하여
  // 결제창을 띄우는 것이 권장됨
  // 백엔드에서는 결제 승인(confirm)만 처리
  
  const checkoutUrl = `${APP_CONFIG.TOSS_PAYMENT_SUCCESS_URL}?` +
    `orderId=${session.orderId}&` +
    `amount=${session.amount}&` +
    `orderName=${encodeURIComponent(session.orderName)}`;

  return { checkoutUrl };
}

/**
 * Toss Payments 결제 승인
 */
export async function confirmTossPayment(
  secretKey: string,
  confirm: TossPaymentConfirm
): Promise<{ success: boolean; transactionId: string }> {
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(confirm),
  });

  if (!response.ok) {
    throw new Error('Toss payment confirmation failed');
  }

  const data = await response.json();
  return {
    success: true,
    transactionId: data.transactionId,
  };
}

/**
 * Toss Payments 웹훅 검증
 */
export function verifyTossWebhook(
  secretKey: string,
  signature: string,
  body: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
}

