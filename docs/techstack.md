제시해주신 초기 기술 스택(Next.js, Hono, Supabase, Gemini API)은 신속한 개발, 간결한 구조, 쉬운 인프라라는 저희의 가치에 완벽하게 부합하는 훌륭한 조합입니다. 이 스택이 왜 최적의 선택인지, 그리고 각 기술을 어떻게 활용하여 'AI 부동산 스캐너'를 구현할지에 대해 구체적으로 설명해 드리겠습니다.

### 최종 추천 기술 스택 및 아키텍처

| 구분 | 기술 | 선정 이유 및 역할 |
| :--- | :--- | :--- |
| 프론트엔드 | Next.js (with React) | (판단 기준 1, 2, 3 충족) 압도적인 인기와 Vercel의 지원. 빠른 UI 개발 및 손쉬운 배포에 최적화되어 MVP 제작 속도를 극대화합니다. |
| 백엔드 API | Hono | (판단 기준 1, 2 충족) 경량 프레임워크로 배우기 쉽고 빠릅니다. Vercel의 Edge Function에서 실행되어 별도의 서버 관리 없이 가장 쉬운 인프라를 지향하는 가치와 일치합니다. |
| DB/인증/스토리지 | Supabase | (판단 기준 1, 2, 3 충족) PostgreSQL DB, 인증, 파일 스토리지를 한 번에 제공하는 All-in-one 솔루션입니다. 오버엔지니어링을 피하고 백엔드 개발 공수를 획기적으로 줄여줍니다. |
| AI | Google Gemini API | (판단 기준 1, 2, 3 충족) 요구사항에 명시된 `gemini-2.5-flash` 모델은 비용과 속도 측면에서 MVP의 채팅 기능에 가장 적합합니다. |
| 결제 | Toss Payments | 국내 환경에 필수적인 결제 솔루션으로, 명확한 API 문서를 제공하여 연동이 용이합니다. |
| 배포/호스팅 | Vercel | (판단 기준 1, 2, 3 충족) Next.js와 최고의 궁합을 자랑하며, 클릭 몇 번으로 배포 및 CI/CD가 자동화됩니다. '가장 쉬운 인프라'라는 목표에 가장 부합하는 플랫폼입니다. |

---

### 기술 스택별 핵심 구현 전략

#### 1. 프론트엔드: Next.js

Next.js의 App Router를 기반으로 페이지 및 레이아웃을 구성하여 개발 생산성을 높입니다.
*   파일 기반 라우팅: `/app` 디렉토리 구조를 통해 `/sign-up`, `/ai-qna`, `/lawyer-board/{id}` 등 페이지 목록에 명시된 라우팅을 직관적으로 구현합니다.
*   컴포넌트 기반 개발: 공용 레이아웃(Header), 카드 UI, 버튼 등 재사용 가능한 컴포넌트를 만들어 전체적인 개발 속도를 높이고 일관성을 유지합니다.
*   서버 컴포넌트 활용: `/#features`, `/#faq` 와 같은 정적 컨텐츠는 서버 컴포넌트로 구성하여 초기 로딩 성능을 최적화합니다.

#### 2. 백엔드 API: Hono on Vercel Edge Functions

복잡한 서버 설정 없이 API를 구축하는 데 집중합니다. Hono는 Next.js 프로젝트 내의 `/api` 폴더에 함수 단위로 API를 작성하고 배포할 수 있어 매우 간결합니다.
*   API 엔드포인트: `/api/qna`, `/api/payments/charge`, `/api/lawyer/verify` 와 같은 RESTful API 엔드포인트를 Hono로 작성합니다.
*   Gemini API 연동: `/api/ai/chat` 엔드포인트를 만들어, 프론트엔드로부터 받은 사용자 질문과 대화 기록을 Gemini API로 전달하고 응답을 스트리밍하는 로직을 구현합니다.
*   Toss Payments 연동: 결제 요청 및 승인을 처리하는 엔드포인트를 Hono로 구현하여 Supabase의 포인트 정보를 업데이트합니다.

#### 3. 핵심 데이터베이스 및 인증: Supabase

Supabase는 MVP 단계에서 필요한 대부분의 백엔드 기능을 제공하여, 우리가 핵심 비즈니스 로직에만 집중할 수 있도록 돕습니다.
*   인증 (Auth):
    *   이메일/비밀번호 기반의 회원가입과 로그인을 Supabase Auth로 처리합니다.
    *   카카오 소셜 로그인 또한 Supabase가 제공하는 Provider 설정을 통해 간단하게 연동할 수 있습니다.
    *   유저 구분: `profiles` 테이블에 `role` (역할) 컬럼('user', 'lawyer')을 추가하여 일반 유저와 변호사 유저를 명확하게 구분하고, Row Level Security(RLS)를 통해 역할 기반 데이터 접근 제어를 설정합니다.
*   데이터베이스 (PostgreSQL):
    *   `questions`, `answers`, `points`, `lawyer_verifications` 등의 테이블을 설계하여 서비스의 모든 데이터를 관리합니다.
    *   질문 삭제 정책(1시간 이내)과 같은 비즈니스 로직은 Supabase의 Database Functions (PostgreSQL Functions) 를 활용하여 트리거로 구현하면 안정성을 높일 수 있습니다.
*   스토리지 (Storage):
    *   변호사 자격 증명을 위한 .jpg, .pdf 파일은 Supabase Storage에 업로드합니다.
    *   업로드된 파일은 Private Bucket으로 설정하고, 관리자만 접근하여 확인할 수 있도록 보안 규칙을 적용합니다.

### 아키텍처 흐름

```
[사용자] <=> [Next.js 프론트엔드 @ Vercel]
    |
    | (API 요청)
    V
[Hono API @ Vercel Edge Functions]
    |
    +---> [Supabase] (DB, 인증, 스토리지)
    |
    +---> [Gemini API] (AI 답변 생성)
    |
    +---> [Toss Payments API] (포인트 결제)
```

이 구조는 각 기술의 장점을 극대화하여 시너지를 냅니다. Vercel은 프론트엔드와 백엔드 API를 매끄럽게 통합해주고, Supabase는 복잡한 백엔드 인프라 구축의 부담을 완전히 덜어줍니다.

### 향후 확장 계획과의 연계성

이 기술 스택은 MVP를 넘어 향후 서비스 확장에도 유연하게 대처할 수 있습니다.

*   LangChain + RAG 도입: 백엔드(Hono)에 LangChain.js 라이브러리를 추가하고, Supabase의 `pgvector` 확장 기능을 활용하여 벡터 데이터베이스를 구축하면 RAG 시스템을 비교적 쉽게 도입할 수 있습니다.
*   Flutter 앱 개발: 현재 구축한 Hono API는 프론트엔드에 종속적이지 않으므로, 추후 Flutter 앱 개발 시 동일한 API를 그대로 재사용하여 개발 비용과 시간을 절약할 수 있습니다.

이 스택은 현재의 MVP 목표인 '신속한 프로토타입 완성 및 내부 테스트'를 달성하는 데 가장 효율적인 경로를 제공할 것이라 확신합니다.