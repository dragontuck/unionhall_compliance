/**
 * ContractorSnapshotService.test.js - Unit tests for ContractorSnapshotService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorSnapshotService } from './ContractorSnapshotService.js';

describe('ContractorSnapshotService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            getContractorSnapshots: vi.fn(),
            getContractorSnapshotsByDate: vi.fn(),
            createContractorSnapshot: vi.fn(),
            getMostRecentSnapshotByContractorId: vi.fn(),
        };

        service = new ContractorSnapshotService(mockRepository);
    });

    describe('getContractorSnapshots', () => {
        it('should return contractor snapshots with default limit', async () => {
            const snapshots = [
                { id: 1, contractorName: 'ABC Inc', snapshotWed: '2025-01-01' },
                { id: 2, contractorName: 'XYZ Corp', snapshotWed: '2025-01-08' },
            ];
            mockRepository.getContractorSnapshots.mockResolvedValue(snapshots);

            const result = await service.getContractorSnapshots();

            expect(result).toEqual(snapshots);
            expect(mockRepository.getContractorSnapshots).toHaveBeenCalledWith(2000);
        });

        it('should return contractor snapshots with custom limit', async () => {
            const snapshots = [{ id: 1, contractorName: 'ABC Inc' }];
            mockRepository.getContractorSnapshots.mockResolvedValue(snapshots);

            const result = await service.getContractorSnapshots(500);

            expect(result).toEqual(snapshots);
            expect(mockRepository.getContractorSnapshots).toHaveBeenCalledWith(500);
        });

        it('should handle empty snapshot list', async () => {
            mockRepository.getContractorSnapshots.mockResolvedValue([]);

            const result = await service.getContractorSnapshots();

            expect(result).toEqual([]);
        });
    });

    describe('getContractorSnapshotsByDate', () => {
        it('should return snapshots for specific date', async () => {
            const snapshots = [
                { id: 1, contractorName: 'ABC Inc', snapshotWed: '2025-01-15' },
            ];
            mockRepository.getContractorSnapshotsByDate.mockResolvedValue(snapshots);

            const result = await service.getContractorSnapshotsByDate('2025-01-15');

            expect(result).toEqual(snapshots);
            expect(mockRepository.getContractorSnapshotsByDate).toHaveBeenCalledWith('2025-01-15');
        });

        it('should throw error if snapshot date is missing', async () => {
            await expect(service.getContractorSnapshotsByDate(null))
                .rejects.toThrow('Snapshot date is required');
        });

        it('should throw error if snapshot date is undefined', async () => {
            await expect(service.getContractorSnapshotsByDate(undefined))
                .rejects.toThrow('Snapshot date is required');
        });

        it('should handle empty result for date', async () => {
            mockRepository.getContractorSnapshotsByDate.mockResolvedValue([]);

            const result = await service.getContractorSnapshotsByDate('2025-01-15');

            expect(result).toEqual([]);
        });
    });

    describe('importContractorSnapshots', () => {
        const mockConverters = {
            toInt: (val) => parseInt(val) || 0,
            toBool: (val) => val === 'true' || val === '1',
            toDate: (val) => val ? new Date(val) : null,
        };

        it('should import contractor snapshots successfully', async () => {
            const rows = [
                {
                    'Contractor ID': '12345',
                    'Contractor Name': 'ABC Inc',
                    'Last WED Reported ': '2025-01-01',
                    'Snapshot WED': '2025-01-08',
                    'Company Type': 'Union',
                    'Last Hire Date': '2025-01-10',
                    'Journeypersons': '5',
                    'Is Inactive': 'false'
                }
            ];

            mockRepository.createContractorSnapshot.mockResolvedValue(1);

            const result = await service.importContractorSnapshots(rows, mockConverters);

            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(0);
            expect(result.errors.length).toBe(0);
            expect(mockRepository.createContractorSnapshot).toHaveBeenCalledWith(
                expect.objectContaining({
                    contractorId: '012345', // Padded with leading zero
                    contractorName: 'ABC Inc',
                })
            );
        });

        it('should pad contractor ID with leading zeros', async () => {
            const rows = [
                {
                    'Contractor ID': '999',
                    'Contractor Name': 'Test Corp',
                    'Last WED Reported ': null,
                    'Snapshot WED': '2025-01-08',
                    'Company Type': 'Non-union',
                    'Last Hire Date': null,
                    'Journeypersons': '0',
                    'Is Inactive': 'true'
                }
            ];

            mockRepository.createContractorSnapshot.mockResolvedValue(1);

            await service.importContractorSnapshots(rows, mockConverters);

            expect(mockRepository.createContractorSnapshot).toHaveBeenCalledWith(
                expect.objectContaining({
                    contractorId: '000999',
                })
            );
        });

        it('should handle multiple rows with mixed success', async () => {
            const rows = [
                {
                    'Contractor ID': '11111',
                    'Contractor Name': 'ABC Inc',
                    'Last WED Reported ': '2025-01-01',
                    'Snapshot WED': '2025-01-08',
                    'Company Type': 'Union',
                    'Last Hire Date': '2025-01-10',
                    'Journeypersons': '5',
                    'Is Inactive': 'false'
                },
                {
                    'Contractor ID': '22222',
                    'Contractor Name': 'XYZ Corp',
                    'Last WED Reported ': '2025-01-02',
                    'Snapshot WED': '2025-01-08',
                    'Company Type': 'Union',
                    'Last Hire Date': '2025-01-11',
                    'Journeypersons': '3',
                    'Is Inactive': 'false'
                }
            ];

            mockRepository.createContractorSnapshot
                .mockResolvedValueOnce(1)
                .mockRejectedValueOnce(new Error('Duplicate entry'));

            const result = await service.importContractorSnapshots(rows, mockConverters);

            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(1);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0]).toContain('Row 2');
        });

        it('should throw error if rows is not an array', async () => {
            await expect(service.importContractorSnapshots({ notArray: true }, mockConverters))
                .rejects.toThrow('Rows must be an array');
        });

        it('should handle null converter values gracefully', async () => {
            const rows = [
                {
                    'Contractor ID': '33333',
                    'Contractor Name': 'Test',
                    'Last WED Reported ': null,
                    'Snapshot WED': '2025-01-08',
                    'Company Type': null,
                    'Last Hire Date': null,
                    'Journeypersons': null,
                    'Is Inactive': null
                }
            ];

            mockRepository.createContractorSnapshot.mockResolvedValue(1);

            const result = await service.importContractorSnapshots(rows, mockConverters);

            expect(result.successCount).toBe(1);
            expect(mockRepository.createContractorSnapshot).toHaveBeenCalledWith(
                expect.objectContaining({
                    lastWedReported: null,
                    lastHireDate: null,
                    companyType: null,
                    journeypersons: 0,
                })
            );
        });

        it('should handle import with minimal converter functions', async () => {
            const rows = [
                {
                    'Contractor ID': '44444',
                    'Contractor Name': 'Minimal Test',
                    'Last WED Reported ': null,
                    'Snapshot WED': '2025-01-08',
                    'Company Type': 'Union',
                    'Last Hire Date': null,
                    'Journeypersons': null,
                    'Is Inactive': false
                }
            ];

            mockRepository.createContractorSnapshot.mockResolvedValue(1);

            // Provide minimal converters that return undefined/null
            const minimalConverters = {
                toInt: () => undefined,
                toBool: () => undefined,
                toDate: () => null,
            };

            const result = await service.importContractorSnapshots(rows, minimalConverters);

            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(0);
        });
    });

    describe('service error handling', () => {
        it('should propagate repository errors for getContractorSnapshots', async () => {
            mockRepository.getContractorSnapshots.mockRejectedValue(
                new Error('Database connection failed')
            );

            await expect(service.getContractorSnapshots())
                .rejects.toThrow('Database connection failed');
        });

        it('should propagate repository errors for getContractorSnapshotsByDate', async () => {
            mockRepository.getContractorSnapshotsByDate.mockRejectedValue(
                new Error('Query timeout')
            );

            await expect(service.getContractorSnapshotsByDate('2025-01-15'))
                .rejects.toThrow('Query timeout');
        });
    });
});
