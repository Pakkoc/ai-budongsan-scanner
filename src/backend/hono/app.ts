import { Hono } from "hono";
import { errorBoundary } from "@/backend/middleware/error";
import { withAppContext } from "@/backend/middleware/context";
import { withSupabase } from "@/backend/middleware/supabase";
import { registerExampleRoutes } from "@/features/example/backend/route";
import { registerSignUpRoutes } from "@/features/signup/backend/route";
import { registerAiQnaRoutes } from "@/features/ai-qna/backend/route";
import { registerPointTopupRoutes } from "@/features/point-topup/backend/route";
import { registerLawyerAnswerRoutes } from "@/features/lawyer-answer/backend/route";
import { registerQuestionDeleteRoutes } from "@/features/question-delete/backend/route";
import { registerAnswerAdoptionRoutes } from "@/features/answer-adoption/backend/route";
import { registerLawyerVerificationRoutes } from "@/features/lawyer-verification/backend/route";
import { registerAdminApprovalRoutes } from "@/features/admin-approval/backend/route";
import type { AppEnv } from "@/backend/hono/context";

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === "production") {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use("*", errorBoundary());
  app.use("*", withAppContext());
  app.use("*", withSupabase());

  registerExampleRoutes(app);
  registerSignUpRoutes(app);
  registerAiQnaRoutes(app);
  registerPointTopupRoutes(app);
  registerLawyerAnswerRoutes(app);
  registerQuestionDeleteRoutes(app);
  registerAnswerAdoptionRoutes(app);
  registerLawyerVerificationRoutes(app);
  registerAdminApprovalRoutes(app);

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    );
  });

  if (process.env.NODE_ENV === "production") {
    singletonApp = app;
  }

  return app;
};
