/**
 * RunController.test.js - Unit tests for RunController
 */

import { RunController } from './RunController.js';

describe('RunController', () => {
    let controller;
    let mockRunService;
    let req, res;

    beforeEach(() => {
        mockRunService = {
            getAllRuns: jest.fn(),
            getRunById: jest.fn(),
            createRun: jest.fn(),
            getRunForExport: jest.fn(),
        };

        controller = new RunController(mockRunService);

        req = {
            params: {},
            query: {},
            body: {},
        };

        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    describe('getAllRuns', () => {
        it('should return all runs with default limit', async () => {
            const runs = [
                { id: 1, modeId: 1 },
                { id: 2, modeId: 2 },
            ];
            mockRunService.getAllRuns.mockResolvedValue(runs);

            await controller.getAllRuns(req, res);

            expect(res.json).toHaveBeenCalledWith(runs);
            expect(mockRunService.getAllRuns).toHaveBeenCalledWith(100);
        });

        it('should use custom limit from query', async () => {
            const runs = [{ id: 1, modeId: 1 }];
            req.query.limit = '50';
            mockRunService.getAllRuns.mockResolvedValue(runs);

            await controller.getAllRuns(req, res);

            expect(mockRunService.getAllRuns).toHaveBeenCalledWith(50);
        });

        it('should handle invalid limit as default', async () => {
            const runs = [];
            req.query.limit = 'invalid';
            mockRunService.getAllRuns.mockResolvedValue(runs);

            await controller.getAllRuns(req, res);

            expect(mockRunService.getAllRuns).toHaveBeenCalledWith(100);
        });
    });

    describe('getRunById', () => {
        it('should return a run by ID', async () => {
            req.params.id = '5';
            const run = { id: 5, modeId: 1 };
            mockRunService.getRunById.mockResolvedValue(run);

            await controller.getRunById(req, res);

            expect(res.json).toHaveBeenCalledWith(run);
            expect(mockRunService.getRunById).toHaveBeenCalledWith(5);
        });

        it('should return different runs', async () => {
            req.params.id = '42';
            const run = { id: 42, modeId: 2 };
            mockRunService.getRunById.mockResolvedValue(run);

            await controller.getRunById(req, res);

            expect(mockRunService.getRunById).toHaveBeenCalledWith(42);
        });
    });

    describe('createRun', () => {
        it('should create a run successfully', async () => {
            req.body = {
                modeId: '1',
                reviewedDate: '2025-01-15',
                runNumber: '20',
            };
            mockRunService.createRun.mockResolvedValue({
                success: true,
                runId: 100,
                message: 'Run executed successfully with ID: 100'
            });

            await controller.createRun(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                id: 100,
                message: 'Run executed successfully with ID: 100',
            });
            expect(mockRunService.createRun).toHaveBeenCalledWith({
                modeId: 1,
                reviewedDate: '2025-01-15',
                runNumber: 20,
            });
        });

        it('should create run without runNumber', async () => {
            req.body = {
                modeId: '1',
                reviewedDate: '2025-01-15',
            };
            mockRunService.createRun.mockResolvedValue({
                success: true,
                runId: 101,
                message: 'Run executed successfully with ID: 101'
            });

            await controller.createRun(req, res);

            expect(mockRunService.createRun).toHaveBeenCalledWith({
                modeId: 1,
                reviewedDate: '2025-01-15',
                runNumber: undefined,
            });
        });
    });

    describe('exportRun', () => {
        it('should export run as Excel file', async () => {
            req.params.runId = '5';
            const buffer = Buffer.from('test data');
            mockRunService.getRunForExport.mockResolvedValue(buffer);

            await controller.exportRun(req, res);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename="compliance_report_5.xlsx"'
            );
            expect(res.send).toHaveBeenCalledWith(buffer);
            expect(mockRunService.getRunForExport).toHaveBeenCalledWith(5);
        });

        it('should handle different run IDs', async () => {
            req.params.runId = '42';
            const buffer = Buffer.from('data');
            mockRunService.getRunForExport.mockResolvedValue(buffer);

            await controller.exportRun(req, res);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename="compliance_report_42.xlsx"'
            );
        });
    });

    describe('exportData', () => {
        it('should export run data as JSON', async () => {
            req.params.runId = '5';
            const runData = {
                details: [{ id: 1 }],
                reports: [{ id: 1 }],
            };
            mockRunService.getRunForExport.mockResolvedValue(runData);

            await controller.exportData(req, res);

            expect(res.json).toHaveBeenCalledWith({
                runId: 5,
                details: runData.details,
                reports: runData.reports,
            });
        });

        it('should parse runId as integer', async () => {
            req.params.runId = '100';
            const runData = { details: [], reports: [] };
            mockRunService.getRunForExport.mockResolvedValue(runData);

            await controller.exportData(req, res);

            expect(mockRunService.getRunForExport).toHaveBeenCalledWith(100);
        });
    });
});
