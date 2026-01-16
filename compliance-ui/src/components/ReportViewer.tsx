import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader } from 'lucide-react';
import { apiService } from '../services/api';
import { DataTable } from './DataTable';
import '../styles/ReportViewer.css';
import type { ComplianceReport, ComplianceReportDetail, HireData, RecentHireData } from '../types';

// Get runId from URL params
export function ReportViewer() {
    const { runId } = useParams();
    const initialRunId = runId ? Number(runId) : null;
    const [selectedRunId, setSelectedRunId] = useState<number | null>(initialRunId);
    const [activeTab, setActiveTab] = useState<'raw' | 'details' | 'summary' | 'export'>('raw');
    const [downloadError, setDownloadError] = useState<string | null>(null);

    // Fetch all runs
    const { data: runs = [] } = useQuery({
        queryKey: ['runs'],
        queryFn: () => apiService.getRuns(),
    });

    // Get the selected run's reviewed date
    const selectedRun = runs.find(r => r.id == selectedRunId);
    const selectedRunReviewedDate = selectedRun?.reviewedDate;
    // Fetch raw hire data
    const {
        data: rawHires = [],
        isLoading: rawHiresLoading,
        isError: rawHiresError,
    } = useQuery({
        queryKey: ['rawHireData', selectedRunReviewedDate],
        queryFn: () => apiService.getRawHireData(selectedRunReviewedDate),
        enabled: !!selectedRunId && !!selectedRunReviewedDate,
    });

    // Fetch report details
    const {
        data: details = [],
        isLoading: detailsLoading,
        isError: detailsError,
    } = useQuery({
        queryKey: ['reportDetails', selectedRunId],
        queryFn: () => apiService.getReportDetailsByRun(selectedRunId!),
        enabled: !!selectedRunId,
    });

    // Fetch report summary
    const {
        data: reports = [],
        isLoading: reportsLoading,
        isError: reportsError,
    } = useQuery({
        queryKey: ['reports', selectedRunId],
        queryFn: () => apiService.getReportsByRun(selectedRunId!),
        enabled: !!selectedRunId,
    });

    // Fetch last hires
    const {
        data: lastHires = [],
        isLoading: lastHiresLoading,
        isError: lastHiresError,
    } = useQuery({
        queryKey: ['lastHires', selectedRunId],
        queryFn: () => apiService.getLastHiresByRun(selectedRunId!),
        enabled: !!selectedRunId,
    });

    // Fetch recent hires
    const {
        data: recentHires = [],
        isLoading: recentHiresLoading,
        isError: recentHiresError,
    } = useQuery({
        queryKey: ['recentHires', selectedRunId],
        queryFn: () => apiService.getRecentHiresByRun(selectedRunId!),
        enabled: !!selectedRunId,
    });

    const handleDownloadExcel = async () => {
        if (!selectedRunId) return;
        setDownloadError(null);
        try {
            const blob = await apiService.exportRunToExcel(selectedRunId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `compliance_report_${selectedRunId}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to download report';
            setDownloadError(errorMessage);
            console.error('Download failed:', error);
        }
    };

    const detailColumns: { key: keyof ComplianceReportDetail; label: string; sortable: boolean }[] = [
        { key: 'employerId', label: 'Employer Id', sortable: true },
        { key: 'contractorId', label: 'Contractor Id', sortable: true },
        { key: 'contractorName', label: 'Contractor Name', sortable: true },
        { key: 'memberName', label: 'Member Name', sortable: true },
        { key: 'iaNumber', label: 'IA Number', sortable: true },
        { key: 'startDate', label: 'Start Date', sortable: true },
        { key: 'hireType', label: 'Hire Type', sortable: true },
        { key: 'complianceStatus', label: 'Status', sortable: true },
        { key: 'directCount', label: 'Direct Count', sortable: true },
        { key: 'dispatchNeeded', label: 'Dispatch Needed', sortable: true },
        { key: 'nextHireDispatch', label: 'Next Hire Dispatch', sortable: true },
        { key: 'reviewedDate', label: 'Reviewed Date', sortable: true },
        { key: 'modeName', label: 'Mode', sortable: false },
    ];
    const rawHiresColumns: { key: keyof HireData; label: string; sortable: boolean }[] = [
        { key: 'ContractorName', label: 'Contractor', sortable: true },
        { key: 'MemberName', label: 'Member Name', sortable: true },
        { key: 'IANumber', label: 'IA Number', sortable: true },
        { key: 'HireType', label: 'Hire Type', sortable: true },
        { key: 'StartDate', label: 'Start Date', sortable: true },
        { key: 'EmployerID', label: 'Employer ID', sortable: true },
        { key: 'IsReviewed', label: 'Reviewed', sortable: true },
        { key: 'IsExcluded', label: 'Excluded', sortable: true },
    ];
    const reportColumns: { key: keyof ComplianceReport; label: string; sortable: boolean }[] = [
        { key: 'employerId', label: 'Employer Id', sortable: true },
        { key: 'contractorId', label: 'Contractor Id', sortable: true },
        { key: 'contractorName', label: 'Contractor', sortable: true },
        { key: 'complianceStatus', label: 'Status', sortable: true },
        { key: 'directCount', label: 'Direct Count', sortable: true },
        { key: 'dispatchNeeded', label: 'Dispatch Needed', sortable: true },
        { key: 'nextHireDispatch', label: 'Next Hire Dispatch', sortable: true },
    ];
    const recentColumns: { key: keyof RecentHireData; label: string; sortable: boolean }[] = [
        { key: 'employerId', label: 'Employer Id', sortable: true },
        { key: 'contractorId', label: 'Contractor Id', sortable: true },
        { key: 'contractorName', label: 'Contractor Name', sortable: true },
        { key: 'memberName', label: 'Member Name', sortable: true },
        { key: 'iaNumber', label: 'IA Number', sortable: true },
        { key: 'startDate', label: 'Start Date', sortable: true },
        { key: 'hireType', label: 'Hire Type', sortable: true },
        { key: 'reviewedDate', label: 'Reviewed Date', sortable: true },
    ];

    return (
        <div className="report-viewer-container">
            <div className="run-selector">
                <label htmlFor="run-select">Select Run:</label>
                <select
                    id="run-select"
                    value={selectedRunId || ''}
                    onChange={(e) => setSelectedRunId(e.target.value ? Number(e.target.value) : null)}
                    className="run-select"
                >
                    <option value="">Choose a run...</option>
                    {runs.map((run) => (
                        <option key={run.id} value={run.id}>
                            {run.reviewedDate} - Run #{run.run} (Mode: {run.modeName})
                        </option>
                    ))}
                </select>
            </div>

            {downloadError && (
                <div className="error-alert">
                    <div className="error-message">
                        {downloadError}
                        <button
                            className="error-close"
                            onClick={() => setDownloadError(null)}
                            aria-label="Close error"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {selectedRunId && (
                <>
                    <div className="tab-navigation">
                        <button
                            className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
                            onClick={() => setActiveTab('raw')}
                        >
                            Raw Hires ({rawHires.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summary')}
                        >
                            Report Summary ({reports.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Hire Details ({details.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'lastHires' ? 'active' : ''}`}
                            onClick={() => setActiveTab('lastHires')}
                        >
                            Last 4 Hires ({lastHires.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'recentHires' ? 'active' : ''}`}
                            onClick={() => setActiveTab('recentHires')}
                        >
                            Recent Hires ({recentHires.length})
                        </button>
                        <button
                            className="download-btn"
                            onClick={handleDownloadExcel}
                            title="Download report as Excel"
                            aria-label="Download report"
                        >
                            <Download size={18} />
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'raw' && (
                            <div className="raw-hires-tab">
                                {rawHiresLoading && (
                                    <div className="loading">
                                        <Loader size={32} className="spinning" />
                                        Loading raw hire data...
                                    </div>
                                )}
                                {rawHiresError && <div className="error">Failed to load raw hire data</div>}
                                {rawHires.length > 0 && (
                                    <div className="raw-hires-scroll">
                                        <DataTable
                                            columns={rawHiresColumns}
                                            data={rawHires}
                                            searchableColumns={['ContractorName', 'MemberName']}
                                            title="Raw Hire Data"
                                            maxHeight="400px"
                                        />
                                    </div>
                                )}
                                {!rawHiresLoading && !rawHiresError && rawHires.length === 0 && (
                                    <p className="no-data">No hire data available for this reviewed date</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="details-tab">
                                {detailsLoading && (
                                    <div className="loading">
                                        <Loader size={32} className="spinning" />
                                        Loading details...
                                    </div>
                                )}
                                {detailsError && <div className="error">Failed to load details</div>}
                                {details.length > 0 && (
                                    <div className="raw-hires-scroll">
                                        <DataTable
                                            columns={detailColumns}
                                            data={details}
                                            searchableColumns={['contractorName', 'memberName']}
                                            title="Hire Details Report"
                                            maxHeight="400px"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'summary' && (
                            <div className="summary-tab">
                                {reportsLoading && (
                                    <div className="loading">
                                        <Loader size={32} className="spinning" />
                                        Loading report...
                                    </div>
                                )}
                                {reportsError && <div className="error">Failed to load report</div>}
                                {reports.length > 0 && (
                                    <div className="raw-hires-scroll">
                                        <DataTable
                                            columns={reportColumns}
                                            data={reports}
                                            searchableColumns={['contractorName']}
                                            title="Contractor Compliance Report"
                                            maxHeight="400px"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'lastHires' && (
                            <div className="summary-tab">
                                {lastHiresLoading && (
                                    <div className="loading">
                                        <Loader size={32} className="spinning" />
                                        Loading last hires report...
                                    </div>
                                )}
                                {lastHiresError && <div className="error">Failed to load last hires report</div>}
                                {lastHires.length > 0 && (
                                    <div className="raw-hires-scroll">
                                        <DataTable
                                            columns={detailColumns}
                                            data={lastHires}
                                            searchableColumns={['contractorName', 'memberName']}
                                            title="Last 4 Hires Report"
                                            maxHeight="400px"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'recentHires' && (
                            <div className="summary-tab">
                                {recentHiresLoading && (
                                    <div className="loading">
                                        <Loader size={32} className="spinning" />
                                        Loading recent hires report...
                                    </div>
                                )}
                                {recentHiresError && <div className="error">Failed to load recent hires report</div>}
                                {recentHires.length > 0 && (
                                    <div className="raw-hires-scroll">
                                        <DataTable
                                            columns={recentColumns}
                                            data={recentHires}
                                            searchableColumns={['contractorName', 'memberName']}
                                            title="Recent Hires Report"
                                            maxHeight="400px"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </>
            )}
        </div>
    );
}
