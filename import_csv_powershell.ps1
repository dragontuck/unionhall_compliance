$CsvFile = "d:\Workspace\Github\unionhall_compliance\Data\skills\4_Skill_and_Certification _Frequencies_20250606-20260327.csv"
$ServerInstance = "DESKTOP-DI29PVA\MSSQLSERVER01"
$Database = "UnionHallUI"
$TableName = "Skill_Certification_Frequencies"

# Read CSV file
Write-Host "Reading CSV file: $CsvFile"
$Data = @()
$LineNumber = 0

Get-Content $CsvFile | ForEach-Object {
    $LineNumber++
    if ($LineNumber -eq 1) { return } # Skip header
    
    # Parse CSV manually due to commas in fields
    $Parts = [regex]::Split($_, ',(?=(?:[^"]*"[^"]*")*[^"]*$)')
    
    if ($Parts.Count -ge 3) {
        $Data += @{
            Type = $Parts[0].Trim()
            Name = $Parts[1].Trim()
            Frequency = $Parts[2].Trim()
        }
    }
}

Write-Host "Parsed $($Data.Count) records from CSV"

# Build SQL INSERT statement
Write-Host "Preparing SQL INSERT statements..."
$SqlStatements = @()

foreach ($Row in $Data) {
    $Name = $Row.Name -replace "'", "''"  # Escape single quotes
    $SqlStatements += "INSERT INTO $TableName (Type, Name, Frequency) VALUES ('$($Row.Type)', '$Name', $($Row.Frequency));"
}

# Write SQL file
$SqlOutputFile = "d:\Workspace\Github\unionhall_compliance\import_csv_bulk.sql"
$SqlContent = "USE $Database;`n`n" + ($SqlStatements -join "`n")
Set-Content -Path $SqlOutputFile -Value $SqlContent

Write-Host "SQL script generated: $SqlOutputFile"
Write-Host "Total INSERT statements: $($SqlStatements.Count)"
Write-Host "`nExecuting import..."

# Execute via sqlcmd
$Result = sqlcmd -S "$ServerInstance" -d "$Database" -i "$SqlOutputFile" -w 65535

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nImport completed successfully!"
    Write-Host "Verifying data..."
    $VerifyQuery = "SELECT Type, COUNT(*) as RecordCount, SUM(Frequency) as TotalFrequency FROM $TableName GROUP BY Type"
    sqlcmd -S "$ServerInstance" -d "$Database" -Q "$VerifyQuery" -w 65535
} else {
    Write-Host "`nImport failed with error"
    Write-Host $Result
}
