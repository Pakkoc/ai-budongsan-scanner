/docs/userflow.md의 {N}번 기능에 대한 상세 유스케이스를 작성하고, /docs/usecases/N-name/spec.md 경로에 저장하세요.

- /docs/{requirement, persona, techstack, structure,prd,userflow,database}.md 문서를 모두 읽고 프로젝트의 기획을 구체적으로 파악한다.
- 만들 기능과 연관된 userflow를 파악하고, 이에 필요한 API, 페이지, 외부연동 서비스등을 파악한다.
- 최종 유스케이스 문서를 /docs/usecases/N-name/spec.md 경로에 적절한 번호, 이름으로 생성한다. 번호는 userflow 문서에 언급된 순서를 따른다.
  - 아래 지침과 함께, /prompts/04-1_usecase_form.md 형식에 맞게 작성한다.
  - userflow에 나와있는 모든 기능을 적절한 번호와 이름으로 생성한다.

---
- 간결하게, 검토하기 쉽게 작성하세요. 다음 내용을 포함하세요.
  - Primary Actor
  - Precondition (사용자 관점에서만)
  - Trigger
  - Main Scenario
  - Edge Cases: 발생할 수 있는 오류 및 처리를 간략하게 언급
  - Business Rules
  - PlantUML 문법을 사용한 Sequence Diagram도 작성하세요. User / FE / BE / Database로 나누면 됩니다. 구분선 같은 마킹없이 PlantUML 표준 문법을 따르도록 작성하세요.

- 절대 구현과 관련된 구체적인 코드는 포함하지 않는다.
