# Convert XLSX to CSV using Excel COM object
$XlsxDir = "d:\Workspace\Github\unionhall_compliance\Data\skills"
$XlsxFiles = Get-ChildItem -Path $XlsxDir -Filter "*.xlsx" -File

Write-Host "Found $($XlsxFiles.Count) .xlsx files"

if ($XlsxFiles.Count -eq 0) {
    Write-Host "No files to convert"
    exit 0
}

try {
    $Excel = New-Object -ComObject Excel.Application
    $Excel.Visible = $false
    $Excel.DisplayAlerts = $false
    
    foreach ($File in $XlsxFiles) {
        $CsvPath = $File.FullName -replace '\.xlsx$', '.csv'
        
        Write-Host "Converting: $($File.Name)..."
        $Workbook = $Excel.Workbooks.Open($File.FullName, 3, $false)
        $Workbook.SaveAs($CsvPath, 6)
        $Workbook.Close($false)
        
        Write-Host "  -> $([System.IO.Path]::GetFileName($CsvPath))"
    }
    
    $Excel.Quit()
    Write-Host "Conversion complete!"
    
} catch {
    Write-Host "Error: $_"
} finally {
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($Excel) 2>$null
    [GC]::Collect()
}
