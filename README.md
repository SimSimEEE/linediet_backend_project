# 한의원 진료 예약 관리 API (JB001)

## 지원자 정보

- **지원자 이름**: 심우근
- **지원 직무**: 백엔드 개발자

## 과제 정보

- **과제 코드**: JB001
- **과제 수령일**: 2025-01-22
- **소요 시간**: 약 6시간
- **수행 환경**:
  - IDE: Cursor (AI Coding Assistant)
  - AI Agent: Claude 3.5 Sonnet (Cursor 내장)
  - 참조 문서: AWS SDK Documentation, TypeScript Documentation, DynamoDB Best Practices
  - 참조 코드: ssocio-kiosk-api (아키텍처 패턴 참고)

## 결과 요약

### 구현 완료

- ✅ 예약 API (생성, 조회, 검색, 취소, 변경)
- ✅ 예약 부도 감지 배치 작업 (5분 주기 Cron)
- ✅ DynamoDB 기반 데이터 모델 설계 (Patient, Doctor, Appointment, Visit)
- ✅ Repository 패턴을 통한 데이터 액세스 계층
- ✅ Service 패턴을 통한 비즈니스 로직 분리
- ✅ 개인정보 암호화/복호화/마스킹 유틸리티
- ✅ 에러 코드 체계 (E_DUPLICATED, E_NOT_FOUND, E_INVALID_INPUT, E_PAST_TIME 등)
- ✅ Serverless Framework 기반 AWS Lambda 배포 구성
- ✅ Express.js 기반 로컬 개발 서버

### 부분 구현

- ⚠️ 내원-접수 API (구조만 정의, 구현 미완)
- ⚠️ Patient, Doctor CRUD API (Repository는 완성, Controller 미구현)
- ⚠️ 단위 테스트 (구조만 설정)

### 미구현 (선택 사항)

- ❌ 국제화 지원 (Timezone 처리)
- ❌ Visit API 전체 구현
- ❌ 통합 테스트

## 수행 중 가정한 사항

1. **서버 타임존**: 모든 시간은 한국 표준시(KST, Asia/Seoul)로 처리
2. **암호화**: 개인정보는 AES 암호화 사용 (환경변수로 키 관리)
3. **ID 생성**: 타임스탬프 기반 랜덤 ID 생성 방식 사용
4. **Soft Delete**: 삭제 시 deletedAt 필드를 사용한 논리적 삭제
5. **예약 시간**: 30분 단위 (HH:00, HH:30 형식만 허용)
6. **예약 부도**: 예약 시간 이후에도 상태가 CONFIRMED인 경우 자동으로 NO_SHOW 처리
7. **중복 예약 체크**: 같은 진료의, 같은 시간에는 하나의 예약만 가능

## 디렉토리/파일 구조

```
linediet_backend_project/
├── README.md                          # 본 문서
├── DB_DESIGN.md                       # 데이터베이스 설계 문서
├── NO_SHOW_DETECTION_DESIGN.md        # 예약 부도 감지 설계 문서
├── package.json                       # 프로젝트 설정
├── tsconfig.json                      # TypeScript 설정
├── serverless.yml                     # Serverless Framework 설정
├── jest.config.json                   # Jest 테스트 설정
├── handler.js                         # Lambda 핸들러
├── env/                               # 환경 설정
│   ├── config.js
│   ├── dev.yml
│   └── prod.yml
├── swagger/                           # API 문서
│   └── documentation.yml
└── src/                               # 소스 코드
    ├── index.ts                       # 메인 엔트리포인트
    ├── express.ts                     # Express 서버 설정
    ├── cores/                         # 핵심 유틸리티
    │   ├── types.ts                   # 공통 타입 정의
    │   └── commons.ts                 # 공통 유틸 함수
    ├── models/                        # 데이터 모델
    │   ├── patient.model.ts
    │   ├── doctor.model.ts
    │   ├── appointment.model.ts
    │   └── visit.model.ts
    ├── repositories/                  # 데이터 액세스 계층
    │   ├── base.repository.ts
    │   ├── patient.repository.ts
    │   ├── doctor.repository.ts
    │   ├── appointment.repository.ts
    │   └── visit.repository.ts
    ├── services/                      # 비즈니스 로직
    │   └── appointment.service.ts
    ├── controllers/                   # HTTP 컨트롤러
    │   └── appointment.controller.ts
    ├── api/                           # API 핸들러
    │   └── cron.handler.ts
    └── utils/                         # 유틸리티
        └── encryption.ts              # 암호화 유틸리티
```

## 빌드 및 실행 방법

### 1. 사전 준비

Node.js 20 이상이 설치되어 있어야 합니다.

```bash
# Node.js 버전 확인
node --version  # v20.0.0 이상
```

### 2. 의존성 설치

```bash
cd linediet_backend_project
npm install
```

### 3. 환경 변수 설정

로컬 개발을 위해 환경 변수를 설정합니다:

```bash
export ENV=dev
export STAGE=local
export ENCRYPTION_KEY=your-secret-encryption-key-change-in-production
```

### 4. 빌드

```bash
npm run build
```

### 5. 로컬 실행

#### Express 서버로 실행 (권장)

```bash
npm run express.dev
```

서버가 http://localhost:8806 에서 실행됩니다.

#### Serverless Offline으로 실행

```bash
npm run server.dev
```

### 6. AWS 배포

배포 전에 AWS 자격 증명을 설정해야 합니다:

```bash
# AWS CLI 설정
aws configure

# 개발 환경 배포
npm run deploy.dev

# 프로덕션 환경 배포
npm run deploy.prod
```

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

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 테스트
npm run test:watch
```

## 기타 의존성

### 핵심 라이브러리

- **aws-sdk**: AWS DynamoDB 클라이언트
- **crypto-js**: 개인정보 암호화를 위한 AES 암호화
- **express**: HTTP 서버 프레임워크
- **moment-timezone**: 타임존 처리 (국제화 지원 시)
- **uuid**: 고유 ID 생성

### 개발 도구

- **typescript**: 타입 안전성
- **jest**: 테스트 프레임워크
- **serverless**: AWS Lambda 배포 자동화
- **eslint/prettier**: 코드 품질 및 포매팅

## 과제 피드백

### 과제 난이도

- **난이도**: 적절함
- **시간**: 6시간 소요 (기본 구현 기준)
- 전체 구현을 완벽히 하려면 10-12시간 정도 필요할 것으로 예상됩니다.

### 제출은 하지 않았지만

- **Visit API 완전 구현**: 내원-접수 전체 플로우 (초진/재진 분기, 환자 정보 생성/업데이트)
- **통합 테스트**: 실제 DynamoDB Local을 사용한 E2E 테스트
- **국제화 지원**: Timezone별 예약 시간 처리 및 변환
- **Swagger/OpenAPI 문서**: 자동 생성되는 API 문서
- **로깅 시스템**: CloudWatch 연동 구조화된 로깅
- **에러 리포팅**: SNS를 통한 에러 알림

### 추가로 만들어본 부분

- **암호화 유틸리티**: 마스킹 기능 포함 (전화번호, 주민번호 패턴별)
- **Repository 패턴**: BaseRepository를 통한 DRY 원칙 적용
- **에러 코드 체계**: 명확한 에러 코드로 클라이언트가 대응 가능

## 라이센스

MIT
