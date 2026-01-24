/**
 * DatabaseConfig.test.js - Unit tests for database configuration
 */

import { createConnectionConfig, initializeDatabase, closeDatabase, testDatabaseConnection, refreshDatabaseConnection } from './DatabaseConfig.js';
import sql from 'mssql';

describe('DatabaseConfig', () => {
    const mockEnv = {
        DB_USER: 'testuser',
        DB_PASSWORD: 'testpass',
        DB_SERVER: 'localhost',
        DB_NAME: 'testdb',
        DB_ENCRYPT: 'true',
        DB_TRUST_CERT: 'true',
        DB_CONNECTION_TIMEOUT: '15000',
        DB_REQUEST_TIMEOUT: '30000'
    };

    describe('createConnectionConfig', () => {
        it('should create config with all properties', () => {
            const config = createConnectionConfig(mockEnv);

            expect(config.user).toBe('testuser');
            expect(config.password).toBe('testpass');
            expect(config.server).toBe('localhost');
            expect(config.database).toBe('testdb');
            expect(config.authentication.type).toBe('default');
            expect(config.options.encrypt).toBe(true);
            expect(config.options.trustServerCertificate).toBe(true);
            expect(config.options.connectionTimeout).toBe(15000);
            expect(config.options.requestTimeout).toBe(30000);
        });

        it('should use default timeouts when not specified', () => {
            const env = { ...mockEnv };
            delete env.DB_CONNECTION_TIMEOUT;
            delete env.DB_REQUEST_TIMEOUT;

            const config = createConnectionConfig(env);

            expect(config.options.connectionTimeout).toBe(15000);
            expect(config.options.requestTimeout).toBe(30000);
        });

        it('should handle encryption as string true', () => {
            const config = createConnectionConfig(mockEnv);
            expect(config.options.encrypt).toBe(true);
        });

        it('should handle encryption as string false', () => {
            const env = { ...mockEnv, DB_ENCRYPT: 'false' };
            const config = createConnectionConfig(env);
            expect(config.options.encrypt).toBe(false);
        });
    });

    describe('initializeDatabase', () => {
        it('should create and connect pool', async () => {
            const mockPool = {
                connect: jest.fn().mockResolvedValue(undefined)
            };

            jest.spyOn(sql, 'ConnectionPool').mockImplementation(() => mockPool);

            const config = { server: 'localhost' };
            const result = await initializeDatabase(config);

            expect(result).toBe(mockPool);
            expect(mockPool.connect).toHaveBeenCalled();

            sql.ConnectionPool.mockRestore();
        });

        it('should throw error on connection failure', async () => {
            const mockPool = {
                connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
            };

            jest.spyOn(sql, 'ConnectionPool').mockImplementation(() => mockPool);

            const config = { server: 'localhost' };

            await expect(initializeDatabase(config))
                .rejects
                .toThrow('Connection failed');

            sql.ConnectionPool.mockRestore();
        });
    });

    describe('closeDatabase', () => {
        it('should close pool connection', async () => {
            const mockPool = {
                close: jest.fn().mockResolvedValue(undefined)
            };

            await closeDatabase(mockPool);

            expect(mockPool.close).toHaveBeenCalled();
        });

        it('should handle null pool gracefully', async () => {
            await expect(closeDatabase(null))
                .resolves
                .not
                .toThrow();
        });

        it('should handle close errors gracefully', async () => {
            const mockPool = {
                close: jest.fn().mockRejectedValue(new Error('Close failed'))
            };

            await expect(closeDatabase(mockPool))
                .resolves
                .not
                .toThrow();
        });
    });

    describe('testDatabaseConnection', () => {
        it('should return true when connection successful', async () => {
            const mockPool = {
                request: jest.fn().mockReturnValue({
                    query: jest.fn().mockResolvedValue({ recordset: [{ test: 1 }] })
                })
            };

            const result = await testDatabaseConnection(mockPool);

            expect(result).toBe(true);
        });

        it('should return false when query fails', async () => {
            const mockPool = {
                request: jest.fn().mockReturnValue({
                    query: jest.fn().mockRejectedValue(new Error('Query failed'))
                })
            };

            const result = await testDatabaseConnection(mockPool);

            expect(result).toBe(false);
        });

        it('should return false when no recordset returned', async () => {
            const mockPool = {
                request: jest.fn().mockReturnValue({
                    query: jest.fn().mockResolvedValue({ recordset: [] })
                })
            };

            const result = await testDatabaseConnection(mockPool);

            expect(result).toBe(false);
        });
    });

    describe('refreshDatabaseConnection', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should close old pool and create new one', async () => {
            const oldPool = {
                close: jest.fn().mockResolvedValue(undefined)
            };

            const newPool = {
                connect: jest.fn().mockResolvedValue(undefined)
            };

            jest.spyOn(sql, 'ConnectionPool').mockImplementation(() => newPool);

            const config = { server: 'localhost' };
            const result = await refreshDatabaseConnection(oldPool, config);

            expect(oldPool.close).toHaveBeenCalled();
            expect(newPool.connect).toHaveBeenCalled();
            expect(result).toBe(newPool);

            sql.ConnectionPool.mockRestore();
        });

        it('should create new pool when old pool is null', async () => {
            const newPool = {
                connect: jest.fn().mockResolvedValue(undefined)
            };

            jest.spyOn(sql, 'ConnectionPool').mockImplementation(() => newPool);

            const config = { server: 'localhost' };
            const result = await refreshDatabaseConnection(null, config);

            expect(result).toBe(newPool);
            expect(newPool.connect).toHaveBeenCalled();

            sql.ConnectionPool.mockRestore();
        });

        it('should handle close errors and continue', async () => {
            const oldPool = {
                close: jest.fn().mockRejectedValue(new Error('Close failed'))
            };

            const newPool = {
                connect: jest.fn().mockResolvedValue(undefined)
            };

            jest.spyOn(sql, 'ConnectionPool').mockImplementation(() => newPool);

            const config = { server: 'localhost' };
            const result = await refreshDatabaseConnection(oldPool, config);

            expect(result).toBe(newPool);
            expect(newPool.connect).toHaveBeenCalled();

            sql.ConnectionPool.mockRestore();
        });

        it('should throw error if new connection fails', async () => {
            const oldPool = {
                close: jest.fn().mockResolvedValue(undefined)
            };

            const newPool = {
                connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
            };

            jest.spyOn(sql, 'ConnectionPool').mockImplementation(() => newPool);

            const config = { server: 'localhost' };

            await expect(refreshDatabaseConnection(oldPool, config))
                .rejects
                .toThrow('Connection failed');

            sql.ConnectionPool.mockRestore();
        });
    });
});
