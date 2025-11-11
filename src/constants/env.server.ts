import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  TOSS_SECRET_KEY: z.string().min(1),
  TOSS_CLIENT_KEY: z.string().min(1),
});

const parseServerEnv = () => {
  const result = serverEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
    TOSS_CLIENT_KEY: process.env.TOSS_CLIENT_KEY,
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment variables: ${messages}`);
  }

  return result.data;
};

export const serverEnv = parseServerEnv();

export type ServerEnv = typeof serverEnv;
