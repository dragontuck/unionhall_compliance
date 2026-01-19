/**
 * ReportService - Business logic layer for Report operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates report-related business logic using repositories
 */

export class ReportService {
    constructor(reportRepository, reportDetailRepository, reportNoteRepository) {
        this.reportRepo = reportRepository;
        this.detailRepo = reportDetailRepository;
        this.noteRepo = reportNoteRepository;
    }

    /**
     * Get all reports with optional filtering
     * @param {Object} filters - Filter criteria
     * @param {number} limit - Maximum records
     * @returns {Promise<Array>} Filtered reports
     */
    async getReports(filters = {}, limit = 500) {
        return this.reportRepo.getReports(filters, limit);
    }

    /**
     * Get reports for a run
     * @param {number} runId - Run ID
     * @returns {Promise<Array>} Reports with summary data
     */
    async getReportsByRun(runId) {
        return this.reportRepo.getReportsByRun(runId);
    }

    /**
     * Get report by ID
     * @param {number} reportId - Report ID
     * @returns {Promise<Object>} Report data with notes count
     */
    async getReportById(reportId) {
        const report = await this.reportRepo.getReportById(reportId);
        if (!report) throw new Error(`Report ${reportId} not found`);
        return report;
    }

    /**
     * Update report status and metrics
     * @param {number} reportId - Report ID
     * @param {Object} updateData - Data to update { status, directCount, dispatchNeeded, nextHireDispatch, employerId, note, changedBy }
     * @returns {Promise<Object>} Updated report
     */
    async updateReport(reportId, updateData) {
        const { status, directCount, dispatchNeeded, nextHireDispatch, employerId, note, changedBy } = updateData;

        if (status === undefined || directCount === undefined) {
            throw new Error('Status and direct count are required');
        }

        // Update the report
        await this.reportRepo.updateReport({
            reportId,
            status,
            directCount,
            dispatchNeeded: dispatchNeeded || 0,
            nextHireDispatch: nextHireDispatch || 'N'
        });

        // Add note if provided
        if (note && changedBy) {
            await this.noteRepo.createNote({
                reportId,
                employerId,
                note,
                changedBy
            });
        }

        // Return updated report
        return this.reportRepo.getReportById(reportId);
    }

    /**
     * Get report details
     * @param {number} runId - Run ID
     * @returns {Promise<Array>} Last 4 hires per contractor
     */
    async getDetailsByRun(runId) {
        return this.detailRepo.getDetailsByRun(runId);
    }

    /**
     * Get last 4 hires for a run
     * @param {number} runId - Run ID
     * @returns {Promise<Array>} Last 4 hires per contractor
     */
    async getLast4Hires(runId) {
        return this.detailRepo.getLast4Hires(runId);
    }

    /**
     * Get notes for a report
     * @param {number} reportId - Report ID
     * @returns {Promise<Array>} Report notes
     */
    async getReportNotes(reportId) {
        return this.noteRepo.getNotesByReport(reportId);
    }

    /**
     * Get notes for an employer
     * @param {string} employerId - Employer ID
     * @returns {Promise<Array>} Employer notes
     */
    async getEmployerNotes(employerId) {
        return this.noteRepo.getNotesByEmployer(employerId);
    }
}
