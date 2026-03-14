/**
 * BlacklistRepository.test.js - Unit tests for BlacklistRepository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlacklistRepository } from './BlacklistRepository.js';

describe('BlacklistRepository', () => {
    let repository;
    let mockPool;

    beforeEach(() => {
        mockPool = {
            request: vi.fn(),
        };

        repository = new BlacklistRepository(mockPool);

        // Mock the query and execute methods from parent MssqlRepository
        vi.spyOn(repository, 'query').mockResolvedValue([]);
        vi.spyOn(repository, 'queryOne').mockResolvedValue(null);
    });

    describe('getAll', () => {
        it('should return all non-deleted blacklist records', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', createdOn: '2025-01-01', deletedOn: null },
                { id: 2, employerId: 'EMP002', contractorName: 'XYZ Corp', createdOn: '2025-01-08', deletedOn: null },
            ];
            repository.query.mockResolvedValue(records);

            const result = await repository.getAll();

            expect(result).toEqual(records);
            expect(repository.query).toHaveBeenCalled();
            const callArgs = repository.query.mock.calls[0];
            expect(callArgs[0]).toContain('WHERE [DeletedOn] IS NULL');
        });

        it('should order by CreatedOn descending', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getAll();

            const callArgs = repository.query.mock.calls[0];
            expect(callArgs[0]).toContain('ORDER BY [CreatedOn] DESC');
        });

        it('should handle empty result', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getAll();

            expect(result).toEqual([]);
        });
    });

    describe('getAllIncludingDeleted', () => {
        it('should return all blacklist records including deleted', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', createdOn: '2025-01-01', deletedOn: null },
                { id: 2, employerId: 'EMP002', contractorName: 'XYZ Corp', createdOn: '2025-01-08', deletedOn: '2025-02-01' },
            ];
            repository.query.mockResolvedValue(records);

            const result = await repository.getAllIncludingDeleted();

            expect(result).toEqual(records);
            expect(repository.query).toHaveBeenCalled();
            const callArgs = repository.query.mock.calls[0];
            expect(callArgs[0]).toContain('SELECT');
        });
    });

    describe('getById', () => {
        it('should return blacklist record by ID', async () => {
            const record = { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc' };
            repository.queryOne.mockResolvedValue(record);

            const result = await repository.getById(1);

            expect(result).toEqual(record);
            expect(repository.queryOne).toHaveBeenCalledWith(
                expect.stringContaining('WHERE [Id] = @id'),
                expect.objectContaining({ id: 1 })
            );
        });

        it('should return null if record not found', async () => {
            repository.queryOne.mockResolvedValue(null);

            const result = await repository.getById(999);

            expect(result).toBeNull();
        });
    });

    describe('getByEmployerId', () => {
        it('should return blacklist records for employer', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', createdOn: '2025-01-01', deletedOn: null },
                { id: 2, employerId: 'EMP001', contractorName: 'XYZ Corp', createdOn: '2025-01-08', deletedOn: null },
            ];
            repository.query.mockResolvedValue(records);

            const result = await repository.getByEmployerId('EMP001');

            expect(result).toEqual(records);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE [EmployerID] = @employerId AND [DeletedOn] IS NULL'),
                expect.objectContaining({ employerId: 'EMP001' })
            );
        });

        it('should only return non-deleted records', async () => {
            repository.query.mockResolvedValue([]);

            await repository.getByEmployerId('EMP001');

            const callArgs = repository.query.mock.calls[0];
            expect(callArgs[0]).toContain('[DeletedOn] IS NULL');
        });

        it('should handle no records for employer', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.getByEmployerId('EMP999');

            expect(result).toEqual([]);
        });
    });

    describe('isBlacklisted', () => {
        it('should return true if contractor is blacklisted', async () => {
            repository.queryOne.mockResolvedValue({ cnt: 1 });

            const result = await repository.isBlacklisted('EMP001', 'ABC Inc');

            expect(result).toBe(true);
            expect(repository.queryOne).toHaveBeenCalledWith(
                expect.stringContaining('WHERE [EmployerID] = @employerId'),
                expect.objectContaining({ employerId: 'EMP001', contractorName: 'ABC Inc' })
            );
        });

        it('should return false if contractor is not blacklisted', async () => {
            repository.queryOne.mockResolvedValue({ cnt: 0 });

            const result = await repository.isBlacklisted('EMP001', 'Unknown Corp');

            expect(result).toBe(false);
        });

        it('should only check non-deleted records', async () => {
            repository.queryOne.mockResolvedValue({ cnt: 0 });

            await repository.isBlacklisted('EMP001', 'ABC Inc');

            const callArgs = repository.queryOne.mock.calls[0];
            expect(callArgs[0]).toContain('[DeletedOn] IS NULL');
        });
    });

    describe('create', () => {
        it('should create new blacklist entry', async () => {
            const newRecord = { id: 3, employerId: 'EMP003', contractorName: 'New Corp', createdOn: '2025-02-01', deletedOn: null };
            repository.query.mockResolvedValue([newRecord]);

            const result = await repository.create({ employerId: 'EMP003', contractorName: 'New Corp' });

            expect(result).toEqual(newRecord);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO [dbo].[CMP_ContractorBlacklist]'),
                expect.objectContaining({ employerId: 'EMP003', contractorName: 'New Corp' })
            );
        });

        it('should throw error if employer ID is missing', async () => {
            await expect(repository.create({ employerId: null, contractorName: 'ABC Inc' }))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should throw error if contractor name is missing', async () => {
            await expect(repository.create({ employerId: 'EMP001', contractorName: null }))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should output inserted ID', async () => {
            repository.query.mockResolvedValue([{ id: 5, employerId: 'EMP005', contractorName: 'Test' }]);

            const result = await repository.create({ employerId: 'EMP005', contractorName: 'Test' });

            expect(result.id).toBe(5);
        });
    });

    describe('update', () => {
        it('should update blacklist entry', async () => {
            const updated = { id: 1, employerId: 'EMP001', contractorName: 'Updated Name', createdOn: '2025-01-01', deletedOn: null };
            repository.query.mockResolvedValue([updated]);

            const result = await repository.update(1, { contractorName: 'Updated Name' });

            expect(result).toEqual(updated);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE [dbo].[CMP_ContractorBlacklist]'),
                expect.objectContaining({ id: 1, contractorName: 'Updated Name' })
            );
        });

        it('should return null if record not found', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.update(999, { contractorName: 'Name' });

            expect(result).toBeNull();
        });

        it('should only update non-deleted records', async () => {
            repository.query.mockResolvedValue([]);

            await repository.update(1, { contractorName: 'Updated' });

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('[DeletedOn] IS NULL'),
                expect.any(Object)
            );
        });

        it('should throw error if contractor name is missing', async () => {
            await expect(repository.update(1, { contractorName: null }))
                .rejects.toThrow('Contractor name is required');
        });
    });

    describe('delete', () => {
        it('should soft delete blacklist entry', async () => {
            const deleted = { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', createdOn: '2025-01-01', deletedOn: '2025-02-01' };
            repository.query.mockResolvedValue([deleted]);

            const result = await repository.delete(1);

            expect(result).toEqual(deleted);
            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE [dbo].[CMP_ContractorBlacklist]'),
                expect.objectContaining({ id: 1 })
            );
        });

        it('should set DeletedOn to SYSDATETIME', async () => {
            repository.query.mockResolvedValue([]);

            await repository.delete(1);

            expect(repository.query).toHaveBeenCalledWith(
                expect.stringContaining('[DeletedOn] = SYSDATETIME()'),
                expect.any(Object)
            );
        });

        it('should return null if record not found or already deleted', async () => {
            repository.query.mockResolvedValue([]);

            const result = await repository.delete(999);

            expect(result).toBeNull();
        });

        it('should only delete non-deleted records', async () => {
            repository.query.mockResolvedValue([]);

            await repository.delete(1);

            const callArgs = repository.query.mock.calls[0];
            expect(callArgs[0]).toContain('[DeletedOn] IS NULL');
        });
    });

    describe('repository initialization', () => {
        it('should accept pool in constructor', () => {
            const pool = { request: vi.fn() };
            const repo = new BlacklistRepository(pool);

            expect(repo).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should propagate query errors', async () => {
            repository.query.mockRejectedValue(new Error('SQL error'));

            await expect(repository.getAll())
                .rejects.toThrow('SQL error');
        });

        it('should propagate queryOne errors', async () => {
            repository.queryOne.mockRejectedValue(new Error('Query failed'));

            await expect(repository.getById(1))
                .rejects.toThrow('Query failed');
        });
    });
});
