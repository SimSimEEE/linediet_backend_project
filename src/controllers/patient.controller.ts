/**
 * `controllers/patient.controller.ts`
 * - Patient API controller
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */
import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service';
import { _err } from '../cores/commons';

/**
 * Patient Controller
 */
export class PatientController {
    private patientService: PatientService;

    constructor() {
        this.patientService = new PatientService();
    }

    /**
     * POST /patients - Create new patient
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const patient = await this.patientService.createPatient(req.body);
            res.status(201).json(patient);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * GET /patients/:id - Get patient by ID
     */
    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const patient = await this.patientService.getPatient(req.params.id);
            if (!patient) {
                res.status(404).json({
                    error: 'E_NOT_FOUND',
                    message: 'Patient not found',
                });
                return;
            }
            res.json(patient);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * GET /patients - List all patients
     */
    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
            const patients = await this.patientService.listPatients(limit);
            res.json({ items: patients, count: patients.length });
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * POST /patients/search - Search patients
     */
    search = async (req: Request, res: Response): Promise<void> => {
        try {
            const patients = await this.patientService.searchPatients(req.body);
            res.json({ items: patients, count: patients.length });
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * PUT /patients/:id - Update patient
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const patient = await this.patientService.updatePatient(req.params.id, req.body);
            res.json(patient);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * DELETE /patients/:id - Delete patient
     */
    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            await this.patientService.deletePatient(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * Handle errors
     */
    private handleError(error: any, res: Response): void {
        _err('[PatientController] Error:', error);

        const message = error.message || error;
        if (message.startsWith('E_NOT_FOUND')) {
            res.status(404).json({ error: 'E_NOT_FOUND', message });
        } else if (message.startsWith('E_INVALID_INPUT')) {
            res.status(400).json({ error: 'E_INVALID_INPUT', message });
        } else {
            res.status(500).json({ error: 'E_INTERNAL', message: 'Internal server error' });
        }
    }
}
