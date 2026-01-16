import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
    ComplianceRun,
    ComplianceReport,
    ComplianceReportDetail,
    Mode,
    RunRequest,
    ExcelExportData,
    HireData,
    RecentHireData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ComplianceApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    // Runs
    async getRuns(filters?: {
        reviewedDate?: string;
        modeId?: number;
    }): Promise<ComplianceRun[]> {
        const { data } = await this.api.get<ComplianceRun[]>('/runs', { params: filters });
        return data;
    }

    async getRunById(runId: number): Promise<ComplianceRun> {
        const { data } = await this.api.get<ComplianceRun>(`/runs/${runId}`);
        return data;
    }

    async executeRun(request: RunRequest): Promise<ComplianceRun> {
        const { data } = await this.api.post<ComplianceRun>('/runs/execute', request);
        return data;
    }

    async importHireData(file: File): Promise<{ message: string; rowsImported: number }> {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await this.api.post('/import/hires', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    // Reports
    async getReports(filters?: {
        runId?: number;
        contractorId?: number;
        employerId?: string;
    }): Promise<ComplianceReport[]> {
        const { data } = await this.api.get<ComplianceReport[]>('/reports', { params: filters });
        return data;
    }

    async getReportsByRun(runId: number): Promise<ComplianceReport[]> {
        const { data } = await this.api.get<ComplianceReport[]>(`/reports/run/${runId}`);
        return data;
    }

    // Report Details
    async getReportDetails(filters?: {
        runId?: number;
        contractorId?: number;
        contractorName?: string;
        employerId?: string;
    }): Promise<ComplianceReportDetail[]> {
        const { data } = await this.api.get<ComplianceReportDetail[]>('/report-details', {
            params: filters,
        });
        return data;
    }

    async getReportDetailsByRun(runId: number): Promise<ComplianceReportDetail[]> {
        const { data } = await this.api.get<ComplianceReportDetail[]>(
            `/report-details/run/${runId}`
        );
        return data;
    }

    async getLastHiresByRun(runId: number): Promise<ComplianceReportDetail[]> {
        const { data } = await this.api.get<ComplianceReportDetail[]>(
            `/last-hires/run/${runId}`
        );
        return data;
    }

    async getRecentHiresByRun(runId: number): Promise<RecentHireData[]> {
        const { data } = await this.api.get<RecentHireData[]>(
            `/recent-hires/run/${runId}`
        );
        return data;
    }

    async getRunReport(runId: number): Promise<ComplianceReport[]> {
        const { data } = await this.api.get<ComplianceReport[]>(
            `/export/report/${runId}`
        );
        return data;
    }



    // Raw Hire Data
    async getRawHireData(reviewedDate?: string): Promise<HireData[]> {
        const { data } = await this.api.get<HireData[]>('/hire-data', {
            params: { reviewedDate },
        });
        return data;
    }

    // Modes
    async getModes(): Promise<Mode[]> {
        const { data } = await this.api.get<Mode[]>('/modes');
        return data;
    }

    // Excel Export
    async exportRunToExcel(
        runId: number
    ): Promise<Blob> {
        const { data } = await this.api.get(`/export/run/${runId}`, {
            responseType: 'blob',
        });
        return data;
    }

    async getExcelExportData(runId: number): Promise<ExcelExportData> {
        const { data } = await this.api.get<ExcelExportData>(`/export/data/${runId}`);
        return data;
    }
}

export const apiService = new ComplianceApiService();
