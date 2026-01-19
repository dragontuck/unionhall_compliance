/**
 * ReportController - HTTP request handlers for Report operations
 * Follows Single Responsibility Principle (SRP)
 * Only handles HTTP concerns, delegates business logic to services
 */

import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';

export class ReportController {
    constructor(reportService) {
        this.reportService = reportService;
    }

    /**
     * GET /api/reports - Get reports with optional filters
     */
    getReports = asyncHandler(async (req, res) => {
        const { runId, contractorId, employerId } = req.query;
        const limit = parseInt(req.query.limit) || 500;

        const filters = {};
        if (runId) filters.runId = parseInt(runId);
        if (contractorId) filters.contractorId = parseInt(contractorId);
        if (employerId) filters.employerId = employerId;

        const reports = await this.reportService.getReports(filters, limit);
        res.json(reports);
    });

    /**
     * GET /api/reports/run/:runId - Get reports by run
     */
    getReportsByRun = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.runId);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const reports = await this.reportService.getReportsByRun(runId);
        res.json(reports);
    });

    /**
     * GET /api/report-details - Get report details with filters
     */
    getReportDetails = asyncHandler(async (req, res) => {
        const { runId, contractorId, contractorName, employerId } = req.query;
        const limit = parseInt(req.query.limit) || 1000;

        const filters = {};
        if (runId) filters.runId = parseInt(runId);
        if (contractorId) filters.contractorId = parseInt(contractorId);
        if (contractorName) filters.contractorName = contractorName;
        if (employerId) filters.employerId = employerId;

        const details = await this.reportService.getReportDetails(filters, limit);
        res.json(details);
    });

    /**
     * GET /api/report-details/run/:runId - Get report details by run
     */
    getReportDetailsByRun = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.runId);
        console.log('Received runId for details by run:', runId);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const details = await this.reportService.getDetailsByRun(runId);
        res.json(details);
    });

    /**
     * PUT /api/report-details/:id - Update report
     */
    updateReport = asyncHandler(async (req, res) => {
        const reportId = parseInt(req.params.id);
        if (isNaN(reportId)) {
            throw AppError.badRequest('Report ID must be a valid integer');
        }

        const { status, directCount, dispatchNeeded, nextHireDispatch, employerId, note, changedBy } = req.body;

        if (status === undefined || directCount === undefined) {
            throw AppError.badRequest('Status and direct count are required');
        }

        const updatedReport = await this.reportService.updateReport(reportId, {
            status,
            directCount: parseInt(directCount),
            dispatchNeeded: parseInt(dispatchNeeded) || 0,
            nextHireDispatch: nextHireDispatch || 'N',
            employerId,
            note,
            changedBy
        });

        res.json(updatedReport);
    });

    /**
     * GET /api/last4 - Get last 4 hires per contractor
     */
    getLast4Hires = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.runId);
        console.log('Received runId:', runId);
        if (!runId) {
            throw AppError.badRequest('Run ID is required');
        }

        const runIdNum = parseInt(runId);
        if (isNaN(runIdNum)) {
            throw AppError.badRequest('Run ID must be a valid integer');
        }

        const hires = await this.reportService.getLast4Hires(runIdNum);
        res.json(hires);
    });

    /**
     * GET /api/report-notes/report/:reportId - Get notes for report
     */
    getNotesByReport = asyncHandler(async (req, res) => {
        const reportId = parseInt(req.params.reportId);
        if (isNaN(reportId)) {
            throw AppError.badRequest('Report ID must be a valid integer');
        }

        const notes = await this.reportService.getReportNotes(reportId);
        res.json(notes);
    });

    /**
     * GET /api/report-notes/employer/:employerId - Get notes for employer
     */
    getNotesByEmployer = asyncHandler(async (req, res) => {
        const { employerId } = req.params;

        if (!employerId) {
            throw AppError.badRequest('Employer ID is required');
        }

        const notes = await this.reportService.getEmployerNotes(employerId);
        res.json(notes);
    });
}
