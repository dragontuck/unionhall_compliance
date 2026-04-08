# PowerShell script to import CSV files to SQL Server
$ServerInstance = "DESKTOP-DI29PVA\MSSQLSERVER01"
$Database = "UnionHallUI"
$SkillsDir = "d:\Workspace\Github\unionhall_compliance\Data\skills"

# First create tables
Write-Host "Creating tables..."
sqlcmd -S "$ServerInstance" -d "$Database" -i "d:\Workspace\Github\unionhall_compliance\create_tables.sql"

# Define CSV files and their mapping
$CsvFiles = @(
    @{File = "$SkillsDir\1_Journeyperson Candidates_OOWL_20260327.csv"; Table = "Journeyperson_Candidates_OOWL"},
    @{File = "$SkillsDir\2_Person_Certification_Ethnicity_20260317.csv"; Table = "Person_Certification_Ethnicity"},
    @{File = "$SkillsDir\3_Person_Skill_Ethnicity_20260317.csv"; Table = "Person_Skill_Ethnicity"},
    @{File = "$SkillsDir\5_People_Journeyperson_CurrentSusFor_20260327.csv"; Table = "People_Journeyperson_CurrentSusFor"}
)

foreach ($CsvInfo in $CsvFiles) {
    $CsvFile = $CsvInfo.File
    $TableName = $CsvInfo.Table
    
    Write-Host "`nProcessing: $(Split-Path $CsvFile -Leaf)"
    
    if (-not (Test-Path $CsvFile)) {
        Write-Host "  ERROR: File not found: $CsvFile"
        continue
    }
    
    # Read CSV and count lines
    $Lines = @(Get-Content $CsvFile)
    $DataLines = $Lines.Count - 1
    
    Write-Host "  Found $DataLines data rows"
    Write-Host "  Generating SQL INSERT statements..."
    
    # Import CSV
    $Data = Import-Csv -Path $CsvFile
    
    # Build SQL file
    $SqlFile = "d:\Workspace\Github\unionhall_compliance\import_$TableName.sql"
    $SqlContent = "USE $Database;`n`n"
    
    $RowCount = 0
    foreach ($Row in $Data) {
        $RowCount++
        if ($RowCount % 100 -eq 0) { Write-Host "  Processing row $RowCount..." }
        
        # Get column names and values
        $Columns = @()
        $Values = @()
        
        foreach ($Property in $Row.PSObject.Properties) {
            $ColName = $Property.Name
            $ColValue = $Property.Value
            
            if (-not [string]::IsNullOrEmpty($ColName)) {
                $Columns += $ColName
                # Escape single quotes
                $ColValue = $ColValue -replace "'", "''"
                $Values += "'$ColValue'"
            }
        }
        
        $ColumnList = ($Columns | ForEach-Object { "[$_]" }) -join ","
        $ValueList = $Values -join ","
        
        $SqlContent += "INSERT INTO dbo.$TableName ($ColumnList) VALUES ($ValueList);`n"
    }
    
    Set-Content -Path $SqlFile -Value $SqlContent
    Write-Host "  SQL script ready: $SqlFile"
    
    Write-Host "  Executing import..."
    $Result = sqlcmd -S "$ServerInstance" -d "$Database" -i "$SqlFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Successfully imported $RowCount rows"
    } else {
        Write-Host "  ✗ Import failed"
        Write-Host $Result
    }
}

Write-Host "`n`n=== VERIFICATION ==="
@(
    "SELECT 'Journeyperson_Candidates_OOWL' as TableName, COUNT(*) as RowCount FROM Journeyperson_Candidates_OOWL",
    "SELECT 'Person_Certification_Ethnicity' as TableName, COUNT(*) as RowCount FROM Person_Certification_Ethnicity",
    "SELECT 'Person_Skill_Ethnicity' as TableName, COUNT(*) as RowCount FROM Person_Skill_Ethnicity",
    "SELECT 'People_Journeyperson_CurrentSusFor' as TableName, COUNT(*) as RowCount FROM People_Journeyperson_CurrentSusFor"
) | ForEach-Object {
    Write-Host "`nRunning: $_"
    sqlcmd -S "$ServerInstance" -d "$Database" -Q $_ -w 65535
}

Write-Host "`nImport complete!"
