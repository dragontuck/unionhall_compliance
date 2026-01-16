
DECLARE @employerid AS NVARCHAR (100);
    DECLARE @contractorid AS INT;
    DECLARE @contractorName AS NVARCHAR (255);
    DECLARE @memberName AS NVARCHAR (255);
	DECLARE @IANumber AS NVARCHAR (100);
    DECLARE @startDate AS DATE;
    DECLARE @hireType AS NVARCHAR (50);
    DECLARE @hireRank AS INT;
	DECLARE @ReviewedDate AS datetimeoffset;

    DECLARE @ComplianceReport TABLE (
        ReportDate       DATE          ,
        EmployerId       NVARCHAR (100),
        ContractorId     INT           ,
        ContractorName   VARCHAR (255) ,
        ComplianceStatus VARCHAR (50)  ,
        DispatchNeeded   INT           ,
        NextHireDispatch VARCHAR (1)   );

    DECLARE @ComplianceReportDetail TABLE (
        EmployerId       NVARCHAR (100),
        ContractorId     INT           ,
        ContractorName   VARCHAR (255) ,
        MemberName       VARCHAR (255) ,
		IANumber		 NVARCHAR (100),
        StartDate        DATE          ,
        HireType         NVARCHAR (50) ,
        ComplianceStatus VARCHAR (50)  ,
        DirectCount      INT           ,
        DispatchNeeded   INT           ,
        NextHireDispatch VARCHAR (1)   ,
		ReviewedDate datetimeoffset  );

    --DECLARE @ContractorMapping TABLE (
    --    OldEmployerId     NVARCHAR (100),
    --    NewEmployerId     NVARCHAR (100),
    --    OldContractorId   INT           ,
    --    NewContractorId   INT           ,
    --    NewContractorName NVARCHAR (255));
    --INSERT  INTO @ContractorMapping (OldEmployerId, NewEmployerId, OldContractorId, NewContractorId, NewContractorName)
    --VALUES                         (601, 6001, -2899, -2698, 'KF MECHANICAL LLC MARK REC');
   
   
   
   DECLARE employer_cursor CURSOR
        FOR SELECT DISTINCT 
		
							--COALESCE (cm.NewEmployerId, t.EmployerId) AS EmployerId,
                            --COALESCE (cm.NewContractorId, t.ContractorId) AS ContractorId,
                            --COALESCE (cm.NewContractorName, t.ContractorName) AS ContractorName
