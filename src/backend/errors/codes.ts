/**
 * 애플리케이션 에러 코드 정의
 * 참조: docs/common-modules.md
 */

export const ERROR_CODES = {
  // 인증 관련
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_LAWYER_NOT_APPROVED: 'AUTH_LAWYER_NOT_APPROVED',

  // 변호사 인증 관련
  LAWYER_BAR_NUMBER_TAKEN: 'LAWYER_BAR_NUMBER_TAKEN',
  LAWYER_INVALID_BAR_NUMBER: 'LAWYER_INVALID_BAR_NUMBER',
  LAWYER_NOT_APPROVED: 'LAWYER_NOT_APPROVED',
  LAWYER_ALREADY_IN_REVIEW: 'LAWYER_ALREADY_IN_REVIEW',
  VERIFICATION_ALREADY_IN_REVIEW: 'VERIFICATION_ALREADY_IN_REVIEW',
  VERIFICATION_NOT_IN_REVIEW: 'VERIFICATION_NOT_IN_REVIEW',
  VERIFICATION_ALREADY_APPROVED: 'VERIFICATION_ALREADY_APPROVED',

  // 질문 관련
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  QUESTION_ALREADY_DELETED: 'QUESTION_ALREADY_DELETED',
  QUESTION_DELETE_WINDOW_EXPIRED: 'QUESTION_DELETE_WINDOW_EXPIRED',
  QUESTION_NOT_OWNER: 'QUESTION_NOT_OWNER',
  QNA_QUESTION_NOT_FOUND: 'QNA_QUESTION_NOT_FOUND',
  QNA_NOT_OWNER: 'QNA_NOT_OWNER',
  QNA_WINDOW_EXPIRED: 'QNA_WINDOW_EXPIRED',
  QNA_QUESTION_NOT_OPEN: 'QNA_QUESTION_NOT_OPEN',

  // 답변 관련
  ANSWER_NOT_FOUND: 'ANSWER_NOT_FOUND',
  ANSWER_ALREADY_ADOPTED: 'ANSWER_ALREADY_ADOPTED',
  ANSWER_INSUFFICIENT_BALANCE: 'ANSWER_INSUFFICIENT_BALANCE',
  QNA_ANSWER_NOT_FOUND: 'QNA_ANSWER_NOT_FOUND',
  QNA_ALREADY_ADOPTED: 'QNA_ALREADY_ADOPTED',

  // 포인트 관련
  POINT_INSUFFICIENT_BALANCE: 'POINT_INSUFFICIENT_BALANCE',
  POINT_INVALID_AMOUNT: 'POINT_INVALID_AMOUNT',

  // 결제 관련
  PAYMENT_SESSION_FAILED: 'PAYMENT_SESSION_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  PAYMENT_INSUFFICIENT_BALANCE: 'PAYMENT_INSUFFICIENT_BALANCE',

  // 파일 업로드 관련
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  STORAGE_INVALID_FILE_TYPE: 'STORAGE_INVALID_FILE_TYPE',
  STORAGE_FILE_TOO_LARGE: 'STORAGE_FILE_TOO_LARGE',
  STORAGE_UPLOAD_FAILED: 'STORAGE_UPLOAD_FAILED',

  // 일반 에러
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 애플리케이션 에러 클래스
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 에러 코드별 기본 메시지
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 인증
  AUTH_INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  AUTH_EMAIL_TAKEN: '이미 사용 중인 이메일입니다.',
  AUTH_WEAK_PASSWORD: '비밀번호는 최소 8자 이상이어야 합니다.',
  AUTH_UNAUTHORIZED: '로그인이 필요합니다.',
  AUTH_FORBIDDEN: '접근 권한이 없습니다.',
  AUTH_USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  AUTH_LAWYER_NOT_APPROVED: '변호사 인증이 승인되지 않았습니다.',

  // 변호사 인증
  LAWYER_BAR_NUMBER_TAKEN: '이미 등록된 변호사 등록번호입니다.',
  LAWYER_INVALID_BAR_NUMBER: '올바르지 않은 변호사 등록번호 형식입니다.',
  LAWYER_NOT_APPROVED: '승인된 변호사만 이용 가능합니다.',
  LAWYER_ALREADY_IN_REVIEW: '이미 심사 중인 요청이 있습니다.',
  VERIFICATION_ALREADY_IN_REVIEW: '이미 심사 중인 검증 요청이 있습니다.',
  VERIFICATION_NOT_IN_REVIEW: '심사 중인 요청을 찾을 수 없습니다.',
  VERIFICATION_ALREADY_APPROVED: '이미 승인된 요청입니다.',

  // 질문
  QUESTION_NOT_FOUND: '질문을 찾을 수 없습니다.',
  QUESTION_ALREADY_DELETED: '이미 삭제된 질문입니다.',
  QUESTION_DELETE_WINDOW_EXPIRED:
    '질문 등록 후 1시간이 지나 삭제할 수 없습니다.',
  QUESTION_NOT_OWNER: '질문 작성자만 수정/삭제할 수 있습니다.',
  QNA_QUESTION_NOT_FOUND: '질문을 찾을 수 없습니다.',
  QNA_NOT_OWNER: '질문 작성자만 수정/삭제할 수 있습니다.',
  QNA_WINDOW_EXPIRED: '질문 등록 후 1시간이 지나 삭제할 수 없습니다.',
  QNA_QUESTION_NOT_OPEN: '현재 상태에서는 답변을 등록할 수 없습니다.',

  // 답변
  ANSWER_NOT_FOUND: '답변을 찾을 수 없습니다.',
  ANSWER_ALREADY_ADOPTED: '이미 채택된 답변이 있습니다.',
  ANSWER_INSUFFICIENT_BALANCE: '포인트가 부족합니다. 충전 후 이용해주세요.',
  QNA_ANSWER_NOT_FOUND: '답변을 찾을 수 없습니다.',
  QNA_ALREADY_ADOPTED: '이미 채택된 답변이 있습니다.',

  // 포인트
  POINT_INSUFFICIENT_BALANCE: '포인트 잔액이 부족합니다.',
  POINT_INVALID_AMOUNT: '유효하지 않은 금액입니다.',

  // 결제
  PAYMENT_SESSION_FAILED: '결제 세션 생성에 실패했습니다.',
  PAYMENT_VERIFICATION_FAILED: '결제 검증에 실패했습니다.',
  PAYMENT_ALREADY_PROCESSED: '이미 처리된 결제입니다.',
  PAYMENT_INSUFFICIENT_BALANCE: '결제를 진행하기 위한 잔액이 부족합니다.',

  // 파일
  FILE_INVALID_TYPE: '허용되지 않은 파일 형식입니다.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  FILE_UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
  STORAGE_INVALID_FILE_TYPE: '허용되지 않은 파일 형식입니다.',
  STORAGE_FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  STORAGE_UPLOAD_FAILED: '파일 업로드에 실패했습니다.',

  // 일반
  VALIDATION_ERROR: '입력 값이 올바르지 않습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다.',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다.',
};

/**
 * 에러 코드로 AppError 생성
 */
export function createAppError(
  code: ErrorCode,
  statusCode?: number,
  details?: unknown
): AppError {
  return new AppError(
    code,
    ERROR_MESSAGES[code],
    statusCode ?? 500,
    details
  );
}

