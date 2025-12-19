USE [UnionHall]
GO
/****** Object:  Table [dbo].[CMP_ReviewedHires]    Script Date: 12/18/2025 1:04:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CMP_ReviewedHires](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[EmployerID] [nvarchar](50) NOT NULL,
	[ContractorName] [nvarchar](100) NOT NULL,
	[MemberName] [nvarchar](100) NOT NULL,
	[IANumber] [int] NOT NULL,
	[StartDate] [datetime2](0) NOT NULL,
	[HireType] [nvarchar](20) NOT NULL,
	[IsReviewed] [bit] NOT NULL,
	[IsExcluded] [bit] NULL,
	[EndDate] [datetime2](0) NULL,
	[ContractorID] [int] NOT NULL,
	[IsInactive] [bit] NOT NULL,
	[ReviewedDate] [datetimeoffset](7) NULL,
	[ExcludedComplianceRules] [nvarchar](255) NULL,
	[CreatedByUserName] [nvarchar](100) NOT NULL,
	[CreatedByName] [nvarchar](100) NOT NULL,
	[CreatedOn] [datetime2](0) NOT NULL,
 CONSTRAINT [PK__CMP_Revi__3214EC070028CEE0] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[CMP_HireData]    Script Date: 12/18/2025 1:04:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[CMP_HireData]
AS
SELECT        TOP (100) PERCENT EmployerID, ContractorName, MemberName, IANumber, StartDate, HireType, IsReviewed, IsExcluded, EndDate, ContractorID, ReviewedDate
FROM            dbo.CMP_ReviewedHires
WHERE        (IsInactive = 0) AND (ExcludedComplianceRules IS NULL)
ORDER BY Id
GO
/****** Object:  Table [dbo].[CMP_Modes]    Script Date: 12/18/2025 1:04:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CMP_Modes](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[mode_name] [nvarchar](10) NULL,
	[mode_value] [int] NULL,
 CONSTRAINT [PK_CMP_Modes] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CMP_ReportDetails]    Script Date: 12/18/2025 1:04:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CMP_ReportDetails](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[RunId] [bigint] NOT NULL,
	[EmployerId] [nvarchar](100) NULL,
	[ContractorId] [int] NULL,
	[ContractorName] [varchar](255) NULL,
	[MemberName] [varchar](255) NULL,
	[IANumber] [nvarchar](100) NULL,
	[StartDate] [date] NULL,
	[HireType] [nvarchar](50) NULL,
	[ComplianceStatus] [varchar](50) NULL,
	[DirectCount] [int] NULL,
	[DispatchNeeded] [int] NULL,
	[NextHireDispatch] [varchar](1) NULL,
	[ReviewedDate] [datetimeoffset](7) NULL,
 CONSTRAINT [PK_CMP_ReportDetails] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CMP_Reports]    Script Date: 12/18/2025 1:04:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CMP_Reports](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[RunId] [bigint] NOT NULL,
	[EmployerId] [nvarchar](100) NULL,
	[ContractorId] [int] NULL,
	[ContractorName] [varchar](255) NULL,
	[ComplianceStatus] [varchar](50) NULL,
	[DispatchNeeded] [int] NULL,
	[NextHireDispatch] [varchar](1) NULL,
 CONSTRAINT [PK_CMP_Report] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CMP_Runs]    Script Date: 12/18/2025 1:04:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CMP_Runs](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[ReportDate] [date] NULL,
	[StartDate] [date] NULL,
	[ModeId] [int] NULL,
	[Run] [int] NULL,
 CONSTRAINT [PK_CMP_Runs] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[CMP_ReportDetails]  WITH CHECK ADD  CONSTRAINT [FK_CMP_ReportDetails_CMP_Runs] FOREIGN KEY([RunId])
REFERENCES [dbo].[CMP_Runs] ([id])
GO
ALTER TABLE [dbo].[CMP_ReportDetails] CHECK CONSTRAINT [FK_CMP_ReportDetails_CMP_Runs]
GO
ALTER TABLE [dbo].[CMP_Reports]  WITH CHECK ADD  CONSTRAINT [FK_CMP_Reports_CMP_Runs] FOREIGN KEY([RunId])
REFERENCES [dbo].[CMP_Runs] ([id])
GO
ALTER TABLE [dbo].[CMP_Reports] CHECK CONSTRAINT [FK_CMP_Reports_CMP_Runs]
GO
ALTER TABLE [dbo].[CMP_Runs]  WITH CHECK ADD  CONSTRAINT [FK_CMP_Run_CMP_Modes] FOREIGN KEY([ModeId])
REFERENCES [dbo].[CMP_Modes] ([id])
GO
ALTER TABLE [dbo].[CMP_Runs] CHECK CONSTRAINT [FK_CMP_Run_CMP_Modes]
GO
