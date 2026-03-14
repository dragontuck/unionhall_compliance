/**
 * ContractorSnapshotController.test.js - Unit tests for ContractorSnapshotController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorSnapshotController } from './ContractorSnapshotController.js';
import { AppError } from '../errors/AppError.js';

describe('ContractorSnapshotController', () => {
    let controller;
    let mockService;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockService = {
            getContractorSnapshots: vi.fn(),
            getContractorSnapshotsByDate: vi.fn(),
            importContractorSnapshots: vi.fn(),
        };

        controller = new ContractorSnapshotController(mockService);

        mockResponse = {
            json: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
        };

        mockRequest = {
            query: {},
            params: {},
            file: null,
            body: {},
        };
    });

    describe('getContractorSnapshots', () => {
        it('should return snapshots with default limit', async () => {
            const snapshots = [
                { id: 1, contractorName: 'ABC Inc' },
                { id: 2, contractorName: 'XYZ Corp' },
            ];
            mockService.getContractorSnapshots.mockResolvedValue(snapshots);
            mockRequest.query = {};

            await controller.getContractorSnapshots(mockRequest, mockResponse);

            expect(mockService.getContractorSnapshots).toHaveBeenCalledWith(2000);
            expect(mockResponse.json).toHaveBeenCalledWith(snapshots);
        });

        it('should return snapshots with custom limit', async () => {
            const snapshots = [{ id: 1, contractorName: 'ABC Inc' }];
            mockService.getContractorSnapshots.mockResolvedValue(snapshots);
            mockRequest.query = { limit: '500' };

            await controller.getContractorSnapshots(mockRequest, mockResponse);

            expect(mockService.getContractorSnapshots).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(snapshots);
        });

        it('should fetch by date if snapshotDate is provided', async () => {
            const snapshots = [{ id: 1, snapshotWed: '2025-01-15' }];
            mockService.getContractorSnapshotsByDate.mockResolvedValue(snapshots);
            mockRequest.query = { snapshotDate: '2025-01-15' };

            await controller.getContractorSnapshots(mockRequest, mockResponse);

            expect(mockService.getContractorSnapshotsByDate).toHaveBeenCalledWith('2025-01-15');
            expect(mockService.getContractorSnapshots).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(snapshots);
        });

        it('should handle non-numeric limit gracefully', async () => {
            const snapshots = [{ id: 1 }];
            mockService.getContractorSnapshots.mockResolvedValue(snapshots);
            mockRequest.query = { limit: 'invalid' };

            await controller.getContractorSnapshots(mockRequest, mockResponse);

            expect(mockService.getContractorSnapshots).toHaveBeenCalledWith(2000); // NaN || 2000
        });

        it('should propagate service errors', async () => {
            mockService.getContractorSnapshots.mockRejectedValue(
                new Error('Service error')
            );
            mockRequest.query = {};

            await expect(controller.getContractorSnapshots(mockRequest, mockResponse))
                .rejects.toThrow('Service error');
        });
    });

    describe('importContractorSnapshots', () => {
        it('should throw error if no file uploaded', async () => {
            mockRequest.file = null;

            await expect(controller.importContractorSnapshots(mockRequest, mockResponse))
                .rejects.toThrow('No file uploaded');
        });

        it('should have import handler method', () => {
            expect(controller.importContractorSnapshots).toBeDefined();
            expect(typeof controller.importContractorSnapshots).toBe('function');
        });
    });

    describe('error handling with asyncHandler', () => {
        it('should handle errors thrown by service', async () => {
            mockService.getContractorSnapshots.mockRejectedValue(
                new Error('Database connection failed')
            );
            mockRequest.query = {};

            // asyncHandler should reject the promise
            await expect(controller.getContractorSnapshots(mockRequest, mockResponse))
                .rejects.toThrow('Database connection failed');
        });

        it('should handle AppError instances', async () => {
            mockService.getContractorSnapshots.mockRejectedValue(
                AppError.badRequest('Invalid request')
            );
            mockRequest.query = {};

            await expect(controller.getContractorSnapshots(mockRequest, mockResponse))
                .rejects.toThrow();
        });
    });

    describe('controller initialization', () => {
        it('should accept service in constructor', () => {
            const service = { getContractorSnapshots: vi.fn() };
            const ctrl = new ContractorSnapshotController(service);

            expect(ctrl.contractorSnapshotService).toEqual(service);
        });

        it('should bind handler methods', () => {
            expect(controller.getContractorSnapshots).toBeDefined();
            expect(controller.importContractorSnapshots).toBeDefined();
        });
    });
});
