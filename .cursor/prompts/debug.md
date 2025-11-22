# 디버깅 프롬프트

## 사용 시점
컴파일 에러, 런타임 에러, 의존성 충돌 등 문제 해결이 필요할 때

## 프롬프트 템플릿

```
[전체 에러 로그 붙여넣기]

이 에러를 해결해줘.

컨텍스트:
- 발생 시점: {언제}
- 관련 파일: {파일 경로}
- 최근 변경: {무엇을 했는지}
- 환경: {Node 버전, OS 등}

기대 동작: {정상적으로 어떻게 동작해야 하는지}
```

## 실제 사용 예시

### 예시 1: TypeScript 컴파일 에러 (ttsc 문제)
```
npm run build 실행 시 다음 에러가 발생해:

```
> linediet-api@1.0.0 build
> npm run build-ts

> linediet-api@1.0.0 build-ts
> ttsc -p tsconfig.build.json

/Users/.../node_modules/ttypescript/lib/PluginCreator.js:28
    const originCreateProgram = ts.createProgram;
                                   ^
TypeError: Cannot set property createProgram of #<Object> which has only a getter
```

관련 파일:
- package.json (scripts.build-ts: "ttsc -p tsconfig.build.json")
- tsconfig.json (transform: ts-transformer-keys)

최근 변경:
- TypeScript 5.4.5로 업그레이드
- ttypescript 사용 중

환경:
- Node.js 20.x
- macOS

기대: 정상적으로 TypeScript 빌드 완료
```

**AI의 해결책**:
1. ttypescript의 TypeScript 5.x 비호환성 파악
2. ts-transformer-keys 제거 (현재 미사용)
3. package.json에서 ttsc → tsc로 변경
4. tsconfig.json에서 transform 설정 제거

### 예시 2: DynamoDB 쿼리 에러
```
AppointmentRepository.queryByDoctorAndDate() 실행 시 에러:

```
ValidationException: Query condition missed key schema element: appointmentDate
```

코드:
```typescript
const params = {
  TableName: this.tableName,
  IndexName: 'doctorId-appointmentDate',
  KeyConditionExpression: 'doctorId = :doctorId',
  ExpressionAttributeValues: {
    ':doctorId': doctorId,
  },
};
```

GSI 정의 (serverless.yml):
```yaml
GlobalSecondaryIndexes:
  - IndexName: doctorId-appointmentDate
    KeySchema:
      - AttributeName: doctorId
        KeyType: HASH
      - AttributeName: appointmentDate
        KeyType: RANGE
```

기대: 특정 의사의 특정 날짜 예약 목록 조회
```

**필요한 수정**: KeyConditionExpression에 appointmentDate 조건 추가

### 예시 3: 환경변수 미설정 에러
```
Lambda 함수 실행 시 에러:

```
Error: ENCRYPTION_KEY is not defined
  at encrypt (src/utils/encryption.ts:15)
  at PatientRepository.create (src/repositories/patient.repository.ts:28)
```

관련 코드:
```typescript
export function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined');
  }
  // ...
}
```

serverless.yml:
```yaml
provider:
  environment:
    NODE_ENV: ${self:custom.stage}
    # ENCRYPTION_KEY 없음!
```

환경: dev stage, AWS Lambda

기대: 환자 정보 저장 시 자동 암호화
```

**해결**: serverless.yml의 environment에 ENCRYPTION_KEY 추가 필요

### 예시 4: 의존성 버전 충돌
```
npm install 실행 시 다음 경고:

```
npm WARN ERESOLVE overriding peer dependency
npm WARN While resolving: @types/node@20.11.5
npm WARN Found: typescript@5.4.5
npm WARN   peer typescript@">=4.0.0 <6.0.0" from ts-node@10.9.2
```

package.json:
```json
{
  "devDependencies": {
    "@types/node": "^20.11.5",
    "typescript": "^5.4.5",
    "ts-node": "^10.9.2"
  }
}
```

문제: 빌드는 되는데 경고 메시지 제거하고 싶음

환경: Node.js 20.x
```

### 예시 5: 런타임 타입 에러
```
API 테스트 중 다음 에러 발생:

```
TypeError: Cannot read property 'patientId' of undefined
  at AppointmentService.createAppointment (src/services/appointment.service.ts:45)
```

요청 body:
```json
{
  "doctorId": "DOC001",
  "appointmentDate": "2024-01-20",
  "timeSlot": "14:00"
  // patientId 누락!
}
```

코드 (appointment.service.ts:45):
```typescript
const patient = await this.patientRepository.getById(data.patientId);
```

기대: patientId 필수 입력 검증 후 명확한 에러 메시지
```

**해결**: Controller에서 입력 검증 추가 필요

## 디버깅 체크리스트

문제 발생 시 확인사항:
- [ ] 전체 에러 스택 트레이스 확인
- [ ] 에러 발생 직전 변경사항 확인
- [ ] 관련 파일 코드 검토
- [ ] 환경변수 설정 확인
- [ ] 의존성 버전 확인 (package.json, package-lock.json)
- [ ] TypeScript 타입 에러 확인
- [ ] 로그 추가하여 변수 값 확인
- [ ] 비슷한 동작하는 코드와 비교

## 로그 추가 프롬프트

```
[문제가 있는 코드 붙여넣기]

디버깅을 위한 로그를 추가해줘.

로그 위치:
- 함수 시작 시: 입력 파라미터
- 중간 단계: 중요 변수 값
- 에러 발생 시: 에러 상세 정보

주의사항:
- 개인정보는 마스킹 (phoneNumber, ssn)
- JSON.stringify() 활용
- console.log 대신 적절한 로깅 라이브러리 사용
```

## 에러 메시지 개선 프롬프트

```
[현재 에러 처리 코드]

에러 메시지를 더 명확하게 개선해줘.

요구사항:
- 사용자에게 액션 가능한 정보 제공
- 에러 원인 명확히
- 에러 코드 일관성 유지
- 스택 트레이스는 개발 환경에만

예시:
- ❌ "Error occurred"
- ✅ "Patient not found: PAT001"
```

## 팁

1. **에러 로그 전체 복사**: 일부만 보내면 진단 어려움
2. **재현 방법 공유**: "이렇게 하면 에러 발생" 명시
3. **최근 변경사항 언급**: 문제의 실마리
4. **환경 정보**: Node 버전, OS, 의존성 버전 중요
5. **기대 동작 명시**: 정상적으로 어떻게 동작해야 하는지
6. **관련 코드 첨부**: @ 멘션으로 파일 참조
