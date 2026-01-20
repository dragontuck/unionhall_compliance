import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isValidCsvFile, downloadFile, readFileAsText, FILE_CONSTANTS } from './fileUtils';

describe('fileUtils', () => {
    describe('FILE_CONSTANTS', () => {
        it('should have valid CSV MIME type', () => {
            expect(FILE_CONSTANTS.CSV_MIME_TYPE).toBe('text/csv');
        });

        it('should have valid CSV extension', () => {
            expect(FILE_CONSTANTS.CSV_EXTENSION).toBe('.csv');
        });

        it('should have maximum file size', () => {
            expect(FILE_CONSTANTS.MAX_FILE_SIZE).toBeGreaterThan(0);
        });
    });

    describe('isValidCsvFile', () => {
        it('should accept CSV file with correct MIME type', () => {
            const file = new File(['data'], 'test.csv', { type: 'text/csv' });
            expect(isValidCsvFile(file)).toBe(true);
        });

        it('should accept CSV file with alternative MIME type', () => {
            const file = new File(['data'], 'test.csv', { type: 'application/vnd.ms-excel' });
            expect(isValidCsvFile(file)).toBe(true);
        });

        it('should accept CSV file by extension', () => {
            const file = new File(['data'], 'test.csv', { type: 'application/octet-stream' });
            expect(isValidCsvFile(file)).toBe(true);
        });

        it('should reject non-CSV files', () => {
            const file = new File(['data'], 'test.txt', { type: 'text/plain' });
            expect(isValidCsvFile(file)).toBe(false);
        });

        it('should reject files with wrong extension', () => {
            const file = new File(['data'], 'test.json', { type: 'application/json' });
            expect(isValidCsvFile(file)).toBe(false);
        });

        it('should reject files exceeding maximum size', () => {
            // Create a mock file with size exceeding limit
            const largeBlob = new Blob([new ArrayBuffer(FILE_CONSTANTS.MAX_FILE_SIZE + 1)]);
            const file = new File([largeBlob], 'test.csv', { type: 'text/csv' });
            expect(isValidCsvFile(file)).toBe(false);
        });
    });

    describe('downloadFile', () => {
        beforeEach(() => {
            // Mock URL static methods
            global.URL.createObjectURL = vi.fn(() => 'blob:http://example.com/test');
            global.URL.revokeObjectURL = vi.fn();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should create download link and trigger click', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');
            const blob = new Blob(['test'], { type: 'text/csv' });

            downloadFile(blob, 'test.csv');

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
        });

        it('should set correct filename for download', () => {
            const blob = new Blob(['test'], { type: 'text/csv' });
            const appendChildSpy = vi.spyOn(document.body, 'appendChild');

            downloadFile(blob, 'myfile.csv');

            expect(appendChildSpy).toHaveBeenCalled();
        });

        it('should clean up blob URL after download', () => {
            const blob = new Blob(['test'], { type: 'text/csv' });
            downloadFile(blob, 'test.csv');

            expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        });
    });

    describe('readFileAsText', () => {
        it('should read file as text successfully', async () => {
            const content = 'header1,header2\nvalue1,value2';
            const file = new File([content], 'test.csv', { type: 'text/csv' });

            const result = await readFileAsText(file);
            expect(result).toBe(content);
        });

        it('should handle large files', async () => {
            const largeContent = 'header\n' + Array(1000).fill('data').join('\n');
            const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

            const result = await readFileAsText(file);
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('header');
        });

        it('should handle UTF-8 encoded files', async () => {
            const content = 'name,value\n测试,value1';
            const file = new File([content], 'utf8.csv', { type: 'text/csv' });

            const result = await readFileAsText(file);
            expect(result).toContain('测试');
        });

        it('should reject on file read error', async () => {
            const file = new File(['test'], 'test.csv', { type: 'text/csv' });
            vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function () {
                const error = new ProgressEvent('error');
                setTimeout(() => {
                    this.onerror?.(error as any);
                }, 0);
            });

            await expect(readFileAsText(file)).rejects.toThrow();
        });
    });
});
