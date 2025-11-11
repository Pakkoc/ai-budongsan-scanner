/**
 * AI QnA Context Provider
 * 참조: docs/pages/05-ai-question-publication/plan.md
 */

'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { aiQnaReducer, initialState, type AiQnaState, type AiQnaAction } from './ai-qna-reducer';
import { useGeminiStream } from '../hooks/use-gemini-stream';
import { useSaveQuestion } from '../hooks/use-save-question';

type AiQnaContextValue = {
  state: AiQnaState;
  dispatch: React.Dispatch<AiQnaAction>;
  sendMessage: () => Promise<void>;
  saveQuestion: () => Promise<void>;
};

const AiQnaContext = createContext<AiQnaContextValue | null>(null);

export function AiQnaProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(aiQnaReducer, initialState);
  const { startStream } = useGeminiStream();
  const saveQuestionMutation = useSaveQuestion();

  const sendMessage = useCallback(async () => {
    const trimmed = state.userInput.trim();

    if (!trimmed || state.isStreaming) {
      return;
    }

    const messagesForRequest = [
      ...state.messages.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        content: msg.content,
      })),
      { role: 'user' as const, content: trimmed },
    ];

    dispatch({ type: 'SEND_MESSAGE', content: trimmed });

    await startStream({
      messages: messagesForRequest,
      onStart: () => dispatch({ type: 'STREAM_START' }),
      onChunk: (chunk) => dispatch({ type: 'STREAM_CHUNK', chunk }),
      onComplete: () => dispatch({ type: 'STREAM_END' }),
      onError: (error) =>
        dispatch({
          type: 'STREAM_ERROR',
          error,
        }),
    });
  }, [state.messages, state.userInput, state.isStreaming, startStream]);

  const saveQuestion = useCallback(async () => {
    if (state.messages.length === 0) {
      dispatch({ type: 'SAVE_FAILURE', error: '저장할 대화가 없습니다' });
      return;
    }

    if (!state.disclaimerAcknowledged) {
      dispatch({ type: 'SAVE_FAILURE', error: 'AI 면책 문구에 동의해주세요' });
      return;
    }

    dispatch({ type: 'SAVE_REQUEST' });

    try {
      const response = await saveQuestionMutation.mutateAsync({
        messages: state.messages,
        isPublic: state.isPublic,
        disclaimerAcknowledged: state.disclaimerAcknowledged,
      });

      dispatch({ type: 'SAVE_SUCCESS', redirectTo: response.redirectTo });

      setTimeout(() => {
        router.push(response.redirectTo);
      }, 1000);
    } catch (error) {
      dispatch({
        type: 'SAVE_FAILURE',
        error:
          error instanceof Error ? error.message : '질문 저장 중 오류가 발생했습니다',
      });
    }
  }, [
    state.messages,
    state.disclaimerAcknowledged,
    state.isPublic,
    router,
    saveQuestionMutation,
  ]);

  const contextValue = useMemo<AiQnaContextValue>(
    () => ({
      state,
      dispatch,
      sendMessage,
      saveQuestion,
    }),
    [state, sendMessage, saveQuestion]
  );

  return <AiQnaContext.Provider value={contextValue}>{children}</AiQnaContext.Provider>;
}

export function useAiQnaContext() {
  const context = useContext(AiQnaContext);
  if (!context) {
    throw new Error('useAiQnaContext must be used within AiQnaProvider');
  }
  return context;
}

