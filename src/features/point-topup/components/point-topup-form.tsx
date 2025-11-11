/**
 * 포인트 충전 폼
 * 참조: docs/pages/06-lawyer-point-topup/plan.md
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/constants/app-config';

const PRESET_AMOUNTS = [10000, 30000, 50000, 100000];

export function PointTopupForm() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseInt(amount);

    if (isNaN(numAmount) || numAmount < APP_CONFIG.MIN_TOPUP_AMOUNT) {
      setError(`최소 충전 금액은 ${APP_CONFIG.MIN_TOPUP_AMOUNT.toLocaleString()}원입니다`);
      return;
    }

    if (numAmount > APP_CONFIG.MAX_TOPUP_AMOUNT) {
      setError(`최대 충전 금액은 ${APP_CONFIG.MAX_TOPUP_AMOUNT.toLocaleString()}원입니다`);
      return;
    }

    setLoading(true);

    try {
      // 1. 충전 세션 생성
      const sessionResponse = await fetch('/api/points/topup/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });

      if (!sessionResponse.ok) {
        throw new Error('충전 세션 생성 실패');
      }

      const { checkoutUrl } = await sessionResponse.json();

      // 2. Toss Payments 결제 페이지로 이동
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : '충전 요청 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">포인트 충전</h2>
        <p className="text-muted-foreground mt-2">
          답변 작성에 필요한 포인트를 충전하세요
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="amount">충전 금액</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="충전할 금액을 입력하세요"
              disabled={loading}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              최소 {APP_CONFIG.MIN_TOPUP_AMOUNT.toLocaleString()}원 ~ 최대{' '}
              {APP_CONFIG.MAX_TOPUP_AMOUNT.toLocaleString()}원
            </p>
          </div>

          <div>
            <Label>빠른 선택</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant="outline"
                  onClick={() => handlePresetClick(presetAmount)}
                  disabled={loading}
                >
                  {presetAmount.toLocaleString()}원
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span>충전 금액</span>
              <span className="font-medium">
                {amount ? parseInt(amount).toLocaleString() : 0}원
              </span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span>획득 포인트</span>
              <span className="font-medium text-primary">
                {amount ? parseInt(amount).toLocaleString() : 0}P
              </span>
            </div>
          </div>

          <Button type="submit" disabled={loading || !amount} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? '처리 중...' : 'Toss Payments로 결제하기'}
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-muted">
        <p className="text-sm text-muted-foreground">
          • 1 포인트 = 1원으로 충전됩니다
          <br />
          • 답변 작성 시 {APP_CONFIG.ANSWER_DEDUCTION_POINTS}P가 차감됩니다
          <br />• 결제는 Toss Payments를 통해 안전하게 처리됩니다
        </p>
      </Card>
    </div>
  );
}

