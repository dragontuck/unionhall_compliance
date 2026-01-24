/**
 * ReportDetailRepository.test.js - Unit tests for ReportDetailRepository
 */

import { ReportDetailRepository } from './ReportDetailRepository.js';

describe('ReportDetailRepository', () => {
    let repository;
    let mockPool;
    let mockRequest;

    beforeEach(() => {
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        };

        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest),
        };

        repository = new ReportDetailRepository(mockPool);

        // Spy on the methods so we can mock their return values
        jest.spyOn(repository, 'query');
        jest.spyOn(repository, 'queryOne');
        jest.spyOn(repository, 'execute');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getReportDetails', () => {
        it('should return report details with default limit', async () => {
            const details = [
                { id: 1, runId: 1, contractorId: 100 },
                { id: 2, runId: 1, contractorId: 101 },
            ];
            repository.query.mockResolvedValue(details);

            const result = await repository.getReportDetails();

            expect(result).toEqual(details);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 1000'),
                {}
            );
        });

        it('should apply runId filter', async () => {
            const details = [{ id: 1, runId: 5 }];
            repository.query.mockResolvedValue(details);

            await repository.getReportDetails({ runId: 5 });

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('RunId = @runId'),
                { runId: 5 }
            );
        });

        it('should apply contractorId filter', async () => {
            const details = [{ id: 1, contractorId: 100 }];
            repository.query.mockResolvedValue(details);

            await repository.getReportDetails({ contractorId: 100 });

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('ContractorID = @contractorId'),
                { contractorId: 100 }
            );
        });

        it('should apply contractorName filter with LIKE', async () => {
            const details = [{ id: 1, contractorName: 'ABC Corp' }];
            repository.query.mockResolvedValue(details);

            await repository.getReportDetails({ contractorName: 'ABC' });

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('LIKE @contractorName'),
                { contractorName: '%ABC%' }
            );
        });

        it('should apply employerId filter', async () => {
            const details = [{ id: 1, employerId: 'EMP001' }];
            repository.query.mockResolvedValue(details);

            await repository.getReportDetails({ employerId: 'EMP001' });

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('EmployerID = @employerId'),
                { employerId: 'EMP001' }
            );
        });

        it('should apply multiple filters', async () => {
            const details = [];
            repository.query.mockResolvedValue(details);

            await repository.getReportDetails({
                runId: 5,
                contractorId: 100,
                employerId: 'EMP001',
            }, 500);

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('TOP 500'),
                expect.objectContaining({
                    runId: 5,
                    contractorId: 100,
                    employerId: 'EMP001',
                })
            );
        });

        it('should order by id descending', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getReportDetails();

            const query = repository.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY id DESC');
        });
    });

    describe('getDetailsByRun', () => {
        it('should return details for a run', async () => {
            const details = [
                { employerId: 'EMP001', contractorId: 100, complianceStatus: 'pass' },
            ];
            repository.query.mockResolvedValue(details);

            const result = await repository.getDetailsByRun(5);

            expect(result).toEqual(details);
            expect(repository.query).toHaveBeenCalledWith(
                expect.any(String),
                { runId: 5 }
            );
        });

        it('should return empty array for run with no details', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getDetailsByRun(999);

            expect(result).toEqual([]);
        });

        it('should include mode information', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getDetailsByRun(5);

            const query = repository.query.mock.calls[0][0];
            expect(query).toContain('CMP_ReportDetails');
        });
    });

    describe('getLast4Hires', () => {
        it('should return last 4 hires per contractor', async () => {
            const hires = [
                { employerId: 'EMP001', memberName: 'John', startDate: '2025-01-01' },
                { employerId: 'EMP001', memberName: 'Jane', startDate: '2024-12-15' },
            ];
            repository.query.mockResolvedValue(hires);

            const result = await repository.getLast4Hires(5);

            expect(result).toEqual(hires);
            expect(repository.query).toHaveBeenCalledWith(
                expect.any(String),
                { runId: 5 }
            );
        });

        it('should handle runs with no hires', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getLast4Hires(999);

            expect(result).toEqual([]);
        });
    });
});
