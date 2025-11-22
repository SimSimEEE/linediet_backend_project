/**
 * `__tests__/integration/appointment.api.test.ts`
 * - Integration tests for Appointment API endpoints
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import request from 'supertest';
import { createExpressServer } from '../../express';

describe('Appointment API Integration Tests', () => {
    let app: any;
    let createdAppointmentId: string;
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

    describe('POST /appointments', () => {
        it('should create a new appointment', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const appointmentDate = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .post('/appointments')
                .send({
                    doctorId: testDoctorId,
                    patientId: testPatientId,
                    bookerName: '테스트환자',
                    bookerPhone: '01099990001',
                    appointmentDate,
                    appointmentTime: '14:00',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.doctorId).toBe(testDoctorId);
            expect(response.body.appointmentTime).toBe('14:00');
            expect(response.body.status).toBe('CONFIRMED');

            createdAppointmentId = response.body.id;
        });

        it('should reject appointment with past time', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const pastDate = yesterday.toISOString().split('T')[0];

            await request(app)
                .post('/appointments')
                .send({
                    doctorId: testDoctorId,
                    bookerName: '테스트환자',
                    bookerPhone: '01099990001',
                    appointmentDate: pastDate,
                    appointmentTime: '14:00',
                })
                .expect(400);
        });

        it('should reject appointment with invalid time format', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const appointmentDate = tomorrow.toISOString().split('T')[0];

            await request(app)
                .post('/appointments')
                .send({
                    doctorId: testDoctorId,
                    bookerName: '테스트환자',
                    bookerPhone: '01099990001',
                    appointmentDate,
                    appointmentTime: '14:15', // Invalid: not 00 or 30
                })
                .expect(400);
        });

        it('should reject duplicate appointment', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const appointmentDate = tomorrow.toISOString().split('T')[0];

            await request(app)
                .post('/appointments')
                .send({
                    doctorId: testDoctorId,
                    bookerName: '다른환자',
                    bookerPhone: '01099990002',
                    appointmentDate,
                    appointmentTime: '14:00', // Same time as first appointment
                })
                .expect(409);
        });
    });

    describe('GET /appointments', () => {
        it('should query appointments by date', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const appointmentDate = tomorrow.toISOString().split('T')[0];

            const response = await request(app).get('/appointments').query({ appointmentDate }).expect(200);

            expect(response.body).toHaveProperty('list');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.list)).toBe(true);
        });

        it('should query appointments by doctor', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const appointmentDate = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .get('/appointments')
                .query({ appointmentDate, doctorId: testDoctorId })
                .expect(200);

            expect(response.body.list.length).toBeGreaterThan(0);
            expect(response.body.list[0].doctorId).toBe(testDoctorId);
        });

        it('should require appointmentDate parameter', async () => {
            await request(app).get('/appointments').expect(400);
        });
    });

    describe('POST /appointments/search', () => {
        it('should search appointments by booker info', async () => {
            const response = await request(app)
                .post('/appointments/search')
                .send({
                    bookerName: '테스트환자',
                    bookerPhone: '01099990001',
                })
                .expect(200);

            expect(response.body).toHaveProperty('list');
            expect(response.body.list.length).toBeGreaterThan(0);
        });
    });

    describe('PUT /appointments/:id', () => {
        it('should update appointment', async () => {
            const response = await request(app)
                .put(`/appointments/${createdAppointmentId}`)
                .send({
                    appointmentTime: '15:00',
                })
                .expect(200);

            expect(response.body.appointmentTime).toBe('15:00');
        });

        it('should return 404 for non-existent appointment', async () => {
            await request(app)
                .put('/appointments/non-existent-id')
                .send({
                    appointmentTime: '15:00',
                })
                .expect(404);
        });
    });

    describe('POST /appointments/:id/cancel', () => {
        it('should cancel appointment', async () => {
            const response = await request(app)
                .post(`/appointments/${createdAppointmentId}/cancel`)
                .send({
                    reason: '개인 사정',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should handle cancelling already cancelled appointment', async () => {
            const response = await request(app)
                .post(`/appointments/${createdAppointmentId}/cancel`)
                .send({
                    reason: '개인 사정',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
