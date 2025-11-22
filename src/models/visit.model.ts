/**
 * `models/visit.model.ts`
 * - Visit model definition
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { CoreModel } from './patient.model';
import { PatientHead } from './patient.model';
import { DoctorHead } from './doctor.model';

/**
 * Visit Model
 */
export interface VisitModel extends CoreModel<'visit'> {
    /** Patient ID (required) */
    patientId: string;

    /** Doctor ID */
    doctorId: string;

    /** Appointment ID (optional, if visit was scheduled) */
    appointmentId?: string;

    /** Check-in timestamp (ISO string in KST) */
    checkInTime: string;

    /** Treatment completion timestamp */
    completedAt?: string;

    /** Visit type */
    visitType?: 'first' | 'follow-up';

    /** Chief complaint */
    chiefComplaint?: string;

    /** Diagnosis */
    diagnosis?: string;

    /** Treatment details */
    treatment?: string;

    /** Additional notes */
    notes?: string;

    /** Patient info (populated) */
    patient$?: PatientHead;

    /** Doctor info (populated) */
    doctor$?: DoctorHead;
}

/**
 * Visit Head (minimal info)
 */
export interface VisitHead {
    id: string;
    patientId: string;
    doctorId: string;
    checkInTime: string;
}

/**
 * Visit Query Parameters
 */
export interface VisitQueryParams {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
}
