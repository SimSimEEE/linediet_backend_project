/**
 * `services/doctor.service.ts`
 * - Doctor business logic service
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { DoctorModel } from '../models';
import { DoctorRepository } from '../repositories';
import { _log } from '../cores/commons';

/**
 * Doctor Service
 */
export class DoctorService {
    private doctorRepo: DoctorRepository;

    constructor() {
        this.doctorRepo = new DoctorRepository();
    }

    /**
     * Create new doctor
     */
    async createDoctor(data: {
        name: string;
        specialization?: string;
        licenseNumber?: string;
        isActive?: boolean;
        notes?: string;
    }): Promise<DoctorModel> {
        if (!data.name) {
            throw new Error('E_INVALID_INPUT: Name is required');
        }

        const doctor = await this.doctorRepo.create({
            name: data.name,
            specialization: data.specialization,
            licenseNumber: data.licenseNumber,
            isActive: data.isActive !== false, // default true
            notes: data.notes,
        });

        _log('[DoctorService] Created doctor:', doctor.id);
        return doctor;
    }

    /**
     * Get doctor by ID
     */
    async getDoctor(id: string): Promise<DoctorModel | null> {
        const doctor = await this.doctorRepo.getById(id);
        // Return null if doctor is soft-deleted
        if (doctor && doctor.deletedAt) {
            return null;
        }
        return doctor;
    }

    /**
     * Update doctor
     */
    async updateDoctor(id: string, updates: Partial<DoctorModel>): Promise<DoctorModel> {
        const existing = await this.doctorRepo.getById(id);
        if (!existing || existing.deletedAt) {
            throw new Error('E_NOT_FOUND: Doctor not found');
        }

        const updated = await this.doctorRepo.update(id, updates);
        _log('[DoctorService] Updated doctor:', id);
        return updated;
    }

    /**
     * Delete doctor (soft delete)
     */
    async deleteDoctor(id: string): Promise<boolean> {
        const result = await this.doctorRepo.delete(id);
        _log('[DoctorService] Deleted doctor:', id);
        return result;
    }

    /**
     * List all doctors
     */
    async listDoctors(limit: number = 100, activeOnly: boolean = false): Promise<DoctorModel[]> {
        const result = activeOnly
            ? await this.doctorRepo.getActiveDoctors({ limit })
            : await this.doctorRepo.getAllDoctors({ limit });

        return result.items;
    }

    /**
     * Search doctors by name
     */
    async searchDoctors(name: string): Promise<DoctorModel[]> {
        const result = await this.doctorRepo.searchByName(name);
        return result.items.filter((d) => !d.deletedAt);
    }
}
