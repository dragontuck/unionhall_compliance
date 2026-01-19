/**
 * ModeService - Business logic layer for Mode operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates mode-related business logic
 */

export class ModeService {
    constructor(modeRepository) {
        this.modeRepo = modeRepository;
    }

    /**
     * Get all available modes
     * @returns {Promise<Array>} List of modes
     */
    async getAllModes() {
        return this.modeRepo.getAllModes();
    }

    /**
     * Get mode by ID
     * @param {number} modeId - Mode ID
     * @returns {Promise<Object>} Mode data
     */
    async getModeById(modeId) {
        const mode = await this.modeRepo.getModeById(modeId);
        if (!mode) throw new Error(`Mode ${modeId} not found`);
        return mode;
    }

    /**
     * Validate mode exists
     * @param {number} modeId - Mode ID
     * @returns {Promise<boolean>} True if mode exists
     */
    async validateModeExists(modeId) {
        try {
            await this.getModeById(modeId);
            return true;
        } catch {
            return false;
        }
    }
}
