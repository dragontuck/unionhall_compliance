/**
 * ContractorSnapshotService - Business logic layer for Contractor Snapshot operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates contractor snapshot business logic
 */

export class ContractorSnapshotService {
    constructor(contractorSnapshotRepository) {
        this.contractorSnapshotRepo = contractorSnapshotRepository;
    }

    /**
     * Get all contractor snapshots
     * @param {number} limit - Maximum records
     * @returns {Promise<Array>} Contractor snapshot records
     */
    async getContractorSnapshots(limit = 2000) {
        return this.contractorSnapshotRepo.getContractorSnapshots(limit);
    }

    /**
     * Get contractor snapshots for a specific date
     * @param {Date} snapshotDate - Snapshot date
     * @returns {Promise<Array>} Contractor snapshot records
     */
    async getContractorSnapshotsByDate(snapshotDate) {
        if (!snapshotDate) {
            throw new Error('Snapshot date is required');
        }
        return this.contractorSnapshotRepo.getContractorSnapshotsByDate(snapshotDate);
    }

    /**
     * Import contractor snapshot records
     * @param {Array} rows - CSV parsed rows
     * @param {Object} converters - Data converter functions { toInt, toBool, toDate }
     * @returns {Promise<Object>} Import result { successCount, failCount, errors }
     */
    async importContractorSnapshots(rows, converters = {}) {
        const { toInt, toBool, toDate } = converters;
        const result = { successCount: 0, failCount: 0, errors: [] };

        if (!Array.isArray(rows)) {
            throw new Error('Rows must be an array');
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Pad contractor ID to 6 characters with leading zeros
                const rawContractorId = String(row['Contractor ID'] || '').trim();
                const contractorId = rawContractorId.padStart(6, '0');

                const snapshotData = {
                    contractorId,
                    contractorName: row['Contractor Name'] || null,
                    lastWedReported: toDate(row['Last WED Reported ']),
                    snapshotWed: toDate(row['Snapshot WED']),
                    companyType: row['Company Type'] || null,
                    lastHireDate: toDate(row['Last Hire Date']),
                    journeypersons: toInt(row['Journeypersons']),
                    isInactive: toBool(row['Is Inactive'])
                };

                await this.contractorSnapshotRepo.createContractorSnapshot(snapshotData);
                result.successCount++;
            } catch (error) {
                result.failCount++;
                result.errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        return result;
    }
}
