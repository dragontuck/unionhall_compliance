/**
 * FileUpload - Smart component for file upload management
 * Composition over inheritance: Uses presentational components
 * Single Responsibility: Only handles file upload business logic
 */

import { useState, useCallback, useRef } from 'react';
import { useImportHireData, useImportContractorSnapshots } from '../hooks';
import { isValidCsvFile, extractErrorMessage } from '../utils';
import { FileUploadDropZone, FileInfo } from './presentational';
import '../styles/FileUpload.css';

interface FileUploadProps {
    endpoint?: string;
    title?: string;
    onSuccess?: (result: { message: string; rowsImported: number }) => void;
    onError?: (error: string) => void;
}

export function FileUpload({
    endpoint = '/api/import/hires',
    title = 'Hire Data Import',
    onSuccess,
    onError
}: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Use appropriate mutation hook based on endpoint
    const hireDataMutation = useImportHireData();
    const contractorSnapshotMutation = useImportContractorSnapshots();
    const mutation = endpoint === '/api/import/hires' ? hireDataMutation : contractorSnapshotMutation;

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // dragActive removed
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
            // dragActive removed
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.currentTarget.files;
            if (files && files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const resetFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setSelectedFile(null);
    }, []);

    const handleImport = useCallback(() => {
        if (selectedFile) {
            mutation.mutate(selectedFile, {
                onSuccess: (data: { message: string; rowsImported: number }) => {
                    onSuccess?.(data);
                    resetFileInput();
                },
                onError: (error) => {
                    onError?.(extractErrorMessage(error, 'Upload failed'));
                },
            });
        }
    }, [selectedFile, mutation, onSuccess, onError, resetFileInput]);

    return (
        <div className="file-upload-container">
            <h3>{title}</h3>

            <FileUploadDropZone
                fileInputRef={fileInputRef}
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
                    <strong>Success!</strong> {(mutation.data as { rowsImported?: number })?.rowsImported ?? 0} rows processed.
                </div>
            )}
        </div>
    );
}