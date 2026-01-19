/**
 * Routes - API route definitions
 * Follows Separation of Concerns Principle
 * Routes are separated from controller logic
 */

import { Router } from 'express';
import { validateParams, validateQuery, validateBody } from '../middleware/ValidationMiddleware.js';

/**
 * Define health check route
 * @param {Router} router - Express router
 */
export function defineHealthRoutes(router) {
    router.get('/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    router.get('/database', (req, res) => {
        // Database health would be checked here
        res.json({ database: 'connected', timestamp: new Date().toISOString() });
    });
}

/**
 * Define run routes
 * @param {Router} router - Express router
 * @param {RunController} controller - Run controller
 */
export function defineRunRoutes(router, controller) {
    router.get('/runs', controller.getAllRuns);
    router.get('/runs/:id', validateParams({ id: { type: 'integer' } }), controller.getRunById);
    router.post('/runs', controller.createRun);
    router.get('/export/run/:runId', controller.exportRun);
    router.get('/export/data/:runId', controller.exportData);
}

/**
 * Define report routes
 * @param {Router} router - Express router
 * @param {ReportController} controller - Report controller
 */
export function defineReportRoutes(router, controller) {
    router.get('/reports', controller.getReports);
    router.get('/reports/run/:runId', validateParams({ runId: { type: 'integer' } }), controller.getReportsByRun);
    router.get('/report-details', controller.getReportDetails);
    router.get('/report-details/run/:runId', validateParams({ runId: { type: 'integer' } }), controller.getReportDetailsByRun);
    router.put('/report-details/:id', validateParams({ id: { type: 'integer' } }), controller.updateReport);
    router.get('/last-hires/run/:runId', validateParams({ runId: { type: 'integer' } }), controller.getLast4Hires);
    router.get('/report-notes/report/:reportId', validateParams({ reportId: { type: 'integer' } }), controller.getNotesByReport);
    router.get('/report-notes/employer/:employerId', controller.getNotesByEmployer);
}

/**
 * Define mode routes
 * @param {Router} router - Express router
 * @param {ModeController} controller - Mode controller
 */
export function defineModeRoutes(router, controller) {
    router.get('/modes', controller.getAllModes);
    router.get('/modes/:id', validateParams({ id: { type: 'integer' } }), controller.getModeById);
}

/**
 * Define hire data routes
 * @param {Router} router - Express router
 * @param {HireDataController} controller - Hire data controller
 * @param {Function} uploadMiddleware - Multer upload middleware
 */
export function defineHireDataRoutes(router, controller, uploadMiddleware) {
    router.get('/hire-data', controller.getHireData);
    router.get('/recent-hires/run/:runId', validateParams({ runId: { type: 'integer' } }), controller.getRecentHires);
    router.post('/import/hires', uploadMiddleware.single('file'), controller.importHires);
}
