/**
 * `index.ts`
 * - Main entry point
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 */
import { handleCronEvent } from './api/cron.handler';
import { _log, _err } from './cores/commons';

/**
 * Lambda handler
 */
export const lambda = async (event: any, context: any) => {
    _log('[Lambda] Event:', JSON.stringify(event));

    try {
        // Cron event
        if (event.cron) {
            return await handleCronEvent(event);
        }

        // HTTP event (API Gateway)
        if (event.httpMethod) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'API Gateway integration required' }),
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Unknown event type' }),
        };
    } catch (error) {
        _err('[Lambda] Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};

/**
 * Express server entry
 */
export const express = () => {
    const { startServer } = require('./express');
    return startServer();
};

/**
 * Main runner for local development
 */
if (typeof require !== 'undefined' && require.main === module) {
    if (process.argv.length <= 2) {
        express();
    }
}
