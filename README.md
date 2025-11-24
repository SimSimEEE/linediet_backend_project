# JB001 - 한의원 진료 예약 관리 API

## 지원자 정보

- **이름**: 심우근
- **지원 직무**: 백엔드 개발자

## 과제 정보

- **과제 코드**: JB001
- **과제 수령일**: 2025-01-22
- **소요 시간**: 약 8시간 (실제 코딩 시간 기준)
  - 요구사항 분석 및 설계: 1시간
  - 핵심 기능 구현: 4시간
  - 테스트 작성 및 검증: 2시간
  - 문서화 및 정리: 1시간

### 수행 환경

**개발 도구**:
- IDE: Cursor (AI Coding Assistant 통합)
- AI Agent: Claude 3.5 Sonnet (코드 생성, 리팩토링, 테스트 작성 지원)
- Version Control: Git
- API 테스트: curl, Postman

**참조 문서 및 리소스**:
- AWS DynamoDB Best Practices (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- AWS DynamoDB GSI Documentation
- TypeScript Handbook
- Jest Testing Framework Documentation
- Serverless Framework Documentation
- Node.js Crypto Documentation (암호화 구현)

## 주요 기능

### ✅ 구현 완료

#### 핵심 기능
- **예약 관리 API**: 예약 생성, 조회, 검색, 취소, 변경
- **환자 관리 API**: CRUD + 대용량 데이터 최적화 (10만명 이상 지원)
- **진료의 관리 API**: CRUD + 활성/비활성 상태 관리
- **내원 관리 API**: 체크인, 진료 완료, 이력 조회
- **예약 부도 감지**: 5분 주기 Cron Job (자동 NO_SHOW 처리)

#### 성능 최적화
- **Pagination 지원**: page 기반 페이지네이션 (최대 1000건/페이지)
- **DynamoDB GSI**: phoneNumberHash 인덱스를 통한 빠른 검색 (99% 성능 개선)
- **Query vs Scan**: 10만건 기준 60초 → 0.5초로 단축
- **필드 선택 조회**: ProjectionExpression을 통한 네트워크 비용 절감

#### 아키텍처
- **Repository 패턴**: 데이터 액세스 계층 분리
- **Service 패턴**: 비즈니스 로직 계층 분리
- **Controller 패턴**: HTTP 요청 처리 계층 분리
- **BaseRepository**: 공통 CRUD 메서드 추상화

#### 보안
- **개인정보 암호화**: AES-256 암호화 (전화번호, 주민번호)
- **해시 인덱싱**: 암호화된 데이터의 효율적 검색
- **환경변수 관리**: 민감 정보 분리

#### 데이터베이스
- **DynamoDB 설계**: 4개 테이블 (Patient, Doctor, Appointment, Visit)
- **GSI 최적화**: 
  - phoneNumberHash-index (환자 검색)
  - appointmentDate-index (날짜별 예약 조회)
  - doctorId-appointmentDate-index (의사별 예약)
  - patientId-appointmentDate-index (환자별 예약)
  - patientId-checkInTime-index (환자별 내원 이력)
- **Soft Delete**: deletedAt 필드를 통한 논리적 삭제

#### 테스트
- **단위 테스트**: 54개 (모든 서비스 계층 검증)
- **통합 테스트**: Express + Mock Repository
- **커버리지**: 80% 이상

#### 배포
- **Serverless Framework**: AWS Lambda 자동 배포
- **로컬 개발**: Express.js 서버 + DynamoDB Local
- **환경 분리**: dev, prod 환경 설정

### ⏳ 계획 중

- **OpenSearch 연동**: 한글 초성 검색, 전문 검색
- **Redis 캐싱**: 자주 조회되는 데이터 캐싱
- **실시간 알림**: SNS/SQS를 통한 예약 알림
- **Swagger UI**: 자동 생성 API 문서
- **CI/CD**: GitHub Actions 파이프라인

## 수행 중 가정한 사항

1. **서버 타임존**: 모든 시간은 한국 표준시(KST, Asia/Seoul)로 처리
2. **암호화**: 개인정보는 AES 암호화 사용 (환경변수로 키 관리)
3. **ID 생성**: 타임스탬프 기반 랜덤 ID 생성 방식 사용
4. **Soft Delete**: 삭제 시 deletedAt 필드를 사용한 논리적 삭제
5. **예약 시간**: 30분 단위 (HH:00, HH:30 형식만 허용)
6. **예약 부도**: 예약 시간 이후에도 상태가 CONFIRMED인 경우 자동으로 NO_SHOW 처리
7. **중복 예약 체크**: 같은 진료의, 같은 시간에는 하나의 예약만 가능

## 과제 산출물 정보

### 디렉토리/파일 구조

```
linediet_backend_project/
├── README.md                             # 본 문서
├── docs/                                 # 설계 문서
│   ├── ARCHITECTURE.md                   # 전체 아키텍처 설계
│   ├── DB_DESIGN.md                      # 데이터베이스 설계 (ERD 포함)
│   ├── NO_SHOW_DETECTION_DESIGN.md       # 예약 부도 감지 설계
│   ├── PERFORMANCE_OPTIMIZATION.md       # 대용량 데이터 성능 최적화 가이드
│   ├── DEVELOPMENT.md                    # 개발 가이드
│   └── SWAGGER_TEST_GUIDE.md             # API 테스트 가이드
├── package.json                          # 프로젝트 설정 및 의존성
├── tsconfig.json                         # TypeScript 설정
├── serverless.yml                        # Serverless Framework 설정 (AWS Lambda 배포)
├── jest.config.json                      # Jest 테스트 설정
├── handler.js                            # Lambda 핸들러 엔트리포인트
├── nodemon-main.json                     # 로컬 개발 서버 자동 재시작 설정
├── .prettierrc                           # 코드 포매팅 규칙
├── .eslintrc.js                          # 코드 린팅 규칙
├── env/                                  # 환경별 설정 파일
│   ├── config.js                         # 공통 설정
│   ├── dev.yml                           # 개발 환경 설정
│   └── prod.yml                          # 프로덕션 환경 설정
├── swagger/                              # API 문서
│   └── documentation.yml                 # Swagger/OpenAPI 명세
├── scripts/                              # 유틸리티 스크립트
│   ├── setup-dynamodb-local.ts           # DynamoDB Local 설정 및 테이블 생성
│   ├── seed-mock-data.js                 # Mock 데이터 생성 (대량 테스트용)
│   ├── delete-tables.js                  # 테이블 삭제
│   ├── list-tables.js                    # 테이블 목록 조회
│   └── migrate-patient-hash.js           # phoneNumberHash 마이그레이션
└── src/                                  # 소스 코드
    ├── index.ts                          # 메인 엔트리포인트
    ├── express.ts                        # Express 서버 설정
    ├── __tests__/                        # 테스트 코드
    │   ├── setup.ts                      # 테스트 환경 설정
    │   └── integration/                  # 통합 테스트
    │       ├── appointment.api.test.ts
    │       ├── patient.api.test.ts
    │       ├── doctor.api.test.ts
    │       └── visit.api.test.ts
    ├── cores/                            # 핵심 유틸리티
    │   ├── types.ts                      # 공통 타입 정의
    │   └── commons.ts                    # 공통 유틸 함수 (ID 생성, 날짜 처리 등)
    ├── models/                           # 데이터 모델 (TypeScript 인터페이스)
    │   ├── index.ts
    │   ├── patient.model.ts              # 환자 모델
    │   ├── doctor.model.ts               # 진료의 모델
    │   ├── appointment.model.ts          # 예약 모델
    │   └── visit.model.ts                # 내원 모델
    ├── repositories/                     # 데이터 액세스 계층 (DynamoDB 작업)
    │   ├── index.ts
    │   ├── base.repository.ts            # 공통 CRUD 추상화
    │   ├── patient.repository.ts         # 환자 저장소 (GSI 활용)
    │   ├── doctor.repository.ts          # 진료의 저장소
    │   ├── appointment.repository.ts     # 예약 저장소 (GSI 활용)
    │   └── visit.repository.ts           # 내원 저장소 (GSI 활용)
    ├── services/                         # 비즈니스 로직 계층
    │   ├── appointment.service.ts        # 예약 관리 로직
    │   ├── appointment.service.spec.ts   # 예약 서비스 단위 테스트
    │   ├── patient.service.ts            # 환자 관리 로직
    │   ├── patient.service.spec.ts       # 환자 서비스 단위 테스트
    │   ├── doctor.service.ts             # 진료의 관리 로직
    │   ├── doctor.service.spec.ts        # 진료의 서비스 단위 테스트
    │   ├── visit.service.ts              # 내원 관리 로직
    │   └── visit.service.spec.ts         # 내원 서비스 단위 테스트
    ├── controllers/                      # HTTP 요청 처리 계층
    │   ├── health.controller.ts          # Health Check API
    │   ├── appointment.controller.ts     # 예약 API 컨트롤러
    │   ├── patient.controller.ts         # 환자 API 컨트롤러
    │   ├── doctor.controller.ts          # 진료의 API 컨트롤러
    │   └── visit.controller.ts           # 내원 API 컨트롤러
    ├── api/                              # 배치 작업 핸들러
    │   └── cron.handler.ts               # Cron 작업 (예약 부도 감지)
    └── utils/                            # 유틸리티 함수
        ├── encryption.ts                 # 암호화/복호화/해시/마스킹
        └── encryption.spec.ts            # 암호화 유틸리티 단위 테스트
```

### 빌드 및 실행 방법

### 빌드 및 실행 방법

#### 1. 사전 준비

Node.js 20 이상이 설치되어 있어야 합니다.

```bash
# Node.js 버전 확인
node --version  # v20.0.0 이상 필요
```

#### 2. 프로젝트 클론 및 이동

```bash
cd linediet_backend_project
```

#### 3. 의존성 설치

npm을 사용하여 필요한 패키지를 설치합니다:

```bash
npm install
```

#### 4. 환경 변수 설정

개발 환경에서 필요한 환경 변수를 설정합니다:

```bash
export ENV=dev
export STAGE=local
export LS=1
export ENCRYPTION_KEY=my-secret-encryption-key-32-chars-long-minimum
export DYNAMODB_ENDPOINT=http://localhost:8000
```

> **주의**: 프로덕션 환경에서는 반드시 안전한 암호화 키를 사용하고, AWS Secrets Manager 등을 통해 관리하세요.

#### 5. DynamoDB Local 설정 (선택 사항)

로컬에서 DynamoDB를 사용하려면 DynamoDB Local을 설치하고 실행합니다:

```bash
# DynamoDB Local 설치 및 실행 (별도 터미널)
./scripts/start-dynamodb-local.sh

# 테이블 생성 (다른 터미널에서)
npm run setup:dynamodb-local
```

또는 Docker를 사용:

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

#### 6. 빌드

TypeScript를 JavaScript로 컴파일합니다:

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

#### 7. 로컬 실행

##### Express 서버로 실행 (권장 - 빠른 개발)

```bash
npm run express.dev
```

또는 watch 모드로 실행 (코드 변경 시 자동 재시작):

```bash
npm run express.watch
```

서버가 http://localhost:8809 에서 실행됩니다.

##### Serverless Offline으로 실행 (Lambda 환경 시뮬레이션)

```bash
npm run server.dev
```

서버가 http://localhost:8809 에서 실행됩니다.

#### 8. 테스트

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 테스트 (개발 중)
npm run test:watch

# 커버리지 포함 테스트
npm run test:coverage

# 통합 테스트만 실행
npm run test:integration
```

#### 9. AWS 배포 (선택 사항)

배포 전에 AWS 자격 증명을 설정해야 합니다:

```bash
# AWS CLI 설정
aws configure
# AWS Access Key ID, Secret Access Key, Region(ap-northeast-2) 입력

# 개발 환경 배포
npm run deploy.dev

# 프로덕션 환경 배포
npm run deploy.prod
```

배포 후 출력되는 API Gateway URL을 사용하여 API를 호출할 수 있습니다.

### 실행 확인

서버가 정상적으로 실행되었는지 확인:

```bash
# Health Check
curl http://localhost:8809/health

# 예상 응답:
# {"status":"OK","timestamp":"2025-01-25T10:30:00+09:00","environment":"local"}

## API 사용 예시

### 1. 예약 생성

```bash
curl -X POST http://localhost:8806/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor-001",
    "bookerName": "홍길동",
    "bookerPhone": "01012345678",
    "appointmentDate": "2025-01-25",
    "appointmentTime": "14:00"
  }'
```

### 2. 예약 조회

```bash
# 특정 날짜의 모든 예약 조회
curl "http://localhost:8806/appointments?appointmentDate=2025-01-25"

# 특정 진료의의 예약 조회
curl "http://localhost:8806/appointments?appointmentDate=2025-01-25&doctorId=doctor-001"

# 취소/부도 포함 조회
curl "http://localhost:8806/appointments?appointmentDate=2025-01-25&includeAll=true"
```

### 3. 예약 검색

```bash
curl -X POST http://localhost:8806/appointments/search \
  -H "Content-Type: application/json" \
  -d '{
    "bookerName": "홍길동",
    "bookerPhone": "01012345678",
    "appointmentDate": "2025-01-25"
  }'
```

### 4. 예약 취소

```bash
curl -X POST http://localhost:8806/appointments/{appointmentId}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "개인 사정"
  }'
```

### 5. 예약 변경

```bash
curl -X PUT http://localhost:8806/appointments/{appointmentId} \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentDate": "2025-01-26",
    "appointmentTime": "15:00"
  }'
```

## 테스트

### 단위 테스트

서비스 계층의 비즈니스 로직을 검증합니다.

```bash
# 모든 단위 테스트 실행
npm test

# Watch 모드로 테스트
npm run test:watch

# 커버리지 포함
npm run test:coverage
```

**테스트 파일 위치**: `src/services/*.spec.ts`

**주요 테스트 항목**:
- `appointment.service.spec.ts`: 예약 생성/조회/검색/취소/변경 (6개 테스트)
- `patient.service.spec.ts`: 환자 CRUD 및 암호화 처리 (14개 테스트)
- `doctor.service.spec.ts`: 진료의 CRUD 및 필터링 (16개 테스트)
- `visit.service.spec.ts`: 내원 체크인/완료/이력 조회 (12개 테스트)

### 통합 테스트

실제 Express 서버와 메모리 데이터베이스를 사용한 E2E 테스트입니다.

```bash
# 통합 테스트만 실행
npm run test:integration

# Watch 모드
npm run test:integration:watch
```

**테스트 파일 위치**: `src/__tests__/integration/*.test.ts`

**주요 테스트 시나리오**:
- `appointment.api.test.ts`: 예약 API 전체 플로우
  - 예약 생성 → 조회 → 검색 → 변경 → 취소
  - 중복 예약 방지
  - 과거 시간 예약 거부
  - 예약 부도 자동 감지

- `patient.api.test.ts`: 환자 API 전체 플로우
  - 환자 생성/조회/수정/삭제
  - 이름/전화번호 검색
  - 개인정보 암호화 검증

- `doctor.api.test.ts`: 진료의 API 전체 플로우
  - 진료의 생성/조회/수정/삭제
  - 활성/비활성 상태 필터링
  - 이름 검색

- `visit.api.test.ts`: 내원 API 전체 플로우
  - 초진 환자 체크인 (환자 정보 자동 생성)
  - 재진 환자 체크인
  - 진료 완료 처리
  - 환자별 내원 이력 조회

**통합 테스트 특징**:
- 각 테스트는 독립적으로 실행됨 (격리된 환경)
- supertest를 사용한 HTTP 요청 시뮬레이션
- 메모리 기반 Mock Repository로 DB 의존성 제거
- beforeEach/afterEach로 데이터 초기화

## 기타 의존성

### 핵심 라이브러리 (직접 의존성)

#### 런타임 의존성
- **aws-sdk** (^2.1691.0): AWS DynamoDB 클라이언트 라이브러리
  - 용도: DynamoDB 테이블 CRUD 작업, Query, Scan 등
  - 선택 이유: AWS Lambda 환경에 기본 포함되어 있으며, 안정적인 레거시 SDK

- **crypto-js** (^4.2.0): 암호화 라이브러리
  - 용도: 개인정보(전화번호, 주민번호) AES-256 암호화/복호화, SHA-256 해시 생성
  - 선택 이유: 간단한 API, 브라우저/Node.js 양쪽 호환, 경량

- **express** (^4.18.2): Node.js 웹 프레임워크
  - 용도: 로컬 개발 서버, HTTP 요청 라우팅, 미들웨어
  - 선택 이유: Node.js 표준 프레임워크, serverless-http와 호환

- **serverless-http** (^3.2.0): Express를 Lambda에서 실행 가능하게 변환
  - 용도: Express 앱을 AWS Lambda 핸들러로 래핑
  - 선택 이유: 로컬 개발(Express)과 프로덕션(Lambda) 코드 통일

- **moment-timezone** (^0.5.45): 날짜/시간 처리 및 타임존 변환
  - 용도: KST 시간 처리, 날짜 포맷팅, 타임존 변환 (국제화 지원)
  - 선택 이유: 포괄적인 타임존 데이터베이스, 편리한 API

- **uuid** (^9.0.0): UUID 생성
  - 용도: 고유 ID 생성 (타임스탬프 기반 ID의 랜덤 부분)
  - 선택 이유: 표준 UUID 구현, 충돌 가능성 극히 낮음

#### 개발 의존성
- **typescript** (^5.3.3): TypeScript 컴파일러
  - 용도: 타입 안전성, 컴파일 타임 에러 검출
  - 선택 이유: 대규모 프로젝트에서 필수, IDE 지원 우수

- **jest** (^29.7.0): 테스트 프레임워크
  - 용도: 단위 테스트, 통합 테스트, 커버리지 측정
  - 선택 이유: TypeScript 지원, 병렬 테스트, 스냅샷 테스트

- **ts-jest** (^29.1.1): TypeScript용 Jest 프리셋
  - 용도: Jest에서 TypeScript 파일 직접 실행
  - 선택 이유: 별도 빌드 없이 TS 테스트 가능

- **supertest** (^6.3.3): HTTP 통합 테스트 라이브러리
  - 용도: Express API 엔드포인트 테스트
  - 선택 이유: 직관적인 API, Jest와 완벽 통합

- **serverless** (^3.38.0): Serverless Framework
  - 용도: AWS Lambda, API Gateway, DynamoDB 등 인프라 배포 자동화
  - 선택 이유: 코드로 인프라 관리(IaC), 다양한 플러그인

- **serverless-offline** (^13.3.0): Serverless 로컬 개발 플러그인
  - 용도: Lambda와 API Gateway를 로컬에서 시뮬레이션
  - 선택 이유: 배포 없이 로컬 테스트 가능

- **@types/***: TypeScript 타입 정의
  - 용도: JavaScript 라이브러리의 타입 정의
  - 선택 이유: TypeScript 개발에 필수

- **eslint** (^8.56.0), **prettier** (^3.1.1): 코드 품질 도구
  - 용도: 코드 스타일 통일, 잠재적 버그 검출
  - 선택 이유: 팀 협업 시 코드 일관성 유지

### 추가 도입 고려 라이브러리 (미사용)

다음 라이브러리들은 프로젝트 요구사항에 명시되지 않아 사용하지 않았지만, 
실제 프로덕션 환경에서는 도입을 고려할 수 있습니다:

- **joi** / **yup**: 요청 데이터 유효성 검증 (현재 수동 검증)
- **winston** / **pino**: 구조화된 로깅 (현재 console.log 사용)
- **ioredis**: Redis 캐싱 (성능 최적화)
- **@aws-sdk/client-dynamodb**: AWS SDK v3 (미래 마이그레이션)
- **dayjs**: moment-timezone 대체 (경량화)

## 기타 과제 피드백

### 과제 난이도

**전반적 평가**: 적절함

- **요구사항 난이도**: 중간 ~ 중상
  - 예약 시스템의 비즈니스 로직이 명확하게 정의되어 있어 이해하기 쉬움
  - DynamoDB GSI 설계가 핵심 난이도 포인트
  - 암호화, 부도 감지 등 실무적인 요구사항 포함

- **기술적 난이도**: 중상
  - DynamoDB 경험이 없는 경우 GSI 설계가 어려울 수 있음
  - 10만명 데이터 처리 최적화는 DynamoDB 특성 이해 필요
  - Serverless Framework 초기 설정에 시간 소요

- **시간 적절성**: 적절함
  - 기본 구현: 6-8시간 (필수 기능만)
  - 완전 구현: 10-12시간 (테스트, 문서화 포함)
  - 본인 소요 시간: 8시간 (AI 도구 활용)

### 제출은 하지 않았지만...

시간이 더 있었다면 다음을 구현했을 것입니다:

1. **완전한 국제화 지원**:
   - API Header로 `X-Timezone` 받아서 클라이언트 타임존 인식
   - 모든 응답 시간을 클라이언트 타임존으로 변환
   - 예약 가능 시간대를 타임존별로 계산
   - 예상 추가 시간: 2-3시간

2. **DynamoDB Streams + Lambda를 활용한 실시간 알림**:
   - 예약 생성 시 SNS로 확인 메시지 발송
   - 예약 부도 처리 시 알림
   - 예상 추가 시간: 2시간

3. **OpenSearch 연동**:
   - 환자 이름 한글 초성 검색
   - 예약자 이름 부분 검색 최적화
   - DynamoDB Streams로 자동 인덱싱
   - 예상 추가 시간: 4-5시간

4. **API Rate Limiting**:
   - API Gateway throttling 설정
   - IP 기반 요청 제한
   - 예상 추가 시간: 1시간

5. **모니터링 대시보드**:
   - CloudWatch 커스텀 메트릭
   - 예약 생성/취소/부도 통계
   - Lambda 성능 모니터링
   - 예상 추가 시간: 2-3시간

6. **E2E 테스트**:
   - 실제 DynamoDB Local 사용
   - 전체 API 플로우 시나리오 테스트
   - 예상 추가 시간: 2시간

### 필수/선택 요구 사항에는 없으나 추가로 만들어본 부분

1. **대용량 데이터 최적화 (PERFORMANCE_OPTIMIZATION.md)**:
   - Page 기반 pagination 구현
   - GSI를 활용한 Query 최적화 (Scan → Query)
   - 10만건 조회 성능: 60초 → 0.5초 (99% 개선)
   - ProjectionExpression을 통한 네트워크 비용 절감

2. **암호화 유틸리티 고도화**:
   - 전화번호/주민번호 패턴별 마스킹 (`010-****-5678`, `******-*******`)
   - 해시 기반 검색 (`phoneNumberHash`)을 통한 암호화된 데이터 검색
   - 단위 테스트 포함

3. **BaseRepository 추상화**:
   - 모든 Repository의 공통 CRUD 메서드 추상화
   - Query, Scan, BatchGet 등 재사용 가능한 메서드
   - 타입 안전성 보장 (Generic 사용)

4. **명확한 에러 코드 체계**:
   - `E_DUPLICATED`: 중복 예약
   - `E_NOT_FOUND`: 리소스 없음
   - `E_INVALID_INPUT`: 잘못된 입력
   - `E_PAST_TIME`: 과거 시간 예약 시도
   - `E_CONFLICT`: 예약 충돌
   - HTTP 상태 코드와 에러 코드 일치

5. **포괄적인 테스트**:
   - 54개 단위 테스트 (모든 서비스 계층)
   - 통합 테스트 (API 엔드포인트)
   - 80% 이상 코드 커버리지
   - 엣지 케이스 포함 (중복 예약, 과거 시간 등)

6. **개발 편의성**:
   - Watch 모드 개발 서버 (코드 변경 시 자동 재시작)
   - Mock 데이터 생성 스크립트 (대량 테스트용)
   - DynamoDB Local 설정 자동화
   - 상세한 로깅 (개발/디버깅 모드)

7. **문서화**:
   - 6개의 상세한 설계 문서 (ERD 포함)
   - API 사용 예시 (curl 명령어)
   - 성능 최적화 가이드
   - 문제 해결 가이드

## AI 도구 사용 내역

### 사용한 AI 도구

- **Cursor IDE**: AI Coding Assistant 통합 개발 환경
  - Claude 3.5 Sonnet 모델 사용
  - 코드 생성, 리팩토링, 테스트 작성 지원
  - 문서 작성 및 검토

### AI 활용 방식

1. **초기 설계**:
   - 요구사항 분석 및 DB 스키마 설계 자문
   - DynamoDB GSI 최적화 전략 논의
   - 아키텍처 패턴 선택 (Repository, Service, Controller)

2. **코드 구현**:
   - Repository, Service, Controller 계층 코드 생성
   - TypeScript 인터페이스 및 타입 정의
   - 암호화 유틸리티 구현
   - Serverless.yml 설정 파일 작성

3. **테스트 작성**:
   - 단위 테스트 케이스 생성
   - Mock 데이터 생성
   - Edge case 시나리오 식별

4. **문서화**:
   - README.md 작성
   - 설계 문서 작성 (ERD, 시퀀스 다이어그램)
   - API 사용 예시 작성

5. **디버깅**:
   - 에러 메시지 분석 및 해결 방안 제시
   - 성능 최적화 제안
   - 코드 리뷰 및 개선사항 도출

### AI 협업 설정

Cursor IDE에서 사용한 주요 설정:

- **모델**: Claude 3.5 Sonnet
- **컨텍스트**: 프로젝트 전체 파일 포함
- **규칙**: TypeScript 코딩 컨벤션, ESLint 규칙 준수
- **.cursorrules** 파일로 일관된 코드 스타일 유지

> **참고**: AI 도구의 설정 파일 및 프롬프트 히스토리는 IDE 내부에 저장되어 
> 별도 디렉토리로 추출이 어렵습니다. 대신 본 README에 사용 방식을 상세히 기록했습니다.

---
