import sql from 'mssql';
import { parseArgs, assertIsoDate, normalizeMode, dbConfigFromEnv } from '../../compliance-runner/src/utils.js';
import { statusToCode, codeToStatus, applyHire, createComplianceState } from '../../compliance-runner/src/compliance-engine.js';
import { generateExcelReport } from '../../compliance-runner/src/excel-export.js';

/**
 * Runs the compliance logic as a service, executing the main compliance-runner logic.
 * @param {Object} options - Options for the run.
 * @param {string} options.mode - The compliance mode to run (e.g., '3To1').
 * @param {string} options.reviewedDate - The reviewed date to use.
 * @param {boolean} [options.dryRun] - Whether to run in dry-run mode.
 * @param {Object} [options.dbConfig] - Database configuration overrides.
 * @returns {Promise<{ runId: number, output: string, error?: string }>} - The result of the run.
 */
export async function runCompliance({ mode, reviewedDate, dryRun, dbConfig }) {
    let output = '';
    let runId = null;
    try {
        console.log(`[ComplianceService] Starting runCompliance with mode=${mode}, reviewedDate=${reviewedDate}, dryRun=${dryRun}, dbConfig=${dbConfig ? 'provided' : 'env'}`);
        assertIsoDate(reviewedDate);
        const modeName = normalizeMode(mode);
        output += `Processing new run - Date: ${reviewedDate}, Mode: ${modeName}\n`;

        const cfg = dbConfig || dbConfigFromEnv();
        output += 'Connecting to database...\n';
        console.log('[ComplianceService] Connecting to database...');
        let pool = sql.connect(cfg);
        // If pool is a Promise, await it
        if (typeof pool.then === 'function') {
            pool = await pool;
        }
        output += 'Database connection established\n';
        console.log('[ComplianceService] Database connection established');

        // Resolve mode.
        const modeRes = await pool
            .request()
            .input('mode', sql.NVarChar(10), modeName)
            .query('SELECT TOP 1 id AS modeId, mode_value AS modeValue FROM dbo.CMP_Modes WHERE mode_name = @mode');
        if (!modeRes.recordset.length) {
            console.error(`[ComplianceService] Mode not found in dbo.CMP_Modes: ${modeName}`);
            throw new Error(`Mode not found in dbo.CMP_Modes: ${modeName}`);
        }
        const { modeId, modeValue } = modeRes.recordset[0];
        const allowedDirect = Number(modeValue);
        output += `Mode resolved - ID: ${modeId}, Value: ${modeValue}, Allowed Direct: ${allowedDirect}\n`;
        if (!Number.isFinite(allowedDirect) || allowedDirect < 1) {
            console.error(`[ComplianceService] Invalid mode_value for ${modeName}: ${modeValue}`);
            throw new Error(`Invalid mode_value for ${modeName}: ${modeValue}`);
        }

        const tx = new sql.Transaction(pool);
        output += 'Starting database transaction...\n';
        console.log('[ComplianceService] Starting database transaction...');
        await tx.begin();
        try {
            // Next run number.
            const nextRunRes = await tx
                .request()
                .input('modeId', sql.Int, modeId)
                .input('reviewed', sql.Date, reviewedDate)
                .query('SELECT ISNULL(MAX([Run]), 0) + 1 AS nextRun FROM dbo.CMP_Runs WHERE ModeId = @modeId and ReviewedDate = @reviewed');
            const runNum = nextRunRes.recordset[0].nextRun;
            output += `Next run number: ${runNum}\n`;
            console.log(`[ComplianceService] Next run number: ${runNum}`);

            // Insert run.
            const runInsertRes = await tx
                .request()
                .input('reviewed', sql.Date, reviewedDate)
                .input('modeId', sql.Int, modeId)
                .input('runNum', sql.Int, runNum)
                .query(
                    `INSERT INTO dbo.CMP_Runs (ReportDate, ReviewedDate, ModeId, [Run])
                     OUTPUT INSERTED.id AS runId
                     VALUES (CAST(SYSDATETIME() AS date), @reviewed, @modeId, @runNum);`
                );
            runId = runInsertRes.recordset[0].runId;
            output += `Created new run with ID: ${runId}\n`;
            console.log(`[ComplianceService] Created new run with ID: ${runId}`);

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
            output += `Previous run ID: ${prevRunId || 'None'}\n`;
            console.log(`[ComplianceService] Previous run ID: ${prevRunId || 'None'}`);

            // Contractor list for this run.
            let contractorsQuery = `
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
            output += `Found ${contractors.length} contractors to process\n`;
            console.log(`[ComplianceService] Found ${contractors.length} contractors to process`);

            for (const c of contractors) {
                const contractorId = c.ContractorId;
                const contractorName = c.ContractorName;
                const employerId = c.EmployerId;
                output += `Processing contractor: ${contractorName} (ID: ${contractorId})\n`;
                console.log(`[ComplianceService] Processing contractor: ${contractorName} (ID: ${contractorId})`);

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
                const state = createComplianceState(seed, allowedDirect);

                // Fetch hires to process for this run.
                const hiresRes = await tx
                    .request()
                    .input('contractorId', sql.Int, contractorId)
                    .input('reviewed', sql.Date, reviewedDate)
                    .query(
                        `SELECT EmployerId, StartDate, ReviewedDate, MemberName, IANumber, HireType
                         FROM dbo.CMP_HireData
                         WHERE ContractorID = @contractorId
                           AND ReviewedDate >= @reviewed
                         ORDER BY StartDate, ReviewedDate, IANumber;`
                    );
                const hires = hiresRes.recordset;

                if (hires.length) {
                    output += `Processing ${hires.length} hires for contractor ${contractorName}\n`;
                    console.log(`[ComplianceService] Processing ${hires.length} hires for contractor ${contractorName}`);
                    for (const h of hires) {
                        output += `  Applying hire: ${h.MemberName} (${h.HireType}) - Start: ${h.StartDate}\n`;
                        console.log(`[ComplianceService] Applying hire: ${h.MemberName} (${h.HireType}) - Start: ${h.StartDate}`);
                        applyHire(state, h.HireType, allowedDirect);

                        if (!dryRun) {
                            await tx
                                .request()
                                .input('runId', sql.BigInt, runId)
                                .input('employerId', sql.NVarChar(100), h.EmployerId)
                                .input('contractorId', sql.Int, contractorId)
                                .input('contractorName', sql.VarChar(255), contractorName)
                                .input('memberName', sql.VarChar(255), h.MemberName)
                                .input('iaNumber', sql.NVarChar(100), h.IANumber.toString())
                                .input('startDate', sql.Date, h.StartDate)
                                .input('hireType', sql.NVarChar(50), h.HireType)
                                .input('complianceStatus', sql.VarChar(50), codeToStatus(state.compliance))
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
                output += `Final state for ${contractorName}: Status=${codeToStatus(state.compliance)}, Direct=${state.directCount}, Dispatch=${state.dispatchNeeded}\n`;
                console.log(`[ComplianceService] Final state for ${contractorName}: Status=${codeToStatus(state.compliance)}, Direct=${state.directCount}, Dispatch=${state.dispatchNeeded}`);
                if (!dryRun) {
                    await tx
                        .request()
                        .input('runId', sql.BigInt, runId)
                        .input('employerId', sql.NVarChar(100), employerId)
                        .input('contractorId', sql.Int, contractorId)
                        .input('contractorName', sql.VarChar(255), contractorName)
                        .input('complianceStatus', sql.VarChar(50), codeToStatus(state.compliance))
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
                output += '[dryRun] Completed processing logic. No DB writes performed.\n';
                console.log('[ComplianceService] Dry run completed, rolling back transaction.');
                await tx.rollback();
                return { runId, output };
            }

            output += 'Committing transaction...\n';
            console.log('[ComplianceService] Committing transaction...');
            await tx.commit();
            output += 'Transaction committed successfully\n';
            console.log('[ComplianceService] Transaction committed successfully');
            output += `Run created: RunId=${runId} Mode=${modeName} ReviewedDate=${reviewedDate} RunNumber=${runNum}\n`;
            console.log(`[ComplianceService] Run created: RunId=${runId} Mode=${modeName} ReviewedDate=${reviewedDate} RunNumber=${runNum}`);
        } catch (e) {
            output += `Error during transaction, rolling back: ${e.message}\n`;
            console.error(`[ComplianceService] Error during transaction, rolling back: ${e.message}`);
            try {
                await tx.rollback();
                output += 'Transaction rolled back\n';
                console.log('[ComplianceService] Transaction rolled back');
            } catch (_) {
                output += 'Failed to rollback transaction\n';
                console.error('[ComplianceService] Failed to rollback transaction');
            }
            throw e;
        } finally {
            output += 'Closing database connection...\n';
            await pool.close();
            output += 'Database connection closed\n';
            console.log('[ComplianceService] Database connection closed');
        }
    } catch (err) {
        console.error(`[ComplianceService] Fatal error: ${err.message}`);
        return { runId, output, error: err.message };
    }
    console.log('[ComplianceService] runCompliance completed successfully');
    return { runId, output };
}
