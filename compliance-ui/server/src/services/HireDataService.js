/**
 * HireDataService - Business logic layer for Hire Data operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates hire data business logic
 */

export class HireDataService {
    constructor(hireDataRepository) {
        this.hireRepo = hireDataRepository;
        this.hireNoteRepo = hireNoteRepository; // Make sure hireNoteRepository is passed to the constructor
    }

    /**
     * Get hire data with optional filters
     * @param {Object} filters - Filter criteria
     * @param {number} limit - Maximum records
     * @returns {Promise<Array>} Hire data
     */
    async getHireData(filters = {}, limit = 2000) {
        return this.hireRepo.getHireData(filters, limit);
    }

    /**
     * Get recent hires
     * @param {number} runId - Run ID (for reference)
     * @returns {Promise<Array>} Recent hire records
     */
    async getRecentHires(runId) {
        return this.hireRepo.getRecentHires(runId);
    }

    /**
     * Get hires for specific contractor
     * @param {number} contractorId - Contractor ID
     * @param {Date} reviewedDate - Reviewed date
     * @returns {Promise<Array>} Contractor hires
     */
    async getHiresForContractor(contractorId, reviewedDate) {
        if (!contractorId || !reviewedDate) {
            throw new Error('Contractor ID and reviewed date are required');
        }
        return this.hireRepo.getHiresForContractor(contractorId, reviewedDate);
    }

    /**
     * Import reviewed hire records
     * @param {Array} rows - CSV parsed rows
     * @param {Object} converters - Data converter functions { toInt, toBool, toDate }
     * @returns {Promise<Object>} Import result { successCount, failCount, errors }
     */
    async importHires(rows, converters = {}) {
        const { toInt, toBool, toDate } = converters;
        const result = { successCount: 0, failCount: 0, errors: [] };

        if (!Array.isArray(rows)) {
            throw new Error('Rows must be an array');
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const hireData = {
                    employerId: row['Employer ID'],
                    contractorName: row['Contractor Name'] || null,
                    memberName: row['Member Name'] || null,
                    iaNumber: toInt(row['IA Number']),
                    startDate: toDate(row['Start Date']),
                    hireType: row['Hire Type'] || null,
                    isReviewed: toBool(row['Is Reviewed']),
                    isExcluded: toBool(row['Is Excluded']) || null,
                    endDate: toDate(row['End Date']),
                    contractorId: toInt(row['Contractor ID']),
                    isInactive: toBool(row['Is Inactive']),
                    reviewedDate: toDate(row['Reviewed Date']),
                    excludedComplianceRules: row['Excluded Compliance Rules'] || null,
                    createdByUserName: row['Created By User Name'] || null,
                    createdByName: row['Created By Name'] || null,
                    createdOn: toDate(row['Created on']),
                    listPosition: toInt(row['List Position at Dispatch']) || null,
                };

                await this.hireRepo.createReviewedHire(hireData);
                result.successCount++;
            } catch (error) {
                result.failCount++;
                result.errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        return result;
    }

    /**
     * Get hire notes for a specific hire
     * @param {number} hireId - Hire ID
     * @returns {Promise<Array>} Array of hire note records
     */
    async getHireNotes(hireId) {
        if (!hireId) {
            throw new Error('Hire ID is required');
        }
        return this.hireNoteRepo.getNotesByHire(hireId);
    }

    async createNote(noteData) {
        const { hireId } = noteData;
        if (!hireId) {
            throw new Error('Hire ID is required');
        }
        return this.hireNoteRepo.createNote(noteData);
    }
}
