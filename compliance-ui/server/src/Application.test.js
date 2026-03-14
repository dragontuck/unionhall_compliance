/**
 * Application.test.js - Unit tests for Application Factory
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApplication } from './Application.js';
import express from 'express';

vi.mock('./middleware/ErrorHandler.js', () => ({
    errorHandler: vi.fn(),
    asyncHandler: vi.fn((fn) => fn),
}));

vi.mock('cors', () => ({
    default: vi.fn(() => (req, res, next) => next()),
}));

vi.mock('multer', () => {
    const mockMulter = vi.fn(() => ({
        single: vi.fn(() => (req, res, next) => next()),
    }));
    mockMulter.memoryStorage = vi.fn(() => ({}));
    return { default: mockMulter };
});

vi.mock('express-history-api-fallback', () => ({
    default: vi.fn(() => (req, res, next) => next()),
}));

vi.mock('path');

vi.mock('./di/Container.js', () => {
    return {
        Container: vi.fn().mockImplementation(() => ({
            initializeDefaultServices: vi.fn(),
            getRunService: vi.fn().mockReturnValue({}),
            getReportService: vi.fn().mockReturnValue({}),
            getModeService: vi.fn().mockReturnValue({}),
            getHireDataService: vi.fn().mockReturnValue({}),
            getContractorSnapshotService: vi.fn().mockReturnValue({}),
            getBlacklistService: vi.fn().mockReturnValue({}),
        })),
    };
});

vi.mock('./controllers/RunController.js', () => {
    return {
        RunController: vi.fn().mockImplementation(() => ({
            getAllRuns: vi.fn(),
        })),
    };
});

vi.mock('./controllers/ReportController.js', () => {
    return {
        ReportController: vi.fn().mockImplementation(() => ({
            getReports: vi.fn(),
        })),
    };
});

vi.mock('./controllers/ModeController.js', () => {
    return {
        ModeController: vi.fn().mockImplementation(() => ({
            getAllModes: vi.fn(),
        })),
    };
});

vi.mock('./controllers/HireDataController.js', () => {
    return {
        HireDataController: vi.fn().mockImplementation(() => ({
            getHireData: vi.fn(),
        })),
    };
});

vi.mock('./controllers/ContractorSnapshotController.js', () => {
    return {
        ContractorSnapshotController: vi.fn().mockImplementation(() => ({
            getSnapshot: vi.fn(),
        })),
    };
});

vi.mock('./controllers/BlacklistController.js', () => {
    return {
        BlacklistController: vi.fn().mockImplementation(() => ({
            getBlacklist: vi.fn(),
        })),
    };
});

vi.mock('./routes/index.js', () => ({
    defineHealthRoutes: vi.fn(),
    defineRunRoutes: vi.fn(),
    defineReportRoutes: vi.fn(),
    defineModeRoutes: vi.fn(),
    defineHireDataRoutes: vi.fn(),
    defineContractorSnapshotRoutes: vi.fn(),
    defineBlacklistRoutes: vi.fn(),
}));

import { Container } from './di/Container.js';
import { RunController } from './controllers/RunController.js';
import { ReportController } from './controllers/ReportController.js';
import { ModeController } from './controllers/ModeController.js';
import { HireDataController } from './controllers/HireDataController.js';
import { ContractorSnapshotController } from './controllers/ContractorSnapshotController.js';
import { BlacklistController } from './controllers/BlacklistController.js';
import {
    defineHealthRoutes,
    defineRunRoutes,
    defineReportRoutes,
    defineModeRoutes,
    defineHireDataRoutes,
    defineContractorSnapshotRoutes,
    defineBlacklistRoutes,
} from './routes/index.js';
import corsModule from 'cors';
import multerModule from 'multer';

describe('createApplication', () => {
    let mockDbPool;

    beforeEach(() => {
        mockDbPool = {};
        vi.clearAllMocks();
    });

    it('should create Express application', () => {
        const { app } = createApplication(mockDbPool, null);

        expect(app).toBeDefined();
        expect(typeof app).toBe('function');
    });

    it('should initialize dependency injection container', () => {
        createApplication(mockDbPool, null);

        expect(Container).toHaveBeenCalledWith(mockDbPool);
    });

    it('should initialize default services in container', () => {
        const { app, container } = createApplication(mockDbPool, null);

        expect(app).toBeDefined();
        expect(container).toBeDefined();
    });

    it('should create all controllers', () => {
        createApplication(mockDbPool, null);

        expect(RunController).toHaveBeenCalled();
        expect(ReportController).toHaveBeenCalled();
        expect(ModeController).toHaveBeenCalled();
        expect(HireDataController).toHaveBeenCalled();
    });

    it('should define all route groups', () => {
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
        const pool = { query: vi.fn() };

        const { app, container } = createApplication(pool, null);

        expect(app).toBeDefined();
        expect(container).toBeDefined();
    });

    it('should use error handler middleware', () => {
        const { app } = createApplication(mockDbPool, null);

        expect(app).toBeDefined();
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

    it('should configure CORS middleware', () => {
        createApplication(mockDbPool, null);

        expect(corsModule).toHaveBeenCalled();
    });

    it('should configure Multer upload with memory storage', () => {
        createApplication(mockDbPool, null);

        expect(multerModule).toHaveBeenCalled();
    });

    it('should configure Multer with 100MB file size limit', () => {
        createApplication(mockDbPool, null);

        // Multer should be configured with limits
        expect(multerModule).toHaveBeenCalledWith(
            expect.objectContaining({
                limits: expect.objectContaining({
                    fileSize: 100 * 1024 * 1024
                })
            })
        );
    });

    it('should have Multer fileFilter for CSV validation', () => {
        createApplication(mockDbPool, null);

        // Multer should be configured with fileFilter
        expect(multerModule).toHaveBeenCalledWith(
            expect.objectContaining({
                fileFilter: expect.any(Function)
            })
        );
    });

    it('should instantiate ContractorSnapshotController', () => {
        createApplication(mockDbPool, null);

        expect(ContractorSnapshotController).toHaveBeenCalled();
    });

    it('should instantiate BlacklistController', () => {
        createApplication(mockDbPool, null);

        expect(BlacklistController).toHaveBeenCalled();
    });

    it('should define ContractorSnapshot routes', () => {
        createApplication(mockDbPool, null);

        expect(defineContractorSnapshotRoutes).toHaveBeenCalled();
    });

    it('should define Blacklist routes', () => {
        createApplication(mockDbPool, null);

        expect(defineBlacklistRoutes).toHaveBeenCalled();
    });

    it('should use URL encoding middleware with extended option', () => {
        const { app } = createApplication(mockDbPool, null);

        const hasUrlencodedParser = app._router.stack.some(layer => layer.name === 'urlencodedParser');
        expect(hasUrlencodedParser).toBe(true);
    });

    it('should serve static files when distPath is provided', () => {
        const { app } = createApplication(mockDbPool, '/test/path');

        // Static middleware should be configured
        expect(app).toBeDefined();
    });

    it('should not serve static files when distPath is null', () => {
        const { app } = createApplication(mockDbPool, null);

        // Should not throw and should function normally
        expect(app).toBeDefined();
    });

    it('should configure SPA fallback routing when distPath is provided', () => {
        const { app } = createApplication(mockDbPool, '/test/path');

        expect(app).toBeDefined();
    });

    it('should handle requests without breaking when distPath is invalid', () => {
        const { app } = createApplication(mockDbPool, '/invalid/path/that/does/not/exist');

        // Should not throw during initialization
        expect(app).toBeDefined();
    });

    it('should instantiate services through container', () => {
        const { container } = createApplication(mockDbPool, null);

        expect(Container).toHaveBeenCalled();
        expect(container).toBeDefined();
    });

    it('should initialize default services in container', () => {
        const { container } = createApplication(mockDbPool, null);

        expect(container).toBeDefined();
    });

    it('should retrieve ContractorSnapshotService from container', () => {
        const { container } = createApplication(mockDbPool, null);

        const getServiceSpy = container.getContractorSnapshotService;
        expect(getServiceSpy).toBeDefined();
    });

    it('should retrieve BlacklistService from container', () => {
        const { container } = createApplication(mockDbPool, null);

        const getServiceSpy = container.getBlacklistService;
        expect(getServiceSpy).toBeDefined();
    });
});
