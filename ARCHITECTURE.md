# 프로젝트 구조 및 아키텍처

## 디렉토리 구조

```
linediet_backend_project/
├── src/
│   ├── cores/                    # 핵심 유틸리티 및 공통 타입
│   │   ├── types.ts              # 타입 정의 (ModelType, AppointmentStatus 등)
│   │   └── commons.ts            # 공통 유틸 함수 ($T, $U, 로깅)
│   │
│   ├── models/                   # 데이터 모델 정의
│   │   ├── patient.model.ts      # 환자 모델
│   │   ├── doctor.model.ts       # 진료의 모델
│   │   ├── appointment.model.ts  # 예약 모델
│   │   ├── visit.model.ts        # 내원 모델
│   │   └── index.ts              # 모델 export
│   │
│   ├── repositories/             # 데이터 액세스 계층
│   │   ├── base.repository.ts        # 기본 Repository (CRUD)
│   │   ├── patient.repository.ts     # 환자 Repository
│   │   ├── doctor.repository.ts      # 진료의 Repository
│   │   ├── appointment.repository.ts # 예약 Repository
│   │   ├── visit.repository.ts       # 내원 Repository
│   │   └── index.ts                  # Repository export
│   │
│   ├── services/                 # 비즈니스 로직 계층
│   │   ├── appointment.service.ts    # 예약 서비스
│   │   └── appointment.service.spec.ts # 서비스 테스트
│   │
│   ├── controllers/              # HTTP 컨트롤러
│   │   └── appointment.controller.ts # 예약 컨트롤러
│   │
│   ├── api/                      # API 핸들러
│   │   └── cron.handler.ts       # Cron 작업 핸들러
│   │
│   ├── utils/                    # 유틸리티
│   │   ├── encryption.ts         # 암호화 유틸
│   │   └── encryption.spec.ts    # 암호화 테스트
│   │
│   ├── express.ts                # Express 서버 설정
│   └── index.ts                  # 메인 엔트리포인트
│
├── env/                          # 환경 설정
├── swagger/                      # API 문서
├── README.md                     # 프로젝트 설명
├── DB_DESIGN.md                  # DB 설계 문서
└── NO_SHOW_DETECTION_DESIGN.md   # 부도 감지 설계 문서
```

## 아키텍처 패턴

### 1. Layered Architecture (계층형 아키텍처)

```
┌─────────────────────────────────────┐
│         Controller Layer            │ ← HTTP 요청/응답 처리
├─────────────────────────────────────┤
│         Service Layer               │ ← 비즈니스 로직
├─────────────────────────────────────┤
│         Repository Layer            │ ← 데이터 액세스
├─────────────────────────────────────┤
│         DynamoDB                    │ ← 데이터 저장소
└─────────────────────────────────────┘
```

### 2. 사용된 디자인 패턴

#### Repository Pattern
- 데이터 액세스 로직을 비즈니스 로직에서 분리
- `BaseRepository`에서 공통 CRUD 구현
- 각 엔티티별 Repository에서 특화된 쿼리 구현

```typescript
// BaseRepository: 공통 CRUD
abstract class BaseRepository<T> {
    create(), getById(), update(), delete()
}

// AppointmentRepository: 특화 쿼리
class AppointmentRepository extends BaseRepository<AppointmentModel> {
    queryByDoctorAndDate()
    findNoShowCandidates()
}
```

#### Strategy Pattern
- 암호화 전략을 독립적으로 구현
- 다양한 암호화 방식 적용 가능

```typescript
class EncryptionService {
    encrypt()    // AES 암호화
    decrypt()    // AES 복호화
    hash()       // SHA-256 해싱
}
```

#### Factory Pattern
- ID 생성 로직을 Factory 메서드로 캡슐화

```typescript
protected generateId(): string {
    return `${this.modelType}-${generateId()}`;
}
```

#### Template Method Pattern
- BaseRepository의 update에서 공통 로직 정의
- 하위 Repository에서 필요시 오버라이드

