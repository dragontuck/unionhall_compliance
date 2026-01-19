/**
 * RunController - HTTP request handlers for Run operations
 * Follows Single Responsibility Principle (SRP)
 * Only handles HTTP concerns, delegates business logic to services
 */

import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';

export class RunController {
    constructor(runService) {
        this.runService = runService;
    }

    /**
     * GET /api/runs - Get all runs
     */
    getAllRuns = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const runs = await this.runService.getAllRuns(limit);
        res.json(runs);
    });

    /**
     * GET /api/runs/:id - Get run by ID
     */
    getRunById = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.id);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const run = await this.runService.getRunById(runId);
        res.json(run);
    });

    /**
     * POST /api/runs - Create new run
     */
    createRun = asyncHandler(async (req, res) => {
        const { modeId, reviewedDate, runNumber } = req.body;

        if (!modeId || !reviewedDate) {
            throw AppError.badRequest('Mode ID and reviewed date are required');
        }

        const newRunId = await this.runService.createRun({
            modeId: parseInt(modeId),
            reviewedDate,
            runNumber: runNumber ? parseInt(runNumber) : undefined
        });

        res.status(201).json({
            id: newRunId,
            message: 'Run created successfully'
        });
    });

    /**
     * GET /api/export/run/:runId - Export run for Excel
     */
    exportRun = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.runId);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const buffer = await this.runService.getRunForExport(runId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="compliance_report_${req.params.runId}.xlsx"`);
        res.send(buffer);
    });

    /**
     * GET /api/export/data/:runId - Export run data
     */
    exportData = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.runId);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const runData = await this.runService.getRunForExport(runId);
        res.json({
            runId: runId,
            details: runData.details,
            reports: runData.reports
        });
    });
}
