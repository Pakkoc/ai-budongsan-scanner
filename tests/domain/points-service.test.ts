import test from "node:test";
import assert from "node:assert/strict";
import {
  deductForAnswer,
  refundForAnswerDeletion,
  applyCharge,
} from "../../src/domain/services/points-service";

const wallet = (balance = 5000) => ({
  lawyerUserId: "lawyer-1",
  balance,
});

test("deductForAnswer decreases balance and emits transaction", () => {
  const result = deductForAnswer({
    wallet: wallet(5000),
    amount: 1000,
    questionId: "question-1",
    answerId: "answer-1",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.wallet.balance, 4000);
  assert.equal(result.transaction.balanceAfter, 4000);
  assert.equal(result.transaction.type, "answer_deduction");
});

test("deductForAnswer blocks when balance would be negative", () => {
  const result = deductForAnswer({
    wallet: wallet(500),
    amount: 1000,
    questionId: "question-1",
    answerId: "answer-1",
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "INSUFFICIENT_BALANCE");
});

test("refundForAnswerDeletion restores balance and references answer", () => {
  const result = refundForAnswerDeletion({
    wallet: wallet(2000),
    amount: 1000,
    questionId: "question-1",
    answerId: "answer-1",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.wallet.balance, 3000);
  assert.equal(result.transaction.type, "answer_refund");
  assert.equal(result.transaction.relatedAnswerId, "answer-1");
});

test("applyCharge increases balance and captures external reference", () => {
  const result = applyCharge({
    wallet: wallet(0),
    amount: 2000,
    externalPaymentId: "pay_123",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.wallet.balance, 2000);
  assert.equal(result.transaction.type, "charge");
  assert.equal(result.transaction.externalPaymentId, "pay_123");
});
