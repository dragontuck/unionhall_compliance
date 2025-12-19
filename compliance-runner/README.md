# CMP Compliance Runner (2To1 / 3To1)

This Node.js script replaces the legacy SQL cursor logic (the `2to1Queries` approach) and uses the CMP tables/views:

- `dbo.CMP_HireData` (view)
- `dbo.CMP_Runs`, `dbo.CMP_Modes`
- `dbo.CMP_Reports`, `dbo.CMP_ReportDetails`

It:

1. Accepts `--startDate` and `--mode` (`2To1` or `3To1`).
2. Creates a new row in `dbo.CMP_Runs`.
3. Uses the latest prior run **with StartDate < current startDate** as the "starting point" (instead of `CMP_StartingPoint2to1`).
4. Processes hires from `dbo.CMP_HireData` where `StartDate >= startDate`.
5. If a contractor has **no new hires** this run, duplicates the contractor’s last prior detail row into the current run:
   - `RunId` = current run
   - `StartDate` = current run startDate
   - `ReviewedDate` = `SYSDATETIMEOFFSET()`
6. Inserts:
   - per-hire rows into `dbo.CMP_ReportDetails`
   - one summary row per contractor into `dbo.CMP_Reports`
7. Exports an Excel workbook with these tabs:
   - **detail**: data processed this run (`CMP_ReportDetails` for RunId)
   - **report**: summary data for this run (`CMP_Reports` for RunId)
   - **last 4**: last 4 hires per contractor based on `CMP_HireData`
   - **Recent Hire**: hires with `StartDate >= startDate` based on `CMP_HireData`

## Install

```bash
npm install
```

## Configure DB connection

Set these environment variables:

```bash
export CMP_DB_SERVER="your-sql-host"
export CMP_DB_DATABASE="UnionHall"
export CMP_DB_USER="..."
export CMP_DB_PASSWORD="..."

# optional
export CMP_DB_PORT=1433
export CMP_DB_ENCRYPT=true
export CMP_DB_TRUST_CERT=false
```

## Run

```bash
node cmp-run.js --startDate 2025-11-16 --mode 2To1
node cmp-run.js --startDate 2025-12-01 --mode 3To1 --out CMP_3to1_20251201.xlsx

# validate logic without writing to DB
node cmp-run.js --startDate 2025-12-01 --mode 2To1 --dryRun
```

## Notes / assumptions

- The compliance algorithm is generalized:
  - `allowedDirect = CMP_Modes.mode_value` (e.g., 2 or 3)
  - after `allowedDirect` direct hires → `NextHireDispatch = 'Y'`
  - at `allowedDirect + 1` direct hires → becomes **Noncompliant** and `DispatchNeeded = 1`
  - additional direct hires → `DispatchNeeded` increments
  - dispatch hires decrement the requirement, and when the last required dispatch is satisfied, the contractor resets to compliant (counts reset)

If you have custom edge cases you want preserved (e.g., special employer/contractor mappings), those can be slotted in where the contractor list and hire list are selected.
