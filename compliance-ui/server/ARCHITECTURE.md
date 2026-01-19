# Server Architecture Guide - SOLID Principles & Professional Patterns

## Overview

The refactored Node.js/Express API has been restructured following SOLID principles and modern software architecture patterns. This document outlines the architecture, design decisions, and how each layer functions.

## Table of Contents
- [Architecture Layers](#architecture-layers)
- [SOLID Principles Implementation](#solid-principles-implementation)
- [Dependency Injection](#dependency-injection)
- [Error Handling](#error-handling)
- [Data Access Layer](#data-access-layer)
- [Service Layer](#service-layer)
- [Controller Layer](#controller-layer)
- [Project Structure](#project-structure)

---

## Architecture Layers

The refactored API follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Express Routes                        │
│                  (HTTP Endpoints)                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│               Controllers                               │
│  (HTTP Request/Response Handling)                       │
│  - RunController                                        │
│  - ReportController                                     │
│  - ModeController                                       │
│  - HireDataController                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│               Services (Business Logic)                 │
│  - RunService                                           │
│  - ReportService                                        │
│  - ModeService                                          │
│  - HireDataService                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│           Repositories (Data Access)                    │
│  - RunRepository                                        │
│  - ReportRepository                                     │
│  - ReportDetailRepository                               │
│  - ReportNoteRepository                                 │
│  - ModeRepository                                       │
│  - HireDataRepository                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│            Database Abstraction (IRepository)           │
│  - MssqlRepository (MSSQL Implementation)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                   MSSQL Database                        │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. **HTTP Layer** (Routes & Controllers)
- Routes: Define HTTP endpoints and map to controllers
- Controllers: Handle HTTP request/response serialization
- No business logic here
- Example: `RunController.getAllRuns()` receives HTTP request, calls `RunService`

#### 2. **Business Logic Layer** (Services)
- Implement business rules and workflows
- Orchestrate repositories to fulfill use cases
- No HTTP concerns
- Example: `RunService.createRun()` validates data, creates run, returns ID

#### 3. **Data Access Layer** (Repositories)
- Encapsulate database queries
- Provide clean interface to services
- No business logic
- Example: `RunRepository.createRun()` inserts record and returns new ID

#### 4. **Database Abstraction** (IRepository)
- Interface defining data access contract
- Allows plugging different database implementations
- Currently: `MssqlRepository` for SQL Server

---

## SOLID Principles Implementation

### **S** - Single Responsibility Principle

Each class has ONE reason to change:

```javascript
// ✅ Good: Each class has single responsibility
class RunRepository { /* Only run data access */ }
class RunService { /* Only run business logic */ }
class RunController { /* Only HTTP handling */ }

// ❌ Bad: Mixed responsibilities (original code)
// All in index.js: routing + middleware + business logic + data access
```

**Benefits:**
- Easy to test each component independently
- Easy to locate code (e.g., find all run logic in RunService)
- Changes to business logic don't affect data access

### **O** - Open/Closed Principle

Classes are open for extension, closed for modification:

```javascript
// ✅ Good: Can extend without modifying existing code
class AppError extends Error {
    static badRequest(msg, details) { ... }
    static notFound(msg, details) { ... }
    static databaseError(err) { ... }
}

// New error types added without changing existing code
```

**Benefits:**
- New features don't require changing existing code
- Reduces risk of breaking existing functionality
- Easier code reviews

### **L** - Liskov Substitution Principle

Subclasses can replace parent classes without breaking:

```javascript
// ✅ Good: MssqlRepository implements IRepository contract
class MssqlRepository extends IRepository {
    async query(sql, params) { /* MSSQL implementation */ }
    async execute(sql, params) { /* MSSQL implementation */ }
}

// Could be replaced with:
// class PostgresRepository extends IRepository { ... }
// Without changing consumer code
```

**Benefits:**
- Can swap implementations (SQL → NoSQL, etc.)
- Services don't know about specific database
- Enables easy testing with mock repositories

### **I** - Interface Segregation Principle

Clients depend on specific interfaces, not general ones:

```javascript
// ✅ Good: Services depend on specific repositories
class RunService {
    constructor(runRepository, modeRepository, reportRepository, reportDetailRepository) { }
}

// ❌ Bad: Service depends on everything (general interface)
class RunService {
    constructor(generalRepository) { } // Too many responsibilities
}
```

**Benefits:**
- Each service knows exactly what it needs
- Clear dependencies
- Easy to understand what's required

### **D** - Dependency Inversion Principle

Depend on abstractions, not concrete implementations:

```javascript
// ✅ Good: Service depends on IRepository interface
class RunService {
    constructor(runRepository) { // Accepts any IRepository implementation
        this.repo = runRepository;
    }
}

// ❌ Bad: Service depends on concrete class
class RunService {
    constructor() {
        this.repo = new MssqlRepository(); // Tightly coupled
    }
}
```

**Benefits:**
- Services don't care about database technology
- Easy to test with mock repositories
- Can change database without changing services

---

## Dependency Injection

The `Container` class manages all dependencies:

```javascript
// In Application.js
const container = new Container(dbPool);
container.initializeDefaultServices();

// Services are created once and reused
const runService = container.getRunService();
const reportService = container.getReportService();
```

### How It Works

1. **Registration**: Services are registered with container
```javascript
container.registerFactory('runService', (c) => 
    new RunService(
        c.resolve('runRepository'),
        c.resolve('modeRepository'),
        c.resolve('reportRepository'),
        c.resolve('reportDetailRepository')
    )
);
```

2. **Resolution**: Container resolves dependencies
```javascript
const service = container.resolve('runService');
// Container automatically:
// - Creates RunRepository
// - Creates all required dependencies
// - Injects them into RunService constructor
```

3. **Usage in Controllers**
```javascript
const runController = new RunController(container.getRunService());
```

### Benefits
- All dependencies created in one place
- Easy to mock for testing
- Dependencies are explicit
- Can change implementations globally

---

## Error Handling

Centralized error handling through `AppError` class and middleware:

```javascript
// Define errors clearly
throw AppError.badRequest('Invalid input', { field: 'email' });
throw AppError.notFound('Run not found');
throw AppError.databaseError(originalError);

// All errors caught by middleware and formatted consistently
// Middleware maps AppError to HTTP response
```

### Error Flow

```javascript
// 1. Service throws AppError
if (!run) throw AppError.notFound(`Run ${id} not found`);

// 2. Controller's asyncHandler catches it
export const getRunById = asyncHandler(async (req, res) => {
    const run = await runService.getRunById(id); // Throws here
});

// 3. Middleware catches and formats response
app.use(errorHandler); // Catches all errors
```

### Error Response Format

```json
{
    "error": "Run not found",
    "statusCode": 404,
    "details": { "runId": 123 }
}
```

---

## Data Access Layer

### Repository Pattern

Each repository handles one domain:

```
RunRepository        → CMP_Runs table
ReportRepository     → CMP_Reports table
ReportDetailRepository → CMP_ReportDetails table
ModeRepository       → CMP_Modes table
HireDataRepository   → CMP_HireData, CMP_ReviewedHires tables
```

### Example: RunRepository

```javascript
class RunRepository {
    async getAllRuns(limit = 100) { /* Query runs */ }
    async getRunById(id) { /* Query single run */ }
    async createRun(data) { /* Insert run */ }
    async getPreviousRun(modeId, reviewedDate) { /* Find previous */ }
}
```

### IRepository Interface

Defines contract all repositories must follow:

```javascript
class IRepository {
    async query(sql, params) { /* SELECT */ }
    async queryOne(sql, params) { /* SELECT TOP 1 */ }
    async queryScalar(sql, params) { /* SELECT aggregate */ }
    async execute(sql, params) { /* INSERT/UPDATE/DELETE */ }
    async withTransaction(callback) { /* Handle transactions */ }
}
```

### MssqlRepository Implementation

Concrete MSSQL implementation:

```javascript
class MssqlRepository extends IRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async query(sql, params) {
        const request = this.pool.request();
        this._bindParameters(request, params);
        const result = await request.query(sql);
        return result.recordset;
    }

    async withTransaction(callback) {
        const tx = new sql.Transaction(this.pool);
        try {
            await tx.begin();
            const result = await callback(tx);
            await tx.commit();
            return result;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }
}
```

### Benefits
- All database queries in one place
- Easy to find and update queries
- Easy to test with mock repositories
- Can switch databases by implementing new repository

---

## Service Layer

Services contain all business logic:

```javascript
class RunService {
    constructor(runRepo, modeRepo, reportRepo, reportDetailRepo) {
        this.runRepo = runRepo;
        this.modeRepo = modeRepo;
        this.reportRepo = reportRepo;
        this.detailRepo = reportDetailRepo;
    }

    async createRun(runData) {
        // 1. Validate mode exists
        const mode = await this.modeRepo.getModeById(modeId);
        if (!mode) throw new Error(`Mode ${modeId} not found`);

        // 2. Generate run number
        const runNumber = await this.runRepo.getNextRunNumber(modeId, reviewedDate);

        // 3. Create run
        return this.runRepo.createRun({ modeId, reviewedDate, runNumber });
    }
}
```

### Key Points
- Services DON'T handle HTTP concerns
- Services DON'T directly access database
- Services orchestrate repositories
- Services throw `AppError` for validation failures
- Services are 100% testable

---

## Controller Layer

Controllers handle HTTP concerns only:

```javascript
class RunController {
    constructor(runService) {
        this.runService = runService;
    }

    getAllRuns = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const runs = await this.runService.getAllRuns(limit);
        res.json(runs);
    });

    getRunById = asyncHandler(async (req, res) => {
        const runId = parseInt(req.params.id);
        if (isNaN(runId)) {
            throw AppError.badRequest('Run ID must be integer');
        }
        const run = await this.runService.getRunById(runId);
        res.json(run);
    });
}
```

### Key Points
- Controllers parse HTTP input
- Controllers call services
- Controllers format HTTP output
- Controllers use `asyncHandler` to catch errors
- Controllers validate parameters and throw `AppError`

### asyncHandler Wrapper

Eliminates try-catch blocks:

```javascript
// ✅ Good: Clean, readable
const getRunById = asyncHandler(async (req, res) => {
    const run = await runService.getRunById(id);
    res.json(run);
});

// ❌ Bad: Repetitive try-catch
const getRunById = async (req, res, next) => {
    try {
        const run = await runService.getRunById(id);
        res.json(run);
    } catch (error) {
        next(error); // Every handler needs this
    }
};
```

---

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── DatabaseConfig.js          # Database initialization
│   ├── controllers/
│   │   ├── RunController.js
│   │   ├── ReportController.js
│   │   ├── ModeController.js
│   │   └── HireDataController.js
│   ├── data/
│   │   ├── IRepository.js             # Interface
│   │   ├── MssqlRepository.js         # MSSQL implementation
│   │   └── repositories/
│   │       ├── RunRepository.js
│   │       ├── ReportRepository.js
│   │       ├── ReportDetailRepository.js
│   │       ├── ReportNoteRepository.js
│   │       ├── ModeRepository.js
│   │       └── HireDataRepository.js
│   ├── di/
│   │   └── Container.js               # Dependency injection
│   ├── errors/
│   │   └── AppError.js                # Custom error class
│   ├── middleware/
│   │   ├── ErrorHandler.js            # Error & async handling
│   │   └── ValidationMiddleware.js    # Request validation
│   ├── routes/
│   │   └── index.js                   # Route definitions
│   ├── services/
│   │   ├── RunService.js
│   │   ├── ReportService.js
│   │   ├── ModeService.js
│   │   └── HireDataService.js
│   ├── utils/
│   │   ├── DataConverters.js          # Data conversion utilities
│   │   └── ValidationUtils.js         # Validation utilities
│   ├── Application.js                 # App factory
│   └── index.js                       # Entry point
├── package.json
└── README.md
```

---

## Key Improvements Over Original Code

| Aspect | Before | After |
|--------|--------|-------|
| **File Structure** | Everything in index.js (870 lines) | Organized by concern (50-100 lines each) |
| **Error Handling** | Scattered try-catch | Centralized middleware |
| **Database Access** | Direct in routes | Abstracted in repositories |
| **Business Logic** | Mixed with HTTP logic | Separate services |
| **Testability** | Hard to test | Each layer independently testable |
| **Reusability** | Routes tightly coupled | Services reusable in different contexts |
| **Maintainability** | Hard to find code | Clear organization by feature |
| **Extensibility** | Requires modifying existing code | Add new layers without changing others |
| **Dependencies** | Global/implicit | Explicit via constructor injection |

---

## Testing Strategy

Each layer can be tested independently:

```javascript
// Test Service (no database needed)
const mockRepository = { getRunById: jest.fn() };
const service = new RunService(mockRepository);

// Test Controller (no HTTP server needed)
const mockService = { getRunById: jest.fn() };
const controller = new RunController(mockService);

// Test Repository (with test database)
const pool = /* test pool */;
const repository = new MssqlRepository(pool);
```

---

## Performance Considerations

1. **Connection Pooling**: MSSQL maintains connection pool
2. **Lazy Loading**: Services created on-demand via Container
3. **Query Optimization**: Specific queries in repositories (no SELECT *)
4. **Error Recovery**: Transactions rollback on failure
5. **Memory**: Only loaded services remain in memory

---

## Next Steps

- Add request logging middleware
- Add rate limiting
- Add request validation schemas
- Add API documentation (OpenAPI/Swagger)
- Add comprehensive unit tests
- Add integration tests
- Add performance monitoring
