Set objExcel = CreateObject("Excel.Application")
objExcel.Visible = False
objExcel.DisplayAlerts = False

Set objFSO = CreateObject("Scripting.FileSystemObject")
strFolder = "d:\Workspace\Github\unionhall_compliance\Data\skills"

Set objFiles = objFSO.GetFolder(strFolder).Files

For Each objFile In objFiles
    If Right(objFile.Name, 5) = ".xlsx" Then
        strXlsxPath = objFile.Path
        strCsvPath = Left(objFile.Path, Len(objFile.Path) - 5) & ".csv"
        
        WScript.Echo "Converting: " & objFile.Name
        
        Set objWorkbook = objExcel.Workbooks.Open(strXlsxPath)
        objWorkbook.SaveAs strCsvPath, 6
        objWorkbook.Close False
        
        WScript.Echo "  -> " & objFSO.GetBaseName(strCsvPath) & ".csv"
    End If
Next

objExcel.Quit

WScript.Echo "Conversion complete!"
