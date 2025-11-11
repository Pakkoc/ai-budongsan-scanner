"use client";

import { useMutation } from "@tanstack/react-query";
import {
  apiClient,
  extractApiErrorMessage,
} from "@/lib/remote/api-client";
import type {
  SaveQuestionRequest,
  SaveQuestionResponse,
} from "../backend/schema";
import { resolveAuthHeaders } from "../lib/resolve-auth-headers";

export const useSaveQuestion = () => {
  return useMutation<SaveQuestionResponse, Error, SaveQuestionRequest>({
    mutationFn: async (payload) => {
      try {
        const authHeaders = await resolveAuthHeaders();
        const response = await apiClient.post<SaveQuestionResponse>(
          "/api/qna/questions",
          payload,
          {
            headers: authHeaders,
          },
        );

        return response.data;
      } catch (error) {
        const message = extractApiErrorMessage(
          error,
          "질문 저장 중 오류가 발생했습니다",
        );
        throw new Error(message);
      }
    },
  });
};
