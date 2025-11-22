/**
 * `repositories/patient.repository.ts`
 * - Patient repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { PatientModel } from '../models';
import { BaseRepository, QueryOptions, QueryResult } from './base.repository';
import { $U } from '../cores/commons';

/**
 * Patient Repository
 */
export class PatientRepository extends BaseRepository<PatientModel> {
    constructor() {
        const tableName = $U.env('PATIENT_TABLE', 'appointment-patients-dev');
        super(tableName, 'patient');
    }

    /**
     * Find patient by phone number (encrypted)
     */
    async findByPhoneNumber(phoneNumber: string, options?: QueryOptions): Promise<QueryResult<PatientModel>> {
        return this.queryByIndex(
            'phoneNumber-index',
            'phoneNumber = :phoneNumber',
            {
                ':phoneNumber': phoneNumber,
            },
            undefined,
            options,
        );
    }

    /**
     * Search patients by name (partial match using scan)
     */
    async searchByName(name: string, options?: QueryOptions): Promise<QueryResult<PatientModel>> {
        const params = {
            TableName: this.tableName,
            FilterExpression: 'contains(#name, :name) AND attribute_not_exists(deletedAt)',
            ExpressionAttributeNames: {
                '#name': 'name',
            },
            ExpressionAttributeValues: {
                ':name': name,
            },
            Limit: options?.limit || 100,
        };

        try {
            const result = await (this as any).dynamoDB.scan(params).promise();
            return {
                items: (result.Items as PatientModel[]) || [],
                nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
                count: result.Count || 0,
            };
        } catch (error) {
            throw error;
        }
    }
}
