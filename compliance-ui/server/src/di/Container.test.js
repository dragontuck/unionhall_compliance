/**
 * Container.test.js - Unit tests for Dependency Injection Container
 */

import { Container } from './Container.js';

describe('Container (Dependency Injection)', () => {
    let container;

    beforeEach(() => {
        container = new Container();
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
});
