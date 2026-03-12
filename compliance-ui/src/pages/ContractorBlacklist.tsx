/**
 * ContractorBlacklist - Page component for managing contractor blacklist
 * Composition: Orchestrates child components
 * Single Responsibility: Only manages page-level state
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Edit2, Trash2, Loader, Plus } from 'lucide-react';
import { useBlacklist } from '../hooks';
import { DataTable } from '../components/DataTable';
import { Alert, AlertDescription } from '../components/Alert';
import { useAlert } from '../hooks';
import type { ContractorBlacklist } from '../types';
import '../styles/ContractorBlacklist.css';

const createQueryClient = () => new QueryClient();

export function ContractorBlacklistPage() {
    const { alert, showAlert } = useAlert(2000);
    const [showDeleted, setShowDeleted] = useState(false);
    const { blacklist, isLoading, error, createBlacklist, updateBlacklist, deleteBlacklist, isDeleting } = useBlacklist(showDeleted);

    // Add dialog state
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addForm, setAddForm] = useState<{ employerId: string; contractorName: string }>({ employerId: '', contractorName: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ContractorBlacklist | null>(null);
    const [editForm, setEditForm] = useState<{ contractorName: string }>({ contractorName: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Delete dialog state
    const [deletingRecord, setDeletingRecord] = useState<ContractorBlacklist | null>(null);

    const handleEditRecord = (record: ContractorBlacklist) => {
        setEditingRecord(record);
        setEditForm({ contractorName: record.ContractorName });
    };

    const handleCloseEdit = () => {
        setEditingRecord(null);
        setEditForm({ contractorName: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingRecord) return;
        setIsSaving(true);
        try {
            await updateBlacklist({
                id: editingRecord.Id,
                data: { contractorName: editForm.contractorName }
            });
            showAlert('success', 'Contractor name updated successfully');
            handleCloseEdit();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update record';
            showAlert('error', message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRecord = (record: ContractorBlacklist) => {
        setDeletingRecord(record);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRecord) return;
        try {
            await deleteBlacklist(deletingRecord.Id);
            showAlert('success', 'Contractor removed from blacklist');
            setDeletingRecord(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete record';
            showAlert('error', message);
        }
    };

    const handleCloseDelete = () => {
        setDeletingRecord(null);
    };

    const handleOpenAddDialog = () => {
        setShowAddDialog(true);
        setAddForm({ employerId: '', contractorName: '' });
    };

    const handleCloseAddDialog = () => {
        setShowAddDialog(false);
        setAddForm({ employerId: '', contractorName: '' });
    };

    const handleAddBlacklist = async () => {
        if (!addForm.employerId.trim() || !addForm.contractorName.trim()) {
            showAlert('error', 'Employer ID and Contractor Name are required');
            return;
        }
        setIsAdding(true);
        try {
            await createBlacklist({
                employerId: addForm.employerId.trim(),
                contractorName: addForm.contractorName.trim()
            });
            showAlert('success', 'Contractor added to blacklist');
            handleCloseAddDialog();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add contractor';
            showAlert('error', message);
        } finally {
            setIsAdding(false);
        }
    };

    const columns: Array<{
        key: keyof ContractorBlacklist;
        label: string;
        sortable: boolean;
        render?: (value: string | number | null, row: ContractorBlacklist) => React.ReactNode;
    }> = [
            { key: 'EmployerID', label: 'Employer ID', sortable: true },
            { key: 'ContractorName', label: 'Contractor Name', sortable: true },
            {
                key: 'CreatedOn',
                label: 'Created On',
                sortable: true,
                render: (value: string | number | null) => value ? new Date(String(value)).toLocaleDateString() : '-'
            },
            ...(showDeleted ? [{
                key: 'DeletedOn' as const,
                label: 'Deleted On',
                sortable: true,
                render: (value: string | number | null) => value ? new Date(String(value)).toLocaleDateString() : '-'
            }] : []),
            {
                key: 'Id' as const,
                label: 'Actions',
                sortable: false,
                render: (_: string | number | null, row: ContractorBlacklist) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="edit-btn"
                            onClick={() => handleEditRecord(row)}
                            title="Edit"
                            disabled={row.DeletedOn !== null}
                            style={{ opacity: row.DeletedOn !== null ? 0.5 : 1, cursor: row.DeletedOn !== null ? 'not-allowed' : 'pointer' }}
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            className="delete-btn"
                            onClick={() => handleDeleteRecord(row)}
                            title="Delete"
                            disabled={row.DeletedOn !== null}
                            style={{ opacity: row.DeletedOn !== null ? 0.5 : 1, cursor: row.DeletedOn !== null ? 'not-allowed' : 'pointer' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )
            }
        ];

    return (
        <div className="blacklist-page">
            {alert && (
                <Alert type={alert.type}>
                    <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
            )}

            <div className="page-header">
                <h1>Contractor Blacklist</h1>
                <p>Manage contractors that have been blacklisted from hiring</p>
            </div>

            <div className="blacklist-controls">
                <div className="toggle-buttons">
                    <button
                        className={`toggle-btn ${!showDeleted ? 'active' : ''}`}
                        onClick={() => setShowDeleted(false)}
                    >
                        Current Blacklist
                    </button>
                    <button
                        className={`toggle-btn ${showDeleted ? 'active' : ''}`}
                        onClick={() => setShowDeleted(true)}
                    >
                        All Records
                    </button>
                </div>
                <button className="btn-add" onClick={handleOpenAddDialog}>
                    <Plus size={18} />
                    Add Contractor
                </button>
            </div>

            <div className="blacklist-content">
                {isLoading && (
                    <div className="loading">
                        <Loader size={32} className="spinning" />
                        <p>Loading blacklist...</p>
                    </div>
                )}

                {error && (
                    <Alert type="error">
                        <AlertDescription>Failed to load blacklist data</AlertDescription>
                    </Alert>
                )}

                {!isLoading && !error && blacklist.length === 0 && (
                    <div className="no-data">
                        <p>No contractors on the blacklist</p>
                    </div>
                )}

                {!isLoading && !error && blacklist.length > 0 && (
                    <div className="table-wrapper">
                        <DataTable
                            columns={columns}
                            data={blacklist}
                            searchableColumns={['EmployerID', 'ContractorName']}
                            title="Contractor Blacklist"
                            maxHeight="500px"
                        />
                    </div>
                )}
            </div>

            {/* Add Dialog */}
            {showAddDialog && (
                <div className="modal-overlay" onClick={handleCloseAddDialog}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Contractor to Blacklist</h2>
                            <button
                                className="modal-close"
                                onClick={handleCloseAddDialog}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="add-employer-id">Employer ID</label>
                                    <input
                                        id="add-employer-id"
                                        type="text"
                                        value={addForm.employerId}
                                        onChange={(e) => setAddForm({ ...addForm, employerId: e.target.value })}
                                        placeholder="Enter employer ID"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="add-contractor-name">Contractor Name</label>
                                    <input
                                        id="add-contractor-name"
                                        type="text"
                                        value={addForm.contractorName}
                                        onChange={(e) => setAddForm({ ...addForm, contractorName: e.target.value })}
                                        placeholder="Enter contractor name"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseAddDialog} disabled={isAdding}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleAddBlacklist} disabled={isAdding}>
                                {isAdding ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            {editingRecord && (
                <div className="modal-overlay" onClick={handleCloseEdit}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Blacklist Entry</h2>
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
                                    <label>Employer ID</label>
                                    <input
                                        type="text"
                                        value={editingRecord.EmployerID}
                                        disabled
                                        style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label htmlFor="contractor-name">Contractor Name</label>
                                    <input
                                        id="contractor-name"
                                        type="text"
                                        value={editForm.contractorName}
                                        onChange={(e) => setEditForm({ ...editForm, contractorName: e.target.value })}
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

            {/* Delete Confirmation Dialog */}
            {deletingRecord && (
                <div className="modal-overlay" onClick={handleCloseDelete}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Remove from Blacklist</h2>
                            <button
                                className="modal-close"
                                onClick={handleCloseDelete}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="delete-confirmation">
                                Are you sure you want to remove <strong>{deletingRecord.ContractorName}</strong> from the blacklist for employer <strong>{deletingRecord.EmployerID}</strong>?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseDelete} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function ContractorBlacklist() {
    const queryClient = createQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <ContractorBlacklistPage />
        </QueryClientProvider>
    );
}
