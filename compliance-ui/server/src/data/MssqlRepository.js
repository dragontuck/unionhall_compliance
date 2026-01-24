/**
 * MssqlRepository - Concrete implementation of IRepository for MSSQL
 * Provides database access abstraction with connection pooling
 * Follows Single Responsibility Principle (SRP) - only handles DB operations
 */

import sql from 'mssql';
import { IRepository } from './IRepository.js';

export class MssqlRepository extends IRepository {
    /**
     * @param {sql.ConnectionPool} pool - MSSQL connection pool
     */
    constructor(pool) {
        super();
        if (!pool) {
            throw new Error('Database pool is required');
        }
        this.pool = pool;
        this.maxRetries = 3;
        this.retryDelay = 100; // milliseconds
    }

    /**
     * Execute a query with parameters
     * @param {string} sqlQuery - SQL query string
     * @param {Object} params - Named parameters
     * @returns {Promise<Array>} Array of records
     */
    async query(sqlQuery, params = {}) {
        return this._executeWithRetry(async () => {
            const request = this.pool.request();
            this._bindParameters(request, params);
            const result = await request.query(sqlQuery);
            return result.recordset || [];
        });
    }

    /**
     * Execute query expecting single result
     * @param {string} sqlQuery - SQL query string
     * @param {Object} params - Named parameters
     * @returns {Promise<Object|null>} First record or null
     */
    async queryOne(sqlQuery, params = {}) {
        const results = await this.query(sqlQuery, params);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Execute query for scalar value (aggregate functions)
     * @param {string} sqlQuery - SQL query string
     * @param {Object} params - Named parameters
     * @returns {Promise<*>} Scalar value
     */
    async queryScalar(sqlQuery, params = {}) {
        const result = await this.queryOne(sqlQuery, params);
        if (!result) return null;
        const firstValue = Object.values(result)[0];
        return firstValue;
    }

    /**
     * Execute INSERT, UPDATE, or DELETE statement
     * @param {string} sqlCommand - SQL command
     * @param {Object} params - Named parameters
     * @returns {Promise<number>} Number of affected rows
     */
    async execute(sqlCommand, params = {}) {
        return this._executeWithRetry(async () => {
            const request = this.pool.request();
            this._bindParameters(request, params);
            const result = await request.query(sqlCommand);
            return result.rowsAffected[0] || 0;
        });
    }

    /**
     * Execute prepared statement
     * @param {string} sqlStatement - SQL statement with parameters
     * @param {Object} params - Named parameters with types
     * @returns {Promise<*>} Result from prepared statement
     */
    async executePrepared(sqlStatement, params = {}) {
        try {
            const ps = new sql.PreparedStatement(this.pool);

            // Define parameter types
            for (const [name, value] of Object.entries(params)) {
                if (value && typeof value === 'object' && value.type && value.value !== undefined) {
                    ps.input(name, value.type, value.value);
                } else {
                    ps.input(name, sql.NVarChar(sql.MAX), value);
                }
            }

            await ps.prepare(sqlStatement);
            const result = await ps.execute(params);
            await ps.unprepare();

            return result;
        } catch (error) {
            throw new Error(`Prepared statement failed: ${error.message}`);
        }
    }

    /**
     * Begin transaction
     * @returns {Promise<Object>} Transaction object
     */
    async beginTransaction() {
        const transaction = new sql.Transaction(this.pool);
        await transaction.begin();
        return transaction;
    }

    /**
     * Commit transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<void>}
     */
    async commitTransaction(transaction) {
        if (!transaction) throw new Error('Transaction object is required');
        await transaction.commit();
    }

    /**
     * Rollback transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<void>}
     */
    async rollbackTransaction(transaction) {
        if (!transaction) throw new Error('Transaction object is required');
        await transaction.rollback();
    }

    /**
     * Execute operations within transaction context
     * Ensures proper rollback on errors
     * @param {Function} callback - Function receiving transaction
     * @returns {Promise<*>} Result from callback
     */
    async withTransaction(callback) {
        const transaction = await this.beginTransaction();
        try {
            const result = await callback(transaction);
            await this.commitTransaction(transaction);
            return result;
        } catch (error) {
            await this.rollbackTransaction(transaction);
            throw error;
        }
    }

    /**
     * Helper to execute operations with retry logic
     * Handles transient connection failures during pool refresh
     * @private
     * @param {Function} operation - Async operation to execute
     * @returns {Promise<*>} Result from operation
     */
    async _executeWithRetry(operation) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // Check if it's a connection-related error
                const isConnectionError =
                    error.message.includes('Connection is closed') ||
                    error.message.includes('Connection timeout') ||
                    error.message.includes('Request timeout') ||
                    error.message.includes('ESOCKET');

                if (!isConnectionError || attempt === this.maxRetries) {
                    // Not a connection error or last attempt - throw it
                    throw error;
                }

                // Wait before retrying
                await this._delay(this.retryDelay * attempt);
                console.warn(`[Database] Retry attempt ${attempt}/${this.maxRetries} after connection error: ${error.message}`);
            }
        }

        throw lastError;
    }

    /**
     * Helper to delay execution
     * @private
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    async _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Helper to bind parameters to request
     * @private
     * @param {Object} request - MSSQL request object
     * @param {Object} params - Parameters to bind
     */
    _bindParameters(request, params) {
        for (const [name, value] of Object.entries(params)) {
            if (value && typeof value === 'object' && value.type !== undefined) {
                // Parameter with type info: { type: sql.Int, value: 123 }
                request.input(name, value.type, value.value);
            } else {
                // Auto-detect type
                request.input(name, this._detectSqlType(value), value);
            }
        }
    }

    /**
     * Helper to detect SQL type from JavaScript value
     * @private
     * @param {*} value - Value to detect type for
     * @returns {*} MSSQL type
     */
    _detectSqlType(value) {
        if (value === null || value === undefined) return sql.NVarChar(sql.MAX);
        if (typeof value === 'number') return Number.isInteger(value) ? sql.Int : sql.Float;
        if (typeof value === 'boolean') return sql.Bit;
        if (value instanceof Date) return sql.DateTime2;
        return sql.NVarChar(sql.MAX);
    }
}
