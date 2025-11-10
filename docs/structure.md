이 구조는 MVP의 신속한 개발을 지원하는 동시에, 향후 기능 추가, 단위 테스트, 모바일 앱 확장 시에도 흔들림 없는 안정성과 유지보수성을 제공하는 것을 목표로 합니다. 팀의 모든 구성원이 이 청사진을 기준으로 코드를 작성해주시기 바랍니다.

---

### AI 부동산 스캐너: 최종 코드베이스 구조 (Final Codebase Structure)

```
.
├── /public/                      # 정적 에셋 (이미지, 폰트)
├── /src/
│   ├── /app/                     # (1) Presentation Layer: UI & API Endpoints
│   │   ├── /(auth)/
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   └── log-in/
│   │   │       └── page.tsx
│   │   ├── /(main)/
│   │   │   ├── ai-qna/
│   │   │   ├── lawyer-board/
│   │   │   └── ...
│   │   ├── /api/                 # Hono API 진입점
│   │   │   └── [[...route]]/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx              # 랜딩 페이지
│   │
│   ├── /components/              # (1) Presentation Layer: 재사용 UI 컴포넌트
│   │   ├── /common/              #  - Button.tsx, Input.tsx, Modal.tsx
│   │   └── /feature/             #  - QnaCard.tsx, LawyerProfile.tsx
│   │
│   ├── /application/             # (2) Application Layer: Use Cases (Orchestration)
│   │   ├── /user/
│   │   │   └── signUp.usecase.ts
│   │   ├── /qna/
│   │   │   ├── createQuestion.usecase.ts
│   │   │   └── deleteQuestion.usecase.ts
│   │   └── /payment/
│   │       └── chargePoints.usecase.ts
│   │
│   ├── /domain/                  # (3) Domain Layer: Core Business Logic & Rules
│   │   ├── /user/
│   │   │   ├── /entities/        #  - User.ts, LawyerProfile.ts
│   │   │   └── /repositories/    #  - IUserRepository.ts
│   │   ├── /qna/
│   │   │   ├── /entities/        #  - Question.ts, Answer.ts
│   │   │   ├── /services/        #  - QnaPolicy.service.ts (e.g., 질문 삭제 정책 검증)
│   │   │   └── /repositories/    #  - IQuestionRepository.ts
│   │   └── /payment/
│   │       ├── /entities/        #  - PointTransaction.ts
│   │       ├── /services/        #  - PointRefund.service.ts (포인트 환불 로직)
│   │       └── /repositories/    #  - IPaymentRepository.ts
│   │
│   ├── /infrastructure/          # (4) Infrastructure Layer: External Communications
│   │   ├── /persistence/         #  - Supabase (PostgreSQL) Repository 구현체
│   │   │   ├── supabaseQuestion.repository.ts
│   │   │   └── supabaseUser.repository.ts
│   │   ├── /ai/                  #  - Google Gemini API 연동
│   │   │   └── gemini.service.ts
│   │   ├── /payment/             #  - Toss Payments API 연동
│   │   │   └── toss.service.ts
│   │   └── /auth/                #  - Supabase Auth 연동
│   │       └── supabaseAuth.service.ts
│   │
│   ├── /shared/                  # (5) Shared Kernel: 전역 공용 모듈
│   │   ├── /constants/           #  - app.config.ts (앱 전반의 상수)
│   │   ├── /utils/               #  - date.util.ts, validation.util.ts (순수 헬퍼 함수)
│   │   └── /types/               #  - index.ts (전역 타입, Enum)
│   │
│   └── /hooks/                   # React Custom Hooks
│       └── useAuth.ts
│
├── .eslintrc.json
├── next.config.mjs
└── tsconfig.json
```

---

### 각 계층의 명확한 책임과 역할

#### 1. Presentation Layer (`/app`, `/components`)
*   [핵심 책임] 사용자에게 정보를 보여주고, 사용자로부터 입력을 받습니다.
*   [주요 내용]
    *   `/app`: Next.js의 파일 기반 라우팅 규칙에 따라 페이지와 API 엔드포인트를 정의합니다.
    *   `/components`: 상태(State)를 가지지 않는 순수한 UI 컴포넌트(Stateless/Presentational Components)를 지향합니다.
    *   [규칙] 비즈니스 로직을 포함해서는 안 됩니다. 오직 `application` 계층의 유스케이스를 호출하거나, `hooks`를 통해 상태를 관리하는 역할만 수행합니다.

