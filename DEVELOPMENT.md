# 개발 가이드

## 시작하기

### 1. 환경 설정

```bash
# 1. Node.js 버전 확인 및 설치
nvm use

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
export ENV=dev
export STAGE=local
export ENCRYPTION_KEY=your-secret-key-change-in-production
```

### 2. 개발 서버 실행

```bash
# TypeScript 빌드 + Express 서버 실행 (Hot reload)
npm run express.dev

# 또는 Serverless Offline
npm run server.dev
```

### 3. 테스트

```bash
# 전체 테스트
npm test

# Watch 모드
npm run test:watch
```

## 개발 워크플로우

### 새 API 추가

1. **모델 정의** (`src/models/`)
   ```typescript
   export interface NewModel extends CoreModel<'new'> {
       field: string;
   }
   ```

2. **Repository 생성** (`src/repositories/`)
   ```typescript
   export class NewRepository extends BaseRepository<NewModel> {
       constructor() {
           super(tableName, 'new');
       }
   }
   ```

3. **Service 생성** (`src/services/`)
   ```typescript
   export class NewService {
       private repo: NewRepository;
       
       async create(data: Partial<NewModel>) {
           return await this.repo.create(data);
       }
   }
   ```

4. **Controller 생성** (`src/controllers/`)
   ```typescript
   export class NewController {
       create = async (req: Request, res: Response) => {
           const result = await this.service.create(req.body);
           res.json(result);
       };
   }
   ```

5. **라우트 등록** (`src/express.ts`)
   ```typescript
   app.post('/new', controller.create);
   ```

### 데이터베이스 스키마 변경

1. `serverless.yml`에서 테이블 정의 수정
2. GSI 추가/변경
3. `npm run deploy.dev`로 배포
4. Repository에 새 쿼리 메서드 추가

## 코딩 가이드라인

### 네이밍 규칙

- 파일: `kebab-case.ts`
- 클래스: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`

### 에러 처리

```typescript
// Service에서 에러 throw
if (!valid) {
    throw new Error('E_INVALID_INPUT: Invalid data');
}

// Controller에서 catch하여 적절한 HTTP 상태 코드 반환
try {
    const result = await service.method();
    res.json(result);
} catch (error) {
    if (error.message.includes('E_NOT_FOUND')) {
        return res.status(404).json({ error: 'E_NOT_FOUND', message });
    }
    res.status(500).json({ error: 'E_INTERNAL', message });
}
```

### 로깅

```typescript
import { _log, _inf, _err } from './cores/commons';

_log('[Service] Normal log');
_inf('[Service] Information');
_err('[Service] Error:', error);
```

### 개인정보 처리

```typescript
import { encrypt, decrypt, maskPhone } from './utils/encryption';

// 저장 시 암호화
const encrypted = encrypt(phoneNumber);
await save({ phone: encrypted });

// 조회 시 복호화
const phone = decrypt(data.phone);

// 로깅 시 마스킹
_log('Phone:', maskPhone(phoneNumber));
```

## 배포

### 개발 환경

```bash
npm run deploy.dev
```

### 프로덕션 환경

```bash
npm run deploy.prod
```

### 배포 확인

```bash
# 배포 정보 확인
npm run info.dev

# 로그 확인
npm run logs.dev
```

## 문제 해결

### 빌드 에러

```bash
# 캐시 삭제 후 재빌드
rm -rf dist node_modules
npm install
npm run build
```

### DynamoDB 권한 에러

- AWS IAM 역할 확인
- serverless.yml의 iamRoleStatements 확인

### Cron 작업 미실행

```bash
# 수동 실행으로 테스트
aws lambda invoke \
    --function-name linediet-appointment-api-dev-lambda \
    --payload '{"cron":{"name":"NO_SHOW_DETECTION"}}' \
    response.json
```

## 유용한 명령어

```bash
# 코드 품질 체크
npm run lint

# TypeScript 컴파일 체크
tsc --noEmit

# 테스트 커버리지
npm test -- --coverage

# 로컬 DynamoDB 사용 (선택)
docker run -p 8000:8000 amazon/dynamodb-local
```

## Git 워크플로우

```bash
# 기능 브랜치 생성
git checkout -b feature/new-feature

# 커밋
git add .
git commit -m "feat: Add new feature"

# 푸시
git push origin feature/new-feature

# Pull Request 생성
```

## 참고 문서

- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
