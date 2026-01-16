export interface ComplianceRun {
    id: number;
    reviewedDate: string;
    modeName: string;
    run: number;
}

export interface ComplianceReport {
    id: number;
    runId: number;
    employerId: string;
    contractorId: number;
    contractorName: string;
    complianceStatus: string;
    directCount: number;
    dispatchNeeded: number;
    nextHireDispatch: string;
    noteCount: number;
}

export interface ComplianceReportDetail {
    id: number;
    runId: number;
    employerId: string;
    contractorId: number;
    contractorName: string;
    memberName: string;
    iaNumber: string;
    startDate: string;
    hireType: string;
    complianceStatus: string;
    directCount: number;
    dispatchNeeded: number;
    nextHireDispatch: string;
    reviewedDate: string;
    modeName: string;
}

export interface RecentHireData {
    employerId: string;
    contractorId: number;
    contractorName: string;
    memberName: string;
    iaNumber: string;
    startDate: string;
    hireType: string;
    reviewedDate: string;
}


export interface ReportNote {
    note: string;
    createdDate: string;
    createdBy: string;
}

export interface HireData {
    Id: number;
    EmployerID: string;
    ContractorName: string;
    MemberName: string;
    IANumber: number;
    StartDate: string;
    HireType: string;
    IsReviewed: boolean;
    IsExcluded: boolean;
    EndDate: string;
    ContractorID: number;
    ReviewedDate: string;
}

export interface Mode {
    id: number;
    mode_name: string;
    mode_value: number;
}

export interface RunRequest {
    reviewedDate: string;
    mode: string;
    dryRun?: boolean;
}

export interface ExcelExportData {
    runId: number;
    details: ComplianceReportDetail[];
    reports: ComplianceReport[];
}
