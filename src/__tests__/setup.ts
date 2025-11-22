/**
 * `__tests__/setup.ts`
 * - Test setup and configuration
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */

// Mock environment variables for testing (MUST be before any imports)
process.env.STAGE = 'test';
process.env.PATIENT_TABLE = 'appointment-patients-test';
process.env.DOCTOR_TABLE = 'appointment-doctors-test';
process.env.APPOINTMENT_TABLE = 'appointment-appointments-test';
process.env.VISIT_TABLE = 'appointment-visits-test';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.PORT = '0'; // Use random available port

// Set test timeout
jest.setTimeout(30000);

// In-memory data store for tests - GLOBAL SHARED STATE
const mockDataStore = new Map<string, Map<string, any>>();

// Initialize table stores
mockDataStore.set('appointment-patients-test', new Map());
mockDataStore.set('appointment-doctors-test', new Map());
mockDataStore.set('appointment-appointments-test', new Map());
mockDataStore.set('appointment-visits-test', new Map());

// Helper to get table store
const getTableStore = (tableName: string) => {
    if (!mockDataStore.has(tableName)) {
        mockDataStore.set(tableName, new Map());
    }
    return mockDataStore.get(tableName)!;
};

// Mock AWS SDK BEFORE any repository imports
jest.mock('aws-sdk', () => {
    return {
        DynamoDB: {
            DocumentClient: jest.fn().mockImplementation(() => {
                return {
                    get: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const store = getTableStore(params.TableName);
                            const item = store.get(params.Key.id);
                            return { Item: item };
                        }),
                    })),
                    put: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const store = getTableStore(params.TableName);
                            store.set(params.Item.id, params.Item);
                            console.log(`[MOCK] PUT ${params.TableName}:`, params.Item.id, '- Store size:', store.size);
                            return {};
                        }),
                    })),
                    update: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const store = getTableStore(params.TableName);
                            const existing = store.get(params.Key.id);
                            if (existing) {
                                // Handle UpdateExpression properly
                                const updated = {
                                    ...existing,
                                    ...params.ExpressionAttributeValues,
                                };
                                store.set(params.Key.id, updated);
                                return { Attributes: updated };
                            }
                            return {};
                        }),
                    })),
                    delete: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const store = getTableStore(params.TableName);
                            store.delete(params.Key.id);
                            return {};
                        }),
                    })),
                    query: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const store = getTableStore(params.TableName);
                            const items = Array.from(store.values());
                            return { Items: items, Count: items.length };
                        }),
                    })),
                    scan: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const store = getTableStore(params.TableName);
                            const items = Array.from(store.values()).filter((item) => !item.deletedAt);
                            return { Items: items, Count: items.length };
                        }),
                    })),
                    batchGet: jest.fn((params: any) => ({
                        promise: jest.fn(async () => {
                            const tableName = Object.keys(params.RequestItems)[0];
                            const store = getTableStore(tableName);
                            const keys = params.RequestItems[tableName].Keys;
                            const items = keys.map((key: any) => store.get(key.id)).filter(Boolean);
                            return { Responses: { [tableName]: items } };
                        }),
                    })),
                };
            }),
        },
    };
});

// Clear data between tests
beforeEach(() => {
    // DO NOT clear mocks - we need them to persist
    // Clear all table stores
    mockDataStore.forEach((store) => store.clear());
    console.log('[SETUP] Cleared all mock data stores');
});

// Export utilities for tests
export { mockDataStore, getTableStore };
