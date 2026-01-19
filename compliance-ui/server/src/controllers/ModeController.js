/**
 * ModeController - HTTP request handlers for Mode operations
 * Follows Single Responsibility Principle (SRP)
 * Only handles HTTP concerns, delegates business logic to services
 */

import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';

export class ModeController {
    constructor(modeService) {
        this.modeService = modeService;
    }

    /**
     * GET /api/modes - Get all modes
     */
    getAllModes = asyncHandler(async (req, res) => {
        const modes = await this.modeService.getAllModes();
        res.json(modes);
    });

    /**
     * GET /api/modes/:id - Get mode by ID
     */
    getModeById = asyncHandler(async (req, res) => {
        const modeId = parseInt(req.params.id);
        if (isNaN(modeId)) {
            throw AppError.badRequest('Mode ID must be a valid integer');
        }

        const mode = await this.modeService.getModeById(modeId);
        res.json(mode);
    });
}
