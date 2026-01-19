/**
 * RunExecutor - Smart component for run execution
 * Composition over inheritance: Uses presentational components
 * Single Responsibility: Only handles run execution business logic
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModes, useExecuteRun } from '../hooks';
import { useApiClient } from '../providers';
import { extractErrorMessage } from '../utils';
import { RunExecutorForm } from './presentational';

interface RunExecutorProps {
    onSuccess?: (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => void;
    onError?: (data: { message: string; runId: number; output?: string; dryRun?: boolean }) => void;
}

export function RunExecutor({ onSuccess, onError }: RunExecutorProps) {
    const apiClient = useApiClient();
    const navigate = useNavigate();
    const [reviewedDate, setReviewedDate] = useState('');
    const [mode, setMode] = useState('');
    const [dryRun, setDryRun] = useState(false);

    const { data: modes = [] } = useModes(apiClient);
    const mutation = useExecuteRun(apiClient);

    const handleExecute = useCallback(() => {
        if (!reviewedDate || !mode) {
            onError?.({
                message: 'Please select both Reviewed Date and Mode',
                runId: 0,
            });
            return;
        }

        mutation.mutate(
            { reviewedDate, mode, dryRun },
            {
                onSuccess: (data) => {
                    onSuccess?.(data);
                    setReviewedDate('');
                    setMode('');
                    setDryRun(false);
                },
                onError: (error) => {
                    onError?.({
                        message: extractErrorMessage(error, 'Execution failed'),
                        runId: 0,
                    });
                },
            }
        );
    }, [reviewedDate, mode, dryRun, mutation, onSuccess, onError]);

    const isDisabled = mutation.isPending || !reviewedDate || !mode;

    return (
        <>
            <RunExecutorForm
                reviewedDate={reviewedDate}
                onReviewedDateChange={setReviewedDate}
                mode={mode}
                onModeChange={setMode}
                modes={modes}
                dryRun={dryRun}
                onDryRunChange={setDryRun}
                isLoading={mutation.isPending}
                onExecute={handleExecute}
                isDisabled={isDisabled}
            />

            {mutation.isError && (
                <div className="error-message">
                    <strong>Error:</strong>{' '}
                    {extractErrorMessage(mutation.error, 'Execution failed')}
                </div>
            )}

            {mutation.isSuccess && (
                <div className="success-message">
                    <strong>Success!</strong> Run executed successfully
                </div>
            )}
        </>
    );
}
