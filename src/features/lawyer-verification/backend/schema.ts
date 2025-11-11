/**
 * 변호사 인증 API 스키마
 * 참조: docs/usecases/03-lawyer-verification-upload/spec.md
 */

import { z } from 'zod';

// 서류 업로드 요청
export const UploadVerificationDocRequestSchema = z.object({
  documentType: z.enum(['license', 'id_card', 'other']),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  contentType: z.string(),
});

export type UploadVerificationDocRequest = z.infer<typeof UploadVerificationDocRequestSchema>;

// 서류 업로드 응답
export const UploadVerificationDocResponseSchema = z.object({
  uploadUrl: z.string().url(),
  documentId: z.string().uuid(),
});

export type UploadVerificationDocResponse = z.infer<typeof UploadVerificationDocResponseSchema>;

// 인증 요청 제출
export const SubmitVerificationRequestSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, '최소 1개 이상의 서류가 필요합니다'),
  message: z.string().optional(),
});

export type SubmitVerificationRequest = z.infer<typeof SubmitVerificationRequestSchema>;

// 인증 요청 제출 응답
export const SubmitVerificationResponseSchema = z.object({
  requestId: z.string().uuid(),
  redirectTo: z.string(),
});

export type SubmitVerificationResponse = z.infer<typeof SubmitVerificationResponseSchema>;

