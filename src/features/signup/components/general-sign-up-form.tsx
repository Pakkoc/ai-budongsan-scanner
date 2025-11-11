/**
 * 일반 회원가입 폼
 * 참조: docs/pages/01-general-signup/plan.md
 */

'use client';

import { useSignUpContext } from '../context/sign-up-context';
import { useGeneralSignUp } from '../hooks/use-general-sign-up';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';

export function GeneralSignUpForm() {
  const { state, updateField, markTouched } = useSignUpContext();
  const mutation = useGeneralSignUp();

  const formValues = state.formValues.user;
  const errors = state.fieldErrors.user;
  const touched = state.touched.user;
  const isSubmitting = state.submitStatus.user === 'submitting';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 클라이언트 검증
    const validationErrors: Record<string, string> = {};

    if (!formValues.email) {
      validationErrors.email = '이메일을 입력해주세요';
    }
    if (!formValues.password) {
      validationErrors.password = '비밀번호를 입력해주세요';
    } else if (formValues.password.length < 8) {
      validationErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    }
    if (formValues.password !== formValues.confirmPassword) {
      validationErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    if (!formValues.nickname) {
      validationErrors.nickname = '닉네임을 입력해주세요';
    }
    if (!formValues.agreeTerms || !formValues.agreePrivacy) {
      validationErrors.agreeTerms = '약관에 동의해주세요';
    }

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    mutation.mutate(formValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.serverError && (
        <Alert variant="destructive">{state.serverError}</Alert>
      )}

      {state.redirectCountdown > 0 && (
        <Alert>
          회원가입 완료! {state.redirectCountdown}초 후 AI 상담 페이지로 이동합니다...
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={formValues.email}
          onChange={(e) => updateField('user', 'email', e.target.value)}
          onBlur={() => markTouched('user', 'email')}
          disabled={isSubmitting}
          placeholder="example@email.com"
        />
        {touched.email && errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={formValues.password}
          onChange={(e) => updateField('user', 'password', e.target.value)}
          onBlur={() => markTouched('user', 'password')}
          disabled={isSubmitting}
          placeholder="최소 8자 이상"
        />
        {touched.password && errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formValues.confirmPassword}
          onChange={(e) => updateField('user', 'confirmPassword', e.target.value)}
          onBlur={() => markTouched('user', 'confirmPassword')}
          disabled={isSubmitting}
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          type="text"
          value={formValues.nickname}
          onChange={(e) => updateField('user', 'nickname', e.target.value)}
          onBlur={() => markTouched('user', 'nickname')}
          disabled={isSubmitting}
          placeholder="2-20자"
        />
        {touched.nickname && errors.nickname && (
          <p className="text-sm text-destructive">{errors.nickname}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agreeTerms"
            checked={formValues.agreeTerms}
            onCheckedChange={(checked) =>
              updateField('user', 'agreeTerms', checked === true)
            }
            disabled={isSubmitting}
          />
          <Label htmlFor="agreeTerms" className="text-sm">
            서비스 이용약관에 동의합니다 (필수)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="agreePrivacy"
            checked={formValues.agreePrivacy}
            onCheckedChange={(checked) =>
              updateField('user', 'agreePrivacy', checked === true)
            }
            disabled={isSubmitting}
          />
          <Label htmlFor="agreePrivacy" className="text-sm">
            개인정보 처리방침에 동의합니다 (필수)
          </Label>
        </div>

        {errors.agreeTerms && (
          <p className="text-sm text-destructive">{errors.agreeTerms}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '가입 중...' : '가입 완료'}
      </Button>
    </form>
  );
}

