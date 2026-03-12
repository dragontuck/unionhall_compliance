/**
 * BlacklistRepository - Data access layer for Contractor Blacklist
 * Follows Single Responsibility Principle (SRP)
 * All blacklist-related database operations are encapsulated here
 */
import { MssqlRepository } from '../MssqlRepository.js';

export class BlacklistRepository extends MssqlRepository {
    constructor(pool) {
        super(pool);
    }

    /**
     * Get all non-deleted blacklist records
     * @returns {Promise<Array>} Array of blacklist records
     */
    async getAll() {
        return this.query(`
            SELECT 
                [Id],
                [EmployerID],
                [ContractorName],
                [CreatedOn],
                [DeletedOn]
            FROM [dbo].[CMP_ContractorBlacklist]
            WHERE [DeletedOn] IS NULL
            ORDER BY [CreatedOn] DESC
        `);
    }

    /**
     * Get all blacklist records including deleted ones
     * @returns {Promise<Array>} Array of all blacklist records
     */
    async getAllIncludingDeleted() {
        return this.query(`
            SELECT 
                [Id],
                [EmployerID],
                [ContractorName],
                [CreatedOn],
                [DeletedOn]
            FROM [dbo].[CMP_ContractorBlacklist]
            ORDER BY [CreatedOn] DESC
        `);
    }

    /**
     * Get blacklist record by ID
     * @param {number} id - Blacklist record ID
     * @returns {Promise<Object|null>} Blacklist record or null
     */
    async getById(id) {
        return this.queryOne(`
            SELECT 
                [Id],
                [EmployerID],
                [ContractorName],
                [CreatedOn],
                [DeletedOn]
            FROM [dbo].[CMP_ContractorBlacklist]
            WHERE [Id] = @id
        `, { id });
    }

    /**
     * Get blacklist records by employer ID (non-deleted only)
     * @param {string} employerId - Employer ID
     * @returns {Promise<Array>} Array of blacklist records
     */
    async getByEmployerId(employerId) {
        return this.query(`
            SELECT 
                [Id],
                [EmployerID],
                [ContractorName],
                [CreatedOn],
                [DeletedOn]
            FROM [dbo].[CMP_ContractorBlacklist]
            WHERE [EmployerID] = @employerId AND [DeletedOn] IS NULL
            ORDER BY [CreatedOn] DESC
        `, { employerId });
    }

    /**
     * Check if contractor is blacklisted for employer
     * @param {string} employerId - Employer ID
     * @param {string} contractorName - Contractor name
     * @returns {Promise<boolean>} True if blacklisted
     */
    async isBlacklisted(employerId, contractorName) {
        const result = await this.queryOne(`
            SELECT COUNT(*) as cnt
            FROM [dbo].[CMP_ContractorBlacklist]
            WHERE [EmployerID] = @employerId 
              AND [ContractorName] = @contractorName
              AND [DeletedOn] IS NULL
        `, { employerId, contractorName });

        return result && result.cnt > 0;
    }

    /**
     * Create new blacklist entry
     * @param {Object} data - Blacklist data
     * @returns {Promise<Object>} Created record with ID
     */
    async create(data) {
        const { employerId, contractorName } = data;

        if (!employerId || !contractorName) {
            throw new Error('Employer ID and contractor name are required');
        }

        const result = await this.query(`
            INSERT INTO [dbo].[CMP_ContractorBlacklist]
            ([EmployerID], [ContractorName], [CreatedOn])
            OUTPUT INSERTED.[Id], INSERTED.[EmployerID], INSERTED.[ContractorName], INSERTED.[CreatedOn], INSERTED.[DeletedOn]
            VALUES (@employerId, @contractorName, SYSDATETIME())
        `, { employerId, contractorName });

        return result[0];
    }

    /**
     * Update blacklist entry
     * @param {number} id - Blacklist record ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object|null>} Updated record or null
     */
    async update(id, data) {
        const { contractorName } = data;

        if (!contractorName) {
            throw new Error('Contractor name is required');
        }

        const result = await this.query(`
            UPDATE [dbo].[CMP_ContractorBlacklist]
            SET [ContractorName] = @contractorName
            OUTPUT INSERTED.[Id], INSERTED.[EmployerID], INSERTED.[ContractorName], INSERTED.[CreatedOn], INSERTED.[DeletedOn]
            WHERE [Id] = @id AND [DeletedOn] IS NULL
        `, { id, contractorName });

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Soft delete blacklist entry
     * @param {number} id - Blacklist record ID
     * @returns {Promise<Object|null>} Updated record or null
     */
    async delete(id) {
        const result = await this.query(`
            UPDATE [dbo].[CMP_ContractorBlacklist]
            SET [DeletedOn] = SYSDATETIME()
            OUTPUT INSERTED.[Id], INSERTED.[EmployerID], INSERTED.[ContractorName], INSERTED.[CreatedOn], INSERTED.[DeletedOn]
            WHERE [Id] = @id AND [DeletedOn] IS NULL
        `, { id });

        return result.length > 0 ? result[0] : null;
    }
}
