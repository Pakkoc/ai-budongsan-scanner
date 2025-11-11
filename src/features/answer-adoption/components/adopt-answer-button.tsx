/**
 * 답변 채택 버튼 컴포넌트
 * 참조: docs/pages/09-answer-adoption/plan.md
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, CheckCircle } from 'lucide-react';

type AdoptAnswerButtonProps = {
  questionId: string;
  answerId: string;
  isAdopted?: boolean;
  onSuccess?: () => void;
};

export function AdoptAnswerButton({
  questionId,
  answerId,
  isAdopted = false,
  onSuccess,
}: AdoptAnswerButtonProps) {
  const [adopting, setAdopting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAdopt = async () => {
    setAdopting(true);
    setError(null);

    try {
      const response = await fetch('/api/qna/answers/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '답변 채택 실패');
      }

      setSuccess(true);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '채택 중 오류가 발생했습니다');
    } finally {
      setAdopting(false);
    }
  };

  if (isAdopted) {
    return (
      <Button variant="outline" disabled>
        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
        채택된 답변
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>답변이 채택되었습니다. 변호사에게 알림이 전송됩니다.</Alert>}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={adopting}>
            {adopting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            이 답변 채택하기
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 답변을 채택하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              채택된 답변은 다른 사용자들에게 추천 답변으로 표시됩니다. 한 질문당 하나의
              답변만 채택할 수 있으며, 채택 후에는 변경할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdopt} disabled={adopting}>
              {adopting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              채택
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

