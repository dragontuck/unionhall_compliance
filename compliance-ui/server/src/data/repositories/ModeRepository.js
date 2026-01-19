/**
 * ModeRepository - Data access layer for Modes
 * Follows Single Responsibility Principle (SRP)
 * All mode-related database operations are encapsulated here
 */

export class ModeRepository {
    constructor(repository) {
        this.repo = repository;
    }

    /**
     * Get all modes
     * @returns {Promise<Array>} Array of mode records
     */
    async getAllModes() {
        return this.repo.query('SELECT * FROM CMP_Modes ORDER BY id');
    }

    /**
     * Get mode by ID
     * @param {number} modeId - Mode ID
     * @returns {Promise<Object|null>} Mode record or null
     */
    async getModeById(modeId) {
        return this.repo.queryOne(
            'SELECT * FROM CMP_Modes WHERE id = @id',
            { id: modeId }
        );
    }

    /**
     * Get mode by name
     * @param {string} modeName - Mode name
     * @returns {Promise<Object|null>} Mode record or null
     */
    async getModeByName(modeName) {
        return this.repo.queryOne(
            'SELECT * FROM CMP_Modes WHERE Mode_Name = @modeName',
            { modeName }
        );
    }
}
