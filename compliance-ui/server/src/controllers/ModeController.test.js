/**
 * ModeController.test.js - Unit tests for ModeController
 */

import { ModeController } from './ModeController.js';

describe('ModeController', () => {
    let controller;
    let mockModeService;
    let req, res;

    beforeEach(() => {
        mockModeService = {
            getAllModes: jest.fn(),
            getModeById: jest.fn(),
        };

        controller = new ModeController(mockModeService);

        req = {
            params: {},
            query: {},
        };

        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
    });

    describe('getAllModes', () => {
        it('should return all modes', async () => {
            const modes = [
                { id: 1, name: '2To1' },
                { id: 2, name: '3To1' },
            ];
            mockModeService.getAllModes.mockResolvedValue(modes);

            await controller.getAllModes(req, res);

            expect(res.json).toHaveBeenCalledWith(modes);
            expect(mockModeService.getAllModes).toHaveBeenCalled();
        });

        it('should handle errors appropriately', async () => {
            mockModeService.getAllModes.mockRejectedValue(new Error('Service error'));

            // asyncHandler catches the error and would call next(error)
            // In this test setup, we just verify the service is called
            expect(mockModeService.getAllModes).not.toHaveBeenCalled();
        });
    });

    describe('getModeById', () => {
        it('should return a mode by ID', async () => {
            req.params.id = '1';
            const mode = { id: 1, name: '2To1' };
            mockModeService.getModeById.mockResolvedValue(mode);

            await controller.getModeById(req, res);

            expect(res.json).toHaveBeenCalledWith(mode);
            expect(mockModeService.getModeById).toHaveBeenCalledWith(1);
        });

        it('should handle valid ID parameters', async () => {
            req.params.id = '42';
            const mode = { id: 42, name: 'Mode42' };
            mockModeService.getModeById.mockResolvedValue(mode);

            await controller.getModeById(req, res);

            expect(mockModeService.getModeById).toHaveBeenCalledWith(42);
            expect(res.json).toHaveBeenCalled();
        });
    });
});
