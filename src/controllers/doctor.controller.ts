/**
 * `controllers/doctor.controller.ts`
 * - Doctor API controller
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { Request, Response } from 'express';
import { DoctorService } from '../services/doctor.service';
import { _err } from '../cores/commons';

/**
 * Doctor Controller
 */
export class DoctorController {
    private doctorService: DoctorService;

    constructor() {
        this.doctorService = new DoctorService();
    }

    /**
     * POST /doctors - Create new doctor
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctor = await this.doctorService.createDoctor(req.body);
            res.status(201).json(doctor);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * GET /doctors/:id - Get doctor by ID
     */
    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctor = await this.doctorService.getDoctor(req.params.id);
            if (!doctor) {
                res.status(404).json({
                    error: 'E_NOT_FOUND',
                    message: 'Doctor not found',
                });
                return;
            }
            res.json(doctor);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * GET /doctors - List all doctors
     */
    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
            const activeOnly = req.query.activeOnly === 'true';
            const doctors = await this.doctorService.listDoctors(limit, activeOnly);
            res.json({ items: doctors, count: doctors.length });
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * POST /doctors/search - Search doctors
     */
    search = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name } = req.body;
            if (!name) {
                res.status(400).json({
                    error: 'E_INVALID_INPUT',
                    message: 'Name is required for search',
                });
                return;
            }
            const doctors = await this.doctorService.searchDoctors(name);
            res.json({ items: doctors, count: doctors.length });
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * PUT /doctors/:id - Update doctor
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctor = await this.doctorService.updateDoctor(req.params.id, req.body);
            res.json(doctor);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * DELETE /doctors/:id - Delete doctor
     */
    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            await this.doctorService.deleteDoctor(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * Handle errors
     */
    private handleError(error: any, res: Response): void {
        _err('[DoctorController] Error:', error);

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
