/**
 * ContractorSnapshotRepository - Data access layer for Contractor Snapshot
 * Follows Single Responsibility Principle (SRP)
 * All contractor snapshot database operations are encapsulated here
 */
import { MssqlRepository } from '../MssqlRepository.js';

export class ContractorSnapshotRepository extends MssqlRepository {
    constructor(pool) {
        super(pool);
    }

    /**
     * Get all contractor snapshots
     * @param {number} limit - Maximum number of records
     * @returns {Promise<Array>} Array of contractor snapshot records
     */
    async getContractorSnapshots(limit = 2000) {
        return this.query(`SELECT TOP ${limit} * FROM CMP_ContractorSnapshot ORDER BY ContractorID`, {});
    }

    /**
     * Get contractor snapshots for a specific snapshot date
     * @param {Date} snapshotDate - Snapshot date
     * @returns {Promise<Array>} Contractor snapshots for the date
     */
    async getContractorSnapshotsByDate(snapshotDate) {
        return this.query(`
            SELECT * FROM CMP_ContractorSnapshot 
            WHERE CONVERT(date, SnapshotWed) = CONVERT(date, @snapshotDate)
            ORDER BY ContractorID
        `, { snapshotDate });
    }

    /**
     * Get most recent snapshot record by contractor ID
     * @param {string} contractorId - Contractor ID
     * @returns {Promise<Object|null>} Most recent snapshot record or null
     */
    async getMostRecentSnapshotByContractorId(contractorId, runDate) {
        const results = await this.query(`
            SELECT TOP 1 * FROM CMP_ContractorSnapshot 
            WHERE ContractorID = @contractorId and SnapshotWed <= @runDate
            ORDER BY SnapshotWed DESC
        `, { contractorId, runDate });
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Insert contractor snapshot record
     * @param {Object} snapshotData - Contractor snapshot data to insert
     * @returns {Promise<number>} Rows affected
     */
    async createContractorSnapshot(snapshotData) {
        const {
            contractorId, contractorName, lastWedReported, snapshotWed, companyType,
            lastHireDate, journeypersons, isInactive
        } = snapshotData;

        return this.execute(`
            INSERT INTO dbo.CMP_ContractorSnapshot
            (ContractorID, ContractorName, LastWedReported, SnapshotWed, CompanyType,
             LastHireDate, Journeypersons, IsInactive)
            SELECT
                @contractorId, @contractorName,
                CASE WHEN @lastWedReported IS NULL OR @lastWedReported = '' THEN NULL 
                     ELSE CONVERT(DATETIME2(0), @lastWedReported, 101) END,
                CONVERT(DATETIME2(0), @snapshotWed, 101),
                @companyType,
                CASE WHEN @lastHireDate IS NULL OR @lastHireDate = '' THEN NULL 
                     ELSE CONVERT(DATETIME2(0), @lastHireDate, 101) END,
                @journeypersons,
                @isInactive
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.CMP_ContractorSnapshot 
                WHERE ContractorID = @contractorId 
                AND CONVERT(date, SnapshotWed) = CONVERT(date, @snapshotWed)
            )
        `, {
            contractorId,
            contractorName: contractorName || null,
            lastWedReported: lastWedReported || null,
            snapshotWed,
            companyType: companyType || null,
            lastHireDate: lastHireDate || null,
            journeypersons: journeypersons || null,
            isInactive
        });
    }

}
