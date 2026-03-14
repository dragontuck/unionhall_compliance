/**
 * Feature-specific API interfaces - Interface Segregation Principle
 * Clients depend only on interfaces they actually use
 * Dependency Inversion Principle: Depend on abstractions, not concrete implementations
 */

import type {
    ComplianceRun,
    ComplianceReport,
    ComplianceReportDetail,
    Mode,
    RunRequest,
    ExcelExportData,
    HireData,
    RecentHireData,
    ReportNote,
    ContractorBlacklist,
} from '../../types';

/**
 * IRunsAPI - Compliance run operations
 * Clients: Dashboard, Reports
 */
export interface IRunsAPI {
    getRuns(filters?: { reviewedDate?: string; modeId?: number }): Promise<ComplianceRun[]>;
    getRunById(runId: number): Promise<ComplianceRun>;
    executeRun(request: RunRequest): Promise<ComplianceRun>;
}

/**
 * IImportAPI - Data import operations
 * Clients: Dashboard (FileUpload component)
 */
export interface IImportAPI {
    importHireData(file: File): Promise<{ message: string; rowsImported: number }>;
    importContractorSnapshots(file: File): Promise<{ message: string; rowsImported: number }>;
}

/**
 * IReportsAPI - Report retrieval and filtering
 * Clients: Reports page, ReportViewer
 */
export interface IReportsAPI {
    getReports(filters?: {
        runId?: number;
        contractorId?: number;
        employerId?: string;
    }): Promise<ComplianceReport[]>;
    getReportsByRun(runId: number): Promise<ComplianceReport[]>;
}

/**
 * IReportDetailsAPI - Detailed report data
 * Clients: Reports page, ReportViewer
 */
export interface IReportDetailsAPI {
    getReportDetails(filters?: {
        runId?: number;
        contractorId?: number;
        contractorName?: string;
        employerId?: string;
    }): Promise<ComplianceReportDetail[]>;
    getReportDetailsByRun(runId: number): Promise<ComplianceReportDetail[]>;
    getLastHiresByRun(runId: number): Promise<ComplianceReportDetail[]>;
    getRecentHiresByRun(runId: number): Promise<RecentHireData[]>;
    getRunReport(runId: number): Promise<ComplianceReport[]>;
}

/**
 * IReportNotesAPI - Report note retrieval
 * Clients: Reports page
 */
export interface IReportNotesAPI {
    getReportNotesByReportId(reportId: number): Promise<ReportNote[]>;
    getReportNotesByEmployerId(employerId: string): Promise<ReportNote[]>;
    getNotesByEmployerId(employerId: string): Promise<ReportNote[]>;
}

/**
 * IHireDataAPI - Raw hire data access
 * Clients: Dashboard
 */
export interface IHireDataAPI {
    getRawHireData(reviewedDate?: string): Promise<HireData[]>;
}

/**
 * IModeAPI - Compliance mode retrieval
 * Clients: Dashboard (RunExecutor)
 */
export interface IModeAPI {
    getModes(): Promise<Mode[]>;
}

/**
 * IExcelExportAPI - Excel export operations
 * Clients: Reports page (ReportViewer)
 */
export interface IExcelExportAPI {
    exportRunToExcel(runId: number): Promise<Blob>;
    getExcelExportData(runId: number): Promise<ExcelExportData>;
}

/**
 * IComplianceReportAPI - Compliance report modifications
 * Clients: Reports page (ReportViewer)
 */
export interface IComplianceReportAPI {
    updateComplianceReport(
        reportDetailId: number,
        updates: {
            employerId?: string;
            directCount?: number;
            dispatchNeeded?: number;
            nextHireDispatch?: string;
            status?: string;
            note?: string;
            changedBy?: string;
        }
    ): Promise<ComplianceReport>;
    deleteComplianceReport(
        reportId: number,
        contractorToDelete: {
            employerId?: string;
            note?: string;
            changedBy?: string;
        }
    ): Promise<void>;
}

/**
 * IBlacklistAPI - Contractor blacklist operations
 * Clients: ContractorBlacklist page
 */
export interface IBlacklistAPI {
    getBlacklist(): Promise<ContractorBlacklist[]>;
    getBlacklistIncludingDeleted(): Promise<ContractorBlacklist[]>;
    getBlacklistById(id: number): Promise<ContractorBlacklist>;
    getBlacklistByEmployerId(employerId: string): Promise<ContractorBlacklist[]>;
    createBlacklist(data: {
        employerId: string;
        contractorName: string;
    }): Promise<ContractorBlacklist>;
    updateBlacklist(
        id: number,
        data: {
            contractorName: string;
        }
    ): Promise<ContractorBlacklist>;
    deleteBlacklist(id: number): Promise<ContractorBlacklist>;
}

/**
 * IApiClient - Composite interface combining all API operations
 * For backward compatibility and full API access
 * Note: Consider whether clients actually need the full interface
 */
export interface IApiClient
    extends IRunsAPI,
    IImportAPI,
    IReportsAPI,
    IReportDetailsAPI,
    IReportNotesAPI,
    IHireDataAPI,
    IModeAPI,
    IExcelExportAPI,
    IComplianceReportAPI,
    IBlacklistAPI { }
