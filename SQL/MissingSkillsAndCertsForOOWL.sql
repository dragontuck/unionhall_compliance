-- SQL Query: Missing certifications and skills for OOWL journeyperson candidates
-- Optimized: base tables scanned once each; correlated subqueries replaced with
-- set-based CTEs (CROSS JOIN + LEFT JOIN anti-join pattern) + STRING_AGG.
-- Compatible with SQL Server 2008+ using STUFF/FOR XML PATH.

USE UnionHallUI;

WITH
-- Count certifications per person that are in the frequency list
cert AS (
    SELECT
        pce.[IANumber],
        pce.[Member],
        COUNT(DISTINCT pce.[Certification]) AS [CertificationCount]
    FROM dbo.Person_Certification_Ethnicity pce
    INNER JOIN dbo.Skill_Certification_Frequencies scf ON pce.[Certification] = scf.[Name]
    WHERE scf.[Type] = 'Certification'
    GROUP BY pce.[IANumber], pce.[Member]
),
-- Count skills per person that are in the frequency list
skill AS (
    SELECT
        pse.[IANumber],
        pse.[Member],
        COUNT(DISTINCT pse.[Skill]) AS [SkillCount]
    FROM dbo.Person_Skill_Ethnicity pse
    INNER JOIN dbo.Skill_Certification_Frequencies scf ON pse.[Skill] = scf.[Name]
    WHERE scf.[Type] = 'Skill'
    GROUP BY pse.[IANumber], pse.[Member]
),
-- All certifications in the frequency list (scanned once)
all_certs AS (
    SELECT ID, [Name] FROM dbo.Skill_Certification_Frequencies WHERE [Type] = 'Certification'
),
-- All skills in the frequency list (scanned once)
all_skills AS (
    SELECT ID, [Name] FROM dbo.Skill_Certification_Frequencies WHERE [Type] = 'Skill'
),
-- Certifications each person already holds, pre-joined (scanned once)
person_has_cert AS (
    SELECT DISTINCT pce.IANumber, scf.ID
    FROM dbo.Person_Certification_Ethnicity pce
    INNER JOIN dbo.Skill_Certification_Frequencies scf ON pce.[Certification] = scf.[Name]
    WHERE scf.[Type] = 'Certification'
),
-- Skills each person already holds, pre-joined (scanned once)
person_has_skill AS (
    SELECT DISTINCT pse.IANumber, scf.ID
    FROM dbo.Person_Skill_Ethnicity pse
    INNER JOIN dbo.Skill_Certification_Frequencies scf ON pse.[Skill] = scf.[Name]
    WHERE scf.[Type] = 'Skill'
),
-- One row per (person, missing certification) — anti-join via LEFT JOIN / IS NULL
missing_cert_rows AS (
    SELECT oowl.IANumber, ac.[Name]
    FROM (SELECT DISTINCT IANumber FROM [dbo].[Journeyperson_Candidates_OOWL]) oowl
    CROSS JOIN all_certs ac
    LEFT JOIN person_has_cert phc ON phc.IANumber = oowl.IANumber AND phc.ID = ac.ID
    WHERE phc.ID IS NULL
),
-- One row per (person, missing skill) — anti-join via LEFT JOIN / IS NULL
missing_skill_rows AS (
    SELECT oowl.IANumber, as_.[Name]
    FROM (SELECT DISTINCT IANumber FROM [dbo].[Journeyperson_Candidates_OOWL]) oowl
    CROSS JOIN all_skills as_
    LEFT JOIN person_has_skill phs ON phs.IANumber = oowl.IANumber AND phs.ID = as_.ID
    WHERE phs.ID IS NULL
),
-- Aggregate certifications held per person
held_certs as (
    SELECT
        pce.IANumber,
        STUFF((
            SELECT ' | ' + i.[Certification]
            FROM dbo.Person_Certification_Ethnicity i
            WHERE i.IANumber = pce.IANumber
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 3, '') AS HeldCertifications
    FROM dbo.Person_Certification_Ethnicity pce
    GROUP BY pce.IANumber
),
-- Aggregate certifications held per person
held_skills as (
    SELECT
        pse.IANumber,
        STUFF((
            SELECT ' | ' + i.[Skill]
            FROM dbo.Person_Skill_Ethnicity i
            WHERE i.IANumber = pse.IANumber
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 3, '') AS HeldSkills
    FROM dbo.Person_Skill_Ethnicity pse
    GROUP BY pse.IANumber
),
-- Aggregate missing certifications per person (computed once, joined in final SELECT)
missing_certs AS (
    SELECT
        r.IANumber,
        STUFF((
            SELECT ' | ' + i.[Name]
            FROM missing_cert_rows i
            WHERE i.IANumber = r.IANumber
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 3, '') AS MissingCertifications
    FROM missing_cert_rows r
    GROUP BY r.IANumber
),
-- Aggregate missing skills per person (computed once, joined in final SELECT)
missing_skills AS (
    SELECT
        r.IANumber,
        STUFF((
            SELECT ' | ' + i.[Name]
            FROM missing_skill_rows i
            WHERE i.IANumber = r.IANumber
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 3, '') AS MissingSkills
    FROM missing_skill_rows r
    GROUP BY r.IANumber
),
-- Enrich population with cert/skill counts
pop AS (
    SELECT
        pop.IANumber,
        pop.[Name],
        pop.Email,
        pop.Ethnicity,
        ISNULL(cert.[CertificationCount], 0) AS [FreqCertificationCount],
        ISNULL(skill.[SkillCount], 0) AS [FreqSkillCount]
    FROM [dbo].[People_Journeyperson_CurrentSusFor] pop
    LEFT JOIN cert  ON pop.IANumber = cert.IANumber
    LEFT JOIN skill ON pop.IANumber = skill.IANumber
)
SELECT
    oowl.Position,
    oowl.IANumber,
    oowl.[Name],
    oowl.Phone,
    pop.Email,
    oowl.Ethnicity,
    oowl.LastCompany,
    oowl.LastActivity,
    pop.[FreqCertificationCount],
    pop.[FreqSkillCount],
    mc.MissingCertifications,
    ms.MissingSkills,
	isnull(hc.HeldCertifications, 'N/A') as HeldCertifications,
	isnull(hs.HeldSkills, 'N/A') as HeldSkills
FROM [dbo].[Journeyperson_Candidates_OOWL] AS oowl
INNER JOIN pop          ON oowl.IANumber = pop.IANumber
LEFT JOIN  missing_certs mc ON mc.IANumber = oowl.IANumber
LEFT JOIN  missing_skills ms ON ms.IANumber = oowl.IANumber
left join held_certs hc on hc.IANumber = oowl.IANumber
left join held_skills hs on hs.IANumber = oowl.IANumber

order by oowl.Position;


