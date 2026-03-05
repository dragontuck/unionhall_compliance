/**
 * RunExecutor - Smart component for run execution
 * Composition over inheritance: Uses presentational components
 * Single Responsibility: Only handles run execution business logic
 */

import { useState, useCallback } from 'react';
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
    const [reviewedDate, setReviewedDate] = useState('');
    const [modeId, setModeId] = useState<number | string>('');
    const [dryRun, setDryRun] = useState(false);

    const { data: modes = [] } = useModes(apiClient);
    const mutation = useExecuteRun(apiClient);

    const handleExecute = useCallback(() => {
        if (!reviewedDate || !modeId) {
            onError?.({
                message: 'Please select both Reviewed Date and Mode',
                runId: 0,
            });
            return;
        }

        mutation.mutate(
            { reviewedDate, mode: String(modeId), dryRun },
            {
                onSuccess: (data) => {
                    onSuccess?.(data);
                    setReviewedDate('');
                    setModeId(0);
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
    }, [reviewedDate, modeId, dryRun, mutation, onSuccess, onError]);

    const isDisabled = mutation.isPending || !reviewedDate || !modeId;

    return (
        <>
            <RunExecutorForm
                reviewedDate={reviewedDate}
                onReviewedDateChange={setReviewedDate}
                modeId={Number(modeId) || 0}
                onModeChange={(val) => setModeId(Number(val))}
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
