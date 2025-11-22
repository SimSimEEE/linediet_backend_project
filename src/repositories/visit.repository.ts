/**
 * `repositories/visit.repository.ts`
 * - Visit repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { VisitModel } from '../models';
import { BaseRepository, QueryOptions, QueryResult } from './base.repository';
import { $U } from '../cores/commons';

/**
 * Visit Repository
 */
export class VisitRepository extends BaseRepository<VisitModel> {
    constructor() {
        const tableName = $U.env('VISIT_TABLE', 'appointment-visits-dev');
        super(tableName, 'visit');
    }

    /**
     * Query visits by patient
     */
    async queryByPatient(patientId: string, options?: QueryOptions): Promise<QueryResult<VisitModel>> {
        return this.queryByIndex(
            'patientId-checkInTime-index',
            'patientId = :patientId',
            {
                ':patientId': patientId,
            },
            undefined,
            options,
        );
    }

    /**
     * Query visits by patient and date range
     */
    async queryByPatientAndDateRange(
        patientId: string,
        startDate: string,
        endDate: string,
        options?: QueryOptions,
    ): Promise<QueryResult<VisitModel>> {
        return this.queryByIndex(
            'patientId-checkInTime-index',
            'patientId = :patientId AND checkInTime BETWEEN :startDate AND :endDate',
            {
                ':patientId': patientId,
                ':startDate': startDate,
                ':endDate': endDate,
            },
            undefined,
            options,
        );
    }
}
