/**
 * `appointment.service.spec.ts`
 * - Appointment service tests
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { AppointmentService } from './appointment.service';
import { AppointmentRepository } from '../repositories';
import { AppointmentModel } from '../models';
import { $LUT } from '../cores/types';
import * as encryption from '../utils/encryption';

// Mock repositories
jest.mock('../repositories/appointment.repository');
jest.mock('../repositories/patient.repository');
jest.mock('../repositories/doctor.repository');

// Mock encryption module
jest.mock('../utils/encryption', () => ({
    encrypt: jest.fn((value: string) => `encrypted_${value}`),
    decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
    maskPhone: jest.fn((value: string) => value),
    maskSSN: jest.fn((value: string) => value),
}));

describe('AppointmentService', () => {
    let service: AppointmentService;
    let appointmentRepo: jest.Mocked<AppointmentRepository>;

    // Test data
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7); // 7 days ago
    const pastDateStr = pastDate.toISOString().split('T')[0];

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        service = new AppointmentService();
        appointmentRepo = (service as any).appointmentRepo;
    });

    describe('createAppointment', () => {
        const validAppointmentData = {
            doctorId: 'doctor-123',
            patientId: 'patient-456',
            bookerName: '홍길동',
            bookerPhone: '010-1234-5678',
            appointmentDate: futureDateStr,
            appointmentTime: '14:00',
        };

        it('should create appointment successfully with valid data', async () => {
            // Arrange
            const expectedAppointment: AppointmentModel = {
                id: 'apt-123',
                type: 'appointment',
                doctorId: validAppointmentData.doctorId,
                patientId: validAppointmentData.patientId,
                bookerName: validAppointmentData.bookerName,
                bookerPhone: 'encrypted_010-1234-5678',
                appointmentDate: validAppointmentData.appointmentDate,
                appointmentTime: validAppointmentData.appointmentTime,
                appointmentDateTime: `${validAppointmentData.appointmentDate}T${validAppointmentData.appointmentTime}:00+09:00`,
                status: $LUT.AppointmentStatus.confirmed,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            appointmentRepo.checkConflict = jest.fn().mockResolvedValue(null);
            appointmentRepo.create = jest.fn().mockResolvedValue(expectedAppointment);

            // Act
            const result = await service.createAppointment(validAppointmentData);

            // Assert
            expect(result).toEqual(expectedAppointment);
            expect(appointmentRepo.checkConflict).toHaveBeenCalledWith(
                validAppointmentData.doctorId,
                expectedAppointment.appointmentDateTime,
            );
            expect(encryption.encrypt).toHaveBeenCalledWith(validAppointmentData.bookerPhone);
            expect(appointmentRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    doctorId: validAppointmentData.doctorId,
                    bookerPhone: 'encrypted_010-1234-5678',
                    status: $LUT.AppointmentStatus.confirmed,
                }),
            );
        });

        it('should reject invalid time format (not HH:00 or HH:30)', async () => {
            // Arrange
            const invalidTimeData = {
                ...validAppointmentData,
                appointmentTime: '14:15', // Invalid - not 00 or 30
            };

            // Act & Assert
            await expect(service.createAppointment(invalidTimeData)).rejects.toThrow('E_INVALID_TIME');
        });

        it('should reject invalid time format (random string)', async () => {
            // Arrange
            const invalidTimeData = {
                ...validAppointmentData,
                appointmentTime: 'invalid-time',
            };

            // Act & Assert
            await expect(service.createAppointment(invalidTimeData)).rejects.toThrow('E_INVALID_TIME');
        });

        it('should accept valid time format HH:30', async () => {
            // Arrange
            const validTimeData = {
                ...validAppointmentData,
                appointmentTime: '14:30', // Valid
            };

            const expectedAppointment: AppointmentModel = {
                id: 'apt-123',
                type: 'appointment',
                doctorId: validTimeData.doctorId,
                bookerName: validTimeData.bookerName,
                bookerPhone: 'encrypted_010-1234-5678',
                appointmentDate: validTimeData.appointmentDate,
                appointmentTime: validTimeData.appointmentTime,
                appointmentDateTime: `${validTimeData.appointmentDate}T${validTimeData.appointmentTime}:00+09:00`,
                status: $LUT.AppointmentStatus.confirmed,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            appointmentRepo.checkConflict = jest.fn().mockResolvedValue(null);
            appointmentRepo.create = jest.fn().mockResolvedValue(expectedAppointment);

            // Act
            const result = await service.createAppointment(validTimeData);

            // Assert
            expect(result).toBeDefined();
            expect(result.appointmentTime).toBe('14:30');
        });

        it('should reject past time appointment', async () => {
            // Arrange
            const pastTimeData = {
                ...validAppointmentData,
                appointmentDate: pastDateStr,
                appointmentTime: '10:00',
            };

            // Act & Assert
            await expect(service.createAppointment(pastTimeData)).rejects.toThrow('E_PAST_TIME');
        });

        it('should reject duplicate appointment (conflict exists)', async () => {
            // Arrange
            const conflictingAppointment: AppointmentModel = {
                id: 'existing-apt-123',
                type: 'appointment',
                doctorId: validAppointmentData.doctorId,
                bookerName: '다른사람',
                bookerPhone: 'encrypted_010-9999-9999',
                appointmentDate: validAppointmentData.appointmentDate,
                appointmentTime: validAppointmentData.appointmentTime,
                appointmentDateTime: `${validAppointmentData.appointmentDate}T${validAppointmentData.appointmentTime}:00+09:00`,
                status: $LUT.AppointmentStatus.confirmed,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            appointmentRepo.checkConflict = jest.fn().mockResolvedValue(conflictingAppointment);

            // Act & Assert
            await expect(service.createAppointment(validAppointmentData)).rejects.toThrow('E_DUPLICATED');
            expect(appointmentRepo.checkConflict).toHaveBeenCalled();
            expect(appointmentRepo.create).not.toHaveBeenCalled();
        });

        it('should reject when bookerName is missing', async () => {
            // Arrange
            const invalidData = {
                ...validAppointmentData,
                bookerName: '',
            };

            // Act & Assert
            await expect(service.createAppointment(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });

        it('should reject when bookerPhone is missing', async () => {
            // Arrange
            const invalidData = {
                ...validAppointmentData,
                bookerPhone: '',
            };

            // Act & Assert
            await expect(service.createAppointment(invalidData)).rejects.toThrow('E_INVALID_INPUT');
        });
    });

    describe('markNoShows', () => {
        const now = new Date();
        const nowKST = now.toISOString();

        it('should mark past confirmed appointments as no-show', async () => {
            // Arrange
            const pastConfirmedAppointments: AppointmentModel[] = [
                {
                    id: 'apt-1',
                    type: 'appointment',
                    doctorId: 'doctor-1',
                    bookerName: '환자1',
                    bookerPhone: 'encrypted_phone1',
                    appointmentDate: pastDateStr,
                    appointmentTime: '10:00',
                    appointmentDateTime: `${pastDateStr}T10:00:00+09:00`,
                    status: $LUT.AppointmentStatus.confirmed,
                    createdAt: nowKST,
                    updatedAt: nowKST,
                },
                {
                    id: 'apt-2',
                    type: 'appointment',
                    doctorId: 'doctor-2',
                    bookerName: '환자2',
                    bookerPhone: 'encrypted_phone2',
                    appointmentDate: pastDateStr,
                    appointmentTime: '11:00',
                    appointmentDateTime: `${pastDateStr}T11:00:00+09:00`,
                    status: $LUT.AppointmentStatus.confirmed,
                    createdAt: nowKST,
                    updatedAt: nowKST,
                },
            ];

            appointmentRepo.findNoShowCandidates = jest.fn().mockResolvedValue(pastConfirmedAppointments);
            appointmentRepo.update = jest.fn().mockImplementation((id, updates) =>
                Promise.resolve({
                    ...pastConfirmedAppointments.find((apt) => apt.id === id)!,
                    ...updates,
                }),
            );

            // Act
            const count = await service.markNoShows();

            // Assert
            expect(count).toBe(2);
            expect(appointmentRepo.findNoShowCandidates).toHaveBeenCalledWith(expect.any(String));
            expect(appointmentRepo.update).toHaveBeenCalledTimes(2);
            expect(appointmentRepo.update).toHaveBeenCalledWith(
                'apt-1',
                expect.objectContaining({
                    status: $LUT.AppointmentStatus.noShow,
                    noShowAt: expect.any(String),
                }),
            );
            expect(appointmentRepo.update).toHaveBeenCalledWith(
                'apt-2',
                expect.objectContaining({
                    status: $LUT.AppointmentStatus.noShow,
                    noShowAt: expect.any(String),
                }),
            );
        });

        it('should not mark cancelled appointments (repository filters them)', async () => {
            // Arrange - repository should not return cancelled appointments
            appointmentRepo.findNoShowCandidates = jest.fn().mockResolvedValue([]);

            // Act
            const count = await service.markNoShows();

            // Assert
            expect(count).toBe(0);
            expect(appointmentRepo.update).not.toHaveBeenCalled();
        });

        it('should not mark future appointments (repository filters them)', async () => {
            // Arrange - repository should not return future appointments
            appointmentRepo.findNoShowCandidates = jest.fn().mockResolvedValue([]);

            // Act
            const count = await service.markNoShows();

            // Assert
            expect(count).toBe(0);
            expect(appointmentRepo.update).not.toHaveBeenCalled();
        });

        it('should handle empty result from repository', async () => {
            // Arrange
            appointmentRepo.findNoShowCandidates = jest.fn().mockResolvedValue([]);

            // Act
            const count = await service.markNoShows();

            // Assert
            expect(count).toBe(0);
            expect(appointmentRepo.findNoShowCandidates).toHaveBeenCalled();
            expect(appointmentRepo.update).not.toHaveBeenCalled();
        });

        it('should handle single no-show candidate', async () => {
            // Arrange
            const singleAppointment: AppointmentModel[] = [
                {
                    id: 'apt-single',
                    type: 'appointment',
                    doctorId: 'doctor-1',
                    bookerName: '환자1',
                    bookerPhone: 'encrypted_phone',
                    appointmentDate: pastDateStr,
                    appointmentTime: '10:00',
                    appointmentDateTime: `${pastDateStr}T10:00:00+09:00`,
                    status: $LUT.AppointmentStatus.confirmed,
                    createdAt: nowKST,
                    updatedAt: nowKST,
                },
            ];

            appointmentRepo.findNoShowCandidates = jest.fn().mockResolvedValue(singleAppointment);
            appointmentRepo.update = jest.fn().mockResolvedValue({
                ...singleAppointment[0],
                status: $LUT.AppointmentStatus.noShow,
            });

            // Act
            const count = await service.markNoShows();

            // Assert
            expect(count).toBe(1);
            expect(appointmentRepo.update).toHaveBeenCalledTimes(1);
        });
    });
});
