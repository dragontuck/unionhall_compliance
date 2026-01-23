/**
 * RunService - Business logic layer for Run operations
 * Follows Single Responsibility Principle (SRP)
 * Orchestrates run-related business logic using repositories
 */
import sql from 'mssql';
import XLSX from 'xlsx';

export class RunService {
    constructor(runRepository, modeRepository, reportRepository, reportDetailRepository, hireDataRepository, complianceEngine) {
        this.runRepo = runRepository;
        this.modeRepo = modeRepository;
        this.reportRepo = reportRepository;
        this.detailRepo = reportDetailRepository;
        this.hireDataRepo = hireDataRepository;
        this.complianceEngine = complianceEngine;
    }

    /**
     * Get all runs
     * @param {number} limit - Maximum runs to retrieve
     * @returns {Promise<Array>} List of runs
     */
    async getAllRuns(limit = 100) {
        return this.runRepo.getAllRuns(limit);
    }

    /**
     * Get run by ID
     * @param {number} runId - Run ID
     * @returns {Promise<Object>} Run data
     */
    async getRunById(runId) {
        const run = await this.runRepo.getRunById(runId);
        if (!run) throw new Error(`Run ${runId} not found`);
        return run;
    }

    /**
     * Create new compliance run
     * @param {Object} runData - Run creation data
     * @returns {Promise<{success: boolean, runId: number|null, message: string}>} Execution result
     */
    async createRun(runData) {
        const { modeId, reviewedDate, runNumber, dryRun } = runData;

        if (!modeId || !reviewedDate) {
            throw new Error('Mode ID and reviewed date are required');
        }

        const mode = await this.modeRepo.getModeById(modeId);
        if (!mode) throw new Error(`Mode ${modeId} not found`);

        const nextRunNumber = runNumber || await this.runRepo.getNextRunNumber(modeId, reviewedDate);

        return this.executeRun(modeId, nextRunNumber, reviewedDate, dryRun, mode.mode_value);
    }

