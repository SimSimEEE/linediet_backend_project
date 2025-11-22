# Cursor AI 사용 규칙

## 코드 작성 원칙

### 1. 타입 안전성
- 모든 변수, 함수 파라미터, 리턴 타입에 명시적 타입 지정
- `any` 타입 사용 최소화
- Interface보다 Type 선호 (유연성)

### 2. 에러 처리
- 모든 async 함수는 try-catch 포함
- 에러 메시지에 명확한 에러 코드 포함 (E_DUPLICATED, E_NOT_FOUND 등)
- 로그에 컨텍스트 정보 포함 (`[ServiceName] Message`)

### 3. 네이밍 컨벤션
- 파일: kebab-case (예: `appointment.service.ts`)
- 클래스: PascalCase (예: `AppointmentService`)
- 함수/변수: camelCase (예: `createAppointment`)
- 상수: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)
- Private 멤버: underscore prefix (예: `_internalMethod`)

### 4. 코드 구조
```typescript
// 1. Imports
import { External } from 'external-lib';
import { Internal } from '../internal';
import { Type } from './types';

// 2. Constants
const CONSTANT_VALUE = 'value';

// 3. Interfaces/Types
interface MyInterface { }

// 4. Class/Function
export class MyClass {
    // 4-1. Properties
    private repo: Repository;
    
    // 4-2. Constructor
    constructor() { }
    
    // 4-3. Public methods
    public async method() { }
    
    // 4-4. Private methods
    private helper() { }
}
```

### 5. 주석
- 복잡한 로직에만 주석 추가
- JSDoc 형식으로 public API 문서화
- TODO, FIXME, WARN 태그 활용

```typescript
/**
 * 예약을 생성합니다.
 * @param data 예약 데이터
 * @returns 생성된 예약
 * @throws E_DUPLICATED 중복 예약인 경우
 */
async createAppointment(data: CreateData): Promise<Appointment> {
    // 중복 체크 - 같은 진료의, 같은 시간 확인
    const conflict = await this.checkConflict();
    // TODO: 알림 전송 기능 추가
}
```

## 디자인 패턴

### Repository Pattern
```typescript
// Base Repository
abstract class BaseRepository<T> {
    protected tableName: string;
    create(), getById(), update(), delete()
}

// Specific Repository
class AppointmentRepository extends BaseRepository<Appointment> {
    // 특화된 쿼리 메서드
    queryByDoctorAndDate()
}
```

### Service Pattern
```typescript
class AppointmentService {
    private repo: AppointmentRepository;
    
    // 비즈니스 로직
    async createAppointment() {
        // 1. 검증
        // 2. 변환
        // 3. 저장
        // 4. 후처리
    }
}
```

### Controller Pattern
```typescript
class AppointmentController {
    private service: AppointmentService;
    
    create = async (req: Request, res: Response) => {
        try {
            const result = await this.service.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            this.handleError(error, res);
        }
    };
}
```

## DynamoDB 규칙

### 1. 테이블 설계
- Primary Key: 단순 `id` (String)
- GSI: 자주 조회하는 패턴 기준 (예: doctorId-appointmentDate)
- Scan 최소화, Query 최대화

### 2. 인덱스 명명
- `{hashKey}-index` 또는 `{hashKey}-{rangeKey}-index`
- 예: `phoneNumber-index`, `doctorId-appointmentDate-index`

### 3. 시간 데이터
- ISO 8601 형식 사용
- Timezone 명시 (예: `2025-01-25T14:00:00+09:00`)
- 한국 시간 기준 (KST, +09:00)

## 보안 규칙

### 1. 개인정보 암호화
- 전화번호, 주민번호는 저장 전 AES 암호화
- 조회 시 복호화
- 로깅 시 마스킹 (`maskPhone`, `maskSSN`)

### 2. 환경 변수
- 민감한 정보는 환경 변수로 관리
- 암호화 키: `ENCRYPTION_KEY`
- AWS 리전: `DEFAULT_REGION`

## 테스트 규칙

### 1. 파일 구조
- 테스트 파일: `*.spec.ts`
- 같은 디렉토리에 위치

### 2. 테스트 작성
```typescript
describe('ServiceName', () => {
    describe('methodName', () => {
        it('should do something', async () => {
            // Given
            const input = { };
            
            // When
            const result = await service.method(input);
            
            // Then
            expect(result).toBeDefined();
        });
    });
});
```

## 문서화 규칙

### 1. README.md
- 프로젝트 개요
- 빌드/실행 방법
- API 사용 예시
- 구현 현황

### 2. 기술 문서
- DB 설계: ERD 포함
- 아키텍처: 다이어그램 포함
- API: Swagger/OpenAPI 명세

### 3. 코드 주석
- 복잡한 비즈니스 로직
- 주요 의사결정 이유
- 제약사항 및 주의사항

## Git 규칙

### 1. 커밋 메시지
```
feat: Add appointment creation API
fix: Fix duplicate booking check
docs: Update README
refactor: Improve error handling
test: Add appointment service tests
```

### 2. 브랜치 전략
- `main`: 프로덕션
- `develop`: 개발
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정

## AI 활용 가이드

### 요청 시 포함할 정보
1. 무엇을 만들지 (What)
2. 어떤 패턴/스타일로 (How)
3. 참조할 예제 코드 (Reference)
4. 제약사항 (Constraints)

### 예시
```
AppointmentService에 예약 변경 메서드 추가해줘.
- 기존 updateAppointment 패턴 참고
- 과거 시간 체크 포함
- 중복 예약 체크 포함
- 에러 코드: E_PAST_TIME, E_DUPLICATED
```
