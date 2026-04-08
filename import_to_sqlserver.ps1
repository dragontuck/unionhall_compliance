# SQL Server Import Script
param(
    [string]$ServerInstance = "DESKTOP-DI29PVA\MSSQLSERVER01",
    [string]$Database = "UnionHallUI"
)

$ExcelFiles = @(
    "d:\Workspace\Github\unionhall_compliance\Data\skills\1_Journeyperson Candidates_OOWL_20260327.xlsx",
    "d:\Workspace\Github\unionhall_compliance\Data\skills\2_Person_Certification_Ethnicity_20260317.xlsx",
    "d:\Workspace\Github\unionhall_compliance\Data\skills\3_Person_Skill_Ethnicity_20260317.xlsx",
    "d:\Workspace\Github\unionhall_compliance\Data\skills\5_People_Journeyperson_CurrentSusFor_20260327.xlsx"
)

# Check if SQL Server module is installed
try {
    Import-Module SqlServer -ErrorAction Stop
    Write-Host "✓ SQL Server module loaded"
} catch {
    Write-Host "Installing SQL Server module..."
    Install-Module -Name SqlServer -Force -AllowClobber
    Import-Module SqlServer
}

# Test connection
try {
    Invoke-SqlCmd -ServerInstance $ServerInstance -Database $Database -Query "SELECT 1" -ErrorAction Stop
    Write-Host "✓ Connected to $ServerInstance/$Database"
} catch {
    Write-Host "✗ Connection failed: $_"
    exit 1
}

# Import each Excel file
$odbc_installed = $false
try {
    $TestConnection = New-Object System.Data.Odbc.OdbcConnection
    $odbc_installed = $true
}
catch {
    Write-Host "⚠ ODBC Driver not available locally. Using alternative method..."
}

foreach ($FilePath in $ExcelFiles) {
    if (-not (Test-Path $FilePath)) {
        Write-Host "✗ File not found: $FilePath"
        continue
    }
    
    $FileName = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
    $TableName = $FileName -replace '[^a-zA-Z0-9_]', '_' -replace '^_|_$', ''
    
    Write-Host "`nImporting: $FileName..."
    
    try {
        # Use ACE connection string for Excel
        $ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$FilePath;Extended Properties='Excel 12.0 Xml;HDR=YES';"
        
        # Note: This requires manual steps or additional setup. 
        # For now, direct the user to use SQL Server Import/Export Wizard
        Write-Host "Use SQL Server Import/Export Wizard to import this file with table name: [$TableName]"
        
    } catch {
        Write-Host "Error: $_"
    }
}

Write-Host "`n--- MANUAL IMPORT INSTRUCTIONS ---"
Write-Host "Since OLEDB setup may be needed, use SQL Server Management Studio:"
Write-Host "1. Connect to: $ServerInstance"
Write-Host "2. Right-click database: $Database"
Write-Host "3. Tasks > Import Data"
Write-Host "4. Choose 'Microsoft Excel' as data source"
Write-Host "5. Import each file to the suggested table name"
