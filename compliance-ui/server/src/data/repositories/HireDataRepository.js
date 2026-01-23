/**
 * HireDataRepository - Data access layer for Hire Data
 * Follows Single Responsibility Principle (SRP)
 * All hire data database operations are encapsulated here
 */
import { MssqlRepository } from '../MssqlRepository.js';

export class HireDataRepository extends MssqlRepository {
    constructor(pool) {
        super(pool);
    }

    /**
     * Get raw hire data with optional filters
     * @param {Object} filters - Filter options { reviewedDate }
     * @param {number} limit - Maximum number of records
     * @returns {Promise<Array>} Array of hire records
     */
    async getHireData(filters = {}, limit = 2000) {
        let query = `SELECT TOP ${limit} * FROM CMP_HireData WHERE 1=1`;
        const params = {};

        if (filters.reviewedDate) {
            query += ' AND ReviewedDate <= @reviewedDate';
            params.reviewedDate = filters.reviewedDate;
        }

        query += ' ORDER BY ContractorName, StartDate, MemberName';
        return this.query(query, params);
    }

    /**
     * Get recent hires from latest reviewed date
     * @param {number} runId - Run ID (for reference)
     * @returns {Promise<Array>} Recent hire records
     */
    async getRecentHires(runId) {
        return this.query(`
            SELECT 
                employerId, 
                ContractorID AS contractorId, 
                contractorName, 
                memberName, 
                iaNumber, 
                startDate, 
                hireType, 
                CONVERT(nvarchar, ReviewedDate, 25) as reviewedDate 
            FROM dbo.CMP_HireData 
            WHERE CAST(ReviewedDate AS DATE) = (
                SELECT CAST(ReviewedDate AS DATE) AS ReviewedDate
                FROM dbo.CMP_Runs
                WHERE id = @runId
            ) 
            ORDER BY StartDate, ReviewedDate, ContractorName
        `, { runId });
    }

    /**
     * Get hires for a specific contractor and date
     * @param {number} contractorId - Contractor ID
     * @param {Date} reviewedDate - Reviewed date
     * @returns {Promise<Array>} Hire records for contractor
     */
    async getHiresForContractor(contractorId, reviewedDate) {
        return this.query(`
            SELECT 
                EmployerId, 
                StartDate, 
                ReviewedDate, 
                MemberName, 
                IANumber, 
                HireType
            FROM dbo.CMP_HireData
            WHERE ContractorID = @contractorId AND ReviewedDate >= @reviewedDate
            ORDER BY StartDate, ReviewedDate, IANumber
        `, { contractorId, reviewedDate });
    }

    /**
     * Insert reviewed hire record
     * @param {Object} hireData - Hire data to insert
     * @returns {Promise<number>} Rows affected
     */
    async createReviewedHire(hireData) {
        const {
            employerId, contractorName, memberName, iaNumber, startDate, hireType,
            isReviewed, isExcluded, endDate, contractorId, isInactive, reviewedDate,
            excludedComplianceRules, createdByUserName, createdByName, createdOn
        } = hireData;

        return this.execute(`
            INSERT INTO dbo.CMP_ReviewedHires
            (EmployerID, ContractorName, MemberName, IANumber, StartDate, HireType, 
             IsReviewed, IsExcluded, EndDate, ContractorID, IsInactive, ReviewedDate,
             ExcludedComplianceRules, CreatedByUserName, CreatedByName, CreatedOn)
            SELECT
                @employerId, @contractorName, @memberName, @iaNumber, 
                CONVERT(DATETIME2(0), @startDate, 101), @hireType, @isReviewed, @isExcluded,
                CASE WHEN @endDate IS NULL OR @endDate = '' THEN NULL 
                     ELSE CONVERT(DATETIME2(0), @endDate, 101) END,
                @contractorId, @isInactive,
                CASE WHEN @reviewedDate IS NULL OR @reviewedDate = '' THEN NULL 
                     ELSE TRY_CONVERT(DATETIMEOFFSET(7), @reviewedDate) END,
                @excludedComplianceRules, @createdByUserName, @createdByName,
                CONVERT(DATETIME2(0), @createdOn, 101)
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.CMP_ReviewedHires 
                WHERE EmployerID = @employerId AND IANumber = @iaNumber 
                AND StartDate = CONVERT(DATETIME2(0), @startDate, 101)
            )
        `, {
            employerId,
            contractorName: contractorName || null,
            memberName: memberName || null,
            iaNumber,
            startDate,
            hireType: hireType || null,
            isReviewed,
            isExcluded: isExcluded || null,
            endDate: endDate || null,
            contractorId,
            isInactive,
            reviewedDate: reviewedDate || null,
            excludedComplianceRules: excludedComplianceRules || null,
            createdByUserName: createdByUserName || null,
            createdByName: createdByName || null,
            createdOn
        });
    }
}
