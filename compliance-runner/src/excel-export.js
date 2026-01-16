const ExcelJS = require('exceljs');
const sql = require('mssql');

async function addSheetFromRows(workbook, name, rows) {
  const ws = workbook.addWorksheet(name);
  const cols = rows && rows.length ? Object.keys(rows[0]) : [];
  ws.columns = cols.map((k) => ({ header: k, key: k, width: Math.max(12, k.length + 2) }));
  if (rows && rows.length) {
    rows.forEach((r) => ws.addRow(r));
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

async function generateExcelReport(pool, runId, outFile) {
  console.log(`[ExcelExport] Starting generateExcelReport for runId=${runId}, outFile=${outFile}`);
  // Validate pool object
  if (!pool || typeof pool.request !== 'function' || pool.connected === false) {
    throw new Error('[ExcelExport] Invalid or disconnected database pool object');
  }
  // Ensure runId is a BigInt for mssql input validation
  let runIdNum;
  if (typeof runId === 'bigint') {
    runIdNum = runId;
  } else if (typeof runId === 'number' && Number.isFinite(runId)) {
    runIdNum = BigInt(runId);
  } else if (typeof runId === 'string' && /^\d+$/.test(runId)) {
    runIdNum = BigInt(runId);
  } else {
    throw new Error(`[ExcelExport] Invalid runId: ${runId}`);
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'cmp-run.js';
  workbook.created = new Date();

  console.log(`[ExcelExport] Execute Load runInfo for runId=${runIdNum}:`);
  const runInfo = (await pool.request().input('runId', sql.BigInt, runIdNum)
    .query('SELECT r.ReviewedDate, r.ModeId, r.[Run], m.mode_name FROM dbo.CMP_Runs r JOIN dbo.CMP_Modes m ON r.ModeId = m.id WHERE r.id = @runId')).recordset[0];
  console.log(`[ExcelExport] Loaded runInfo:`, runInfo);

  const detailRows = (await pool.request().input('runId', sql.BigInt, runIdNum)
    .query(`SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, convert(nvarchar, ReviewedDate, 25) as ReviewedDate FROM dbo.CMP_ReportDetails 
      WHERE RunId IN (select max(id) as Id from dbo.CMP_Runs group by ReviewedDate having Max(id) <= @runId)
      ORDER BY ContractorName, ReviewedDate, StartDate, IANumber`)).recordset;
  console.log(`[ExcelExport] Loaded detailRows: count=${detailRows.length}`);

  const reportRows = (await pool.request().input('runId', sql.BigInt, runIdNum)
    .query(`SELECT r.ReportDate, rep.EmployerId, rep.ContractorId, rep.ContractorName, rep.ComplianceStatus, rep.DispatchNeeded, rep.NextHireDispatch FROM dbo.CMP_Reports rep JOIN dbo.CMP_Runs r ON rep.RunId = r.id JOIN dbo.CMP_Modes m ON r.ModeId = m.id WHERE rep.RunId = @runId ORDER BY rep.ContractorName`)).recordset;
  console.log(`[ExcelExport] Loaded reportRows: count=${reportRows.length}`);

  const last4Rows = (await pool.request().input('runId', sql.BigInt, runIdNum)
    .query(`WITH Contractors AS (
	SELECT DISTINCT EmployerId, ContractorId FROM dbo.CMP_Reports WHERE RunId = @runId
  ), 
  Detail AS (
  SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate 
  FROM dbo.CMP_ReportDetails 
  WHERE RunId IN 
  (select max(id) as Id from dbo.CMP_Runs group by ReviewedDate having Max(id) <= @runId)
  ),
  Ranked AS (
    SELECT h.EmployerId, h.ContractorID AS ContractorId, h.ContractorName, h.MemberName, h.IANumber, h.StartDate, h.HireType,h.ComplianceStatus, h.DirectCount, h.DispatchNeeded, h.NextHireDispatch, h.ReviewedDate, ROW_NUMBER() OVER (PARTITION BY h.EmployerId, h.ContractorID ORDER BY h.ReviewedDate DESC, h.StartDate DESC, h.IANumber  DESC) AS rn 
    FROM Detail h JOIN Contractors c 
    ON c.EmployerId = h.EmployerId AND c.ContractorId = h.ContractorID
  ) 
  SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, convert(nvarchar, ReviewedDate, 25) as ReviewedDate, RN as [Order #] FROM Ranked WHERE rn <= 4 ORDER BY ContractorName, ReviewedDate ASC, StartDate ASC
    `)).recordset;
  console.log(`[ExcelExport] Loaded last4Rows: count=${last4Rows.length}`);

  const recentHireRows = (await pool.request()
    .query(`SELECT EmployerId, ContractorID AS ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, convert(nvarchar, ReviewedDate, 25) as ReviewedDate FROM dbo.CMP_HireData WHERE ReviewedDate >=  (
        SELECT CAST(MAX(ReviewedDate) AS date) AS MaxReviewedDate
        FROM dbo.CMP_HireData
      ) ORDER BY StartDate, ReviewedDate, ContractorName`)).recordset;
  console.log(`[ExcelExport] Loaded recentHireRows: count=${recentHireRows.length}`);

  await addSheetFromRows(workbook, 'Detail', detailRows);
  await addSheetFromRows(workbook, 'Report', reportRows);
  await addSheetFromRows(workbook, 'Last 4', last4Rows);
  await addSheetFromRows(workbook, 'Recent Hire', recentHireRows);
  console.log('[ExcelExport] Sheets added to workbook');

  await workbook.xlsx.writeFile(outFile);
  console.log(`[ExcelExport] Excel file written: ${outFile}`);
  return { runInfo, outFile };
}

module.exports = { addSheetFromRows, generateExcelReport };