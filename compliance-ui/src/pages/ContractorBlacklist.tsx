/**
 * ContractorBlacklist - Page component for managing contractor blacklist
 * Composition: Orchestrates child components
 * Single Responsibility: Only manages page-level logic and data orchestration
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Edit2, Trash2, Loader, Plus } from 'lucide-react';
import { useBlacklist, useAddDialog, useEditDialog, useDeleteDialog, useAlert } from '../hooks';
import { DataTable } from '../components/DataTable';
import { Alert, AlertDescription } from '../components/Alert';
import type { ContractorBlacklist } from '../types';
import '../styles/ContractorBlacklist.css';

const createQueryClient = () => new QueryClient();

export function ContractorBlacklistPage() {
    const { alert, showAlert } = useAlert(2000);
    const [showDeleted, setShowDeleted] = useState(false);
    const { blacklist, isLoading, error, createBlacklist, updateBlacklist, deleteBlacklist } = useBlacklist(showDeleted);

    // Dialog state management using extracted hooks
    const addDialog = useAddDialog({ employerId: '', contractorName: '' });
    const editDialog = useEditDialog<ContractorBlacklist, { contractorName: string }>();
    const deleteDialog = useDeleteDialog<ContractorBlacklist>();

    const handleEditRecord = (record: ContractorBlacklist) => {
        editDialog.openDialog(record, { contractorName: record.ContractorName });
    };

    const handleSaveEdit = async () => {
        if (!editDialog.record) return;
        editDialog.setIsSubmitting(true);
        try {
            await updateBlacklist({
                id: editDialog.record.Id,
                data: { contractorName: editDialog.formData?.contractorName || '' }
            });
            showAlert('success', 'Contractor name updated successfully');
            editDialog.closeDialog();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update record';
            showAlert('error', message);
        } finally {
            editDialog.setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.record) return;
        deleteDialog.setIsSubmitting(true);
        try {
            await deleteBlacklist(deleteDialog.record.Id);
            showAlert('success', 'Contractor removed from blacklist');
            deleteDialog.closeDialog();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete record';
            showAlert('error', message);
        } finally {
            deleteDialog.setIsSubmitting(false);
        }
    };

    const handleAddBlacklist = async () => {
        if (!addDialog.formData.employerId.trim() || !addDialog.formData.contractorName.trim()) {
            showAlert('error', 'Employer ID and Contractor Name are required');
            return;
        }
        addDialog.setIsSubmitting(true);
        try {
            await createBlacklist({
                employerId: addDialog.formData.employerId.trim(),
                contractorName: addDialog.formData.contractorName.trim()
            });
            showAlert('success', 'Contractor added to blacklist');
            addDialog.closeDialog();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add contractor';
            showAlert('error', message);
        } finally {
            addDialog.setIsSubmitting(false);
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
                            onClick={() => deleteDialog.openDialog(row)}
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
                <button className="btn-add" onClick={addDialog.openDialog}>
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
            {addDialog.isOpen && (
                <div className="modal-overlay" onClick={addDialog.closeDialog}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Contractor to Blacklist</h2>
                            <button
                                className="modal-close"
                                onClick={addDialog.closeDialog}
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
                                        value={addDialog.formData.employerId}
                                        onChange={(e) => addDialog.setFormData({ ...addDialog.formData, employerId: e.target.value })}
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
                                        value={addDialog.formData.contractorName}
                                        onChange={(e) => addDialog.setFormData({ ...addDialog.formData, contractorName: e.target.value })}
                                        placeholder="Enter contractor name"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={addDialog.closeDialog} disabled={addDialog.isSubmitting}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleAddBlacklist} disabled={addDialog.isSubmitting}>
                                {addDialog.isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            {editDialog.record && (
                <div className="modal-overlay" onClick={editDialog.closeDialog}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Blacklist Entry</h2>
                            <button
                                className="modal-close"
                                onClick={editDialog.closeDialog}
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
                                        value={editDialog.record?.EmployerID || ''}
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
                                        value={editDialog.formData?.contractorName || ''}
                                        onChange={(e) => editDialog.setFormData({ ...(editDialog.formData || { contractorName: '' }), contractorName: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={editDialog.closeDialog} disabled={editDialog.isSubmitting}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSaveEdit} disabled={editDialog.isSubmitting}>
                                {editDialog.isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteDialog.record && (
                <div className="modal-overlay" onClick={deleteDialog.closeDialog}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Remove from Blacklist</h2>
                            <button
                                className="modal-close"
                                onClick={deleteDialog.closeDialog}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="delete-confirmation">
                                Are you sure you want to remove <strong>{deleteDialog.record?.ContractorName}</strong> from the blacklist for employer <strong>{deleteDialog.record?.EmployerID}</strong>?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={deleteDialog.closeDialog} disabled={deleteDialog.isSubmitting}>
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={handleConfirmDelete} disabled={deleteDialog.isSubmitting}>
                                {deleteDialog.isSubmitting ? 'Removing...' : 'Remove'}
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
