/**
 * FileInfo - Presentational component for showing selected file
 * Single Responsibility Principle: Only displays file information
 */

export interface FileInfoProps {
    fileName: string;
    isLoading: boolean;
    onImport: () => void;
}

export function FileInfo({ fileName, isLoading, onImport }: FileInfoProps) {
    return (
        <div className="selected-file-info">
            <span>Selected file: {fileName}</span>
            <button className="import-btn" onClick={onImport} disabled={isLoading}>
                Import
            </button>
        </div>
    );
}