    /**
     * Execute compliance run for a mode
     * @param {number} modeId - Mode ID
     * @param {number} nextRunNumber - Next run number
     * @param {Date} reviewedDate - Reviewed date
     * @param {boolean} dryRun - Dry run mode (no DB writes)
     * @param {number} allowedDirect - Allowed direct hires (2 for 2To1, 3 for 3To1)
     * @returns {Promise<{success: boolean, runId: number|null, message: string}>} Execution result
     */
    async executeRun(modeId, nextRunNumber, reviewedDate, dryRun, allowedDirect = 2) {
        try {
            console.log('Starting compliance run execution...');
            const tx = await this.runRepo.beginTransaction();

            try {
                console.log(`Next run number: ${nextRunNumber}`);

                // Insert run.
                const runInsertRes = await tx
                    .request()
                    .input('reviewed', sql.Date, reviewedDate)
                    .input('modeId', sql.Int, modeId)
                    .input('runNum', sql.Int, nextRunNumber)
                    .query(
                        `INSERT INTO dbo.CMP_Runs (ReportDate, ReviewedDate, ModeId, [Run])
                         OUTPUT INSERTED.id AS runId
                         VALUES (CAST(SYSDATETIME() AS date), @reviewed, @modeId, @runNum);`
                    );

                const runId = runInsertRes.recordset[0].runId;
                console.log(`Created new run with ID: ${runId}`);

                // Previous run.
                const prevRunRes = await tx
                    .request()
                    .input('reviewed', sql.Date, reviewedDate)
                    .query(
                        `SELECT TOP 1 id AS runId
                         FROM dbo.CMP_Runs
                         WHERE ReviewedDate < @reviewed
                         ORDER BY ReviewedDate DESC, id DESC;`
                    );

                const prevRunId = prevRunRes.recordset.length ? prevRunRes.recordset[0].runId : null;
                console.log(`Previous run ID: ${prevRunId || 'None'}`);

                // Contractor list for this run.
                const contractorsQuery = `
                    SELECT DISTINCT EmployerId, ContractorId, ContractorName
                    FROM dbo.CMP_HireData WHERE ReviewedDate >= @reviewed
                    UNION
                    SELECT DISTINCT EmployerId, ContractorId, ContractorName
                    FROM CMP_Reports WHERE RunId=@prevRunId;`;

                const contractorsRes = await tx
                    .request()
                    .input('reviewed', sql.Date, reviewedDate)
                    .input('prevRunId', sql.BigInt, prevRunId || 0)
                    .query(contractorsQuery);

                const contractors = contractorsRes.recordset;
                console.log(`Found ${contractors.length} contractors to process`);

                // Process each contractor.
                for (const c of contractors) {
                    const contractorId = c.ContractorId;
                    const contractorName = c.ContractorName;
                    const employerId = c.EmployerId;
                    console.log(`Processing contractor: ${contractorName} (ID: ${contractorId})`);

                    // Seed from previous run (report data).
                    let seed = null;
                    if (prevRunId) {
                        const seedRes = await tx
                            .request()
                            .input('prevRunId', sql.BigInt, prevRunId)
                            .input('employerId', sql.Int, employerId)
                            .input('contractorId', sql.Int, contractorId)
                            .query(
                                `SELECT TOP 1 ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch
                                 FROM dbo.CMP_Reports
                                 WHERE RunId = @prevRunId AND ContractorId = @contractorId AND EmployerId = @employerId;`
                            );
                        if (seedRes.recordset.length) seed = seedRes.recordset[0];
                    }
                    const state = this.complianceEngine.createComplianceState(seed, allowedDirect);

                    // Fetch hires to process for this run.
                    const hiresRes = await tx
                        .request()
                        .input('contractorId', sql.Int, contractorId)
                        .input('reviewed', sql.Date, reviewedDate)
                        .query(
                            `SELECT EmployerId, StartDate, ReviewedDate, MemberName, IANumber, HireType
                             FROM dbo.CMP_HireData
                             WHERE ContractorID = @contractorId
                               AND CAST(ReviewedDate AS DATE) = @reviewed
                             ORDER BY StartDate, ReviewedDate, IANumber;`
                        );

                    const hires = hiresRes.recordset;

                    if (hires.length) {
                        console.log(`Processing ${hires.length} hires for contractor ${contractorName}`);
                        for (const h of hires) {
                            console.log(`  Applying hire: ${h.MemberName} (${h.HireType}) - Start: ${h.StartDate}`);
                            this.complianceEngine.applyHire(state, h.HireType, allowedDirect);

                            if (!dryRun) {
                                await tx
                                    .request()
                                    .input('runId', sql.BigInt, runId)
                                    .input('employerId', sql.NVarChar(100), h.EmployerId)
                                    .input('contractorId', sql.Int, contractorId)
                                    .input('contractorName', sql.VarChar(255), contractorName)
                                    .input('memberName', sql.VarChar(255), h.MemberName)
                                    .input('iaNumber', sql.NVarChar(100), h.IANumber?.toString() || '')
                                    .input('startDate', sql.Date, h.StartDate)
                                    .input('hireType', sql.NVarChar(50), h.HireType)
                                    .input('complianceStatus', sql.VarChar(50), this.complianceEngine.codeToStatus(state.compliance))
                                    .input('directCount', sql.Int, state.directCount)
                                    .input('dispatchNeeded', sql.Int, state.dispatchNeeded)
                                    .input('nextHireDispatch', sql.VarChar(1), state.nextHireDispatch)
                                    .input('reviewedDate', sql.DateTimeOffset, h.ReviewedDate)
                                    .query(
                                        `INSERT INTO dbo.CMP_ReportDetails
                                         (RunId, EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType,
                                          ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate)
                                         VALUES
                                         (@runId, @employerId, @contractorId, @contractorName, @memberName, @iaNumber, @startDate, @hireType,
                                          @complianceStatus, @directCount, @dispatchNeeded, @nextHireDispatch, @reviewedDate);`
                                    );
                            }
                        }
                    }

                    // Insert report summary row.
                    console.log(`Final state for ${contractorName}: Status=${this.complianceEngine.codeToStatus(state.compliance)}, Direct=${state.directCount}, Dispatch=${state.dispatchNeeded}`);
                    if (!dryRun) {
                        await tx
                            .request()
                            .input('runId', sql.BigInt, runId)
                            .input('employerId', sql.NVarChar(100), employerId)
                            .input('contractorId', sql.Int, contractorId)
                            .input('contractorName', sql.VarChar(255), contractorName)
                            .input('complianceStatus', sql.VarChar(50), this.complianceEngine.codeToStatus(state.compliance))
                            .input('dispatchNeeded', sql.Int, state.dispatchNeeded)
                            .input('nextHireDispatch', sql.VarChar(1), state.nextHireDispatch)
                            .input('directCount', sql.Int, state.directCount)
                            .query(
                                `INSERT INTO dbo.CMP_Reports
                                 (RunId, EmployerId, ContractorId, ContractorName, ComplianceStatus, DispatchNeeded, NextHireDispatch, DirectCount)
                                 VALUES
                                 (@runId, @employerId, @contractorId, @contractorName, @complianceStatus, @dispatchNeeded, @nextHireDispatch, @directCount);`
                            );
                    }
                }

                if (dryRun) {
                    console.log('[dryRun] Completed processing logic. No DB writes performed.');
                    await this.runRepo.rollbackTransaction(tx);
                    return {
                        success: true,
                        runId: null,
                        message: 'Dry run completed successfully. No data was written.'
                    };
                }

                console.log('Committing transaction...');
                await this.runRepo.commitTransaction(tx);
                console.log('Transaction committed successfully');

                return {
                    success: true,
                    runId: runId,
                    message: `Run executed successfully with ID: ${runId}`
                };
            } catch (txErr) {
                console.error('Error during transaction execution:', txErr);
                await this.runRepo.rollbackTransaction(tx);
                return {
                    success: false,
                    runId: null,
                    message: `Error during transaction execution: ${txErr.message}`
                };
            }
        } catch (err) {
            console.error('Error during run execution:', err);
            return {
                success: false,
                runId: null,
                message: `Run execution failed: ${err.message}`
            };
        }
    }

