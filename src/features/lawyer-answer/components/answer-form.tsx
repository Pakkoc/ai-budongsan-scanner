/**
 * 변호사 답변 작성 폼
 * 참조: docs/pages/07-lawyer-answer-submission/plan.md
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/constants/app-config';

type AnswerFormProps = {
  questionId: string;
  onSuccess?: () => void;
};

export function AnswerForm({ questionId, onSuccess }: AnswerFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (content.length < APP_CONFIG.MIN_ANSWER_LENGTH) {
      setError(`답변은 최소 ${APP_CONFIG.MIN_ANSWER_LENGTH}자 이상이어야 합니다`);
      return;
    }

    if (content.length > APP_CONFIG.MAX_ANSWER_LENGTH) {
      setError(`답변은 최대 ${APP_CONFIG.MAX_ANSWER_LENGTH}자까지 가능합니다`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/qna/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '답변 작성 실패');
      }

      const data = await response.json();
      setSuccess(true);
      setContent('');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = data.redirectTo;
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '답변 작성 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = content.length;
  const isValid =
    charCount >= APP_CONFIG.MIN_ANSWER_LENGTH &&
    charCount <= APP_CONFIG.MAX_ANSWER_LENGTH;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="content">답변 작성</Label>
            <span
              className={`text-sm ${
                isValid ? 'text-muted-foreground' : 'text-destructive'
              }`}
            >
              {charCount.toLocaleString()} / {APP_CONFIG.MAX_ANSWER_LENGTH.toLocaleString()}자
            </span>
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="질문에 대한 전문적인 답변을 작성해주세요"
            disabled={submitting}
            className="min-h-[300px]"
          />
          <p className="text-sm text-muted-foreground mt-2">
            답변 작성 시 {APP_CONFIG.ANSWER_DEDUCTION_POINTS}P가 차감됩니다
          </p>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}
        {success && (
          <Alert>답변이 작성되었습니다. 질문자에게 알림이 전송됩니다.</Alert>
        )}

        <Button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? '작성 중...' : `답변 작성 (${APP_CONFIG.ANSWER_DEDUCTION_POINTS}P 차감)`}
        </Button>
      </form>
    </Card>
  );
}

