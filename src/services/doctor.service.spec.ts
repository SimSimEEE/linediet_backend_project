/**
 * `services/doctor.service.spec.ts`
 * - Unit tests for DoctorService
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import { DoctorService } from './doctor.service';
import { DoctorRepository } from '../repositories';

// Mock dependencies
jest.mock('../repositories');

describe('DoctorService', () => {
    let service: DoctorService;
    let doctorRepo: jest.Mocked<DoctorRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new DoctorService();
        doctorRepo = (service as any).doctorRepo;
    });

    describe('createDoctor', () => {
        it('should create doctor with all fields', async () => {
            // Arrange
            const doctorData = {
                name: '김의사',
                specialization: '내과',
                licenseNumber: 'DOC-12345',
                isActive: true,
                notes: '오전 진료 가능',
            };

            doctorRepo.create.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-123',
                ...doctorData,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.createDoctor(doctorData);

            // Assert
            expect(doctorRepo.create).toHaveBeenCalledWith(doctorData);
            expect(result.id).toBe('doctor-123');
            expect(result.name).toBe(doctorData.name);
        });

        it('should create doctor with minimal fields (name only)', async () => {
            // Arrange
            const doctorData = { name: '박의사' };

            doctorRepo.create.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-456',
                name: '박의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.createDoctor(doctorData);

            // Assert
            expect(result.isActive).toBe(true); // Default value
        });

        it('should reject when name is missing', async () => {
            // Arrange
            const invalidData = { name: '' };

            // Act & Assert
            await expect(service.createDoctor(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });

        it('should set isActive to true by default', async () => {
            // Arrange
            const doctorData = { name: '이의사' };

            doctorRepo.create.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-789',
                name: '이의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            await service.createDoctor(doctorData);

            // Assert
            expect(doctorRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: true,
                }),
            );
        });

        it('should respect explicit isActive: false', async () => {
            // Arrange
            const doctorData = { name: '최의사', isActive: false };

            doctorRepo.create.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-999',
                name: '최의사',
                isActive: false,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            await service.createDoctor(doctorData);

            // Assert
            expect(doctorRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: false,
                }),
            );
        });
    });

    describe('getDoctor', () => {
        it('should return doctor by ID', async () => {
            // Arrange
            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-123',
                name: '김의사',
                specialization: '내과',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.getDoctor('doctor-123');

            // Assert
            expect(result).not.toBeNull();
            expect(result!.name).toBe('김의사');
        });

        it('should return null when doctor not found', async () => {
            // Arrange
            doctorRepo.getById.mockResolvedValue(null);

            // Act
            const result = await service.getDoctor('nonexistent');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updateDoctor', () => {
        it('should update doctor fields', async () => {
            // Arrange
            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-123',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            const updates = { specialization: '외과' };

            doctorRepo.update.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-123',
                name: '김의사',
                specialization: '외과',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T11:00:00+09:00',
            });

            // Act
            const result = await service.updateDoctor('doctor-123', updates);

            // Assert
            expect(doctorRepo.update).toHaveBeenCalledWith('doctor-123', updates);
            expect(result.specialization).toBe('외과');
        });

        it('should throw error when doctor not found', async () => {
            // Arrange
            doctorRepo.getById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.updateDoctor('nonexistent', { name: 'Test' })).rejects.toThrow('E_NOT_FOUND');
        });

        it('should update isActive status', async () => {
            // Arrange
            doctorRepo.getById.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-123',
                name: '김의사',
                isActive: true,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            doctorRepo.update.mockResolvedValue({
                type: 'doctor',
                id: 'doctor-123',
                name: '김의사',
                isActive: false,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T11:00:00+09:00',
            });

            // Act
            const result = await service.updateDoctor('doctor-123', { isActive: false });

            // Assert
            expect(result.isActive).toBe(false);
        });
    });

    describe('deleteDoctor', () => {
        it('should soft delete doctor', async () => {
            // Arrange
            doctorRepo.delete.mockResolvedValue(true);

            // Act
            const result = await service.deleteDoctor('doctor-123');

            // Assert
            expect(result).toBe(true);
            expect(doctorRepo.delete).toHaveBeenCalledWith('doctor-123');
        });
    });

    describe('listDoctors', () => {
        it('should return all doctors excluding deleted ones', async () => {
            // Arrange
            doctorRepo.scan.mockResolvedValue({
                items: [
                    {
                        type: 'doctor',
                        id: 'doctor-1',
                        name: '의사1',
                        isActive: true,
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                    {
                        type: 'doctor',
                        id: 'doctor-2',
                        name: '의사2',
                        isActive: false,
                        deletedAt: '2024-01-15T12:00:00+09:00',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 2,
            });

            // Act
            const result = await service.listDoctors();

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('doctor-1');
        });

        it('should return only active doctors when activeOnly=true', async () => {
            // Arrange
            doctorRepo.getActiveDoctors.mockResolvedValue({
                items: [
                    {
                        type: 'doctor',
                        id: 'doctor-1',
                        name: '의사1',
                        isActive: true,
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 1,
            });

            // Act
            const result = await service.listDoctors(100, true);

            // Assert
            expect(doctorRepo.getActiveDoctors).toHaveBeenCalledWith({ limit: 100 });
            expect(result).toHaveLength(1);
        });

        it('should use default limit of 100', async () => {
            // Arrange
            doctorRepo.scan.mockResolvedValue({ items: [], count: 0 });

            // Act
            await service.listDoctors();

            // Assert
            expect(doctorRepo.scan).toHaveBeenCalledWith({ limit: 100 });
        });
    });

    describe('searchDoctors', () => {
        it('should search doctors by name excluding deleted ones', async () => {
            // Arrange
            doctorRepo.searchByName.mockResolvedValue({
                items: [
                    {
                        type: 'doctor',
                        id: 'doctor-1',
                        name: '김의사',
                        isActive: true,
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                    {
                        type: 'doctor',
                        id: 'doctor-2',
                        name: '김의사',
                        isActive: false,
                        deletedAt: '2024-01-15T12:00:00+09:00',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 2,
            });

            // Act
            const result = await service.searchDoctors('김의사');

            // Assert
            expect(doctorRepo.searchByName).toHaveBeenCalledWith('김의사');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('doctor-1');
        });

        it('should return empty array when no name provided', async () => {
            // Arrange
            doctorRepo.searchByName.mockResolvedValue({ items: [], count: 0 });

            // Act
            const result = await service.searchDoctors('');

            // Assert
            expect(result).toEqual([]);
        });
    });
});
