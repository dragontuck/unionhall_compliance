/**
 * RunExecutorForm - Presentational component for compliance run execution
 * Single Responsibility Principle: Only handles UI rendering
 */

import { Play, Loader } from 'lucide-react';
import type { Mode } from '../../types';
import { FormField } from './FormField';
import '../../styles/RunExecutor.css';

export interface RunExecutorFormProps {
    reviewedDate: string;
    onReviewedDateChange: (date: string) => void;
    modeId: number;
    onModeChange: (modeId: number) => void;
    modes: Mode[];
    dryRun: boolean;
    onDryRunChange: (checked: boolean) => void;
    isLoading: boolean;
    onExecute: () => void;
    isDisabled: boolean;
}

export function RunExecutorForm({
    reviewedDate,
    onReviewedDateChange,
    modeId,
    onModeChange,
    modes,
    dryRun,
    onDryRunChange,
    isLoading,
    onExecute,
    isDisabled,
}: RunExecutorFormProps) {
    return (
        <div className="run-executor-container">
            <h3>Execute New Compliance Run</h3>

            <FormField
                label="Reviewed Date *"
                id="reviewed-date"
                disabled={isLoading}
            >
                <input
                    id="reviewed-date"
                    type="date"
                    value={reviewedDate}
                    onChange={(e) => onReviewedDateChange(e.target.value)}
                    disabled={isLoading}
                    className="form-input"
                />
            </FormField>

            <FormField
                label="Mode *"
                id="mode"
                disabled={isLoading}
            >
                <select
                    id="mode"
                    value={modeId}
                    onChange={(e) => onModeChange(Number(e.target.value))}
                    disabled={isLoading}
                    className="form-input"
                >
                    <option value="">Select a mode</option>
                    {modes.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.mode_name} (Max Direct: {m.mode_value})
                        </option>
                    ))}
                </select>
            </FormField>

            <div className="form-group checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(e) => onDryRunChange(e.target.checked)}
                        disabled={isLoading}
                    />
                    Dry Run (Preview only, no database changes)
                </label>
            </div>

            <button
                onClick={onExecute}
                disabled={isDisabled}
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
        </div>
    );
}
