/**
 * `patient.service.spec.ts`
 * - Patient service tests
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { PatientService } from './patient.service';
import { PatientRepository } from '../repositories';
import { PatientModel } from '../models';
import * as encryption from '../utils/encryption';

// Mock repository
jest.mock('../repositories/patient.repository');

// Mock encryption module
jest.mock('../utils/encryption', () => ({
    encrypt: jest.fn((value: string) => `encrypted_${value}`),
    decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
    maskPhone: jest.fn((value: string) => value),
    maskSSN: jest.fn((value: string) => value),
}));

describe('PatientService', () => {
    let service: PatientService;
    let patientRepo: jest.Mocked<PatientRepository>;

    const now = new Date().toISOString();

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PatientService();
        patientRepo = (service as any).patientRepo;
    });

    describe('createPatient', () => {
        const validPatientData = {
            name: '홍길동',
            phoneNumber: '010-1234-5678',
            birthYearMonth: '199001',
            ssn: '900101-1234567',
            notes: '알레르기: 페니실린',
        };

        it('should create patient with encrypted personal info', async () => {
            // Arrange
            const expectedPatient: PatientModel = {
                id: 'patient-123',
                type: 'patient',
                name: validPatientData.name,
                phoneNumber: 'encrypted_010-1234-5678',
                birthYearMonth: validPatientData.birthYearMonth,
                ssn: 'encrypted_900101-1234567',
                notes: validPatientData.notes,
                createdAt: now,
                updatedAt: now,
            };

            patientRepo.create = jest.fn().mockResolvedValue(expectedPatient);

            // Act
            const result = await service.createPatient(validPatientData);

            // Assert
            expect(encryption.encrypt).toHaveBeenCalledWith(validPatientData.phoneNumber);
            expect(encryption.encrypt).toHaveBeenCalledWith(validPatientData.ssn);
            expect(patientRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: validPatientData.name,
                    phoneNumber: 'encrypted_010-1234-5678',
                    ssn: 'encrypted_900101-1234567',
                }),
            );
            expect(result.phoneNumber).toBe('010-1234-5678'); // decrypted
            expect(result.ssn).toBe('900101-1234567'); // decrypted
        });

        it('should create patient without optional SSN', async () => {
            // Arrange
            const dataWithoutSSN = {
                name: '김철수',
                phoneNumber: '010-9999-8888',
            };

            const expectedPatient: PatientModel = {
                id: 'patient-456',
                type: 'patient',
                name: dataWithoutSSN.name,
                phoneNumber: 'encrypted_010-9999-8888',
                createdAt: now,
                updatedAt: now,
            };

            patientRepo.create = jest.fn().mockResolvedValue(expectedPatient);

            // Act
            const result = await service.createPatient(dataWithoutSSN);

            // Assert
            expect(result).toBeDefined();
            expect(result.ssn).toBeUndefined();
            expect(encryption.encrypt).toHaveBeenCalledWith(dataWithoutSSN.phoneNumber);
            expect(encryption.encrypt).toHaveBeenCalledTimes(1); // only phone, not SSN
        });

        it('should reject when name is missing', async () => {
            // Arrange
            const invalidData = {
                name: '',
                phoneNumber: '010-1234-5678',
            };

            // Act & Assert
            await expect(service.createPatient(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });

        it('should reject when phone number is missing', async () => {
            // Arrange
            const invalidData = {
                name: '홍길동',
                phoneNumber: '',
            };

            // Act & Assert
            await expect(service.createPatient(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });
    });

    describe('getPatient', () => {
        it('should return decrypted patient info', async () => {
            // Arrange
            const encryptedPatient: PatientModel = {
                id: 'patient-123',
                type: 'patient',
                name: '홍길동',
                phoneNumber: 'encrypted_010-1234-5678',
                ssn: 'encrypted_900101-1234567',
                createdAt: now,
                updatedAt: now,
            };

            patientRepo.getById = jest.fn().mockResolvedValue(encryptedPatient);

            // Act
            const result = await service.getPatient('patient-123');

            // Assert
            expect(result).not.toBeNull();
            expect(result!.phoneNumber).toBe('010-1234-5678'); // decrypted
            expect(result!.ssn).toBe('900101-1234567'); // decrypted
            expect(encryption.decrypt).toHaveBeenCalledWith('encrypted_010-1234-5678');
            expect(encryption.decrypt).toHaveBeenCalledWith('encrypted_900101-1234567');
        });

        it('should return null when patient not found', async () => {
            // Arrange
            patientRepo.getById = jest.fn().mockResolvedValue(null);

            // Act
            const result = await service.getPatient('nonexistent-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updatePatient', () => {
        it('should update patient with encrypted phone number', async () => {
            // Arrange
            const existingPatient: PatientModel = {
                id: 'patient-123',
                type: 'patient',
                name: '홍길동',
                phoneNumber: 'encrypted_010-1234-5678',
                createdAt: now,
                updatedAt: now,
            };

            const updates = {
                phoneNumber: '010-9999-9999',
                notes: '업데이트된 노트',
            };

            const updatedPatient: PatientModel = {
                ...existingPatient,
                phoneNumber: 'encrypted_010-9999-9999',
                notes: updates.notes,
            };

            // Clear previous mock calls
            (encryption.encrypt as jest.Mock).mockClear();
            
            patientRepo.getById = jest.fn().mockResolvedValue(existingPatient);
            patientRepo.update = jest.fn().mockResolvedValue(updatedPatient);

            // Act
            const result = await service.updatePatient('patient-123', updates);

            // Assert
            expect(encryption.encrypt).toHaveBeenCalledWith('010-9999-9999');
            expect(patientRepo.update).toHaveBeenCalledWith(
                'patient-123',
                expect.objectContaining({
                    phoneNumber: 'encrypted_010-9999-9999',
                    notes: updates.notes,
                }),
            );
            expect(result.phoneNumber).toBe('010-9999-9999'); // decrypted result
        });

        it('should throw error when patient not found', async () => {
            // Arrange
            patientRepo.getById = jest.fn().mockResolvedValue(null);

            // Act & Assert
            await expect(service.updatePatient('nonexistent-id', { name: '테스트' })).rejects.toThrow('E_NOT_FOUND');
        });
    });

    describe('deletePatient', () => {
        it('should soft delete patient', async () => {
            // Arrange
            patientRepo.delete = jest.fn().mockResolvedValue(true);

            // Act
            const result = await service.deletePatient('patient-123');

            // Assert
            expect(result).toBe(true);
            expect(patientRepo.delete).toHaveBeenCalledWith('patient-123');
        });
    });

    describe('listPatients', () => {
        it('should return decrypted list excluding deleted patients', async () => {
            // Arrange
            const patients: PatientModel[] = [
                {
                    id: 'patient-1',
                    type: 'patient',
                    name: '환자1',
                    phoneNumber: 'encrypted_010-1111-1111',
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'patient-2',
                    type: 'patient',
                    name: '환자2',
                    phoneNumber: 'encrypted_010-2222-2222',
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: now, // deleted
                },
            ];

            patientRepo.scan = jest.fn().mockResolvedValue({ items: patients });

            // Act
            const result = await service.listPatients(100);

            // Assert
            expect(result).toHaveLength(1); // only non-deleted
            expect(result[0].id).toBe('patient-1');
            expect(result[0].phoneNumber).toBe('010-1111-1111'); // decrypted
        });
    });

    describe('searchPatients', () => {
        it('should search by encrypted phone number', async () => {
            // Arrange
            const patients: PatientModel[] = [
                {
                    id: 'patient-123',
                    type: 'patient',
                    name: '홍길동',
                    phoneNumber: 'encrypted_010-1234-5678',
                    createdAt: now,
                    updatedAt: now,
                },
            ];

            patientRepo.findByPhoneNumber = jest.fn().mockResolvedValue({ items: patients });

            // Act
            const result = await service.searchPatients({ phoneNumber: '010-1234-5678' });

            // Assert
            expect(encryption.encrypt).toHaveBeenCalledWith('010-1234-5678');
            expect(patientRepo.findByPhoneNumber).toHaveBeenCalledWith('encrypted_010-1234-5678');
            expect(result).toHaveLength(1);
            expect(result[0].phoneNumber).toBe('010-1234-5678'); // decrypted
        });

        it('should search by name', async () => {
            // Arrange
            const patients: PatientModel[] = [
                {
                    id: 'patient-456',
                    type: 'patient',
                    name: '김철수',
                    phoneNumber: 'encrypted_010-9999-9999',
                    createdAt: now,
                    updatedAt: now,
                },
            ];

            patientRepo.searchByName = jest.fn().mockResolvedValue({ items: patients });

            // Act
            const result = await service.searchPatients({ name: '김철수' });

            // Assert
            expect(patientRepo.searchByName).toHaveBeenCalledWith('김철수');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('김철수');
        });

        it('should return empty array when no criteria provided', async () => {
            // Act
            const result = await service.searchPatients({});

            // Assert
            expect(result).toEqual([]);
            expect(patientRepo.findByPhoneNumber).not.toHaveBeenCalled();
            expect(patientRepo.searchByName).not.toHaveBeenCalled();
        });

        it('should exclude deleted patients from search results', async () => {
            // Arrange
            const patients: PatientModel[] = [
                {
                    id: 'patient-1',
                    type: 'patient',
                    name: '홍길동',
                    phoneNumber: 'encrypted_010-1234-5678',
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'patient-2',
                    type: 'patient',
                    name: '홍길동',
                    phoneNumber: 'encrypted_010-1234-5678',
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: now,
                },
            ];

            patientRepo.searchByName = jest.fn().mockResolvedValue({ items: patients });

            // Act
            const result = await service.searchPatients({ name: '홍길동' });

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('patient-1');
        });
    });
});
