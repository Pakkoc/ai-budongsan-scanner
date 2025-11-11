/**
 * AI 채팅 컴포넌트
 * 참조: docs/pages/05-ai-question-publication/plan.md
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAiQnaContext } from '../context/ai-qna-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function AiChat() {
  const { state, dispatch, sendMessage, saveQuestion } = useAiQnaContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.streamingContent]);

  const handleSend = async () => {
    if (!state.userInput.trim() || state.isStreaming) return;
    await sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 && !state.isStreaming && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium mb-2">AI 부동산 상담을 시작하세요</p>
            <p className="text-sm">궁금한 부동산 관련 법률 문제를 질문해보세요</p>
          </div>
        )}

        {state.messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </Card>
          </div>
        ))}

        {state.isStreaming && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-muted">
              <p className="whitespace-pre-wrap">
                {state.streamingContent}
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              </p>
            </Card>
          </div>
        )}

        {state.errorMessage && (
          <Alert variant="destructive">{state.errorMessage}</Alert>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t p-4 space-y-4">
        {state.messages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={state.isPublic}
                onCheckedChange={() => dispatch({ type: 'TOGGLE_PUBLIC' })}
                disabled={state.saveStatus === 'saving'}
              />
              <Label htmlFor="isPublic" className="text-sm">
                질문을 공개하여 변호사 답변 받기
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="disclaimer"
                checked={state.disclaimerAcknowledged}
                onCheckedChange={() => dispatch({ type: 'ACKNOWLEDGE_DISCLAIMER' })}
                disabled={state.saveStatus === 'saving'}
              />
              <Label htmlFor="disclaimer" className="text-sm">
                AI 답변은 참고용이며, 법적 효력이 없음을 확인합니다
              </Label>
            </div>

            <Button
              onClick={saveQuestion}
              disabled={
                state.saveStatus === 'saving' ||
                !state.disclaimerAcknowledged ||
                state.isStreaming
              }
              className="w-full"
            >
              {state.saveStatus === 'saving' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {state.saveStatus === 'saving' ? '저장 중...' : '질문 저장'}
            </Button>

            {state.saveStatus === 'success' && (
              <Alert>질문이 저장되었습니다. 잠시 후 이동합니다...</Alert>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <Textarea
            value={state.userInput}
            onChange={(e) => dispatch({ type: 'SET_USER_INPUT', input: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="부동산 관련 질문을 입력하세요... (Shift+Enter: 줄바꿈)"
            disabled={state.isStreaming}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleSend}
            disabled={!state.userInput.trim() || state.isStreaming}
            size="lg"
          >
            {state.isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              '전송'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

