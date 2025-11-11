import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateQuestionDeletion,
  canSubmitAnswer,
  canAdoptAnswer,
} from "../../src/domain/policies/qna-policy";
import type {
  Answer,
  LawyerProfileSnapshot,
  QuestionSnapshot,
} from "../../src/domain/types/qna";

const baseQuestion = (overrides: Partial<QuestionSnapshot> = {}): QuestionSnapshot => ({
  id: "question-1",
  askerId: "user-1",
  status: "awaiting_answer",
  isPublic: true,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

const baseLawyer = (
  overrides: Partial<LawyerProfileSnapshot> = {},
): LawyerProfileSnapshot => ({
  userId: "lawyer-1",
  verificationStatus: "approved",
  pointBalance: 10_000,
  ...overrides,
});

const baseAnswer = (overrides: Partial<Answer> = {}): Answer => ({
  id: "answer-1",
  questionId: "question-1",
  lawyerUserId: "lawyer-1",
  status: "submitted",
  createdAt: new Date("2025-01-01T01:00:00.000Z"),
  ...overrides,
});

test("evaluateQuestionDeletion allows deletion within the 1-hour window for owner", () => {
  const now = new Date("2025-01-01T00:30:00.000Z");

  const result = evaluateQuestionDeletion({
    question: baseQuestion(),
    answers: [],
    requesterId: "user-1",
    now,
    deletionWindowMs: 60 * 60 * 1000,
    refundPerAnswer: 1000,
  });

  assert.equal(result.canDelete, true);
  assert.equal(result.refundableAmount, 0);
  assert.ok(result.remainingMillis > 0);
});

test("evaluateQuestionDeletion denies deletion when requester is not owner", () => {
  const now = new Date("2025-01-01T00:10:00.000Z");

  const result = evaluateQuestionDeletion({
    question: baseQuestion(),
    answers: [],
    requesterId: "user-2",
    now,
    deletionWindowMs: 60 * 60 * 1000,
    refundPerAnswer: 1000,
  });

  assert.equal(result.canDelete, false);
  assert.equal(result.reasons.includes("NOT_OWNER"), true);
});

test("evaluateQuestionDeletion denies deletion after 1 hour and reports refund amount", () => {
  const now = new Date("2025-01-01T01:10:00.000Z");

  const result = evaluateQuestionDeletion({
    question: baseQuestion(),
    answers: [baseAnswer(), baseAnswer({ id: "answer-2", lawyerUserId: "lawyer-2" })],
    requesterId: "user-1",
    now,
    deletionWindowMs: 60 * 60 * 1000,
    refundPerAnswer: 1000,
  });

  assert.equal(result.canDelete, false);
  assert.equal(result.refundableAmount, 2000);
  assert.equal(result.reasons.includes("WINDOW_EXPIRED"), true);
});

test("canSubmitAnswer permits approved lawyer with sufficient balance", () => {
  const result = canSubmitAnswer({
    lawyer: baseLawyer(),
    question: baseQuestion(),
    minimumBalance: 1000,
  });

  assert.equal(result.canSubmit, true);
});

test("canSubmitAnswer blocks when balance is insufficient", () => {
  const result = canSubmitAnswer({
    lawyer: baseLawyer({ pointBalance: 900 }),
    question: baseQuestion(),
    minimumBalance: 1000,
  });

  assert.equal(result.canSubmit, false);
  assert.equal(result.reasons.includes("INSUFFICIENT_BALANCE"), true);
});

test("canAdoptAnswer permits asker to adopt when no prior adoption", () => {
  const result = canAdoptAnswer({
    question: baseQuestion(),
    answer: baseAnswer(),
    actingUserId: "user-1",
    alreadyAdoptedAnswerId: null,
  });

  assert.equal(result.canAdopt, true);
});

test("canAdoptAnswer blocks when another answer already adopted", () => {
  const result = canAdoptAnswer({
    question: baseQuestion(),
    answer: baseAnswer(),
    actingUserId: "user-1",
    alreadyAdoptedAnswerId: "answer-other",
  });

  assert.equal(result.canAdopt, false);
  assert.equal(result.reasons.includes("ALREADY_ADOPTED"), true);
});
