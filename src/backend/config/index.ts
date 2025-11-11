import type { AppConfig } from '@/backend/hono/context';
import { serverEnv } from '@/constants/env.server';

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    supabase: {
      url: serverEnv.SUPABASE_URL,
      serviceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    },
    gemini: {
      apiKey: serverEnv.GEMINI_API_KEY,
      defaultModel: 'gemini-2.5-flash',
    },
    toss: {
      secretKey: serverEnv.TOSS_SECRET_KEY,
      clientKey: serverEnv.TOSS_CLIENT_KEY,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
