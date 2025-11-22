/**
 * `controllers/appointment.controller.ts`
 * - Appointment HTTP controller
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { _log, _err } from '../cores/commons';

export class AppointmentController {
    private service: AppointmentService;

    constructor() {
        this.service = new AppointmentService();
    }

    /**
     * POST /appointments - Create appointment
     */
    create = async (req: Request, res: Response) => {
        try {
            const appointment = await this.service.createAppointment(req.body);
            res.status(201).json(appointment);
        } catch (error: any) {
            _err('[AppointmentController] Create failed:', error);
            this.handleError(error, res);
        }
    };

    /**
     * GET /appointments - Query appointments
     */
    query = async (req: Request, res: Response) => {
        try {
            const params = {
                appointmentDate: req.query.appointmentDate as string,
                doctorId: req.query.doctorId as string,
                patientId: req.query.patientId as string,
                includeAll: req.query.includeAll === 'true',
            };

            if (!params.appointmentDate) {
                return res.status(400).json({
                    error: 'E_INVALID_INPUT',
                    message: 'appointmentDate is required',
                });
            }

            const appointments = await this.service.queryAppointments(params);
            res.json({ list: appointments, total: appointments.length });
        } catch (error: any) {
            _err('[AppointmentController] Query failed:', error);
            this.handleError(error, res);
        }
    };

    /**
     * POST /appointments/search - Search appointments
     */
    search = async (req: Request, res: Response) => {
        try {
            const appointments = await this.service.searchAppointments(req.body);
            res.json({ list: appointments, total: appointments.length });
        } catch (error: any) {
            _err('[AppointmentController] Search failed:', error);
            this.handleError(error, res);
        }
    };

    /**
     * POST /appointments/:id/cancel - Cancel appointment
     */
    cancel = async (req: Request, res: Response) => {
        try {
            const success = await this.service.cancelAppointment(req.params.id, req.body.reason);
            res.json({ success });
        } catch (error: any) {
            _err('[AppointmentController] Cancel failed:', error);
            this.handleError(error, res);
        }
    };

    /**
     * PUT /appointments/:id - Update appointment
     */
    update = async (req: Request, res: Response) => {
        try {
            const appointment = await this.service.updateAppointment(req.params.id, req.body);
            res.json(appointment);
        } catch (error: any) {
            _err('[AppointmentController] Update failed:', error);
            this.handleError(error, res);
        }
    };

    /**
     * Error handler
     */
    private handleError(error: any, res: Response) {
        const message = error.message || 'Internal server error';

        if (message.includes('E_DUPLICATED')) {
            return res.status(409).json({ error: 'E_DUPLICATED', message, code: 'E_DUPLICATED' });
        }
        if (message.includes('E_NOT_FOUND')) {
            return res.status(404).json({ error: 'E_NOT_FOUND', message, code: 'E_NOT_FOUND' });
        }
        if (message.includes('E_INVALID')) {
            return res.status(400).json({ error: 'E_INVALID_INPUT', message, code: 'E_INVALID_INPUT' });
        }
        if (message.includes('E_PAST_TIME')) {
            return res.status(400).json({ error: 'E_PAST_TIME', message, code: 'E_PAST_TIME' });
        }

        res.status(500).json({ error: 'E_INTERNAL', message, code: 'E_INTERNAL' });
    }
}
