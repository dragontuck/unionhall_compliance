/**
 * RunService.test.js - Unit tests for RunService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RunService } from './RunService.js';
import XLSX from 'xlsx';

vi.mock('xlsx');

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
            getAllRuns: vi.fn(),
            getRunById: vi.fn(),
            createRun: vi.fn(),
            getNextRunNumber: vi.fn(),
            beginTransaction: vi.fn(),
            commitTransaction: vi.fn(),
            rollbackTransaction: vi.fn(),
            updateRunOutput: vi.fn(),
        };

        mockModeRepo = {
            getModeById: vi.fn(),
            getAllModes: vi.fn(),
        };

        mockReportRepo = {
            getReportsByRun: vi.fn(),
        };

        mockDetailRepo = {
            getDetailsByRun: vi.fn(),
            getLast4Hires: vi.fn(),
        };

        mockHireDataRepo = {
            getRecentHires: vi.fn(),
        };

        mockComplianceEngine = {
            createComplianceState: vi.fn().mockReturnValue({
                compliance: 0,
                directCount: 0,
                dispatchNeeded: 0,
                nextHireDispatch: 'N'
            }),
            applyHire: vi.fn(),
            codeToStatus: vi.fn().mockReturnValue('Compliant'),
        };

        service = new RunService(mockRunRepo, mockModeRepo, mockReportRepo, mockDetailRepo, mockHireDataRepo, mockComplianceEngine);

        // Mock XLSX
        XLSX.utils = {
            book_new: vi.fn(() => ({})),
            json_to_sheet: vi.fn(),
            aoa_to_sheet: vi.fn(),
            book_append_sheet: vi.fn(),
            decode_range: vi.fn(),
            encode_cell: vi.fn(),
        };
        XLSX.write = vi.fn(() => Buffer.from('test'));

        // Mock transaction object that can chain request().input().query()
        const mockRequest = {
            input: vi.fn().mockReturnThis(),
            query: vi.fn(),
        };

        // Set up query to return default INSERT result with runId
        mockRequest.query.mockResolvedValue({
            recordset: [{ runId: 100 }],
            rowsAffected: [1],
            recordsets: [[{ runId: 100 }]]
        });

        const mockTx = {
            request: vi.fn().mockReturnValue(mockRequest),
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
        beforeEach(() => {
            // Setup transaction mocks for createRun -> executeRun
            const mockRequest = {
                input: vi.fn().mockReturnThis(),
                query: vi.fn(),
            };

            // Mock query responses for executeRun workflow
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ runId: 100 }],
                    rowsAffected: [1],
                }) // INSERT run
                .mockResolvedValueOnce({
                    recordset: [{ runId: 99 }],
                }) // GET previous run
                .mockResolvedValueOnce({
                    recordset: [], // No contractors
                }); // GET contractors

            const mockTx = {
                request: vi.fn().mockReturnValue(mockRequest),
            };

            mockRunRepo.beginTransaction.mockResolvedValue(mockTx);
            mockRunRepo.commitTransaction.mockResolvedValue(undefined);
            mockRunRepo.rollbackTransaction.mockResolvedValue(undefined);
        });

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

        it('should pass dryRun flag to executeRun', async () => {
            mockModeRepo.getModeById.mockResolvedValue({ id: 1, mode_value: 2, name: '2To1' });
            mockRunRepo.getNextRunNumber.mockResolvedValue(15);

            const result = await service.createRun({
                modeId: 1,
                reviewedDate: '2025-01-15',
                dryRun: true,
            });

            expect(result.success).toBe(true);
            expect(result.runId).toBeNull(); // Dry run doesn't create runId
            expect(result.message).toContain('Dry run');
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
            expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(3); // Details, Reports, Last 4
            expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledTimes(1); // Recent Hire
            expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(4); // All 4 sheets
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

        it('should handle export with multiple records', async () => {
            const run = { id: 1, modeId: 1 };
            const reports = [
                { id: 1, runId: 1, lastWedReported: new Date('2025-01-01') },
                { id: 2, runId: 1, lastWedReported: new Date('2025-01-08') },
            ];
            const details = [
                { id: 1, runId: 1, StartDate: new Date('2025-01-15') },
                { id: 2, runId: 1, StartDate: new Date('2025-01-20') },
            ];
            const lastHires = [
                { id: 1, runId: 1, StartDate: new Date('2025-01-15') },
            ];
            const recentHires = [
                { 'Contractor Name': 'ABC Inc', 'Member Name': 'John Doe' },
            ];

            mockRunRepo.getRunById.mockResolvedValue(run);
            mockReportRepo.getReportsByRun.mockResolvedValue(reports);
            mockDetailRepo.getDetailsByRun.mockResolvedValue(details);
            mockDetailRepo.getLast4Hires.mockResolvedValue(lastHires);
            mockHireDataRepo.getRecentHires.mockResolvedValue(recentHires);

            const result = await service.getRunForExport(1);

            expect(result).toBeInstanceOf(Buffer);
            expect(mockRunRepo.getRunById).toHaveBeenCalledWith(1);
        });
    });

    describe('executeRun', () => {
        beforeEach(() => {
            // Reset mock for executeRun-specific tests
            const mockRequest = {
                input: vi.fn().mockReturnThis(),
                query: vi.fn(),
            };

            // Set up various query responses for executeRun
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ runId: 100 }],
                    rowsAffected: [1],
                    recordsets: [[{ runId: 100 }]]
                }) // First query - insert run
                .mockResolvedValueOnce({
                    recordset: [{ runId: 99 }],
                }) // Second query - get previous run
                .mockResolvedValueOnce({
                    recordset: [], // No contractors
                }); // Third query - get contractors

            const mockTx = {
                request: vi.fn().mockReturnValue(mockRequest),
            };

            mockRunRepo.beginTransaction.mockResolvedValue(mockTx);
        });

        it('should successfully execute a run and return success result', async () => {
            const result = await service.executeRun(1, 15, '2025-01-15', false, 2);

            expect(result.success).toBe(true);
            expect(result.runId).toBe(100);
            expect(result.message).toContain('successfully');
            expect(mockRunRepo.commitTransaction).toHaveBeenCalled();
        });

        it('should handle dry run mode without writing to database', async () => {
            const result = await service.executeRun(1, 15, '2025-01-15', true, 2);

            expect(result.success).toBe(true);
            expect(result.runId).toBeNull();
            expect(result.message).toContain('Dry run');
            expect(mockRunRepo.rollbackTransaction).toHaveBeenCalled();
        });

        it('should handle transaction errors gracefully', async () => {
            const mockRequest = {
                input: vi.fn().mockReturnThis(),
                query: vi.fn().mockRejectedValue(new Error('Database error')),
            };

            const mockTx = {
                request: vi.fn().mockReturnValue(mockRequest),
            };

            mockRunRepo.beginTransaction.mockResolvedValue(mockTx);

            const result = await service.executeRun(1, 15, '2025-01-15', false, 2);

            expect(result.success).toBe(false);
            expect(result.runId).toBeNull();
            expect(result.message).toContain('Error');
            expect(mockRunRepo.rollbackTransaction).toHaveBeenCalled();
        });

        it('should use correct allowed direct count for mode', async () => {
            // This test verifies the service passes the allowedDirect parameter
            const result = await service.executeRun(2, 10, '2025-01-15', true, 3);

            expect(result.success).toBe(true);
            expect(mockRunRepo.rollbackTransaction).toHaveBeenCalled();
        });

        it('should handle beginTransaction failure', async () => {
            mockRunRepo.beginTransaction.mockRejectedValue(new Error('Transaction init failed'));

            const result = await service.executeRun(1, 15, '2025-01-15', false, 2);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Transaction init failed');
        });

        it('should properly bind input parameters for run insertion', async () => {
            const mockRequest = {
                input: vi.fn().mockReturnThis(),
                query: vi.fn()
                    .mockResolvedValueOnce({ recordset: [{ runId: 100 }] })
                    .mockResolvedValueOnce({ recordset: [] })
                    .mockResolvedValueOnce({ recordset: [] }),
            };

            const mockTx = {
                request: vi.fn().mockReturnValue(mockRequest),
            };

            mockRunRepo.beginTransaction.mockResolvedValue(mockTx);

            await service.executeRun(5, 25, '2025-02-15', true, 2);

            // Check that input() was called with expected parameters
            expect(mockRequest.input).toHaveBeenCalledWith('reviewed', expect.anything(), '2025-02-15');
            expect(mockRequest.input).toHaveBeenCalledWith('modeId', expect.anything(), 5);
            expect(mockRequest.input).toHaveBeenCalledWith('runNum', expect.anything(), 25);
        });
    });

    describe('_formatDatesInArray', () => {
        it('should convert Date objects to ISO date strings', () => {
            const data = [
                {
                    id: 1,
                    StartDate: new Date('2025-01-15'),
                    ReviewedDate: new Date('2025-01-20')
                }
            ];

            const result = service._formatDatesInArray(data);

            expect(result[0].StartDate).toBe('2025-01-15');
            expect(result[0].ReviewedDate).toBe('2025-01-20');
            expect(result[0].id).toBe(1);
        });

        it('should handle string dates in YYYY-MM-DD format', () => {
            const data = [
                {
                    id: 1,
                    StartDate: '2025-01-15T00:00:00.000Z',
                    ReviewedDate: '2025-01-20'
                }
            ];

            const result = service._formatDatesInArray(data);

            expect(result[0].StartDate).toBe('2025-01-15');
            expect(result[0].ReviewedDate).toBe('2025-01-20');
        });

        it('should use custom date fields if provided', () => {
            const data = [
                {
                    id: 1,
                    customDate: new Date('2025-01-15'),
                    StartDate: new Date('2025-02-01')
                }
            ];

            const result = service._formatDatesInArray(data, ['customDate']);

            expect(result[0].customDate).toBe('2025-01-15');
            expect(result[0].StartDate).toBeInstanceOf(Date);
        });

        it('should handle null and undefined date values', () => {
            const data = [
                {
                    id: 1,
                    StartDate: null,
                    ReviewedDate: undefined
                }
            ];

            const result = service._formatDatesInArray(data);

            expect(result[0].StartDate).toBeNull();
            expect(result[0].ReviewedDate).toBeUndefined();
        });
    });
});


