/**
 * HireDataRepository.test.js - Unit tests for HireDataRepository
 */

import { HireDataRepository } from './HireDataRepository.js';

describe('HireDataRepository', () => {
    let repository;
    let mockPool;
    let mockRequest;

    beforeEach(() => {
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        };

        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest),
        };

        repository = new HireDataRepository(mockPool);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('getHireData', () => {
        it('should return hire data with default limit', async () => {
            const hireData = [
                { employerId: 'EMP001', contractorId: 100, memberName: 'John Doe' },
                { employerId: 'EMP002', contractorId: 101, memberName: 'Jane Smith' },
            ];
            mockRequest.query.mockResolvedValue({ recordset: hireData });

            const result = await repository.getHireData();

            expect(result).toEqual(hireData);
            expect(mockRequest.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 2000')
            );
        });

        it('should apply custom limit', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getHireData({}, 5000);

            expect(mockRequest.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 5000')
            );
        });

        it('should filter by reviewedDate', async () => {
            const hireData = [{ employerId: 'EMP001', reviewedDate: '2025-01-15' }];
            mockRequest.query.mockResolvedValue({ recordset: hireData });

            await repository.getHireData({ reviewedDate: '2025-01-15' });

            expect(mockRequest.query).toHaveBeenCalledWith(
                expect.stringContaining('ReviewedDate <= @reviewedDate')
            );
            expect(mockRequest.input).toHaveBeenCalledWith('reviewedDate', expect.anything(), '2025-01-15');
        });

        it('should order by ContractorName, StartDate, MemberName', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getHireData();

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY ContractorName, StartDate, MemberName');
        });

        it('should return empty array', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await repository.getHireData();

            expect(result).toEqual([]);
        });
    });

    describe('getRecentHires', () => {
        it('should return recent hires from latest reviewed date', async () => {
            const hires = [
                { employerId: 'EMP001', contractorId: 100, memberName: 'John Doe', startDate: '2025-01-15' },
            ];
            mockRequest.query.mockResolvedValue({ recordset: hires });

            const result = await repository.getRecentHires(5);

            expect(result).toEqual(hires);
            expect(mockRequest.query).toHaveBeenCalled();
        });

        it('should select correct columns', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getRecentHires(5);

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('employerId');
            expect(query).toContain('contractorId');
            expect(query).toContain('memberName');
            expect(query).toContain('startDate');
        });

        it('should filter by max reviewed date', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getRecentHires(5);

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('CAST(ReviewedDate AS DATE)');
        });

        it('should order by StartDate, ReviewedDate, ContractorName', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getRecentHires(5);

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY StartDate, ReviewedDate, ContractorName');
        });

        it('should return empty array when no recent hires', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await repository.getRecentHires(999);

            expect(result).toEqual([]);
        });
    });

    describe('getHiresForContractor', () => {
        it('should return hires for contractor', async () => {
            const hires = [
                { employerId: 'EMP001', memberName: 'John Doe', startDate: '2025-01-15' },
            ];
            mockRequest.query.mockResolvedValue({ recordset: hires });

            const result = await repository.getHiresForContractor(100, '2025-01-15');

            expect(result).toEqual(hires);
            expect(mockRequest.query).toHaveBeenCalled();
            expect(mockRequest.input).toHaveBeenCalledWith('contractorId', expect.anything(), 100);
            expect(mockRequest.input).toHaveBeenCalledWith('reviewedDate', expect.anything(), '2025-01-15');
        });

        it('should filter by contractorId and reviewedDate', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getHiresForContractor(100, '2025-01-15');

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('ContractorID = @contractorId');
            expect(query).toContain('ReviewedDate >= @reviewedDate');
        });

        it('should order by StartDate, ReviewedDate, IANumber', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getHiresForContractor(100, '2025-01-15');

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY StartDate, ReviewedDate, IANumber');
        });

        it('should handle different contractor and date combinations', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.getHiresForContractor(200, '2025-02-15');

            expect(mockRequest.input).toHaveBeenCalledWith('contractorId', expect.anything(), 200);
            expect(mockRequest.input).toHaveBeenCalledWith('reviewedDate', expect.anything(), '2025-02-15');
        });

        it('should return empty array when no hires found', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await repository.getHiresForContractor(999, '2025-01-01');

            expect(result).toEqual([]);
        });
    });

    describe('createReviewedHire', () => {
        it('should create a reviewed hire record', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const hireData = {
                employerId: 'EMP001',
                contractorName: 'ABC Corp',
                memberName: 'John Doe',
                iaNumber: 'IA123',
                startDate: '2025-01-15',
                hireType: 'Union',
                isReviewed: 1,
                isExcluded: 0,
                endDate: null,
                contractorId: 100,
                isInactive: 0,
                reviewedDate: '2025-01-15',
                excludedComplianceRules: null,
                createdByUserName: 'user1',
                createdByName: 'John Smith',
                createdOn: '2025-01-15',
            };

            const result = await repository.createReviewedHire(hireData);

            expect(result).toBe(1);
            expect(mockRequest.query).toHaveBeenCalled();
        });

        it('should pass all required fields', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const hireData = {
                employerId: 'EMP001',
                contractorName: 'ABC Corp',
                memberName: 'John Doe',
                iaNumber: 'IA123',
                startDate: '2025-01-15',
                hireType: 'Union',
                isReviewed: 1,
                isExcluded: 0,
                endDate: null,
                contractorId: 100,
                isInactive: 0,
                reviewedDate: '2025-01-15',
                excludedComplianceRules: null,
                createdByUserName: 'user1',
                createdByName: 'John Smith',
                createdOn: '2025-01-15',
            };

            await repository.createReviewedHire(hireData);

            expect(mockRequest.input).toHaveBeenCalledWith('employerId', expect.anything(), 'EMP001');
            expect(mockRequest.input).toHaveBeenCalledWith('iaNumber', expect.anything(), 'IA123');
            expect(mockRequest.input).toHaveBeenCalledWith('contractorId', expect.anything(), 100);
            expect(mockRequest.input).toHaveBeenCalledWith('isReviewed', expect.anything(), 1);
        });

        it('should handle null optional fields', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const hireData = {
                employerId: 'EMP001',
                contractorName: null,
                memberName: null,
                iaNumber: 'IA123',
                startDate: '2025-01-15',
                hireType: null,
                isReviewed: 1,
                isExcluded: null,
                endDate: null,
                contractorId: 100,
                isInactive: 0,
                reviewedDate: null,
                excludedComplianceRules: null,
                createdByUserName: null,
                createdByName: null,
                createdOn: '2025-01-15',
            };

            await repository.createReviewedHire(hireData);

            expect(mockRequest.input).toHaveBeenCalledWith('contractorName', expect.anything(), null);
            expect(mockRequest.input).toHaveBeenCalledWith('memberName', expect.anything(), null);
            expect(mockRequest.input).toHaveBeenCalledWith('reviewedDate', expect.anything(), null);
        });

        it('should include WHERE NOT EXISTS clause to prevent duplicates', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const hireData = {
                employerId: 'EMP001',
                contractorName: 'ABC Corp',
                memberName: 'John Doe',
                iaNumber: 'IA123',
                startDate: '2025-01-15',
                hireType: 'Union',
                isReviewed: 1,
                isExcluded: 0,
                endDate: null,
                contractorId: 100,
                isInactive: 0,
                reviewedDate: '2025-01-15',
                excludedComplianceRules: null,
                createdByUserName: 'user1',
                createdByName: 'John Smith',
                createdOn: '2025-01-15',
            };

            await repository.createReviewedHire(hireData);

            const query = mockRequest.query.mock.calls[0][0];
            expect(query).toContain('WHERE NOT EXISTS');
            expect(query).toContain('EmployerID = @employerId');
            expect(query).toContain('IANumber = @iaNumber');
        });

        it('should handle empty strings for optional fields', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const hireData = {
                employerId: 'EMP001',
                contractorName: 'ABC Corp',
                memberName: 'John Doe',
                iaNumber: 'IA123',
                startDate: '2025-01-15',
                hireType: 'Union',
                isReviewed: 1,
                isExcluded: 0,
                endDate: '',
                contractorId: 100,
                isInactive: 0,
                reviewedDate: '',
                excludedComplianceRules: '',
                createdByUserName: '',
                createdByName: '',
                createdOn: '2025-01-15',
            };

            await repository.createReviewedHire(hireData);

            // The repository converts empty strings to null using || operator
            expect(mockRequest.input).toHaveBeenCalledWith('endDate', expect.anything(), null);
            expect(mockRequest.input).toHaveBeenCalledWith('reviewedDate', expect.anything(), null);
            expect(mockRequest.input).toHaveBeenCalledWith('excludedComplianceRules', expect.anything(), null);
        });
    });
});
