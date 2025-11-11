/**
 * 변호사 회원가입 폼
 * 참조: docs/pages/02-lawyer-signup/plan.md
 */

'use client';

import { useSignUpContext } from '../context/sign-up-context';
import { useLawyerSignUp } from '../hooks/use-lawyer-sign-up';
import { useBarNumberValidation } from '../hooks/use-bar-number-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';

export function LawyerSignUpForm() {
  const { state, updateField, markTouched } = useSignUpContext();
  const mutation = useLawyerSignUp();

  const formValues = state.formValues.lawyer;
  const errors = state.fieldErrors.lawyer;
  const touched = state.touched.lawyer;
  const isSubmitting = state.submitStatus.lawyer === 'submitting';

  // 등록번호 실시간 검증
  useBarNumberValidation(formValues.barNumber);

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
    if (!formValues.fullName) {
      validationErrors.fullName = '실명을 입력해주세요';
    }
    if (!formValues.barNumber) {
      validationErrors.barNumber = '변호사 등록번호를 입력해주세요';
    } else if (state.barNumberLookup.status === 'invalid') {
      validationErrors.barNumber = state.barNumberLookup.message || '유효하지 않은 등록번호입니다';
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
          회원가입 완료! {state.redirectCountdown}초 후 마이페이지로 이동합니다...
        </Alert>
      )}

      {state.postSubmitHintVisible && (
        <Alert>
          변호사 인증을 위해 자격 서류를 업로드해주세요. 승인 후 답변 작성이 가능합니다.
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={formValues.email}
          onChange={(e) => updateField('lawyer', 'email', e.target.value)}
          onBlur={() => markTouched('lawyer', 'email')}
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
          onChange={(e) => updateField('lawyer', 'password', e.target.value)}
          onBlur={() => markTouched('lawyer', 'password')}
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
          onChange={(e) => updateField('lawyer', 'confirmPassword', e.target.value)}
          onBlur={() => markTouched('lawyer', 'confirmPassword')}
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
          onChange={(e) => updateField('lawyer', 'nickname', e.target.value)}
          onBlur={() => markTouched('lawyer', 'nickname')}
          disabled={isSubmitting}
          placeholder="2-20자"
        />
        {touched.nickname && errors.nickname && (
          <p className="text-sm text-destructive">{errors.nickname}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">실명</Label>
        <Input
          id="fullName"
          type="text"
          value={formValues.fullName}
          onChange={(e) => updateField('lawyer', 'fullName', e.target.value)}
          onBlur={() => markTouched('lawyer', 'fullName')}
          disabled={isSubmitting}
          placeholder="홍길동"
        />
        {touched.fullName && errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="barNumber">변호사 등록번호</Label>
        <Input
          id="barNumber"
          type="text"
          value={formValues.barNumber}
          onChange={(e) => updateField('lawyer', 'barNumber', e.target.value)}
          onBlur={() => markTouched('lawyer', 'barNumber')}
          disabled={isSubmitting}
          placeholder="12-34567"
        />
        {state.barNumberLookup.status === 'checking' && (
          <p className="text-sm text-muted-foreground">확인 중...</p>
        )}
        {state.barNumberLookup.status === 'valid' && (
          <p className="text-sm text-green-600">✓ 사용 가능한 등록번호입니다</p>
        )}
        {state.barNumberLookup.status === 'invalid' && (
          <p className="text-sm text-destructive">
            {state.barNumberLookup.message || '유효하지 않은 등록번호입니다'}
          </p>
        )}
        {touched.barNumber && errors.barNumber && (
          <p className="text-sm text-destructive">{errors.barNumber}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agreeTerms"
            checked={formValues.agreeTerms}
            onCheckedChange={(checked) =>
              updateField('lawyer', 'agreeTerms', checked === true)
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
              updateField('lawyer', 'agreePrivacy', checked === true)
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

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || state.barNumberLookup.status === 'checking'}
      >
        {isSubmitting ? '가입 중...' : '변호사 가입 완료'}
      </Button>
    </form>
  );
}

