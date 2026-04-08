-- SQL Query: Count certifications by IANumber and Member
-- Shows certifications that MATCH the list in Skill_Certification_Frequencies

USE UnionHallUI;

SELECT 
    pce.[IANumber],
    pce.[Member],
    COUNT(DISTINCT pce.[Certification]) as [Certification Count],
    STRING_AGG(pce.[Certification], ', ') as [Certifications]
FROM 
    dbo.Person_Certification_Ethnicity pce
INNER JOIN 
    dbo.Skill_Certification_Frequencies scf ON pce.[Certification] = scf.[Name]
WHERE 
    scf.[Type] = 'Certification'
GROUP BY 
    pce.[IANumber],
    pce.[Member]
ORDER BY 
    [Certification Count] DESC,
    pce.[IANumber];

-- Alternative query without STRING_AGG (for older SQL Server versions)
-- Uncomment to use instead:

/*
SELECT 
    pce.[IANumber],
    pce.[Member],
    COUNT(DISTINCT pce.[Certification]) as [Certification Count]
FROM 
    dbo.Person_Certification_Ethnicity pce
INNER JOIN 
    dbo.Skill_Certification_Frequencies scf ON pce.[Certification] = scf.[Name]
WHERE 
    scf.[Type] = 'Certification'
GROUP BY 
    pce.[IANumber],
    pce.[Member]
ORDER BY 
    [Certification Count] DESC,
    pce.[IANumber];
*/

-- Summary query - Overall statistics
/*
SELECT 
    COUNT(DISTINCT pce.[IANumber]) as [Number of People with Tracked Certifications],
    COUNT(DISTINCT pce.[Certification]) as [Unique Tracked Certifications],
    AVG(cert_count.[cert_cnt]) as [Average Certifications per Person]
FROM 
    dbo.Person_Certification_Ethnicity pce
INNER JOIN 
    dbo.Skill_Certification_Frequencies scf ON pce.[Certification] = scf.[Name]
CROSS APPLY (
    SELECT COUNT(DISTINCT pce2.[Certification]) as cert_cnt
    FROM dbo.Person_Certification_Ethnicity pce2
    INNER JOIN dbo.Skill_Certification_Frequencies scf2 ON pce2.[Certification] = scf2.[Name]
    WHERE pce2.[IANumber] = pce.[IANumber]
) as cert_count
WHERE 
    scf.[Type] = 'Certification';
*/
