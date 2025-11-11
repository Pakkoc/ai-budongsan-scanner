export type PointWalletSnapshot = {
  lawyerUserId: string;
  balance: number;
};

export type PointTransactionType =
  | "charge"
  | "answer_deduction"
  | "answer_refund";

export type PointTransactionDraft = {
  lawyerUserId: string;
  amount: number;
  type: PointTransactionType;
  balanceAfter: number;
  relatedQuestionId?: string;
  relatedAnswerId?: string;
  externalPaymentId?: string;
};

export type PointMutationFailureReason =
  | "INSUFFICIENT_BALANCE"
  | "INVALID_AMOUNT";

export type PointMutationSuccess = {
  ok: true;
  wallet: PointWalletSnapshot;
  transaction: PointTransactionDraft;
};

export type PointMutationFailure = {
  ok: false;
  reason: PointMutationFailureReason;
};

export type PointMutationResult = PointMutationSuccess | PointMutationFailure;
