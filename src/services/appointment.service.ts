/**
 * `services/appointment.service.ts`
 * - Appointment business logic service
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { AppointmentModel, AppointmentQueryParams, AppointmentSearchParams } from '../models';
import { AppointmentRepository, PatientRepository, DoctorRepository } from '../repositories';
import { encrypt, decrypt } from '../utils/encryption';
import { _log, _err, nowKST } from '../cores/commons';
import { $LUT } from '../cores/types';

/**
 * Appointment Service
 */
export class AppointmentService {
    private appointmentRepo: AppointmentRepository;
    private patientRepo: PatientRepository;
    private doctorRepo: DoctorRepository;

    constructor() {
        this.appointmentRepo = new AppointmentRepository();
        this.patientRepo = new PatientRepository();
        this.doctorRepo = new DoctorRepository();
    }

    /**
     * Create new appointment
     */
    async createAppointment(data: {
        doctorId: string;
        patientId?: string;
        bookerName: string;
        bookerPhone: string;
        appointmentDate: string;
        appointmentTime: string;
    }): Promise<AppointmentModel> {
        // Validate inputs
        if (!data.bookerName || !data.bookerPhone) {
            throw new Error('E_INVALID_INPUT: Booker name and phone are required');
        }

        // Validate time format (HH:00 or HH:30)
        const timeMatch = data.appointmentTime.match(/^(\d{2}):(00|30)$/);
        if (!timeMatch) {
            throw new Error('E_INVALID_TIME: Time must be in HH:00 or HH:30 format');
        }

        // Construct full datetime
        const appointmentDateTime = `${data.appointmentDate}T${data.appointmentTime}:00+09:00`;
        const appointmentTimestamp = new Date(appointmentDateTime);

        // Check if appointment is in the past
        if (appointmentTimestamp <= new Date()) {
            throw new Error('E_PAST_TIME: Cannot book appointment in the past');
        }

        // Check for conflicts
        const conflict = await this.appointmentRepo.checkConflict(data.doctorId, appointmentDateTime);
        if (conflict) {
            throw new Error('E_DUPLICATED: Doctor already has an appointment at this time');
        }

        // Encrypt phone number
        const encryptedPhone = encrypt(data.bookerPhone);

        // Create appointment
        const appointment = await this.appointmentRepo.create({
            doctorId: data.doctorId,
            patientId: data.patientId,
            bookerName: data.bookerName,
            bookerPhone: encryptedPhone,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            appointmentDateTime,
            status: $LUT.AppointmentStatus.confirmed,
        });

        _log('[AppointmentService] Created appointment:', appointment.id);
        return appointment;
    }

    /**
     * Query appointments
     */
    async queryAppointments(params: AppointmentQueryParams): Promise<AppointmentModel[]> {
        let result;

        if (params.doctorId && params.patientId) {
            // Both specified - get by doctor first, then filter by patient
            result = await this.appointmentRepo.queryByDoctorAndDate(params.doctorId, params.appointmentDate);
            result.items = result.items.filter((apt) => apt.patientId === params.patientId);
        } else if (params.doctorId) {
            result = await this.appointmentRepo.queryByDoctorAndDate(params.doctorId, params.appointmentDate);
        } else if (params.patientId) {
            result = await this.appointmentRepo.queryByPatientAndDate(params.patientId, params.appointmentDate);
        } else {
            result = await this.appointmentRepo.queryByDate(params.appointmentDate);
        }

        // Filter out cancelled/no-show if not requested
        if (!params.includeAll) {
            result.items = result.items.filter((apt) => apt.status === $LUT.AppointmentStatus.confirmed);
        }

        // Populate doctor/patient info
        return this.populateAppointments(result.items);
    }

