// loadReviewedHires.js
//
// Usage:
//   node loadReviewedHires.js path/to/file.csv
//
// Requirements:
//   npm install mssql csv-parser
//

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const csv = require('csv-parser');

const csvFilePath = process.argv[2];

if (!csvFilePath) {
    console.error('Usage: node loadReviewedHires.js <path-to-csv>');
    process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
    console.error(`File not found: ${csvFilePath}`);
    process.exit(1);
}

// TODO: Update this config for your environment or pull from env vars.
const dbConfig = {
    user: 'uh_admin',
    password: 'uh_admin',
    server: 'DESKTOP-DI29PVA\\MSSQLSERVER01',
    database: 'UnionHall',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

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

async function main() {
    console.log(`Loading CSV: ${path.resolve(csvFilePath)}`);

    const rows = [];

    // Read CSV into memory
    await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', () => {
                console.log(`Parsed ${rows.length} rows from CSV.`);
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });

    let pool;

    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server.');

        const ps = new sql.PreparedStatement(pool);

        // Define parameter types (matching table schema, excluding Id which is IDENTITY)
        ps.input('EmployerID', sql.Int);
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
        CASE WHEN @ReviewedDate IS NULL OR @ReviewedDate = '' THEN NULL ELSE CONVERT(DATETIMEOFFSET(0), @ReviewedDate, 120) END,
        @ExcludedComplianceRules,
        @CreatedByUserName,
        @CreatedByName,
        CONVERT(DATETIME2(0), @CreatedOn, 120)
      WHERE NOT EXISTS (
        SELECT 1 FROM dbo.CMP_ReviewedHires 
        WHERE EmployerID = @EmployerID 
          AND IANumber = @IANumber 
          AND StartDate = CONVERT(DATETIME2(0), @StartDate, 101)
      );
    `;

        await ps.prepare(insertSql);
        console.log('Prepared statement ready.');

        let successCount = 0;
        let failCount = 0;

        for (const [index, row] of rows.entries()) {
            //console.log(`Raw Data row ${index + 1}: ${JSON.stringify(row)}`);
            // Map CSV columns -> DB columns
            // Adjust the property names here to match your actual CSV header names.
            try {
                const params = {
                    EmployerID: toInt(row["Employer ID"]),
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
                console.log(`Inserting row ${index + 1}: ${JSON.stringify(params)}`);
                const result = await ps.execute(params);
                if (result.rowsAffected[0] > 0) {
                    successCount++;
                } else {
                    console.log(`Row ${index + 1} skipped (duplicate): EmployerID=${params.EmployerID}, ContractorID=${params.ContractorID}, StartDate=${params.StartDate}`);
                }
            } catch (err) {
                failCount++;
                console.error(`Row ${index + 1} failed:`, err.message);
                console.error(`Row ${index + 1} failed:`, err);
                break;
            }
        }

        await ps.unprepare();
        console.log(`Insert complete. Success: ${successCount}, Failed: ${failCount}`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

main().catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
