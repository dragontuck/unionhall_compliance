/**
 * RunRepository - Data access layer for Runs
 * Follows Single Responsibility Principle (SRP)
 * All run-related database operations are encapsulated here
 */
import { MssqlRepository } from '../MssqlRepository.js';

export class RunRepository extends MssqlRepository {
    constructor(pool) {
        super(pool);
    }

    /**
     * Get all runs with latest first
     * @param {number} limit - Maximum number of runs to return
     * @returns {Promise<Array>} Array of run records
     */
    async getAllRuns(limit = 100) {
        return this.query(`
            SELECT TOP ${limit} 
                r.id, 
                CONVERT(nvarchar, r.ReviewedDate, 25) as reviewedDate, 
                r.run, 
                m.Mode_Name as modeName 
            FROM CMP_Runs r 
            INNER JOIN CMP_Modes m ON r.ModeId = m.Id
            ORDER BY id DESC
        `);
    }

    /**
     * Get run by ID
     * @param {number} runId - Run ID
     * @returns {Promise<Object|null>} Run record or null
     */
    async getRunById(runId) {
        return this.queryOne(
            'SELECT * FROM CMP_Runs WHERE id = @id',
            { id: runId }
        );
    }

    /**
     * Get next run number for a mode
     * @param {number} modeId - Mode ID
     * @param {Date} reviewedDate - Reviewed date
     * @returns {Promise<number>} Next run number
     */
    async getNextRunNumber(modeId, reviewedDate) {
        const result = await this.queryScalar(
            `SELECT ISNULL(MAX(run), 0) + 1 
             FROM CMP_Runs 
             WHERE ModeId = @modeId AND CAST(ReviewedDate AS DATE) = CAST(@reviewedDate AS DATE)`,
            { modeId, reviewedDate }
        );
        return result || 1;
    }

    /**
     * Create new run
     * @param {Object} runData - Run data
     * @returns {Promise<number>} New run ID
     */
    async createRun(runData) {
        const { modeId, reviewedDate, runNumber, output } = runData;

        const result = await this.query(`
            INSERT INTO CMP_Runs (ModeId, ReviewedDate, run, Output)
            VALUES (@modeId, @reviewedDate, @runNumber, @output);
            SELECT SCOPE_IDENTITY() as id;
        `, {
            modeId,
            reviewedDate,
            runNumber,
            output: output || ''
        });

        return result[0]?.id;
    }

    /**
     * Get previous run for a mode and date
     * @param {number} modeId - Mode ID
     * @param {Date} reviewedDate - Reviewed date
     * @returns {Promise<Object|null>} Previous run or null
     */
    async getPreviousRun(modeId, reviewedDate) {
        return this.queryOne(`
            SELECT TOP 1 id, ModeId, ReviewedDate, run
            FROM CMP_Runs
            WHERE ModeId = @modeId AND ReviewedDate < @reviewedDate
            ORDER BY ReviewedDate DESC
        `, { modeId, reviewedDate });
    }

    /**
     * Begin transaction
     * @returns {Promise<Object>} Transaction object
     */
    async beginTransaction() {
        return super.beginTransaction();
    }

    /**
     * Commit transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<void>}
     */
    async commitTransaction(transaction) {
        return super.commitTransaction(transaction);
    }

    /**
     * Rollback transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<void>}
     */
    async rollbackTransaction(transaction) {
        return super.rollbackTransaction(transaction);
    }
}
