# Server Developer Guide

## Getting Started

### Prerequisites
- Node.js 18+ with ES modules support
- SQL Server 2019+ (or compatible)
- npm 9+

### Installation

```bash
cd compliance-ui/server
npm install
```

### Environment Setup

Create `.env` file (or use `.env.example` as template):

```env
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_SERVER=localhost
DB_NAME=unionhall
DB_ENCRYPT=false
DB_TRUST_CERT=true
DB_CONNECTION_TIMEOUT=15000
DB_REQUEST_TIMEOUT=30000
PORT=3001
NODE_ENV=development
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

---

## Adding a New Feature

### Example: Add Mode-Specific Runs Query

#### 1. Add Repository Method

```javascript
// src/data/repositories/RunRepository.js
async getRunsByMode(modeId, limit = 50) {
    return this.repo.query(`
        SELECT TOP ${limit} * FROM CMP_Runs 
        WHERE ModeId = @modeId 
        ORDER BY ReviewedDate DESC
    `, { modeId });
}
```

#### 2. Add Service Method

```javascript
// src/services/RunService.js
async getRunsByMode(modeId, limit = 50) {
    const mode = await this.modeRepo.getModeById(modeId);
    if (!mode) throw AppError.notFound(`Mode ${modeId} not found`);
    return this.runRepo.getRunsByMode(modeId, limit);
}
```

#### 3. Add Controller Method

```javascript
// src/controllers/RunController.js
getRunsByMode = asyncHandler(async (req, res) => {
    const modeId = parseInt(req.params.modeId);
    if (isNaN(modeId)) {
        throw AppError.badRequest('Mode ID must be integer');
    }
    const limit = parseInt(req.query.limit) || 50;
    const runs = await this.runService.getRunsByMode(modeId, limit);
    res.json(runs);
});
```

#### 4. Add Route

```javascript
// src/routes/index.js
export function defineRunRoutes(router, controller) {
    // ... existing routes ...
    router.get('/runs/mode/:modeId', 
        validateParams({ modeId: { type: 'integer' } }), 
        controller.getRunsByMode);
}
```

#### 5. Test

```bash
curl http://localhost:3001/api/runs/mode/1?limit=10
```

---

## Common Tasks

### Adding a New Error Type

```javascript
// src/errors/AppError.js
static unauthorized(message, details) {
    return new AppError(message, 401, details);
}
```

### Adding Validation

```javascript
// src/middleware/ValidationMiddleware.js (already has basic validators)
export function validateBody(schema) {
    return (req, res, next) => {
        // Validate req.body against schema
    };
}

// Usage in route:
router.post('/runs', validateBody({
    modeId: { required: true, type: 'integer' },
    reviewedDate: { required: true, type: 'string' }
}), controller.createRun);
```

### Adding Logging

```javascript
// src/middleware/LoggingMiddleware.js (NEW FILE)
export function loggingMiddleware(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
}

// src/Application.js
app.use(loggingMiddleware);
```

### Working with Transactions

```javascript
// src/services/SomeService.js
async complexOperation(data) {
    return this.repo.withTransaction(async (tx) => {
        // All operations here are in same transaction
        // Automatically commits if no error
        // Automatically rolls back if error thrown
        
        const result1 = await tx.request().query('...');
        const result2 = await tx.request().query('...');
        return { result1, result2 };
    });
}
```

---

## Code Organization Rules

### 1. File Naming
- Controllers: `*Controller.js` (e.g., `RunController.js`)
- Services: `*Service.js` (e.g., `RunService.js`)
- Repositories: `*Repository.js` (e.g., `RunRepository.js`)
- Middleware: `*Middleware.js` (e.g., `ValidationMiddleware.js`)
- Utilities: descriptive name (e.g., `DataConverters.js`)

### 2. Class Naming
- Controllers: `*Controller` (e.g., `RunController`)
- Services: `*Service` (e.g., `RunService`)
- Repositories: `*Repository` (e.g., `RunRepository`)

### 3. Import Organization
```javascript
// 1. External packages first
import express from 'express';
import sql from 'mssql';

// 2. Internal modules
import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middleware/ErrorHandler.js';

// 3. Local imports
import { DataConverters } from '../utils/DataConverters.js';
```

### 4. Method Organization in Classes

```javascript
class SomeClass {
    // Constructor first
    constructor(dependencies) { }

    // Public methods
    async publicMethod() { }

    // Private/helper methods
    _privateMethod() { }
}
```

### 5. Error Handling

Always throw `AppError`, never plain `Error`:

```javascript
// ✅ Good
throw AppError.notFound('Run not found');
throw AppError.badRequest('Invalid input', { field: 'email' });

// ❌ Bad
throw new Error('Run not found');
throw 'Invalid input';
```

### 6. Async/Await

Always use async/await, never promises:

```javascript
// ✅ Good
async function getData() {
    const data = await repository.query(sql);
    return data;
}

// ❌ Bad
function getData() {
    return repository.query(sql).then(data => data);
}
```

---

## Testing Strategy

### Unit Test Example

```javascript
// tests/services/RunService.test.js
import { RunService } from '../../src/services/RunService.js';

