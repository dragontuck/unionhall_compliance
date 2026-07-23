/**
 * HireNoteRepository - Data access layer for Hire Notes
 * Follows Single Responsibility Principle (SRP)
 * All hire note database operations are encapsulated here
 */
import { MssqlRepository } from '../MssqlRepository.js';

export class HireNoteRepository extends MssqlRepository {
    constructor(pool) {
        super(pool);
    }

    /**
     * Get notes for a specific hire
     * @param {number} hireId - Hire ID
     * @returns {Promise<Array>} Array of note records
     */
    async getNotesByHire(hireId) {
        return this.query(`
            SELECT 
                note, 
                CONVERT(nvarchar, createdDate, 25) as createdDate, 
                createdBy, 
                h.MemberName as memberName,
                n.ReviewedDate as reviewedDate
            FROM CMP_HireNotes n
            INNER JOIN CMP_ReviewedHires h ON h.Id = n.HireId
            WHERE n.HireId = @hireId
            ORDER BY n.CreatedDate
        `, { hireId });
    }


    /**
     * Create a new note
     * @param {Object} noteData - Note data
     * @returns {Promise<number>} Rows affected
     */
    async createNote(noteData) {
        const { hireId, newReviewedDate, note, changedBy } = noteData;

        return this.execute(`
            INSERT INTO CMP_HireNotes (HireId, ReviewedDate, Note, CreatedBy) 
            VALUES (@hireId, @newReviewedDate, @note, @changedBy)
        `, {
            hireId,
            newReviewedDate,
            note,
            changedBy
        });
    }
}
