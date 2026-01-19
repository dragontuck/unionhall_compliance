/**
 * ModeRepository.test.js - Unit tests for ModeRepository
 */

import { ModeRepository } from './ModeRepository.js';

describe('ModeRepository', () => {
    let repository;
    let mockRepo;

    beforeEach(() => {
        mockRepo = {
            query: jest.fn(),
            queryOne: jest.fn(),
        };

        repository = new ModeRepository(mockRepo);
    });

    describe('getAllModes', () => {
        it('should return all modes', async () => {
            const modes = [
                { id: 1, Mode_Name: '2To1' },
                { id: 2, Mode_Name: '3To1' },
            ];
            mockRepo.query.mockResolvedValue(modes);

            const result = await repository.getAllModes();

            expect(result).toEqual(modes);
            expect(mockRepo.query).toHaveBeenCalledWith('SELECT * FROM CMP_Modes ORDER BY id');
        });

        it('should return empty array when no modes exist', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getAllModes();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const error = new Error('Database connection failed');
            mockRepo.query.mockRejectedValue(error);

            await expect(repository.getAllModes()).rejects.toThrow('Database connection failed');
        });
    });

    describe('getModeById', () => {
        it('should return mode by ID', async () => {
            const mode = { id: 1, Mode_Name: '2To1' };
            mockRepo.queryOne.mockResolvedValue(mode);

            const result = await repository.getModeById(1);

            expect(result).toEqual(mode);
            expect(mockRepo.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE id = @id',
                { id: 1 }
            );
        });

        it('should return null when mode not found', async () => {
            mockRepo.queryOne.mockResolvedValue(null);

            const result = await repository.getModeById(999);

            expect(result).toBeNull();
        });

        it('should handle different mode IDs', async () => {
            const mode = { id: 42, Mode_Name: 'Custom' };
            mockRepo.queryOne.mockResolvedValue(mode);

            await repository.getModeById(42);

            expect(mockRepo.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE id = @id',
                { id: 42 }
            );
        });
    });

    describe('getModeByName', () => {
        it('should return mode by name', async () => {
            const mode = { id: 1, Mode_Name: '2To1' };
            mockRepo.queryOne.mockResolvedValue(mode);

            const result = await repository.getModeByName('2To1');

            expect(result).toEqual(mode);
            expect(mockRepo.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE Mode_Name = @modeName',
                { modeName: '2To1' }
            );
        });

        it('should return null when mode name not found', async () => {
            mockRepo.queryOne.mockResolvedValue(null);

            const result = await repository.getModeByName('NonExistent');

            expect(result).toBeNull();
        });

        it('should handle different mode names', async () => {
            const mode = { id: 2, Mode_Name: '3To1' };
            mockRepo.queryOne.mockResolvedValue(mode);

            await repository.getModeByName('3To1');

            expect(mockRepo.queryOne).toHaveBeenCalledWith(
                'SELECT * FROM CMP_Modes WHERE Mode_Name = @modeName',
                { modeName: '3To1' }
            );
        });
    });
});
