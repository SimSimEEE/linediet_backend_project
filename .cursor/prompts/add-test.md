# 테스트 추가 프롬프트

## 사용 시점
Service, Repository, Controller 단위 테스트를 추가할 때

## 프롬프트 템플릿

```
{ServiceName}.spec.ts 단위 테스트를 작성해줘.

요구사항:
1. 테스트 환경 설정
   - Jest + TypeScript
   - Mock 설정 (Repository, 외부 의존성)
   - 테스트 데이터 준비

2. 테스트 케이스
   - 정상 케이스: {구체적인 시나리오}
   - 에러 케이스: {예상 에러들}
   - 엣지 케이스: {경계값, null/undefined 등}

3. 검증 항목
   - 반환값 검증
   - 메서드 호출 검증 (spy)
   - 에러 throw 검증
   - 상태 변경 검증

참고: Jest best practices
```

## 실제 사용 예시

### 예시 1: AppointmentService 테스트
```
src/services/appointment.service.spec.ts 단위 테스트를 작성해줘.

테스트 대상 메서드:
1. createAppointment()
   - 정상: 예약 생성 성공
   - 에러: 중복 예약 (E_DUPLICATED)
   - 에러: 과거 시간 예약 (E_PAST_TIME)
   - 에러: 환자 없음 (E_NOT_FOUND)
   - 에러: 의사 없음 (E_NOT_FOUND)

2. cancelAppointment()
   - 정상: 예약 취소 성공
   - 에러: 예약 없음 (E_NOT_FOUND)
   - 에러: 이미 취소됨 (E_INVALID_INPUT)

3. markNoShows()
   - 정상: NO_SHOW 상태로 업데이트
   - 케이스: 대상 예약 없으면 빈 배열

Mock 설정:
- AppointmentRepository
- PatientRepository
- DoctorRepository

참고:
- moment-timezone 모킹
- 현재 시간 고정 (2024-01-15 10:00)
```

### 예시 2: AppointmentRepository 테스트
```
src/repositories/appointment.repository.spec.ts 테스트 작성해줘.

테스트 메서드:
1. queryByDoctorAndDate()
   - 정상: 특정 의사, 날짜의 예약 목록
   - 케이스: 결과 없으면 빈 배열

2. checkConflict()
   - 정상: 충돌 있으면 true
   - 정상: 충돌 없으면 false

3. findNoShowCandidates()
   - 정상: 기준 시간 이전의 CONFIRMED 예약들
   - 필터: NO_SHOW, CANCELLED 제외

Mock 설정:
- DynamoDB DocumentClient
- query(), scan() 메서드

테스트 데이터:
- 샘플 예약 3개
- 다양한 상태 (CONFIRMED, CANCELLED, NO_SHOW)
```

### 예시 3: AppointmentController 테스트
```
src/controllers/appointment.controller.spec.ts 테스트 작성해줘.

테스트 엔드포인트:
1. create() - POST
   - 정상: 201, 예약 데이터 반환
   - 400: E_INVALID_INPUT
   - 404: E_NOT_FOUND (환자/의사)
   - 409: E_DUPLICATED
   - 500: E_INTERNAL

2. cancel() - POST
   - 정상: 200, 취소된 예약 반환
   - 404: E_NOT_FOUND

3. query() - GET
   - 정상: 200, 예약 목록
   - 400: 잘못된 쿼리 파라미터

Mock 설정:
- AppointmentService
- Request, Response 객체

검증:
- HTTP 상태 코드
- 응답 body 구조
- 에러 메시지
```

## 통합 테스트 예시

```
API 통합 테스트를 작성해줘.

환경:
- Express app
- Supertest
- 실제 DynamoDB Local 또는 Mock

테스트 시나리오:
1. 예약 생성 → 조회 → 취소 플로우
2. 중복 예약 시도 → 409 에러
3. 존재하지 않는 예약 취소 → 404 에러

파일: src/api/__tests__/appointment.integration.spec.ts

Before/After:
- 테스트 DB 초기화
- 테스트 데이터 셋업
- 테스트 후 클린업
```

## 체크리스트

테스트 작성 후 확인:
- [ ] 모든 public 메서드 테스트 커버
- [ ] 정상 케이스 + 에러 케이스 모두 포함
- [ ] Mock 제대로 설정 (실제 DB 호출 없음)
- [ ] 테스트 격리 (각 테스트 독립 실행)
- [ ] 의미있는 테스트 이름 (should, when 패턴)
- [ ] Arrange-Act-Assert 구조
- [ ] 테스트 실행: `npm test`
- [ ] 커버리지 확인: `npm run test:coverage`

## 테스트 네이밍 컨벤션

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should {expected behavior} when {condition}', () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toBe(...);
    });
    
    it('should throw E_ERROR_CODE when {error condition}', async () => {
      // ...
      await expect(service.methodName(input))
        .rejects.toThrow(E_ERROR_CODE);
    });
  });
});
```

## 팁

1. **Mock 전략**: 외부 의존성만 mock, 테스트 대상은 실제 인스턴스
2. **데이터 격리**: 각 테스트마다 독립적인 데이터 사용
3. **비동기 처리**: async/await 일관성있게 사용
4. **에러 테스트**: rejects.toThrow() 활용
5. **커버리지**: 최소 80% 목표, 핵심 로직은 100%
