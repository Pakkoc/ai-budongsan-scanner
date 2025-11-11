/**
 * 질문 삭제 버튼 컴포넌트
 * 참조: docs/pages/08-question-delete-within-1h/plan.md
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
import { Loader2, Trash2 } from 'lucide-react';
import { APP_CONFIG } from '@/constants/app-config';

type DeleteQuestionButtonProps = {
  questionId: string;
  createdAt: string;
  onSuccess?: () => void;
};

export function DeleteQuestionButton({
  questionId,
  createdAt,
  onSuccess,
}: DeleteQuestionButtonProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 삭제 가능 시간 확인
  const createdDate = new Date(createdAt);
  const now = new Date();
  const hoursSinceCreated =
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  const canDelete = hoursSinceCreated <= APP_CONFIG.QUESTION_DELETION_WINDOW_HOURS;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/qna/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '질문 삭제 실패');
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = data.redirectTo;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };

  if (!canDelete) {
    return (
      <Alert>
        질문 작성 후 {APP_CONFIG.QUESTION_DELETION_WINDOW_HOURS}시간이 경과하여 삭제할 수 없습니다
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={deleting}>
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            질문 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>질문을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 질문과 관련된 모든 답변이 삭제되며,
              답변 작성에 사용된 포인트는 변호사에게 환불됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-sm text-muted-foreground">
        질문 작성 후 {APP_CONFIG.QUESTION_DELETION_WINDOW_HOURS}시간 이내에만 삭제 가능합니다
      </p>
    </div>
  );
}

