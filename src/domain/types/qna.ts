export type QuestionStatus = "awaiting_answer" | "adopted" | "deleted";

export type AnswerStatus = "submitted" | "adopted" | "deleted";

export type VerificationStatus = "pending" | "in_review" | "approved" | "rejected";

export type QuestionSnapshot = {
  id: string;
  askerId: string;
  status: QuestionStatus;
  isPublic: boolean;
  createdAt: Date;
  deletedAt: Date | null;
};

export type Answer = {
  id: string;
  questionId: string;
  lawyerUserId: string;
  status: AnswerStatus;
  createdAt: Date;
};

export type LawyerProfileSnapshot = {
  userId: string;
  verificationStatus: VerificationStatus;
  pointBalance: number;
};

export type QuestionDeletionBlockReason =
  | "NOT_OWNER"
  | "QUESTION_NOT_DELETABLE"
  | "WINDOW_EXPIRED";

export type AnswerSubmissionBlockReason =
  | "LAWYER_NOT_APPROVED"
  | "INSUFFICIENT_BALANCE"
  | "QUESTION_NOT_PUBLIC"
  | "QUESTION_NOT_OPEN";

export type AnswerAdoptionBlockReason =
  | "NOT_OWNER"
  | "ALREADY_ADOPTED"
  | "QUESTION_NOT_ADOPTABLE"
  | "ANSWER_MISMATCH";
