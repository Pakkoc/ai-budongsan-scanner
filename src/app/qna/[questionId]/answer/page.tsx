/**
 * 답변 작성 페이지
 * 참조: docs/pages/07-lawyer-answer-submission/plan.md
 */

'use client';

import { use } from 'react';
import { AnswerForm } from '@/features/lawyer-answer/components/answer-form';

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export default function AnswerPage({ params }: PageProps) {
  const { questionId } = use(params);

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">답변 작성</h1>
          <p className="text-muted-foreground mt-2">
            질문에 대한 전문적인 답변을 작성해주세요
          </p>
        </div>

        <AnswerForm questionId={questionId} />
      </div>
    </div>
  );
}

