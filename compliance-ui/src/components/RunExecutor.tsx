import { useState } from 'react';
import { Play, Loader } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import '../styles/RunExecutor.css';

interface RunExecutorProps {
    onSuccess?: (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => void;
    onError?: (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => void;
}

export function RunExecutor({ onSuccess, onError }: RunExecutorProps) {
    const [reviewedDate, setReviewedDate] = useState('');
    const [mode, setMode] = useState('');
    const [dryRun, setDryRun] = useState(false);

    const { data: modes = [] } = useQuery({
        queryKey: ['modes'],
        queryFn: () => apiService.getModes(),
    });

    const mutation = useMutation({
        mutationFn: () =>
            apiService.executeRun({
                reviewedDate,
                mode,
                dryRun,
            }).then((result) => ({
                message: `Run executed successfully${dryRun ? ' (dry run)' : ''}! Reviewed Date: ${reviewedDate}`,
                runId: result.id,
                output: '',
                dryRun,
            })),
        onSuccess: (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => {
            onSuccess?.({
                message: data.message || `Run executed successfully${dryRun ? ' (dry run)' : ''}! Reviewed Date: ${reviewedDate}`,
                runId: data.runId,
                dryRun,
            });
            setReviewedDate('');
            setMode('');
            setDryRun(false);
        },
        onError: (error: unknown) => {
            const message = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (error as { message?: string })?.message || 'Execution failed';
            onError?.({ message, runId: 0 });
        },
    });

    const handleExecute = () => {
        if (!reviewedDate || !mode) {
            onError?.({ message: 'Please select both Reviewed Date and Mode', runId: 0 });
            return;
        }
        mutation.mutate();
    };

    const isLoading = mutation.isPending;

    return (
        <div className="run-executor-container">
            <h3>Execute New Compliance Run</h3>

            <div className="form-group">
                <label htmlFor="reviewed-date">Reviewed Date *</label>
                <input
                    id="reviewed-date"
                    type="date"
                    value={reviewedDate}
                    onChange={(e) => setReviewedDate(e.target.value)}
                    disabled={isLoading}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="mode">Mode *</label>
                <select
                    id="mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    disabled={isLoading}
                    className="form-input"
                >
                    <option value="">Select a mode</option>
                    {modes.map((m) => (
                        <option key={m.id} value={m.mode_name}>
                            {m.mode_name} (Max Direct: {m.mode_value})
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                        disabled={isLoading}
                    />
                    Dry Run (Preview only, no database changes)
                </label>
            </div>

            <button
                onClick={handleExecute}
                disabled={isLoading || !reviewedDate || !mode}
                className="execute-button"
            >
                {isLoading ? (
                    <>
                        <Loader size={18} className="spinning" />
                        Running...
                    </>
                ) : (
                    <>
                        <Play size={18} />
                        Execute Run
                    </>
                )}
            </button>

            {mutation.isError && (
                <div className="error-message">
                    <strong>Error:</strong> {typeof mutation.error === 'object' && mutation.error && 'message' in mutation.error ? (mutation.error as { message?: string }).message : 'Execution failed'}
                </div>
            )}

            {mutation.isSuccess && (
                <div className="success-message">
                    <strong>Success!</strong> Run executed successfully
                </div>
            )}
        </div>
    );
}
