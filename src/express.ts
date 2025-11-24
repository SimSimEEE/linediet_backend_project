/**
 * `express.ts`
 * - Express server configuration
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AppointmentController } from './controllers/appointment.controller';
import { PatientController } from './controllers/patient.controller';
import { DoctorController } from './controllers/doctor.controller';
import { VisitController } from './controllers/visit.controller';
import { HealthController } from './controllers/health.controller';
import { _log, $U } from './cores/commons';

/**
 * Create Express server
 */
export const createExpressServer = () => {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Swagger Configuration
    const swaggerOptions: swaggerJsdoc.Options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'LineDiet Appointment API',
                version: '1.0.0',
                description: '한의원 진료 예약 및 관리 시스템 API',
                contact: {
                    name: 'API Support',
                    email: 'support@linediet.com',
                },
            },
            servers: [
                {
                    url: 'http://localhost:8809',
                    description: 'Development server',
                },
            ],
        },
        apis: ['./swagger/*.yml'],
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Controllers
    const appointmentController = new AppointmentController();
    const patientController = new PatientController();
    const doctorController = new DoctorController();
    const visitController = new VisitController();
    const healthController = new HealthController();

    // Routes
    app.get('/', (req, res) => {
        res.json({
            name: 'linediet-appointment-api',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/health', healthController.basic);
    app.get('/health/db', healthController.database);

    // Appointment routes
    app.post('/appointments', appointmentController.create);
    app.get('/appointments', appointmentController.query);
    app.post('/appointments/search', appointmentController.search);
    app.put('/appointments/:id', appointmentController.update);
    app.post('/appointments/:id/cancel', appointmentController.cancel);

    // Patient routes
    app.post('/patients', patientController.create);
    app.get('/patients', patientController.list);
    app.get('/patients/:id', patientController.getById);
    app.post('/patients/search', patientController.search);
    app.put('/patients/:id', patientController.update);
    app.delete('/patients/:id', patientController.delete);

    // Doctor routes
    app.post('/doctors', doctorController.create);
    app.get('/doctors', doctorController.list);
    app.get('/doctors/:id', doctorController.getById);
    app.post('/doctors/search', doctorController.search);
    app.put('/doctors/:id', doctorController.update);
    app.delete('/doctors/:id', doctorController.delete);

    // Visit routes
    app.post('/visits', visitController.create);
    app.get('/visits/:id', visitController.getById);
    app.get('/visits/patient/:patientId', visitController.listByPatient);
    app.post('/visits/search', visitController.search);
    app.put('/visits/:id', visitController.update);
    app.post('/visits/:id/complete', visitController.complete);

    return app;
};

/**
 * Start Express server (for standalone execution)
 */
export const startServer = () => {
    const app = createExpressServer();
    const port = $U.env('PORT', '8809');

    app.listen(port, () => {
        _log(`[Express] Server running on port ${port}`);
        _log(`[Express] Environment: ${$U.env('STAGE', 'local')}`);
    });

    return app;
};

export default { createExpressServer, startServer };
