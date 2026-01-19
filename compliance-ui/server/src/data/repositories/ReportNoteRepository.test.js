/**
 * ReportNoteRepository.test.js - Unit tests for ReportNoteRepository
 */

import { ReportNoteRepository } from './ReportNoteRepository.js';

describe('ReportNoteRepository', () => {
    let repository;
    let mockRepo;

    beforeEach(() => {
        mockRepo = {
            query: jest.fn(),
            execute: jest.fn(),
        };

        repository = new ReportNoteRepository(mockRepo);
    });

    describe('getNotesByReport', () => {
        it('should return notes for a specific report', async () => {
            const notes = [
                { note: 'Note 1', createdDate: '2025-01-15', createdBy: 'admin' },
                { note: 'Note 2', createdDate: '2025-01-16', createdBy: 'user1' },
            ];
            mockRepo.query.mockResolvedValue(notes);

            const result = await repository.getNotesByReport(10);

            expect(result).toEqual(notes);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('CMP_ReportNotes'),
                { reportId: 10 }
            );
        });

        it('should return empty array when no notes found', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getNotesByReport(999);

            expect(result).toEqual([]);
        });

        it('should order notes by date', async () => {
            const notes = [];
            mockRepo.query.mockResolvedValue(notes);

            await repository.getNotesByReport(10);

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY CreatedDate');
        });
    });

    describe('getNotesByEmployer', () => {
        it('should return notes for a specific employer', async () => {
            const notes = [
                { note: 'Note A', createdDate: '2025-01-15', createdBy: 'admin' },
            ];
            mockRepo.query.mockResolvedValue(notes);

            const result = await repository.getNotesByEmployer('EMP001');

            expect(result).toEqual(notes);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('CMP_ReportNotes'),
                { employerId: 'EMP001' }
            );
        });

        it('should return empty array when employer has no notes', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getNotesByEmployer('EMP999');

            expect(result).toEqual([]);
        });

        it('should filter by EmployerId', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getNotesByEmployer('EMP001');

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('n.EmployerId = @employerId');
        });
    });

    describe('createNote', () => {
        it('should create a new note', async () => {
            mockRepo.execute.mockResolvedValue(1);

            const result = await repository.createNote({
                reportId: 10,
                employerId: 'EMP001',
                note: 'Test note',
                changedBy: 'admin',
            });

            expect(result).toBe(1);
            expect(mockRepo.execute).toHaveBeenCalled();
        });

        it('should pass all note data to execute', async () => {
            mockRepo.execute.mockResolvedValue(1);

            const noteData = {
                reportId: 10,
                employerId: 'EMP001',
                note: 'Test note',
                changedBy: 'admin',
            };

            await repository.createNote(noteData);

            expect(mockRepo.execute).toHaveBeenCalledWith(
                expect.stringContaining('CMP_ReportNotes'),
                expect.any(Object)
            );
        });

        it('should handle different note data', async () => {
            mockRepo.execute.mockResolvedValue(1);

            const noteData = {
                reportId: 42,
                employerId: 'EMP999',
                note: 'Different note',
                changedBy: 'user123',
            };

            const result = await repository.createNote(noteData);

            expect(result).toBe(1);
            expect(mockRepo.execute).toHaveBeenCalled();
        });
    });
});
