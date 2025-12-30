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
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'cmp-run.js';
  workbook.created = new Date();

  const runInfo = (await pool.request().input('runId', sql.BigInt, runId)
    .query('SELECT r.StartDate, r.ModeId, r.[Run], m.mode_name FROM dbo.CMP_Runs r JOIN dbo.CMP_Modes m ON r.ModeId = m.id WHERE r.id = @runId')).recordset[0];

  const runHistory = (await pool.request().input('modeId', sql.Int, runInfo.ModeId)
    .query(`;WITH OrderedRuns AS (
        SELECT r.*, CASE WHEN LAG(r.ModeId) OVER (ORDER BY r.id) = r.ModeId THEN 0 ELSE 1 END AS ModeChanged
        FROM dbo.CMP_Runs r
      ), Segmented AS (
        SELECT r.*, SUM(r.ModeChanged) OVER (ORDER BY r.id ROWS UNBOUNDED PRECEDING) AS ModeSegment
        FROM OrderedRuns r
      ), LatestSegment AS (
        SELECT MAX(ModeSegment) AS LatestSegment FROM Segmented WHERE ModeId = @ModeId
      )
      SELECT Max(id) as id, StartDate, ModeId FROM (
        SELECT s.id, s.StartDate, s.ModeId FROM Segmented s CROSS JOIN LatestSegment ls
        WHERE s.ModeId = @modeId AND s.ModeSegment = ls.LatestSegment
      ) q GROUP BY q.StartDate, q.ModeId`)).recordset;

  const runIds = [...new Set(runHistory.map(r => r.id).filter(Boolean))];
  let detailRows = [];
  if (runIds.length) {
    const req = pool.request();
    const inParams = runIds.map((id, i) => {
      const p = `runId${i}`;
      req.input(p, sql.BigInt, id);
      return `@${p}`;
    }).join(',');
    detailRows = (await req.query(`SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate, RunId FROM dbo.CMP_ReportDetails WHERE RunId IN (${inParams}) ORDER BY RunId, ContractorName, ReviewedDate, StartDate`)).recordset;
  }

  const reportRows = (await pool.request().input('runId', sql.BigInt, runId)
    .query(`SELECT r.ReportDate, r.StartDate AS RunStartDate, m.mode_name AS Mode, r.[Run] AS RunNumber, rep.EmployerId, rep.ContractorId, rep.ContractorName, rep.ComplianceStatus, rep.DispatchNeeded, rep.NextHireDispatch FROM dbo.CMP_Reports rep JOIN dbo.CMP_Runs r ON rep.RunId = r.id JOIN dbo.CMP_Modes m ON r.ModeId = m.id WHERE rep.RunId = @runId ORDER BY rep.ContractorName`)).recordset;

  const last4Rows = (await pool.request().input('runId', sql.BigInt, runId)
    .query(`WITH Contractors AS (SELECT DISTINCT EmployerId, ContractorId FROM dbo.CMP_Reports WHERE RunId = @runId), Ranked AS (SELECT h.EmployerId, h.ContractorID AS ContractorId, h.ContractorName, h.MemberName, h.IANumber, h.StartDate, h.HireType, h.ReviewedDate, ROW_NUMBER() OVER (PARTITION BY h.EmployerId, h.ContractorID ORDER BY h.ReviewedDate DESC, h.StartDate DESC, h.IANumber DESC) AS rn FROM dbo.CMP_HireData h JOIN Contractors c ON c.EmployerId = h.EmployerId AND c.ContractorId = h.ContractorID) SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ReviewedDate FROM Ranked WHERE rn <= 4 ORDER BY ContractorName, ReviewedDate ASC, StartDate ASC`)).recordset;

  const recentHireRows = (await pool.request().input('startDate', sql.Date, runInfo.StartDate)
    .query(`SELECT EmployerId, ContractorID AS ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ReviewedDate FROM dbo.CMP_HireData WHERE StartDate >= @startDate ORDER BY StartDate, ReviewedDate, ContractorName`)).recordset;

  await addSheetFromRows(workbook, 'detail', detailRows);
  await addSheetFromRows(workbook, 'report', reportRows);
  await addSheetFromRows(workbook, 'last 4', last4Rows);
  await addSheetFromRows(workbook, 'Recent Hire', recentHireRows);

  await workbook.xlsx.writeFile(outFile);
  return { runInfo, outFile };
}

module.exports = { addSheetFromRows, generateExcelReport };