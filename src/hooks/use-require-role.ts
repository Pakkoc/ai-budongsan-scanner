/**
 * 역할 기반 접근 제어 훅
 * 참조: docs/common-modules.md
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { QUERY_KEYS } from '@/lib/query/keys';

type UserRole = 'user' | 'lawyer' | 'admin';

type CurrentUser = {
  userId: string;
  email: string;
  role: UserRole;
  nickname: string;
};

/**
 * 현재 사용자 정보 조회
 */
export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: QUERY_KEYS.currentUser(),
    queryFn: async () => {
      const response = await apiClient.get<CurrentUser>('/api/auth/me');
      return response.data;
    },
    retry: false,
  });
}

/**
 * 역할 기반 접근 제어
 */
export function useRequireRole(allowedRoles: UserRole[], redirectTo: string = '/login') {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;

    if (error || !user) {
      router.replace(redirectTo);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, isLoading, error, allowedRoles, redirectTo, router]);

  return { user, isLoading };
}

/**
 * 변호사 전용 훅
 */
export function useRequireLawyer(redirectTo: string = '/login') {
  return useRequireRole(['lawyer'], redirectTo);
}

/**
 * 관리자 전용 훅
 */
export function useRequireAdmin(redirectTo: string = '/login') {
  return useRequireRole(['admin'], redirectTo);
}

/**
 * 인증 필수 훅
 */
export function useRequireAuth(redirectTo: string = '/login') {
  return useRequireRole(['user', 'lawyer', 'admin'], redirectTo);
}

