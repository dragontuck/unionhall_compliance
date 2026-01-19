/**
 * ReportNoteRepository - Data access layer for Report Notes
 * Follows Single Responsibility Principle (SRP)
 * All report note database operations are encapsulated here
 */

export class ReportNoteRepository {
    constructor(repository) {
        this.repo = repository;
    }

    /**
     * Get notes for a specific report
     * @param {number} reportId - Report ID
     * @returns {Promise<Array>} Array of note records
     */
    async getNotesByReport(reportId) {
        return this.repo.query(`
            SELECT 
                note, 
                CONVERT(nvarchar, createdDate, 25) as createdDate, 
                createdBy, 
                CONVERT(nvarchar, r.ReviewedDate, 25) as reviewedDate  
            FROM CMP_ReportNotes n
            INNER JOIN CMP_Reports rep ON rep.Id = n.ReportId
            INNER JOIN CMP_Runs r ON r.id = rep.runId 
            WHERE n.ReportId = @reportId
            ORDER BY CreatedDate
        `, { reportId });
    }

    /**
     * Get notes for a specific employer
     * @param {string} employerId - Employer ID
     * @returns {Promise<Array>} Array of note records
     */
    async getNotesByEmployer(employerId) {
        return this.repo.query(`
            SELECT 
                note, 
                CONVERT(nvarchar, createdDate, 25) as createdDate, 
                createdBy, 
                CONVERT(nvarchar, r.ReviewedDate, 25) as reviewedDate  
            FROM CMP_ReportNotes n
            INNER JOIN CMP_Reports rep ON rep.Id = n.ReportId
            INNER JOIN CMP_Runs r ON r.id = rep.runId 
            WHERE n.EmployerId = @employerId
            ORDER BY CreatedDate
        `, { employerId });
    }

    /**
     * Create a new note
     * @param {Object} noteData - Note data
     * @returns {Promise<number>} Rows affected
     */
    async createNote(noteData) {
        const { reportId, employerId, note, changedBy } = noteData;

        return this.repo.execute(`
            INSERT INTO CMP_ReportNotes (ReportId, EmployerId, Note, CreatedBy) 
            VALUES (@reportId, @employerId, @note, @changedBy)
        `, {
            reportId,
            employerId,
            note,
            changedBy
        });
    }
}
