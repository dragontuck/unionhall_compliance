USE [UnionHall]
GO

SELECT [Id]
      ,[EmployerID]
      ,[ContractorName]
      ,[MemberName]
      ,[IANumber]
      ,[StartDate]
      ,[HireType]
      ,[IsReviewed]
      ,[IsExcluded]
      ,[EndDate]
      ,[ContractorID]
      ,[IsInactive]
      ,[ReviewedDate]
      ,[ExcludedComplianceRules]
      ,[CreatedByUserName]
      ,[CreatedByName]
      ,[CreatedOn]
  FROM [dbo].[CMP_ReviewedHires]
  where [EmployerID]=1013 and  [IANumber]=1197781
GO
select count(*) from [dbo].[CMP_ReviewedHires]

go
select * FROM [dbo].[CMP_ReviewedHires]
where [IsInactive] = 0 and ExcludedComplianceRules is null
--  truncate table [dbo].[CMP_ReviewedHires]