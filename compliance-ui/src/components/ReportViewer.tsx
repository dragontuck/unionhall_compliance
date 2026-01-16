import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader, Edit2, X } from 'lucide-react';
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
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [viewingNotes, setViewingNotes] = useState<any>(null);
    const [notesData, setNotesData] = useState<any[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const queryClient = useQueryClient();

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

    const handleEditRecord = (record: any) => {
        setEditingRecord(record);
        setEditForm({
            id: record.id,
            contractorName: record.contractorName,
            complianceStatus: record.complianceStatus || 'Compliant',
            directCount: record.directCount,
            dispatchNeeded: record.dispatchNeeded,
            nextHireDispatch: record.nextHireDispatch,
            note: record.note || '',
            changedBy: record.changedBy || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingRecord || !editForm) return;
        setIsSaving(true);
        try {
            await apiService.updateComplianceReport(editingRecord.id, {
                employerId: editingRecord.employerId,
                directCount: editForm.directCount,
                dispatchNeeded: editForm.dispatchNeeded,
                status: editForm.complianceStatus,
                nextHireDispatch: editForm.nextHireDispatch,
                note: editForm.note,
                changedBy: editForm.changedBy,
            });
            setEditingRecord(null);
            setEditForm(null);
            // Refetch the reports data
            queryClient.invalidateQueries({ queryKey: ['reports', selectedRunId] });
        } catch (error) {
            console.error('Failed to save edit:', error);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseEdit = () => {
        setEditingRecord(null);
        setEditForm(null);
    };

    const handleViewNotes = async (record: any) => {
        console.log('Opening notes for:', record);
        setViewingNotes(record);
        setIsLoadingNotes(true);
        try {
            const notes = await apiService.getNotesByEmployerId(record.employerId);
            console.log('Notes loaded:', notes);
            setNotesData(notes);
        } catch (error) {
            console.error('Failed to load notes:', error);
            setNotesData([]);
        } finally {
            setIsLoadingNotes(false);
        }
    };

    const handleCloseNotes = () => {
        setViewingNotes(null);
        setNotesData([]);
    };

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
    const reportColumns: { key: keyof ComplianceReport; label: string; sortable: boolean; render?: any }[] = [
        { key: 'employerId', label: 'Employer Id', sortable: true },
        { key: 'contractorId', label: 'Contractor Id', sortable: true },
        {
            key: 'id',
            label: 'id',
            sortable: false,
            render: (value: any, row: any) => (
                <span style={{ display: 'none' }} data-id={row.id}>{row.id}</span>
            )
        },
        {
            key: 'contractorName' as any,
            label: 'Contractor',
            sortable: true,
            render: (value: any, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{row.contractorName}</span>
                    {row.noteCount > 0 && (
                        <button
                            className="note-badge"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewNotes(row);
                            }}
                            title={`View ${row.noteCount} note(s)`}
                        >
                            {row.noteCount}
                        </button>
                    )}
                </div>
            )
        },
        { key: 'complianceStatus', label: 'Status', sortable: true },
        { key: 'directCount', label: 'Direct Count', sortable: true },
        { key: 'dispatchNeeded', label: 'Dispatch Needed', sortable: true },
        { key: 'nextHireDispatch', label: 'Next Hire Dispatch', sortable: true },
        {
            key: 'employerId' as any,
            label: 'Actions',
            sortable: false,
            render: (value: any, row: any) => (
                <button
                    className="edit-btn"
                    onClick={() => handleEditRecord(row)}
                    title="Edit record"
                    aria-label="Edit record"
                >
                    <Edit2 size={16} />
                </button>
            )
        }
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

            {editingRecord && editForm && (
                <div className="modal-overlay" onClick={handleCloseEdit}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Report</h2>
                            <button
                                className="modal-close"
                                onClick={handleCloseEdit}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Contractor: {editingRecord.contractorName}</label>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="compliance-status">Compliance Status</label>
                                    <select
                                        id="compliance-status"
                                        value={editForm.complianceStatus}
                                        onChange={(e) => setEditForm({ ...editForm, complianceStatus: e.target.value })}
                                    >
                                        <option value="Compliant">Compliant</option>
                                        <option value="Noncompliant">Noncompliant</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="direct-count">Direct Count</label>
                                    <input
                                        id="direct-count"
                                        type="number"
                                        value={editForm.directCount}
                                        onChange={(e) => setEditForm({ ...editForm, directCount: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="dispatch-needed">Dispatch Needed</label>
                                    <input
                                        id="dispatch-needed"
                                        type="number"
                                        value={editForm.dispatchNeeded}
                                        onChange={(e) => setEditForm({ ...editForm, dispatchNeeded: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="next-hire-dispatch">Next Hire Dispatch</label>
                                    <select
                                        id="next-hire-dispatch"
                                        value={editForm.nextHireDispatch}
                                        onChange={(e) => setEditForm({ ...editForm, nextHireDispatch: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        <option value="Y">Yes</option>
                                        <option value="N">No</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="note">Note</label>
                                    <textarea
                                        id="note"
                                        value={editForm.note}
                                        onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="changed-by">Changed By</label>
                                    <input
                                        id="changed-by"
                                        type="text"
                                        value={editForm.changedBy}
                                        onChange={(e) => setEditForm({ ...editForm, changedBy: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseEdit} disabled={isSaving}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSaveEdit} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingNotes && (
                <div className="modal-overlay" onClick={handleCloseNotes} role="dialog" aria-modal="true">
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="document" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>Notes - {viewingNotes.contractorName}</h2>
                            <button
                                className="modal-close"
                                onClick={handleCloseNotes}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '0' }}>
                            {isLoadingNotes ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Loader size={32} className="spinning" />
                                    <p>Loading notes...</p>
                                </div>
                            ) : notesData.length > 0 ? (
                                <DataTable
                                    columns={[
                                        {
                                            key: 'reviewedDate' as any,
                                            label: 'Reviewed Date',
                                            sortable: true,
                                            render: (value: any) => value ? new Date(value).toLocaleDateString() : '-'
                                        },
                                        { key: 'note' as any, label: 'Note', sortable: false },
                                        { key: 'createdBy' as any, label: 'Created By', sortable: true },
                                        {
                                            key: 'createdDate' as any,
                                            label: 'Date',
                                            sortable: true,
                                            render: (value: any) => new Date(value).toLocaleDateString()
                                        },
                                    ]}
                                    data={notesData}
                                    searchableColumns={['note']}
                                    maxHeight="250px"
                                />
                            ) : (
                                <p className="no-data" style={{ padding: '20px' }}>No notes available</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseNotes}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
