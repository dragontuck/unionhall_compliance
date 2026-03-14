/**
 * Specialized API hooks for segregated interfaces
 * Allows components to depend only on interfaces they need
 * Interface Segregation Principle: Clients depend only on what they use
 */

import { useContext } from 'react';
import { ApiContext } from './ApiProvider';
import type {
    IRunsAPI,
    IImportAPI,
    IReportsAPI,
    IReportDetailsAPI,
    IReportNotesAPI,
    IHireDataAPI,
    IModeAPI,
    IExcelExportAPI,
    IComplianceReportAPI,
    IBlacklistAPI,
} from '../services/interfaces';

/**
 * useRunsApi - Access runs API operations
 * Clients: Dashboard, Reports
 */
export function useRunsApi(): IRunsAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useRunsApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useImportApi - Access import API operations
 * Clients: Dashboard (FileUpload)
 */
export function useImportApi(): IImportAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useImportApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useReportsApi - Access reports API operations
 * Clients: Reports page
 */
export function useReportsApi(): IReportsAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useReportsApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useReportDetailsApi - Access report details API operations
 * Clients: Reports page, ReportViewer
 */
export function useReportDetailsApi(): IReportDetailsAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useReportDetailsApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useReportNotesApi - Access report notes API operations
 * Clients: Reports page
 */
export function useReportNotesApi(): IReportNotesAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useReportNotesApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useHireDataApi - Access hire data API operations
 * Clients: Dashboard
 */
export function useHireDataApi(): IHireDataAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useHireDataApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useModeApi - Access mode API operations
 * Clients: Dashboard (RunExecutor)
 */
export function useModeApi(): IModeAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useModeApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useExcelExportApi - Access Excel export API operations
 * Clients: Reports page (ReportViewer)
 */
export function useExcelExportApi(): IExcelExportAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useExcelExportApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useComplianceReportApi - Access compliance report API operations
 * Clients: Reports page (ReportViewer)
 */
export function useComplianceReportApi(): IComplianceReportAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useComplianceReportApi must be used within ApiProvider');
    }
    return apiClient;
}

/**
 * useBlacklistApi - Access blacklist API operations
 * Clients: ContractorBlacklist page
 */
export function useBlacklistApi(): IBlacklistAPI {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useBlacklistApi must be used within ApiProvider');
    }
    return apiClient;
}
