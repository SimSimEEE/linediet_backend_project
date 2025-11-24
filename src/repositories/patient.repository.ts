/**
 * `repositories/patient.repository.ts`
 * - Patient repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
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
        return this.scanWithFilter(
            'phoneNumber = :phoneNumber AND attribute_not_exists(deletedAt)',
            {
                ':phoneNumber': phoneNumber,
            },
            undefined,
            options,
        );
    }

    /**
     * Find patient by phone number hash (for efficient searching)
     */
    async findByPhoneHash(phoneHash: string, options?: QueryOptions): Promise<QueryResult<PatientModel>> {
        return this.scanWithFilter(
            'phoneNumberHash = :phoneHash AND attribute_not_exists(deletedAt)',
            {
                ':phoneHash': phoneHash,
            },
            undefined,
            options,
        );
    }

    /**
     * Search patients by name (partial match using scan)
     */
    async searchByName(name: string, options?: QueryOptions): Promise<QueryResult<PatientModel>> {
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
