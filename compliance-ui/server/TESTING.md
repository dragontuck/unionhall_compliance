# Unit Testing & Code Coverage Guide

## Overview

This backend API is configured with comprehensive unit testing and code coverage using Jest. All critical components including services, controllers, middleware, utilities, and the DI container have test coverage.

## Setup

### Installation

The testing dependencies are already configured in `package.json`. Install them with:

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `@babel/preset-env` - JavaScript transpilation
- `babel-jest` - Babel integration with Jest

### Configuration

Jest is configured in `jest.config.js` with:
- Node.js test environment
- ES module support
- Code coverage collection (70% threshold)
- HTML and LCOV coverage reports

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

This generates a coverage report in the `coverage/` directory with:
- `coverage/index.html` - Interactive HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD integration
- `coverage/coverage-summary.json` - JSON summary

## Test Structure

Tests are located alongside source files with `.test.js` extension:

```
src/
├── errors/
│   ├── AppError.js
│   └── AppError.test.js
├── middleware/
│   ├── ValidationMiddleware.js
│   └── ValidationMiddleware.test.js
├── services/
│   ├── ModeService.js
│   └── ModeService.test.js
├── controllers/
│   ├── ModeController.js
│   └── ModeController.test.js
├── di/
│   ├── Container.js
│   └── Container.test.js
└── utils/
    ├── DataConverters.js
    └── DataConverters.test.js
```

## Test Coverage

### Current Test Coverage

- **AppError** (errors/) - Utility class for standardized error handling
  - Error creation with status codes
  - Static factory methods
  - Error identification

- **ValidationMiddleware** (middleware/) - Request validation
  - Parameter validation (type checking, constraints)
  - Body validation (required fields, types, lengths)
  - Query validation (required fields)

- **ModeService** (services/) - Business logic for modes
  - Get all modes
  - Get mode by ID
  - Error handling

- **ModeController** (controllers/) - HTTP request handlers
  - Get all modes endpoint
  - Get mode by ID endpoint
  - Error handling and middleware integration

- **Container** (di/) - Dependency injection container
  - Service registration
  - Service resolution
  - Singleton pattern
  - Dependency graphs
  - Service clearing

- **DataConverters** (utils/) - Data transformation utilities
  - Excel date conversion
  - Currency formatting
  - Date formatting
  - CSV date parsing

## Writing New Tests

### Test Template

```javascript
import { YourClass } from '../../src/path/YourClass.js';

describe('YourClass', () => {
    let instance;
    let mockDependency;

    beforeEach(() => {
        // Setup
        mockDependency = {
            method: jest.fn(),
        };
        instance = new YourClass(mockDependency);
    });

    describe('methodName', () => {
        it('should do something specific', async () => {
            // Arrange
            const input = 'test';
            mockDependency.method.mockResolvedValue('result');

            // Act
            const result = await instance.methodName(input);

            // Assert
            expect(result).toBe('expected');
            expect(mockDependency.method).toHaveBeenCalledWith(input);
        });

        it('should handle errors', async () => {
            mockDependency.method.mockRejectedValue(new Error('Failed'));
            
            await expect(instance.methodName('test')).rejects.toThrow('Failed');
        });
    });
});
```

### Best Practices

1. **Use descriptive test names** - Clearly describe what is being tested
2. **Arrange-Act-Assert pattern** - Structure tests with clear setup, execution, and verification
3. **Mock external dependencies** - Use Jest mocks to isolate units
4. **Test error cases** - Include tests for error handling
5. **Use beforeEach** - Setup common test fixtures
6. **Keep tests focused** - One behavior per test
7. **Test edge cases** - null, undefined, empty values, boundary conditions

## Coverage Thresholds

The current coverage thresholds are set to 70% in `jest.config.js`:

```javascript
coverageThreshold: {
    global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
    },
}
```

This means:
- 70% of code branches must be covered
- 70% of functions must be covered
- 70% of lines must be covered
- 70% of statements must be covered

To increase coverage, either:
1. Write more tests
2. Lower the threshold in `jest.config.js` (not recommended)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

### Run a single test file
```bash
npx jest src/errors/AppError.test.js
```

### Run tests matching a pattern
```bash
npx jest --testNamePattern="should return"
```

### Debug in Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Mocking External Services

### Mock Database/Repository

```javascript
const mockRepo = {
    query: jest.fn().mockResolvedValue([]),
    queryOne: jest.fn().mockResolvedValue(null),
    execute: jest.fn().mockResolvedValue(1),
};
```

### Mock HTTP Requests

```javascript
const mockReq = {
    params: { id: '1' },
    body: { name: 'Test' },
    query: { filter: 'active' },
};

const mockRes = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
};
```

## Troubleshooting

### "Cannot find module" errors
- Ensure file paths in imports are correct
- Check that ES module syntax is consistent

### Tests timeout
- Increase timeout: `jest.setTimeout(10000)`
- Mock slow external calls

### Coverage not updating
- Clear Jest cache: `npx jest --clearCache`
- Delete `coverage/` directory

## Next Steps for Full Coverage

To achieve higher test coverage, add tests for:

1. **RunService & RunController** - Compliance run operations
2. **ReportService & ReportController** - Report management
3. **HireDataService & HireDataController** - Hire data import
4. **Repository classes** - Data access layer
5. **ErrorHandler middleware** - Error handling
6. **Routes** - API route definitions
7. **Application factory** - App initialization

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Node.js](https://nodejs.org/en/docs/guides/testing/)
- [SOLID Principles in Testing](https://en.wikipedia.org/wiki/SOLID)