```typescript
async update(id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.getById(id);
    // 공통 업데이트 로직
    const updatedItem = { ...existing, ...updates, updatedAt: nowKST() };
    await dynamoDB.put(params).promise();
    return updatedItem;
}
```

### 3. 코드 컨벤션

#### 네이밍

- **파일명**: kebab-case (예: `appointment.service.ts`)
- **클래스명**: PascalCase (예: `AppointmentService`)
- **함수/변수**: camelCase (예: `createAppointment`)
- **상수**: UPPER_SNAKE_CASE (예: `ENCRYPTION_KEY`)
- **타입/인터페이스**: PascalCase (예: `AppointmentModel`)

#### 코드 스타일

```typescript
// 1. Import 순서
import { External } from 'external-lib';  // 외부 라이브러리
import { Internal } from '../internal';   // 내부 모듈
import { Type } from './types';           // 로컬 타입

// 2. 함수 선언
async functionName(param: Type): Promise<ReturnType> {
    // 로직
}

// 3. 에러 처리
try {
    // 로직
} catch (error) {
    _err('[Context] Message:', error);
    throw error;
}

// 4. 로깅
_log('[Service] Created:', id);
_inf('[Info] Message');
_err('[Error] Message:', error);
```

#### TypeScript 규칙

- strict mode 사용
- any 타입 지양 (불가피한 경우만 사용)
- 명시적 타입 선언
- Interface보다 Type 선호 (필요시 Interface 사용)

### 4. 에러 처리 전략

#### 에러 코드 체계

```typescript
// E_: Error prefix
E_DUPLICATED      // 중복 (409)
E_NOT_FOUND       // 찾을 수 없음 (404)
E_INVALID_INPUT   // 잘못된 입력 (400)
E_PAST_TIME       // 과거 시간 (400)
E_INTERNAL        // 내부 오류 (500)
```

#### 에러 응답 형식

```json
{
  "error": "E_DUPLICATED",
  "message": "Doctor already has an appointment at this time",
  "code": "E_DUPLICATED",
  "statusCode": 409
}
```

### 5. 보안 고려사항

#### 개인정보 암호화

- AES-256 암호화
- 전화번호, 주민번호 암호화 저장
- 복호화는 필요한 경우에만

#### 로깅 시 마스킹

```typescript
// 로깅 시 개인정보 마스킹
_log('Phone:', maskPhone(phoneNumber));  // "010-****-5678"
_log('SSN:', maskSSN(ssn));              // "123456-*******"
```

#### Soft Delete

- 실제 삭제 대신 `deletedAt` 플래그 사용
- 데이터 복구 및 감사 추적 가능

### 6. 성능 최적화

#### DynamoDB 최적화

1. **적절한 인덱스 설계**
   - GSI를 통한 쿼리 최적화
   - Scan 최소화

2. **배치 작업**
   - BatchGet으로 여러 아이템 조회
   - BatchWrite 고려 (향후)

3. **페이지네이션**
   - Limit + ExclusiveStartKey 사용

#### 코드 최적화

1. **Promise.all 활용**
   ```typescript
   const [doctors, patients] = await Promise.all([
       getDoctors(),
       getPatients()
   ]);
   ```

2. **메모리 효율**
   - 대용량 데이터는 스트림 처리 고려

## 확장 가능성

### 1. 새 엔티티 추가

```typescript
// 1. 모델 정의
interface NewModel extends CoreModel<'new'> { }

// 2. Repository 생성
class NewRepository extends BaseRepository<NewModel> { }

// 3. Service 생성
class NewService { }

// 4. Controller 생성
class NewController { }
```

### 2. 새 기능 추가

- Service 레이어에 메서드 추가
- Controller에서 라우트 추가
- 필요시 Repository에 쿼리 추가

### 3. 다른 데이터베이스로 마이그레이션

- Repository 인터페이스는 유지
- 구현체만 변경 (예: DynamoDB → RDS)
