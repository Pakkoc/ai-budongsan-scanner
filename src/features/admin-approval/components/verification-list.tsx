/**
 * 관리자 인증 요청 목록 컴포넌트
 * 참조: docs/pages/04-admin-lawyer-approval/plan.md
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X } from 'lucide-react';

type VerificationRequest = {
  requestId: string;
  lawyerProfileId: string;
  lawyerName: string;
  barNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  documents: string[];
};

export function VerificationList() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/verifications');
      if (!response.ok) throw new Error('목록 조회 실패');

      const data = await response.json();
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (requestId: string, decision: 'approve' | 'reject') => {
    setProcessing(requestId);
    setError(null);

    try {
      const response = await fetch('/api/admin/verifications/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          decision,
          adminComment: decision === 'reject' ? adminComment : undefined,
        }),
      });

      if (!response.ok) throw new Error('처리 실패');

      // 목록 새로고침
      await fetchRequests();
      setSelectedRequest(null);
      setAdminComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 중 오류 발생');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">변호사 인증 요청 관리</h2>
        <p className="text-muted-foreground mt-2">
          총 {requests.length}건의 요청이 있습니다
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">인증 요청이 없습니다</p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.requestId} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{request.lawyerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      등록번호: {request.barNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      제출일: {new Date(request.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.status === 'approved'
                        ? 'default'
                        : request.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {request.status === 'pending'
                      ? '대기 중'
                      : request.status === 'approved'
                      ? '승인'
                      : '반려'}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm">제출 서류 ({request.documents.length}개)</Label>
                  <div className="mt-2 space-y-1">
                    {request.documents.map((doc, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • 서류 {index + 1}
                      </p>
                    ))}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="space-y-3">
                    {selectedRequest === request.requestId && (
                      <div>
                        <Label htmlFor="adminComment">반려 사유 (선택)</Label>
                        <Textarea
                          id="adminComment"
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          placeholder="반려 사유를 입력하세요"
                          className="mt-2"
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleProcess(request.requestId, 'approve')}
                        disabled={processing !== null}
                        className="flex-1"
                      >
                        {processing === request.requestId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        승인
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (selectedRequest === request.requestId) {
                            handleProcess(request.requestId, 'reject');
                          } else {
                            setSelectedRequest(request.requestId);
                          }
                        }}
                        disabled={processing !== null}
                        className="flex-1"
                      >
                        {processing === request.requestId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        반려
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