describe('RunService', () => {
    let service;
    let mockRunRepository;
    let mockModeRepository;

    beforeEach(() => {
        mockRunRepository = {
            getRunById: jest.fn(),
            getAllRuns: jest.fn(),
            createRun: jest.fn()
        };
        mockModeRepository = {
            getModeById: jest.fn()
        };
        service = new RunService(mockRunRepository, mockModeRepository);
    });

    test('should get all runs', async () => {
        mockRunRepository.getAllRuns.mockResolvedValue([
            { id: 1, modeId: 1 },
            { id: 2, modeId: 2 }
        ]);

        const result = await service.getAllRuns(100);
        expect(result).toHaveLength(2);
        expect(mockRunRepository.getAllRuns).toHaveBeenCalledWith(100);
    });

    test('should throw when run not found', async () => {
        mockRunRepository.getRunById.mockResolvedValue(null);

        await expect(service.getRunById(999)).rejects.toThrow('Run 999 not found');
    });
});
```

### Integration Test Example

```javascript
// tests/integration/runs.test.js
import request from 'supertest';
import { createApplication } from '../../src/Application.js';

describe('Runs API', () => {
    let app;
    let pool;

    beforeAll(async () => {
        pool = await createTestPool();
        const { app: testApp } = createApplication(pool);
        app = testApp;
    });

    test('GET /api/runs should return runs', async () => {
        const response = await request(app)
            .get('/api/runs')
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });
});
```

---

## Database Changes

### Adding a New Table/Column

1. Create SQL migration (not automated - manual process)
2. Update relevant repository with new queries
3. Update service to use new repository methods
4. Update controller to expose new endpoints
5. Add tests

### Example: Add `Notes` Column to Runs

1. SQL: `ALTER TABLE CMP_Runs ADD Notes NVARCHAR(MAX);`

2. Repository:
```javascript
async updateRunNotes(runId, notes) {
    return this.repo.execute(
        'UPDATE CMP_Runs SET Notes = @notes WHERE id = @runId',
        { runId, notes }
    );
}
```

3. Service:
```javascript
async updateRunNotes(runId, notes) {
    return this.runRepo.updateRunNotes(runId, notes);
}
```

4. Controller:
```javascript
updateRunNotes = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    await this.runService.updateRunNotes(runId, notes);
    const run = await this.runService.getRunById(runId);
    res.json(run);
});
```

---

## Debugging Tips

### Enable Detailed Logging

```javascript
// src/index.js
if (process.env.DEBUG === 'true') {
    // Add detailed logging
    sql.on('debug', (msg) => console.log('[SQL]', msg));
}
```

### Common Issues

**Issue**: "Database not connected" error
- Solution: Check `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`

**Issue**: "Port already in use"
- Solution: Change `PORT` in `.env` or kill process: `lsof -i :3001`

**Issue**: Transaction errors
- Solution: Ensure `withTransaction` is used for multi-step operations

**Issue**: Slow queries
- Solution: Add indexes to frequently queried columns, check repository SQL

---

## Performance Optimization

### 1. Query Optimization
```javascript
// ❌ Inefficient: SELECT * with no limit
async getAllData() {
    return this.repo.query('SELECT * FROM LargeTable');
}

// ✅ Better: Specific columns with limit
async getRecentRuns(limit = 100) {
    return this.repo.query(`
        SELECT TOP ${limit} id, modeId, reviewedDate 
        FROM CMP_Runs 
        ORDER BY ReviewedDate DESC
    `);
}
```

### 2. Connection Pooling
- Default pool size: 10 connections
- Adjust in `DatabaseConfig.js` if needed

### 3. Caching
```javascript
// Example: Cache modes in memory
class ModeService {
    constructor(modeRepository) {
        this.modeRepo = modeRepository;
        this.modesCache = null;
    }

    async getAllModes() {
        if (!this.modesCache) {
            this.modesCache = await this.modeRepo.getAllModes();
        }
        return this.modesCache;
    }

    invalidateCache() {
        this.modesCache = null;
    }
}
```

---

## Security Best Practices

1. **Input Validation**: Always validate user input in controllers
2. **SQL Injection**: Use parameterized queries (repositories do this)
3. **Error Details**: Don't expose internal errors to clients
4. **Authentication**: Add JWT/session middleware before routes
5. **Rate Limiting**: Add rate limiter middleware
6. **CORS**: Configure properly in `Application.js`
7. **Environment Secrets**: Never commit `.env` files

---

## Deployment

### Production Environment

```env
NODE_ENV=production
DB_ENCRYPT=true
DB_TRUST_CERT=false
DB_CONNECTION_TIMEOUT=10000
DB_REQUEST_TIMEOUT=30000
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src src
EXPOSE 3001
CMD ["npm", "start"]
```

### Monitoring

Add APM/monitoring tools for production:
- Azure Application Insights
- Datadog
- New Relic
- Custom logging to ELK stack
