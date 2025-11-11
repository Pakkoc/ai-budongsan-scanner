/**
 * 변호사 인증 페이지
 * 참조: docs/pages/03-lawyer-verification-upload/plan.md
 */

'use client';

import { VerificationUpload } from '@/features/lawyer-verification/components/verification-upload';

export default function LawyerVerificationPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <VerificationUpload />
    </div>
  );
}

