/**
 * BlacklistService.test.js - Unit tests for BlacklistService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlacklistService } from './BlacklistService.js';

describe('BlacklistService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            getAll: vi.fn(),
            getAllIncludingDeleted: vi.fn(),
            getById: vi.fn(),
            getByEmployerId: vi.fn(),
            isBlacklisted: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        service = new BlacklistService(mockRepository);
    });

    describe('getAll', () => {
        it('should return all non-deleted blacklist records', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', createdOn: '2025-01-01' },
                { id: 2, employerId: 'EMP002', contractorName: 'XYZ Corp', createdOn: '2025-01-08' },
            ];
            mockRepository.getAll.mockResolvedValue(records);

            const result = await service.getAll();

            expect(result).toEqual(records);
            expect(mockRepository.getAll).toHaveBeenCalled();
        });

        it('should handle empty blacklist', async () => {
            mockRepository.getAll.mockResolvedValue([]);

            const result = await service.getAll();

            expect(result).toEqual([]);
        });
    });

    describe('getAllIncludingDeleted', () => {
        it('should return all blacklist records including deleted ones', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', createdOn: '2025-01-01', deletedOn: null },
                { id: 2, employerId: 'EMP002', contractorName: 'XYZ Corp', createdOn: '2025-01-08', deletedOn: '2025-02-01' },
            ];
            mockRepository.getAllIncludingDeleted.mockResolvedValue(records);

            const result = await service.getAllIncludingDeleted();

            expect(result).toEqual(records);
            expect(mockRepository.getAllIncludingDeleted).toHaveBeenCalled();
        });
    });

    describe('getById', () => {
        it('should return blacklist record by ID', async () => {
            const record = { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc' };
            mockRepository.getById.mockResolvedValue(record);

            const result = await service.getById(1);

            expect(result).toEqual(record);
            expect(mockRepository.getById).toHaveBeenCalledWith(1);
        });

        it('should throw error when record not found', async () => {
            mockRepository.getById.mockResolvedValue(null);

            await expect(service.getById(999))
                .rejects.toThrow('Blacklist record 999 not found');
        });
    });

    describe('getByEmployerId', () => {
        it('should return blacklist records for employer', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc' },
                { id: 2, employerId: 'EMP001', contractorName: 'XYZ Corp' },
            ];
            mockRepository.getByEmployerId.mockResolvedValue(records);

            const result = await service.getByEmployerId('EMP001');

            expect(result).toEqual(records);
            expect(mockRepository.getByEmployerId).toHaveBeenCalledWith('EMP001');
        });

        it('should handle no records for employer', async () => {
            mockRepository.getByEmployerId.mockResolvedValue([]);

            const result = await service.getByEmployerId('EMP999');

            expect(result).toEqual([]);
        });

        it('should throw error if employer ID is missing', async () => {
            await expect(service.getByEmployerId(null))
                .rejects.toThrow('Employer ID is required');
        });

        it('should throw error if employer ID is empty', async () => {
            await expect(service.getByEmployerId(''))
                .rejects.toThrow('Employer ID is required');
        });
    });

    describe('isBlacklisted', () => {
        it('should return true if contractor is blacklisted', async () => {
            mockRepository.isBlacklisted.mockResolvedValue(true);

            const result = await service.isBlacklisted('EMP001', 'ABC Inc');

            expect(result).toBe(true);
            expect(mockRepository.isBlacklisted).toHaveBeenCalledWith('EMP001', 'ABC Inc');
        });

        it('should return false if contractor is not blacklisted', async () => {
            mockRepository.isBlacklisted.mockResolvedValue(false);

            const result = await service.isBlacklisted('EMP001', 'Unknown Corp');

            expect(result).toBe(false);
        });

        it('should throw error if employer ID is missing', async () => {
            await expect(service.isBlacklisted(null, 'ABC Inc'))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should throw error if contractor name is missing', async () => {
            await expect(service.isBlacklisted('EMP001', null))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should throw error if both are missing', async () => {
            await expect(service.isBlacklisted(null, null))
                .rejects.toThrow('Employer ID and contractor name are required');
        });
    });

    describe('create', () => {
        it('should create new blacklist entry', async () => {
            const newRecord = { id: 3, employerId: 'EMP003', contractorName: 'New Corp' };
            mockRepository.isBlacklisted.mockResolvedValue(false);
            mockRepository.create.mockResolvedValue(newRecord);

            const result = await service.create({
                employerId: 'EMP003',
                contractorName: 'New Corp'
            });

            expect(result).toEqual(newRecord);
            expect(mockRepository.isBlacklisted).toHaveBeenCalledWith('EMP003', 'New Corp');
            expect(mockRepository.create).toHaveBeenCalledWith({
                employerId: 'EMP003',
                contractorName: 'New Corp'
            });
        });

        it('should trim employer ID and contractor name', async () => {
            const newRecord = { id: 4, employerId: 'EMP004', contractorName: 'Trimmed Corp' };
            mockRepository.isBlacklisted.mockResolvedValue(false);
            mockRepository.create.mockResolvedValue(newRecord);

            await service.create({
                employerId: '  EMP004  ',
                contractorName: '  Trimmed Corp  '
            });

            expect(mockRepository.create).toHaveBeenCalledWith({
                employerId: 'EMP004',
                contractorName: 'Trimmed Corp'
            });
        });

        it('should throw error if employer ID is missing', async () => {
            await expect(service.create({
                employerId: null,
                contractorName: 'ABC Inc'
            })).rejects.toThrow('Employer ID is required');
        });

        it('should throw error if contractor name is missing', async () => {
            await expect(service.create({
                employerId: 'EMP001',
                contractorName: null
            })).rejects.toThrow('Contractor name is required');
        });

        it('should throw error if contractor already blacklisted', async () => {
            mockRepository.isBlacklisted.mockResolvedValue(true);

            await expect(service.create({
                employerId: 'EMP001',
                contractorName: 'ABC Inc'
            })).rejects.toThrow('This contractor is already blacklisted for this employer');

            expect(mockRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update blacklist entry', async () => {
            const updated = { id: 1, employerId: 'EMP001', contractorName: 'Updated Name' };
            mockRepository.update.mockResolvedValue(updated);

            const result = await service.update(1, { contractorName: 'Updated Name' });

            expect(result).toEqual(updated);
            expect(mockRepository.update).toHaveBeenCalledWith(1, {
                contractorName: 'Updated Name'
            });
        });

        it('should trim contractor name on update', async () => {
            const updated = { id: 1, employerId: 'EMP001', contractorName: 'Trimmed' };
            mockRepository.update.mockResolvedValue(updated);

            await service.update(1, { contractorName: '  Trimmed  ' });

            expect(mockRepository.update).toHaveBeenCalledWith(1, {
                contractorName: 'Trimmed'
            });
        });

        it('should throw error if ID is missing', async () => {
            await expect(service.update(null, { contractorName: 'New Name' }))
                .rejects.toThrow('Blacklist ID is required');
        });

        it('should throw error if contractor name is missing', async () => {
            await expect(service.update(1, { contractorName: null }))
                .rejects.toThrow('Contractor name is required');
        });

        it('should throw error if record not found or already deleted', async () => {
            mockRepository.update.mockResolvedValue(null);

            await expect(service.update(999, { contractorName: 'Name' }))
                .rejects.toThrow('Blacklist record 999 not found or already deleted');
        });
    });

    describe('delete', () => {
        it('should soft delete blacklist entry', async () => {
            const deleted = { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', deletedOn: '2025-02-01' };
            mockRepository.delete.mockResolvedValue(deleted);

            const result = await service.delete(1);

            expect(result).toEqual(deleted);
            expect(mockRepository.delete).toHaveBeenCalledWith(1);
        });

        it('should throw error if ID is missing', async () => {
            await expect(service.delete(null))
                .rejects.toThrow('Blacklist ID is required');
        });

        it('should throw error if record not found or already deleted', async () => {
            mockRepository.delete.mockResolvedValue(null);

            await expect(service.delete(999))
                .rejects.toThrow('Blacklist record 999 not found or already deleted');
        });
    });

    describe('service error handling', () => {
        it('should propagate repository errors for getAll', async () => {
            mockRepository.getAll.mockRejectedValue(
                new Error('Database connection failed')
            );

            await expect(service.getAll())
                .rejects.toThrow('Database connection failed');
        });

        it('should propagate repository errors for create', async () => {
            mockRepository.isBlacklisted.mockResolvedValue(false);
            mockRepository.create.mockRejectedValue(
                new Error('Database constraint violation')
            );

            await expect(service.create({
                employerId: 'EMP001',
                contractorName: 'ABC Inc'
            })).rejects.toThrow('Database constraint violation');
        });
    });
});
