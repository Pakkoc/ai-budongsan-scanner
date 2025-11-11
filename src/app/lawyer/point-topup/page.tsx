/**
 * 포인트 충전 페이지
 * 참조: docs/pages/06-lawyer-point-topup/plan.md
 */

'use client';

import { PointTopupForm } from '@/features/point-topup/components/point-topup-form';

export default function PointTopupPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <PointTopupForm />
    </div>
  );
}

