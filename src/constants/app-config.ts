/**
 * 애플리케이션 전역 상수
 * 참조: docs/common-modules.md, docs/database.md
 */

export const APP_CONFIG = {
  // 포인트 관련
  POINTS: {
    ANSWER_COST: 1000, // 답변 작성 비용
    MIN_CHARGE_AMOUNT: 10000, // 최소 충전 금액 (원)
    POINT_TO_WON_RATIO: 1, // 1포인트 = 1원
  },

  // 답변 작성 포인트 (호환성 유지)
  ANSWER_DEDUCTION_POINTS: 1000,

  // 질문 관련
  QUESTION: {
    DELETE_TIME_LIMIT_HOURS: 1, // 질문 삭제 가능 시간 (1시간)
    MIN_CONTENT_LENGTH: 10, // 최소 질문 길이
  },

  // 답변 관련
  ANSWER: {
    MIN_CONTENT_LENGTH: 200, // 최소 답변 길이
  },

  // 답변 길이 제한 (호환성 유지)
  MIN_ANSWER_LENGTH: 200,
  MAX_ANSWER_LENGTH: 5000,

  // 파일 업로드 관련
  FILE_UPLOAD: {
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'] as const,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    STORAGE_BUCKET: 'verification-documents',
  },

  // 약관 버전
  CONSENT_VERSIONS: {
    TERMS: 'v1.0.0',
    PRIVACY: 'v1.0.0',
  },

  // 변호사 등록번호 패턴
  BAR_NUMBER_PATTERN: /^\d{2}-\d{5}$/,

  // AI 면책 문구
  AI_DISCLAIMER:
    '본 AI 답변은 참고용이며, 법적 효력이 없습니다. 정확한 법률 자문은 변호사 답변을 참고하세요.',

  // Toss Payments URL
  TOSS_PAYMENT_SUCCESS_URL: process.env.NEXT_PUBLIC_APP_URL + '/my-page?payment=success',
  TOSS_PAYMENT_FAIL_URL: process.env.NEXT_PUBLIC_APP_URL + '/my-page?payment=fail',

  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;

