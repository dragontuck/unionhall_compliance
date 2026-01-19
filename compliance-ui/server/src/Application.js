/**
 * Application Factory - Creates and configures Express application
 * Follows Factory Pattern and Composition Pattern
 * Separates app configuration from server startup
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

import { errorHandler, asyncHandler } from './middleware/ErrorHandler.js';
import { Container } from './di/Container.js';
import { RunController } from './controllers/RunController.js';
import { ReportController } from './controllers/ReportController.js';
import { ModeController } from './controllers/ModeController.js';
import { HireDataController } from './controllers/HireDataController.js';
import {
    defineHealthRoutes,
    defineRunRoutes,
    defineReportRoutes,
    defineModeRoutes,
    defineHireDataRoutes
} from './routes/index.js';

/**
 * Create and configure Express application
 * @param {sql.ConnectionPool} dbPool - Database connection pool
 * @param {string} distPath - Path to dist folder for static files
 * @returns {Object} { app, container } - Express app and DI container
 */
export function createApplication(dbPool, distPath) {
    const app = express();

    // Initialize dependency injection container
    const container = new Container(dbPool);
    container.initializeDefaultServices();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Static files
    if (distPath && fs.existsSync(distPath)) {
        app.use(express.static(distPath));
    }

    // File upload configuration
    const storage = multer.memoryStorage();
    const upload = multer({
        storage,
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
        fileFilter: (req, file, cb) => {
            const allowedMimes = ['text/csv', 'application/vnd.ms-excel'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only CSV files are allowed'));
            }
        }
    });

    // API Router
    const apiRouter = express.Router();

    // Create controllers
    const runController = new RunController(container.getRunService());
    const reportController = new ReportController(container.getReportService());
    const modeController = new ModeController(container.getModeService());
    const hireDataController = new HireDataController(container.getHireDataService());

    // Define routes
    defineHealthRoutes(apiRouter);
    defineRunRoutes(apiRouter, runController);
    defineReportRoutes(apiRouter, reportController);
    defineModeRoutes(apiRouter, modeController);
    defineHireDataRoutes(apiRouter, hireDataController, upload);

    // Mount API routes
    app.use('/api', apiRouter);

    // SPA fallback (serve index.html for client-side routing)
    if (distPath) {
        app.get('*', (req, res) => {
            const indexPath = path.join(distPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).json({
                    error: 'UI not found. Please run "npm run build" in compliance-ui folder.'
                });
            }
        });
    }

    // Error handling middleware (must be last)
    app.use(errorHandler);

    return { app, container };
}
