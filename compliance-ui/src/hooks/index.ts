/**
 * Hooks index - Centralized exports
 * Interface Segregation Principle: Export only what's needed
 */

// Data fetching hooks
export { useRuns, useRunById } from './useRuns';
export { useReportsByRun, useReportDetailsByRun, useLastHiresByRun } from './useReports';
export { useModes } from './useModes';
export { useRawHireData, useRecentHiresByRun } from './useHireData';

// Mutation hooks
export { useExecuteRun, useImportHireData, useUpdateComplianceReport } from './useMutations';
export type { ExecuteRunParams, ExecuteRunResponse } from './useMutations';

// UI state hooks
export { useAlert } from './useAlert';
export type { AlertMessage } from './useAlert';

export { useDragAndDrop } from './useDragAndDrop';
export { useAsync } from './useAsync';
export type { AsyncState } from './useAsync';

export { usePrevious } from './usePrevious';
export { useLocalStorage } from './useLocalStorage';
