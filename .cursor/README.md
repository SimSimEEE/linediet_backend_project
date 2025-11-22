# Cursor 설정 및 사용 가이드

## Cursor 설정

### Extensions
설치된 확장 프로그램:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## AI 기능 활용

### 1. Cmd+K (인라인 편집)
- 선택한 코드 블록 수정
- 새 함수/클래스 생성
- 리팩토링

### 2. Cmd+L (채팅)
- 복잡한 질문
- 아키텍처 논의
- 문제 해결

### 3. @ 멘션
- `@파일명`: 특정 파일 참조
- `@폴더`: 폴더 내 모든 파일 참조
- `@코드`: 선택한 코드 참조

## 작업 흐름

### 새 기능 추가
1. 요구사항 정리
2. 관련 파일 @ 멘션
3. 패턴 참조 코드 제공
4. AI에게 구현 요청
5. 생성된 코드 검토
6. 필요시 수정 요청

### 에러 해결
1. 전체 에러 로그 복사
2. 관련 파일 @ 멘션
3. AI에게 분석 요청
4. 제안된 해결책 적용
5. 재테스트

### 문서 작성
1. 작성할 문서 유형 명시
2. 포함할 내용 나열
3. 참고 자료 제공
4. AI가 초안 생성
5. 내용 검토 및 수정

## MCP (Model Context Protocol) 서버

현재 사용 중인 MCP 서버: 없음

향후 추가 고려사항:
- GitHub MCP: PR 관리
- AWS MCP: 배포 자동화
- Database MCP: 스키마 관리

## 제한사항 및 주의사항

### AI가 잘하는 것
- 보일러플레이트 코드 생성
- 패턴 적용
- 문서 작성
- 단순 버그 수정

### AI가 못하는 것
- 복잡한 비즈니스 로직 설계
- 성능 최적화 (사람의 검증 필요)
- 보안 취약점 완벽한 탐지
- 프로젝트 전체 아키텍처 결정

### 주의사항
1. **항상 코드 검토**: AI 생성 코드는 반드시 검토
2. **테스트 필수**: 특히 비즈니스 로직
3. **보안 재확인**: 암호화, 인증, 권한 등
4. **성능 측정**: AI 제안이 최적이 아닐 수 있음
