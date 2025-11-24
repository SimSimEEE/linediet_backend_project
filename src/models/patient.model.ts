/**
 * `models/patient.model.ts`
 * - Patient model definition
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */

/**
 * Core Model Interface
 */
export interface CoreModel<T extends string> {
    /** Unique identifier */
    id: string;
    /** Model type */
    type: T;
    /** Created timestamp */
    createdAt?: string;
    /** Updated timestamp */
    updatedAt?: string;
    /** Deleted timestamp (for soft delete) */
    deletedAt?: string;
}

/**
 * Patient Model
 */
export interface PatientModel extends CoreModel<'patient'> {
    /** Patient name */
    name: string;

    /** Encrypted phone number */
    phoneNumber: string;

    /** Phone number hash (for searching) */
    phoneNumberHash?: string;

    /** Birth year-month (YYYYMM) */
    birthYearMonth?: string;

    /** Encrypted SSN (주민등록번호) */
    ssn?: string;

    /** Additional notes */
    notes?: string;
}

/**
 * Patient Head (minimal info)
 */
export interface PatientHead {
    id: string;
    name: string;
}

/**
 * Patient Search Criteria
 */
export interface PatientSearchCriteria {
    name?: string;
    phoneNumber?: string;
    birthYearMonth?: string;
}
