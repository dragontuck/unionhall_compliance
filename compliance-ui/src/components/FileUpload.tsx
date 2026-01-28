/**
 * FileUpload - Smart component for file upload management
 * Composition over inheritance: Uses presentational components
 * Single Responsibility: Only handles file upload business logic
 */

import { useState, useCallback } from 'react';
import { useImportHireData } from '../hooks';
import { useApiClient } from '../providers';
import { isValidCsvFile, extractErrorMessage } from '../utils';
import { FileUploadDropZone, FileInfo } from './presentational';
import '../styles/FileUpload.css';

interface FileUploadProps {
    onSuccess?: (result: { message: string; rowsImported: number }) => void;
    onError?: (error: string) => void;
}

export function FileUpload({ onSuccess, onError }: FileUploadProps) {
    const apiClient = useApiClient();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const mutation = useImportHireData(apiClient);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleFileSelect = useCallback(
        (file: File) => {
            if (isValidCsvFile(file)) {
                setSelectedFile(file);
            } else {
                onError?.('Please upload a CSV file');
            }
        },
        [onError]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            const files = e.dataTransfer.files;
            if (files?.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.currentTarget.files;
            if (files?.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const handleImport = useCallback(() => {
        if (selectedFile) {
            mutation.mutate(selectedFile, {
                onSuccess: (data) => {
                    onSuccess?.(data);
                    setSelectedFile(null);
                },
                onError: (error) => {
                    onError?.(extractErrorMessage(error, 'Upload failed'));
                },
            });
        }
    }, [selectedFile, mutation, onSuccess, onError]);

    return (
        <div className="file-upload-container">
            <h3>Hire Data Import</h3>

            <FileUploadDropZone
                isLoading={mutation.isPending}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onChange={handleChange}
            />

            {selectedFile && !mutation.isPending && (
                <FileInfo
                    fileName={selectedFile.name}
                    isLoading={mutation.isPending}
                    onImport={handleImport}
                />
            )}

            {mutation.isError && (
                <div className="error-message">
                    <strong>Error:</strong> {extractErrorMessage(mutation.error, 'Upload failed')}
                </div>
            )}

            {mutation.isSuccess && (
                <div className="success-message">
                    <strong>Success!</strong> {mutation.data.rowsImported} rows processed.
                </div>
            )}
        </div>
    );
}