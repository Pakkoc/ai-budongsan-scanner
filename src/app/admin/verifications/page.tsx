/**
 * 관리자 인증 관리 페이지
 * 참조: docs/pages/04-admin-lawyer-approval/plan.md
 */

'use client';

import { VerificationList } from '@/features/admin-approval/components/verification-list';

export default function AdminVerificationsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <VerificationList />
    </div>
  );
}

