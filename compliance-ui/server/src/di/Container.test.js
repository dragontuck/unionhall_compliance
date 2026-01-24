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
        it('should update the database pool', () => {
            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            expect(container.dbPool).toBe(newPool);
        });

        it('should clear cached repository instances', () => {
            const repository = { query: jest.fn() };
            container.register('repository', repository);

            expect(container.resolve('repository')).toBe(repository);

            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            // After setPool, repository instance should be cleared
            expect(() => container.resolve('repository')).toThrow();
        });

        it('should clear cached service instances on pool update', () => {
            const newPool = { request: jest.fn() };

            // Register some services
            container.register('runService', { name: 'old' });
            container.register('reportService', { name: 'old' });

            // Verify they exist
            expect(container.resolve('runService').name).toBe('old');

            // Update pool
            container.setPool(newPool);

            // Services should be cleared so they throw on resolve
            expect(() => container.resolve('runService')).toThrow();
            expect(() => container.resolve('reportService')).toThrow();
        });

        it('should clear all repository and service instances', () => {
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

            // Register mock services
            serviceNames.forEach(name => {
                container.register(name, { id: name });
            });

            // Verify all registered
            serviceNames.forEach(name => {
                expect(container.resolve(name).id).toBe(name);
            });

            // Update pool
            const newPool = { request: jest.fn() };
            container.setPool(newPool);

            // All should be cleared
            serviceNames.forEach(name => {
                expect(() => container.resolve(name)).toThrow();
            });
        });
    });
});
