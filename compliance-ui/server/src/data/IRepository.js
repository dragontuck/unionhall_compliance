/**
 * IRepository interface - Defines contract for data access operations
 * Follows Interface Segregation Principle (ISP) and Dependency Inversion Principle (DIP)
 * 
 * Each repository should implement methods for a specific domain (Runs, Reports, Hires, etc.)
 * This abstraction allows easy swapping of implementations (SQL, NoSQL, Mock, etc.)
 */

export class IRepository {
    /**
     * Execute a query with optional parameters
     * @param {string} sql - SQL query string
     * @param {Object} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async query(sql, params = {}) {
        throw new Error('query() must be implemented');
    }

    /**
     * Execute a query expecting a single result
     * @param {string} sql - SQL query string
     * @param {Object} params - Query parameters
     * @returns {Promise<Object|null>} Single result or null
     */
    async queryOne(sql, params = {}) {
        throw new Error('queryOne() must be implemented');
    }

    /**
     * Execute a query for a scalar value (count, sum, etc.)
     * @param {string} sql - SQL query string
     * @param {Object} params - Query parameters
     * @returns {Promise<*>} Scalar value
     */
    async queryScalar(sql, params = {}) {
        throw new Error('queryScalar() must be implemented');
    }

    /**
     * Execute a command (INSERT, UPDATE, DELETE)
     * @param {string} sql - SQL command
     * @param {Object} params - Command parameters
     * @returns {Promise<number>} Number of affected rows
     */
    async execute(sql, params = {}) {
        throw new Error('execute() must be implemented');
    }

    /**
     * Execute prepared statement
     * @param {string} sql - SQL statement
     * @param {Object} params - Parameters
     * @returns {Promise<*>} Result from prepared statement
     */
    async executePrepared(sql, params = {}) {
        throw new Error('executePrepared() must be implemented');
    }

    /**
     * Begin transaction
     * @returns {Promise<Object>} Transaction object
     */
    async beginTransaction() {
        throw new Error('beginTransaction() must be implemented');
    }

    /**
     * Commit transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<void>}
     */
    async commitTransaction(transaction) {
        throw new Error('commitTransaction() must be implemented');
    }

    /**
     * Rollback transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<void>}
     */
    async rollbackTransaction(transaction) {
        throw new Error('rollbackTransaction() must be implemented');
    }

    /**
     * Batch operation for multiple queries in transaction
     * @param {Function} callback - Callback receiving transaction context
     * @returns {Promise<*>} Result from callback
     */
    async withTransaction(callback) {
        throw new Error('withTransaction() must be implemented');
    }
}
