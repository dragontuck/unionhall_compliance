#!/usr/bin/env node
/*
  CMP compliance runner
  - Inputs: --reviewedDate YYYY-MM-DD, --mode 2To1|3To1
  - Reviewed Date for the Union Hall is typically a wednesday for the prior week (note current implementation does >= Start Date)
  - Creates a run record in dbo.CMP_Runs
  - Uses dbo.CMP_Reports / dbo.CMP_ReportDetails from the most recent prior run (Reviewed < current) as the "starting point".
  - Processes hires from dbo.CMP_HireData with ReviewedDate >= current reviewedDate.
  - If a contractor has no new hires this run, duplicates the contractor's last prior detail row into the current run
    (RunId updated; ReviewedDate set to the run reviewedDate; ReportDate set to current time).
  - Writes dbo.CMP_ReportDetails + dbo.CMP_Reports rows for the run.
  - Exports an Excel workbook with tabs: detail, report, last 4, recent hire.

  Connection is configured via env vars:
    CMP_DB_SERVER, CMP_DB_DATABASE, CMP_DB_USER, CMP_DB_PASSWORD
    Optional: CMP_DB_PORT, CMP_DB_ENCRYPT (true/false), CMP_DB_TRUST_CERT (true/false)

  Usage:
    node cmp-run.js --reviewedDate 2025-11-16 --mode 2To1
*/

const sql = require('mssql');
const { parseArgs, assertIsoDate, normalizeMode, dbConfigFromEnv } = require('./src/utils');
const { statusToCode, codeToStatus, applyHire, createComplianceState } = require('./src/compliance-engine');
const { addSheetFromRows, generateExcelReport } = require('./src/excel-export');

async function main() {
  const args = parseArgs(process.argv);
  //  console.log('Args:', args);
  if (args.runId) {
    const cfg = dbConfigFromEnv();
    const pool = await sql.connect(cfg);
    try {
      const outFile = args.outFile || `CMP_Report_RunId${args.runId}.xlsx`;
      const { runInfo } = await generateExcelReport(pool, args.runId, outFile);
      console.log(`Excel report regenerated for RunId=${args.runId}: ${outFile}`);
    } finally {
      await pool.close();
    }
    return;
  }

  if (!args.reviewedDate || !args.mode) {
    console.error('Usage: node cmp-run.js --reviewedDate YYYY-MM-DD --mode 2To1|3To1 [--out file.xlsx] [--dryRun]\n       node cmp-run.js --runId <id> [--out file.xlsx]');
    process.exit(2);
  }
  assertIsoDate(args.reviewedDate);
  const modeName = normalizeMode(args.mode);

  const cfg = dbConfigFromEnv();
  const pool = await sql.connect(cfg);

  try {
    // Resolve mode.
    const modeRes = await pool
      .request()
      .input('mode', sql.NVarChar(10), modeName)
      .query('SELECT TOP 1 id AS modeId, mode_value AS modeValue FROM dbo.CMP_Modes WHERE mode_name = @mode');
    if (!modeRes.recordset.length) {
      throw new Error(`Mode not found in dbo.CMP_Modes: ${modeName}`);
    }
    const { modeId, modeValue } = modeRes.recordset[0];
    const allowedDirect = Number(modeValue);
    if (!Number.isFinite(allowedDirect) || allowedDirect < 1) {
      throw new Error(`Invalid mode_value for ${modeName}: ${modeValue}`);
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      // Next run number.
      const nextRunRes = await tx
        .request()
        .input('modeId', sql.Int, modeId)
        .input('reviewed', sql.Date, args.reviewedDate)
        .query('SELECT ISNULL(MAX([Run]), 0) + 1 AS nextRun FROM dbo.CMP_Runs WHERE ModeId = @modeId and ReviewedDate = @reviewed');
      const runNum = nextRunRes.recordset[0].nextRun;

      // Insert run.
      const runInsertRes = await tx
        .request()
        .input('reviewed', sql.Date, args.reviewedDate)
        .input('modeId', sql.Int, modeId)
        .input('runNum', sql.Int, runNum)
        .query(
          `INSERT INTO dbo.CMP_Runs (ReportDate, ReviewedDate, ModeId, [Run])
           OUTPUT INSERTED.id AS runId
           VALUES (CAST(SYSDATETIME() AS date), @reviewed, @modeId, @runNum);`
        );
      const runId = runInsertRes.recordset[0].runId;

      // Previous run.
      const prevRunRes = await tx
        .request()
        .input('reviewed', sql.Date, args.reviewedDate)
        .query(
          `SELECT TOP 1 id AS runId
           FROM dbo.CMP_Runs
           WHERE ReviewedDate < @reviewed
           ORDER BY ReviewedDate DESC, id DESC;`
        );
      const prevRunId = prevRunRes.recordset.length ? prevRunRes.recordset[0].runId : null;

      // Contractor list for this run.
      let contractorsQuery;
      contractorsQuery = `
          SELECT DISTINCT EmployerId, ContractorId, ContractorName
          FROM dbo.CMP_HireData;`;

      const contractorsRes = await tx
        .request()
        .query(contractorsQuery);
      const contractors = contractorsRes.recordset;

      // Process each contractor.
      for (const c of contractors) {
        const contractorId = c.ContractorId;
        const contractorName = c.ContractorName;
        const employerId = c.EmployerId;

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
          .input('reviewed', sql.Date, args.reviewedDate)
          .query(
            `SELECT EmployerId, StartDate, ReviewedDate, MemberName, IANumber, HireType
             FROM dbo.CMP_HireData
             WHERE ContractorID = @contractorId
               AND ReviewedDate >= @reviewed
             ORDER BY StartDate, ReviewedDate, IANumber;`
          );
        const hires = hiresRes.recordset;

        if (hires.length) {
          console.log('hire data:', hires);
          for (const h of hires) {
            applyHire(state, h.HireType, allowedDirect);
            wroteAnyDetail = true;

            if (!args.dryRun) {
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
        if (!args.dryRun) {
          await tx
            .request()
            .input('runId', sql.BigInt, runId)
            .input('employerId', sql.NVarChar(100), employerId)
            .input('contractorId', sql.Int, contractorId)
            .input('contractorName', sql.VarChar(255), contractorName)
            .input('complianceStatus', sql.VarChar(50), codeToStatus(state.compliance))
            .input('dispatchNeeded', sql.Int, state.dispatchNeeded)
            .input('nextHireDispatch', sql.VarChar(1), state.nextHireDispatch)
            .query(
              `INSERT INTO dbo.CMP_Reports
                 (RunId, EmployerId, ContractorId, ContractorName, ComplianceStatus, DispatchNeeded, NextHireDispatch)
               VALUES
                 (@runId, @employerId, @contractorId, @contractorName, @complianceStatus, @dispatchNeeded, @nextHireDispatch);`
            );
        }
      }

      if (args.dryRun) {
        console.log('[dryRun] Completed processing logic. No DB writes performed.');
        await tx.rollback();
        return;
      }

      await tx.commit();

      const outFile = args.outFile || `CMP_${modeName}_${args.reviewedDate.replace(/-/g, '')}_run${runNum}.xlsx`;
      await generateExcelReport(pool, runId, outFile);

      console.log(`Run created: RunId=${runId} Mode=${modeName} ReviewedDate=${args.reviewedDate} RunNumber=${runNum}`);
      console.log(`Excel exported: ${outFile}`);
    } catch (e) {
      try {
        await tx.rollback();
      } catch (_) {
        // ignore
      }
      throw e;
    }
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
