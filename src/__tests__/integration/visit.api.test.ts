/**
 * `__tests__/integration/visit.api.test.ts`
 * - Integration tests for Visit API endpoints
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import request from 'supertest';
import { createExpressServer } from '../../express';

describe('Visit API Integration Tests', () => {
    let app: any;
    let createdVisitId: string;
    let testDoctorId: string;
    let testPatientId: string;

    beforeAll(async () => {
        app = createExpressServer();

        // Create test doctor
        const doctorRes = await request(app).post('/doctors').send({
            name: '테스트의사',
            specialization: '침구과',
            isActive: true,
        });
        testDoctorId = doctorRes.body.id;

        // Create test patient
        const patientRes = await request(app).post('/patients').send({
            name: '테스트환자',
            phoneNumber: '010-9999-0001',
            ssn: '900101-1234567',
        });
        testPatientId = patientRes.body.id;
    });

    describe('POST /visits', () => {
        it('should create visit for existing patient', async () => {
            const response = await request(app)
                .post('/visits')
                .send({
                    patientId: testPatientId,
                    doctorId: testDoctorId,
                    chiefComplaint: '허리 통증',
                    visitType: 'follow-up',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.patientId).toBe(testPatientId);
            expect(response.body.doctorId).toBe(testDoctorId);
            expect(response.body.chiefComplaint).toBe('허리 통증');
            expect(response.body.visitType).toBe('follow-up');

            createdVisitId = response.body.id;
        });

        it('should create visit for first-time patient', async () => {
            const response = await request(app)
                .post('/visits')
                .send({
                    doctorId: testDoctorId,
                    patientName: '신규환자',
                    phoneNumber: '010-8888-7777',
                    ssn: '950505-2345678',
                    chiefComplaint: '목 통증',
                    visitType: 'first',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.visitType).toBe('first');
            expect(response.body.chiefComplaint).toBe('목 통증');
        });

        it('should reject visit without doctor', async () => {
            await request(app)
                .post('/visits')
                .send({
                    patientId: testPatientId,
                    chiefComplaint: '두통',
                })
                .expect(400);
        });

        it('should reject first-time visit without patient info', async () => {
            await request(app)
                .post('/visits')
                .send({
                    doctorId: testDoctorId,
                    patientName: '환자',
                    // Missing phoneNumber and ssn
                })
                .expect(400);
        });
    });

    describe('GET /visits/:id', () => {
        it('should get visit by id with populated data', async () => {
            const response = await request(app).get(`/visits/${createdVisitId}`).expect(200);

            expect(response.body.id).toBe(createdVisitId);
            expect(response.body).toHaveProperty('patient$');
            expect(response.body).toHaveProperty('doctor$');
            expect(response.body.patient$.id).toBe(testPatientId);
            expect(response.body.doctor$.id).toBe(testDoctorId);
        });

        it('should return 404 for non-existent visit', async () => {
            await request(app).get('/visits/non-existent-id').expect(404);
        });
    });

    describe('GET /visits/patient/:patientId', () => {
        it('should list visits by patient', async () => {
            const response = await request(app).get(`/visits/patient/${testPatientId}`).expect(200);

            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('count');
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body.items.length).toBeGreaterThan(0);
        });

        it('should respect limit parameter', async () => {
            const response = await request(app).get(`/visits/patient/${testPatientId}?limit=5`).expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(5);
        });
    });

    describe('POST /visits/search', () => {
        it('should search visits by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const response = await request(app)
                .post('/visits/search')
                .send({
                    patientId: testPatientId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                })
                .expect(200);

            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should require all parameters', async () => {
            await request(app)
                .post('/visits/search')
                .send({
                    patientId: testPatientId,
                    // Missing startDate and endDate
                })
                .expect(400);
        });
    });

    describe('PUT /visits/:id', () => {
        it('should update visit', async () => {
            const response = await request(app)
                .put(`/visits/${createdVisitId}`)
                .send({
                    diagnosis: '요추 염좌',
                    notes: '업데이트된 메모',
                })
                .expect(200);

            expect(response.body.diagnosis).toBe('요추 염좌');
            expect(response.body.notes).toBe('업데이트된 메모');
        });

        it('should return 404 for non-existent visit', async () => {
            await request(app)
                .put('/visits/non-existent-id')
                .send({
                    diagnosis: '테스트',
                })
                .expect(404);
        });
    });

    describe('POST /visits/:id/complete', () => {
        it('should complete visit with diagnosis and treatment', async () => {
            const response = await request(app)
                .post(`/visits/${createdVisitId}/complete`)
                .send({
                    diagnosis: '요추 염좌',
                    treatment: '침 치료, 한약 처방',
                    notes: '1주 후 재진',
                })
                .expect(200);

            expect(response.body.diagnosis).toBe('요추 염좌');
            expect(response.body.treatment).toBe('침 치료, 한약 처방');
            expect(response.body).toHaveProperty('completedAt');
            expect(response.body.completedAt).toBeTruthy();
        });

        it('should return 404 for non-existent visit', async () => {
            await request(app)
                .post('/visits/non-existent-id/complete')
                .send({
                    diagnosis: '테스트',
                })
                .expect(404);
        });
    });
});
