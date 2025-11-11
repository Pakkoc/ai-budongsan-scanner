"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export type AuthHeaders = {
  Authorization: string;
};

/**
 * Supabase 세션으로부터 Authorization 헤더를 생성한다.
 */
export const resolveAuthHeaders = async (): Promise<AuthHeaders> => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("로그인이 필요합니다. 다시 로그인 후 이용해주세요.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};
