' VBScript: Generate SQL INSERT from CSV file
' Usage: cscript generate_single_csv.vbs "csvfile.csv" "TableName"

Dim objFSO, objFile, strCsvFile, strTableName, strSqlOutput
Dim arrHeaders, arrValues, strLine, strSql, intRowCount
Dim i, j, strValue, strValues, strColumnMap

Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get arguments
If WScript.Arguments.Count < 2 Then
    WScript.Echo "Usage: cscript generate_single_csv.vbs csvfile.csv TableName"
    WScript.Quit 1
End If

strCsvFile = WScript.Arguments(0)
strTableName = WScript.Arguments(1)

' Determine output filename
Select Case strTableName
    Case "Journeyperson_Candidates_OOWL"
        strSqlOutput = "d:\Workspace\Github\unionhall_compliance\sql_1_journeyperson.sql"
        strColumnMap = "[Position],[Name],[DuesStatus],[PrimaryAffiliate],[Phone],[Classification],[LastCompany],[LastActivity],[OnDate],[Group],[CandidateStatus],[Hours],[Added],[Suspended],[WorkZones],[Dispatched],[Ethnicity],[IANumber]"
    Case "Person_Certification_Ethnicity"
        strSqlOutput = "d:\Workspace\Github\unionhall_compliance\sql_2_certification.sql"
        strColumnMap = "[IANumber],[Member],[Certification],[Ethnicity]"
    Case "Person_Skill_Ethnicity"
        strSqlOutput = "d:\Workspace\Github\unionhall_compliance\sql_3_skill.sql"
        strColumnMap = "[IANumber],[Member],[Skill],[Ethnicity]"
    Case "People_Journeyperson_CurrentSusFor"
        strSqlOutput = "d:\Workspace\Github\unionhall_compliance\sql_5_people.sql"
        strColumnMap = "[EmptyCol],[Name],[Role],[SSN],[IANumber],[Company],[BusinessAgent],[Status],[CurrentJobClass],[Organization],[Location],[Email],[Groups],[Inactive],[EmploymentContactType],[Ethnicity]"
End Select

If Not objFSO.FileExists(strCsvFile) Then
    WScript.Echo "Error: File not found: " & strCsvFile
    WScript.Quit 1
End If

Set objFile = objFSO.OpenTextFile(strCsvFile, 1)
strLine = objFile.ReadLine

' Parse header
arrHeaders = Split(strLine, ",")
For i = 0 To UBound(arrHeaders)
    arrHeaders(i) = Trim(Replace(arrHeaders(i), """", ""))
Next

strSql = "USE UnionHallUI;" & vbCrLf & vbCrLf

intRowCount = 0
Do While Not objFile.AtEndOfStream
    strLine = Trim(objFile.ReadLine)
    
    If Len(strLine) > 0 Then
        intRowCount = intRowCount + 1
        
        ' Parse CSV line
        arrValues = ParseCSVLine(strLine)
        
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

WScript.Echo "OK: " & strTableName & " - " & intRowCount & " rows -> " & strSqlOutput

Function ParseCSVLine(strLine)
    Dim arrResult(), strCurrent, inQuotes, i, intIndex, strChar
    
    ReDim arrResult(0)
    intIndex = 0
    strCurrent = ""
    inQuotes = False
    
    For i = 1 To Len(strLine)
        strChar = Mid(strLine, i, 1)
        
        If strChar = """" Then
            inQuotes = Not inQuotes
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
    ParseCSVLine = arrResult
End Function
