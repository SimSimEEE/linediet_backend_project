/**
 * `models/doctor.model.ts`
 * - Doctor model definition
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { CoreModel } from './patient.model';

/**
 * Doctor Model
 */
export interface DoctorModel extends CoreModel<'doctor'> {
    /** Doctor name */
    name: string;

    /** Specialization */
    specialization?: string;

    /** License number */
    licenseNumber?: string;

    /** Active status */
    isActive?: boolean;

    /** Additional notes */
    notes?: string;
}

/**
 * Doctor Head (minimal info)
 */
export interface DoctorHead {
    id: string;
    name: string;
    specialization?: string;
}
