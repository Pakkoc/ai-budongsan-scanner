/**
 * 회원가입 API 스키마
 * 참조: docs/usecases/01-general-signup/spec.md, docs/usecases/02-lawyer-signup/spec.md
 */

import { z } from 'zod';
import { APP_CONFIG } from '@/constants/app-config';

// 공통 필드
const baseSignUpFields = {
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 최대 20자까지 가능합니다'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '서비스 이용약관에 동의해주세요',
  }),
  agreePrivacy: z.boolean().refine((val) => val === true, {
    message: '개인정보 처리방침에 동의해주세요',
  }),
};

// 일반 회원 가입
export const GeneralSignUpRequestSchema = z.object({
  ...baseSignUpFields,
  type: z.literal('user'),
});

// 변호사 회원 가입
export const LawyerSignUpRequestSchema = z.object({
  ...baseSignUpFields,
  type: z.literal('lawyer'),
  fullName: z.string().min(2, '성명은 최소 2자 이상이어야 합니다').max(50),
  barRegistrationNumber: z
    .string()
    .regex(
      APP_CONFIG.BAR_NUMBER_PATTERN,
      '올바른 변호사 등록번호 형식이 아닙니다 (예: 12-34567)'
    ),
});

// 통합 스키마
export const SignUpRequestSchema = z.discriminatedUnion('type', [
  GeneralSignUpRequestSchema,
  LawyerSignUpRequestSchema,
]);

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type GeneralSignUpRequest = z.infer<typeof GeneralSignUpRequestSchema>;
export type LawyerSignUpRequest = z.infer<typeof LawyerSignUpRequestSchema>;

// 응답 스키마
export const SignUpResponseSchema = z.object({
  userId: z.string().uuid(),
  redirectTo: z.string(),
  message: z.string().optional(),
});

export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;

// 변호사 등록번호 중복 확인
export const CheckBarNumberRequestSchema = z.object({
  barNumber: z.string(),
});

export const CheckBarNumberResponseSchema = z.object({
  available: z.boolean(),
  message: z.string().optional(),
});

export type CheckBarNumberRequest = z.infer<
  typeof CheckBarNumberRequestSchema
>;
export type CheckBarNumberResponse = z.infer<
  typeof CheckBarNumberResponseSchema
>;

