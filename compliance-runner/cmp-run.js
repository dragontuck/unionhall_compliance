#!/usr/bin/env node
/*
  CMP compliance runner
  - Inputs: --startDate YYYY-MM-DD, --mode 2To1|3To1
  - Creates a run record in dbo.CMP_Runs
  - Uses dbo.CMP_Reports / dbo.CMP_ReportDetails from the most recent prior run (StartDate < current) as the "starting point".
  - Processes hires from dbo.CMP_HireData with StartDate >= current startDate.
  - If a contractor has no new hires this run, duplicates the contractor's last prior detail row into the current run
    (RunId updated; StartDate set to the run StartDate; ReviewedDate set to current time).
  - Writes dbo.CMP_ReportDetails + dbo.CMP_Reports rows for the run.
  - Exports an Excel workbook with tabs: detail, report, last 4, recent hire.

  Connection is configured via env vars:
    CMP_DB_SERVER, CMP_DB_DATABASE, CMP_DB_USER, CMP_DB_PASSWORD
    Optional: CMP_DB_PORT, CMP_DB_ENCRYPT (true/false), CMP_DB_TRUST_CERT (true/false)

  Usage:
    node cmp-run.js --startDate 2025-11-16 --mode 2To1
*/

const sql = require('mssql');
const ExcelJS = require('exceljs');

function parseArgs(argv) {
  const out = { startDate: null, mode: null, outFile: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dryRun') out.dryRun = true;
    else if (a.startsWith('--startDate=')) out.startDate = a.split('=')[1];
    else if (a === '--startDate') out.startDate = argv[++i];
    else if (a.startsWith('--mode=')) out.mode = a.split('=')[1];
    else if (a === '--mode') out.mode = argv[++i];
    else if (a.startsWith('--out=')) out.outFile = a.split('=')[1];
    else if (a === '--out') out.outFile = argv[++i];
  }
  return out;
}

function assertIsoDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`startDate must be YYYY-MM-DD (got: ${d})`);
  }
}

function normalizeMode(m) {
  const v = String(m || '').trim();
  if (!v) throw new Error('mode is required (2To1 or 3To1)');
  const normalized = v.toLowerCase();
  if (normalized === '2to1' || normalized === '2to1'.toLowerCase()) return '2To1';
  if (normalized === '3to1' || normalized === '3to1'.toLowerCase()) return '3To1';
  // Accept "2" or "3" as shorthand.
  if (normalized === '2') return '2To1';
  if (normalized === '3') return '3To1';
  throw new Error(`mode must be 2To1 or 3To1 (got: ${m})`);
}

function dbConfigFromEnv() {
  const server = process.env.CMP_DB_SERVER;
  const database = process.env.CMP_DB_DATABASE;
  const user = process.env.CMP_DB_USER;
  const password = process.env.CMP_DB_PASSWORD;
  if (!server || !database || !user || !password) {
    throw new Error(
      'Missing DB env vars. Required: CMP_DB_SERVER, CMP_DB_DATABASE, CMP_DB_USER, CMP_DB_PASSWORD'
    );
  }
  const port = process.env.CMP_DB_PORT ? Number(process.env.CMP_DB_PORT) : undefined;
  const encrypt = String(process.env.CMP_DB_ENCRYPT || 'true').toLowerCase() === 'true';
  const trustServerCertificate =
    String(process.env.CMP_DB_TRUST_CERT || 'false').toLowerCase() === 'true';

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  };
}

function statusToCode(s) {
  const v = String(s || '').toLowerCase();
  if (v.startsWith('non')) return 'N';
  return 'C';
}

function codeToStatus(c) {
  return c === 'N' ? 'Noncompliant' : 'Compliant';
}

/**
 * Compliance state update.
 * - allowedDirect = 2 for 2To1, 3 for 3To1
 */
function applyHire(state, hireType, allowedDirect) {
  const h = String(hireType || '').trim();
  if (h.toLowerCase() === 'dispatch') {
    if (state.compliance === 'C' || (state.compliance === 'N' && state.dispatchNeeded === 1)) {
      state.dispatchNeeded = 0;
      state.directCount = 0;
      state.compliance = 'C';
    } else {
      state.dispatchNeeded = Math.max(0, state.dispatchNeeded - 1);
      state.directCount = Math.max(0, state.directCount - 1);
      // compliance remains N until cleared by the "dispatchNeeded===1" path above.
    }
  } else {
    state.directCount += 1;
    if (state.compliance === 'C' && state.directCount === allowedDirect + 1) {
      state.compliance = 'N';
      state.dispatchNeeded = 1;
    } else if (state.directCount > allowedDirect + 1) {
      state.compliance = 'N';
      state.dispatchNeeded += 1;
    }
  }

  // NextHireDispatch: "Y" if at/over the direct threshold OR if any dispatch is owed.
  state.nextHireDispatch = state.dispatchNeeded > 0 || state.directCount >= allowedDirect ? 'Y' : 'N';
  return state;
}