    /**
     * Search appointments by booker info
     */
    async searchAppointments(params: AppointmentSearchParams): Promise<AppointmentModel[]> {
        let appointments: AppointmentModel[];

        if (params.appointmentDate) {
            const result = await this.appointmentRepo.queryByDate(params.appointmentDate);
            appointments = result.items;
        } else {
            const result = await this.appointmentRepo.scan({ limit: 1000 });
            appointments = result.items;
        }

        // Filter by name and phone (partial match for name, exact match for decrypted phone)
        const filtered = appointments.filter((apt) => {
            if (apt.deletedAt) return false;

            let matches = true;
            if (params.bookerName && !apt.bookerName?.includes(params.bookerName)) {
                matches = false;
            }
            if (params.bookerPhone) {
                const decryptedPhone = apt.bookerPhone ? decrypt(apt.bookerPhone) : '';
                if (decryptedPhone !== params.bookerPhone) {
                    matches = false;
                }
            }
            return matches;
        });

        return this.populateAppointments(filtered);
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(id: string, reason?: string): Promise<boolean> {
        const appointment = await this.appointmentRepo.getById(id);
        if (!appointment) {
            throw new Error('E_NOT_FOUND: Appointment not found');
        }

        // Already cancelled - do nothing
        if (appointment.status === $LUT.AppointmentStatus.cancelled) {
            return true;
        }

        await this.appointmentRepo.update(id, {
            status: $LUT.AppointmentStatus.cancelled,
            cancelReason: reason,
            cancelledAt: nowKST(),
        });

        _log('[AppointmentService] Cancelled appointment:', id);
        return true;
    }

    /**
     * Update appointment
     */
    async updateAppointment(id: string, updates: Partial<AppointmentModel>): Promise<AppointmentModel> {
        const existing = await this.appointmentRepo.getById(id);
        if (!existing) {
            throw new Error('E_NOT_FOUND: Appointment not found');
        }

        // Check time if being updated
        if (updates.appointmentTime || updates.appointmentDate) {
            const newDate = updates.appointmentDate || existing.appointmentDate;
            const newTime = updates.appointmentTime || existing.appointmentTime;
            const newDateTime = `${newDate}T${newTime}:00+09:00`;

            // Check if in past
            if (new Date(newDateTime) <= new Date()) {
                throw new Error('E_PAST_TIME: Cannot update to past time');
            }

            // Check for conflicts (skip if same datetime)
            if (newDateTime !== existing.appointmentDateTime) {
                const conflict = await this.appointmentRepo.checkConflict(existing.doctorId, newDateTime);
                if (conflict && conflict.id !== id) {
                    throw new Error('E_DUPLICATED: Doctor already has an appointment at this time');
                }
            }

            updates.appointmentDateTime = newDateTime;
        }

        // Encrypt phone if provided
        if (updates.bookerPhone) {
            updates.bookerPhone = encrypt(updates.bookerPhone);
        }

        const updated = await this.appointmentRepo.update(id, updates);
        _log('[AppointmentService] Updated appointment:', id);
        return updated;
    }

    /**
     * Mark no-show appointments
     */
    async markNoShows(): Promise<number> {
        const currentDateTime = nowKST();
        const candidates = await this.appointmentRepo.findNoShowCandidates(currentDateTime);

        let count = 0;
        for (const appointment of candidates) {
            await this.appointmentRepo.update(appointment.id, {
                status: $LUT.AppointmentStatus.noShow,
                noShowAt: currentDateTime,
            });
            count++;
        }

        _log(`[AppointmentService] Marked ${count} no-show appointments`);
        return count;
    }

    /**
     * Populate doctor and patient info
     */
    private async populateAppointments(appointments: AppointmentModel[]): Promise<AppointmentModel[]> {
        const doctorIds = [...new Set(appointments.map((a) => a.doctorId))];
        const patientIds = [...new Set(appointments.filter((a) => a.patientId).map((a) => a.patientId!))];

        const doctors = await this.doctorRepo.batchGet(doctorIds);
        const patients = await this.patientRepo.batchGet(patientIds);

        const doctorMap = new Map(doctors.map((d) => [d.id, d]));
        const patientMap = new Map(patients.map((p) => [p.id, p]));

        return appointments.map((apt) => ({
            ...apt,
            doctor$: doctorMap.get(apt.doctorId)
                ? { id: doctorMap.get(apt.doctorId)!.id, name: doctorMap.get(apt.doctorId)!.name }
                : undefined,
            patient$:
                apt.patientId && patientMap.get(apt.patientId)
                    ? { id: patientMap.get(apt.patientId)!.id, name: patientMap.get(apt.patientId)!.name }
                    : undefined,
        }));
    }
}
