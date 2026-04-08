$XlsxDir = "d:\Workspace\Github\unionhall_compliance\Data\skills"
$XlsxFiles = Get-ChildItem -Path $XlsxDir -Filter "*.xlsx"

if ($XlsxFiles.Count -eq 0) {
    Write-Host "No .xlsx files found"
    exit 1
}

Write-Host "Found $($XlsxFiles.Count) .xlsx files`n"

# Create Excel COM object
$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
$Excel.DisplayAlerts = $false

foreach ($File in $XlsxFiles) {
    try {
        $CsvPath = $File.FullName -replace '\.xlsx$', '.csv'
        $Workbook = $Excel.Workbooks.Open($File.FullName)
        $Worksheet = $Workbook.Sheets(1)
        
        # Save as CSV
        $Workbook.SaveAs($CsvPath, 6) # 6 = xlCSV format
        $Workbook.Close($false)
        
        Write-Host "✓ $($File.Name) -> $([System.IO.Path]::GetFileName($CsvPath))"
        
    } catch {
        Write-Host "✗ Error converting $($File.Name): $_"
    }
}

$Excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($Excel) | Out-Null

Write-Host "`nConversion complete!"
