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
        pool: {
            min: env.DB_POOL_MIN ? parseInt(env.DB_POOL_MIN) : 2,
            max: env.DB_POOL_MAX ? parseInt(env.DB_POOL_MAX) : 10,
            idleTimeoutMillis: env.DB_IDLE_TIMEOUT ? parseInt(env.DB_IDLE_TIMEOUT) : 30000
        },
        options: {
            encrypt: env.DB_ENCRYPT === 'true',
            trustServerCertificate: env.DB_TRUST_CERT === 'true',
            connectionTimeout: env.DB_CONNECTION_TIMEOUT ? parseInt(env.DB_CONNECTION_TIMEOUT) : 15000,
            requestTimeout: env.DB_REQUEST_TIMEOUT ? parseInt(env.DB_REQUEST_TIMEOUT) : 30000,
            appName: 'ComplianceApp'
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

/**
 * Refresh database connection pool
 * Closes existing pool and creates a new one
 * @param {sql.ConnectionPool} pool - Current connection pool
 * @param {Object} config - Connection configuration
 * @returns {Promise<sql.ConnectionPool>} New connection pool
 */
export async function refreshDatabaseConnection(pool, config) {
    try {
        console.log('[Database] Refreshing connection pool...');

        // Close existing connection
        if (pool) {
            try {
                await pool.close();
                console.log('[Database] Closed existing connection');
            } catch (error) {
                console.warn('[Database] Error closing existing connection:', error.message);
            }
        }

        // Create new connection
        const newPool = new sql.ConnectionPool(config);
        await newPool.connect();
        console.log('[Database] Connection pool refreshed successfully');
        pool = newPool;
        return pool;
    } catch (error) {
        console.error('[Database] Failed to refresh connection:', error.message);
        throw error;
    }
}

/**
 * Validate and repair database connection pool
 * Checks if pool is connected and reconnects if necessary
 * @param {sql.ConnectionPool} pool - Connection pool
 * @param {Object} config - Connection configuration
 * @returns {Promise<sql.ConnectionPool>} Valid connection pool
 */
export async function validateDatabaseConnection(pool, config) {
    try {
        // Test if pool is still connected
        if (pool && pool.connected) {
            const result = await pool.request().query('SELECT 1 as test');
            if (result.recordset.length > 0) {
                return pool; // Pool is healthy
            }
        }
    } catch (error) {
        console.warn('[Database] Pool validation failed, reconnecting:', error.message);
    }

    // Pool is not healthy, create new connection
    try {
        if (pool) {
            try {
                await pool.close();
            } catch (e) {
                // Ignore errors closing dead pool
            }
        }

        console.log('[Database] Creating new connection pool...');
        const newPool = new sql.ConnectionPool(config);
        await newPool.connect();
        console.log('[Database] New connection pool established');
        return newPool;
    } catch (error) {
        console.error('[Database] Failed to reconnect:', error.message);
        throw error;
    }
}

/**
 * Set up connection pool event handlers for monitoring
 * @param {sql.ConnectionPool} pool - Connection pool
 */
export function setupPoolEventHandlers(pool) {
    if (!pool) {
        console.warn('[Database] setupPoolEventHandlers called with null/undefined pool');
        return;
    }

    try {
        pool.on('connect', () => {
            console.log('[Database] Pool: New connection established');
        });

        pool.on('release', (connection) => {
            console.log('[Database] Pool: Connection released back to pool');
        });

        pool.on('error', (error) => {
            console.error('[Database] Pool error:', error.message);
        });
    } catch (error) {
        console.warn('[Database] Error setting up pool event handlers:', error.message);
    }
}
