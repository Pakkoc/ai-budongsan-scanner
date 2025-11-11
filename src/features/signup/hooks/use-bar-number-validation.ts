/**
 * 변호사 등록번호 검증 훅
 * 참조: docs/pages/02-lawyer-signup/plan.md
 */

'use client';

import { useEffect } from 'react';
import { useDebounce } from 'react-use';
import { apiClient } from '@/lib/remote/api-client';
import { useSignUpContext } from '../context/sign-up-context';
import { APP_CONFIG } from '@/constants/app-config';
import type { CheckBarNumberResponse } from '../backend/schema';

export function useBarNumberValidation(barNumber: string) {
  const { dispatch } = useSignUpContext();

  const [, cancel] = useDebounce(
    async () => {
      if (!barNumber || barNumber.length < 8) {
        return;
      }

      // 형식 검증
      if (!APP_CONFIG.BAR_NUMBER_PATTERN.test(barNumber)) {
        dispatch({
          type: 'BAR_CHECK_FAILURE',
          message: '올바르지 않은 형식입니다 (예: 12-34567)',
        });
        return;
      }

      dispatch({ type: 'REQUEST_BAR_CHECK' });

      try {
        const response = await apiClient.get<CheckBarNumberResponse>(
          `/api/auth/bar-number/check?barNumber=${encodeURIComponent(barNumber)}`
        );

        if (response.data.available) {
          dispatch({
            type: 'BAR_CHECK_SUCCESS',
            message: response.data.message,
          });
        } else {
          dispatch({
            type: 'BAR_CHECK_FAILURE',
            message: response.data.message || '이미 등록된 번호입니다',
          });
        }
      } catch (error) {
        dispatch({
          type: 'BAR_CHECK_FAILURE',
          message: '확인 중 오류가 발생했습니다',
        });
      }
    },
    500,
    [barNumber]
  );

  useEffect(() => {
    return () => cancel();
  }, [cancel]);
}

