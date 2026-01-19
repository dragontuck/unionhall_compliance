/**
 * HireDataController - HTTP request handlers for Hire Data operations
 * Follows Single Responsibility Principle (SRP)
 * Only handles HTTP concerns, delegates business logic to services
 */

import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { DataConverters } from '../utils/DataConverters.js';

export class HireDataController {
    constructor(hireDataService) {
        this.hireDataService = hireDataService;
    }

    /**
     * GET /api/hire-data - Get hire data
     */
    getHireData = asyncHandler(async (req, res) => {
        const { reviewedDate } = req.query;
        const limit = parseInt(req.query.limit) || 2000;

        const filters = {};
        if (reviewedDate) filters.reviewedDate = reviewedDate;

        const hireData = await this.hireDataService.getHireData(filters, limit);
        res.json(hireData);
    });

    /**
     * GET /api/recent-hires/run/:runId - Get recent hires
     */
    getRecentHires = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.runId);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const hires = await this.hireDataService.getRecentHires(runId);
        res.json(hires);
    });

    /**
     * POST /api/import/hires - Import hire data from CSV
     */
    importHires = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw AppError.badRequest('No file uploaded');
        }

        // Parse CSV from file buffer
        const rows = [];
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        await new Promise((resolve, reject) => {
            bufferStream
                .pipe(csv())
                .on('data', (row) => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        if (rows.length === 0) {
            throw AppError.badRequest('CSV file is empty');
        }

        // Import using service
        const result = await this.hireDataService.importHires(rows, DataConverters);

        res.json({
            message: `Import completed: ${result.successCount} rows inserted`,
            rowsImported: result.successCount,
            rowsFailed: result.failCount,
            errors: result.errors.length > 0 ? result.errors : undefined
        });
    });
}
