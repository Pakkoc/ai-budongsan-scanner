/**
 * 회원가입 Context Provider
 * 참조: docs/pages/01-general-signup/plan.md, docs/pages/02-lawyer-signup/plan.md
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signUpReducer,
  initialState,
  type SignUpState,
  type SignUpAction,
  type SignUpTab,
} from './sign-up-reducer';
import { APP_CONFIG } from '@/constants/app-config';

type SignUpContextValue = {
  state: SignUpState;
  dispatch: React.Dispatch<SignUpAction>;
  setActiveTab: (tab: SignUpTab) => void;
  updateField: (tab: SignUpTab, field: string, value: unknown) => void;
  markTouched: (tab: SignUpTab, field: string) => void;
  dismissError: () => void;
  dismissHint: () => void;
};

const SignUpContext = createContext<SignUpContextValue | null>(null);

export function SignUpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(signUpReducer, initialState);

  // URL 쿼리에서 탭 초기화
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'lawyer') {
      dispatch({ type: 'SWITCH_TAB', tab: 'lawyer' });
    }
  }, [searchParams]);

  // 약관 버전 로드
  useEffect(() => {
    dispatch({
      type: 'CONSENT_LOADED',
      terms: APP_CONFIG.CONSENT_VERSIONS.TERMS,
      privacy: APP_CONFIG.CONSENT_VERSIONS.PRIVACY,
    });
  }, []);

  // 리다이렉션 카운트다운
  useEffect(() => {
    if (state.redirectCountdown > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TICK_REDIRECT' });
      }, 1000);

      return () => clearTimeout(timer);
    } else if (
      state.redirectCountdown === 0 &&
      (state.submitStatus.user === 'success' || state.submitStatus.lawyer === 'success')
    ) {
      const redirectTo =
        state.submitStatus.user === 'success' ? '/ai-qna' : '/my-page';
      router.replace(redirectTo);
    }
  }, [state.redirectCountdown, state.submitStatus, router]);

  const contextValue = useMemo<SignUpContextValue>(
    () => ({
      state,
      dispatch,
      setActiveTab: (tab: SignUpTab) => dispatch({ type: 'SWITCH_TAB', tab }),
      updateField: (tab: SignUpTab, field: string, value: unknown) =>
        dispatch({ type: 'CHANGE_FIELD', tab, field, value }),
      markTouched: (tab: SignUpTab, field: string) =>
        dispatch({ type: 'MARK_TOUCHED', tab, field }),
      dismissError: () => dispatch({ type: 'CLEAR_ERROR' }),
      dismissHint: () => dispatch({ type: 'DISMISS_HINT' }),
    }),
    [state]
  );

  return (
    <SignUpContext.Provider value={contextValue}>
      {children}
    </SignUpContext.Provider>
  );
}

export function useSignUpContext() {
  const context = useContext(SignUpContext);
  if (!context) {
    throw new Error('useSignUpContext must be used within SignUpProvider');
  }
  return context;
}

