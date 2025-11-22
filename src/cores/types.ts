/**
 * `types.ts`
 * - Common types and enums for appointment system
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */

/**
 * Lookup Table for all types
 */
export const $LUT = {
    /**
     * Model Type
     */
    ModelType: {
        patient: 'patient',
        doctor: 'doctor',
        appointment: 'appointment',
        visit: 'visit',
    },

    /**
     * Appointment Status
     */
    AppointmentStatus: {
        /** 예약 완료 */
        confirmed: 'CONFIRMED',
        /** 예약 취소 */
        cancelled: 'CANCELLED',
        /** 예약 부도 (no-show) */
        noShow: 'NO_SHOW',
    },
} as const;

/**
 * Model Type
 */
export type ModelType = keyof typeof $LUT.ModelType;

/**
 * Appointment Status Type
 */
export type AppointmentStatus = (typeof $LUT.AppointmentStatus)[keyof typeof $LUT.AppointmentStatus];

/**
 * Paginate Parameters
 */
export interface PaginateParam {
    limit?: number;
    nextToken?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * List Result
 */
export interface ListResult<T> {
    list: T[];
    total?: number;
    nextToken?: string;
}

/**
 * Paginated List Result
 */
export interface PaginatedListResult<T> extends ListResult<T> {
    limit: number;
    page?: number;
}

/**
 * Error Response
 */
export interface ErrorResponse {
    error: string;
    message: string;
    code: string;
    statusCode: number;
}

/**
 * Success Response
 */
export interface SuccessResponse {
    success: boolean;
    message?: string;
}
