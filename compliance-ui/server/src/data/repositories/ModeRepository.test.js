/**
 * ModeRepository.test.js - Unit tests for ModeRepository
 */

import { ModeRepository } from './ModeRepository.js';

describe('ModeRepository', () => {
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

        repository = new ModeRepository(mockPool);

        // Spy on the methods so we can mock their return values
        jest.spyOn(repository, 'query');
        jest.spyOn(repository, 'queryOne');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getAllModes', () => {
        it('should return all modes', async () => {
            const modes = [
                { id: 1, Mode_Name: '2To1' },
                { id: 2, Mode_Name: '3To1' },
            ];
            mockRequest.query.mockResolvedValue({ recordset: modes });

            const result = await repository.getAllModes();

            expect(result).toEqual(modes);
            expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM CMP_Modes ORDER BY id');
        });

        it('should return empty array when no modes exist', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await repository.getAllModes();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const error = new Error('Database connection failed');
            mockRequest.query.mockRejectedValue(error);

            await expect(repository.getAllModes()).rejects.toThrow();
        });
    });

    describe('getModeById', () => {
        it('should return mode by ID', async () => {
            const mode = { id: 1, Mode_Name: '2To1' };
            repository.queryOne.mockResolvedValue(mode);

            const result = await repository.getModeById(1);

            expect(result).toEqual(mode);
            expect(repository.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE id = @id',
                { id: 1 }
            );
        });

        it('should return null when mode not found', async () => {
            repository.queryOne.mockResolvedValue(null);

            const result = await repository.getModeById(999);

            expect(result).toBeNull();
        });

        it('should handle different mode IDs', async () => {
            const mode = { id: 42, Mode_Name: 'Custom' };
            repository.queryOne.mockResolvedValue(mode);

            await repository.getModeById(42);

            expect(repository.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE id = @id',
                { id: 42 }
            );
        });
    });

    describe('getModeByName', () => {
        it('should return mode by name', async () => {
            const mode = { id: 1, Mode_Name: '2To1' };
            repository.queryOne.mockResolvedValue(mode);

            const result = await repository.getModeByName('2To1');

            expect(result).toEqual(mode);
            expect(repository.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE Mode_Name = @modeName',
                { modeName: '2To1' }
            );
        });

        it('should return null when mode name not found', async () => {
            repository.queryOne.mockResolvedValue(null);

            const result = await repository.getModeByName('NonExistent');

            expect(result).toBeNull();
        });

        it('should handle different mode names', async () => {
            const mode = { id: 2, Mode_Name: '3To1' };
            repository.queryOne.mockResolvedValue(mode);

            await repository.getModeByName('3To1');

            expect(repository.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE Mode_Name = @modeName',
                { modeName: '3To1' }
            );
        });
    });
});
