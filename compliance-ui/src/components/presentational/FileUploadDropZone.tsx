/**
 * FileUploadDropZone - Presentational component for drag-and-drop
 * Single Responsibility Principle: Only handles UI, no business logic
 */

import { Upload, Loader } from 'lucide-react';
import { useId } from 'react';
import '../../styles/FileUpload.css';

export interface FileUploadDropZoneProps {
    isLoading: boolean;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function FileUploadDropZone({
    isLoading,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onChange,
    fileInputRef,
}: FileUploadDropZoneProps) {
    const uniqueId = useId();
    const inputId = `file-input-${uniqueId}`;

    return (
        <div
            className="upload-zone"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                id={inputId}
                accept=".csv"
                onChange={onChange}
                disabled={isLoading}
                className="file-input"
                aria-label="Select CSV file"
            />
            <label htmlFor={inputId} className="upload-label">
                {isLoading ? (
                    <>
                        <Loader size={48} className="icon spinning" />
                        <p>Uploading...</p>
                    </>
                ) : (
                    <>
                        <Upload size={48} className="icon" />
                        <p className="main-text">Drag CSV file here or click to select</p>
                        <p className="sub-text">Accepted format: .csv</p>
                    </>
                )}
            </label>
        </div>
    );
}
