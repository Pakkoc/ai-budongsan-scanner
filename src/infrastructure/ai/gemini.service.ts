/**
 * Gemini AI 서비스
 * 참조: docs/common-modules.md, docs/pages/05-ai-question-publication/plan.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { APP_CONFIG } from '@/constants/app-config';

export type GeminiMessage = {
  role: 'user' | 'model';
  parts: string;
};

export type GeminiStreamOptions = {
  apiKey: string;
  messages: GeminiMessage[];
  includeDisclaimer?: boolean;
};

/**
 * Gemini API 스트리밍 응답 생성
 */
export async function* streamGeminiResponse(
  options: GeminiStreamOptions
): AsyncGenerator<string> {
  const { apiKey, messages, includeDisclaimer = true } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // 대화 히스토리 구성
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history,
  });

  // 스트리밍 응답
  const result = await chat.sendMessageStream(lastMessage.parts);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }

  // 면책 문구 추가
  if (includeDisclaimer) {
    yield '\n\n---\n\n';
    yield APP_CONFIG.AI_DISCLAIMER;
  }
}

/**
 * Gemini API 일반 응답 생성 (비스트리밍)
 */
export async function generateGeminiResponse(
  options: Omit<GeminiStreamOptions, 'includeDisclaimer'>
): Promise<string> {
  const { apiKey, messages } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history,
  });

  const result = await chat.sendMessage(lastMessage.parts);
  const response = result.response;
  return response.text();
}

