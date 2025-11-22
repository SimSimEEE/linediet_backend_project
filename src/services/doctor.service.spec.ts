/**
 * `doctor.service.spec.ts`
 * - Doctor service tests
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { DoctorService } from './doctor.service';
import { DoctorRepository } from '../repositories';
import { DoctorModel } from '../models';

// Mock repository
jest.mock('../repositories/doctor.repository');

describe('DoctorService', () => {
    let service: DoctorService;
    let doctorRepo: jest.Mocked<DoctorRepository>;

    const now = new Date().toISOString();

    beforeEach(() => {
        jest.clearAllMocks();
        service = new DoctorService();
        doctorRepo = (service as any).doctorRepo;
    });

    describe('createDoctor', () => {
        const validDoctorData = {
            name: '김의사',
            specialization: '내과',
            licenseNumber: 'DOC-12345',
            isActive: true,
            notes: '경력 10년',
        };

        it('should create doctor with all fields', async () => {
            // Arrange
            const expectedDoctor: DoctorModel = {
                id: 'doctor-123',
                type: 'doctor',
                ...validDoctorData,
                createdAt: now,
                updatedAt: now,
            };

            doctorRepo.create = jest.fn().mockResolvedValue(expectedDoctor);

            // Act
            const result = await service.createDoctor(validDoctorData);

            // Assert
            expect(doctorRepo.create).toHaveBeenCalledWith(validDoctorData);
            expect(result).toEqual(expectedDoctor);
            expect(result.name).toBe(validDoctorData.name);
            expect(result.specialization).toBe(validDoctorData.specialization);
        });

        it('should create doctor with minimal fields (name only)', async () => {
            // Arrange
            const minimalData = {
                name: '이의사',
            };

            const expectedDoctor: DoctorModel = {
                id: 'doctor-456',
                type: 'doctor',
                name: minimalData.name,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };

            doctorRepo.create = jest.fn().mockResolvedValue(expectedDoctor);

            // Act
            const result = await service.createDoctor(minimalData);

            // Assert
            expect(result.name).toBe(minimalData.name);
            expect(result.isActive).toBe(true); // default true
        });

        it('should reject when name is missing', async () => {
            // Arrange
            const invalidData = {
                name: '',
                specialization: '내과',
            };

            // Act & Assert
            await expect(service.createDoctor(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });

        it('should set isActive to true by default', async () => {
            // Arrange
            const dataWithoutActive = {
                name: '박의사',
            };

            const expectedDoctor: DoctorModel = {
                id: 'doctor-789',
                type: 'doctor',
                name: dataWithoutActive.name,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };

            doctorRepo.create = jest.fn().mockResolvedValue(expectedDoctor);

            // Act
            await service.createDoctor(dataWithoutActive);

            // Assert
            expect(doctorRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: true,
                }),
            );
        });

        it('should respect explicit isActive: false', async () => {
            // Arrange
            const inactiveDoctor = {
                name: '최의사',
                isActive: false,
            };

            const expectedDoctor: DoctorModel = {
                id: 'doctor-999',
                type: 'doctor',
                name: inactiveDoctor.name,
                isActive: false,
                createdAt: now,
                updatedAt: now,
            };

            doctorRepo.create = jest.fn().mockResolvedValue(expectedDoctor);

            // Act
            const result = await service.createDoctor(inactiveDoctor);

            // Assert
            expect(result.isActive).toBe(false);
        });
    });

    describe('getDoctor', () => {
        it('should return doctor by ID', async () => {
            // Arrange
            const doctor: DoctorModel = {
                id: 'doctor-123',
                type: 'doctor',
                name: '김의사',
                specialization: '내과',
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };

            doctorRepo.getById = jest.fn().mockResolvedValue(doctor);

            // Act
            const result = await service.getDoctor('doctor-123');

            // Assert
            expect(result).toEqual(doctor);
            expect(doctorRepo.getById).toHaveBeenCalledWith('doctor-123');
        });

        it('should return null when doctor not found', async () => {
            // Arrange
            doctorRepo.getById = jest.fn().mockResolvedValue(null);

            // Act
            const result = await service.getDoctor('nonexistent-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updateDoctor', () => {
        const existingDoctor: DoctorModel = {
            id: 'doctor-123',
            type: 'doctor',
            name: '김의사',
            specialization: '내과',
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };

        it('should update doctor fields', async () => {
            // Arrange
            const updates = {
                specialization: '외과',
                licenseNumber: 'DOC-99999',
                notes: '업데이트된 노트',
            };

            const updatedDoctor: DoctorModel = {
                ...existingDoctor,
                ...updates,
            };

            doctorRepo.getById = jest.fn().mockResolvedValue(existingDoctor);
            doctorRepo.update = jest.fn().mockResolvedValue(updatedDoctor);

            // Act
            const result = await service.updateDoctor('doctor-123', updates);

            // Assert
            expect(doctorRepo.update).toHaveBeenCalledWith('doctor-123', updates);
            expect(result.specialization).toBe(updates.specialization);
            expect(result.licenseNumber).toBe(updates.licenseNumber);
        });

        it('should throw error when doctor not found', async () => {
            // Arrange
            doctorRepo.getById = jest.fn().mockResolvedValue(null);

            // Act & Assert
            await expect(service.updateDoctor('nonexistent-id', { name: '테스트' })).rejects.toThrow('E_NOT_FOUND');
        });

        it('should update isActive status', async () => {
            // Arrange
            const updates = { isActive: false };
            const updatedDoctor: DoctorModel = {
                ...existingDoctor,
                isActive: false,
            };

            doctorRepo.getById = jest.fn().mockResolvedValue(existingDoctor);
            doctorRepo.update = jest.fn().mockResolvedValue(updatedDoctor);

            // Act
            const result = await service.updateDoctor('doctor-123', updates);

            // Assert
            expect(result.isActive).toBe(false);
        });
    });

    describe('deleteDoctor', () => {
        it('should soft delete doctor', async () => {
            // Arrange
            doctorRepo.delete = jest.fn().mockResolvedValue(true);

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
            const doctors: DoctorModel[] = [
                {
                    id: 'doctor-1',
                    type: 'doctor',
                    name: '의사1',
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'doctor-2',
                    type: 'doctor',
                    name: '의사2',
                    isActive: false,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'doctor-3',
                    type: 'doctor',
                    name: '의사3',
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: now, // deleted
                },
            ];

            doctorRepo.scan = jest.fn().mockResolvedValue({ items: doctors });

            // Act
            const result = await service.listDoctors(100, false);

            // Assert
            expect(result).toHaveLength(2); // exclude deleted
            expect(result.find((d) => d.id === 'doctor-3')).toBeUndefined();
        });

        it('should return only active doctors when activeOnly=true', async () => {
            // Arrange
            const activeDoctors: DoctorModel[] = [
                {
                    id: 'doctor-1',
                    type: 'doctor',
                    name: '의사1',
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                },
            ];

            doctorRepo.getActiveDoctors = jest.fn().mockResolvedValue({ items: activeDoctors });

            // Act
            const result = await service.listDoctors(100, true);

            // Assert
            expect(doctorRepo.getActiveDoctors).toHaveBeenCalledWith({ limit: 100 });
            expect(result).toHaveLength(1);
            expect(result[0].isActive).toBe(true);
        });

        it('should use default limit of 100', async () => {
            // Arrange
            doctorRepo.scan = jest.fn().mockResolvedValue({ items: [] });

            // Act
            await service.listDoctors();

            // Assert
            expect(doctorRepo.scan).toHaveBeenCalledWith({ limit: 100 });
        });
    });

    describe('searchDoctors', () => {
        it('should search doctors by name excluding deleted ones', async () => {
            // Arrange
            const searchResults: DoctorModel[] = [
                {
                    id: 'doctor-1',
                    type: 'doctor',
                    name: '김의사',
                    specialization: '내과',
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'doctor-2',
                    type: 'doctor',
                    name: '김의사',
                    specialization: '외과',
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: now, // deleted
                },
            ];

            doctorRepo.searchByName = jest.fn().mockResolvedValue({ items: searchResults });

            // Act
            const result = await service.searchDoctors('김의사');

            // Assert
            expect(doctorRepo.searchByName).toHaveBeenCalledWith('김의사');
            expect(result).toHaveLength(1); // exclude deleted
            expect(result[0].id).toBe('doctor-1');
        });

        it('should return empty array when no matches found', async () => {
            // Arrange
            doctorRepo.searchByName = jest.fn().mockResolvedValue({ items: [] });

            // Act
            const result = await service.searchDoctors('존재하지않는의사');

            // Assert
            expect(result).toEqual([]);
        });
    });
});
