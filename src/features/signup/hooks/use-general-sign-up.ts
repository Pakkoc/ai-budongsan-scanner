/**
 * 일반 회원가입 훅
 * 참조: docs/pages/01-general-signup/plan.md
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { GeneralSignUpRequest, SignUpResponse } from '../backend/schema';
import { useSignUpContext } from '../context/sign-up-context';

export function useGeneralSignUp() {
  const { dispatch } = useSignUpContext();

  return useMutation({
    mutationFn: async (data: Omit<GeneralSignUpRequest, 'type'>) => {
      const response = await apiClient.post<SignUpResponse>('/api/auth/sign-up', {
        ...data,
        type: 'user' as const,
      });
      return response.data;
    },
    onMutate: () => {
      dispatch({ type: 'SUBMIT_REQUEST', tab: 'user' });
    },
    onSuccess: () => {
      dispatch({ type: 'SUBMIT_SUCCESS', tab: 'user' });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        '회원가입 중 오류가 발생했습니다';
      dispatch({ type: 'SUBMIT_FAILURE', error: message });
    },
  });
}

