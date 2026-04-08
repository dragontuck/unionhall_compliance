# SQL Server Excel Import Guide

## Files to Import
1. `1_Journeyperson Candidates_OOWL_20260327.xlsx` → Table: `Journeyperson_Candidates_OOWL_20260327`
2. `2_Person_Certification_Ethnicity_20260317.xlsx` → Table: `Person_Certification_Ethnicity_20260317`
3. `3_Person_Skill_Ethnicity_20260317.xlsx` → Table: `Person_Skill_Ethnicity_20260317`
4. `5_People_Journeyperson_CurrentSusFor_20260327.xlsx` → Table: `People_Journeyperson_CurrentSusFor_20260327`

**Target:** Server: `DESKTOP-DI29PVA\MSSQLSERVER01` | Database: `UnionHallUI`

---

## Option 1: Using SQL Server Management Studio (SSMS) - RECOMMENDED

### Step-by-Step Instructions:

1. **Open SQL Server Management Studio (SSMS)**
   - Connect to: `DESKTOP-DI29PVA\MSSQLSERVER01`
   
2. **Navigate to UnionHallUI Database**
   - In Object Explorer, expand your server
   - Right-click on `UnionHallUI` database
   
3. **Launch Import Wizard**
   - Go to: **Tasks** > **Import Data**
   - The SQL Server Import and Export Wizard opens
   
4. **Configure Data Source**
   - Data Source: Select **Microsoft Excel**
   - Excel file path: Browse to the first `.xlsx` file
   - Excel version: **Excel 2007-365**
   - Check "First row has column names"
   - Click **Next**
   
5. **Configure Destination**
   - Destination: SQL Server Native Client
   - Server: `DESKTOP-DI29PVA\MSSQLSERVER01`
   - Database: `UnionHallUI`
   - Click **Next**
   
6. **Select Source Tables**
   - Select the worksheet(s) to import
   - Click on the destination table name to rename it if needed
   - Click **Next**
   
7. **Review Column Mappings**
   - Verify data types and column names
   - Click **Next**
   
8. **Complete Import**
   - Click **Finish**
   
9. **Repeat for Other Files**
   - Repeat steps 3-8 for each remaining Excel file

---

## Option 2: Using PowerShell with SQL Server Module

```powershell
# Install SQL Server module if needed
Install-Module -Name SqlServer -Force

# Script to verify connection
$ServerInstance = "DESKTOP-DI29PVA\MSSQLSERVER01"
$Database = "UnionHallUI"

# Test connection
$TestQuery = Invoke-SqlCmd -ServerInstance $ServerInstance `
    -Database $Database `
    -Query "SELECT @@VERSION" 

Write-Host "Connected successfully!"
Write-Host $TestQuery
```

---

## Option 3: Using T-SQL OPENROWSET (Advanced)

```sql
-- After setting up OLEDB data provider (may require SQL Server configuration)
USE UnionHallUI

EXEC sp_configure 'Ad Hoc Distributed Queries', 1
RECONFIGURE

-- Import first file
SELECT *
INTO Journeyperson_Candidates_OOWL_20260327
FROM OPENROWSET('Microsoft.ACE.OLEDB.12.0',
    'Excel 12.0;Database=d:\Workspace\Github\unionhall_compliance\Data\skills\1_Journeyperson Candidates_OOWL_20260327.xlsx;HDR=YES',
    'SELECT * FROM [Sheet1$]')

-- Repeat for other files with appropriate sheet names and table names
```

---

## Troubleshooting

### If SSMS Shows Excel as Unavailable:
- Install: **Microsoft Access Database Engine 2010 Redistributable** (64-bit if SQL Server is 64-bit)
- Download from: https://www.microsoft.com/en-us/download/details.aspx?id=13255

### If Connection Fails:
- Verify SQL Server instance is running
- Check if database exists: `UnionHallUI`
- Ensure Windows Authentication is enabled
- Test with: `sqlcmd -S DESKTOP-DI29PVA\MSSQLSERVER01`

### File Locations
All files are in: `d:\Workspace\Github\unionhall_compliance\Data\skills\`

---

## Quick Verification After Import

Once imported, verify the tables in SSMS:

```sql
USE UnionHallUI

-- List all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'

-- Check row count for each table
SELECT 'Journeyperson_Candidates_OOWL_20260327' as TableName, COUNT(*) as RowCount 
FROM Journeyperson_Candidates_OOWL_20260327
```
