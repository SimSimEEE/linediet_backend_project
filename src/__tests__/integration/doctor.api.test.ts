/**
 * `__tests__/integration/doctor.api.test.ts`
 * - Integration tests for Doctor API endpoints
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import request from 'supertest';
import { createExpressServer } from '../../express';

describe('Doctor API Integration Tests', () => {
    let app: any;
    let createdDoctorId: string;

    beforeAll(() => {
        app = createExpressServer();
    });

    describe('POST /doctors', () => {
        it('should create a new doctor', async () => {
            const response = await request(app)
                .post('/doctors')
                .send({
                    name: '김한의',
                    specialization: '침구과',
                    licenseNumber: '12345',
                    isActive: true,
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('김한의');
            expect(response.body.isActive).toBe(true);

            createdDoctorId = response.body.id;
        });

        it('should reject doctor without name', async () => {
            await request(app)
                .post('/doctors')
                .send({
                    specialization: '침구과',
                })
                .expect(400);
        });
    });

    describe('GET /doctors/:id', () => {
        it('should get doctor by id', async () => {
            const response = await request(app).get(`/doctors/${createdDoctorId}`).expect(200);

            expect(response.body.id).toBe(createdDoctorId);
            expect(response.body.name).toBe('김한의');
        });

        it('should return 404 for non-existent doctor', async () => {
            await request(app).get('/doctors/non-existent-id').expect(404);
        });
    });

    describe('GET /doctors', () => {
        it('should list all doctors', async () => {
            const response = await request(app).get('/doctors').expect(200);

            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('count');
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should list only active doctors', async () => {
            const response = await request(app).get('/doctors?activeOnly=true').expect(200);

            response.body.items.forEach((doctor: any) => {
                expect(doctor.isActive).toBe(true);
            });
        });

        it('should respect limit parameter', async () => {
            const response = await request(app).get('/doctors?limit=5').expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(5);
        });
    });

    describe('POST /doctors/search', () => {
        it('should search doctors by name', async () => {
            const response = await request(app)
                .post('/doctors/search')
                .send({
                    name: '김한의',
                })
                .expect(200);

            expect(response.body.items.length).toBeGreaterThan(0);
            expect(response.body.items[0].name).toContain('김한의');
        });

        it('should require name parameter', async () => {
            await request(app).post('/doctors/search').send({}).expect(400);
        });
    });

    describe('PUT /doctors/:id', () => {
        it('should update doctor', async () => {
            const response = await request(app)
                .put(`/doctors/${createdDoctorId}`)
                .send({
                    specialization: '한방내과',
                    notes: '업데이트된 메모',
                })
                .expect(200);

            expect(response.body.specialization).toBe('한방내과');
            expect(response.body.notes).toBe('업데이트된 메모');
        });

        it('should deactivate doctor', async () => {
            const response = await request(app)
                .put(`/doctors/${createdDoctorId}`)
                .send({
                    isActive: false,
                })
                .expect(200);

            expect(response.body.isActive).toBe(false);
        });

        it('should return 404 for non-existent doctor', async () => {
            await request(app)
                .put('/doctors/non-existent-id')
                .send({
                    notes: '테스트',
                })
                .expect(404);
        });
    });

    describe('DELETE /doctors/:id', () => {
        it('should soft delete doctor', async () => {
            await request(app).delete(`/doctors/${createdDoctorId}`).expect(204);
        });

        it('should return 404 for already deleted doctor', async () => {
            await request(app).get(`/doctors/${createdDoctorId}`).expect(404);
        });
    });
});
