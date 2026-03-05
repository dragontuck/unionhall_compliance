/**
 * ContractorSnapshotController - HTTP request handlers for Contractor Snapshot operations
 * Follows Single Responsibility Principle (SRP)
 * Only handles HTTP concerns, delegates business logic to services
 */

import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { DataConverters } from '../utils/DataConverters.js';

export class ContractorSnapshotController {
    constructor(contractorSnapshotService) {
        this.contractorSnapshotService = contractorSnapshotService;
    }

    /**
     * GET /api/contractor-snapshots - Get contractor snapshots
     */
    getContractorSnapshots = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 2000;
        const snapshotDate = req.query.snapshotDate;

        let snapshots;
        if (snapshotDate) {
            snapshots = await this.contractorSnapshotService.getContractorSnapshotsByDate(snapshotDate);
        } else {
            snapshots = await this.contractorSnapshotService.getContractorSnapshots(limit);
        }

        res.json(snapshots);
    });

    /**
     * POST /api/import/contractor-snapshots - Import contractor snapshot data from CSV
     */
    importContractorSnapshots = asyncHandler(async (req, res) => {
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
        const result = await this.contractorSnapshotService.importContractorSnapshots(rows, DataConverters);

        res.json({
            message: `Import completed: ${result.successCount} rows processed`,
            rowsImported: result.successCount,
            rowsFailed: result.failCount,
            errors: result.errors.length > 0 ? result.errors : undefined
        });
    });
}
