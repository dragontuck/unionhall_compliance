/**
 * Main Entry Point - Server initialization and startup
 * Follows Separation of Concerns Principle
 * Handles only server lifecycle, delegates configuration to modules
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import { createConnectionConfig, initializeDatabase, closeDatabase, refreshDatabaseConnection } from './config/DatabaseConfig.js';
import { createApplication } from './Application.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const distPath = path.join(__dirname, '../compliance-ui/dist');
const DB_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Main startup function
 */
async function start() {
    let dbPool = null;
    let refreshInterval = null;

    try {
        // Initialize database
        console.log('[Startup] Initializing database connection...');
        const dbConfig = createConnectionConfig(process.env);
        dbPool = await initializeDatabase(dbConfig);

        // Create application
        console.log('[Startup] Creating application...');
        const { app, container } = createApplication(dbPool, distPath);

        // Start server
        app.listen(PORT, () => {
            console.log(`[Server] Running on http://localhost:${PORT}`);
            console.log('[Server] Environment:', process.env.NODE_ENV || 'development');
        });

        // Set up periodic database connection refresh (every 5 minutes)
        console.log('[Database] Setting up connection refresh interval (5 minutes)...');
        refreshInterval = setInterval(async () => {
            try {
                const newPool = await refreshDatabaseConnection(dbPool, dbConfig);
                dbPool = newPool;
                container.setPool(newPool);
                console.log('[Database] Connection refresh completed successfully');
            } catch (error) {
                console.error('[Database] Connection refresh failed:', error.message);
                // Log the error but continue running - the next refresh will retry
            }
        }, DB_REFRESH_INTERVAL);

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('[Shutdown] Received SIGINT signal');
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            await closeDatabase(dbPool);
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('[Shutdown] Received SIGTERM signal');
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            await closeDatabase(dbPool);
            process.exit(0);
        });

    } catch (error) {
        console.error('[Startup] Fatal error:', error.message);
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        if (dbPool) {
            await closeDatabase(dbPool);
        }
        process.exit(1);
    }
}

// Start application
start();
