/**
 * Dashboard - Page component for compliance management
 * Composition: Orchestrates child components
 * Single Responsibility: Only manages page-level state
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileUpload } from '../components/FileUpload';
import { RunExecutor } from '../components/RunExecutor';
import { Alert, AlertDescription } from '../components/Alert';
import { useAlert } from '../hooks';
import '../styles/Dashboard.css';

// Create a client per page instance to isolate query state per feature
const createQueryClient = () => new QueryClient();

export function Dashboard() {
    const navigate = useNavigate();
    const { alert, showAlert, clearAlert } = useAlert(2000);

    const handleFileUploadSuccess = useCallback(
        (result: { message: string; rowsImported: number }) => {
            showAlert('success', result.message);
        },
        [showAlert]
    );

    const handleFileUploadError = useCallback(
        (error: string) => {
            showAlert('error', error);
        },
        [showAlert]
    );

    const handleRunExecutorSuccess = useCallback(
        (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => {
            showAlert('success', data.message);
            if (data.runId) {
                const timer = setTimeout(() => {
                    navigate(`/reports/${data.runId}`);
                }, 2000);
                return () => clearTimeout(timer);
            }
        },
        [showAlert, navigate]
    );

    const handleRunExecutorError = useCallback(
        (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => {
            showAlert('error', data.message);
        },
        [showAlert]
    );

    return (
        <QueryClientProvider client={createQueryClient()}>
            <div className="dashboard">
                {alert && (
                    <Alert type={alert.type}>
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                )}

                <div className="dashboard-header">
                    <h1>Compliance Management System</h1>
                    <p>Import hire data and execute compliance runs</p>
                </div>

                <div className="dashboard-grid">
                    <div className="section">
                        <FileUpload
                            onSuccess={handleFileUploadSuccess}
                            onError={handleFileUploadError}
                        />
                    </div>

                    <div className="section">
                        <RunExecutor
                            onSuccess={handleRunExecutorSuccess}
                            onError={handleRunExecutorError}
                        />
                    </div>
                </div>
            </div>
        </QueryClientProvider>
    );
}
