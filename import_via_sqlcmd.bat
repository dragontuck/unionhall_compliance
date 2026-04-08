@echo off
REM Script to convert CSV files to SQL and import them

setlocal enabledelayedexpansion

REM Define paths
set SKILLS_DIR=d:\Workspace\Github\unionhall_compliance\Data\skills
set SQL_DIR=d:\Workspace\Github\unionhall_compliance
set SERVER=DESKTOP-DI29PVA\MSSQLSERVER01
set DATABASE=UnionHallUI

echo Generating SQL files from CSV...

REM Generate SQL for each CSV file
cscript.exe "%SQL_DIR%\generate_single_csv.vbs" "%SKILLS_DIR%\1_Journeyperson Candidates_OOWL_20260327.csv" "Journeyperson_Candidates_OOWL"
cscript.exe "%SQL_DIR%\generate_single_csv.vbs" "%SKILLS_DIR%\2_Person_Certification_Ethnicity_20260317.csv" "Person_Certification_Ethnicity"
cscript.exe "%SQL_DIR%\generate_single_csv.vbs" "%SKILLS_DIR%\3_Person_Skill_Ethnicity_20260317.csv" "Person_Skill_Ethnicity"
cscript.exe "%SQL_DIR%\generate_single_csv.vbs" "%SKILLS_DIR%\5_People_Journeyperson_CurrentSusFor_20260327.csv" "People_Journeyperson_CurrentSusFor"

echo.
echo Importing data via sqlcmd...

REM Import each SQL file
echo.
echo Importing: 1_Journeyperson Candidates...
sqlcmd -S "%SERVER%" -d "%DATABASE%" -i "%SQL_DIR%\sql_1_journeyperson.sql"

echo.
echo Importing: 2_Person Certification Ethnicity...
sqlcmd -S "%SERVER%" -d "%DATABASE%" -i "%SQL_DIR%\sql_2_certification.sql"

echo.
echo Importing: 3_Person Skill Ethnicity...
sqlcmd -S "%SERVER%" -d "%DATABASE%" -i "%SQL_DIR%\sql_3_skill.sql"

echo.
echo Importing: 5_People Journeyperson Current...
sqlcmd -S "%SERVER%" -d "%DATABASE%" -i "%SQL_DIR%\sql_5_people.sql"

echo.
echo Verifying imports...
sqlcmd -S "%SERVER%" -d "%DATABASE%" -Q "SELECT 'Journeyperson_Candidates_OOWL' as [Table], COUNT(*) as [Row Count] FROM Journeyperson_Candidates_OOWL UNION ALL SELECT 'Person_Certification_Ethnicity', COUNT(*) FROM Person_Certification_Ethnicity UNION ALL SELECT 'Person_Skill_Ethnicity', COUNT(*) FROM Person_Skill_Ethnicity UNION ALL SELECT 'People_Journeyperson_CurrentSusFor', COUNT(*) FROM People_Journeyperson_CurrentSusFor"

echo.
echo Import complete!
