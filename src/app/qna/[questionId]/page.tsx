/**
 * 질문 상세 페이지
 * 참조: docs/pages/08-question-delete-within-1h/plan.md, docs/pages/09-answer-adoption/plan.md
 */

'use client';

import { use } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteQuestionButton } from '@/features/question-delete/components/delete-question-button';
import { AdoptAnswerButton } from '@/features/answer-adoption/components/adopt-answer-button';

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export default function QuestionDetailPage({ params }: PageProps) {
  const { questionId } = use(params);

  // TODO: 실제로는 API에서 질문 데이터를 가져와야 함
  const mockQuestion = {
    questionId,
    title: '부동산 계약 관련 질문',
    content: '질문 내용...',
    createdAt: new Date().toISOString(),
    isOwner: true,
    status: 'answered',
  };

  const mockAnswers = [
    {
      answerId: 'answer-1',
      lawyerName: '홍길동 변호사',
      content: '답변 내용...',
      createdAt: new Date().toISOString(),
      isAdopted: false,
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-6">
        {/* 질문 */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{mockQuestion.title}</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  작성일: {new Date(mockQuestion.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge>{mockQuestion.status === 'answered' ? '답변 완료' : '대기 중'}</Badge>
            </div>

            <div className="prose max-w-none">
              <p>{mockQuestion.content}</p>
            </div>

            {mockQuestion.isOwner && (
              <div className="pt-4 border-t">
                <DeleteQuestionButton
                  questionId={questionId}
                  createdAt={mockQuestion.createdAt}
                />
              </div>
            )}
          </div>
        </Card>

        {/* 답변 목록 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">답변 ({mockAnswers.length})</h2>

          {mockAnswers.map((answer) => (
            <Card key={answer.answerId} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{answer.lawyerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(answer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {answer.isAdopted && (
                    <Badge variant="default">채택된 답변</Badge>
                  )}
                </div>

                <div className="prose max-w-none">
                  <p>{answer.content}</p>
                </div>

                {mockQuestion.isOwner && !answer.isAdopted && (
                  <div className="pt-4 border-t">
                    <AdoptAnswerButton
                      questionId={questionId}
                      answerId={answer.answerId}
                      isAdopted={answer.isAdopted}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