#### 2. Application Layer (`/application`)
*   [핵심 책임] 사용자의 시나리오(Use Case)를 조율(Orchestration)합니다.
*   [주요 내용]
    *   하나의 파일이 하나의 유스케이스를 담당합니다 (e.g., `createQuestion.usecase.ts`).
    *   [규칙]
        *   도메인 계층의 엔티티, 서비스, 리포지토리를 호출하여 비즈니스 흐름을 구성합니다.
        *   스스로 비즈니스 규칙을 만들지 않습니다. 규칙에 대한 판단은 항상 `domain` 계층에 위임합니다.
        *   데이터베이스 트랜잭션의 시작과 끝을 관리할 수 있습니다.

#### 3. Domain Layer (`/domain`)
*   [핵심 책임] 서비스의 가장 핵심적인 비즈니스 규칙과 데이터를 정의합니다. 우리 시스템의 심장입니다.
*   [주요 내용]
    *   `entities`: 데이터와 해당 데이터에 직접 연관된 행위(메서드)를 포함합니다. (e.g., `Question` 엔티티는 `canDelete()` 메서드를 가집니다.)
    *   `services`: 특정 엔티티에 속하지 않는, 여러 도메인 객체를 포함하는 순수한 비즈니스 로직을 캡슐화합니다. (단위 테스트의 핵심 대상)
    *   `repositories`: 데이터 영속성을 위한 인터페이스(계약)만 정의합니다. 실제 구현은 `infrastructure` 계층에 있습니다.
    *   [규칙] 다른 어떤 계층에도 의존하지 않는 가장 독립적인 계층이어야 합니다. Next.js, Supabase 등 특정 기술의 존재를 알아서는 안 됩니다.

#### 4. Infrastructure Layer (`/infrastructure`)
*   [핵심 책임] 외부 세계(DB, 외부 API, 인증 등)와의 통신을 담당합니다.
*   [주요 내용]
    *   `persistence`: `domain` 계층에 정의된 Repository 인터페이스를 Supabase 클라이언트를 사용하여 실제로 구현합니다.
    *   `ai`, `payment`, `auth`: Gemini, Toss Payments, Supabase Auth 등 외부 서비스와 통신하는 모든 코드가 여기에 위치합니다.
    *   [규칙] 비즈니스 로직을 포함하지 않습니다. 오직 '어떻게' 외부와 통신할 것인지에 대한 기술적인 세부사항만 다룹니다.

#### 5. Shared Kernel (`/shared`)
*   [핵심 책임] 여러 계층에서 공통으로 사용되는 코드(상수, 타입, 순수 유틸리티 함수)를 제공합니다.
*   [주요 내용]
    *   `constants`, `utils`, `types`로 명확하게 역할을 분리하여 '쓰레기통' 디렉토리가 되는 것을 방지합니다.
    *   [규칙] 특정 도메인에 종속적인 로직을 포함해서는 안 됩니다.

---

### 실행 예시: "질문 삭제 및 포인트 환불" 시나리오

1.  [API 호출] 사용자가 질문 삭제 버튼을 누르면 프론트엔드는 `DELETE /api/qna/{questionId}`를 호출합니다.
    *   `src/app/api/[[...route]]/route.ts`

2.  [Use Case 실행] Hono 라우터는 이 요청을 받아 `deleteQuestion.usecase.ts`를 실행합니다.
    *   `src/application/qna/deleteQuestion.usecase.ts`

3.  [로직 오케스트레이션] `deleteQuestionUseCase`는 다음 순서로 작업을 조율합니다.
    a. `IQuestionRepository`를 통해 질문(Question)과 관련 답변(Answer)들을 조회합니다.
    b. `QnaPolicy.service.ts` 를 호출하여 현재 시간에 해당 질문을 삭제할 수 있는지 정책을 검증합니다.
    c. `PointRefund.service.ts` 를 호출하여 환불해야 할 포인트 트랜잭션(PointTransaction) 객체 목록을 계산(생성)합니다. 이 서비스는 순수 함수이므로 DB에 접근하지 않습니다.
    d. `IQuestionRepository`와 `IPaymentRepository`를 통해 질문 삭제와 포인트 환불 트랜잭션 생성을 요청합니다.

4.  [실제 데이터 처리] `infrastructure` 계층의 `SupabaseQuestionRepository`와 `SupabasePaymentRepository`가 이 요청을 받아 실제 Supabase DB에 쿼리를 실행하여 데이터를 삭제하고 생성합니다.
    *   `src/infrastructure/persistence/supabaseQuestion.repository.ts`

이 구조를 통해 우리는 각 파일이 단 하나의 책임만 갖도록 강제하고, 순수한 비즈니스 로직(`domain/services`)을 외부 효과로부터 완벽히 분리하여 견고하고 테스트하기 쉬운 코드를 만들어갈 수 있습니다. 이것이 우리가 추구하는 간결하면서도 확장성 있는 구조의 최종안입니다.