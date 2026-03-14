/**
 * BlacklistController.test.js - Unit tests for BlacklistController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlacklistController } from './BlacklistController.js';
import { AppError } from '../errors/AppError.js';

describe('BlacklistController', () => {
    let controller;
    let mockService;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockService = {
            getAll: vi.fn(),
            getAllIncludingDeleted: vi.fn(),
            getById: vi.fn(),
            getByEmployerId: vi.fn(),
            isBlacklisted: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        controller = new BlacklistController(mockService);

        mockResponse = {
            json: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
        };

        mockRequest = {
            query: {},
            params: {},
            body: {},
        };
    });

    describe('getAll', () => {
        it('should return all non-deleted blacklist records', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc' },
                { id: 2, employerId: 'EMP002', contractorName: 'XYZ Corp' },
            ];
            mockService.getAll.mockResolvedValue(records);

            await controller.getAll(mockRequest, mockResponse);

            expect(mockService.getAll).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(records);
        });

        it('should handle empty blacklist', async () => {
            mockService.getAll.mockResolvedValue([]);

            await controller.getAll(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });

        it('should propagate service errors', async () => {
            mockService.getAll.mockRejectedValue(new Error('Database error'));

            await expect(controller.getAll(mockRequest, mockResponse))
                .rejects.toThrow('Database error');
        });
    });

    describe('getAllIncludingDeleted', () => {
        it('should return all records including deleted', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', deletedOn: null },
                { id: 2, employerId: 'EMP002', contractorName: 'XYZ Corp', deletedOn: '2025-02-01' },
            ];
            mockService.getAllIncludingDeleted.mockResolvedValue(records);

            await controller.getAllIncludingDeleted(mockRequest, mockResponse);

            expect(mockService.getAllIncludingDeleted).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(records);
        });
    });

    describe('getById', () => {
        it('should return record by ID', async () => {
            const record = { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc' };
            mockService.getById.mockResolvedValue(record);
            mockRequest.params = { id: '1' };

            await controller.getById(mockRequest, mockResponse);

            expect(mockService.getById).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith(record);
        });

        it('should throw error if ID is not a valid integer', async () => {
            mockRequest.params = { id: 'invalid' };

            await expect(controller.getById(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist ID must be a valid integer');
        });

        it('should throw error if record not found', async () => {
            mockService.getById.mockRejectedValue(new Error('Blacklist record 999 not found'));
            mockRequest.params = { id: '999' };

            await expect(controller.getById(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist record 999 not found');
        });
    });

    describe('getByEmployerId', () => {
        it('should return records for employer', async () => {
            const records = [
                { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc' },
            ];
            mockService.getByEmployerId.mockResolvedValue(records);
            mockRequest.params = { employerId: 'EMP001' };

            await controller.getByEmployerId(mockRequest, mockResponse);

            expect(mockService.getByEmployerId).toHaveBeenCalledWith('EMP001');
            expect(mockResponse.json).toHaveBeenCalledWith(records);
        });

        it('should throw error if employer ID is missing', async () => {
            mockRequest.params = { employerId: '' };

            await expect(controller.getByEmployerId(mockRequest, mockResponse))
                .rejects.toThrow('Employer ID is required');
        });

        it('should handle no records for employer', async () => {
            mockService.getByEmployerId.mockResolvedValue([]);
            mockRequest.params = { employerId: 'EMP999' };

            await controller.getByEmployerId(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });
    });

    describe('checkBlacklist', () => {
        it('should check if contractor is blacklisted', async () => {
            mockService.isBlacklisted.mockResolvedValue(true);
            mockRequest.body = { employerId: 'EMP001', contractorName: 'ABC Inc' };

            await controller.checkBlacklist(mockRequest, mockResponse);

            expect(mockService.isBlacklisted).toHaveBeenCalledWith('EMP001', 'ABC Inc');
            expect(mockResponse.json).toHaveBeenCalledWith({ isBlacklisted: true });
        });

        it('should return false if contractor is not blacklisted', async () => {
            mockService.isBlacklisted.mockResolvedValue(false);
            mockRequest.body = { employerId: 'EMP001', contractorName: 'Unknown Corp' };

            await controller.checkBlacklist(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({ isBlacklisted: false });
        });

        it('should throw error if employer ID is missing', async () => {
            mockRequest.body = { contractorName: 'ABC Inc' };

            await expect(controller.checkBlacklist(mockRequest, mockResponse))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should throw error if contractor name is missing', async () => {
            mockRequest.body = { employerId: 'EMP001' };

            await expect(controller.checkBlacklist(mockRequest, mockResponse))
                .rejects.toThrow('Employer ID and contractor name are required');
        });
    });

    describe('create', () => {
        it('should create new blacklist entry', async () => {
            const newRecord = { id: 3, employerId: 'EMP003', contractorName: 'New Corp' };
            mockService.create.mockResolvedValue(newRecord);
            mockRequest.body = { employerId: 'EMP003', contractorName: 'New Corp' };

            await controller.create(mockRequest, mockResponse);

            expect(mockService.create).toHaveBeenCalledWith({
                employerId: 'EMP003',
                contractorName: 'New Corp'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(newRecord);
        });

        it('should throw error if employer ID is missing', async () => {
            mockRequest.body = { contractorName: 'ABC Inc' };

            await expect(controller.create(mockRequest, mockResponse))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should throw error if contractor name is missing', async () => {
            mockRequest.body = { employerId: 'EMP001' };

            await expect(controller.create(mockRequest, mockResponse))
                .rejects.toThrow('Employer ID and contractor name are required');
        });

        it('should propagate service validation errors', async () => {
            mockService.create.mockRejectedValue(
                new Error('This contractor is already blacklisted for this employer')
            );
            mockRequest.body = { employerId: 'EMP001', contractorName: 'ABC Inc' };

            await expect(controller.create(mockRequest, mockResponse))
                .rejects.toThrow('This contractor is already blacklisted for this employer');
        });
    });

    describe('update', () => {
        it('should update blacklist entry', async () => {
            const updated = { id: 1, employerId: 'EMP001', contractorName: 'Updated Name' };
            mockService.update.mockResolvedValue(updated);
            mockRequest.params = { id: '1' };
            mockRequest.body = { contractorName: 'Updated Name' };

            await controller.update(mockRequest, mockResponse);

            expect(mockService.update).toHaveBeenCalledWith(1, {
                contractorName: 'Updated Name'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(updated);
        });

        it('should throw error if ID is not a valid integer', async () => {
            mockRequest.params = { id: 'invalid' };
            mockRequest.body = { contractorName: 'Updated' };

            await expect(controller.update(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist ID must be a valid integer');
        });

        it('should throw error if contractor name is missing', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { contractorName: null };

            await expect(controller.update(mockRequest, mockResponse))
                .rejects.toThrow('Contractor name is required');
        });

        it('should propagate service errors', async () => {
            mockService.update.mockRejectedValue(
                new Error('Blacklist record 999 not found or already deleted')
            );
            mockRequest.params = { id: '999' };
            mockRequest.body = { contractorName: 'Name' };

            await expect(controller.update(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist record 999 not found or already deleted');
        });
    });

    describe('delete', () => {
        it('should soft delete blacklist entry', async () => {
            const deleted = { id: 1, employerId: 'EMP001', contractorName: 'ABC Inc', deletedOn: '2025-02-01' };
            mockService.delete.mockResolvedValue(deleted);
            mockRequest.params = { id: '1' };

            await controller.delete(mockRequest, mockResponse);

            expect(mockService.delete).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith(deleted);
        });

        it('should throw error if ID is not a valid integer', async () => {
            mockRequest.params = { id: 'invalid' };

            await expect(controller.delete(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist ID must be a valid integer');
        });

        it('should throw error if record not found', async () => {
            mockService.delete.mockRejectedValue(
                new Error('Blacklist record 999 not found or already deleted')
            );
            mockRequest.params = { id: '999' };

            await expect(controller.delete(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist record 999 not found or already deleted');
        });
    });

    describe('error handling', () => {
        it('should handle validation errors from request parameters', async () => {
            mockRequest.params = { id: 'abc' };

            await expect(controller.getById(mockRequest, mockResponse))
                .rejects.toThrow('Blacklist ID must be a valid integer');
        });

        it('should handle service layer errors', async () => {
            mockService.getAll.mockRejectedValue(new Error('Database connection error'));

            await expect(controller.getAll(mockRequest, mockResponse))
                .rejects.toThrow('Database connection error');
        });
    });

    describe('controller initialization', () => {
        it('should accept service in constructor', () => {
            const service = { getAll: vi.fn() };
            const ctrl = new BlacklistController(service);

            expect(ctrl.blacklistService).toEqual(service);
        });

        it('should bind all handler methods', () => {
            expect(controller.getAll).toBeDefined();
            expect(controller.getAllIncludingDeleted).toBeDefined();
            expect(controller.getById).toBeDefined();
            expect(controller.getByEmployerId).toBeDefined();
            expect(controller.checkBlacklist).toBeDefined();
            expect(controller.create).toBeDefined();
            expect(controller.update).toBeDefined();
            expect(controller.delete).toBeDefined();
        });
    });

    describe('HTTP status codes', () => {
        it('should return 201 status on create', async () => {
            const newRecord = { id: 1, employerId: 'EMP001', contractorName: 'Test' };
            mockService.create.mockResolvedValue(newRecord);
            mockRequest.body = newRecord;

            await controller.create(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('should return 200 status (implicit) on getAll', async () => {
            mockService.getAll.mockResolvedValue([]);

            await controller.getAll(mockRequest, mockResponse);

            // getAll doesn't explicitly call status(), so only json() is called
            expect(mockResponse.json).toHaveBeenCalled();
        });
    });
});
