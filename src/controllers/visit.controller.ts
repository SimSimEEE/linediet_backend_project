/**
 * `controllers/visit.controller.ts`
 * - Visit API controller
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import { Request, Response } from 'express';
import { VisitService } from '../services/visit.service';
import { _err } from '../cores/commons';

/**
 * Visit Controller
 */
export class VisitController {
    private visitService: VisitService;

    constructor() {
        this.visitService = new VisitService();
    }

    /**
     * POST /visits - Create visit (check-in)
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const visit = await this.visitService.createVisit(req.body);
            res.status(201).json(visit);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * GET /visits/:id - Get visit by ID
     */
    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const visit = await this.visitService.getVisit(req.params.id);
            if (!visit) {
                res.status(404).json({
                    error: 'E_NOT_FOUND',
                    message: 'Visit not found',
                });
                return;
            }
            res.json(visit);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * GET /visits/patient/:patientId - List visits by patient
     */
    listByPatient = async (req: Request, res: Response): Promise<void> => {
        try {
            const { patientId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
            const visits = await this.visitService.listVisitsByPatient(patientId, limit);
            res.json({ items: visits, count: visits.length });
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * POST /visits/search - Search visits by date range
     */
    search = async (req: Request, res: Response): Promise<void> => {
        try {
            const { patientId, startDate, endDate } = req.body;
            if (!patientId || !startDate || !endDate) {
                res.status(400).json({
                    error: 'E_INVALID_INPUT',
                    message: 'patientId, startDate, and endDate are required',
                });
                return;
            }
            const visits = await this.visitService.listVisitsByDateRange(patientId, startDate, endDate);
            res.json({ items: visits, count: visits.length });
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * PUT /visits/:id - Update visit
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const visit = await this.visitService.updateVisit(req.params.id, req.body);
            res.json(visit);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * POST /visits/:id/complete - Complete visit
     */
    complete = async (req: Request, res: Response): Promise<void> => {
        try {
            const visit = await this.visitService.completeVisit(req.params.id, req.body);
            res.json(visit);
        } catch (error: any) {
            this.handleError(error, res);
        }
    };

    /**
     * Handle errors
     */
    private handleError(error: any, res: Response): void {
        _err('[VisitController] Error:', error);

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
