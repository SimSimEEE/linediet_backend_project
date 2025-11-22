/**
 * `models/appointment.model.ts`
 * - Appointment model definition
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { CoreModel } from './patient.model';
import { PatientHead } from './patient.model';
import { DoctorHead } from './doctor.model';
import { AppointmentStatus } from '../cores/types';

/**
 * Appointment Model
 */
export interface AppointmentModel extends CoreModel<'appointment'> {
    /** Doctor ID */
    doctorId: string;

    /** Patient ID (optional for first-time patients) */
    patientId?: string;

    /** Booker name */
    bookerName: string;

    /** Encrypted booker phone number */
    bookerPhone: string;

    /** Appointment date (YYYY-MM-DD) */
    appointmentDate: string;

    /** Appointment time (HH:mm) - 00:00 or 00:30 format */
    appointmentTime: string;

    /** Full datetime (ISO string in KST) */
    appointmentDateTime: string;

    /** Appointment status */
    status: AppointmentStatus;

    /** Reason for cancellation */
    cancelReason?: string;

    /** Cancelled at timestamp */
    cancelledAt?: string;

    /** Marked as no-show at timestamp */
    noShowAt?: string;

    /** Additional notes */
    notes?: string;

    /** Doctor info (populated) */
    doctor$?: DoctorHead;

    /** Patient info (populated) */
    patient$?: PatientHead;
}

/**
 * Appointment Head (minimal info)
 */
export interface AppointmentHead {
    id: string;
    doctorId: string;
    patientId?: string;
    appointmentDate: string;
    appointmentTime: string;
    status: AppointmentStatus;
}

/**
 * Appointment Query Parameters
 */
export interface AppointmentQueryParams {
    /** Appointment date (YYYY-MM-DD) */
    appointmentDate: string;

    /** Doctor ID filter */
    doctorId?: string;

    /** Patient ID filter */
    patientId?: string;

    /** Include cancelled/no-show appointments */
    includeAll?: boolean;
}

/**
 * Appointment Search Parameters
 */
export interface AppointmentSearchParams {
    /** Booker name */
    bookerName: string;

    /** Booker phone number */
    bookerPhone: string;

    /** Appointment date (optional) */
    appointmentDate?: string;
}
