import type { VerificationStatus } from "../types/qna";

export type UploadEligibilityReason =
  | "ALREADY_IN_REVIEW"
  | "ALREADY_APPROVED";

export type UploadEligibilityResult =
  | { canUpload: true }
  | { canUpload: false; reason: UploadEligibilityReason };

export const evaluateUploadEligibility = (
  status: VerificationStatus,
): UploadEligibilityResult => {
  if (status === "in_review") {
    return { canUpload: false, reason: "ALREADY_IN_REVIEW" };
  }

  if (status === "approved") {
    return { canUpload: false, reason: "ALREADY_APPROVED" };
  }

  return { canUpload: true };
};

export type AdminDecisionAction = "approve" | "reject";

export type AdminDecisionFailureReason = "NOT_IN_REVIEW";

export type AdminDecisionResult =
  | { ok: true; nextStatus: VerificationStatus }
  | { ok: false; reason: AdminDecisionFailureReason };

export type AdminDecisionInput = {
  currentStatus: VerificationStatus;
  action: AdminDecisionAction;
};

export const evaluateAdminDecision = ({
  currentStatus,
  action,
}: AdminDecisionInput): AdminDecisionResult => {
  if (currentStatus !== "in_review") {
    return { ok: false, reason: "NOT_IN_REVIEW" };
  }

  const nextStatus: VerificationStatus =
    action === "approve" ? "approved" : "rejected";

  return { ok: true, nextStatus };
};
