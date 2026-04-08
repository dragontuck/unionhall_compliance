-- SQL Server T-SQL Script to Import CSV
-- File: 4_Skill_and_Certification _Frequencies_20250606-20260327.csv

USE UnionHallUI;

-- Drop table if exists (optional - comment out to preserve data)
-- DROP TABLE IF EXISTS dbo.Skill_Certification_Frequencies;

-- Create table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Skill_Certification_Frequencies')
BEGIN
    CREATE TABLE dbo.Skill_Certification_Frequencies (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Type NVARCHAR(50) NOT NULL,
        Name NVARCHAR(MAX) NOT NULL,
        Frequency INT NOT NULL,
        ImportedDate DATETIME DEFAULT GETDATE()
    )
    PRINT 'Table created successfully'
END
ELSE
BEGIN
    PRINT 'Table already exists'
END

-- Import CSV using BULK INSERT
BEGIN TRY
    BULK INSERT dbo.Skill_Certification_Frequencies
    FROM 'd:\Workspace\Github\unionhall_compliance\Data\skills\4_Skill_and_Certification _Frequencies_20250606-20260327.csv'
    WITH (
        FIELDTERMINATOR = ',',
        ROWTERMINATOR = '\n',
        FIRSTROW = 2,
        TABLOCK
    )
    
    DECLARE @RowCount INT = @@ROWCOUNT
    PRINT 'Successfully imported ' + CAST(@RowCount AS VARCHAR(10)) + ' rows'
    
    -- Show sample data
    SELECT TOP 5 * FROM dbo.Skill_Certification_Frequencies
    
END TRY
BEGIN CATCH
    PRINT 'Error: ' + ERROR_MESSAGE()
END CATCH

-- Verify import
SELECT 
    Type,
    COUNT(*) as Count,
    SUM(Frequency) as Total_Frequency
FROM dbo.Skill_Certification_Frequencies
GROUP BY Type