EmployerId,
ContractorId,
ContractorName
            FROM   (SELECT EmployerId,
                           ContractorId,
                           ContractorName
                    FROM   dbo.CMP_HireData
                    WHERE  [StartDate] > '2025-12-14'
                    UNION
                    SELECT EmployerId,
                           ContractorId,
                           ContractorName
                    FROM   dbo.CMP_StartingPoint3to1) AS t;
                  -- LEFT OUTER JOIN
                   --@ContractorMapping AS cm
                  -- ON t.ContractorId = cm.OldContractorId
                     -- AND t.EmployerId = cm.OldEmployerId;
    OPEN employer_cursor;
    FETCH NEXT FROM employer_cursor INTO @EmployerId, @contractorid, @contractorName;
    WHILE @@FETCH_STATUS = 0
        BEGIN
            PRINT 'Processing ContractorId: ' + CAST (@contractorid AS VARCHAR);
            DECLARE @complianceStatus AS VARCHAR (1);
            DECLARE @dispatchNeeded AS INT, @directCount AS INT;
            DECLARE @NextHireDispatch AS VARCHAR (1);
            SET @complianceStatus = 'C';
            SET @dispatchNeeded = 0;
            SET @directCount = 0;
            SET @NextHireDispatch = 'N';

            DECLARE contractor_cursor CURSOR
                FOR SELECT s.StartDate,
							s.ReviewedDate,
                           s.MemberName,
						   s.IANumber,
                           s.HireType,
                           ROW_NUMBER() OVER (PARTITION BY s.ContractorName ORDER BY s.ReviewedDate) AS hire_rank
                    FROM   (SELECT StartDate,
                                   --COALESCE (cm.NewEmployerId, EmployerId) AS EmployerId,
                                   --COALESCE (cm.NewContractorId, ContractorID) AS ContractorID,
								   ReviewedDate,
								   EmployerId,
								   ContractorID,
                                   MemberName,
								   IANumber,
                                   HireType,
								   ContractorName
                                   --COALESCE (cm.NewContractorName, ContractorName) AS ContractorName
                            FROM   dbo.CMP_HireData
                                  -- LEFT OUTER JOIN @ContractorMapping AS cm ON CMP_HireData.ContractorID = cm.OldContractorId AND CMP_HireData.EmployerId = cm.OldEmployerId
                            WHERE  [StartDate] > '2025-12-14'
							AND 
							EmployerId = @employerid
                                   --AND (EmployerId = @employerid
                                   --     OR EmployerId IN (SELECT OldEmployerId
                                   --                       FROM   @ContractorMapping
                                   --                       WHERE  NewEmployerId = @employerid))
                            UNION
                            SELECT StartDate,
									ReviewedDate,
                                   --COALESCE (cm.NewEmployerId, EmployerId) AS EmployerId,
                                   --COALESCE (cm.NewContractorId, ContractorID) AS ContractorID,
								   EmployerId,
								   ContractorID,
                                   MemberName,
								   IANumber,
                                   HireType,
								   ContractorName
                            FROM   dbo.CMP_StartingPoint3to1
							WHERE  EmployerId = @employerid
                            --       LEFT OUTER JOIN
                            --       @ContractorMapping AS cm
                            --       ON CMP_StartingPoint.ContractorID = cm.OldContractorId
                            --          AND CMP_StartingPoint.EmployerId = cm.OldEmployerId
                            --WHERE  (EmployerId = @employerid
                            --        OR EmployerId IN (SELECT OldEmployerId
                            --                          FROM   @ContractorMapping
                            --                          WHERE  NewEmployerId = @employerid)
							) AS s;
            OPEN contractor_cursor;
            FETCH NEXT FROM contractor_cursor INTO @startDate, @ReviewedDate, @memberName, @IANumber, @hireType, @hireRank;
            WHILE @@FETCH_STATUS = 0
                BEGIN
                    IF @hireType = 'Dispatch'
                        BEGIN
                            IF @complianceStatus = 'C'
                               OR (@complianceStatus = 'N'
                                   AND @dispatchNeeded = 1)
                                BEGIN
                                    SET @dispatchNeeded = 0;
                                    SET @directCount = 0;
                                    SET @complianceStatus = 'C';
                                    SET @NextHireDispatch = 'N';
                                END
                            ELSE
                                BEGIN
                                    SET @dispatchNeeded = @dispatchNeeded - 1;
                                    SET @directCount = @directCount - 1;
                                END
                        END
                    ELSE
                        BEGIN
                            SET @directCount = @directCount + 1;
                            IF @complianceStatus = 'C'
                               AND (@directCount = 3)
                                BEGIN
                                    SET @NextHireDispatch = 'Y';
                                END
                            IF @complianceStatus = 'C'
                               AND (@directCount = 4)
                                BEGIN
                                    SET @complianceStatus = 'N';
                                    SET @dispatchNeeded = 1;
                                END
                            ELSE
                                BEGIN
                                    IF @directCount > 4
                                        BEGIN
                                            SET @complianceStatus = 'N';
                                            SET @dispatchNeeded = @dispatchNeeded + 1;
                                        END
                                END
                        END

INSERT  INTO @ComplianceReportDetail (EmployerId, ContractorName, ContractorId, MemberName, IANumber, StartDate, HireType, ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch, ReviewedDate)
VALUES
(@employerid, @contractorName, @contractorid, @memberName, @IANumber, @startDate, @hireType, CASE WHEN @complianceStatus = 'C' THEN 'Compliant' ELSE 'Noncompliant' END, @directCount, @dispatchNeeded, @NextHireDispatch, @ReviewedDate);
FETCH NEXT FROM contractor_cursor INTO @startDate, @ReviewedDate, @memberName, @IANumber, @hireType, @hireRank;
END

INSERT  INTO @ComplianceReport ([ReportDate], [EmployerId], [ContractorId], [ContractorName], [ComplianceStatus], [DispatchNeeded], [NextHireDispatch])
VALUES
(GETDATE(),
@employerid,
@contractorid,
@contractorName,
CASE WHEN @complianceStatus = 'C' THEN 'Compliant' ELSE 'Noncompliant' END, @dispatchNeeded, @NextHireDispatch);
            CLOSE contractor_cursor;
            DEALLOCATE contractor_cursor;
            FETCH NEXT FROM employer_cursor INTO @employerid, @contractorid, @contractorName;
        END
    CLOSE employer_cursor;
    DEALLOCATE employer_cursor;



------Outputs------


--Detailed
SELECT * FROM   @ComplianceReportDetail;

--Report
SELECT * FROM   @ComplianceReport;				

--Last 4			
WITH LastFourRecords AS (				
SELECT *,						
   ROW_NUMBER() OVER (PARTITION BY ContractorId ORDER BY ReviewedDate DESC) AS [Order #]					
FROM @ComplianceReportDetail WHERE 	MemberName NOT LIKE 'xxxx%'			
)				
SELECT * FROM LastFourRecords				
WHERE [Order #] <= 4							
ORDER BY ReviewedDate ASC, StartDate ASC;	

--Recent Hires
SELECT
 ContractorName AS [Contractor Name]
,MemberName AS [Member Name]
,IANumber AS [IA Number]
,StartDate AS [Start Date]
,HireType AS [Hire Type]
,ReviewedDate AS [Review Date]
,ComplianceStatus AS [Compliance Status]
,DispatchNeeded AS [Dispatches Needed]
FROM @ComplianceReportDetail
WHERE ReviewedDate >= (
	SELECT CAST(MAX(ReviewedDate) AS date) AS MaxReviewedDate
	FROM @ComplianceReportDetail
); -- Fix to use date only exclude time -- fixed