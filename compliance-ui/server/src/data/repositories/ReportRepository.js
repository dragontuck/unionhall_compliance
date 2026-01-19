/**
 * ReportRepository - Data access layer for Reports
 * Follows Single Responsibility Principle (SRP)
 * All report-related database operations are encapsulated here
 */

export class ReportRepository {
    constructor(repository) {
        this.repo = repository;
    }

    /**
     * Get all reports with optional filters
     * @param {Object} filters - Filter options { runId, contractorId, employerId }
     * @param {number} limit - Maximum number of records
     * @returns {Promise<Array>} Array of report records
     */
    async getReports(filters = {}, limit = 500) {
        let query = `SELECT TOP ${limit} * FROM CMP_Reports WHERE 1=1`;
        const params = {};

        if (filters.runId) {
            query += ' AND RunId = @runId';
            params.runId = filters.runId;
        }
        if (filters.contractorId) {
            query += ' AND ContractorID = @contractorId';
            params.contractorId = filters.contractorId;
        }
        if (filters.employerId) {
            query += ' AND EmployerID = @employerId';
            params.employerId = filters.employerId;
        }

        query += ' ORDER BY id DESC';
        return this.repo.query(query, params);
    }

    /**
     * Get reports by run ID with summary info
     * @param {number} runId - Run ID
     * @returns {Promise<Array>} Reports with summary data
     */
    async getReportsByRun(runId) {
        return this.repo.query(`
            SELECT 
                id, 
                runId, 
                employerId, 
                contractorId, 
                contractorName, 
                complianceStatus, 
                directCount, 
                dispatchNeeded, 
                nextHireDispatch,
                (SELECT COUNT(*) FROM CMP_ReportNotes 
                 WHERE CMP_ReportNotes.employerId = CMP_Reports.employerId) as noteCount
            FROM CMP_Reports 
            WHERE RunId = @runId 
            ORDER BY ContractorName
        `, { runId });
    }

    /**
     * Get report by ID
     * @param {number} reportId - Report ID
     * @returns {Promise<Object|null>} Report or null
     */
    async getReportById(reportId) {
        return this.repo.queryOne(
            `SELECT id, runId, employerId, contractorId, contractorName, complianceStatus, 
                    directCount, dispatchNeeded, nextHireDispatch,
                    (SELECT COUNT(*) FROM CMP_ReportNotes 
                     WHERE CMP_ReportNotes.employerId = CMP_Reports.employerId) as noteCount
             FROM CMP_Reports WHERE id = @id`,
            { id: reportId }
        );
    }

    /**
     * Update report status and metrics
     * @param {Object} reportData - Report update data
     * @returns {Promise<number>} Rows affected
     */
    async updateReport(reportData) {
        const { reportId, status, directCount, dispatchNeeded, nextHireDispatch } = reportData;

        return this.repo.execute(`
            UPDATE CMP_Reports 
            SET DirectCount = @directCount, 
                DispatchNeeded = @dispatchNeeded, 
                NextHireDispatch = @nextHireDispatch, 
                ComplianceStatus = @status
            WHERE Id = @reportId
        `, {
            reportId,
            status,
            directCount,
            dispatchNeeded,
            nextHireDispatch
        });
    }

    /**
     * Create report entry
     * @param {Object} reportData - Report data
     * @returns {Promise<number>} Number of rows inserted
     */
    async createReport(reportData) {
        const { runId, employerId, contractorId, contractorName, complianceStatus, dispatchNeeded, nextHireDispatch, directCount } = reportData;

        return this.repo.execute(`
            INSERT INTO CMP_Reports 
            (RunId, EmployerId, ContractorId, ContractorName, ComplianceStatus, DispatchNeeded, NextHireDispatch, DirectCount)
            VALUES 
            (@runId, @employerId, @contractorId, @contractorName, @complianceStatus, @dispatchNeeded, @nextHireDispatch, @directCount)
        `, {
            runId,
            employerId,
            contractorId,
            contractorName,
            complianceStatus,
            dispatchNeeded,
            nextHireDispatch,
            directCount
        });
    }

    /**
     * Get contractors for a run
     * @param {number} runId - Run ID
     * @param {Date} reviewedDate - Reviewed date for filtering
     * @param {number} prevRunId - Previous run ID for comparison
     * @returns {Promise<Array>} Array of contractors
     */
    async getContractorsForRun(runId, reviewedDate, prevRunId = null) {
        let query = `
            SELECT DISTINCT EmployerId, ContractorId, ContractorName
            FROM CMP_HireData 
            WHERE ReviewedDate >= @reviewedDate
        `;
        const params = { reviewedDate };

        if (prevRunId) {
            query += `
                UNION
                SELECT DISTINCT EmployerId, ContractorId, ContractorName
                FROM CMP_Reports WHERE RunId = @prevRunId
            `;
            params.prevRunId = prevRunId;
        }

        return this.repo.query(query, params);
    }
}
