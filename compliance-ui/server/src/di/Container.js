/**
 * Container - Dependency Injection Container
 * Follows Inversion of Control (IoC) Principle
 * Manages object creation and dependency resolution
 */

import sql from 'mssql';
import { MssqlRepository } from '../data/MssqlRepository.js';
import { RunRepository } from '../data/repositories/RunRepository.js';
import { ReportRepository } from '../data/repositories/ReportRepository.js';
import { ReportDetailRepository } from '../data/repositories/ReportDetailRepository.js';
import { ReportNoteRepository } from '../data/repositories/ReportNoteRepository.js';
import { ModeRepository } from '../data/repositories/ModeRepository.js';
import { HireDataRepository } from '../data/repositories/HireDataRepository.js';
import { RunService } from '../services/RunService.js';
import { ReportService } from '../services/ReportService.js';
import { ModeService } from '../services/ModeService.js';
import { HireDataService } from '../services/HireDataService.js';
import { ComplianceEngine } from '../services/compliance-engine.js';

export class Container {
    constructor(dbPool) {
        this.dbPool = dbPool;
        this.instances = new Map();
    }

    /**
     * Update the database pool and reinitialize services
     * Used for connection refresh
     * @param {sql.ConnectionPool} newPool - New database connection pool
     */
    setPool(newPool) {
        this.dbPool = newPool;
        // Clear ALL cached instances - repositories, services, everything
        // This forces complete recreation of the entire dependency tree with the new pool
        this.instances.clear();
        // Reinitialize all services with the new pool
        this.initializeDefaultServices();
        console.log('[Container] All services reinitialized with new database pool');
    }

    /**
     * Register singleton instance
     * @param {string} key - Service key
     * @param {*} instance - Service instance
     */
    register(key, instance) {
        this.instances.set(key, instance);
    }

    /**
     * Register factory function
     * @param {string} key - Service key
     * @param {Function} factory - Factory function
     */
    registerFactory(key, factory) {
        this.instances.set(key, factory);
    }

    /**
     * Resolve service from container
     * @param {string} key - Service key
     * @returns {*} Service instance
     */
    resolve(key) {
        const item = this.instances.get(key);

        if (!item) {
            throw new Error(`Service ${key} not registered in container`);
        }

        // If it's a factory, call it
        if (typeof item === 'function') {
            return item(this);
        }

        return item;
    }

    /**
     * Initialize all default services
     */
    initializeDefaultServices() {
        // Data access layer
        const repository = new MssqlRepository(this.dbPool);
        this.register('repository', repository);

        // Repositories - pass pool directly (repositories extend MssqlRepository)
        this.registerFactory('runRepository', (c) => new RunRepository(this.dbPool));
        this.registerFactory('reportRepository', (c) => new ReportRepository(this.dbPool));
        this.registerFactory('reportDetailRepository', (c) => new ReportDetailRepository(this.dbPool));
        this.registerFactory('reportNoteRepository', (c) => new ReportNoteRepository(this.dbPool));
        this.registerFactory('modeRepository', (c) => new ModeRepository(this.dbPool));
        this.registerFactory('hireDataRepository', (c) => new HireDataRepository(this.dbPool));

        // Business logic
        this.registerFactory('complianceEngine', (c) => new ComplianceEngine());

        // Services
        this.registerFactory('runService', (c) =>
            new RunService(
                c.resolve('runRepository'),
                c.resolve('modeRepository'),
                c.resolve('reportRepository'),
                c.resolve('reportDetailRepository'),
                c.resolve('hireDataRepository'),
                c.resolve('complianceEngine')
            )
        );

        this.registerFactory('reportService', (c) =>
            new ReportService(
                c.resolve('reportRepository'),
                c.resolve('reportDetailRepository'),
                c.resolve('reportNoteRepository')
            )
        );

        this.registerFactory('modeService', (c) =>
            new ModeService(c.resolve('modeRepository'))
        );

        this.registerFactory('hireDataService', (c) =>
            new HireDataService(c.resolve('hireDataRepository'))
        );
    }

    /**
     * Get run service
     * @returns {RunService} Run service
     */
    getRunService() {
        return this.resolve('runService');
    }

    /**
     * Get report service
     * @returns {ReportService} Report service
     */
    getReportService() {
        return this.resolve('reportService');
    }

    /**
     * Get mode service
     * @returns {ModeService} Mode service
     */
    getModeService() {
        return this.resolve('modeService');
    }

    /**
     * Get hire data service
     * @returns {HireDataService} Hire data service
     */
    getHireDataService() {
        return this.resolve('hireDataService');
    }

    /**
     * Get repository
     * @returns {IRepository} Repository instance
     */
    getRepository() {
        return this.resolve('repository');
    }
}
