/**
 * ModeService.test.js - Unit tests for ModeService
 */

import { ModeService } from '../../src/services/ModeService.js';

describe('ModeService', () => {
    let modeService;
    let mockModeRepository;

    beforeEach(() => {
        // Create mock repository
        mockModeRepository = {
            getAllModes: jest.fn(),
            getModeById: jest.fn(),
        };

        modeService = new ModeService(mockModeRepository);
    });

    describe('getAllModes', () => {
        it('should return all modes from repository', async () => {
            const modes = [
                { id: 1, name: '2To1', description: 'Two to one' },
                { id: 2, name: '3To1', description: 'Three to one' },
            ];
            mockModeRepository.getAllModes.mockResolvedValue(modes);

            const result = await modeService.getAllModes();

            expect(result).toEqual(modes);
            expect(mockModeRepository.getAllModes).toHaveBeenCalled();
        });

        it('should handle repository errors', async () => {
            const error = new Error('Database error');
            mockModeRepository.getAllModes.mockRejectedValue(error);

            await expect(modeService.getAllModes()).rejects.toThrow('Database error');
        });
    });

    describe('getModeById', () => {
        it('should return a mode by ID', async () => {
            const mode = { id: 1, name: '2To1', description: 'Two to one' };
            mockModeRepository.getModeById.mockResolvedValue(mode);

            const result = await modeService.getModeById(1);

            expect(result).toEqual(mode);
            expect(mockModeRepository.getModeById).toHaveBeenCalledWith(1);
        });

        it('should throw error when mode not found', async () => {
            mockModeRepository.getModeById.mockResolvedValue(null);

            await expect(modeService.getModeById(999)).rejects.toThrow('Mode 999 not found');
        });

        it('should handle repository errors', async () => {
            const error = new Error('Query failed');
            mockModeRepository.getModeById.mockRejectedValue(error);

            await expect(modeService.getModeById(1)).rejects.toThrow('Query failed');
        });
    });
});
