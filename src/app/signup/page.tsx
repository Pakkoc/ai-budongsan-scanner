/**
 * 회원가입 페이지
 * 참조: docs/pages/01-general-signup/plan.md, docs/pages/02-lawyer-signup/plan.md
 */

'use client';

import { SignUpProvider, useSignUpContext } from '@/features/signup/context/sign-up-context';
import { GeneralSignUpForm } from '@/features/signup/components/general-sign-up-form';
import { LawyerSignUpForm } from '@/features/signup/components/lawyer-sign-up-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SignUpContent() {
  const { state, setActiveTab } = useSignUpContext();

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">회원가입</h1>
          <p className="text-muted-foreground mt-2">
            AI 부동산 스캐너에 오신 것을 환영합니다
          </p>
        </div>

        <Tabs
          value={state.activeTab}
          onValueChange={(value) => setActiveTab(value as 'user' | 'lawyer')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">일반 회원</TabsTrigger>
            <TabsTrigger value="lawyer">변호사</TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <GeneralSignUpForm />
            </div>
          </TabsContent>

          <TabsContent value="lawyer" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <LawyerSignUpForm />
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-primary hover:underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <SignUpProvider>
      <SignUpContent />
    </SignUpProvider>
  );
}
