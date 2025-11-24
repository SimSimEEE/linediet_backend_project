# Testing Guide

## 개요
LineDiet 진료 예약 관리 API는 단위 테스트와 통합 테스트로 구성된 포괄적인 테스트 스위트를 제공합니다.

## 테스트 구조

```
src/
├── __tests__/
│   ├── setup.ts                    # 테스트 환경 설정
│   └── integration/                # 통합 테스트
│       ├── appointment.api.test.ts
│       ├── patient.api.test.ts
│       ├── doctor.api.test.ts
│       └── visit.api.test.ts
└── services/
    ├── appointment.service.spec.ts # 단위 테스트
    ├── doctor.service.spec.ts
    ├── patient.service.spec.ts
    └── visit.service.spec.ts
```

## 테스트 실행

### 전체 테스트
```bash
npm test
```

### 단위 테스트만 실행
```bash
npm run test:unit
```

### 통합 테스트만 실행
```bash
npm run test:integration
```

### 커버리지 포함
```bash
npm run test:coverage
```

### Watch 모드 (개발 중)
```bash
npm run test:watch
```

## 단위 테스트

### 개요
각 서비스 계층의 비즈니스 로직을 독립적으로 테스트합니다.

### 테스트 파일
- `appointment.service.spec.ts` - 예약 생성, 조회, 취소, 부도 처리 (6개 테스트)
- `doctor.service.spec.ts` - 의사 CRUD, 검색, 활성 의사 조회 (16개 테스트)
- `patient.service.spec.ts` - 환자 CRUD, 암호화, 검색 (14개 테스트)
- `visit.service.spec.ts` - 내원 등록, 진료 완료, 이력 조회 (12개 테스트)

**총 48개 단위 테스트**

### Mock 전략
- Repository 계층을 mock하여 DynamoDB 의존성 제거
- 암호화 유틸리티 mock으로 테스트 격리
- TypeScript 타입 안정성 보장 (CoreModel<T> 패턴)

### 실행 예시
```bash
# 특정 서비스만 테스트
npm test -- appointment.service.spec.ts

# Coverage 포함
npm run test:coverage
```

## 통합 테스트

### 개요
HTTP API 엔드포인트를 실제로 호출하여 전체 시스템 통합을 검증합니다.

### 테스트 파일
- `appointment.api.test.ts` - 예약 API 엔드포인트
- `patient.api.test.ts` - 환자 API 엔드포인트
- `doctor.api.test.ts` - 의사 API 엔드포인트
- `visit.api.test.ts` - 내원 API 엔드포인트

### 테스트 시나리오

#### Appointment API
- ✅ 예약 생성 (유효한 시간)
- ✅ 과거 시간 예약 거부
- ✅ 잘못된 시간 형식 거부
- ✅ 중복 예약 방지
- ✅ 날짜/의사별 예약 조회
- ✅ 예약자 정보로 검색
- ✅ 예약 시간 변경
- ✅ 예약 취소

#### Patient API
- ✅ 환자 생성 (개인정보 암호화)
- ✅ 필수 필드 검증
- ✅ 환자 조회 (ID, 목록)
- ✅ 이름/전화번호로 검색
- ✅ 환자 정보 수정
- ✅ 환자 삭제 (soft delete)

#### Doctor API
- ✅ 의사 생성
- ✅ 의사 조회 (ID, 목록)
- ✅ 활성 의사만 조회
- ✅ 이름으로 검색
- ✅ 의사 정보 수정
- ✅ 의사 비활성화
- ✅ 의사 삭제 (soft delete)

#### Visit API
- ✅ 재진 환자 내원 등록
- ✅ 초진 환자 내원 등록 (환자 정보 자동 생성)
- ✅ 필수 정보 검증
- ✅ 내원 정보 조회 (patient$/doctor$ 자동 populate)
- ✅ 환자별 내원 이력
- ✅ 날짜 범위로 검색
- ✅ 내원 정보 수정
- ✅ 진료 완료 처리

### 실행 예시
```bash
# 전체 통합 테스트
npm run test:integration

# 특정 API만 테스트
npm test -- appointment.api.test.ts
```

## 테스트 환경 설정

### setup.ts
```typescript
// 테스트용 환경 변수
process.env.STAGE = 'test';
process.env.PATIENT_TABLE = 'appointment-patients-test';
process.env.DOCTOR_TABLE = 'appointment-doctors-test';
process.env.APPOINTMENT_TABLE = 'appointment-appointments-test';
process.env.VISIT_TABLE = 'appointment-visits-test';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';

// AWS SDK Mock
jest.mock('aws-sdk', () => { ... });
```

## 커버리지 목표

| 영역 | 목표 | 현재 상태 |
|------|------|-----------|
| Statements | 80% | ✅ 달성 |
| Branches | 70% | ✅ 달성 |
| Functions | 80% | ✅ 달성 |
| Lines | 80% | ✅ 달성 |

## CI/CD 통합

### GitHub Actions 예시
```yaml
- name: Run tests
  run: npm test

- name: Run integration tests
  run: npm run test:integration

- name: Upload coverage
  run: npm run test:coverage
```

## 베스트 프랙티스

### 1. 테스트 격리
- 각 테스트는 독립적으로 실행 가능해야 함
- beforeEach에서 모든 mock 초기화
- 테스트 간 상태 공유 금지

### 2. Mock 관리
```typescript
// Good: Repository를 mock하여 DB 의존성 제거
jest.mock('../repositories');

// Good: 특정 케이스에 맞는 mock 값 설정
repo.getById.mockResolvedValue({ id: 'test', ... });
```

### 3. 에러 케이스 테스트
```typescript
// 필수: 에러 처리 검증
it('should reject invalid input', async () => {
    await expect(service.create(invalidData))
        .rejects.toThrow('E_INVALID_INPUT');
});
```

### 4. 통합 테스트 순서
```typescript
beforeAll(async () => {
    // 1. 의사 생성
    // 2. 환자 생성
    // 3. 테스트 데이터 준비
});
```

## 트러블슈팅

### TypeScript 오류
```bash
# tsconfig 확인
npm run lint
```

### Mock이 작동하지 않을 때
```typescript
// beforeEach에서 mock 초기화 확인
beforeEach(() => {
    jest.clearAllMocks();
});
```

### 통합 테스트 실패
```bash
# 테스트 환경 변수 확인
cat src/__tests__/setup.ts

# Express 서버 포트 충돌 확인
lsof -i :8807
```

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [Supertest 사용법](https://github.com/visionmedia/supertest)
- [TypeScript + Jest 설정](https://kulshekhar.github.io/ts-jest/)
