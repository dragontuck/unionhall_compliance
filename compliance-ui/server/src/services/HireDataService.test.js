/**
 * HireDataService.test.js - Unit tests for HireDataService
 */

import { HireDataService } from './HireDataService.js';

describe('HireDataService', () => {
    let service;
    let mockHireDataRepo;

    beforeEach(() => {
        mockHireDataRepo = {
            getHireData: jest.fn(),
            getRecentHires: jest.fn(),
            getHiresForContractor: jest.fn(),
            createReviewedHire: jest.fn(),
        };

        service = new HireDataService(mockHireDataRepo);
    });

    describe('getHireData', () => {
        it('should return hire data with default limit', async () => {
            const hires = [
                { id: 1, contractorId: 100, memberName: 'John Doe' },
                { id: 2, contractorId: 101, memberName: 'Jane Smith' },
            ];
            mockHireDataRepo.getHireData.mockResolvedValue(hires);

            const result = await service.getHireData();

            expect(result).toEqual(hires);
            expect(mockHireDataRepo.getHireData).toHaveBeenCalledWith({}, 2000);
        });

        it('should return hire data with filters and custom limit', async () => {
            const hires = [{ id: 1, contractorId: 100 }];
            mockHireDataRepo.getHireData.mockResolvedValue(hires);

            const filters = { contractorId: 100 };
            const result = await service.getHireData(filters, 500);

            expect(result).toEqual(hires);
            expect(mockHireDataRepo.getHireData).toHaveBeenCalledWith(filters, 500);
        });

        it('should handle empty results', async () => {
            mockHireDataRepo.getHireData.mockResolvedValue([]);

            const result = await service.getHireData();

            expect(result).toEqual([]);
        });
    });

    describe('getRecentHires', () => {
        it('should return recent hires for a run', async () => {
            const recentHires = [
                { id: 1, runId: 5, hireDate: '2025-01-10' },
            ];
            mockHireDataRepo.getRecentHires.mockResolvedValue(recentHires);

            const result = await service.getRecentHires(5);

            expect(result).toEqual(recentHires);
            expect(mockHireDataRepo.getRecentHires).toHaveBeenCalledWith(5);
        });
    });

    describe('getHiresForContractor', () => {
        it('should return hires for a specific contractor', async () => {
            const hires = [
                { id: 1, contractorId: 100, memberName: 'John' },
            ];
            mockHireDataRepo.getHiresForContractor.mockResolvedValue(hires);

            const result = await service.getHiresForContractor(100, '2025-01-15');

            expect(result).toEqual(hires);
            expect(mockHireDataRepo.getHiresForContractor).toHaveBeenCalledWith(100, '2025-01-15');
        });

        it('should throw error if contractorId missing', async () => {
            await expect(service.getHiresForContractor(null, '2025-01-15'))
                .rejects.toThrow('Contractor ID and reviewed date are required');
        });

        it('should throw error if reviewedDate missing', async () => {
            await expect(service.getHiresForContractor(100, null))
                .rejects.toThrow('Contractor ID and reviewed date are required');
        });
    });

    describe('importHires', () => {
        const converters = {
            toInt: (val) => val ? parseInt(val) : null,
            toBool: (val) => val === 'true' || val === '1' ? true : false,
            toDate: (val) => val && val !== 'null' ? val : null,
        };

        it('should import valid hire records', async () => {
            const rows = [
                {
                    'Employer ID': 'EMP001',
                    'Contractor Name': 'ABC Corp',
                    'Member Name': 'John Doe',
                    'IA Number': '12345',
                    'Start Date': '2025-01-01',
                    'Hire Type': 'Direct',
                    'Is Reviewed': 'true',
                    'Is Excluded': 'false',
                    'End Date': '',
                    'Contractor ID': '100',
                    'Is Inactive': 'false',
                    'Reviewed Date': '2025-01-15',
                    'Excluded Compliance Rules': '',
                    'Created By User Name': 'admin',
                    'Created By Name': 'Admin',
                    'Created on': '2025-01-15',
                },
            ];

            mockHireDataRepo.createReviewedHire.mockResolvedValue({ id: 1 });

            const result = await service.importHires(rows, converters);

            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(0);
            expect(result.errors).toEqual([]);
            expect(mockHireDataRepo.createReviewedHire).toHaveBeenCalled();
        });

        it('should handle import errors gracefully', async () => {
            const rows = [
                {
                    'Employer ID': 'EMP001',
                    'Member Name': 'John',
                    'IA Number': 'invalid',
                },
                {
                    'Employer ID': 'EMP002',
                    'Member Name': 'Jane',
                    'IA Number': '456',
                },
            ];

            mockHireDataRepo.createReviewedHire
                .mockRejectedValueOnce(new Error('Invalid data'))
                .mockResolvedValueOnce({ id: 2 });

            const result = await service.importHires(rows, converters);

            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(1);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0]).toContain('Row 1');
        });

        it('should throw error if rows is not an array', async () => {
            await expect(service.importHires('not an array', converters))
                .rejects.toThrow('Rows must be an array');
        });

        it('should throw error if rows is null', async () => {
            await expect(service.importHires(null, converters))
                .rejects.toThrow('Rows must be an array');
        });

        it('should handle empty rows array', async () => {
            const result = await service.importHires([], converters);

            expect(result.successCount).toBe(0);
            expect(result.failCount).toBe(0);
            expect(result.errors).toEqual([]);
        });

        it('should process multiple rows', async () => {
            const rows = [
                { 'Employer ID': 'EMP001', 'IA Number': '100' },
                { 'Employer ID': 'EMP002', 'IA Number': '101' },
                { 'Employer ID': 'EMP003', 'IA Number': '102' },
            ];

            mockHireDataRepo.createReviewedHire.mockResolvedValue({ id: 1 });

            const result = await service.importHires(rows, converters);

            expect(result.successCount).toBe(3);
            expect(result.failCount).toBe(0);
            expect(mockHireDataRepo.createReviewedHire).toHaveBeenCalledTimes(3);
        });
    });
});
