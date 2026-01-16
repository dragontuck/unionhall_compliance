import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileUpload } from '../components/FileUpload';
import { RunExecutor } from '../components/RunExecutor';
import { Alert, AlertDescription } from '../components/Alert';
import '../styles/Dashboard.css';

const queryClient = new QueryClient();

interface AlertMessage {
    type: 'success' | 'error';
    message: string;
}

export function Dashboard() {
    const [alert, setAlert] = useState<AlertMessage | null>(null);
    const navigate = useNavigate();

    const handleAlert = (type: 'success' | 'error', data: { message: string; runId: number; output?: string; dryRun?: boolean }) => {
        setAlert({ type, message: data.message });
        setTimeout(() => {
            setAlert(null);
            if (type === 'success' && data.runId) {
                console.log('Navigating to report for runId:', data.runId);
                navigate(`/reports/${data.runId}`);
            }
        }, 2000);
    };

    return (
        <QueryClientProvider client={queryClient}>
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
                            onSuccess={(result) =>
                                handleAlert('success', { message: `${result.rowsImported} hire records imported successfully`, runId: 0 })
                            }
                            onError={(error) => handleAlert('error', { message: error, runId: 0 })}
                        />
                    </div>

                    <div className="section">
                        <RunExecutor
                            onSuccess={(data) => handleAlert('success', data)}
                            onError={(data) => handleAlert('error', data)}
                        />
                    </div>
                </div>
            </div>
        </QueryClientProvider>
    );
}