    /**
     * Get run details for export
     * @param {number} runId - Run ID
     * @returns {Promise<Object>} Complete run data for export
     */
    async getRunForExport(runId) {
        const run = await this.runRepo.getRunById(runId);
        if (!run) throw new Error(`Run ${runId} not found`);

        const reports = await this.reportRepo.getReportsByRun(runId);
        const details = await this.detailRepo.getDetailsByRun(runId);
        const lastHires = await this.detailRepo.getLast4Hires(runId);
        const recentHires = await this.hireDataRepo.getRecentHires(runId);

        const wb = XLSX.utils.book_new();

        // Details sheet
        const detailsSheet = XLSX.utils.json_to_sheet(details);
        XLSX.utils.book_append_sheet(wb, detailsSheet, 'Detail');

        // Reports sheet
        const reportsSheet = XLSX.utils.json_to_sheet(reports);
        XLSX.utils.book_append_sheet(wb, reportsSheet, 'Report');

        // Last 4 sheet
        const last4Sheet = XLSX.utils.json_to_sheet(lastHires);
        XLSX.utils.book_append_sheet(wb, last4Sheet, 'Last 4');

        // Recent Hire sheet
        const recentHireSheet = XLSX.utils.json_to_sheet(recentHires);
        XLSX.utils.book_append_sheet(wb, recentHireSheet, 'Recent Hire');

        // Write to buffer
        const buffer = XLSX.write(wb, { type: 'buffer' });

        return buffer;
    }

}
