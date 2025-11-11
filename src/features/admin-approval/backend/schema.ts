/**
 * 관리자 승인 API 스키마
 * 참조: docs/usecases/04-admin-lawyer-approval/spec.md
 */

import { z } from 'zod';

// 인증 요청 목록 조회 응답
export const VerificationRequestListSchema = z.object({
  requests: z.array(
    z.object({
      requestId: z.string().uuid(),
      lawyerProfileId: z.string().uuid(),
      lawyerName: z.string(),
      barNumber: z.string(),
      status: z.enum(['pending', 'approved', 'rejected']),
      submittedAt: z.string().datetime(),
      documents: z.array(z.string()),
    })
  ),
  total: z.number().int(),
});

export type VerificationRequestList = z.infer<typeof VerificationRequestListSchema>;

// 승인/반려 요청
export const ProcessVerificationRequestSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  adminComment: z.string().optional(),
});

export type ProcessVerificationRequest = z.infer<typeof ProcessVerificationRequestSchema>;

// 승인/반려 응답
export const ProcessVerificationResponseSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  redirectTo: z.string(),
});

export type ProcessVerificationResponse = z.infer<typeof ProcessVerificationResponseSchema>;

