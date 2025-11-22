/**
 * `api/cron.handler.ts`
 * - Cron job handler for no-show detection
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import { AppointmentService } from '../services/appointment.service';
import { _log, _inf } from '../cores/commons';

/**
 * Handle cron events
 */
export const handleCronEvent = async (event: any) => {
    _inf('[CronHandler] Event:', JSON.stringify(event));

    const cronName = event?.cron?.name;

    if (cronName === 'NO_SHOW_DETECTION') {
        return await handleNoShowDetection();
    }

    _log('[CronHandler] Unknown cron:', cronName);
    return { success: false, message: 'Unknown cron job' };
};

/**
 * No-show detection handler
 */
const handleNoShowDetection = async () => {
    _inf('[CronHandler] Starting no-show detection...');

    const service = new AppointmentService();
    const count = await service.markNoShows();

    _inf(`[CronHandler] Marked ${count} appointments as no-show`);

    return {
        success: true,
        count,
        message: `Marked ${count} appointments as no-show`,
    };
};