async function addSheetFromRows(workbook, name, rows) {
  const ws = workbook.addWorksheet(name);
  const cols = rows && rows.length ? Object.keys(rows[0]) : [];
  ws.columns = cols.map((k) => ({ header: k, key: k, width: Math.max(12, k.length + 2) }));
  if (rows && rows.length) {
    rows.forEach((r) => ws.addRow(r));
    // Auto-fit-ish: measure string lengths.
    for (const c of ws.columns) {
      let maxLen = c.header.length;
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const v = row.getCell(c.key).value;
        const s = v === null || v === undefined ? '' : String(v);
        maxLen = Math.max(maxLen, s.length);
      });
      c.width = Math.min(60, Math.max(12, maxLen + 2));
    }
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.getRow(1).font = { bold: true };
  }
  return ws;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.startDate || !args.mode) {
    console.error('Usage: node cmp-run.js --startDate YYYY-MM-DD --mode 2To1|3To1 [--out file.xlsx] [--dryRun]');
    process.exit(2);
  }
  assertIsoDate(args.startDate);
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
        .input('start', sql.Date, args.startDate)
        .query('SELECT ISNULL(MAX([Run]), 0) + 1 AS nextRun FROM dbo.CMP_Runs WHERE ModeId = @modeId and StartDate = @start');
      const runNum = nextRunRes.recordset[0].nextRun;

      // Insert run.
      const runInsertRes = await tx
        .request()
        .input('startDate', sql.Date, args.startDate)
        .input('modeId', sql.Int, modeId)
        .input('runNum', sql.Int, runNum)
        .query(
          `INSERT INTO dbo.CMP_Runs (ReportDate, StartDate, ModeId, [Run])
           OUTPUT INSERTED.id AS runId
           VALUES (CAST(SYSDATETIME() AS date), @startDate, @modeId, @runNum);`
        );
      const runId = runInsertRes.recordset[0].runId;

      // Previous run.
      const prevRunRes = await tx
        .request()
        .input('startDate', sql.Date, args.startDate)
        .query(
          `SELECT TOP 1 id AS runId
           FROM dbo.CMP_Runs
           WHERE StartDate < @startDate
           ORDER BY StartDate DESC, id DESC;`
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
        const state = {
          compliance: seed ? statusToCode(seed.ComplianceStatus) : 'C',
          dispatchNeeded: seed && seed.DispatchNeeded != null ? Number(seed.DispatchNeeded) : 0,
          directCount: seed && seed.DirectCount != null ? Number(seed.DirectCount) : 0,
          nextHireDispatch: seed && seed.NextHireDispatch ? String(seed.NextHireDispatch) : 'N',
        };
        // Ensure consistent nextHireDispatch at start.
        state.nextHireDispatch = state.dispatchNeeded > 0 || state.directCount >= allowedDirect ? 'Y' : 'N';

        // Fetch hires to process for this run.
        const hiresRes = await tx
          .request()
          .input('contractorId', sql.Int, contractorId)
          .input('startDate', sql.Date, args.startDate)
          .query(
            `SELECT EmployerId, StartDate, ReviewedDate, MemberName, IANumber, HireType
             FROM dbo.CMP_HireData
             WHERE ContractorID = @contractorId
               AND StartDate >= @startDate
             ORDER BY ReviewedDate, StartDate, IANumber;`
          );
        const hires = hiresRes.recordset;

        if (hires.length) {
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
                .input('iaNumber', sql.NVarChar(100), h.IANumber)
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

      // Export to Excel (post-commit).
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'cmp-run.js';
      workbook.created = new Date();

      //get recent run history for the current mode
      const runHistory = (
        await pool
          .request()
          .input('modeId', sql.Int, modeId)
          .query(
            `;WITH OrderedRuns AS (
                SELECT
                    r.*,
                    CASE
                        WHEN LAG(r.ModeId) OVER (ORDER BY r.id) = r.ModeId THEN 0
                        ELSE 1
                    END AS ModeChanged
                FROM dbo.CMP_Runs r
            ),
            Segmented AS (
                SELECT
                    r.*,
                    SUM(r.ModeChanged) OVER (ORDER BY r.id ROWS UNBOUNDED PRECEDING) AS ModeSegment
                FROM OrderedRuns r
            ),
            LatestSegment AS (
                SELECT
                    MAX(ModeSegment) AS LatestSegment,
                    MAX([Run]) AS MaxRun
                FROM Segmented
                WHERE ModeId = @ModeId
            )
            select Max(id) as id, StartDate, ModeId
            from (
            SELECT s.id, s.StartDate, s.ModeId
            /*    s.ModeId,
                ls.MaxRun,
                s.id,
                s.[Run],
                s.c,
                s.CreatedOn*/
            FROM Segmented s
            CROSS JOIN LatestSegment ls
            where s.ModeId = @modeId
            AND s.ModeSegment = ls.LatestSegment) q
            group by q.StartDate, q.ModeId;`
          )
      ).recordset;

      const runIds = [...new Set(runHistory.map(r => r.id).filter(Boolean))];

      let detailRows = [];
      if (runIds.length) {
        const req = pool.request();

        // Build a safe IN list with parameters
        const inParams = runIds.map((id, i) => {
          const p = `runId${i}`;
          req.input(p, sql.BigInt, id);
          return `@${p}`;
        }).join(',');

        detailRows = (await req.query(`
          SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType,
                ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate, RunId
          FROM dbo.CMP_ReportDetails
          WHERE RunId IN (${inParams})
          ORDER BY RunId, ContractorName, ReviewedDate, StartDate;
        `)).recordset;
      }

      // const detailRows = (
      //   await pool
      //     .request()
      //     .input('runId', sql.BigInt, runId)
      //     .query(
      //       `SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType,
      //               ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate
      //        FROM dbo.CMP_ReportDetails
      //        WHERE RunId = @runId
      //        ORDER BY ContractorName, ReviewedDate, StartDate;`
      //     )
      // ).recordset;
      await addSheetFromRows(workbook, 'detail', detailRows);

      const reportRows = (
        await pool
          .request()
          .input('runId', sql.BigInt, runId)
          .query(
            `SELECT r.ReportDate,
                    r.StartDate AS RunStartDate,
                    m.mode_name AS Mode,
                    r.[Run] AS RunNumber,
                    rep.EmployerId,
                    rep.ContractorId,
                    rep.ContractorName,
                    rep.ComplianceStatus,
                    rep.DispatchNeeded,
                    rep.NextHireDispatch
             FROM dbo.CMP_Reports rep
             JOIN dbo.CMP_Runs r ON rep.RunId = r.id
             JOIN dbo.CMP_Modes m ON r.ModeId = m.id
             WHERE rep.RunId = @runId
             ORDER BY rep.ContractorName;`
          )
      ).recordset;
      await addSheetFromRows(workbook, 'report', reportRows);

      const last4Rows = (
        await pool
          .request()
          .input('runId', sql.BigInt, runId)
          .query(
            `WITH Contractors AS (
               SELECT DISTINCT EmployerId, ContractorId
               FROM dbo.CMP_Reports
               WHERE RunId = @runId
             ), Ranked AS (
               SELECT h.EmployerId,
                      h.ContractorID AS ContractorId,
                      h.ContractorName,
                      h.MemberName,
                      h.IANumber,
                      h.StartDate,
                      h.HireType,
                      h.ReviewedDate,
                      ROW_NUMBER() OVER (
                        PARTITION BY h.EmployerId, h.ContractorID
                        ORDER BY h.ReviewedDate DESC, h.StartDate DESC, h.IANumber DESC
                      ) AS rn
               FROM dbo.CMP_HireData h
               JOIN Contractors c
                 ON c.EmployerId = h.EmployerId
                AND c.ContractorId = h.ContractorID
             )
             SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ReviewedDate
             FROM Ranked
             WHERE rn <= 4
             ORDER BY ContractorName, ReviewedDate ASC, StartDate ASC;`
          )
      ).recordset;
      await addSheetFromRows(workbook, 'last 4', last4Rows);

      const recentHireRows = (
        await pool
          .request()
          .input('startDate', sql.Date, args.startDate)
          .query(
            `SELECT EmployerId,
                    ContractorID AS ContractorId,
                    ContractorName,
                    MemberName,
                    IANumber,
                    StartDate,
                    HireType,
                    ReviewedDate
             FROM dbo.CMP_HireData
             WHERE StartDate >= @startDate
             ORDER BY StartDate, ReviewedDate, ContractorName;`
          )
      ).recordset;
      await addSheetFromRows(workbook, 'Recent Hire', recentHireRows);

      const outFile =
        args.outFile || `CMP_${modeName}_${args.startDate.replace(/-/g, '')}_run${runNum}.xlsx`;
      await workbook.xlsx.writeFile(outFile);

      console.log(`Run created: RunId=${runId} Mode=${modeName} StartDate=${args.startDate} RunNumber=${runNum}`);
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
