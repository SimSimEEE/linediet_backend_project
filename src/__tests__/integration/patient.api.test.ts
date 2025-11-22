/**
 * `__tests__/integration/patient.api.test.ts`
 * - Integration tests for Patient API endpoints
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import request from 'supertest';
import { createExpressServer } from '../../express';

describe('Patient API Integration Tests', () => {
    let app: any;
    let createdPatientId: string;

    beforeAll(() => {
        app = createExpressServer();
    });

    describe('POST /patients', () => {
        it('should create a new patient', async () => {
            const response = await request(app)
                .post('/patients')
                .send({
                    name: '홍길동',
                    phoneNumber: '010-1234-5678',
                    birthYearMonth: '199001',
                    ssn: '900101-1234567',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('홍길동');
            expect(response.body.phoneNumber).toBeDefined();

            createdPatientId = response.body.id;
        });

        it('should reject patient without required fields', async () => {
            await request(app)
                .post('/patients')
                .send({
                    name: '테스트',
                })
                .expect(400);
        });
    });

    describe('GET /patients/:id', () => {
        it('should get patient by id', async () => {
            const response = await request(app).get(`/patients/${createdPatientId}`).expect(200);

            expect(response.body.id).toBe(createdPatientId);
            expect(response.body.name).toBe('홍길동');
        });

        it('should return 404 for non-existent patient', async () => {
            await request(app).get('/patients/non-existent-id').expect(404);
        });
    });

    describe('GET /patients', () => {
        it('should list patients', async () => {
            const response = await request(app).get('/patients').expect(200);

            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('count');
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should respect limit parameter', async () => {
            const response = await request(app).get('/patients?limit=5').expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(5);
        });
    });

    describe('POST /patients/search', () => {
        it('should search patients by name', async () => {
            const response = await request(app)
                .post('/patients/search')
                .send({
                    name: '홍길동',
                })
                .expect(200);

            expect(response.body.items.length).toBeGreaterThan(0);
            expect(response.body.items[0].name).toContain('홍길동');
        });

        it('should search patients by phone number', async () => {
            const response = await request(app)
                .post('/patients/search')
                .send({
                    phoneNumber: '010-1234-5678',
                })
                .expect(200);

            expect(response.body.items.length).toBeGreaterThan(0);
        });
    });

    describe('PUT /patients/:id', () => {
        it('should update patient', async () => {
            const response = await request(app)
                .put(`/patients/${createdPatientId}`)
                .send({
                    phoneNumber: '010-9876-5432',
                    notes: '업데이트된 메모',
                })
                .expect(200);

            expect(response.body.notes).toBe('업데이트된 메모');
        });

        it('should return 404 for non-existent patient', async () => {
            await request(app)
                .put('/patients/non-existent-id')
                .send({
                    notes: '테스트',
                })
                .expect(404);
        });
    });

    describe('DELETE /patients/:id', () => {
        it('should soft delete patient', async () => {
            await request(app).delete(`/patients/${createdPatientId}`).expect(204);
        });

        it('should return 404 for already deleted patient', async () => {
            await request(app).get(`/patients/${createdPatientId}`).expect(404);
        });
    });
});
