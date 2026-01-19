# Testing Quick Start

## Run Tests

```bash
# All tests
npm test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

## What's Tested

✅ **Error Handling** - AppError utility class
✅ **Validation** - Request parameter, body, and query validation
✅ **Services** - ModeService, ReportService business logic
✅ **Controllers** - ModeController HTTP handlers
✅ **Dependency Injection** - Container service registration and resolution
✅ **Utilities** - Date, currency, and CSV conversion functions

## Test Files Added

- `src/errors/AppError.test.js` - Error handling (11 tests)
- `src/middleware/ValidationMiddleware.test.js` - Request validation (9 tests)
- `src/services/ModeService.test.js` - Mode service logic (5 tests)
- `src/services/ReportService.test.js` - Report service logic (7 tests)
- `src/controllers/ModeController.test.js` - Mode controller (5 tests)
- `src/di/Container.test.js` - DI container (6 tests)
- `src/utils/DataConverters.test.js` - Data utilities (5 tests)

**Total: 48 test cases**

## Coverage Report

After running `npm run test:coverage`, open:
```
coverage/index.html
```

in your browser to see interactive coverage visualization.

## Add More Tests

Create a `.test.js` file next to any `.js` file you want to test:

```javascript
import { YourModule } from '../../src/path/YourModule.js';

describe('YourModule', () => {
    it('should do something', () => {
        // test code
    });
});
```

Tests are auto-discovered and run by Jest.

## CI/CD Integration Ready

The test setup is ready for GitHub Actions, GitLab CI, or any CI/CD system. Just run:
```bash
npm run test:coverage
```

## Documentation

See [TESTING.md](./TESTING.md) for comprehensive testing guide.
