/**
 * `repositories/base.repository.ts`
 * - Base repository for DynamoDB operations
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { DynamoDB } from 'aws-sdk';
import { CoreModel } from '../models';
import { _log, _err, generateId, nowKST } from '../cores/commons';

/**
 * DynamoDB Document Client
 */
const getDynamoDBConfig = () => {
    const config: DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration = {
        region: process.env.DEFAULT_REGION || 'ap-northeast-2',
    };

    // For local development, use DynamoDB Local if available
    if (process.env.LS === '1' || process.env.STAGE === 'local') {
        config.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
        config.accessKeyId = 'local';
        config.secretAccessKey = 'local';
    }

    return config;
};

const dynamoDB = new DynamoDB.DocumentClient(getDynamoDBConfig());

/**
 * Query Options
 */
export interface QueryOptions {
    limit?: number;
    nextToken?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Query Result
 */
export interface QueryResult<T> {
    items: T[];
    nextToken?: string;
    count: number;
}

/**
 * Base Repository
 */
export abstract class BaseRepository<T extends CoreModel<any>> {
    protected readonly tableName: string;
    protected readonly modelType: string;
    protected readonly dynamoDB: DynamoDB.DocumentClient;

    constructor(tableName: string, modelType: string) {
        this.tableName = tableName;
        this.modelType = modelType;
        this.dynamoDB = dynamoDB;
    }

    /**
     * Generate new ID
     */
    protected generateId(): string {
        return `${this.modelType}-${generateId()}`;
    }

    /**
     * Create item
     */
    async create(item: Partial<T>): Promise<T> {
        const now = nowKST();
        const newItem: T = {
            ...item,
            id: this.generateId(),
            type: this.modelType,
            createdAt: now,
            updatedAt: now,
        } as T;

        const params = {
            TableName: this.tableName,
            Item: newItem,
        };

        try {
            await dynamoDB.put(params).promise();
            _log(`[${this.modelType}] Created:`, newItem.id);
            return newItem;
        } catch (error) {
            _err(`[${this.modelType}] Create failed:`, error);
            throw error;
        }
    }

    /**
     * Get item by ID
     */
    async getById(id: string): Promise<T | null> {
        const params = {
            TableName: this.tableName,
            Key: { id },
        };

        try {
            const result = await dynamoDB.get(params).promise();
            return (result.Item as T) || null;
        } catch (error) {
            _err(`[${this.modelType}] Get failed:`, error);
            throw error;
        }
    }

    /**
     * Update item
     */
    async update(id: string, updates: Partial<T>): Promise<T> {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error(`${this.modelType} not found: ${id}`);
        }

        const updatedItem: T = {
            ...existing,
            ...updates,
            id: existing.id, // Prevent ID change
            type: existing.type, // Prevent type change
            createdAt: existing.createdAt, // Prevent createdAt change
            updatedAt: nowKST(),
        };

        const params = {
            TableName: this.tableName,
            Item: updatedItem,
        };

        try {
            await dynamoDB.put(params).promise();
            _log(`[${this.modelType}] Updated:`, id);
            return updatedItem;
        } catch (error) {
            _err(`[${this.modelType}] Update failed:`, error);
            throw error;
        }
    }

    /**
     * Delete item (soft delete)
     */
    async delete(id: string): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: 'SET deletedAt = :deletedAt, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':deletedAt': nowKST(),
                ':updatedAt': nowKST(),
            },
        };

        try {
            await dynamoDB.update(params).promise();
            _log(`[${this.modelType}] Deleted:`, id);
            return true;
        } catch (error) {
            _err(`[${this.modelType}] Delete failed:`, error);
            throw error;
        }
    }

    /**
     * Hard delete item
     */
    async hardDelete(id: string): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            Key: { id },
        };

        try {
            await dynamoDB.delete(params).promise();
            _log(`[${this.modelType}] Hard deleted:`, id);
            return true;
        } catch (error) {
            _err(`[${this.modelType}] Hard delete failed:`, error);
            throw error;
        }
    }

    /**
     * Scan all items (use with caution)
     */
    async scan(options?: QueryOptions): Promise<QueryResult<T>> {
        const params: DynamoDB.DocumentClient.ScanInput = {
            TableName: this.tableName,
            Limit: options?.limit || 100,
            ExclusiveStartKey: options?.nextToken ? JSON.parse(options.nextToken) : undefined,
        };

        try {
            const result = await dynamoDB.scan(params).promise();
            return {
                items: (result.Items as T[]) || [],
                nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
                count: result.Count || 0,
            };
        } catch (error) {
            _err(`[${this.modelType}] Scan failed:`, error);
            throw error;
        }
    }

    /**
     * Scan with filter expression
     */
    protected async scanWithFilter(
        filterExpression: string,
        expressionAttributeValues: any,
        expressionAttributeNames?: any,
        options?: QueryOptions,
    ): Promise<QueryResult<T>> {
        const params: DynamoDB.DocumentClient.ScanInput = {
            TableName: this.tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            Limit: options?.limit || 100,
            ExclusiveStartKey: options?.nextToken ? JSON.parse(options.nextToken) : undefined,
        };

        try {
            const result = await dynamoDB.scan(params).promise();
            return {
                items: (result.Items as T[]) || [],
                nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
                count: result.Count || 0,
            };
        } catch (error) {
            _err(`[${this.modelType}] Scan with filter failed:`, error);
            throw error;
        }
    }

    /**
     * Query by index
     */
    protected async queryByIndex(
        indexName: string,
        keyConditionExpression: string,
        expressionAttributeValues: any,
        expressionAttributeNames?: any,
        options?: QueryOptions,
    ): Promise<QueryResult<T>> {
        const params: DynamoDB.DocumentClient.QueryInput = {
            TableName: this.tableName,
            IndexName: indexName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            Limit: options?.limit || 100,
            ScanIndexForward: options?.sortOrder !== 'desc',
            ExclusiveStartKey: options?.nextToken ? JSON.parse(options.nextToken) : undefined,
        };

        try {
            const result = await dynamoDB.query(params).promise();
            return {
                items: (result.Items as T[]) || [],
                nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
                count: result.Count || 0,
            };
        } catch (error) {
            _err(`[${this.modelType}] Query failed:`, error);
            throw error;
        }
    }

    /**
     * Batch get items
     */
    async batchGet(ids: string[]): Promise<T[]> {
        if (ids.length === 0) return [];

        const params = {
            RequestItems: {
                [this.tableName]: {
                    Keys: ids.map((id) => ({ id })),
                },
            },
        };

        try {
            const result = await dynamoDB.batchGet(params).promise();
            return (result.Responses?.[this.tableName] as T[]) || [];
        } catch (error) {
            _err(`[${this.modelType}] Batch get failed:`, error);
            throw error;
        }
    }

    /**
     * Check if table exists and is accessible
     */
    async checkTableExists(): Promise<boolean> {
        try {
            // Try to scan with limit 1 to check table accessibility
            const params: DynamoDB.DocumentClient.ScanInput = {
                TableName: this.tableName,
                Limit: 1,
            };
            await dynamoDB.scan(params).promise();
            return true;
        } catch (error: any) {
            if (error.code === 'ResourceNotFoundException') {
                _log(`[${this.modelType}] Table not found: ${this.tableName}`);
                return false;
            }
            _err(`[${this.modelType}] Table check failed:`, error);
            throw error;
        }
    }
}
