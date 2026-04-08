USE UnionHallUI;

-- Table 1: Journeyperson Candidates
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Journeyperson_Candidates_OOWL')
BEGIN
    CREATE TABLE dbo.Journeyperson_Candidates_OOWL (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Position INT,
        Name NVARCHAR(100),
        DuesStatus NVARCHAR(50),
        PrimaryAffiliate NVARCHAR(MAX),
        Phone NVARCHAR(20),
        Classification NVARCHAR(100),
        LastCompany NVARCHAR(MAX),
        LastActivity NVARCHAR(MAX),
        OnDate NVARCHAR(50),
        [Group] NVARCHAR(50),
        CandidateStatus NVARCHAR(50),
        Hours INT,
        Added NVARCHAR(50),
        Suspended NVARCHAR(10),
        WorkZones NVARCHAR(MAX),
        Dispatched NVARCHAR(10),
        Ethnicity NVARCHAR(50),
        IANumber NVARCHAR(50)
    )
    PRINT 'Created table: Journeyperson_Candidates_OOWL'
END

-- Table 2: Person Certification Ethnicity
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Person_Certification_Ethnicity')
BEGIN
    CREATE TABLE dbo.Person_Certification_Ethnicity (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        IANumber NVARCHAR(50),
        Member NVARCHAR(100),
        Certification NVARCHAR(MAX),
        Ethnicity NVARCHAR(50)
    )
    PRINT 'Created table: Person_Certification_Ethnicity'
END

-- Table 3: Person Skill Ethnicity
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Person_Skill_Ethnicity')
BEGIN
    CREATE TABLE dbo.Person_Skill_Ethnicity (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        IANumber NVARCHAR(50),
        Member NVARCHAR(100),
        Skill NVARCHAR(MAX),
        Ethnicity NVARCHAR(50)
    )
    PRINT 'Created table: Person_Skill_Ethnicity'
END

-- Table 4: People Journeyperson Current Sus For
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'People_Journeyperson_CurrentSusFor')
BEGIN
    CREATE TABLE dbo.People_Journeyperson_CurrentSusFor (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        EmptyCol NVARCHAR(MAX),
        Name NVARCHAR(100),
        Role NVARCHAR(50),
        SSN NVARCHAR(20),
        IANumber NVARCHAR(50),
        Company NVARCHAR(MAX),
        BusinessAgent NVARCHAR(100),
        Status NVARCHAR(50),
        CurrentJobClass NVARCHAR(100),
        Organization NVARCHAR(100),
        Location NVARCHAR(100),
        Email NVARCHAR(100),
        Groups NVARCHAR(MAX),
        Inactive NVARCHAR(10),
        EmploymentContactType NVARCHAR(50),
        Ethnicity NVARCHAR(50)
    )
    PRINT 'Created table: People_Journeyperson_CurrentSusFor'
END

PRINT ''
PRINT 'All tables created/verified. Ready for data import.'
