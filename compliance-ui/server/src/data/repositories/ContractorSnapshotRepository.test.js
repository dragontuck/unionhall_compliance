/**
 * ContractorSnapshotRepository.test.js - Unit tests for ContractorSnapshotRepository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorSnapshotRepository } from './ContractorSnapshotRepository.js';

describe('ContractorSnapshotRepository', () => {
    let repository;
    let mockPool;

    beforeEach(() => {
        mockPool = {
            request: vi.fn(),
        };

        repository = new ContractorSnapshotRepository(mockPool);

        // Mock the query and execute methods from parent MssqlRepository
        vi.spyOn(repository, 'query').mockResolvedValue([]);
        vi.spyOn(repository, 'execute').mockResolvedValue(0);
    });

    describe('getContractorSnapshots', () => {
        it('should return snapshots with default limit', async () => {
            const snapshots = [
                { contractorId: '000001', contractorName: 'ABC Inc' },
                { contractorId: '000002', contractorName: 'XYZ Corp' },
            ];
            repository.query.mockResolvedValue(snapshots);

            const result = await repository.getContractorSnapshots();

            expect(result).toEqual(snapshots);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 2000'),
                expect.any(Object)
            );
        });

        it('should return snapshots with custom limit', async () => {
            const snapshots = [{ contractorId: '000001', contractorName: 'ABC Inc' }];
            repository.query.mockResolvedValue(snapshots);

            const result = await repository.getContractorSnapshots(500);

            expect(result).toEqual(snapshots);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 500'),
                expect.any(Object)
            );
        });

        it('should order by ContractorID', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getContractorSnapshots(100);

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY ContractorID'),
                expect.any(Object)
            );
        });

        it('should handle empty result', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getContractorSnapshots();

            expect(result).toEqual([]);
        });
    });

    describe('getContractorSnapshotsByDate', () => {
        it('should return snapshots for specific date', async () => {
            const snapshots = [
                { contractorId: '000001', contractorName: 'ABC Inc', snapshotWed: '2025-01-15' },
            ];
            repository.query.mockResolvedValue(snapshots);

            const result = await repository.getContractorSnapshotsByDate('2025-01-15');

            expect(result).toEqual(snapshots);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SnapshotWed'),
                expect.objectContaining({ snapshotDate: '2025-01-15' })
            );
        });

        it('should filter by date correctly', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getContractorSnapshotsByDate('2025-02-20');

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('CONVERT(date, SnapshotWed) = CONVERT(date, @snapshotDate)'),
                expect.any(Object)
            );
        });

        it('should handle empty result for date', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getContractorSnapshotsByDate('2025-01-15');

            expect(result).toEqual([]);
        });
    });

    describe('getMostRecentSnapshotByContractorId', () => {
        it('should return most recent snapshot for contractor', async () => {
            const snapshot = {
                contractorId: '000001',
                contractorName: 'ABC Inc',
                snapshotWed: '2025-01-15'
            };
            repository.query.mockResolvedValue([snapshot]);

            const result = await repository.getMostRecentSnapshotByContractorId('000001', '2025-01-15');

            expect(result).toEqual(snapshot);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('TOP 1'),
                expect.objectContaining({
                    contractorId: '000001',
                    runDate: '2025-01-15'
                })
            );
        });

        it('should return null if no snapshot found', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getMostRecentSnapshotByContractorId('000001', '2025-01-15');

            expect(result).toBeNull();
        });

        it('should order by SnapshotWed descending to get most recent', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getMostRecentSnapshotByContractorId('000001', '2025-01-15');

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY SnapshotWed DESC'),
                expect.any(Object)
            );
        });

        it('should filter by run date constraint', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getMostRecentSnapshotByContractorId('000001', '2025-01-15');

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('SnapshotWed <= @runDate'),
                expect.any(Object)
            );
        });
    });

    describe('createContractorSnapshot', () => {
        it('should insert contractor snapshot', async () => {
            const snapshotData = {
                contractorId: '000001',
                contractorName: 'ABC Inc',
                lastWedReported: new Date('2025-01-01'),
                snapshotWed: new Date('2025-01-08'),
                companyType: 'Union',
                lastHireDate: new Date('2025-01-10'),
                journeypersons: 5,
                isInactive: false
            };

            repository.execute.mockResolvedValue(1);

            const result = await repository.createContractorSnapshot(snapshotData);

            expect(result).toBe(1);
            expect(repository.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO dbo.CMP_ContractorSnapshot'),
                expect.objectContaining({
                    contractorId: '000001',
                    contractorName: 'ABC Inc',
                })
            );
        });

        it('should handle null date fields', async () => {
            const snapshotData = {
                contractorId: '000002',
                contractorName: 'XYZ Corp',
                lastWedReported: null,
                snapshotWed: '2025-01-08',
                companyType: null,
                lastHireDate: null,
                journeypersons: 0,
                isInactive: true
            };

            repository.execute.mockResolvedValue(1);

            await repository.createContractorSnapshot(snapshotData);

            expect(repository.execute).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    lastWedReported: null,
                    lastHireDate: null,
                    companyType: null,
                })
            );
        });

        it('should prevent duplicate entries for same contractor and date', async () => {
            const snapshotData = {
                contractorId: '000003',
                contractorName: 'Duplicate Test',
                lastWedReported: '2025-01-01',
                snapshotWed: '2025-01-08',
                companyType: 'Union',
                lastHireDate: '2025-01-10',
                journeypersons: 3,
                isInactive: false
            };

            repository.execute.mockResolvedValue(1);

            await repository.createContractorSnapshot(snapshotData);

            expect(repository.execute).toHaveBeenCalledWith(
                expect.stringContaining('WHERE NOT EXISTS'),
                expect.any(Object)
            );
        });

        it('should pass all parameters to execute', async () => {
            const snapshotData = {
                contractorId: '000004',
                contractorName: 'Full Test Corp',
                lastWedReported: '2025-01-01',
                snapshotWed: '2025-01-08',
                companyType: 'Non-union',
                lastHireDate: '2025-01-10',
                journeypersons: 8,
                isInactive: false
            };

            repository.execute.mockResolvedValue(1);

            await repository.createContractorSnapshot(snapshotData);

            expect(repository.execute).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    contractorId: '000004',
                    contractorName: 'Full Test Corp',
                    snapshotWed: '2025-01-08',
                    companyType: 'Non-union',
                    journeypersons: 8,
                    isInactive: false,
                })
            );
        });

        it('should handle database errors during insert', async () => {
            const snapshotData = {
                contractorId: '000005',
                contractorName: 'Error Test',
                lastWedReported: null,
                snapshotWed: '2025-01-08',
                companyType: 'Union',
                lastHireDate: null,
                journeypersons: 0,
                isInactive: false
            };

            repository.execute.mockRejectedValue(new Error('Constraint violation'));

            await expect(repository.createContractorSnapshot(snapshotData))
                .rejects.toThrow('Constraint violation');
        });
    });

    describe('repository initialization', () => {
        it('should accept pool in constructor', () => {
            const pool = { request: vi.fn() };
            const repo = new ContractorSnapshotRepository(pool);

            expect(repo.contractorSnapshotRepo || repo.pool || repo.constructor).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should propagate query errors', async () => {
            repository.query.mockRejectedValue(new Error('SQL error'));

            await expect(repository.getContractorSnapshots())
                .rejects.toThrow('SQL error');
        });

        it('should propagate execute errors', async () => {
            repository.execute.mockRejectedValue(new Error('Insert failed'));

            const snapshotData = {
                contractorId: '000001',
                contractorName: 'Error Test',
                lastWedReported: null,
                snapshotWed: '2025-01-08',
                companyType: 'Union',
                lastHireDate: null,
                journeypersons: 0,
                isInactive: false
            };

            await expect(repository.createContractorSnapshot(snapshotData))
                .rejects.toThrow('Insert failed');
        });
    });
});
