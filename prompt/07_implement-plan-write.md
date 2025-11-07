각각의 {/docs/usecases/N-name/spec.md와 /docs/pages/N-name/state.md}를 참조한다.

위 유스케이스 문서의 기능을 구현하기위한 최소한의 모듈화 설계 진행하세요.

1. /docs/{requirement, persona, techstack, structure,prd,userflow,database,common-modules,test-plan}.m, /docs/rules/tdd, /docs/external/\*.md 문서를 읽고 프로젝트의 상태를 구체적으로 파악한다.
2. 해당 페이지와 연관된 유스케이스 문서들을 /docs/usecases 경로에서 적절히 찾아 읽는다.
3. 해당 페이지와 연관된 상태관리리 문서들을 /docs/pages/{N-name}/state.md 경로에서 적절히 찾아 읽는다.
3. 코드베이스에서 관련 파일들을 탐색하여 이미 구현된 기능, convention, guideline 등을 파악한다.
4. 구현해야할 모듈 및 작업위치를 설계한다. AGENTS.md의 코드베이스 구조를 반드시 지킨다. shared로 분리가능한 공통 모듈 및 제네릭을 고려한다.
완성된 설계를 다음과 같이 구성한다.
- 개요: 모듈 이름, 위치, 간략한 설명을 포함한 목록
- Diagram: mermaid 문법을 사용하여 모듈간 관계를 시각화
- Implementation Plan: 각 모듈의 구체적인 구현 계획. presentation의 경우 qa sheet를, business logic의 경우 unit test를 포함.
5. 단계별로 개발해야할 것들을 리스트업한 뒤, 각각에 대해 기존 코드베이스에 구현된 내용과 충돌하지 않을지 판단한다.
6. 완성된 설계를 각각의 `docs/pages/{N-name}/plan.md` 경로에 저장한다.

- 엄밀한 오류 없는 구현 계획을 세우세요.
- 각 서비스별 코드베이스 구조를 엄격히 따르세요.
- DRY를 반드시 준수하세요.
- /docs/rules/tdd.md 문서를 참고하여, 이 페이지를 구현할 때 필요한 단위테스트/E2E테스트에 대한 구현 계획도 세워주세요. 그리고 전반적인 구현 계획 프로세스가 TDD guideline 문서에 포함된 프로세스를 따르도록 계획하세요.