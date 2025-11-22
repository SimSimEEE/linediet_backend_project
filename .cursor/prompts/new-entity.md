# 새 엔티티 추가 프롬프트

## 사용 시점
새로운 데이터 모델과 관련 레이어(Repository, Service, Controller)를 추가할 때

## 프롬프트 템플릿

```
{EntityName} 엔티티를 추가해줘.

요구사항:
1. src/models/{entity}.model.ts 생성
   - 인터페이스 정의
   - PK, SK 정의
   - 필수/선택 필드 구분
   - 타임스탬프 자동 관리

2. src/repositories/{entity}.repository.ts 생성
   - BaseRepository 상속
   - 엔티티별 특수 쿼리 메서드
   - GSI 활용 쿼리 (필요시)

3. src/services/{entity}.service.ts 생성
   - CRUD 비즈니스 로직
   - 검증 로직
   - 에러 처리

4. src/controllers/{entity}.controller.ts 생성
   - HTTP 요청/응답 처리
   - 에러 → HTTP 상태 코드 매핑
   - 입력 검증

참고 패턴: appointment.* 파일들
```

## 실제 사용 예시

### 예시 1: Patient 엔티티 추가
```
Patient 엔티티를 추가해줘.

요구사항:
1. src/models/patient.model.ts 생성
   - patientId (PK)
   - name, phoneNumber, ssn
   - phoneNumber, ssn은 암호화 필요
   - createdAt, updatedAt, deletedAt

2. src/repositories/patient.repository.ts 생성
   - BaseRepository<PatientModel> 상속
   - findByPhoneNumber() 메서드 추가 (GSI 사용)

3. src/services/patient.service.ts 생성
   - createPatient: 중복 전화번호 체크
   - 개인정보 암호화 자동 처리

4. src/controllers/patient.controller.ts 생성
   - GET /patients - 목록
   - GET /patients/:id - 단건
   - POST /patients - 생성
   - PUT /patients/:id - 수정
   - DELETE /patients/:id - 삭제

참고: appointment.* 파일들의 구조와 패턴
```

### 예시 2: Visit 엔티티 추가
```
Visit (내원) 엔티티를 추가해줘.

요구사항:
1. src/models/visit.model.ts
   - visitId (PK)
   - appointmentId (FK)
   - patientId, doctorId
   - checkInTime, checkOutTime
   - status: CHECKED_IN, CHECKED_OUT
   - notes (진료 메모)

2. src/repositories/visit.repository.ts
   - queryByPatient(patientId, dateRange)
   - queryByDoctor(doctorId, date)
   - findByAppointment(appointmentId)

3. src/services/visit.service.ts
   - checkIn: 예약 확인 후 체크인
   - checkOut: 체크아웃 처리
   - searchVisits: 검색 기능

4. src/controllers/visit.controller.ts
   - POST /visits/check-in
   - POST /visits/:id/check-out
   - GET /visits?patientId=xxx
   - GET /visits?doctorId=xxx&date=xxx

참고: AppointmentService의 비즈니스 로직 패턴
```

## 체크리스트

생성 후 확인사항:
- [ ] 모델: 타입 정의, PK/SK 명확
- [ ] Repository: BaseRepository 상속, 특수 쿼리 구현
- [ ] Service: 비즈니스 로직, 에러 처리
- [ ] Controller: HTTP 핸들러, 에러 매핑
- [ ] serverless.yml: DynamoDB 테이블 추가
- [ ] GSI 필요시 인덱스 정의
- [ ] 암호화 필요 필드 처리
- [ ] 타입스크립트 컴파일 확인

## 팁

1. **BaseRepository 활용**: 공통 CRUD는 상속으로 해결
2. **GSI 전략**: 자주 쿼리하는 필드는 GSI 생성
3. **에러 일관성**: 기존 에러 코드 체계 따르기 (E_NOT_FOUND, E_INVALID_INPUT 등)
4. **타입 안전성**: 모든 메서드에 명확한 타입 정의
5. **참고 코드**: appointment.* 파일들이 가장 완성도 높은 예시
