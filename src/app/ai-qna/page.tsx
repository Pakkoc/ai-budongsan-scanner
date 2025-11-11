/**
 * AI 상담 페이지
 * 참조: docs/pages/05-ai-question-publication/plan.md
 */

'use client';

import { AiQnaProvider } from '@/features/ai-qna/context/ai-qna-context';
import { AiChat } from '@/features/ai-qna/components/ai-chat';

export default function AiQnaPage() {
  return (
    <AiQnaProvider>
      <div className="container mx-auto max-w-4xl h-[calc(100vh-4rem)]">
        <div className="h-full flex flex-col py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">AI 부동산 상담</h1>
            <p className="text-muted-foreground mt-2">
              AI가 부동산 관련 법률 질문에 답변해드립니다
            </p>
          </div>

          <div className="flex-1 rounded-lg border bg-card overflow-hidden">
            <AiChat />
          </div>
        </div>
      </div>
    </AiQnaProvider>
  );
}

