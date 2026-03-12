/**
 * BlacklistController - HTTP request handlers for Contractor Blacklist operations
 * Follows Single Responsibility Principle (SRP)
 * Only handles HTTP concerns, delegates business logic to services
 */

import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';

export class BlacklistController {
    constructor(blacklistService) {
        this.blacklistService = blacklistService;
    }

    /**
     * GET /api/blacklist - Get all non-deleted blacklist records
     */
    getAll = asyncHandler(async (req, res) => {
        const records = await this.blacklistService.getAll();
        res.json(records);
    });

    /**
     * GET /api/blacklist/all - Get all blacklist records including deleted
     */
    getAllIncludingDeleted = asyncHandler(async (req, res) => {
        const records = await this.blacklistService.getAllIncludingDeleted();
        res.json(records);
    });

    /**
     * GET /api/blacklist/:id - Get blacklist record by ID
     */
    getById = asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw AppError.badRequest('Blacklist ID must be a valid integer');
        }

        const record = await this.blacklistService.getById(id);
        res.json(record);
    });

    /**
     * GET /api/blacklist/employer/:employerId - Get blacklist records by employer
     */
    getByEmployerId = asyncHandler(async (req, res) => {
        const { employerId } = req.params;

        if (!employerId) {
            throw AppError.badRequest('Employer ID is required');
        }

        const records = await this.blacklistService.getByEmployerId(employerId);
        res.json(records);
    });

    /**
     * POST /api/blacklist/check - Check if contractor is blacklisted
     */
    checkBlacklist = asyncHandler(async (req, res) => {
        const { employerId, contractorName } = req.body;

        if (!employerId || !contractorName) {
            throw AppError.badRequest('Employer ID and contractor name are required');
        }

        const isBlacklisted = await this.blacklistService.isBlacklisted(employerId, contractorName);
        res.json({ isBlacklisted });
    });

    /**
     * POST /api/blacklist - Create new blacklist entry
     */
    create = asyncHandler(async (req, res) => {
        const { employerId, contractorName } = req.body;

        if (!employerId || !contractorName) {
            throw AppError.badRequest('Employer ID and contractor name are required');
        }

        const record = await this.blacklistService.create({ employerId, contractorName });
        res.status(201).json(record);
    });

    /**
     * PUT /api/blacklist/:id - Update blacklist entry
     */
    update = asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw AppError.badRequest('Blacklist ID must be a valid integer');
        }

        const { contractorName } = req.body;
        if (!contractorName) {
            throw AppError.badRequest('Contractor name is required');
        }

        const record = await this.blacklistService.update(id, { contractorName });
        res.json(record);
    });

    /**
     * DELETE /api/blacklist/:id - Soft delete blacklist entry
     */
    delete = asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw AppError.badRequest('Blacklist ID must be a valid integer');
        }

        const record = await this.blacklistService.delete(id);
        res.json(record);
    });
}
