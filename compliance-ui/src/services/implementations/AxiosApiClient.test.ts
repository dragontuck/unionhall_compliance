import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AxiosApiClient } from './AxiosApiClient';
import type { ComplianceRun, ComplianceReport, ComplianceReportDetail, HireData } from '../../types';

// Mock axios
vi.mock('axios');

describe('AxiosApiClient', () => {
    let apiClient: AxiosApiClient;
    let mockAxios: any;
    let mockApiInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock axios instance
        mockApiInstance = {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        };

        mockAxios = vi.mocked(axios);
        mockAxios.create = vi.fn().mockReturnValue(mockApiInstance);

        apiClient = new AxiosApiClient('http://localhost:3001/api');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with default base URL', () => {
            new AxiosApiClient();
            expect(axios.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: expect.any(String),
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        it('should create instance with custom base URL', () => {
            new AxiosApiClient('http://custom-api.com');
            expect(axios.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://custom-api.com',
                })
            );
        });
    });

    describe('getRuns', () => {
        it('should fetch runs without filters', async () => {
            const mockRuns = [
                { id: 1, reviewedDate: '2025-03-10', run: 1, modeName: 'Mode A' },
            ];
            mockApiInstance.get.mockResolvedValue({ data: mockRuns });

            const result = await apiClient.getRuns();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/runs', { params: undefined });
            expect(result).toEqual(mockRuns);
        });

        it('should fetch runs with filters', async () => {
            const mockRuns: ComplianceRun[] = [];
            const filters = { reviewedDate: '2025-03-10', modeId: 1 };
            mockApiInstance.get.mockResolvedValue({ data: mockRuns });

            await apiClient.getRuns(filters);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/runs', { params: filters });
        });
    });

    describe('getRunById', () => {
        it('should fetch a single run by ID', async () => {
            const mockRun = { id: 1, reviewedDate: '2025-03-10', run: 1, modeName: 'Mode A' };
            mockApiInstance.get.mockResolvedValue({ data: mockRun });

            const result = await apiClient.getRunById(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/runs/1');
            expect(result).toEqual(mockRun);
        });
    });

    describe('executeRun', () => {
        it('should execute a run with request data', async () => {
            const mockRequest = { modeName: 'Mode A' };
            const mockRun = { id: 1, ...mockRequest };
            mockApiInstance.post.mockResolvedValue({ data: mockRun });

            const result = await apiClient.executeRun(mockRequest as any);

            expect(mockApiInstance.post).toHaveBeenCalledWith('/runs', mockRequest);
            expect(result).toEqual(mockRun);
        });
    });

    describe('importHireData', () => {
        it('should import hire data from file', async () => {
            const mockFile = new File(['data'], 'hires.csv', { type: 'text/csv' });
            const mockResponse = { message: 'Success', rowsImported: 100 };
            mockApiInstance.post.mockResolvedValue({ data: mockResponse });

            const result = await apiClient.importHireData(mockFile);

            expect(mockApiInstance.post).toHaveBeenCalledWith(
                '/import/hires',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('importContractorSnapshots', () => {
        it('should import contractor snapshots from file', async () => {
            const mockFile = new File(['data'], 'snapshots.csv', { type: 'text/csv' });
            const mockResponse = { message: 'Success', rowsImported: 50 };
            mockApiInstance.post.mockResolvedValue({ data: mockResponse });

            const result = await apiClient.importContractorSnapshots(mockFile);

            expect(mockApiInstance.post).toHaveBeenCalledWith(
                '/import/contractor-snapshots',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getReports', () => {
        it('should fetch reports without filters', async () => {
            const mockReports = [{ id: 1, contractorName: 'Contractor A', complianceStatus: 'Compliant' }];
            mockApiInstance.get.mockResolvedValue({ data: mockReports });

            const result = await apiClient.getReports();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/reports', { params: undefined });
            expect(result).toEqual(mockReports);
        });

        it('should fetch reports with filters', async () => {
            const mockReports: ComplianceReport[] = [];
            const filters = { runId: 1, contractorId: 5 };
            mockApiInstance.get.mockResolvedValue({ data: mockReports });

            await apiClient.getReports(filters);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/reports', { params: filters });
        });
    });

    describe('getReportsByRun', () => {
        it('should fetch reports for specific run', async () => {
            const mockReports = [{ id: 1, contractorName: 'Contractor A' }];
            mockApiInstance.get.mockResolvedValue({ data: mockReports });

            const result = await apiClient.getReportsByRun(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/reports/run/1');
            expect(result).toEqual(mockReports);
        });
    });

    describe('getReportDetails', () => {
        it('should fetch report details without filters', async () => {
            const mockDetails = [{ id: 1, contractorName: 'Contractor A', memberName: 'John' }];
            mockApiInstance.get.mockResolvedValue({ data: mockDetails });

            const result = await apiClient.getReportDetails();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/report-details', { params: undefined });
            expect(result).toEqual(mockDetails);
        });

        it('should fetch report details with filters', async () => {
            const mockDetails: ComplianceReportDetail[] = [];
            const filters = { runId: 1, contractorName: 'Contractor A' };
            mockApiInstance.get.mockResolvedValue({ data: mockDetails });

            await apiClient.getReportDetails(filters);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/report-details', { params: filters });
        });
    });

    describe('getReportDetailsByRun', () => {
        it('should fetch report details for specific run', async () => {
            const mockDetails = [{ id: 1, contractorName: 'Contractor A' }];
            mockApiInstance.get.mockResolvedValue({ data: mockDetails });

            const result = await apiClient.getReportDetailsByRun(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/report-details/run/1');
            expect(result).toEqual(mockDetails);
        });
    });

    describe('getLastHiresByRun', () => {
        it('should fetch last hires for specific run', async () => {
            const mockLastHires = [{ id: 1, contractorName: 'Contractor A', hireDate: '2025-03-05' }];
            mockApiInstance.get.mockResolvedValue({ data: mockLastHires });

            const result = await apiClient.getLastHiresByRun(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/last-hires/run/1');
            expect(result).toEqual(mockLastHires);
        });
    });

    describe('getRecentHiresByRun', () => {
        it('should fetch recent hires for specific run', async () => {
            const mockRecentHires = [{ id: 1, contractorName: 'Contractor A' }];
            mockApiInstance.get.mockResolvedValue({ data: mockRecentHires });

            const result = await apiClient.getRecentHiresByRun(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/recent-hires/run/1');
            expect(result).toEqual(mockRecentHires);
        });
    });

    describe('getRunReport', () => {
        it('should fetch run report for export', async () => {
            const mockReports = [{ id: 1, contractorName: 'Contractor A' }];
            mockApiInstance.get.mockResolvedValue({ data: mockReports });

            const result = await apiClient.getRunReport(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/export/report/1');
            expect(result).toEqual(mockReports);
        });
    });

    describe('getReportNotesByReportId', () => {
        it('should fetch notes for specific report', async () => {
            const mockNotes = [{ id: 1, note: 'Test note', reportId: 1 }];
            mockApiInstance.get.mockResolvedValue({ data: mockNotes });

            const result = await apiClient.getReportNotesByReportId(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/report-notes/report/1');
            expect(result).toEqual(mockNotes);
        });
    });

    describe('getReportNotesByEmployerId', () => {
        it('should fetch notes for specific employer', async () => {
            const mockNotes = [{ id: 1, note: 'Test note', employerId: 'EMP001' }];
            mockApiInstance.get.mockResolvedValue({ data: mockNotes });

            const result = await apiClient.getReportNotesByEmployerId('EMP001');

            expect(mockApiInstance.get).toHaveBeenCalledWith('/report-notes/employer/EMP001');
            expect(result).toEqual(mockNotes);
        });
    });

    describe('getNotesByEmployerId', () => {
        it('should fetch notes by employer ID', async () => {
            const mockNotes = [{ id: 1, note: 'Test note', employerId: 'EMP001' }];
            mockApiInstance.get.mockResolvedValue({ data: mockNotes });

            const result = await apiClient.getNotesByEmployerId('EMP001');

            expect(mockApiInstance.get).toHaveBeenCalledWith('/report-notes/employer/EMP001');
            expect(result).toEqual(mockNotes);
        });
    });

    describe('getRawHireData', () => {
        it('should fetch raw hire data without date filter', async () => {
            const mockHireData = [{ id: 1, memberName: 'John Doe', hireDate: '2025-01-15' }];
            mockApiInstance.get.mockResolvedValue({ data: mockHireData });

            const result = await apiClient.getRawHireData();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/hire-data', { params: { reviewedDate: undefined } });
            expect(result).toEqual(mockHireData);
        });

        it('should fetch raw hire data with date filter', async () => {
            const mockHireData: HireData[] = [];
            mockApiInstance.get.mockResolvedValue({ data: mockHireData });

            await apiClient.getRawHireData('2025-03-10');

            expect(mockApiInstance.get).toHaveBeenCalledWith('/hire-data', { params: { reviewedDate: '2025-03-10' } });
        });
    });

    describe('getModes', () => {
        it('should fetch available modes', async () => {
            const mockModes = [{ id: 1, modeName: 'Mode A' }, { id: 2, modeName: 'Mode B' }];
            mockApiInstance.get.mockResolvedValue({ data: mockModes });

            const result = await apiClient.getModes();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/modes');
            expect(result).toEqual(mockModes);
        });
    });

    describe('exportRunToExcel', () => {
        it('should export run data as Excel blob', async () => {
            const mockBlob = new Blob(['data'], { type: 'application/vnd.ms-excel' });
            mockApiInstance.get.mockResolvedValue({ data: mockBlob });

            const result = await apiClient.exportRunToExcel(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/export/run/1', { responseType: 'blob' });
            expect(result).toEqual(mockBlob);
        });
    });

    describe('getExcelExportData', () => {
        it('should fetch Excel export data structure', async () => {
            const mockExportData = { runId: 1, reports: [], details: [] };
            mockApiInstance.get.mockResolvedValue({ data: mockExportData });

            const result = await apiClient.getExcelExportData(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/export/data/1');
            expect(result).toEqual(mockExportData);
        });
    });

    describe('updateComplianceReport', () => {
        it('should update compliance report with new data', async () => {
            const updates = { directCount: 10, dispatchNeeded: 0, status: 'Compliant' };
            const mockUpdated = { id: 1, ...updates };
            mockApiInstance.put.mockResolvedValue({ data: mockUpdated });

            const result = await apiClient.updateComplianceReport(1, updates);

            expect(mockApiInstance.put).toHaveBeenCalledWith('/report-details/1', updates);
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('deleteComplianceReport', () => {
        it('should delete compliance report with reason', async () => {
            const contractorData = { employerId: 'EMP001', note: 'Removed', changedBy: 'Admin' };
            mockApiInstance.post.mockResolvedValue({ data: {} });

            await apiClient.deleteComplianceReport(1, contractorData);

            expect(mockApiInstance.post).toHaveBeenCalledWith('/reports/1/delete', contractorData);
        });
    });

    describe('Blacklist Operations', () => {
        it('should fetch all active blacklist entries', async () => {
            const mockBlacklist = [{ Id: 1, EmployerID: 'EMP001', ContractorName: 'Contractor A' }];
            mockApiInstance.get.mockResolvedValue({ data: mockBlacklist });

            const result = await apiClient.getBlacklist();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/blacklist');
            expect(result).toEqual(mockBlacklist);
        });

        it('should fetch all blacklist entries including deleted', async () => {
            const mockBlacklist = [
                { Id: 1, EmployerID: 'EMP001', ContractorName: 'Contractor A', DeletedOn: null },
                { Id: 2, EmployerID: 'EMP002', ContractorName: 'Contractor B', DeletedOn: '2025-03-01' },
            ];
            mockApiInstance.get.mockResolvedValue({ data: mockBlacklist });

            const result = await apiClient.getBlacklistIncludingDeleted();

            expect(mockApiInstance.get).toHaveBeenCalledWith('/blacklist/all');
            expect(result).toEqual(mockBlacklist);
        });

        it('should fetch blacklist entry by ID', async () => {
            const mockEntry = { Id: 1, EmployerID: 'EMP001', ContractorName: 'Contractor A' };
            mockApiInstance.get.mockResolvedValue({ data: mockEntry });

            const result = await apiClient.getBlacklistById(1);

            expect(mockApiInstance.get).toHaveBeenCalledWith('/blacklist/1');
            expect(result).toEqual(mockEntry);
        });

        it('should fetch blacklist entries by employer ID', async () => {
            const mockEntries = [{ Id: 1, EmployerID: 'EMP001', ContractorName: 'Contractor A' }];
            mockApiInstance.get.mockResolvedValue({ data: mockEntries });

            const result = await apiClient.getBlacklistByEmployerId('EMP001');

            expect(mockApiInstance.get).toHaveBeenCalledWith('/blacklist/employer/EMP001');
            expect(result).toEqual(mockEntries);
        });

        it('should create new blacklist entry', async () => {
            const newEntry = { employerId: 'EMP001', contractorName: 'Contractor A' };
            const mockCreated = { Id: 1, EmployerID: 'EMP001', ContractorName: 'Contractor A' };
            mockApiInstance.post.mockResolvedValue({ data: mockCreated });

            const result = await apiClient.createBlacklist(newEntry);

            expect(mockApiInstance.post).toHaveBeenCalledWith('/blacklist', newEntry);
            expect(result).toEqual(mockCreated);
        });

        it('should update blacklist entry', async () => {
            const updates = { contractorName: 'Updated Contractor' };
            const mockUpdated = { Id: 1, EmployerID: 'EMP001', ContractorName: 'Updated Contractor' };
            mockApiInstance.put.mockResolvedValue({ data: mockUpdated });

            const result = await apiClient.updateBlacklist(1, updates);

            expect(mockApiInstance.put).toHaveBeenCalledWith('/blacklist/1', updates);
            expect(result).toEqual(mockUpdated);
        });

        it('should delete blacklist entry', async () => {
            const mockDeleted = { Id: 1, EmployerID: 'EMP001', ContractorName: 'Contractor A' };
            mockApiInstance.delete.mockResolvedValue({ data: mockDeleted });

            const result = await apiClient.deleteBlacklist(1);

            expect(mockApiInstance.delete).toHaveBeenCalledWith('/blacklist/1');
            expect(result).toEqual(mockDeleted);
        });
    });

    describe('Error Handling', () => {
        it('should propagate API errors on getRuns failure', async () => {
            const mockError = new Error('Network error');
            mockApiInstance.get.mockRejectedValue(mockError);

            await expect(apiClient.getRuns()).rejects.toThrow('Network error');
        });

        it('should propagate API errors on post failure', async () => {
            const mockError = new Error('Bad request');
            mockApiInstance.post.mockRejectedValue(mockError);

            await expect(apiClient.executeRun({} as any)).rejects.toThrow('Bad request');
        });

        it('should propagate API errors on put failure', async () => {
            const mockError = new Error('Unauthorized');
            mockApiInstance.put.mockRejectedValue(mockError);

            await expect(apiClient.updateBlacklist(1, { contractorName: 'Test' })).rejects.toThrow('Unauthorized');
        });

        it('should propagate API errors on delete failure', async () => {
            const mockError = new Error('Not found');
            mockApiInstance.delete.mockRejectedValue(mockError);

            await expect(apiClient.deleteBlacklist(999)).rejects.toThrow('Not found');
        });
    });
});
