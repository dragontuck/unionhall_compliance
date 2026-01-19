/**
 * ReportService.test.js - Unit tests for ReportService
 */

import { ReportService } from './ReportService.js';

describe('ReportService', () => {
    let service;
    let mockReportRepo;
    let mockDetailRepo;
    let mockNoteRepo;

    beforeEach(() => {
        mockReportRepo = {
            getReports: jest.fn(),
            getReportsByRun: jest.fn(),
            getReportById: jest.fn(),
            updateReport: jest.fn(),
        };

        mockDetailRepo = {
            getDetailsByRun: jest.fn(),
            updateDetail: jest.fn(),
        };

        mockNoteRepo = {
            getNotesByReport: jest.fn(),
            getNotesByEmployer: jest.fn(),
            addNote: jest.fn(),
            createNote: jest.fn(),
        };

        service = new ReportService(mockReportRepo, mockDetailRepo, mockNoteRepo);
    });

    describe('getReports', () => {
        it('should return all reports with filters', async () => {
            const reports = [
                { id: 1, runId: 1, contractorId: 100 },
                { id: 2, runId: 1, contractorId: 101 },
            ];
            mockReportRepo.getReports.mockResolvedValue(reports);

            const result = await service.getReports({ runId: 1 }, 500);

            expect(result).toEqual(reports);
            expect(mockReportRepo.getReports).toHaveBeenCalledWith({ runId: 1 }, 500);
        });

        it('should handle empty results', async () => {
            mockReportRepo.getReports.mockResolvedValue([]);

            const result = await service.getReports({}, 100);

            expect(result).toEqual([]);
        });
    });

    describe('getReportsByRun', () => {
        it('should return reports for a specific run', async () => {
            const reports = [
                { id: 1, runId: 5, summary: 'test' },
            ];
            mockReportRepo.getReportsByRun.mockResolvedValue(reports);

            const result = await service.getReportsByRun(5);

            expect(result).toEqual(reports);
            expect(mockReportRepo.getReportsByRun).toHaveBeenCalledWith(5);
        });

        it('should throw error on database failure', async () => {
            mockReportRepo.getReportsByRun.mockRejectedValue(new Error('DB error'));

            await expect(service.getReportsByRun(5)).rejects.toThrow('DB error');
        });
    });

    describe('getReportById', () => {
        it('should return a report by ID', async () => {
            const report = { id: 1, runId: 5, data: 'test' };
            mockReportRepo.getReportById.mockResolvedValue(report);

            const result = await service.getReportById(1);

            expect(result).toEqual(report);
        });

        it('should throw error when report not found', async () => {
            mockReportRepo.getReportById.mockResolvedValue(null);

            await expect(service.getReportById(999)).rejects.toThrow('Report 999 not found');
        });
    });

    describe('getDetailsByRun', () => {
        it('should return details for a run', async () => {
            const details = [
                { id: 1, runId: 5, contractor: 'ABC' },
            ];
            mockDetailRepo.getDetailsByRun.mockResolvedValue(details);

            const result = await service.getDetailsByRun(5);

            expect(result).toEqual(details);
            expect(mockDetailRepo.getDetailsByRun).toHaveBeenCalledWith(5);
        });
    });

    describe('getNotesByReport', () => {
        it('should get notes for a report', async () => {
            const notes = [
                { id: 1, reportId: 10, text: 'Note 1' },
            ];
            mockNoteRepo.getNotesByReport.mockResolvedValue(notes);

            const result = await service.getReportNotes(10);

            expect(result).toEqual(notes);
            expect(mockNoteRepo.getNotesByReport).toHaveBeenCalledWith(10);
        });
    });

    describe('getNotesByEmployer', () => {
        it('should get notes for an employer', async () => {
            const notes = [
                { id: 1, employerId: 'EMP001', text: 'Note' },
            ];
            mockNoteRepo.getNotesByEmployer.mockResolvedValue(notes);

            const result = await service.getEmployerNotes('EMP001');

            expect(result).toEqual(notes);
            expect(mockNoteRepo.getNotesByEmployer).toHaveBeenCalledWith('EMP001');
        });
    });

    describe('updateReport', () => {
        it('should update a report with status and direct count', async () => {
            const updated = { id: 1, runId: 5, status: 'reviewed', directCount: 10 };
            mockReportRepo.updateReport.mockResolvedValue(updated);
            mockReportRepo.getReportById.mockResolvedValue(updated);

            const result = await service.updateReport(1, { status: 'reviewed', directCount: 10 });

            expect(mockReportRepo.updateReport).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });

        it('should add a note when updating report', async () => {
            const updated = { id: 1, reportId: 1, note: 'Updated' };
            mockReportRepo.updateReport.mockResolvedValue(updated);
            mockReportRepo.getReportById.mockResolvedValue(updated);
            mockNoteRepo.createNote.mockResolvedValue({ id: 1 });

            await service.updateReport(1, {
                status: 'reviewed',
                directCount: 10,
                note: 'Updated',
                changedBy: 'user123',
                employerId: 'EMP001'
            });

            expect(mockNoteRepo.createNote).toHaveBeenCalled();
        });

        it('should throw error if status or directCount missing', async () => {
            await expect(service.updateReport(1, { status: 'reviewed' }))
                .rejects.toThrow('Status and direct count are required');
        });
    });
});
