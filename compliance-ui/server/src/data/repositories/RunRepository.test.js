/**
 * RunRepository.test.js - Unit tests for RunRepository
 */

import { RunRepository } from './RunRepository.js';

describe('RunRepository', () => {
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

        repository = new RunRepository(mockPool);

        // Spy on the methods so we can mock their return values
        jest.spyOn(repository, 'query');
        jest.spyOn(repository, 'queryOne');
        jest.spyOn(repository, 'queryScalar');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getAllRuns', () => {
        it('should return all runs with default limit', async () => {
            const runs = [
                { id: 1, reviewedDate: '2025-01-01', modeName: '2To1', run: 1 },
                { id: 2, reviewedDate: '2025-01-08', modeName: '3To1', run: 1 },
            ];
            repository.query.mockResolvedValue(runs);

            const result = await repository.getAllRuns();

            expect(result).toEqual(runs);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 100')
            );
        });

        it('should return runs with custom limit', async () => {
            const runs = [{ id: 1, reviewedDate: '2025-01-01' }];
            repository.query.mockResolvedValue(runs);

            const result = await repository.getAllRuns(50);

            expect(result).toEqual(runs);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 50')
            );
        });

        it('should order by id descending', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getAllRuns();

            const query = repository.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY id DESC');
        });

        it('should join with CMP_Modes', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getAllRuns();

            const query = repository.query.mock.calls[0][0];
            expect(query).toContain('CMP_Modes');
            expect(query).toContain('INNER JOIN');
        });

        it('should return empty array', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getAllRuns();

            expect(result).toEqual([]);
        });
    });

    describe('getRunById', () => {
        it('should return run by ID', async () => {
            const run = { id: 5, modeId: 1, reviewedDate: '2025-01-15' };
            repository.queryOne.mockResolvedValue(run);

            const result = await repository.getRunById(5);

            expect(result).toEqual(run);
            expect(repository.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Runs WHERE id = @id',
                { id: 5 }
            );
        });

        it('should return null when run not found', async () => {
            repository.queryOne.mockResolvedValue(null);

            const result = await repository.getRunById(999);

            expect(result).toBeNull();
        });

        it('should handle different run IDs', async () => {
            const run = { id: 42, modeId: 2 };
            repository.queryOne.mockResolvedValue(run);

            await repository.getRunById(42);

            expect(repository.queryOne).toHaveBeenCalledWith(
                expect.any(String),
                { id: 42 }
            );
        });
    });

    describe('getNextRunNumber', () => {
        it('should return next run number', async () => {
            repository.queryScalar.mockResolvedValue(16);

            const result = await repository.getNextRunNumber(1, '2025-01-15');

            expect(result).toBe(16);
            expect(repository.queryScalar).toHaveBeenCalled();
        });

        it('should return 1 for first run', async () => {
            repository.queryScalar.mockResolvedValue(1);

            const result = await repository.getNextRunNumber(1, '2025-01-15');

            expect(result).toBe(1);
        });

        it('should pass correct parameters', async () => {
            repository.queryScalar.mockResolvedValue(5);

            await repository.getNextRunNumber(2, '2025-01-22');

            expect(repository.queryScalar).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    modeId: 2,
                    reviewedDate: '2025-01-22',
                })
            );
        });
    });

    describe('createRun', () => {
        it('should create a new run', async () => {
            repository.query.mockResolvedValue([{ id: 1 }]);

            const result = await repository.createRun({
                modeId: 1,
                reviewedDate: '2025-01-15',
                runNumber: 15,
                output: '',
            });

            expect(result).toBe(1);
            expect(repository.query).toHaveBeenCalled();
        });

        it('should pass all run data', async () => {
            repository.query.mockResolvedValue([{ id: 10 }]);

            const runData = {
                modeId: 1,
                reviewedDate: '2025-01-15',
                runNumber: 20,
                output: 'test output',
            };

            const result = await repository.createRun(runData);

            expect(result).toBe(10);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT'),
                expect.objectContaining({
                    modeId: runData.modeId,
                    reviewedDate: runData.reviewedDate,
                    runNumber: runData.runNumber,
                    output: runData.output,
                })
            );
        });

        it('should handle different run data', async () => {
            repository.query.mockResolvedValue([{ id: 42 }]);

            const runData = {
                modeId: 2,
                reviewedDate: '2025-01-22',
                runNumber: 5,
                output: '',
            };

            const result = await repository.createRun(runData);

            expect(result).toBe(42);
            expect(repository.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining(runData)
            );
        });

        it('should handle missing output field', async () => {
            repository.query.mockResolvedValue([{ id: 5 }]);

            const result = await repository.createRun({
                modeId: 1,
                reviewedDate: '2025-01-15',
                runNumber: 15,
            });

            expect(result).toBe(5);
            expect(repository.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ output: '' })
            );
        });
    });

    describe('getPreviousRun', () => {
        it('should return previous run', async () => {
            const previousRun = { id: 3, modeId: 1, reviewedDate: '2025-01-08', run: 1 };
            repository.queryOne.mockResolvedValue(previousRun);

            const result = await repository.getPreviousRun(1, '2025-01-15');

            expect(result).toEqual(previousRun);
            expect(repository.queryOne).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 1'),
                { modeId: 1, reviewedDate: '2025-01-15' }
            );
        });

        it('should return null when no previous run exists', async () => {
            repository.queryOne.mockResolvedValue(null);

            const result = await repository.getPreviousRun(1, '2025-01-01');

            expect(result).toBeNull();
        });

        it('should order by reviewed date descending', async () => {
            repository.queryOne.mockResolvedValue(null);

            await repository.getPreviousRun(1, '2025-01-15');

            const query = repository.queryOne.mock.calls[0][0];
            expect(query).toContain('ORDER BY ReviewedDate DESC');
        });

        it('should filter by mode id and date', async () => {
            repository.queryOne.mockResolvedValue(null);

            await repository.getPreviousRun(2, '2025-01-22');

            const params = repository.queryOne.mock.calls[0][1];
            expect(params).toEqual({ modeId: 2, reviewedDate: '2025-01-22' });
        });

        it('should use ReviewedDate less than comparison', async () => {
            repository.queryOne.mockResolvedValue(null);

            await repository.getPreviousRun(1, '2025-01-15');

            const query = repository.queryOne.mock.calls[0][0];
            expect(query).toContain('ReviewedDate < @reviewedDate');
        });
    });
});
