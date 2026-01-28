/**
 * Main Entry Point - Server initialization and startup
 * Follows Separation of Concerns Principle
 * Handles only server lifecycle, delegates configuration to modules
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import { createConnectionConfig, initializeDatabase, closeDatabase, validateDatabaseConnection, setupPoolEventHandlers } from './config/DatabaseConfig.js';
import { createApplication } from './Application.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const distPath = path.join(__dirname, '../compliance-ui/dist');
const DB_VALIDATION_INTERVAL = 30 * 1000; // 30 seconds for connection validation

/**
 * Main startup function
 */
async function start() {
    let dbPool = null;
    let validationInterval = null;

    try {
        // Initialize database
        console.log('[Startup] Initializing database connection...');
        const dbConfig = createConnectionConfig(process.env);
        dbPool = await initializeDatabase(dbConfig);

        // Set up pool event handlers for monitoring
        setupPoolEventHandlers(dbPool);

        // Create application
        console.log('[Startup] Creating application...');
        const { app, container } = createApplication(dbPool, distPath);

        // Start server
        app.listen(PORT, () => {
            console.log(`[Server] Running on http://localhost:${PORT}`);
            console.log('[Server] Environment:', process.env.NODE_ENV || 'development');
        });

        // Set up periodic database connection validation (every 30 seconds)
        // Validation checks pool health and automatically reconnects if needed
        console.log('[Database] Setting up connection validation interval (30 seconds)...');
        validationInterval = setInterval(async () => {
            try {
                const validatedPool = await validateDatabaseConnection(dbPool, dbConfig);
                if (validatedPool !== dbPool) {
                    // Pool was reconnected
                    dbPool = validatedPool;
                    setupPoolEventHandlers(validatedPool);
                    container.setPool(validatedPool);
                    console.log('[Database] Connection pool was restored');
                }
            } catch (error) {
                console.error('[Database] Connection validation failed:', error.message);
            }
        }, DB_VALIDATION_INTERVAL);

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('[Shutdown] Received SIGINT signal');
            if (validationInterval) {
                clearInterval(validationInterval);
            }
            await closeDatabase(dbPool);
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('[Shutdown] Received SIGTERM signal');
            if (validationInterval) {
                clearInterval(validationInterval);
            }
            await closeDatabase(dbPool);
            process.exit(0);
        });

    } catch (error) {
        console.error('[Startup] Fatal error:', error.message);
        if (validationInterval) {
            clearInterval(validationInterval);
        }
        if (dbPool) {
            await closeDatabase(dbPool);
        }
        process.exit(1);
    }
}

// Start application
start();
