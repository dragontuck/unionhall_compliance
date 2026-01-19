/**
 * ReportController.test.js - Unit tests for ReportController
 */

import { ReportController } from './ReportController.js';

describe('ReportController', () => {
    let controller;
    let mockReportService;
    let req, res;

    beforeEach(() => {
        mockReportService = {
            getReports: jest.fn(),
            getReportsByRun: jest.fn(),
            getReportDetails: jest.fn(),
            getDetailsByRun: jest.fn(),
            updateReport: jest.fn(),
            addNote: jest.fn(),
        };

        controller = new ReportController(mockReportService);

        req = {
            params: {},
            query: {},
            body: {},
        };

        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
    });

    describe('getReports', () => {
        it('should return reports with default limit', async () => {
            const reports = [
                { id: 1, runId: 1, contractorId: 100 },
            ];
            mockReportService.getReports.mockResolvedValue(reports);

            await controller.getReports(req, res);

            expect(res.json).toHaveBeenCalledWith(reports);
            expect(mockReportService.getReports).toHaveBeenCalledWith({}, 500);
        });

        it('should apply runId filter', async () => {
            req.query.runId = '5';
            const reports = [{ id: 1, runId: 5 }];
            mockReportService.getReports.mockResolvedValue(reports);

            await controller.getReports(req, res);

            expect(mockReportService.getReports).toHaveBeenCalledWith({ runId: 5 }, 500);
        });

        it('should apply contractorId filter', async () => {
            req.query.contractorId = '100';
            const reports = [{ id: 1, contractorId: 100 }];
            mockReportService.getReports.mockResolvedValue(reports);

            await controller.getReports(req, res);

            expect(mockReportService.getReports).toHaveBeenCalledWith({ contractorId: 100 }, 500);
        });

        it('should apply employerId filter', async () => {
            req.query.employerId = 'EMP001';
            const reports = [{ id: 1, employerId: 'EMP001' }];
            mockReportService.getReports.mockResolvedValue(reports);

            await controller.getReports(req, res);

            expect(mockReportService.getReports).toHaveBeenCalledWith({ employerId: 'EMP001' }, 500);
        });

        it('should apply custom limit', async () => {
            req.query.limit = '100';
            const reports = [];
            mockReportService.getReports.mockResolvedValue(reports);

            await controller.getReports(req, res);

            expect(mockReportService.getReports).toHaveBeenCalledWith({}, 100);
        });

        it('should apply multiple filters', async () => {
            req.query.runId = '5';
            req.query.contractorId = '100';
            req.query.employerId = 'EMP001';
            req.query.limit = '250';
            const reports = [];
            mockReportService.getReports.mockResolvedValue(reports);

            await controller.getReports(req, res);

            expect(mockReportService.getReports).toHaveBeenCalledWith(
                { runId: 5, contractorId: 100, employerId: 'EMP001' },
                250
            );
        });
    });

    describe('getReportsByRun', () => {
        it('should return reports for a run', async () => {
            req.params.runId = '5';
            const reports = [{ id: 1, runId: 5 }];
            mockReportService.getReportsByRun.mockResolvedValue(reports);

            await controller.getReportsByRun(req, res);

            expect(res.json).toHaveBeenCalledWith(reports);
            expect(mockReportService.getReportsByRun).toHaveBeenCalledWith(5);
        });
    });

    describe('getReportDetails', () => {
        it('should return report details with default limit', async () => {
            const details = [{ id: 1, runId: 1 }];
            mockReportService.getReportDetails.mockResolvedValue(details);

            await controller.getReportDetails(req, res);

            expect(res.json).toHaveBeenCalledWith(details);
            expect(mockReportService.getReportDetails).toHaveBeenCalledWith({}, 1000);
        });

        it('should apply runId filter', async () => {
            req.query.runId = '5';
            const details = [];
            mockReportService.getReportDetails.mockResolvedValue(details);

            await controller.getReportDetails(req, res);

            expect(mockReportService.getReportDetails).toHaveBeenCalledWith({ runId: 5 }, 1000);
        });

        it('should apply contractorId filter', async () => {
            req.query.contractorId = '100';
            const details = [];
            mockReportService.getReportDetails.mockResolvedValue(details);

            await controller.getReportDetails(req, res);

            expect(mockReportService.getReportDetails).toHaveBeenCalledWith({ contractorId: 100 }, 1000);
        });

        it('should apply contractorName filter', async () => {
            req.query.contractorName = 'ABC Corp';
            const details = [];
            mockReportService.getReportDetails.mockResolvedValue(details);

            await controller.getReportDetails(req, res);

            expect(mockReportService.getReportDetails).toHaveBeenCalledWith({ contractorName: 'ABC Corp' }, 1000);
        });

        it('should apply employerId filter', async () => {
            req.query.employerId = 'EMP001';
            const details = [];
            mockReportService.getReportDetails.mockResolvedValue(details);

            await controller.getReportDetails(req, res);

            expect(mockReportService.getReportDetails).toHaveBeenCalledWith({ employerId: 'EMP001' }, 1000);
        });

        it('should apply custom limit', async () => {
            req.query.limit = '500';
            const details = [];
            mockReportService.getReportDetails.mockResolvedValue(details);

            await controller.getReportDetails(req, res);

            expect(mockReportService.getReportDetails).toHaveBeenCalledWith({}, 500);
        });
    });

    describe('getReportDetailsByRun', () => {
        it('should return report details for a run', async () => {
            req.params.runId = '5';
            const details = [{ id: 1, runId: 5 }];
            mockReportService.getDetailsByRun.mockResolvedValue(details);

            await controller.getReportDetailsByRun(req, res);

            expect(res.json).toHaveBeenCalledWith(details);
            expect(mockReportService.getDetailsByRun).toHaveBeenCalledWith(5);
        });

        it('should handle different run IDs', async () => {
            req.params.runId = '42';
            const details = [];
            mockReportService.getDetailsByRun.mockResolvedValue(details);

            await controller.getReportDetailsByRun(req, res);

            expect(mockReportService.getDetailsByRun).toHaveBeenCalledWith(42);
        });
    });
});
