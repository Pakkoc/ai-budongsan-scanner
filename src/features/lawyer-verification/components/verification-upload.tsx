/**
 * 변호사 서류 업로드 컴포넌트
 * 참조: docs/pages/03-lawyer-verification-upload/plan.md
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

type UploadedDocument = {
  documentId: string;
  fileName: string;
  fileSize: number;
  uploadUrl: string;
};

export function VerificationUpload() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        // 1. 업로드 URL 생성
        const urlResponse = await fetch('/api/lawyer/verification/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: 'license',
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          }),
        });

        if (!urlResponse.ok) {
          throw new Error('업로드 URL 생성 실패');
        }

        const { uploadUrl, documentId } = await urlResponse.json();

        // 2. 파일 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('파일 업로드 실패');
        }

        // 3. 문서 목록에 추가
        setDocuments((prev) => [
          ...prev,
          {
            documentId,
            fileName: file.name,
            fileSize: file.size,
            uploadUrl,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.documentId !== documentId));
  };

  const handleSubmit = async () => {
    if (documents.length === 0) {
      setError('최소 1개 이상의 서류를 업로드해주세요');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/lawyer/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: documents.map((doc) => doc.documentId),
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('인증 요청 제출 실패');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/my-page';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">변호사 자격 서류 업로드</h2>
        <p className="text-muted-foreground mt-2">
          변호사 자격증 및 신분증을 업로드해주세요
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      {success && (
        <Alert>인증 요청이 제출되었습니다. 승인까지 1-2일 소요됩니다.</Alert>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">서류 파일</Label>
            <div className="mt-2">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileSelect}
                disabled={uploading || submitting}
              />
              <p className="text-sm text-muted-foreground mt-1">
                PDF, JPG, PNG 파일 (최대 10MB)
              </p>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              <Label>업로드된 파일 ({documents.length})</Label>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(doc.documentId)}
                      disabled={submitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="message">추가 메시지 (선택)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="관리자에게 전달할 메시지를 입력하세요"
              disabled={submitting}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploading || submitting || documents.length === 0}
            className="w-full"
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploading
              ? '업로드 중...'
              : submitting
              ? '제출 중...'
              : '인증 요청 제출'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

