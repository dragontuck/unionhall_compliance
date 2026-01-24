/**
 * RunService.test.js - Unit tests for RunService
 */

import { RunService } from './RunService.js';
import XLSX from 'xlsx';

jest.mock('xlsx');

describe('RunService', () => {
    let service;
    let mockRunRepo;
    let mockModeRepo;
    let mockReportRepo;
    let mockDetailRepo;
    let mockHireDataRepo;
    let mockComplianceEngine;

    beforeEach(() => {
        mockRunRepo = {
            getAllRuns: jest.fn(),
            getRunById: jest.fn(),
            createRun: jest.fn(),
            getNextRunNumber: jest.fn(),
            beginTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            updateRunOutput: jest.fn(),
        };

        mockModeRepo = {
            getModeById: jest.fn(),
            getAllModes: jest.fn(),
        };

        mockReportRepo = {
            getReportsByRun: jest.fn(),
        };

        mockDetailRepo = {
            getDetailsByRun: jest.fn(),
            getLast4Hires: jest.fn(),
        };

        mockHireDataRepo = {
            getRecentHires: jest.fn(),
        };

        mockComplianceEngine = {
            createComplianceState: jest.fn().mockReturnValue({
                compliance: 0,
                directCount: 0,
                dispatchNeeded: 0,
                nextHireDispatch: 'N'
            }),
            applyHire: jest.fn(),
            codeToStatus: jest.fn().mockReturnValue('Compliant'),
        };

        service = new RunService(mockRunRepo, mockModeRepo, mockReportRepo, mockDetailRepo, mockHireDataRepo, mockComplianceEngine);

        // Mock XLSX
        XLSX.utils = {
            book_new: jest.fn(() => ({})),
            json_to_sheet: jest.fn(),
            book_append_sheet: jest.fn(),
        };
        XLSX.write = jest.fn(() => Buffer.from('test'));

        // Mock transaction object that can chain request().input().query()
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        };

        // Set up query to return default INSERT result with runId
        mockRequest.query.mockResolvedValue({
            recordset: [{ runId: 100 }],
            rowsAffected: [1],
            recordsets: [[{ runId: 100 }]]
        });

        const mockTx = {
            request: jest.fn().mockReturnValue(mockRequest),
        };

        mockRunRepo.beginTransaction.mockResolvedValue(mockTx);
    });

    describe('getAllRuns', () => {
        it('should return all runs with default limit', async () => {
            const runs = [
                { id: 1, modeId: 1, reviewedDate: '2025-01-01' },
                { id: 2, modeId: 2, reviewedDate: '2025-01-08' },
            ];
            mockRunRepo.getAllRuns.mockResolvedValue(runs);

            const result = await service.getAllRuns();

            expect(result).toEqual(runs);
            expect(mockRunRepo.getAllRuns).toHaveBeenCalledWith(100);
        });

        it('should return runs with custom limit', async () => {
            const runs = [{ id: 1, modeId: 1 }];
            mockRunRepo.getAllRuns.mockResolvedValue(runs);

            await service.getAllRuns(50);

            expect(mockRunRepo.getAllRuns).toHaveBeenCalledWith(50);
        });
    });

    describe('getRunById', () => {
        it('should return a run by ID', async () => {
            const run = { id: 5, modeId: 1, reviewedDate: '2025-01-01' };
            mockRunRepo.getRunById.mockResolvedValue(run);

            const result = await service.getRunById(5);

            expect(result).toEqual(run);
            expect(mockRunRepo.getRunById).toHaveBeenCalledWith(5);
        });

        it('should throw error when run not found', async () => {
            mockRunRepo.getRunById.mockResolvedValue(null);

            await expect(service.getRunById(999)).rejects.toThrow('Run 999 not found');
        });
    });

    describe('createRun', () => {
        it('should create a new run with generated run number', async () => {
            mockModeRepo.getModeById.mockResolvedValue({ id: 1, mode_value: 2, name: '2To1' });
            mockRunRepo.getNextRunNumber.mockResolvedValue(15);

            const result = await service.createRun({
                modeId: 1,
                reviewedDate: '2025-01-15',
            });

            expect(result.success).toBe(true);
            expect(result.runId).toBe(100);
            expect(mockRunRepo.getNextRunNumber).toHaveBeenCalledWith(1, '2025-01-15');
        });

        it('should create a new run with specified run number', async () => {
            mockModeRepo.getModeById.mockResolvedValue({ id: 1, mode_value: 2, name: '2To1' });

            const result = await service.createRun({
                modeId: 1,
                reviewedDate: '2025-01-15',
                runNumber: 20,
            });

            expect(result.success).toBe(true);
            expect(result.runId).toBe(100);
            expect(mockRunRepo.getNextRunNumber).not.toHaveBeenCalled();
        });

        it('should throw error if modeId missing', async () => {
            await expect(service.createRun({ reviewedDate: '2025-01-15' }))
                .rejects.toThrow('Mode ID and reviewed date are required');
        });

        it('should throw error if reviewedDate missing', async () => {
            await expect(service.createRun({ modeId: 1 }))
                .rejects.toThrow('Mode ID and reviewed date are required');
        });

        it('should throw error if mode not found', async () => {
            mockModeRepo.getModeById.mockResolvedValue(null);

            await expect(service.createRun({
                modeId: 999,
                reviewedDate: '2025-01-15',
            })).rejects.toThrow('Mode 999 not found');
        });
    });

    describe('getRunForExport', () => {
        it('should generate Excel buffer with all sheets', async () => {
            const run = { id: 1, modeId: 1 };
            const reports = [{ id: 1, runId: 1 }];
            const details = [{ id: 1, runId: 1 }];
            const lastHires = [{ id: 1, runId: 1 }];
            const recentHires = [{ id: 2, runId: 1 }];

            mockRunRepo.getRunById.mockResolvedValue(run);
            mockReportRepo.getReportsByRun.mockResolvedValue(reports);
            mockDetailRepo.getDetailsByRun.mockResolvedValue(details);
            mockDetailRepo.getLast4Hires.mockResolvedValue(lastHires);
            mockHireDataRepo.getRecentHires.mockResolvedValue(recentHires);

            const result = await service.getRunForExport(1);

            expect(result).toBeInstanceOf(Buffer);
            expect(XLSX.utils.book_new).toHaveBeenCalled();
            expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(4);
            expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(4);
            expect(XLSX.write).toHaveBeenCalled();
        });

        it('should throw error when run not found', async () => {
            mockRunRepo.getRunById.mockResolvedValue(null);

            await expect(service.getRunForExport(999)).rejects.toThrow('Run 999 not found');
        });

        it('should fetch all required data for export', async () => {
            const run = { id: 5, modeId: 1 };
            mockRunRepo.getRunById.mockResolvedValue(run);
            mockReportRepo.getReportsByRun.mockResolvedValue([]);
            mockDetailRepo.getDetailsByRun.mockResolvedValue([]);
            mockDetailRepo.getLast4Hires.mockResolvedValue([]);
            mockHireDataRepo.getRecentHires.mockResolvedValue([]);

            await service.getRunForExport(5);

            expect(mockReportRepo.getReportsByRun).toHaveBeenCalledWith(5);
            expect(mockDetailRepo.getDetailsByRun).toHaveBeenCalledWith(5);
            expect(mockDetailRepo.getLast4Hires).toHaveBeenCalledWith(5);
            expect(mockHireDataRepo.getRecentHires).toHaveBeenCalledWith(5);
        });
    });
});
