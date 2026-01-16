import { useState } from 'react';
import { Upload, Loader } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import '../styles/FileUpload.css';

interface FileUploadProps {
    onSuccess?: (result: { message: string; rowsImported: number }) => void;
    onError?: (error: string) => void;
}

export function FileUpload({ onSuccess, onError }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const mutation = useMutation({
        mutationFn: (file: File) => apiService.importHireData(file),
        onSuccess: (data) => {
            onSuccess?.(data);
            setSelectedFile(null);
        },
        onError: (error: any) => {
            const message = error.response?.data?.error || error.message || 'Upload failed';
            onError?.(message);
        },
    });

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setSelectedFile(file);
            } else {
                onError?.('Please upload a CSV file');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setSelectedFile(file);
            } else {
                onError?.('Please upload a CSV file');
            }
        }
    };

    const handleImport = () => {
        if (selectedFile) {
            mutation.mutate(selectedFile);
        }
    };

    return (
        <div className="file-upload-container">
            <h3>Hire Data Import</h3>
            <div
                className={`upload-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-input"
                    accept=".csv"
                    onChange={handleChange}
                    disabled={mutation.isPending}
                    className="file-input"
                />
                <label htmlFor="file-input" className="upload-label">
                    {mutation.isPending ? (
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

            {selectedFile && !mutation.isPending && (
                <div className="selected-file-info">
                    <span>Selected file: {selectedFile.name}</span>
                    <button className="import-btn" onClick={handleImport} disabled={mutation.isPending}>
                        Import
                    </button>
                </div>
            )}

            {mutation.isError && (
                <div className="error-message">
                    <strong>Error:</strong> {mutation.error?.message || 'Upload failed'}
                </div>
            )}

            {mutation.isSuccess && (
                <div className="success-message">
                    <strong>Success!</strong> {mutation.data.rowsImported} rows imported
                </div>
            )}
        </div>
    );
}