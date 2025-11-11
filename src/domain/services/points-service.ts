import type {
  PointMutationResult,
  PointTransactionDraft,
  PointWalletSnapshot,
} from "../types/points";

const isPositiveInteger = (value: number) =>
  Number.isInteger(value) && value > 0;

const invalidAmountResult = (): PointMutationResult => ({
  ok: false,
  reason: "INVALID_AMOUNT",
});

const successResult = (
  wallet: PointWalletSnapshot,
  balanceAfter: number,
  transaction: Omit<PointTransactionDraft, "balanceAfter">,
): PointMutationResult => ({
  ok: true,
  wallet: { ...wallet, balance: balanceAfter },
  transaction: { ...transaction, balanceAfter },
});

export type DeductForAnswerInput = {
  wallet: PointWalletSnapshot;
  amount: number;
  questionId: string;
  answerId: string;
};

export const deductForAnswer = ({
  wallet,
  amount,
  questionId,
  answerId,
}: DeductForAnswerInput): PointMutationResult => {
  if (!isPositiveInteger(amount)) {
    return invalidAmountResult();
  }

  if (wallet.balance < amount) {
    return { ok: false, reason: "INSUFFICIENT_BALANCE" };
  }

  const balanceAfter = wallet.balance - amount;

  return successResult(wallet, balanceAfter, {
    lawyerUserId: wallet.lawyerUserId,
    amount,
    type: "answer_deduction",
    relatedQuestionId: questionId,
    relatedAnswerId: answerId,
  });
};

export type RefundForAnswerDeletionInput = {
  wallet: PointWalletSnapshot;
  amount: number;
  questionId: string;
  answerId: string;
};

export const refundForAnswerDeletion = ({
  wallet,
  amount,
  questionId,
  answerId,
}: RefundForAnswerDeletionInput): PointMutationResult => {
  if (!isPositiveInteger(amount)) {
    return invalidAmountResult();
  }

  const balanceAfter = wallet.balance + amount;

  return successResult(wallet, balanceAfter, {
    lawyerUserId: wallet.lawyerUserId,
    amount,
    type: "answer_refund",
    relatedQuestionId: questionId,
    relatedAnswerId: answerId,
  });
};

export type ApplyChargeInput = {
  wallet: PointWalletSnapshot;
  amount: number;
  externalPaymentId?: string;
};

export const applyCharge = ({
  wallet,
  amount,
  externalPaymentId,
}: ApplyChargeInput): PointMutationResult => {
  if (!isPositiveInteger(amount)) {
    return invalidAmountResult();
  }

  const balanceAfter = wallet.balance + amount;

  return successResult(wallet, balanceAfter, {
    lawyerUserId: wallet.lawyerUserId,
    amount,
    type: "charge",
    externalPaymentId,
  });
};
