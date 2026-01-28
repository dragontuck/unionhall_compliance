/**
 * Container.test.js - Unit tests for Dependency Injection Container
 */

import { Container } from './Container.js';

describe('Container (Dependency Injection)', () => {
    let container;
    let mockPool;

    beforeEach(() => {
        mockPool = { request: jest.fn() };
        container = new Container(mockPool);
    });

    describe('register', () => {
        it('should register a singleton service', () => {
            const mockService = { getValue: () => 'test' };
            container.register('testService', mockService);

            const result = container.resolve('testService');
            expect(result).toBe(mockService);
        });

        it('should register multiple services', () => {
            const service1 = { id: 1 };
            const service2 = { id: 2 };
            container.register('service1', service1);
            container.register('service2', service2);

            expect(container.resolve('service1')).toBe(service1);
            expect(container.resolve('service2')).toBe(service2);
        });
    });

    describe('resolve', () => {
        it('should resolve registered services', () => {
            const service = { method: () => 'result' };
            container.register('myService', service);

            const resolved = container.resolve('myService');
            expect(resolved.method()).toBe('result');
        });

        it('should throw error for unregistered service', () => {
            expect(() => container.resolve('nonExistent')).toThrow();
        });

        it('should resolve factory-registered services', () => {
            const factory = (c) => ({ value: 'created' });
            container.registerFactory('factoryService', factory);

            const result = container.resolve('factoryService');
            expect(result.value).toBe('created');
        });
    });

    describe('registerFactory', () => {
        it('should register a factory function', () => {
            const factory = (c) => ({ value: 'created', id: 123 });
            container.registerFactory('factoryService', factory);

            const result = container.resolve('factoryService');
            expect(result.value).toBe('created');
            expect(result.id).toBe(123);
        });
    });

    describe('setPool', () => {
        beforeEach(() => {
            // Initialize default services for pool update tests
            container.initializeDefaultServices();
        });

        it('should update the database pool', () => {
            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            expect(container.dbPool).toBe(newPool);
        });

        it('should reinitialize repository with new pool', () => {
            const oldRepository = container.resolve('repository');

            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            // After setPool, repository should be recreated with new pool
            const newRepository = container.resolve('repository');
            expect(newRepository).not.toBe(oldRepository);
            expect(newRepository.pool).toBe(newPool);
        });

        it('should reinitialize all services on pool update', () => {
            const oldRunService = container.resolve('runService');
            const oldReportService = container.resolve('reportService');

            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            // Services should be recreated with new pool
            const newRunService = container.resolve('runService');
            const newReportService = container.resolve('reportService');
            expect(newRunService).not.toBe(oldRunService);
            expect(newReportService).not.toBe(oldReportService);
        });

        it('should reinitialize all repository and service instances', () => {
            const serviceNames = [
                'repository',
                'runRepository',
                'reportRepository',
                'reportDetailRepository',
                'reportNoteRepository',
                'modeRepository',
                'hireDataRepository',
                'runService',
                'reportService',
                'modeService',
                'hireDataService'
            ];

            // Get old instances
            const oldInstances = new Map();
            serviceNames.forEach(name => {
                oldInstances.set(name, container.resolve(name));
            });

            // Update pool
            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            // All should be recreated (different instances)
            serviceNames.forEach(name => {
                const newInstance = container.resolve(name);
                expect(newInstance).not.toBe(oldInstances.get(name));
            });
        });
    });
});
