import test from "node:test";
import assert from "node:assert/strict";

import {
  aiQnaReducer,
  initialState,
  type AiQnaState,
} from "../../../src/features/ai-qna/context/ai-qna-reducer";

const reduce = (state: AiQnaState, action: Parameters<typeof aiQnaReducer>[1]) =>
  aiQnaReducer(state, action);

test("SEND_MESSAGE appends a user message and resets composer", () => {
  const state: AiQnaState = {
    ...initialState,
    userInput: "전세 계약 특약이 궁금합니다",
  };

  const next = reduce(state, { type: "SEND_MESSAGE", content: state.userInput });

  assert.equal(next.messages.length, 1);
  assert.equal(next.messages[0]?.role, "user");
  assert.equal(next.messages[0]?.content, "전세 계약 특약이 궁금합니다");
  assert.equal(next.userInput, "");
  assert.equal(next.isStreaming, true);
});

test("STREAM_CHUNK and STREAM_END accumulate AI response", () => {
  const baseState: AiQnaState = {
    ...initialState,
    messages: [
      {
        role: "user",
        content: "명의 이전 절차가 궁금해요",
        position: 0,
      },
    ],
    isStreaming: true,
  };

  const withChunk = reduce(baseState, {
    type: "STREAM_CHUNK",
    chunk: "안녕하세요. 질문 주셔서 감사합니다.",
  });

  const completed = reduce(withChunk, { type: "STREAM_END" });

  assert.equal(completed.streamingContent, "");
  assert.equal(completed.isStreaming, false);
  assert.equal(completed.messages.length, 2);
  assert.equal(
    completed.messages[1]?.content,
    "안녕하세요. 질문 주셔서 감사합니다.",
  );
  assert.equal(completed.messages[1]?.role, "ai");
});
