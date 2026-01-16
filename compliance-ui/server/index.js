import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csv from 'csv-parser';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { spawn } from 'child_process';
import { runCompliance } from './service.js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist folder
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log(`Serving static files from ${distPath}`);
}

// File upload setup
const upload = multer({ storage: multer.memoryStorage() });

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'uh_admin',
    password: process.env.DB_PASSWORD || 'uh_admin',
    server: process.env.DB_SERVER || 'DESKTOP-DI29PVA\\MSSQLSERVER01',
    database: process.env.DB_NAME || 'UnionHallUI',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectionTimeout: 15000,
    },
};

let pool = null;

// Initialize database connection
async function initializeDatabase() {
    try {
        pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

// Routes
// Import compliance-runner service
// POST: Call compliance-runner as a service
app.post('/api/runs/execute', async (req, res) => {
    try {
        const { reviewedDate, mode, dryRun } = req.body;
        if (!reviewedDate || !mode) {
            return res.status(400).json({ error: 'reviewedDate and mode are required' });
        }

        const result = await runCompliance({ mode, reviewedDate, dryRun, dbConfig });
        if (result.error) {
            return res.status(500).json({
                error: `Execution failed: ${result.error}`,
                output: result.output,
            });
        }
        res.json({
            message: `Compliance runner executed successfully${dryRun ? ' (dry run)' : ''}`,
            runId: result.runId,
            output: result.output,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database check
app.get('/api/database', (req, res) => {
    res.json({ server: dbConfig.server, database: dbConfig.database, user: dbConfig.user });
});
function toInt(val) {
    if (val === undefined || val === null || val === '') return null;
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? null : n;
}

function toBool(val) {
    if (val === undefined || val === null) return null;
    const s = String(val).trim().toLowerCase();
    if (s === '' || s === 'null') return null;
    if (['1', 'true', 'yes', 'y'].includes(s)) return true;
    if (['0', 'false', 'no', 'n'].includes(s)) return false;
    return null;
}

function toDate(val) {
    if (!val || String(val).trim() === '' || String(val).trim().toLowerCase() === 'null') {
        return null;
    }
    // Let SQL Server do the conversion from string if needed.
    // If you prefer JS Date -> DATETIME2, you can do:
    // const d = new Date(val); if (isNaN(d)) return null; else return d;
    return String(val).trim();
}


// IMPORT: Hire Data

app.post('/api/import/hires', upload.single('file'), async (req, res) => {
    console.log(`[IMPORT] POST /api/import/hires called at ${new Date().toISOString()}`);
    if (!req.file) {
        console.warn('[IMPORT] No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[IMPORT] File received: originalname=${req.file.originalname}, size=${req.file.size} bytes`);

    const rows = [];
    const errors = [];

    try {
        // Parse CSV using csv-parser
        const csv = (await import('csv-parser')).default;
        const { Readable } = await import('stream');
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        await new Promise((resolve, reject) => {
            bufferStream
                .pipe(csv())
                .on('data', (row) => rows.push(row))
                .on('end', () => {
                    console.log(`[IMPORT] Parsed ${rows.length} data rows from CSV.`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('[IMPORT] CSV parse error:', err);
                    reject(err);
                });
        });


        // Insert into database
        if (pool) {
            let inserted = 0;
            const ps = new sql.PreparedStatement(pool);

            // Define parameter types (matching table schema, excluding Id which is IDENTITY)
            ps.input('EmployerID', sql.NVarChar(50));
            ps.input('ContractorName', sql.NVarChar(100));
            ps.input('MemberName', sql.NVarChar(100));
            ps.input('IANumber', sql.Int);
            ps.input('StartDate', sql.NVarChar(50));             // let SQL convert string -> DATETIME2
            ps.input('HireType', sql.NVarChar(20));
            ps.input('IsReviewed', sql.Bit);
            ps.input('IsExcluded', sql.Bit);
            ps.input('EndDate', sql.NVarChar(50));               // nullable
            ps.input('ContractorID', sql.Int);
            ps.input('IsInactive', sql.Bit);
            ps.input('ReviewedDate', sql.NVarChar(50));          // string to DATETIMEOFFSET
            ps.input('ExcludedComplianceRules', sql.NVarChar(255));
            ps.input('CreatedByUserName', sql.NVarChar(100));
            ps.input('CreatedByName', sql.NVarChar(100));
            ps.input('CreatedOn', sql.NVarChar(50));             // string to DATETIME2

            const insertSql = `
      INSERT INTO dbo.CMP_ReviewedHires
      (
        EmployerID,
        ContractorName,
        MemberName,
        IANumber,
        StartDate,
        HireType,
        IsReviewed,
        IsExcluded,
        EndDate,
        ContractorID,
        IsInactive,
        ReviewedDate,
        ExcludedComplianceRules,
        CreatedByUserName,
        CreatedByName,
        CreatedOn
      )
      SELECT
        @EmployerID,
        @ContractorName,
        @MemberName,
        @IANumber,
        CONVERT(DATETIME2(0), @StartDate, 101),
        @HireType,
        @IsReviewed,
        @IsExcluded,
        CASE WHEN @EndDate IS NULL OR @EndDate = '' THEN NULL ELSE CONVERT(DATETIME2(0), @EndDate, 101) END,
        @ContractorID,
        @IsInactive,
        CASE WHEN @ReviewedDate IS NULL OR @ReviewedDate = '' THEN NULL ELSE TRY_CONVERT(DATETIMEOFFSET(7), @ReviewedDate) END,
        @ExcludedComplianceRules,
        @CreatedByUserName,
        @CreatedByName,
        CONVERT(DATETIME2(0), @CreatedOn, 101)
      WHERE NOT EXISTS (
        SELECT 1 FROM dbo.CMP_ReviewedHires 
        WHERE EmployerID = @EmployerID 
          AND IANumber = @IANumber 
          AND StartDate = CONVERT(DATETIME2(0), @StartDate, 101)
      );
    `;

            await ps.prepare(insertSql);
            console.log('[IMPORT] Prepared statement ready. Starting row inserts...');

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                console.log(`[IMPORT] Processing row ${i + 1}:`, row);
                try {
                    const params = {
                        EmployerID: row["Employer ID"],
                        ContractorName: row["Contractor Name"] || null,
                        MemberName: row["Member Name"] || null,
                        IANumber: toInt(row["IA Number"]),
                        StartDate: toDate(row["Start Date"]),
                        HireType: row["Hire Type"] || null,
                        IsReviewed: toBool(row["Is Reviewed"]),
                        IsExcluded: toBool(row["Is Excluded"]),   // may be null
                        EndDate: toDate(row["End Date"]),
                        ContractorID: toInt(row["Contractor ID"]),
                        IsInactive: toBool(row["Is Inactive"]),
                        ReviewedDate: toDate(row["Reviewed Date"]),
                        ExcludedComplianceRules: row["Excluded Compliance Rules"] || null,
                        CreatedByUserName: row["Created By User Name"] || null,
                        CreatedByName: row["Created By Name"] || null,
                        CreatedOn: toDate(row["Created on"])
                    };

                    const result = await ps.execute(params);
                    if (result.rowsAffected[0] > 0) {
                        successCount++;
                        inserted++;
                    }
                } catch (err) {
                    failCount++;
                    errors.push(`Row ${i + 1}: ${err.message}`);
                    console.error(`[IMPORT] Error inserting row ${i + 1}:`, err);
                }
            }

            console.log(`[IMPORT] Inserted: ${inserted}, Failed: ${failCount}`);

            res.json({
                message: `Import completed: ${inserted} rows inserted`,
                rowsImported: inserted,
                rowsFailed: failCount,
                errors: errors.length > 0 ? errors : undefined,
            });
        } else {
            console.error('[IMPORT] Database not connected');
            res.status(500).json({ error: 'Database not connected' });
        }
    } catch (error) {
        console.error('[IMPORT] Fatal error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Modes
app.get('/api/modes', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const request = pool.request();
        const result = await request.query('SELECT * FROM CMP_Modes ORDER BY id');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Runs
app.get('/api/runs', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        const result = await request.query(`
      SELECT TOP 100 r.id, convert(nvarchar, r.ReviewedDate, 25) as reviewedDate, run, m.Mode_Name as modeName FROM CMP_Runs r inner join CMP_Modes m on r.ModeId = m.Id
      ORDER BY id DESC
    `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Single Run
app.get('/api/runs/:id', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('id', sql.Int, req.params.id);
        const result = await request.query('SELECT * FROM CMP_Runs WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Run not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Reports
app.get('/api/reports', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const { runId, contractorId, employerId } = req.query;
        const request = pool.request();

        let query = 'SELECT TOP 500 * FROM CMP_Reports WHERE 1=1';

        if (runId) {
            query += ' AND RunId = @runId';
            request.input('runId', sql.Int, runId);
        }

        if (contractorId) {
            query += ' AND ContractorID = @contractorId';
            request.input('contractorId', sql.Int, contractorId);
        }

        if (employerId) {
            query += ' AND EmployerID = @employerId';
            request.input('employerId', sql.NVarChar(50), employerId);
        }

        query += ' ORDER BY id DESC';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Reports by Run
app.get('/api/reports/run/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('runId', sql.Int, req.params.runId);
        const result = await request.query(
            `SELECT id, runId, employerId, contractorId, contractorName, complianceStatus, directCount, dispatchNeeded, nextHireDispatch,
            (Select count(*) from CMP_ReportNotes where CMP_ReportNotes.employerId = CMP_Reports.employerId) as noteCount
            FROM CMP_Reports WHERE RunId = @runId ORDER BY ContractorName`
        );

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Report notes by ReportId
app.get('/api/report-notes/report/:reportId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('reportId', sql.Int, req.params.reportId);
        const result = await request.query(
            `SELECT note, convert(nvarchar, createdDate, 25) as createdDate, createdBy from CMP_ReportNotes where ReportId = @reportId
           ORDER BY CreatedDate`
        );

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET: Report notes by EmployerId
app.get('/api/report-notes/employer/:employerId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('employerId', sql.NVarChar(100), req.params.employerId);
        const result = await request.query(
            `SELECT note, convert(nvarchar, createdDate, 25) as createdDate, createdBy from CMP_ReportNotes where EmployerId = @employerId
           ORDER BY CreatedDate`
        );

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GET: Report Details
app.get('/api/report-details', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const { runId, contractorId, contractorName, employerId } = req.query;
        const request = pool.request();

        let query = 'SELECT TOP 1000 * FROM CMP_ReportDetails WHERE 1=1';

        if (runId) {
            query += ' AND RunId = @runId';
            request.input('runId', sql.Int, runId);
        }

        if (contractorId) {
            query += ' AND ContractorID = @contractorId';
            request.input('contractorId', sql.Int, contractorId);
        }

        if (contractorName) {
            query += ' AND ContractorName LIKE @contractorName';
            request.input('contractorName', sql.NVarChar(100), `%${contractorName}%`);
        }

        if (employerId) {
            query += ' AND EmployerID = @employerId';
            request.input('employerId', sql.NVarChar(50), employerId);
        }

        query += ' ORDER BY id DESC';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.put('/api/report-details/:id', async (req, res) => {
    console.log(`[UpdateReport] PUT /api/report-details/:id called at ${new Date().toISOString()}`);
    console.log(`[UpdateReport] Request ID: ${req.params.id}`);

    try {
        if (!pool) {
            console.error('[UpdateReport] Database not connected');
            return res.status(500).json({ error: 'Database not connected' });
        }

        const { status, directCount, dispatchNeeded, nextHireDispatch, employerId, note, changedBy } = req.body;
        console.log(`[UpdateReport] Request body:`, { status, directCount, dispatchNeeded, nextHireDispatch, employerId, note: note ? `${note.substring(0, 50)}...` : null, changedBy });

        const ps = new sql.PreparedStatement(pool);

        ps.input('reportId', sql.Int, req.params.id);
        ps.input('directCount', sql.Int, directCount);
        ps.input('dispatchNeeded', sql.Int, dispatchNeeded);
        ps.input('nextHireDispatch', sql.NVarChar(1), nextHireDispatch);
        ps.input('status', sql.NVarChar(50), status);

        const updateSql = `update dbo.CMP_Reports set DirectCount = @directCount, DispatchNeeded = @dispatchNeeded, NextHireDispatch = @nextHireDispatch, ComplianceStatus = @status
            where Id = @reportId`;

        console.log(`[UpdateReport] Preparing update statement for reportId: ${req.params.id}`);
        await ps.prepare(updateSql);

        const updateResult = await ps.execute({
            reportId: req.params.id,
            directCount,
            dispatchNeeded,
            nextHireDispatch,
            status
        });

        console.log(`[UpdateReport] Update result: ${updateResult.rowsAffected[0]} rows affected`);
        await ps.unprepare();

        if (updateResult.rowsAffected[0] > 0) {
            console.log(`[UpdateReport] Creating note for employerId: ${employerId}`);
            const psNote = new sql.PreparedStatement(pool);
            psNote.input('reportId', sql.Int, req.params.id);
            psNote.input('employerId', sql.NVarChar(100), employerId);
            psNote.input('note', sql.Text, note);
            psNote.input('changedBy', sql.NVarChar(50), changedBy);

            const noteInsertSql = `INSERT INTO CMP_ReportNotes (ReportId, EmployerId, Note, CreatedBy) VALUES (@reportId, @employerId, @note, @changedBy)`;
            console.log(`[UpdateReport] Note insert SQL: ${noteInsertSql}`);

            await psNote.prepare(noteInsertSql);

            try {
                const noteResult = await psNote.execute({
                    reportId: req.params.id,
                    employerId,
                    note,
                    changedBy
                });

                console.log(`[UpdateReport] Note created: ${noteResult.rowsAffected[0]} rows inserted`);
                await psNote.unprepare();
            } catch (noteError) {
                console.error(`[UpdateReport] Note insertion error: ${noteError.message}`);
                console.error(`[UpdateReport] Note error details:`, noteError);
                await psNote.unprepare();
                throw noteError;
            }
        } else {
            console.warn(`[UpdateReport] No rows updated for reportId: ${req.params.id}`);
        }

        console.log(`[UpdateReport] Fetching updated record for reportId: ${req.params.id}`);
        const request = pool.request();
        request.input('reportId', sql.Int, req.params.id);
        const result = await request.query(
            `SELECT id, runId, employerId, contractorId, contractorName, complianceStatus, directCount, dispatchNeeded, nextHireDispatch,
            (Select count(*) from CMP_ReportNotes where CMP_ReportNotes.employerId = CMP_Reports.employerId) as noteCount
            FROM CMP_Reports WHERE id = @reportId`
        );

        console.log(`[UpdateReport] Successfully completed update for reportId: ${req.params.id}`);
        res.json(result.recordset);
    } catch (error) {
        console.error('[UpdateReport] Error:', error.message);
        console.error('[UpdateReport] Stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
});

// GET: Report Details by Run
app.get('/api/report-details/run/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('runId', sql.Int, req.params.runId);
        const result = await request.query(
            `SELECT d.employerId, d.contractorId, d.contractorName, d.memberName, d.iaNumber, d.startDate, d.hireType, d.complianceStatus, d.directCount, d.dispatchNeeded, d.nextHireDispatch, convert(nvarchar, d.reviewedDate, 25) as reviewedDate, m.Mode_Name as modeName FROM dbo.CMP_ReportDetails d
            inner join dbo.CMP_Runs r on d.RunId = r.Id
            inner join CMP_Modes m on r.ModeId = m.Id
      WHERE RunId IN (select max(id) as Id from dbo.CMP_Runs group by ReviewedDate having Max(id) <= @runId)
      ORDER BY contractorName, reviewedDate, startDate, iaNumber`
        );

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Recent Hires by Run
app.get('/api/recent-hires/run/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('runId', sql.Int, req.params.runId);
        const result = await request.query(
            `SELECT employerId, ContractorID AS contractorId, contractorName, memberName, iaNumber, startDate, hireType, convert(nvarchar, ReviewedDate, 25) as reviewedDate FROM dbo.CMP_HireData WHERE ReviewedDate >=  (
        SELECT CAST(MAX(ReviewedDate) AS date) AS MaxReviewedDate
        FROM dbo.CMP_HireData
      ) ORDER BY StartDate, ReviewedDate, ContractorName`
        );

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Last 4 Hires by Run
app.get('/api/last-hires/run/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('runId', sql.Int, req.params.runId);
        const result = await request.query(`WITH Contractors AS (
        	    SELECT DISTINCT EmployerId, ContractorId FROM dbo.CMP_Reports WHERE RunId = @runId
), 
Detail AS (
    SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, d.ReviewedDate, m.Mode_Name as modeName 
    FROM dbo.CMP_ReportDetails d
    inner join dbo.CMP_Runs r on d.RunId = r.Id
                inner join CMP_Modes m on r.ModeId = m.Id
    WHERE RunId IN 
    (select max(id) as Id from dbo.CMP_Runs group by ReviewedDate having Max(id) <= @runId)
),
Ranked AS (
    SELECT h.EmployerId, h.ContractorID AS ContractorId, h.ContractorName, h.MemberName, h.IANumber, h.StartDate, h.HireType,h.ComplianceStatus, h.DirectCount, h.DispatchNeeded, h.NextHireDispatch, h.ReviewedDate, h.modeName, ROW_NUMBER() OVER (PARTITION BY h.EmployerId, h.ContractorID ORDER BY h.ReviewedDate DESC, h.StartDate DESC, h.IANumber  DESC) AS rn 
    FROM Detail h JOIN Contractors c 
    ON c.EmployerId = h.EmployerId AND c.ContractorId = h.ContractorID
) 
SELECT employerId, contractorId, contractorName, memberName, iaNumber, startDate, hireType, complianceStatus, directCount, dispatchNeeded, nextHireDispatch, convert(nvarchar, ReviewedDate, 25) as reviewedDate, modeName, RN as [Order #] FROM Ranked WHERE rn <= 4 ORDER BY ContractorName, ReviewedDate ASC, StartDate ASC
    `);

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ fullerror: error, error: error.message });
    }
});

// GET: Raw Hire Data from CMP_HireData view
app.get('/api/hire-data', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const { reviewedDate } = req.query;
        const request = pool.request();

        let query = 'SELECT TOP 2000 * FROM CMP_HireData WHERE 1=1';

        if (reviewedDate) {
            query += ' AND ReviewedDate <= @reviewedDate';
            request.input('reviewedDate', sql.NVarChar(50), reviewedDate);
        }

        query += ' ORDER BY ContractorName, StartDate, MemberName';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: last four hires per contractor
app.get('/api/last4', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const { runId } = req.query;
        const last4Rows = (await pool.request().input('runId', sql.BigInt, runId)
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

        res.json(last4Rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Export data for Excel
app.get('/api/export/report/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('runId', sql.Int, req.params.runId);

        const reportsResult = await request.query(
            'SELECT id, runId, employerId, contractorId, contractorName, complianceStatus, directCount, dispathNeeded, nextHireDispatch FROM CMP_Reports WHERE RunId = @runId ORDER BY ContractorName'
        );

        res.json(reportsResult.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GET: Export data for Excel
app.get('/api/export/data/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const request = pool.request();
        request.input('runId', sql.Int, req.params.runId);

        const detailsResult = await request.query(
            'SELECT * FROM CMP_ReportDetails WHERE RunId = @runId ORDER BY id'
        );

        const reportsResult = await request.query(
            'SELECT * FROM CMP_Reports WHERE RunId = @runId ORDER BY id'
        );

        res.json({
            runId: parseInt(req.params.runId),
            details: detailsResult.recordset,
            reports: reportsResult.recordset,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Download Excel
app.get('/api/export/run/:runId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const runIdNum = parseInt(req.params.runId, 10);

        console.log(`[ExcelExport] Execute Load runInfo for runId=${runIdNum}:`);
        const runInfo = (await pool.request().input('runId', sql.BigInt, runIdNum)
            .query('SELECT r.ReviewedDate, r.ModeId, r.[Run], m.mode_name FROM dbo.CMP_Runs r JOIN dbo.CMP_Modes m ON r.ModeId = m.id WHERE r.id = @runId')).recordset[0];
        console.log(`[ExcelExport] Loaded runInfo:`, runInfo);

        const detailRows = (await pool.request().input('runId', sql.BigInt, runIdNum)
            .query(`SELECT EmployerId, ContractorId, ContractorName, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, convert(nvarchar, d.ReviewedDate, 25) as ReviewedDate, m.Mode_Name as ModeName FROM dbo.CMP_ReportDetails d
             inner join dbo.CMP_Runs r on d.RunId = r.Id
             inner join CMP_Modes m on r.ModeId = m.Id
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

        const wb = XLSX.utils.book_new();

        // Details sheet
        const detailsSheet = XLSX.utils.json_to_sheet(detailRows);
        XLSX.utils.book_append_sheet(wb, detailsSheet, 'Detail');

        // Reports sheet
        const reportsSheet = XLSX.utils.json_to_sheet(reportRows);
        XLSX.utils.book_append_sheet(wb, reportsSheet, 'Report');

        // Last 4 sheet
        const last4Sheet = XLSX.utils.json_to_sheet(last4Rows);
        XLSX.utils.book_append_sheet(wb, last4Sheet, 'Last 4');

        // Recent Hire sheet
        const recentHireSheet = XLSX.utils.json_to_sheet(recentHireRows);
        XLSX.utils.book_append_sheet(wb, recentHireSheet, 'Recent Hire');

        // Write to buffer
        const buffer = XLSX.write(wb, { type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="compliance_report_${req.params.runId}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fallback to index.html for SPA routing (must be before error handler)
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'UI not found. Please run "npm run build" in compliance-ui folder.' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    if (pool) {
        await pool.close();
    }
    process.exit(0);
});
