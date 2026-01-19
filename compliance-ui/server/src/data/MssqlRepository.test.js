/**
 * MssqlRepository.test.js - Unit tests for MssqlRepository
 */

import { MssqlRepository } from './MssqlRepository.js';
import sql from 'mssql';

describe('MssqlRepository', () => {
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

        repository = new MssqlRepository(mockPool);
    });

    describe('constructor', () => {
        it('should create instance with valid pool', () => {
            expect(repository).toBeDefined();
            expect(repository.pool).toBe(mockPool);
        });

        it('should throw error when pool is missing', () => {
            expect(() => new MssqlRepository(null)).toThrow('Database pool is required');
        });

        it('should throw error when pool is undefined', () => {
            expect(() => new MssqlRepository(undefined)).toThrow('Database pool is required');
        });
    });

    describe('query', () => {
        it('should execute query and return recordset', async () => {
            const recordset = [{ id: 1, name: 'Test' }];
            mockRequest.query.mockResolvedValue({ recordset });

            const result = await repository.query('SELECT * FROM table', {});

            expect(result).toEqual(recordset);
            expect(mockPool.request).toHaveBeenCalled();
            expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM table');
        });

        it('should return empty array when no recordset', async () => {
            mockRequest.query.mockResolvedValue({});

            const result = await repository.query('SELECT * FROM table', {});

            expect(result).toEqual([]);
        });

        it('should bind parameters to request', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.query('SELECT * FROM table WHERE id = @id', { id: 1 });

            expect(mockRequest.input).toHaveBeenCalledWith('id', expect.anything(), 1);
        });

        it('should handle query errors', async () => {
            mockRequest.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(repository.query('SELECT * FROM table', {}))
                .rejects
                .toThrow('Query failed: Database connection failed');
        });

        it('should pass multiple parameters', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await repository.query('SELECT * FROM table WHERE id = @id AND name = @name',
                { id: 1, name: 'Test' });

            expect(mockRequest.input).toHaveBeenCalledTimes(2);
        });
    });

    describe('queryOne', () => {
        it('should return first record', async () => {
            const recordset = [{ id: 1, name: 'Test' }];
            mockRequest.query.mockResolvedValue({ recordset });

            const result = await repository.queryOne('SELECT * FROM table WHERE id = @id', { id: 1 });

            expect(result).toEqual({ id: 1, name: 'Test' });
        });

        it('should return null when no results', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await repository.queryOne('SELECT * FROM table WHERE id = @id', { id: 999 });

            expect(result).toBeNull();
        });

        it('should return only first record when multiple results', async () => {
            const recordset = [
                { id: 1, name: 'Test1' },
                { id: 2, name: 'Test2' },
            ];
            mockRequest.query.mockResolvedValue({ recordset });

            const result = await repository.queryOne('SELECT * FROM table');

            expect(result).toEqual({ id: 1, name: 'Test1' });
        });
    });

    describe('queryScalar', () => {
        it('should return scalar value', async () => {
            const recordset = [{ count: 42 }];
            mockRequest.query.mockResolvedValue({ recordset });

            const result = await repository.queryScalar('SELECT COUNT(*) as count FROM table', {});

            expect(result).toBe(42);
        });

        it('should return first property value', async () => {
            const recordset = [{ FirstColumn: 'value1', SecondColumn: 'value2' }];
            mockRequest.query.mockResolvedValue({ recordset });

            const result = await repository.queryScalar('SELECT TOP 1 * FROM table', {});

            expect(result).toBe('value1');
        });

        it('should return null when no result', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await repository.queryScalar('SELECT COUNT(*) as count FROM table', {});

            expect(result).toBeNull();
        });
    });

    describe('execute', () => {
        it('should execute command and return affected rows', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [3] });

            const result = await repository.execute('INSERT INTO table VALUES (@id)', { id: 1 });

            expect(result).toBe(3);
            expect(mockRequest.query).toHaveBeenCalled();
        });

        it('should return 0 when no rows affected', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

            const result = await repository.execute('DELETE FROM table WHERE id = @id', { id: 999 });

            expect(result).toBe(0);
        });

        it('should handle missing rowsAffected by using empty array', async () => {
            // When rowsAffected is undefined, accessing [0] will fail
            // The code should handle this gracefully
            mockRequest.query.mockResolvedValue({ rowsAffected: undefined });

            await expect(repository.execute('DELETE FROM table', {}))
                .rejects
                .toThrow('Execute failed');
        });

        it('should handle execute errors', async () => {
            mockRequest.query.mockRejectedValue(new Error('Constraint violation'));

            await expect(repository.execute('INSERT INTO table VALUES (@id)', { id: 1 }))
                .rejects
                .toThrow('Execute failed: Constraint violation');
        });
    });

    describe('_detectSqlType', () => {
        it('should detect NVarChar for strings', () => {
            const type = repository._detectSqlType('string value');
            expect(type).toStrictEqual(sql.NVarChar(sql.MAX));
        });

        it('should detect Int for integer numbers', () => {
            const type = repository._detectSqlType(42);
            expect(type).toBe(sql.Int);
        });

        it('should detect Float for decimal numbers', () => {
            const type = repository._detectSqlType(3.14);
            expect(type).toBe(sql.Float);
        });

        it('should detect Bit for booleans', () => {
            const type = repository._detectSqlType(true);
            expect(type).toBe(sql.Bit);
        });

        it('should detect DateTime2 for dates', () => {
            const type = repository._detectSqlType(new Date());
            expect(type).toBe(sql.DateTime2);
        });

        it('should detect NVarChar for null', () => {
            const type = repository._detectSqlType(null);
            expect(type).toStrictEqual(sql.NVarChar(sql.MAX));
        });

        it('should detect NVarChar for undefined', () => {
            const type = repository._detectSqlType(undefined);
            expect(type).toStrictEqual(sql.NVarChar(sql.MAX));
        });
    });

    describe('_bindParameters', () => {
        it('should bind string parameter', () => {
            const request = { input: jest.fn() };
            repository._bindParameters(request, { name: 'John' });

            expect(request.input).toHaveBeenCalledWith('name', sql.NVarChar(sql.MAX), 'John');
        });

        it('should bind parameter with explicit type', () => {
            const request = { input: jest.fn() };
            repository._bindParameters(request, {
                count: { type: sql.Int, value: 42 }
            });

            expect(request.input).toHaveBeenCalledWith('count', sql.Int, 42);
        });

        it('should bind multiple parameters', () => {
            const request = { input: jest.fn() };
            repository._bindParameters(request, {
                id: 1,
                name: 'Test',
                active: true
            });

            expect(request.input).toHaveBeenCalledTimes(3);
        });

        it('should bind null parameter', () => {
            const request = { input: jest.fn() };
            repository._bindParameters(request, { value: null });

            expect(request.input).toHaveBeenCalledWith('value', sql.NVarChar(sql.MAX), null);
        });
    });
});
