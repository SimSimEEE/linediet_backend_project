/**
 * `services/patient.service.spec.ts`
 * - Unit tests for PatientService
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import { PatientService } from './patient.service';
import { PatientRepository } from '../repositories';
import { encrypt, decrypt, hash } from '../utils/encryption';

// Mock dependencies
jest.mock('../repositories');
jest.mock('../utils/encryption', () => ({
    encrypt: jest.fn((value: string) => `encrypted_${value}`),
    decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
    hash: jest.fn((value: string) => `hash_${value}`),
}));

describe('PatientService', () => {
    let service: PatientService;
    let patientRepo: jest.Mocked<PatientRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PatientService();
        patientRepo = (service as any).patientRepo;

        // Re-set encryption mocks after clearAllMocks
        (encrypt as jest.Mock).mockImplementation((value: string) => `encrypted_${value}`);
        (decrypt as jest.Mock).mockImplementation((value: string) => value.replace('encrypted_', ''));
    });

    describe('createPatient', () => {
        it('should create patient with encrypted personal info', async () => {
            // Arrange
            const patientData = {
                name: '홍길동',
                phoneNumber: '010-1234-5678',
                ssn: '123456-1234567',
                birthYearMonth: '199001',
            };

            patientRepo.create.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: patientData.name,
                phoneNumber: 'encrypted_010-1234-5678',
                ssn: 'encrypted_123456-1234567',
                birthYearMonth: patientData.birthYearMonth,
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.createPatient(patientData);

            // Assert
            expect(encrypt).toHaveBeenCalledWith('01012345678'); // Normalized (hyphens removed)
            expect(encrypt).toHaveBeenCalledWith(patientData.ssn);
            expect(patientRepo.create).toHaveBeenCalledWith({
                name: patientData.name,
                phoneNumber: 'encrypted_01012345678',
                phoneNumberHash: 'hash_01012345678',
                ssn: 'encrypted_123456-1234567',
                birthYearMonth: patientData.birthYearMonth,
                notes: undefined,
            });
            expect(result.phoneNumber).toBe('010-1234-5678'); // Decrypted
            expect(result.ssn).toBe('123456-1234567'); // Decrypted
        });

        it('should create patient without optional SSN', async () => {
            // Arrange
            const patientData = {
                name: '김철수',
                phoneNumber: '010-9999-8888',
            };

            patientRepo.create.mockResolvedValue({
                type: 'patient',
                id: 'patient-456',
                name: patientData.name,
                phoneNumber: 'encrypted_010-9999-8888',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.createPatient(patientData);

            // Assert
            expect(encrypt).toHaveBeenCalledWith('01099998888'); // Normalized (hyphens removed)
            expect(encrypt).not.toHaveBeenCalledWith(undefined);
            expect(result.ssn).toBeUndefined();
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
            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: 'encrypted_010-1234-5678',
                ssn: 'encrypted_123456-1234567',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            // Act
            const result = await service.getPatient('patient-123');

            // Assert
            expect(result).not.toBeNull();
            expect(result!.phoneNumber).toBe('010-1234-5678');
            expect(result!.ssn).toBe('123456-1234567');
        });

        it('should return null when patient not found', async () => {
            // Arrange
            patientRepo.getById.mockResolvedValue(null);

            // Act
            const result = await service.getPatient('nonexistent');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updatePatient', () => {
        it('should update patient with encrypted phone number', async () => {
            // Arrange
            patientRepo.getById.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: 'encrypted_010-1234-5678',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T10:00:00+09:00',
            });

            patientRepo.update.mockResolvedValue({
                type: 'patient',
                id: 'patient-123',
                name: '홍길동',
                phoneNumber: 'encrypted_010-9999-9999',
                createdAt: '2024-01-15T10:00:00+09:00',
                updatedAt: '2024-01-15T11:00:00+09:00',
            });

            // Act
            await service.updatePatient('patient-123', { phoneNumber: '010-9999-9999' });

            // Assert
            expect(encrypt).toHaveBeenCalledWith('01099999999'); // Normalized (hyphens removed)
            expect(patientRepo.update).toHaveBeenCalledWith('patient-123', {
                phoneNumber: 'encrypted_01099999999',
                phoneNumberHash: 'hash_01099999999',
            });
        });

        it('should throw error when patient not found', async () => {
            // Arrange
            patientRepo.getById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.updatePatient('nonexistent', { name: 'Test' })).rejects.toThrow('E_NOT_FOUND');
        });
    });

    describe('deletePatient', () => {
        it('should soft delete patient', async () => {
            // Arrange
            patientRepo.delete.mockResolvedValue(true);

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
            patientRepo.scan.mockResolvedValue({
                items: [
                    {
                        type: 'patient',
                        id: 'patient-1',
                        name: '환자1',
                        phoneNumber: 'encrypted_010-1111-1111',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                    {
                        type: 'patient',
                        id: 'patient-2',
                        name: '환자2',
                        phoneNumber: 'encrypted_010-2222-2222',
                        deletedAt: '2024-01-15T12:00:00+09:00', // Deleted
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 2,
            });

            // Act
            const result = await service.listPatients();

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('patient-1');
            expect(result[0].phoneNumber).toBe('010-1111-1111');
        });
    });

    describe('searchPatients', () => {
        it('should search by encrypted phone number', async () => {
            // Arrange
            const phoneNumber = '010-1234-5678';
            patientRepo.findByPhoneHash.mockResolvedValue({
                items: [
                    {
                        type: 'patient',
                        id: 'patient-123',
                        name: '홍길동',
                        phoneNumber: 'encrypted_01012345678',
                        phoneNumberHash: 'hash_01012345678',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 1,
            });

            // Act
            const result = await service.searchPatients({ phoneNumber });

            // Assert
            expect(hash).toHaveBeenCalledWith('01012345678'); // Normalized (hyphens removed)
            expect(patientRepo.findByPhoneHash).toHaveBeenCalledWith('hash_01012345678');
            expect(result).toHaveLength(1);
        });

        it('should search by name', async () => {
            // Arrange
            patientRepo.searchByName.mockResolvedValue({
                items: [
                    {
                        type: 'patient',
                        id: 'patient-123',
                        name: '홍길동',
                        phoneNumber: 'encrypted_010-1234-5678',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 1,
            });

            // Act
            const result = await service.searchPatients({ name: '홍길동' });

            // Assert
            expect(patientRepo.searchByName).toHaveBeenCalledWith('홍길동');
            expect(result).toHaveLength(1);
        });

        it('should return empty array when no criteria provided', async () => {
            // Act
            const result = await service.searchPatients({});

            // Assert
            expect(result).toEqual([]);
        });

        it('should exclude deleted patients from search results', async () => {
            // Arrange
            patientRepo.searchByName.mockResolvedValue({
                items: [
                    {
                        type: 'patient',
                        id: 'patient-1',
                        name: '홍길동',
                        phoneNumber: 'encrypted_010-1111-1111',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                    {
                        type: 'patient',
                        id: 'patient-2',
                        name: '홍길동',
                        phoneNumber: 'encrypted_010-2222-2222',
                        deletedAt: '2024-01-15T12:00:00+09:00',
                        createdAt: '2024-01-15T10:00:00+09:00',
                        updatedAt: '2024-01-15T10:00:00+09:00',
                    },
                ],
                count: 2,
            });

            // Act
            const result = await service.searchPatients({ name: '홍길동' });

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('patient-1');
        });
    });
});
