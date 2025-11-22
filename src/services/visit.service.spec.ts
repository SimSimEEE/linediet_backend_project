/**
 * `services/visit.service.spec.ts`
 * - Unit tests for VisitService
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import { VisitService } from './visit.service';
import { VisitRepository, PatientRepository, DoctorRepository, AppointmentRepository } from '../repositories';
import { PatientService } from './patient.service';

// Mock dependencies
jest.mock('../repositories');
jest.mock('./patient.service');

describe('VisitService', () => {
    let service: VisitService;
    let visitRepo: jest.Mocked<VisitRepository>;
    let patientRepo: jest.Mocked<PatientRepository>;
    let doctorRepo: jest.Mocked<DoctorRepository>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let appointmentRepo: jest.Mocked<AppointmentRepository>;
    let patientService: jest.Mocked<PatientService>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new VisitService();
        visitRepo = (service as any).visitRepo;
        patientRepo = (service as any).patientRepo;
        doctorRepo = (service as any).doctorRepo;
        appointmentRepo = (service as any).appointmentRepo;
        patientService = (service as any).patientService;
    });

    describe('createVisit', () => {
        it('should create visit for existing patient (follow-up)', async () => {
            // Arrange
            const visitData = {
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                chiefComplaint: '두통',
            };

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            visitRepo.create.mockResolvedValue({
                type: 'visit',
                id: 'visit-001',
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                visitType: 'follow-up',
                chiefComplaint: '두통',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.createVisit(visitData);

            // Assert
            expect(visitRepo.create).toHaveBeenCalled();
            expect(result.patientId).toBe('patient-123');
            expect(result.visitType).toBe('follow-up');
        });

        it('should create visit for first-time patient', async () => {
            // Arrange
            const visitData = {
                doctorId: 'doctor-456',
                patientName: '신규환자',
                phoneNumber: '010-9999-8888',
                ssn: '900101-1234567',
                chiefComplaint: '감기',
            };

            patientService.createPatient.mockResolvedValue({
                type: 'patient',
                id: 'patient-new',
                name: '신규환자',
                phoneNumber: '010-9999-8888',
                ssn: '900101-1234567',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            });

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            visitRepo.create.mockResolvedValue({
                type: 'visit',
                id: 'visit-002',
                patientId: 'patient-new',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                visitType: 'first',
                chiefComplaint: '감기',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-new',
                name: '신규환자',
                phoneNumber: '010-9999-8888',
                ssn: '900101-1234567',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            });

            // Act
            const result = await service.createVisit(visitData);

            // Assert
            expect(patientService.createPatient).toHaveBeenCalledWith({
                name: '신규환자',
                phoneNumber: '010-9999-8888',
                ssn: '900101-1234567',
                birthYearMonth: undefined,
            });
            expect(result.visitType).toBe('first');
        });

        it('should reject when doctor not found', async () => {
            // Arrange
            doctorRepo.getById.mockResolvedValue(null);

            const visitData = {
                patientId: 'patient-123',
                doctorId: 'nonexistent',
            };

            // Act & Assert
            await expect(service.createVisit(visitData)).rejects.toThrow('E_NOT_FOUND');
        });

        it('should reject first-time visit without required patient info', async () => {
            // Arrange - missing phoneNumber and SSN
            const invalidData = {
                doctorId: 'doctor-456',
                patientName: '환자',
            };

            // Act & Assert
            await expect(service.createVisit(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });

        it('should update existing patient info if provided', async () => {
            // Arrange
            const visitDataWithUpdate = {
                patientId: 'patient-456',
                doctorId: 'doctor-789',
                patientName: '홍길동 (업데이트)',
                phoneNumber: '010-1111-2222',
            };

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-789',
                name: '박의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            visitRepo.create.mockResolvedValue({
                type: 'visit',
                id: 'visit-003',
                patientId: 'patient-456',
                doctorId: 'doctor-789',
                checkInTime: '2024-01-20T15:00:00+09:00',
                visitType: 'follow-up',
                createdAt: '2024-01-20T15:00:00+09:00',
                updatedAt: '2024-01-20T15:00:00+09:00',
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-456',
                name: '홍길동 (업데이트)',
                phoneNumber: '010-1111-2222',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-20T15:00:00+09:00',
            });

            // Act
            await service.createVisit(visitDataWithUpdate);

            // Assert
            expect(patientService.updatePatient).toHaveBeenCalledWith('patient-456', {
                name: visitDataWithUpdate.patientName,
                phoneNumber: visitDataWithUpdate.phoneNumber,
                ssn: undefined,
                birthYearMonth: undefined,
            });
        });
    });

    describe('getVisit', () => {
        it('should return populated visit', async () => {
            // Arrange
            const visitMock = {
                type: 'visit' as const,
                id: 'visit-123',
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            };

            const patientMock = {
                type: 'patient' as const,
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            };

            const doctorMock = {
                type: 'doctor' as const,
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            };

            visitRepo.getById.mockResolvedValueOnce(visitMock);
            patientRepo.getById.mockResolvedValueOnce(patientMock);
            doctorRepo.getById.mockResolvedValueOnce(doctorMock);

            // Act
            const result = await service.getVisit('visit-123');

            // Assert
            expect(result).toBeTruthy();
            expect(result?.patient$).toEqual({ id: 'patient-123', name: '홍길동' });
            expect(result?.doctor$).toEqual({ id: 'doctor-456', name: '김의사' });
        });

        it('should return null when visit not found', async () => {
            // Arrange
            visitRepo.getById.mockResolvedValue(null);

            // Act
            const result = await service.getVisit('nonexistent');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updateVisit', () => {
        it('should update visit', async () => {
            // Arrange
            visitRepo.getById.mockResolvedValue({
                type: 'visit',
                id: 'visit-123',
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            });

            visitRepo.update.mockResolvedValue({
                type: 'visit',
                id: 'visit-123',
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                diagnosis: '두통',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T15:00:00+09:00',
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.updateVisit('visit-123', { diagnosis: '두통' });

            // Assert
            expect(visitRepo.update).toHaveBeenCalledWith('visit-123', { diagnosis: '두통' });
            expect(result.diagnosis).toBe('두통');
        });

        it('should throw error when visit not found', async () => {
            // Arrange
            visitRepo.getById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.updateVisit('nonexistent', { diagnosis: 'test' })).rejects.toThrow('E_NOT_FOUND');
        });
    });

    describe('completeVisit', () => {
        it('should complete visit with diagnosis and treatment', async () => {
            // Arrange
            visitRepo.getById.mockResolvedValue({
                type: 'visit',
                id: 'visit-123',
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T14:00:00+09:00',
            });

            visitRepo.update.mockResolvedValue({
                type: 'visit',
                id: 'visit-123',
                patientId: 'patient-123',
                doctorId: 'doctor-456',
                checkInTime: '2024-01-20T14:00:00+09:00',
                diagnosis: '감기',
                treatment: '해열제 처방',
                completedAt: '2024-01-20T15:00:00+09:00',
                createdAt: '2024-01-20T14:00:00+09:00',
                updatedAt: '2024-01-20T15:00:00+09:00',
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.completeVisit('visit-123', {
                diagnosis: '감기',
                treatment: '해열제 처방',
            });

            // Assert
            expect(result.completedAt).toBeDefined();
            expect(result.diagnosis).toBe('감기');
            expect(result.treatment).toBe('해열제 처방');
        });
    });

    describe('listVisitsByPatient', () => {
        it('should return visits for patient excluding deleted ones', async () => {
            // Arrange
            visitRepo.queryByPatient.mockResolvedValue({
                items: [
                    {
                        type: 'visit',
                        id: 'visit-1',
                        patientId: 'patient-123',
                        doctorId: 'doctor-456',
                        checkInTime: '2024-01-20T14:00:00+09:00',
                        createdAt: '2024-01-20T14:00:00+09:00',
                        updatedAt: '2024-01-20T14:00:00+09:00',
                    },
                    {
                        type: 'visit',
                        id: 'visit-2',
                        patientId: 'patient-123',
                        doctorId: 'doctor-456',
                        checkInTime: '2024-01-19T10:00:00+09:00',
                        deletedAt: '2024-01-19T11:00:00+09:00',
                        createdAt: '2024-01-19T10:00:00+09:00',
                        updatedAt: '2024-01-19T10:00:00+09:00',
                    },
                ],
                count: 2,
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.listVisitsByPatient('patient-123');

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('visit-1');
        });
    });

    describe('listVisitsByDateRange', () => {
        it('should return visits within date range', async () => {
            // Arrange
            visitRepo.queryByPatientAndDateRange.mockResolvedValue({
                items: [
                    {
                        type: 'visit',
                        id: 'visit-1',
                        patientId: 'patient-123',
                        doctorId: 'doctor-456',
                        checkInTime: '2024-01-20T14:00:00+09:00',
                        createdAt: '2024-01-20T14:00:00+09:00',
                        updatedAt: '2024-01-20T14:00:00+09:00',
                    },
                ],
                count: 1,
            });

            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.listVisitsByDateRange('patient-123', '2024-01-01', '2024-01-31');

            // Assert
            expect(visitRepo.queryByPatientAndDateRange).toHaveBeenCalledWith(
                'patient-123',
                '2024-01-01',
                '2024-01-31',
            );
            expect(result).toHaveLength(1);
        });
    });
});
