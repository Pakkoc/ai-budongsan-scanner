"use client";

import { useCallback, useRef } from "react";
import { buildApiUrl } from "@/lib/remote/api-client";
import { resolveAuthHeaders } from "../lib/resolve-auth-headers";

type StreamMessage = {
  role: "user" | "model";
  content: string;
};

type StreamCallbacks = {
  onStart: () => void;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (message: string) => void;
};

export const useGeminiStream = () => {
  const controllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      params: StreamCallbacks & {
        messages: StreamMessage[];
      },
    ) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        params.onStart();

        const authHeaders = await resolveAuthHeaders();

        const response = await fetch(buildApiUrl("/api/ai/qna/stream"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ messages: params.messages }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("AI 응답 생성에 실패했습니다");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            params.onChunk(chunk);
          }
        }

        params.onComplete();
      } catch (error) {
        if (controller.signal.aborted) {
          params.onError("AI 응답 생성을 중단했습니다");
        } else {
          const message =
            error instanceof Error
              ? error.message
              : "AI 응답 생성 중 오류가 발생했습니다";
          params.onError(message);
        }
      } finally {
        controllerRef.current = null;
      }
    },
    [],
  );

  const abort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  return {
    startStream,
    abort,
  };
};
