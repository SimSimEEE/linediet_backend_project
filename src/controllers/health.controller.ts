/**
 * `health.controller.ts`
 * - Health check controller for system status and DynamoDB connection
 *
 * @author      Sim Ugeun
 * @date        2025-01-24
 */
import { Request, Response } from 'express';
import { DoctorRepository } from '../repositories/doctor.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { VisitRepository } from '../repositories/visit.repository';
import { _log } from '../cores/commons';

export class HealthController {
    private doctorRepo: DoctorRepository;
    private patientRepo: PatientRepository;
    private appointmentRepo: AppointmentRepository;
    private visitRepo: VisitRepository;

    constructor() {
        this.doctorRepo = new DoctorRepository();
        this.patientRepo = new PatientRepository();
        this.appointmentRepo = new AppointmentRepository();
        this.visitRepo = new VisitRepository();
    }

    /**
     * Basic health check
     */
    basic = async (req: Request, res: Response) => {
        try {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'linediet-appointment-api',
                version: '1.0.0',
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    /**
     * Database health check - checks DynamoDB connection and tables
     */
    database = async (req: Request, res: Response) => {
        try {
            const tableChecks = await Promise.allSettled([
                this.doctorRepo.checkTableExists(),
                this.patientRepo.checkTableExists(),
                this.appointmentRepo.checkTableExists(),
                this.visitRepo.checkTableExists(),
            ]);

            const results = {
                doctors: tableChecks[0].status === 'fulfilled' ? tableChecks[0].value : false,
                patients: tableChecks[1].status === 'fulfilled' ? tableChecks[1].value : false,
                appointments: tableChecks[2].status === 'fulfilled' ? tableChecks[2].value : false,
                visits: tableChecks[3].status === 'fulfilled' ? tableChecks[3].value : false,
            };

            const allHealthy = Object.values(results).every((v) => v === true);
            const errors = tableChecks
                .map((check, idx) => {
                    if (check.status === 'rejected') {
                        const tableName = ['doctors', 'patients', 'appointments', 'visits'][idx];
                        return { table: tableName, error: check.reason?.message || 'Unknown error' };
                    }
                    return null;
                })
                .filter((e) => e !== null);

            if (allHealthy) {
                res.json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    database: {
                        connected: true,
                        tables: results,
                    },
                });
            } else {
                res.status(503).json({
                    status: 'DEGRADED',
                    timestamp: new Date().toISOString(),
                    database: {
                        connected: true,
                        tables: results,
                        errors: errors,
                    },
                });
            }
        } catch (error) {
            _log('[HealthController] Database check error:', error);
            res.status(503).json({
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                database: {
                    connected: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    };
}
