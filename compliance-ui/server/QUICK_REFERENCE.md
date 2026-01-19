# Quick Reference Guide

## File Locations Quick Reference

```
Controllers:           src/controllers/
Services:              src/services/
Repositories:          src/data/repositories/
Middleware:            src/middleware/
Utilities:             src/utils/
Routes:                src/routes/
Errors:                src/errors/
Dependency Injection:  src/di/
Database Config:       src/config/
```

## Adding a New Endpoint - Checklist

- [ ] 1. Add method to relevant `*Repository.js`
- [ ] 2. Add method to relevant `*Service.js`
- [ ] 3. Add method to relevant `*Controller.js`
- [ ] 4. Add route definition in `src/routes/index.js`
- [ ] 5. Add validation in controller if needed
- [ ] 6. Test endpoint locally

## Key Classes & Their Roles

| Class | Location | Responsibility |
|-------|----------|-----------------|
| `RunRepository` | `src/data/repositories/` | Query CMP_Runs table |
| `RunService` | `src/services/` | Run business logic |
| `RunController` | `src/controllers/` | HTTP /api/runs/* endpoints |
| `MssqlRepository` | `src/data/` | MSSQL database access |
| `IRepository` | `src/data/` | Data access contract |
| `Container` | `src/di/` | Manage dependencies |
| `AppError` | `src/errors/` | Custom errors |
| `errorHandler` | `src/middleware/` | Catch all errors |
| `asyncHandler` | `src/middleware/` | Wrap async controllers |

## Common Code Patterns

### Throw Validation Error
```javascript
if (!id) throw AppError.badRequest('ID is required');
```

### Query Database
```javascript
const result = await this.repo.query(sql, params);
```

### Use Async Endpoint
```javascript
myEndpoint = asyncHandler(async (req, res) => {
    const data = await this.service.getData();
    res.json(data);
});
```

### Create Service
```javascript
class MyService {
    constructor(myRepository) {
        this.repo = myRepository;
    }
    
    async doSomething(param) {
        return this.repo.getSomething(param);
    }
}
```

### Create Controller
```javascript
class MyController {
    constructor(myService) {
        this.service = myService;
    }
    
    getAll = asyncHandler(async (req, res) => {
        const items = await this.service.getAll();
        res.json(items);
    });
}
```

## Key Imports

```javascript
// Middleware
import { asyncHandler, errorHandler } from '../middleware/ErrorHandler.js';
import { validateParams } from '../middleware/ValidationMiddleware.js';

// Errors
import { AppError } from '../errors/AppError.js';

// Utilities
import { DataConverters } from '../utils/DataConverters.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';

// Services
import { RunService } from '../services/RunService.js';
```

## API Endpoint Naming Convention

```
GET    /api/runs                 # Get all runs
GET    /api/runs/:id             # Get single run
POST   /api/runs                 # Create run
GET    /api/runs/:id/reports     # Get related data
GET    /api/reports              # Get all reports
GET    /api/reports/run/:runId   # Get reports for run
PUT    /api/reports/:id          # Update report
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| DB_USER | - | SQL Server username |
| DB_PASSWORD | - | SQL Server password |
| DB_SERVER | - | SQL Server hostname |
| DB_NAME | - | Database name |
| DB_ENCRYPT | false | SSL encryption |
| DB_TRUST_CERT | false | Trust self-signed certs |
| PORT | 3001 | Server port |
| NODE_ENV | development | Environment |

## Running the Server

```bash
npm install          # Install dependencies
npm run dev         # Run with auto-reload
npm start           # Run production mode
```

## Testing Endpoints

```bash
# Get all runs
curl http://localhost:3001/api/runs

# Get specific run
curl http://localhost:3001/api/runs/1

# Get all modes
curl http://localhost:3001/api/modes

# Get all reports
curl http://localhost:3001/api/reports

# Create report note (example POST)
curl -X PUT http://localhost:3001/api/report-details/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"Pass","directCount":0,"dispatchNeeded":0}'
```

## Error Response Format

```json
{
    "error": "Error message here",
    "statusCode": 400,
    "details": { "field": "error details" }
}
```

## HTTP Status Codes Used

| Code | Usage | Example |
|------|-------|---------|
| 200 | Success | GET request succeeded |
| 201 | Created | POST created resource |
| 400 | Bad Request | Missing required field |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database connection failed |

## Debugging

### Check if service started
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### Common errors
- "Database not connected" → Check `.env` settings
- "Run not found" → Use `/api/runs` to list available runs
- "Invalid JSON" → Check request body format
- "Port 3001 in use" → Change PORT in `.env`

## Architecture Layers (Bottom to Top)

```
Layer 1: Database (MSSQL)
         ↑
Layer 2: MssqlRepository (IRepository implementation)
         ↑
Layer 3: Domain Repositories (RunRepository, ReportRepository, etc.)
         ↑
Layer 4: Services (RunService, ReportService, etc.)
         ↑
Layer 5: Controllers (RunController, ReportController, etc.)
         ↑
Layer 6: Routes (Express routing)
         ↑
Layer 7: HTTP Clients (Frontend, Postman, etc.)
```

## DI Container Usage

```javascript
// In Application.js
const container = new Container(dbPool);
container.initializeDefaultServices();

// Get service
const runService = container.getRunService();

// Create controller with service
const runController = new RunController(runService);
```

## Transaction Example

```javascript
async complexOperation() {
    return this.repo.withTransaction(async (tx) => {
        // All queries in this block are in same transaction
        await tx.request().query('INSERT INTO CMP_Runs ...');
        await tx.request().query('INSERT INTO CMP_Reports ...');
        // Auto-commits if no error
        // Auto-rolls back if error thrown
    });
}
```

## Data Conversion

```javascript
// Convert values
const number = DataConverters.toInt('123');  // 123
const bool = DataConverters.toBool('true');  // true
const date = DataConverters.toDate('2024-01-01');  // '2024-01-01'

// Validate values
ValidationUtils.required(value, 'fieldName');
ValidationUtils.isPositiveInteger(value, 'fieldName');
ValidationUtils.isValidEmail(email);
```

## Adding a Query

1. **Repository**: Add query method
```javascript
async getByStatus(status) {
    return this.repo.query('SELECT * FROM CMP_Runs WHERE Status = @status', { status });
}
```

2. **Service**: Add business logic wrapper
```javascript
async getRunsByStatus(status) {
    return this.runRepo.getByStatus(status);
}
```

3. **Controller**: Add HTTP endpoint
```javascript
getByStatus = asyncHandler(async (req, res) => {
    const runs = await this.runService.getRunsByStatus(req.query.status);
    res.json(runs);
});
```

4. **Route**: Add URL mapping
```javascript
router.get('/runs/status/:status', controller.getByStatus);
```

## Performance Tips

1. Use `TOP` clause in queries
2. Use specific columns instead of `SELECT *`
3. Add indexes on frequently queried columns
4. Use connection pooling (automatic)
5. Cache static data (modes, etc.)
6. Use transactions for multi-step operations
