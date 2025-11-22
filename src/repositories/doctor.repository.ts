/**
 * `repositories/doctor.repository.ts`
 * - Doctor repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { DoctorModel } from '../models';
import { BaseRepository, QueryOptions, QueryResult } from './base.repository';
import { $U } from '../cores/commons';

/**
 * Doctor Repository
 */
export class DoctorRepository extends BaseRepository<DoctorModel> {
    constructor() {
        const tableName = $U.env('DOCTOR_TABLE', 'appointment-doctors-dev');
        super(tableName, 'doctor');
    }

    /**
     * Get all active doctors
     */
    async getActiveDoctors(options?: QueryOptions): Promise<QueryResult<DoctorModel>> {
        const params = {
            TableName: this.tableName,
            FilterExpression: 'isActive = :isActive AND attribute_not_exists(deletedAt)',
            ExpressionAttributeValues: {
                ':isActive': true,
            },
            Limit: options?.limit || 100,
        };

        try {
            const result = await (this as any).dynamoDB.scan(params).promise();
            return {
                items: (result.Items as DoctorModel[]) || [],
                nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
                count: result.Count || 0,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search doctors by name
     */
    async searchByName(name: string, options?: QueryOptions): Promise<QueryResult<DoctorModel>> {
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
                items: (result.Items as DoctorModel[]) || [],
                nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
                count: result.Count || 0,
            };
        } catch (error) {
            throw error;
        }
    }
}
