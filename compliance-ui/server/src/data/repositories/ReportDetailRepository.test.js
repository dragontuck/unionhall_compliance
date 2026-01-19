/**
 * ReportDetailRepository.test.js - Unit tests for ReportDetailRepository
 */

import { ReportDetailRepository } from './ReportDetailRepository.js';

describe('ReportDetailRepository', () => {
    let repository;
    let mockRepo;

    beforeEach(() => {
        mockRepo = {
            query: jest.fn(),
            queryOne: jest.fn(),
        };

        repository = new ReportDetailRepository(mockRepo);
    });

    describe('getReportDetails', () => {
        it('should return report details with default limit', async () => {
            const details = [
                { id: 1, runId: 1, contractorId: 100 },
                { id: 2, runId: 1, contractorId: 101 },
            ];
            mockRepo.query.mockResolvedValue(details);

            const result = await repository.getReportDetails();

            expect(result).toEqual(details);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 1000'),
                {}
            );
        });

        it('should apply runId filter', async () => {
            const details = [{ id: 1, runId: 5 }];
            mockRepo.query.mockResolvedValue(details);

            await repository.getReportDetails({ runId: 5 });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('RunId = @runId'),
                { runId: 5 }
            );
        });

        it('should apply contractorId filter', async () => {
            const details = [{ id: 1, contractorId: 100 }];
            mockRepo.query.mockResolvedValue(details);

            await repository.getReportDetails({ contractorId: 100 });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('ContractorID = @contractorId'),
                { contractorId: 100 }
            );
        });

        it('should apply contractorName filter with LIKE', async () => {
            const details = [{ id: 1, contractorName: 'ABC Corp' }];
            mockRepo.query.mockResolvedValue(details);

            await repository.getReportDetails({ contractorName: 'ABC' });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('LIKE @contractorName'),
                { contractorName: '%ABC%' }
            );
        });

        it('should apply employerId filter', async () => {
            const details = [{ id: 1, employerId: 'EMP001' }];
            mockRepo.query.mockResolvedValue(details);

            await repository.getReportDetails({ employerId: 'EMP001' });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('EmployerID = @employerId'),
                { employerId: 'EMP001' }
            );
        });

        it('should apply multiple filters', async () => {
            const details = [];
            mockRepo.query.mockResolvedValue(details);

            await repository.getReportDetails({
                runId: 5,
                contractorId: 100,
                employerId: 'EMP001',
            }, 500);

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('TOP 500'),
                expect.objectContaining({
                    runId: 5,
                    contractorId: 100,
                    employerId: 'EMP001',
                })
            );
        });

        it('should order by id descending', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getReportDetails();

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY id DESC');
        });
    });

    describe('getDetailsByRun', () => {
        it('should return details for a run', async () => {
            const details = [
                { employerId: 'EMP001', contractorId: 100, complianceStatus: 'pass' },
            ];
            mockRepo.query.mockResolvedValue(details);

            const result = await repository.getDetailsByRun(5);

            expect(result).toEqual(details);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.any(String),
                { runId: 5 }
            );
        });

        it('should return empty array for run with no details', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getDetailsByRun(999);

            expect(result).toEqual([]);
        });

        it('should include mode information', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getDetailsByRun(5);

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('CMP_ReportDetails');
        });
    });

    describe('getLast4Hires', () => {
        it('should return last 4 hires per contractor', async () => {
            const hires = [
                { employerId: 'EMP001', memberName: 'John', startDate: '2025-01-01' },
                { employerId: 'EMP001', memberName: 'Jane', startDate: '2024-12-15' },
            ];
            mockRepo.query.mockResolvedValue(hires);

            const result = await repository.getLast4Hires(5);

            expect(result).toEqual(hires);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.any(String),
                { runId: 5 }
            );
        });

        it('should handle runs with no hires', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getLast4Hires(999);

            expect(result).toEqual([]);
        });
    });
});
