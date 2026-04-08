' VBScript to convert CSV to SQL INSERT statements
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objWinShell = CreateObject("WScript.Shell")

' CSV file to process
strCsvFile = "d:\Workspace\Github\unionhall_compliance\Data\skills\1_Journeyperson Candidates_OOWL_20260327.csv"
strTableName = "Journeyperson_Candidates_OOWL"
strSqlOutput = "d:\Workspace\Github\unionhall_compliance\import_1_journeyperson.sql"

' Read CSV and generate SQL
Set objFile = objFSO.OpenTextFile(strCsvFile, 1)
strHeaders = objFile.ReadLine

' Parse header to get column names
arrHeaders = Split(strHeaders, ",")
For i = 0 To UBound(arrHeaders)
    arrHeaders(i) = Trim(arrHeaders(i))
    arrHeaders(i) = Replace(arrHeaders(i), """", "")
Next

' Build column list - map CSV columns to table columns
strColumnMap = "[Position],[Name],[DuesStatus],[PrimaryAffiliate],[Phone],[Classification],[LastCompany],[LastActivity],[OnDate],[Group],[CandidateStatus],[Hours],[Added],[Suspended],[WorkZones],[Dispatched],[Ethnicity],[IANumber]"

strSql = "USE UnionHallUI;" & vbCrLf

intRowCount = 0
Do While Not objFile.AtEndOfStream
    strLine = objFile.ReadLine
    
    If Len(Trim(strLine)) > 0 Then
        intRowCount = intRowCount + 1
        
        ' Parse CSV line with proper quote handling
        arrValues = ParseCSV(strLine)
        
        ' Build INSERT statement
        strValues = ""
        For i = 0 To UBound(arrValues)
            strValue = Trim(arrValues(i))
            strValue = Replace(strValue, """", "")
            strValue = Replace(strValue, "'", "''")
            
            If i > 0 Then strValues = strValues & ","
            strValues = strValues & "'" & strValue & "'"
        Next
        
        strSql = strSql & "INSERT INTO dbo." & strTableName & " (" & strColumnMap & ") VALUES (" & strValues & ");" & vbCrLf
    End If
Loop

objFile.Close

' Write SQL file
Set objOutput = objFSO.CreateTextFile(strSqlOutput, True)
objOutput.Write strSql
objOutput.Close

WScript.Echo "Generated: " & strSqlOutput
WScript.Echo "Rows: " & intRowCount

Function ParseCSV(strLine)
    Dim arrResult()
    Dim strCurrent
    Dim inQuotes
    Dim i
    Dim intIndex
    
    ReDim arrResult(0)
    intIndex = 0
    strCurrent = ""
    inQuotes = False
    
    For i = 1 To Len(strLine)
        Dim strChar
        strChar = Mid(strLine, i, 1)
        
        If strChar = """" Then
            inQuotes = Not inQuotes
            strCurrent = strCurrent & strChar
        ElseIf strChar = "," And Not inQuotes Then
            arrResult(intIndex) = strCurrent
            intIndex = intIndex + 1
            ReDim Preserve arrResult(intIndex)
            strCurrent = ""
        Else
            strCurrent = strCurrent & strChar
        End If
    Next
    
    arrResult(intIndex) = strCurrent
    ParseCSV = arrResult
End Function
