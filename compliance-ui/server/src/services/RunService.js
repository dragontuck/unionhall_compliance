/**
 * RunService - Business logic layer for Run operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates run-related business logic using repositories
 */

export class RunService {
    constructor(runRepository, modeRepository, reportRepository, reportDetailRepository) {
        this.runRepo = runRepository;
        this.modeRepo = modeRepository;
        this.reportRepo = reportRepository;
        this.detailRepo = reportDetailRepository;
    }

    /**
     * Get all runs
     * @param {number} limit - Maximum runs to retrieve
     * @returns {Promise<Array>} List of runs
     */
    async getAllRuns(limit = 100) {
        return this.runRepo.getAllRuns(limit);
    }

    /**
     * Get run by ID
     * @param {number} runId - Run ID
     * @returns {Promise<Object>} Run data
     */
    async getRunById(runId) {
        const run = await this.runRepo.getRunById(runId);
        if (!run) throw new Error(`Run ${runId} not found`);
        return run;
    }

    /**
     * Create new compliance run
     * @param {Object} runData - Run creation data
     * @returns {Promise<number>} New run ID
     */
    async createRun(runData) {
        const { modeId, reviewedDate, runNumber } = runData;

        if (!modeId || !reviewedDate) {
            throw new Error('Mode ID and reviewed date are required');
        }

        const mode = await this.modeRepo.getModeById(modeId);
        if (!mode) throw new Error(`Mode ${modeId} not found`);

        const nextRunNumber = runNumber || await this.runRepo.getNextRunNumber(modeId, reviewedDate);

        const newRunId = await this.runRepo.createRun({
            modeId,
            reviewedDate,
            runNumber: nextRunNumber,
            output: ''
        });

        return newRunId;
    }

    /**
     * Get run details for export
     * @param {number} runId - Run ID
     * @returns {Promise<Object>} Complete run data for export
     */
    async getRunForExport(runId) {
        const run = await this.runRepo.getRunById(runId);
        if (!run) throw new Error(`Run ${runId} not found`);

        const reports = await this.reportRepo.getReportsByRun(runId);
        const details = await this.detailRepo.getDetailsByRun(runId);

        return {
            run,
            reports,
            details
        };
    }
}
