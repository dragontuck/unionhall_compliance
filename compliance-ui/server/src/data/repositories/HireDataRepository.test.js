/**
 * HireDataRepository.test.js - Unit tests for HireDataRepository
 */

import { HireDataRepository } from './HireDataRepository.js';

describe('HireDataRepository', () => {
    let repository;
    let mockRepo;

    beforeEach(() => {
        mockRepo = {
            query: jest.fn(),
            execute: jest.fn(),
        };

        repository = new HireDataRepository(mockRepo);
    });

    describe('getHireData', () => {
        it('should return hire data with default limit', async () => {
            const hireData = [
                { employerId: 'EMP001', contractorId: 100, memberName: 'John Doe' },
                { employerId: 'EMP002', contractorId: 101, memberName: 'Jane Smith' },
            ];
            mockRepo.query.mockResolvedValue(hireData);

            const result = await repository.getHireData();

            expect(result).toEqual(hireData);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 2000'),
                {}
            );
        });

        it('should apply custom limit', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getHireData({}, 5000);

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT TOP 5000'),
                {}
            );
        });

        it('should filter by reviewedDate', async () => {
            const hireData = [{ employerId: 'EMP001', reviewedDate: '2025-01-15' }];
            mockRepo.query.mockResolvedValue(hireData);

            await repository.getHireData({ reviewedDate: '2025-01-15' });

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.stringContaining('ReviewedDate <= @reviewedDate'),
                { reviewedDate: '2025-01-15' }
            );
        });

        it('should order by ContractorName, StartDate, MemberName', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getHireData();

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY ContractorName, StartDate, MemberName');
        });

        it('should return empty array', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getHireData();

            expect(result).toEqual([]);
        });
    });

    describe('getRecentHires', () => {
        it('should return recent hires from latest reviewed date', async () => {
            const hires = [
                { employerId: 'EMP001', contractorId: 100, memberName: 'John Doe', startDate: '2025-01-15' },
            ];
            mockRepo.query.mockResolvedValue(hires);

            const result = await repository.getRecentHires(5);

            expect(result).toEqual(hires);
            expect(mockRepo.query).toHaveBeenCalled();
        });

        it('should select correct columns', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getRecentHires(5);

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('employerId');
            expect(query).toContain('contractorId');
            expect(query).toContain('memberName');
            expect(query).toContain('startDate');
        });

        it('should filter by max reviewed date', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getRecentHires(5);

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('MAX(ReviewedDate)');
        });

        it('should order by StartDate, ReviewedDate, ContractorName', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getRecentHires(5);

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY StartDate, ReviewedDate, ContractorName');
        });

        it('should return empty array when no recent hires', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getRecentHires(999);

            expect(result).toEqual([]);
        });
    });

    describe('getHiresForContractor', () => {
        it('should return hires for contractor', async () => {
            const hires = [
                { employerId: 'EMP001', memberName: 'John Doe', startDate: '2025-01-15' },
            ];
            mockRepo.query.mockResolvedValue(hires);

            const result = await repository.getHiresForContractor(100, '2025-01-15');

            expect(result).toEqual(hires);
            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.any(String),
                { contractorId: 100, reviewedDate: '2025-01-15' }
            );
        });

        it('should filter by contractorId and reviewedDate', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getHiresForContractor(100, '2025-01-15');

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ContractorID = @contractorId');
            expect(query).toContain('ReviewedDate >= @reviewedDate');
        });

        it('should order by StartDate, ReviewedDate, IANumber', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getHiresForContractor(100, '2025-01-15');

            const query = mockRepo.query.mock.calls[0][0];
            expect(query).toContain('ORDER BY StartDate, ReviewedDate, IANumber');
        });

        it('should handle different contractor and date combinations', async () => {
            mockRepo.query.mockResolvedValue([]);

            await repository.getHiresForContractor(200, '2025-02-15');

            expect(mockRepo.query).toHaveBeenCalledWith(
                expect.any(String),
                { contractorId: 200, reviewedDate: '2025-02-15' }
            );
        });

        it('should return empty array when no hires found', async () => {
            mockRepo.query.mockResolvedValue([]);

            const result = await repository.getHiresForContractor(999, '2025-01-01');

            expect(result).toEqual([]);
        });
    });

    describe('createReviewedHire', () => {
        it('should create a reviewed hire record', async () => {
            mockRepo.execute.mockResolvedValue(1);

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
            expect(mockRepo.execute).toHaveBeenCalled();
        });

        it('should pass all required fields', async () => {
            mockRepo.execute.mockResolvedValue(1);

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

            const callArgs = mockRepo.execute.mock.calls[0][1];
            expect(callArgs).toMatchObject({
                employerId: 'EMP001',
                iaNumber: 'IA123',
                startDate: '2025-01-15',
                contractorId: 100,
                isReviewed: 1,
            });
        });

        it('should handle null optional fields', async () => {
            mockRepo.execute.mockResolvedValue(1);

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

            const callArgs = mockRepo.execute.mock.calls[0][1];
            expect(callArgs.contractorName).toBeNull();
            expect(callArgs.memberName).toBeNull();
            expect(callArgs.reviewedDate).toBeNull();
        });

        it('should include WHERE NOT EXISTS clause to prevent duplicates', async () => {
            mockRepo.execute.mockResolvedValue(1);

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

            const query = mockRepo.execute.mock.calls[0][0];
            expect(query).toContain('WHERE NOT EXISTS');
            expect(query).toContain('EmployerID = @employerId');
            expect(query).toContain('IANumber = @iaNumber');
        });

        it('should handle empty strings for optional fields', async () => {
            mockRepo.execute.mockResolvedValue(1);

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

            const callArgs = mockRepo.execute.mock.calls[0][1];
            // The repository converts empty strings to null using || operator
            expect(callArgs.endDate).toBeNull();
            expect(callArgs.reviewedDate).toBeNull();
            expect(callArgs.excludedComplianceRules).toBeNull();
        });
    });
});
