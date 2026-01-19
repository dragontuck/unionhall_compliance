/**
 * DatabaseConfig - Database configuration and initialization
 * Follows Dependency Injection Principle
 * Separates configuration concerns from application logic
 */

import sql from 'mssql';

/**
 * Create connection pool configuration
 * @param {Object} env - Environment variables
 * @returns {Object} MSSQL connection config
 */
export function createConnectionConfig(env) {
    return {
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        server: env.DB_SERVER,
        database: env.DB_NAME,
        authentication: {
            type: 'default',
            options: {
                userName: env.DB_USER,
                password: env.DB_PASSWORD
            }
        },
        options: {
            encrypt: env.DB_ENCRYPT === 'true',
            trustServerCertificate: env.DB_TRUST_CERT === 'true',
            connectionTimeout: env.DB_CONNECTION_TIMEOUT ? parseInt(env.DB_CONNECTION_TIMEOUT) : 15000,
            requestTimeout: env.DB_REQUEST_TIMEOUT ? parseInt(env.DB_REQUEST_TIMEOUT) : 30000
        }
    };
}

/**
 * Create and initialize connection pool
 * @param {Object} config - Connection configuration
 * @returns {Promise<sql.ConnectionPool>} Initialized connection pool
 */
export async function initializeDatabase(config) {
    try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        console.log('[Database] Connected successfully');
        return pool;
    } catch (error) {
        console.error('[Database] Connection failed:', error.message);
        throw error;
    }
}

/**
 * Close database connection pool
 * @param {sql.ConnectionPool} pool - Connection pool
 * @returns {Promise<void>}
 */
export async function closeDatabase(pool) {
    if (pool) {
        try {
            await pool.close();
            console.log('[Database] Connection closed');
        } catch (error) {
            console.error('[Database] Error closing connection:', error.message);
        }
    }
}

/**
 * Test database connection
 * @param {sql.ConnectionPool} pool - Connection pool
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testDatabaseConnection(pool) {
    try {
        const result = await pool.request().query('SELECT 1 as test');
        return result.recordset.length > 0;
    } catch (error) {
        console.error('[Database] Test query failed:', error.message);
        return false;
    }
}
