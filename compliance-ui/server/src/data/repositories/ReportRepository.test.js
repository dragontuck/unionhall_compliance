/**
 * ReportRepository.test.js - Unit tests for ReportRepository
 */

import { ReportRepository } from './ReportRepository.js';

describe('ReportRepository', () => {
    let repository;
    let mockRepo;

    beforeEach(() => {
        mockRepo = {
            query: jest.fn(),
            queryOne: jest.fn(),
            execute: jest.fn(),
        };

        repository = new ReportRepository(mockRepo);
    });

    describe('getReports', () => {
        it('should return all reports with default limit', async () => {
            const reports = [
                { id: 1, runId: 1, contractorId: 100 },
                { id: 2, runId: 1, contractorId: 101 },
            ];
            mockRepo.query.mockResolvedValue(reports);

            const result = await repository.getReports();

            expect(result).toEqual(reports);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 500'),
                {}
            );
        });

        it('should apply runId filter', async () => {
            const reports = [{ id: 1, runId: 5 }];
            mockRepo.query.mockResolvedValue(reports);

            await repository.getReports({ runId: 5 });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('RunId = @runId'),
                { runId: 5 }
            );
        });

        it('should apply contractorId filter', async () => {
            const reports = [{ id: 1, contractorId: 100 }];
            mockRepo.query.mockResolvedValue(reports);

            await repository.getReports({ contractorId: 100 });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('ContractorID = @contractorId'),
                { contractorId: 100 }
            );
        });

        it('should apply employerId filter', async () => {
            const reports = [{ id: 1, employerId: 'EMP001' }];
            mockRepo.query.mockResolvedValue(reports);

            await repository.getReports({ employerId: 'EMP001' });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('EmployerID = @employerId'),
                { employerId: 'EMP001' }
            );
        });

        it('should apply multiple filters', async () => {
            const reports = [];
            mockRepo.query.mockResolvedValue(reports);

            await repository.getReports({
                runId: 5,
                contractorId: 100,
                employerId: 'EMP001',
            }, 250);

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('TOP 250'),
                expect.objectContaining({
                    runId: 5,
                    contractorId: 100,
                    employerId: 'EMP001',
                })
            );
        });

        it('should return empty array', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getReports();

            expect(result).toEqual([]);
        });
    });

    describe('getReportsByRun', () => {
        it('should return reports for a run with note count', async () => {
            const reports = [
                { id: 1, runId: 5, contractorName: 'ABC', noteCount: 2 },
            ];
            mockRepo.query.mockResolvedValue(reports);

            const result = await repository.getReportsByRun(5);

            expect(result).toEqual(reports);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('CMP_ReportNotes'),
                { runId: 5 }
            );
        });

        it('should return empty array for run with no reports', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getReportsByRun(999);

            expect(result).toEqual([]);
        });

        it('should order by ContractorName', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getReportsByRun(5);

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY ContractorName');
        });
    });

    describe('getReportById', () => {
        it('should return report by ID with note count', async () => {
            const report = { id: 1, runId: 5, contractorName: 'ABC', noteCount: 3 };
            mockRepo.queryOne.mockResolvedValue(report);

            const result = await repository.getReportById(1);

            expect(result).toEqual(report);
            expect(mockRepo.queryOne).toHaveBeenCalledWith(
                expect.stringContaining('id = @id'),
                { id: 1 }
            );
        });

        it('should return null when report not found', async () => {
            mockRepo.queryOne.mockResolvedValue(null);

            const result = await repository.getReportById(999);

            expect(result).toBeNull();
        });

        it('should include note count in query', async () => {
            mockRepo.queryOne.mockResolvedValue({});

            await repository.getReportById(1);

            const query = mockRepo.queryOne.mock.calls[0][0];
            expect(query).toContain('COUNT(*)');
            expect(query).toContain('CMP_ReportNotes');
        });
    });

    describe('updateReport', () => {
        it('should update report with all fields', async () => {
            mockRepo.execute.mockResolvedValue(1);

            const result = await repository.updateReport({
                reportId: 1,
                status: 'reviewed',
                directCount: 5,
                dispatchNeeded: 1,
                nextHireDispatch: 'Y',
            });

            expect(result).toBe(1);
            expect(mockRepo.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE CMP_Reports'),
                expect.objectContaining({
                    reportId: 1,
                    status: 'reviewed',
                    directCount: 5,
                    dispatchNeeded: 1,
                    nextHireDispatch: 'Y',
                })
            );
        });

        it('should handle different data values', async () => {
            mockRepo.execute.mockResolvedValue(1);

            await repository.updateReport({
                reportId: 42,
                status: 'pending',
                directCount: 10,
                dispatchNeeded: 0,
                nextHireDispatch: 'N',
            });

            expect(mockRepo.execute).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    reportId: 42,
                    status: 'pending',
                    directCount: 10,
                    dispatchNeeded: 0,
                    nextHireDispatch: 'N',
                })
            );
        });
    });
});
