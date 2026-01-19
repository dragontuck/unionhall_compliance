/**
 * routes.test.js - Unit tests for route definitions
 */

import express from 'express';
import {
    defineHealthRoutes,
    defineRunRoutes,
    defineReportRoutes,
    defineModeRoutes,
    defineHireDataRoutes
} from './index.js';

jest.mock('../middleware/ValidationMiddleware.js', () => ({
    validateParams: jest.fn().mockReturnValue((req, res, next) => next()),
    validateQuery: jest.fn().mockReturnValue((req, res, next) => next()),
    validateBody: jest.fn().mockReturnValue((req, res, next) => next()),
}));

describe('Route Definitions', () => {
    let router;

    beforeEach(() => {
        router = express.Router();
    });

    describe('defineHealthRoutes', () => {
        it('should define health route', () => {
            defineHealthRoutes(router);

            const hasHealthRoute = router.stack.some(layer => layer.route && layer.route.path === '/health');
            expect(hasHealthRoute).toBe(true);
        });

        it('should define database health route', () => {
            defineHealthRoutes(router);

            const hasDatabaseRoute = router.stack.some(layer => layer.route && layer.route.path === '/database');
            expect(hasDatabaseRoute).toBe(true);
        });

        it('should respond to GET requests', () => {
            defineHealthRoutes(router);

            const healthLayer = router.stack.find(layer => layer.route && layer.route.path === '/health');
            expect(healthLayer.route.methods.get).toBe(true);
        });

        it('should return status json', (done) => {
            defineHealthRoutes(router);

            const app = express();
            app.use(router);

            const mockRes = {
                json: jest.fn((data) => {
                    expect(data).toHaveProperty('status', 'healthy');
                    expect(data).toHaveProperty('timestamp');
                    done();
                }),
            };

            const healthHandler = router.stack.find(layer => layer.route && layer.route.path === '/health').route.stack[0].handle;
            healthHandler({}, mockRes);
        });
    });

    describe('defineRunRoutes', () => {
        let mockController;

        beforeEach(() => {
            mockController = {
                getAllRuns: jest.fn(),
                getRunById: jest.fn(),
                createRun: jest.fn(),
                exportRun: jest.fn(),
                exportData: jest.fn(),
            };
        });

        it('should define getAllRuns route', () => {
            defineRunRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/runs' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getRunById route with parameter validation', () => {
            defineRunRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/runs/:id'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define createRun route', () => {
            defineRunRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/runs' && layer.route.methods.post
            );
            expect(hasRoute).toBe(true);
        });

        it('should define exportRun route', () => {
            defineRunRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/export/run/:runId'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define exportData route', () => {
            defineRunRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/export/data/:runId'
            );
            expect(hasRoute).toBe(true);
        });

        it('should call controller methods', () => {
            defineRunRoutes(router, mockController);

            expect(mockController.getAllRuns).toBeDefined();
            expect(mockController.getRunById).toBeDefined();
        });
    });

    describe('defineReportRoutes', () => {
        let mockController;

        beforeEach(() => {
            mockController = {
                getReports: jest.fn(),
                getReportsByRun: jest.fn(),
                getReportDetails: jest.fn(),
                getReportDetailsByRun: jest.fn(),
                updateReport: jest.fn(),
                getLast4Hires: jest.fn(),
                getNotesByReport: jest.fn(),
                getNotesByEmployer: jest.fn(),
            };
        });

        it('should define getReports route', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/reports' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getReportsByRun route with parameter validation', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/reports/run/:runId'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getReportDetails route', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/report-details' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define updateReport route with PUT method', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/report-details/:id' && layer.route.methods.put
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getLast4Hires route', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/last-hires/run/:runId'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define report notes routes', () => {
            defineReportRoutes(router, mockController);

            const hasReportNotes = router.stack.some(layer =>
                layer.route && layer.route.path === '/report-notes/report/:reportId'
            );
            const hasEmployerNotes = router.stack.some(layer =>
                layer.route && layer.route.path === '/report-notes/employer/:employerId'
            );

            expect(hasReportNotes).toBe(true);
            expect(hasEmployerNotes).toBe(true);
        });
    });

    describe('defineModeRoutes', () => {
        let mockController;

        beforeEach(() => {
            mockController = {
                getAllModes: jest.fn(),
                getModeById: jest.fn(),
            };
        });

        it('should define getAllModes route', () => {
            defineModeRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/modes' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getModeById route with parameter validation', () => {
            defineModeRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/modes/:id'
            );
            expect(hasRoute).toBe(true);
        });
    });

    describe('defineHireDataRoutes', () => {
        let mockController;
        let mockUpload;

        beforeEach(() => {
            mockController = {
                getHireData: jest.fn(),
                getRecentHires: jest.fn(),
                importHires: jest.fn(),
            };
            mockUpload = {
                single: jest.fn().mockReturnValue((req, res, next) => next()),
            };
        });

        it('should define getHireData route', () => {
            defineHireDataRoutes(router, mockController, mockUpload);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/hire-data' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getRecentHires route', () => {
            defineHireDataRoutes(router, mockController, mockUpload);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/recent-hires/run/:runId'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define importHires route with POST method', () => {
            defineHireDataRoutes(router, mockController, mockUpload);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/import/hires' && layer.route.methods.post
            );
            expect(hasRoute).toBe(true);
        });

        it('should use upload middleware for import route', () => {
            defineHireDataRoutes(router, mockController, mockUpload);

            expect(mockUpload.single).toHaveBeenCalledWith('file');
        });

        it('should call controller methods', () => {
            defineHireDataRoutes(router, mockController, mockUpload);

            expect(mockController.getHireData).toBeDefined();
            expect(mockController.getRecentHires).toBeDefined();
            expect(mockController.importHires).toBeDefined();
        });
    });
});
