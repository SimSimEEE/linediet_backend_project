/**
 * `repositories/appointment.repository.ts`
 * - Appointment repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { AppointmentModel } from '../models';
import { BaseRepository, QueryOptions, QueryResult } from './base.repository';
import { $U } from '../cores/commons';
import { AppointmentStatus } from '../cores/types';

/**
 * Appointment Repository
 */
export class AppointmentRepository extends BaseRepository<AppointmentModel> {
    constructor() {
        const tableName = $U.env('APPOINTMENT_TABLE', 'appointment-appointments-dev');
        super(tableName, 'appointment');
    }

    /**
     * Query appointments by doctor and date
     */
    async queryByDoctorAndDate(
        doctorId: string,
        appointmentDate: string,
        options?: QueryOptions,
    ): Promise<QueryResult<AppointmentModel>> {
        return this.queryByIndex(
            'doctorId-appointmentDate-index',
            'doctorId = :doctorId AND appointmentDate = :appointmentDate',
            {
                ':doctorId': doctorId,
                ':appointmentDate': appointmentDate,
            },
            undefined,
            options,
        );
    }

    /**
     * Query appointments by patient and date
     */
    async queryByPatientAndDate(
        patientId: string,
        appointmentDate: string,
        options?: QueryOptions,
    ): Promise<QueryResult<AppointmentModel>> {
        return this.queryByIndex(
            'patientId-appointmentDate-index',
            'patientId = :patientId AND appointmentDate = :appointmentDate',
            {
                ':patientId': patientId,
                ':appointmentDate': appointmentDate,
            },
            undefined,
            options,
        );
    }

    /**
     * Query all appointments by date
     */
    async queryByDate(appointmentDate: string, options?: QueryOptions): Promise<QueryResult<AppointmentModel>> {
        return this.queryByIndex(
            'appointmentDate-index',
            'appointmentDate = :appointmentDate',
            {
                ':appointmentDate': appointmentDate,
            },
            undefined,
            options,
        );
    }

    /**
     * Check for conflicts (same doctor, same datetime, not cancelled/no-show)
     */
    async checkConflict(doctorId: string, appointmentDateTime: string): Promise<AppointmentModel | null> {
        const appointmentDate = appointmentDateTime.split('T')[0];
        const result = await this.queryByDoctorAndDate(doctorId, appointmentDate);

        const conflict = result.items.find(
            (apt) => apt.appointmentDateTime === appointmentDateTime && apt.status === 'CONFIRMED' && !apt.deletedAt,
        );

        return conflict || null;
    }

    /**
     * Find no-show candidates (past appointments that are still confirmed)
     */
    async findNoShowCandidates(currentDateTime: string): Promise<AppointmentModel[]> {
        const params = {
            TableName: this.tableName,
            FilterExpression:
                '#status = :confirmed AND appointmentDateTime < :currentDateTime AND attribute_not_exists(deletedAt)',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':confirmed': 'CONFIRMED' as AppointmentStatus,
                ':currentDateTime': currentDateTime,
            },
        };

        try {
            const result = await (this as any).dynamoDB.scan(params).promise();
            return (result.Items as AppointmentModel[]) || [];
        } catch (error) {
            throw error;
        }
    }
}
