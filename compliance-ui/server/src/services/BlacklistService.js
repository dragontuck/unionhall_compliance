/**
 * BlacklistService - Business logic layer for Contractor Blacklist operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates blacklist business logic
 */

export class BlacklistService {
    constructor(blacklistRepository) {
        this.blacklistRepo = blacklistRepository;
    }

    /**
     * Get all non-deleted blacklist records
     * @returns {Promise<Array>} Blacklist records
     */
    async getAll() {
        return this.blacklistRepo.getAll();
    }

    /**
     * Get all blacklist records including deleted ones
     * @returns {Promise<Array>} All blacklist records
     */
    async getAllIncludingDeleted() {
        return this.blacklistRepo.getAllIncludingDeleted();
    }

    /**
     * Get blacklist record by ID
     * @param {number} id - Blacklist record ID
     * @returns {Promise<Object>} Blacklist record
     */
    async getById(id) {
        const record = await this.blacklistRepo.getById(id);
        if (!record) {
            throw new Error(`Blacklist record ${id} not found`);
        }
        return record;
    }

    /**
     * Get blacklist records by employer ID
     * @param {string} employerId - Employer ID
     * @returns {Promise<Array>} Blacklist records for employer
     */
    async getByEmployerId(employerId) {
        if (!employerId) {
            throw new Error('Employer ID is required');
        }
        return this.blacklistRepo.getByEmployerId(employerId);
    }

    /**
     * Check if contractor is blacklisted
     * @param {string} employerId - Employer ID
     * @param {string} contractorName - Contractor name
     * @returns {Promise<boolean>} True if blacklisted
     */
    async isBlacklisted(employerId, contractorName) {
        if (!employerId || !contractorName) {
            throw new Error('Employer ID and contractor name are required');
        }
        return this.blacklistRepo.isBlacklisted(employerId, contractorName);
    }

    /**
     * Create new blacklist entry
     * @param {Object} data - Blacklist data { employerId, contractorName }
     * @returns {Promise<Object>} Created record
     */
    async create(data) {
        const { employerId, contractorName } = data;

        if (!employerId || !employerId.trim()) {
            throw new Error('Employer ID is required');
        }
        if (!contractorName || !contractorName.trim()) {
            throw new Error('Contractor name is required');
        }

        // Check if already exists
        const isBlacklisted = await this.blacklistRepo.isBlacklisted(employerId, contractorName);
        if (isBlacklisted) {
            throw new Error('This contractor is already blacklisted for this employer');
        }

        return this.blacklistRepo.create({
            employerId: employerId.trim(),
            contractorName: contractorName.trim()
        });
    }

    /**
     * Update blacklist entry
     * @param {number} id - Blacklist record ID
     * @param {Object} data - Data to update { contractorName }
     * @returns {Promise<Object>} Updated record
     */
    async update(id, data) {
        const { contractorName } = data;

        if (!id) {
            throw new Error('Blacklist ID is required');
        }
        if (!contractorName || !contractorName.trim()) {
            throw new Error('Contractor name is required');
        }

        const updated = await this.blacklistRepo.update(id, {
            contractorName: contractorName.trim()
        });

        if (!updated) {
            throw new Error(`Blacklist record ${id} not found or already deleted`);
        }

        return updated;
    }

    /**
     * Soft delete blacklist entry
     * @param {number} id - Blacklist record ID
     * @returns {Promise<Object>} Deleted record
     */
    async delete(id) {
        if (!id) {
            throw new Error('Blacklist ID is required');
        }

        const deleted = await this.blacklistRepo.delete(id);

        if (!deleted) {
            throw new Error(`Blacklist record ${id} not found or already deleted`);
        }

        return deleted;
    }
}
