import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateUploadEligibility,
  evaluateAdminDecision,
} from "../../src/domain/policies/verification-policy";

test("evaluateUploadEligibility allows pending status to upload", () => {
  const result = evaluateUploadEligibility("pending");
  assert.equal(result.canUpload, true);
});

test("evaluateUploadEligibility blocks when already in review", () => {
  const result = evaluateUploadEligibility("in_review");
  assert.equal(result.canUpload, false);
  assert.equal(result.reason, "ALREADY_IN_REVIEW");
});

test("evaluateAdminDecision allows approve when in review", () => {
  const result = evaluateAdminDecision({
    currentStatus: "in_review",
    action: "approve",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.nextStatus, "approved");
});

test("evaluateAdminDecision blocks decision when not in review", () => {
  const result = evaluateAdminDecision({
    currentStatus: "pending",
    action: "approve",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "NOT_IN_REVIEW");
});
