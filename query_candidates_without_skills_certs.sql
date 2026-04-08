-- SQL Query: Find Journeyperson Candidates OOWL with NO skills or certifications
-- This query returns candidates from Journeyperson_Candidates_OOWL who don't have any entries
-- in either Person_Skill_Ethnicity or Person_Certification_Ethnicity tables

USE UnionHallUI;

SELECT 
    j.[Position],
    j.[Name],
    j.[IANumber],
    j.[Classification],
    j.[Ethnicity],
    j.[DuesStatus],
    j.[Phone],
    j.[LastCompany],
    j.[LastActivity]
FROM 
    dbo.Journeyperson_Candidates_OOWL j
WHERE 
    -- Candidate Name is NOT in Person_Skill_Ethnicity table
    j.[Name] NOT IN (SELECT DISTINCT [Member] FROM dbo.Person_Skill_Ethnicity)
    AND
    -- Candidate Name is NOT in Person_Certification_Ethnicity table
    j.[Name] NOT IN (SELECT DISTINCT [Member] FROM dbo.Person_Certification_Ethnicity)
ORDER BY 
    j.[Position];

-- Alternative query using LEFT JOIN (may be more efficient for large datasets)
-- Uncomment to use instead:

/*
SELECT 
    j.[Position],
    j.[Name],
    j.[IANumber],
    j.[Classification],
    j.[Ethnicity],
    j.[DuesStatus],
    j.[Phone],
    j.[LastCompany],
    j.[LastActivity]
FROM 
    dbo.Journeyperson_Candidates_OOWL j
LEFT JOIN 
    dbo.Person_Skill_Ethnicity s ON j.[Name] = s.[Member]
LEFT JOIN 
    dbo.Person_Certification_Ethnicity c ON j.[Name] = c.[Member]
WHERE 
    s.[Member] IS NULL 
    AND c.[Member] IS NULL
ORDER BY 
    j.[Position];
*/
