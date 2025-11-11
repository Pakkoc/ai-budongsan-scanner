import type {
  Answer,
  AnswerAdoptionBlockReason,
  AnswerSubmissionBlockReason,
  LawyerProfileSnapshot,
  QuestionDeletionBlockReason,
  QuestionSnapshot,
} from "../types/qna";

export type QuestionDeletionEvaluation = {
  canDelete: boolean;
  refundableAnswerCount: number;
  refundableAmount: number;
  remainingMillis: number;
  reasons: QuestionDeletionBlockReason[];
};

export type EvaluateQuestionDeletionInput = {
  question: QuestionSnapshot;
  answers: Answer[];
  requesterId: string;
  now: Date;
  deletionWindowMs: number;
  refundPerAnswer: number;
};

export const evaluateQuestionDeletion = ({
  question,
  answers,
  requesterId,
  now,
  deletionWindowMs,
  refundPerAnswer,
}: EvaluateQuestionDeletionInput): QuestionDeletionEvaluation => {
  const reasons: QuestionDeletionBlockReason[] = [];
  const isOwner = question.askerId === requesterId;
  const isDeleted = question.status === "deleted" || question.deletedAt !== null;
  const isDeletableStatus = question.status === "awaiting_answer" && !isDeleted;

  if (!isOwner) {
    reasons.push("NOT_OWNER");
  }

  if (!isDeletableStatus) {
    reasons.push("QUESTION_NOT_DELETABLE");
  }

  const elapsedMs = now.getTime() - question.createdAt.getTime();
  const remainingMillis = Math.max(deletionWindowMs - Math.max(elapsedMs, 0), 0);

  if (elapsedMs > deletionWindowMs) {
    reasons.push("WINDOW_EXPIRED");
  }

  const refundableAnswerCount = answers.filter(
    (answer) => answer.status !== "deleted",
  ).length;
  const refundableAmount = refundableAnswerCount * refundPerAnswer;

  return {
    canDelete: reasons.length === 0,
    refundableAnswerCount,
    refundableAmount,
    remainingMillis,
    reasons,
  };
};

export type AnswerSubmissionEvaluation = {
  canSubmit: boolean;
  reasons: AnswerSubmissionBlockReason[];
};

export type AnswerSubmissionInput = {
  lawyer: LawyerProfileSnapshot;
  question: QuestionSnapshot;
  minimumBalance: number;
};

export const canSubmitAnswer = ({
  lawyer,
  question,
  minimumBalance,
}: AnswerSubmissionInput): AnswerSubmissionEvaluation => {
  const reasons: AnswerSubmissionBlockReason[] = [];

  if (lawyer.verificationStatus !== "approved") {
    reasons.push("LAWYER_NOT_APPROVED");
  }

  if (lawyer.pointBalance < minimumBalance) {
    reasons.push("INSUFFICIENT_BALANCE");
  }

  if (!question.isPublic) {
    reasons.push("QUESTION_NOT_PUBLIC");
  }

  const isQuestionOpen =
    question.status === "awaiting_answer" && question.deletedAt === null;

  if (!isQuestionOpen) {
    reasons.push("QUESTION_NOT_OPEN");
  }

  return {
    canSubmit: reasons.length === 0,
    reasons,
  };
};

export type AnswerAdoptionEvaluation = {
  canAdopt: boolean;
  reasons: AnswerAdoptionBlockReason[];
};

export type AnswerAdoptionInput = {
  question: QuestionSnapshot;
  answer: Answer;
  actingUserId: string;
  alreadyAdoptedAnswerId: string | null;
};

export const canAdoptAnswer = ({
  question,
  answer,
  actingUserId,
  alreadyAdoptedAnswerId,
}: AnswerAdoptionInput): AnswerAdoptionEvaluation => {
  const reasons: AnswerAdoptionBlockReason[] = [];

  if (question.askerId !== actingUserId) {
    reasons.push("NOT_OWNER");
  }

  if (
    question.status === "deleted" ||
    question.deletedAt !== null ||
    question.status !== "awaiting_answer"
  ) {
    reasons.push("QUESTION_NOT_ADOPTABLE");
  }

  if (alreadyAdoptedAnswerId !== null) {
    reasons.push("ALREADY_ADOPTED");
  }

  if (answer.questionId !== question.id || answer.status === "deleted") {
    reasons.push("ANSWER_MISMATCH");
  }

  return {
    canAdopt: reasons.length === 0,
    reasons,
  };
};
