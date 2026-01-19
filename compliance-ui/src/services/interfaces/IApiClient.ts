/**
 * IApiClient - Interface for API interactions
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
} from '../../types';

export interface IApiClient {
    // Runs
    getRuns(filters?: { reviewedDate?: string; modeId?: number }): Promise<ComplianceRun[]>;
    getRunById(runId: number): Promise<ComplianceRun>;
    executeRun(request: RunRequest): Promise<ComplianceRun>;

    // Import
    importHireData(file: File): Promise<{ message: string; rowsImported: number }>;

    // Reports
    getReports(filters?: {
        runId?: number;
        contractorId?: number;
        employerId?: string;
    }): Promise<ComplianceReport[]>;
    getReportsByRun(runId: number): Promise<ComplianceReport[]>;

    // Report Details
    getReportDetails(filters?: {
        runId?: number;
        contractorId?: number;
        contractorName?: string;
        employerId?: string;
    }): Promise<ComplianceReportDetail[]>;
    getReportDetailsByRun(runId: number): Promise<ComplianceReportDetail[]>;
    getLastHiresByRun(runId: number): Promise<ComplianceReportDetail[]>;
    getRecentHiresByRun(runId: number): Promise<RecentHireData[]>;

    // Report Summary
    getRunReport(runId: number): Promise<ComplianceReport[]>;

    // Report Notes
    getReportNotesByReportId(reportId: number): Promise<ReportNote[]>;
    getReportNotesByEmployerId(employerId: string): Promise<ReportNote[]>;
    getNotesByEmployerId(employerId: string): Promise<ReportNote[]>;

    // Raw Hire Data
    getRawHireData(reviewedDate?: string): Promise<HireData[]>;

    // Modes
    getModes(): Promise<Mode[]>;

    // Excel Export
    exportRunToExcel(runId: number): Promise<Blob>;
    getExcelExportData(runId: number): Promise<ExcelExportData>;

    // Update
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
}
