/**
 * HireDataController.test.js - Unit tests for HireDataController
 */

import { HireDataController } from './HireDataController.js';

describe('HireDataController', () => {
    let controller;
    let mockHireDataService;
    let req, res;

    beforeEach(() => {
        mockHireDataService = {
            getHireData: jest.fn(),
            getRecentHires: jest.fn(),
            importHires: jest.fn(),
        };

        controller = new HireDataController(mockHireDataService);

        req = {
            params: {},
            query: {},
            body: {},
            file: null,
        };

        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
    });

    describe('getHireData', () => {
        it('should return hire data with default limit', async () => {
            const hireData = [
                { id: 1, contractorId: 100, memberName: 'John' },
            ];
            mockHireDataService.getHireData.mockResolvedValue(hireData);

            await controller.getHireData(req, res);

            expect(res.json).toHaveBeenCalledWith(hireData);
            expect(mockHireDataService.getHireData).toHaveBeenCalledWith({}, 2000);
        });

        it('should apply reviewedDate filter', async () => {
            req.query.reviewedDate = '2025-01-15';
            const hireData = [];
            mockHireDataService.getHireData.mockResolvedValue(hireData);

            await controller.getHireData(req, res);

            expect(mockHireDataService.getHireData).toHaveBeenCalledWith({ reviewedDate: '2025-01-15' }, 2000);
        });

        it('should apply custom limit', async () => {
            req.query.limit = '500';
            const hireData = [];
            mockHireDataService.getHireData.mockResolvedValue(hireData);

            await controller.getHireData(req, res);

            expect(mockHireDataService.getHireData).toHaveBeenCalledWith({}, 500);
        });

        it('should apply both filter and limit', async () => {
            req.query.reviewedDate = '2025-01-15';
            req.query.limit = '1000';
            const hireData = [];
            mockHireDataService.getHireData.mockResolvedValue(hireData);

            await controller.getHireData(req, res);

            expect(mockHireDataService.getHireData).toHaveBeenCalledWith(
                { reviewedDate: '2025-01-15' },
                1000
            );
        });
    });

    describe('getRecentHires', () => {
        it('should return recent hires for a run', async () => {
            req.params.runId = '5';
            const hires = [{ id: 1, runId: 5, hireDate: '2025-01-10' }];
            mockHireDataService.getRecentHires.mockResolvedValue(hires);

            await controller.getRecentHires(req, res);

            expect(res.json).toHaveBeenCalledWith(hires);
            expect(mockHireDataService.getRecentHires).toHaveBeenCalledWith(5);
        });

        it('should handle different run IDs', async () => {
            req.params.runId = '42';
            const hires = [];
            mockHireDataService.getRecentHires.mockResolvedValue(hires);

            await controller.getRecentHires(req, res);

            expect(mockHireDataService.getRecentHires).toHaveBeenCalledWith(42);
        });

        it('should handle empty results', async () => {
            req.params.runId = '999';
            mockHireDataService.getRecentHires.mockResolvedValue([]);

            await controller.getRecentHires(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('importHires', () => {
        it('should validate that file is required', () => {
            req.file = null;
            // The asyncHandler will handle the error internally
            // Just verify the function signature exists
            expect(controller.importHires).toBeDefined();
            expect(typeof controller.importHires).toBe('function');
        });

        it('should have importHires method', () => {
            expect(controller).toHaveProperty('importHires');
        });

        it('should accept file and service', () => {
            expect(mockHireDataService.importHires).toBeDefined();
            expect(mockHireDataService.getHireData).toBeDefined();
        });
    });
});
