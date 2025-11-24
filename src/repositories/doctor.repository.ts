/**
 * `repositories/doctor.repository.ts`
 * - Doctor repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
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
        return this.scanWithFilter(
            'isActive = :isActive AND attribute_not_exists(deletedAt)',
            {
                ':isActive': true,
            },
            undefined,
            options,
        );
    }

    /**
     * Get all doctors (excluding soft-deleted)
     */
    async getAllDoctors(options?: QueryOptions): Promise<QueryResult<DoctorModel>> {
        const result = await this.scan(options);
        // Filter out soft-deleted doctors
        return {
            items: result.items.filter((d) => !d.deletedAt),
            nextToken: result.nextToken,
            count: result.items.filter((d) => !d.deletedAt).length,
        };
    }

    /**
     * Search doctors by name
     */
    async searchByName(name: string, options?: QueryOptions): Promise<QueryResult<DoctorModel>> {
        return this.scanWithFilter(
            'contains(#name, :name) AND attribute_not_exists(deletedAt)',
            {
                ':name': name,
            },
            {
                '#name': 'name',
            },
            options,
        );
    }
}
