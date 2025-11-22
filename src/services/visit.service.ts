/**
 * `services/visit.service.ts`
 * - Visit business logic service
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { VisitModel } from '../models';
import { VisitRepository, PatientRepository, DoctorRepository, AppointmentRepository } from '../repositories';
import { PatientService } from './patient.service';
import { _log, nowKST } from '../cores/commons';

/**
 * Visit Service
 */
export class VisitService {
    private visitRepo: VisitRepository;
    private patientRepo: PatientRepository;
    private doctorRepo: DoctorRepository;
    private appointmentRepo: AppointmentRepository;
    private patientService: PatientService;

    constructor() {
        this.visitRepo = new VisitRepository();
        this.patientRepo = new PatientRepository();
        this.doctorRepo = new DoctorRepository();
        this.appointmentRepo = new AppointmentRepository();
        this.patientService = new PatientService();
    }

    /**
     * Create visit (check-in)
     */
    async createVisit(data: {
        patientId?: string;
        doctorId: string;
        appointmentId?: string;
        // For first-time patients
        patientName?: string;
        phoneNumber?: string;
        ssn?: string;
        birthYearMonth?: string;
        // Visit details
        visitType?: 'first' | 'follow-up';
        chiefComplaint?: string;
        notes?: string;
    }): Promise<VisitModel> {
        let patientId = data.patientId;

        // First-time patient: create patient record
        if (!patientId) {
            if (!data.patientName || !data.phoneNumber || !data.ssn) {
                throw new Error(
                    'E_INVALID_INPUT: Patient name, phone number, and SSN are required for first-time patients',
                );
            }

            const newPatient = await this.patientService.createPatient({
                name: data.patientName,
                phoneNumber: data.phoneNumber,
                ssn: data.ssn,
                birthYearMonth: data.birthYearMonth,
            });

            patientId = newPatient.id;
            _log('[VisitService] Created new patient for visit:', patientId);
        } else {
            // Follow-up patient: update patient info if provided
            if (data.patientName || data.phoneNumber || data.ssn || data.birthYearMonth) {
                await this.patientService.updatePatient(patientId, {
                    name: data.patientName,
                    phoneNumber: data.phoneNumber,
                    ssn: data.ssn,
                    birthYearMonth: data.birthYearMonth,
                });
                _log('[VisitService] Updated patient info:', patientId);
            }
        }

        // Verify doctor exists
        if (!data.doctorId) {
            throw new Error('E_INVALID_INPUT: Doctor ID is required');
        }

        const doctor = await this.doctorRepo.getById(data.doctorId);
        if (!doctor) {
            throw new Error('E_NOT_FOUND: Doctor not found');
        }

        // Create visit record
        const visit = await this.visitRepo.create({
            patientId,
            doctorId: data.doctorId,
            appointmentId: data.appointmentId,
            checkInTime: nowKST(),
            visitType: data.visitType || (data.patientId ? 'follow-up' : 'first'),
            chiefComplaint: data.chiefComplaint,
            notes: data.notes,
        });

        _log('[VisitService] Created visit:', visit.id);
        return this.populateVisit(visit);
    }

    /**
     * Get visit by ID
     */
    async getVisit(id: string): Promise<VisitModel | null> {
        const visit = await this.visitRepo.getById(id);
        if (!visit) {
            return null;
        }
        return this.populateVisit(visit);
    }

    /**
     * Update visit
     */
    async updateVisit(id: string, updates: Partial<VisitModel>): Promise<VisitModel> {
        const existing = await this.visitRepo.getById(id);
        if (!existing) {
            throw new Error('E_NOT_FOUND: Visit not found');
        }

        const updated = await this.visitRepo.update(id, updates);
        _log('[VisitService] Updated visit:', id);
        return this.populateVisit(updated);
    }

    /**
     * Complete visit
     */
    async completeVisit(
        id: string,
        data: {
            diagnosis?: string;
            treatment?: string;
            notes?: string;
        },
    ): Promise<VisitModel> {
        return await this.updateVisit(id, {
            ...data,
            completedAt: nowKST(),
        });
    }

    /**
     * List visits by patient
     */
    async listVisitsByPatient(patientId: string, limit: number = 100): Promise<VisitModel[]> {
        const result = await this.visitRepo.queryByPatient(patientId, { limit });
        const visits = result.items.filter((v) => !v.deletedAt);
        return Promise.all(visits.map((v) => this.populateVisit(v)));
    }

    /**
     * List visits by date range
     */
    async listVisitsByDateRange(patientId: string, startDate: string, endDate: string): Promise<VisitModel[]> {
        const result = await this.visitRepo.queryByPatientAndDateRange(patientId, startDate, endDate);
        const visits = result.items.filter((v) => !v.deletedAt);
        return Promise.all(visits.map((v) => this.populateVisit(v)));
    }

    /**
     * Populate visit with patient and doctor info
     */
    private async populateVisit(visit: VisitModel): Promise<VisitModel> {
        const [patient, doctor] = await Promise.all([
            this.patientRepo.getById(visit.patientId),
            this.doctorRepo.getById(visit.doctorId),
        ]);

        return {
            ...visit,
            patient$: patient ? { id: patient.id, name: patient.name } : undefined,
            doctor$: doctor ? { id: doctor.id, name: doctor.name } : undefined,
        };
    }
}
