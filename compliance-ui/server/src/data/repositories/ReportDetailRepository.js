/**
 * ReportDetailRepository - Data access layer for Report Details
 * Follows Single Responsibility Principle (SRP)
 * All report detail database operations are encapsulated here
 */

export class ReportDetailRepository {
    constructor(repository) {
        this.repo = repository;
    }

    /**
     * Get report details with optional filters
     * @param {Object} filters - Filter options { runId, contractorId, contractorName, employerId }
     * @param {number} limit - Maximum number of records
     * @returns {Promise<Array>} Array of detail records
     */
    async getReportDetails(filters = {}, limit = 1000) {
        let query = `SELECT TOP ${limit} * FROM CMP_ReportDetails WHERE 1=1`;
        const params = {};

        if (filters.runId) {
            query += ' AND RunId = @runId';
            params.runId = filters.runId;
        }
        if (filters.contractorId) {
            query += ' AND ContractorID = @contractorId';
            params.contractorId = filters.contractorId;
        }
        if (filters.contractorName) {
            query += ' AND ContractorName LIKE @contractorName';
            params.contractorName = `%${filters.contractorName}%`;
        }
        if (filters.employerId) {
            query += ' AND EmployerID = @employerId';
            params.employerId = filters.employerId;
        }

        query += ' ORDER BY id DESC';
        return this.repo.query(query, params);
    }

    /**
     * Get report details by run ID with mode info
     * @param {number} runId - Run ID
     * @returns {Promise<Array>} Report details with mode data
     */
    async getDetailsByRun(runId) {
        return this.repo.query(`
            SELECT 
                d.employerId, 
                d.contractorId, 
                d.contractorName, 
                d.memberName, 
                d.iaNumber, 
                d.startDate, 
                d.hireType, 
                d.complianceStatus, 
                d.directCount, 
                d.dispatchNeeded, 
                d.nextHireDispatch, 
                CONVERT(nvarchar, d.reviewedDate, 25) as reviewedDate, 
                m.Mode_Name as modeName 
            FROM dbo.CMP_ReportDetails d
            INNER JOIN dbo.CMP_Runs r ON d.RunId = r.Id
            INNER JOIN CMP_Modes m ON r.ModeId = m.Id
            WHERE RunId IN (
                SELECT MAX(id) as Id 
                FROM dbo.CMP_Runs 
                GROUP BY ReviewedDate 
                HAVING MAX(id) <= @runId
            )
            ORDER BY contractorName, reviewedDate, startDate, iaNumber
        `, { runId });
    }

    /**
     * Insert report detail entry
     * @param {Object} detailData - Detail data to insert
     * @returns {Promise<number>} Rows affected
     */
    async createDetail(detailData) {
        const {
            runId, employerId, contractorId, contractorName, memberName,
            iaNumber, startDate, hireType, complianceStatus, directCount,
            dispatchNeeded, nextHireDispatch, reviewedDate
        } = detailData;

        return this.repo.execute(`
            INSERT INTO dbo.CMP_ReportDetails
            (RunId, EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType,
             ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate)
            VALUES
            (@runId, @employerId, @contractorId, @contractorName, @memberName, @iaNumber, @startDate, @hireType,
             @complianceStatus, @directCount, @dispatchNeeded, @nextHireDispatch, @reviewedDate)
        `, {
            runId,
            employerId,
            contractorId,
            contractorName,
            memberName,
            iaNumber: iaNumber.toString(),
            startDate,
            hireType,
            complianceStatus,
            directCount,
            dispatchNeeded,
            nextHireDispatch,
            reviewedDate
        });
    }

    /**
     * Get last 4 hires per contractor for a run
     * @param {number} runId - Run ID
     * @returns {Promise<Array>} Last 4 hires per contractor
     */
    async getLast4Hires(runId) {
        return this.repo.query(`
            WITH Contractors AS (
                SELECT DISTINCT EmployerId, ContractorId FROM dbo.CMP_Reports WHERE RunId = @runId
            ), 
            Detail AS (
                SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, 
                       ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate 
                FROM dbo.CMP_ReportDetails 
                WHERE RunId IN (
                    SELECT MAX(id) as Id FROM dbo.CMP_Runs 
                    GROUP BY ReviewedDate 
                    HAVING MAX(id) <= @runId
                )
            ),
            Ranked AS (
                SELECT h.EmployerId, h.ContractorID AS ContractorId, h.ContractorName, h.MemberName, 
                       h.IANumber, h.StartDate, h.HireType, h.ComplianceStatus, h.DirectCount, 
                       h.DispatchNeeded, h.NextHireDispatch, h.ReviewedDate, 
                       ROW_NUMBER() OVER (PARTITION BY h.EmployerId, h.ContractorID 
                                         ORDER BY h.ReviewedDate DESC, h.StartDate DESC, h.IANumber DESC) AS rn 
                FROM Detail h JOIN Contractors c 
                ON c.EmployerId = h.EmployerId AND c.ContractorId = h.ContractorID
            ) 
            SELECT employerId, contractorId, contractorName, memberName, iaNumber, startDate, hireType, 
                   complianceStatus, directCount, dispatchNeeded, nextHireDispatch, 
                   CONVERT(nvarchar, ReviewedDate, 25) as reviewedDate, RN as [Order #]
            FROM Ranked 
            WHERE rn <= 4 
            ORDER BY ContractorName, ReviewedDate ASC, StartDate ASC
        `, { runId });
    }
}
