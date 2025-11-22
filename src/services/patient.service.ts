/**
 * `services/patient.service.ts`
 * - Patient business logic service
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { PatientModel, PatientSearchCriteria } from '../models';
import { PatientRepository } from '../repositories';
import { encrypt, decrypt } from '../utils/encryption';
import { _log } from '../cores/commons';

/**
 * Patient Service
 */
export class PatientService {
    private patientRepo: PatientRepository;

    constructor() {
        this.patientRepo = new PatientRepository();
    }

    /**
     * Create new patient
     */
    async createPatient(data: {
        name: string;
        phoneNumber: string;
        birthYearMonth?: string;
        ssn?: string;
        notes?: string;
    }): Promise<PatientModel> {
        // Validate required fields
        if (!data.name || !data.phoneNumber) {
            throw new Error('E_INVALID_INPUT: Name and phone number are required');
        }

        // Encrypt personal information
        const encryptedPhone = encrypt(data.phoneNumber);
        const encryptedSSN = data.ssn ? encrypt(data.ssn) : undefined;

        // Create patient
        const patient = await this.patientRepo.create({
            name: data.name,
            phoneNumber: encryptedPhone,
            birthYearMonth: data.birthYearMonth,
            ssn: encryptedSSN,
            notes: data.notes,
        });

        _log('[PatientService] Created patient:', patient.id);
        return this.decryptPatientInfo(patient);
    }

    /**
     * Get patient by ID
     */
    async getPatient(id: string): Promise<PatientModel | null> {
        const patient = await this.patientRepo.getById(id);
        if (!patient || patient.deletedAt) {
            return null;
        }
        return this.decryptPatientInfo(patient);
    }

    /**
     * Update patient
     */
    async updatePatient(id: string, updates: Partial<PatientModel>): Promise<PatientModel> {
        const existing = await this.patientRepo.getById(id);
        if (!existing || existing.deletedAt) {
            throw new Error('E_NOT_FOUND: Patient not found');
        }

        // Encrypt if personal info is being updated
        if (updates.phoneNumber) {
            updates.phoneNumber = encrypt(updates.phoneNumber);
        }
        if (updates.ssn) {
            updates.ssn = encrypt(updates.ssn);
        }

        const updated = await this.patientRepo.update(id, updates);
        _log('[PatientService] Updated patient:', id);
        return this.decryptPatientInfo(updated);
    }

    /**
     * Delete patient (soft delete)
     */
    async deletePatient(id: string): Promise<boolean> {
        const result = await this.patientRepo.delete(id);
        _log('[PatientService] Deleted patient:', id);
        return result;
    }

    /**
     * List all patients
     */
    async listPatients(limit: number = 100): Promise<PatientModel[]> {
        const result = await this.patientRepo.scan({ limit });
        return result.items.filter((p) => !p.deletedAt).map((p) => this.decryptPatientInfo(p));
    }

    /**
     * Search patients
     */
    async searchPatients(criteria: PatientSearchCriteria): Promise<PatientModel[]> {
        let patients: PatientModel[] = [];

        if (criteria.phoneNumber) {
            // Search by encrypted phone number
            const encryptedPhone = encrypt(criteria.phoneNumber);
            const result = await this.patientRepo.findByPhoneNumber(encryptedPhone);
            patients = result.items;
        } else if (criteria.name) {
            // Search by name
            const result = await this.patientRepo.searchByName(criteria.name);
            patients = result.items;
        } else {
            // Return empty if no criteria
            return [];
        }

        return patients.filter((p) => !p.deletedAt).map((p) => this.decryptPatientInfo(p));
    }

    /**
     * Decrypt patient personal information
     */
    private decryptPatientInfo(patient: PatientModel): PatientModel {
        return {
            ...patient,
            phoneNumber: decrypt(patient.phoneNumber),
            ssn: patient.ssn ? decrypt(patient.ssn) : undefined,
        };
    }
}
