/**
 * File utilities
 * Single Responsibility Principle: Only handles file-related operations
 */

export const FILE_CONSTANTS = {
    CSV_MIME_TYPE: 'text/csv',
    CSV_EXTENSION: '.csv',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

/**
 * Validates if a file is a CSV
 */
export function isValidCsvFile(file: File): boolean {
    const isCsvType = file.type === FILE_CONSTANTS.CSV_MIME_TYPE ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith(FILE_CONSTANTS.CSV_EXTENSION);
    const isValidSize = file.size <= FILE_CONSTANTS.MAX_FILE_SIZE;
    return isCsvType && isValidSize;
}

/**
 * Downloads a blob as a file
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Reads file as text (for CSV)
 */
export async function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
