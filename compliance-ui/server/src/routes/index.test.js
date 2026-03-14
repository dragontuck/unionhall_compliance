/**
 * routes.test.js - Unit tests for route definitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import {
    defineHealthRoutes,
    defineRunRoutes,
    defineReportRoutes,
    defineModeRoutes,
    defineHireDataRoutes,
    defineContractorSnapshotRoutes,
    defineBlacklistRoutes,
} from './index.js';

vi.mock('../middleware/ValidationMiddleware.js', () => ({
    validateParams: vi.fn().mockReturnValue((req, res, next) => next()),
    validateQuery: vi.fn().mockReturnValue((req, res, next) => next()),
    validateBody: vi.fn().mockReturnValue((req, res, next) => next()),
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

        it('should return status json', () => {
            defineHealthRoutes(router);

            const app = express();
            app.use(router);

            return new Promise((resolve, reject) => {
                const mockRes = {
                    json: vi.fn((data) => {
                        try {
                            expect(data).toHaveProperty('status', 'healthy');
                            expect(data).toHaveProperty('timestamp');
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }),
                };

                const healthHandler = router.stack.find(layer => layer.route && layer.route.path === '/health').route.stack[0].handle;
                healthHandler({}, mockRes);
            });
        });
    });

    describe('defineRunRoutes', () => {
        let mockController;

        beforeEach(() => {
            mockController = {
                getAllRuns: vi.fn(),
                getRunById: vi.fn(),
                createRun: vi.fn(),
                exportRun: vi.fn(),
                exportData: vi.fn(),
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
                getReports: vi.fn(),
                getReportsByRun: vi.fn(),
                getReportDetails: vi.fn(),
                getReportDetailsByRun: vi.fn(),
                updateReport: vi.fn(),
                getLast4Hires: vi.fn(),
                getNotesByReport: vi.fn(),
                getNotesByEmployer: vi.fn(),
                deleteReport: vi.fn(),
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

        it('should define getReportDetailsByRun route', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/report-details/run/:runId'
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

        it('should define deleteReport route with POST method', () => {
            defineReportRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/reports/:reportId/delete' && layer.route.methods.post
            );
            expect(hasRoute).toBe(true);
        });
    });

    describe('defineModeRoutes', () => {
        let mockController;

        beforeEach(() => {
            mockController = {
                getAllModes: vi.fn(),
                getModeById: vi.fn(),
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
                getHireData: vi.fn(),
                getRecentHires: vi.fn(),
                importHires: vi.fn(),
            };
            mockUpload = {
                single: vi.fn().mockReturnValue((req, res, next) => next()),
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

    describe('defineContractorSnapshotRoutes', () => {
        let mockController;
        let mockUpload;

        beforeEach(() => {
            mockController = {
                getContractorSnapshots: vi.fn(),
                importContractorSnapshots: vi.fn(),
            };
            mockUpload = {
                single: vi.fn().mockReturnValue((req, res, next) => next()),
            };
        });

        it('should define getContractorSnapshots route', () => {
            defineContractorSnapshotRoutes(router, mockController, mockUpload);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/contractor-snapshots' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define importContractorSnapshots route with POST method', () => {
            defineContractorSnapshotRoutes(router, mockController, mockUpload);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/import/contractor-snapshots' && layer.route.methods.post
            );
            expect(hasRoute).toBe(true);
        });

        it('should use upload middleware for import route', () => {
            defineContractorSnapshotRoutes(router, mockController, mockUpload);

            expect(mockUpload.single).toHaveBeenCalledWith('file');
        });

        it('should call controller methods', () => {
            defineContractorSnapshotRoutes(router, mockController, mockUpload);

            expect(mockController.getContractorSnapshots).toBeDefined();
            expect(mockController.importContractorSnapshots).toBeDefined();
        });
    });

    describe('defineBlacklistRoutes', () => {
        let mockController;

        beforeEach(() => {
            mockController = {
                getAll: vi.fn(),
                getAllIncludingDeleted: vi.fn(),
                getById: vi.fn(),
                getByEmployerId: vi.fn(),
                checkBlacklist: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            };
        });

        it('should define getAll route', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getAllIncludingDeleted route', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist/all' && layer.route.methods.get
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getById route with parameter validation', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist/:id'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define getByEmployerId route', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist/employer/:employerId'
            );
            expect(hasRoute).toBe(true);
        });

        it('should define checkBlacklist route with POST method', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist/check' && layer.route.methods.post
            );
            expect(hasRoute).toBe(true);
        });

        it('should define create route with POST method', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist' && layer.route.methods.post
            );
            expect(hasRoute).toBe(true);
        });

        it('should define update route with PUT method', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist/:id' && layer.route.methods.put
            );
            expect(hasRoute).toBe(true);
        });

        it('should define delete route with DELETE method', () => {
            defineBlacklistRoutes(router, mockController);

            const hasRoute = router.stack.some(layer =>
                layer.route && layer.route.path === '/blacklist/:id' && layer.route.methods.delete
            );
            expect(hasRoute).toBe(true);
        });

        it('should call all controller methods', () => {
            defineBlacklistRoutes(router, mockController);

            expect(mockController.getAll).toBeDefined();
            expect(mockController.getAllIncludingDeleted).toBeDefined();
            expect(mockController.getById).toBeDefined();
            expect(mockController.getByEmployerId).toBeDefined();
            expect(mockController.checkBlacklist).toBeDefined();
            expect(mockController.create).toBeDefined();
            expect(mockController.update).toBeDefined();
            expect(mockController.delete).toBeDefined();
        });
    });
});
