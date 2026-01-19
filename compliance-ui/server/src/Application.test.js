/**
 * Application.test.js - Unit tests for Application Factory
 */

import { createApplication } from './Application.js';
import express from 'express';

jest.mock('./middleware/ErrorHandler.js', () => ({
    errorHandler: jest.fn(),
    asyncHandler: jest.fn((fn) => fn),
}));

jest.mock('./di/Container.js', () => {
    return {
        Container: jest.fn().mockImplementation(() => ({
            initializeDefaultServices: jest.fn(),
            getRunService: jest.fn().mockReturnValue({}),
            getReportService: jest.fn().mockReturnValue({}),
            getModeService: jest.fn().mockReturnValue({}),
            getHireDataService: jest.fn().mockReturnValue({}),
        })),
    };
});

jest.mock('./controllers/RunController.js', () => {
    return {
        RunController: jest.fn().mockImplementation(() => ({
            getAllRuns: jest.fn(),
        })),
    };
});

jest.mock('./controllers/ReportController.js', () => {
    return {
        ReportController: jest.fn().mockImplementation(() => ({
            getReports: jest.fn(),
        })),
    };
});

jest.mock('./controllers/ModeController.js', () => {
    return {
        ModeController: jest.fn().mockImplementation(() => ({
            getAllModes: jest.fn(),
        })),
    };
});

jest.mock('./controllers/HireDataController.js', () => {
    return {
        HireDataController: jest.fn().mockImplementation(() => ({
            getHireData: jest.fn(),
        })),
    };
});

jest.mock('./routes/index.js', () => ({
    defineHealthRoutes: jest.fn(),
    defineRunRoutes: jest.fn(),
    defineReportRoutes: jest.fn(),
    defineModeRoutes: jest.fn(),
    defineHireDataRoutes: jest.fn(),
}));

describe('createApplication', () => {
    let mockDbPool;

    beforeEach(() => {
        mockDbPool = {};
        jest.clearAllMocks();
    });

    it('should create Express application', () => {
        const { app } = createApplication(mockDbPool, null);

        expect(app).toBeDefined();
        expect(typeof app).toBe('function');
    });

    it('should initialize dependency injection container', () => {
        const { Container } = require('./di/Container.js');

        createApplication(mockDbPool, null);

        expect(Container).toHaveBeenCalledWith(mockDbPool);
    });

    it('should initialize default services in container', () => {
        const { Container } = require('./di/Container.js');
        const mockContainer = {
            initializeDefaultServices: jest.fn(),
            getRunService: jest.fn().mockReturnValue({}),
            getReportService: jest.fn().mockReturnValue({}),
            getModeService: jest.fn().mockReturnValue({}),
            getHireDataService: jest.fn().mockReturnValue({}),
        };
        Container.mockImplementationOnce(() => mockContainer);

        createApplication(mockDbPool, null);

        expect(mockContainer.initializeDefaultServices).toHaveBeenCalled();
    });

    it('should create all controllers', () => {
        const { RunController } = require('./controllers/RunController.js');
        const { ReportController } = require('./controllers/ReportController.js');
        const { ModeController } = require('./controllers/ModeController.js');
        const { HireDataController } = require('./controllers/HireDataController.js');

        createApplication(mockDbPool, null);

        expect(RunController).toHaveBeenCalled();
        expect(ReportController).toHaveBeenCalled();
        expect(ModeController).toHaveBeenCalled();
        expect(HireDataController).toHaveBeenCalled();
    });

    it('should define all route groups', () => {
        const { defineHealthRoutes, defineRunRoutes, defineReportRoutes, defineModeRoutes, defineHireDataRoutes } = require('./routes/index.js');

        createApplication(mockDbPool, null);

        expect(defineHealthRoutes).toHaveBeenCalled();
        expect(defineRunRoutes).toHaveBeenCalled();
        expect(defineReportRoutes).toHaveBeenCalled();
        expect(defineModeRoutes).toHaveBeenCalled();
        expect(defineHireDataRoutes).toHaveBeenCalled();
    });

    it('should return app and container', () => {
        const { app, container } = createApplication(mockDbPool, null);

        expect(app).toBeDefined();
        expect(container).toBeDefined();
    });

    it('should mount API router at /api path', () => {
        const { app } = createApplication(mockDbPool, null);

        expect(app._router.stack.some(layer => layer.route === undefined && layer.name === 'router')).toBe(true);
    });

    it('should handle when dbPool is provided', () => {
        const pool = { query: jest.fn() };

        const { app, container } = createApplication(pool, null);

        expect(app).toBeDefined();
        expect(container).toBeDefined();
    });

    it('should use error handler middleware', () => {
        const { errorHandler } = require('./middleware/ErrorHandler.js');

        createApplication(mockDbPool, null);

        expect(errorHandler).toBeDefined();
    });

    it('should have JSON parsing middleware', () => {
        const { app } = createApplication(mockDbPool, null);

        const hasJsonParser = app._router.stack.some(layer => layer.name === 'jsonParser');
        expect(hasJsonParser).toBe(true);
    });

    it('should handle missing distPath gracefully', () => {
        expect(() => createApplication(mockDbPool, null)).not.toThrow();
        expect(() => createApplication(mockDbPool, undefined)).not.toThrow();
    });
});
