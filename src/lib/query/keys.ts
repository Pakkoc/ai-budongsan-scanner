/**
 * React Query 캐시 키 상수
 * 참조: docs/common-modules.md
 */

export const QUERY_KEYS = {
  // 인증
  currentUser: ['currentUser'] as const,

  // 질문
  questions: ['questions'] as const,
  question: (id: string) => ['questions', id] as const,
  questionMessages: (id: string) => ['questions', id, 'messages'] as const,

  // 답변
  answers: (questionId: string) => ['questions', questionId, 'answers'] as const,
  answer: (answerId: string) => ['answers', answerId] as const,

  // 포인트
  pointWallet: (lawyerUserId: string) =>
    ['pointWallet', lawyerUserId] as const,
  pointTransactions: (lawyerUserId: string) =>
    ['pointTransactions', lawyerUserId] as const,

  // 변호사 인증
  verificationRequests: ['verificationRequests'] as const,
  verificationRequest: (id: string) =>
    ['verificationRequests', id] as const,
  verificationHistory: (lawyerUserId: string) =>
    ['verificationHistory', lawyerUserId] as const,

  // 알림
  notifications: (userId: string) => ['notifications', userId] as const,
  unreadNotificationCount: (userId: string) =>
    ['notifications', userId, 'unread'] as const,

  // 관리자
  adminLawyerApprovals: (filters?: Record<string, unknown>) =>
    ['admin', 'lawyerApprovals', filters] as const,
} as const;

