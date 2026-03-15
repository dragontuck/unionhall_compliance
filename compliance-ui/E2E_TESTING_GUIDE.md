# End-to-End (E2E) Testing Guide

Comprehensive end-to-end testing suite for the Union Hall Compliance UI using Playwright.

## Quick Start

### Installation

1. **Install Playwright and dependencies:**
```bash
cd compliance-ui
npm install -D @playwright/test
```

2. **Install browser binaries:**
```bash
npx playwright install
```

3. **Verify installation:**
```bash
npx playwright --version
```

### Running Tests

**Start the development server (if not already running):**
```bash
npm run dev
```

**Run all E2E tests:**
```bash
npx playwright test
```

**Run specific test file:**
```bash
npx playwright test e2e/main.spec.ts
```

**Run specific test by name:**
```bash
npx playwright test -g "should load dashboard page"
```

**Run in headed mode (visible browser):**
```bash
npx playwright test --headed
```

**Run in UI mode (interactive mode with test inspector):**
```bash
npx playwright test --ui
```

**Run with debug mode:**
```bash
npx playwright test --debug
```

**Run tests in specific browser:**
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**Generate HTML report after running tests:**
```bash
npx playwright show-report
```

## Test Structure

### Test Suites

#### 1. Navigation Tests
- Dashboard page load
- Navigation to Reports
- Navigation to Contractor Blacklist
- Back button navigation

**Run:** `npx playwright test -g "Navigation"`

#### 2. File Upload Tests
- File upload section visibility
- File selection and display
- Invalid file type handling
- CSV/XLSX format support

**Run:** `npx playwright test -g "File Upload"`

#### 3. Compliance Run Execution
- Run execution options display
- Mode selection dropdown
- Execute button functionality
- Success/error feedback

**Run:** `npx playwright test -g "Compliance Run"`

#### 4. Reports Page Tests
- Reports list display
- Date filtering
- Data export functionality
- Pagination (if implemented)

**Run:** `npx playwright test -g "Reports"`

#### 5. Contractor Blacklist Tests
- Blacklist page display
- Contractor list rendering
- Add contractor functionality
- Edit/Delete operations

**Run:** `npx playwright test -g "Contractor Blacklist"`

#### 6. Error Handling Tests
- Invalid URL handling
- Network error gracefully handling
- Missing data handling
- API error responses

**Run:** `npx playwright test -g "Error Handling"`

#### 7. Performance Tests
- Page load time (should be <5 seconds)
- Rapid click handling
- Large dataset rendering
- Memory usage under stress

**Run:** `npx playwright test -g "Performance"`

## Configuration

### Browser Configuration
Tests run on multiple browsers by default:
- **Chromium** (Chrome, Edge)
- **Firefox** (Firefox)
- **WebKit** (Safari)
- **Mobile Chrome** (Pixel 5)

To run on specific browsers:
```bash
npx playwright test --project=chromium --project=firefox
```

### Timeout Configuration
- **Test timeout:** 30 seconds per test
- **Global timeout:** 30 minutes for entire suite
- **Network timeout:** 30 seconds for page loads

Adjust in `playwright.config.ts`:
```typescript
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}
```

### Environment Variables

Set custom base URL:
```bash
BASE_URL=http://your-server:5173 npx playwright test
```

Set for CI/CD:
```bash
CI=true npx playwright test
```

## Advanced Usage

### Running Tests in CI/CD

**GitHub Actions Example:**
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

**Add to package.json:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### Custom Test Configuration

**Run tests against staging server:**
```bash
BASE_URL=https://staging.example.com npx playwright test
```

**Run with specific number of workers:**
```bash
npx playwright test --workers=4
```

**Retry failed tests:**
```bash
npx playwright test --retries=3
```

### Recording Tests

**Record new test:**
```bash
npx playwright codegen http://localhost:5173
```

This opens an interactive browser where you can perform actions, and Playwright will generate test code for you.

### Debugging Failed Tests

**Video and screenshot capture:**
- Videos saved to: `test-results/`
- Screenshots: `test-results/` (only on failure)
- Traces: `test-results/` (on-first-retry)

**View in browser:**
```bash
npx playwright show-report
```

**Debug specific test:**
```bash
npx playwright test main.spec.ts --debug
```

## Test Data

### CSV Test Data Creation

Tests include a helper function to create test data:

```typescript
import { createTestCSVData } from './e2e/main.spec';

// Create 10 test records
const csv = createTestCSVData(10);
```

Generated format:
```csv
EmpID,FirstName,LastName,HireDate,Status
1,Employee1,Test1,2024-01-15,Active
2,Employee2,Test2,2024-02-20,Inactive
...
```

### Custom Test Data Files

Create test data files in `e2e/fixtures/`:

```typescript
test('upload custom data file', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('e2e/fixtures/test-data.csv');
  // ... assertions
});
```

## Troubleshooting

### Tests Timeout

**Problem:** Tests hang or timeout
**Solution:**
- Ensure development server is running: `npm run dev`
- Check if port 5173 is available
- Increase timeout in playwright.config.ts
- Check network connectivity

```bash
# Test connection
curl http://localhost:5173
```

### Flaky Tests

**Problem:** Tests pass sometimes, fail others
**Solution:**
- Add explicit waits: `await page.waitForURL(...)`
- Use `waitUntil: 'networkidle'`
- Increase test timeout for slow operations
- Check for race conditions in test code

```typescript
// Better: explicit wait
await page.waitForURL('**/reports');

// Instead of: implicit wait
await page.waitForTimeout(1000);
```

### Element Not Found

**Problem:** Locator fails to find element
**Solution:**
- Check element selectors in browser DevTools
- Use more specific selectors
- Add wait for element visibility
- Check if element is in iframe or shadow DOM

```typescript
// Add explicit wait
await page.locator('button:has-text("Submit")').waitFor();
```

### Network Issues

**Problem:** API calls fail during tests
**Solution:**
- Mock API responses for isolated testing
- Ensure backend server is running
- Check CORS configuration
- Add network throttling tests

### Browser Crashes

**Problem:** Browser process crashes
**Solution:**
- Reduce worker count: `--workers=1`
- Disable sandbox (if needed): `--disable-sandbox`
- Check system resources
- Update Playwright: `npm install -D @playwright/test@latest`

## Integration with CI/CD

### GitHub Actions

**.github/workflows/e2e.yml:**
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    services:
      mssql:
        image: mcr.microsoft.com/mssql/server:2019-latest
        env:
          SA_PASSWORD: YourPassword123!
          ACCEPT_EULA: Y
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Start dev server
        run: npm run dev &
      
      - name: Wait for server
        run: npx wait-on http://localhost:5173
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

### Azure DevOps

**azure-pipelines.yml:**
```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '22.x'
  
  - script: npm install
    displayName: 'Install dependencies'
  
  - script: npx playwright install --with-deps
    displayName: 'Install Playwright'
  
  - script: npm run dev &
    displayName: 'Start dev server'
  
  - script: npm run test:e2e
    displayName: 'Run E2E tests'
  
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: 'test-results/junit.xml'
```

## Best Practices

### 1. Selectors

```typescript
// ✅ Good: Specific and stable
page.locator('[data-testid="upload-button"]')

// ⚠️ Acceptable: Text content
page.locator('button:has-text("Upload")')

// ❌ Avoid: Index-based or fragile
page.locator('button').nth(3)
page.locator('body > div > div > button')
```

### 2. Waits

```typescript
// ✅ Use explicit waits
await page.waitForURL('**/reports');
await page.waitForSelector('[data-testid="report-list"]');

// ⚠️ Acceptable for dynamic content
await page.waitForLoadState('networkidle');

// ❌ Avoid: Hard waits
await page.waitForTimeout(2000);
```

### 3. Error Handling

```typescript
// ✅ Good: Graceful fallback
await page.locator('button:has-text("Delete")').click().catch(() => {
  // Element might not exist
  return Promise.resolve();
});

// ✅ Good: Check visibility first
if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
  await button.click();
}
```

### 4. Test Organization

```typescript
// ✅ Good: Descriptive names and clear groups
test.describe('File Upload', () => {
  test('should accept CSV files', async ({ page }) => {
    // ...
  });

  test('should reject invalid formats', async ({ page }) => {
    // ...
  });
});
```

### 5. Setup and Teardown

```typescript
// ✅ Reusable page setup
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
});

// ✅ Cleanup
test.afterEach(async ({ page }) => {
  await page.close();
});
```

## Performance Considerations

### Parallel Execution
Tests run in parallel by default (multiple workers). Adjust:
```bash
npx playwright test --workers=1  # Sequential
npx playwright test --workers=4  # 4 workers
```

### Resource Usage
- Each worker spawns separate browser instance
- Monitor CPU and memory usage
- Reduce workers if system is constrained

### Test Duration
- Target: <1 second per test (excluding load)
- Add to build time: ~5-10 minutes for full suite
- Optimize slow tests or split into separate runs

## Metrics and Reporting

### Test Summary Report
After running tests:
```bash
npx playwright show-report
```

Report includes:
- Pass/fail status for each test
- Execution time
- Video recordings (on failure)
- Screenshots (on failure)
- Trace files for debugging

### JSON Report
For CI/CD integration:
```
test-results/results.json
```

### JUnit Report
For pipeline integration:
```
test-results/junit.xml
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debug Guide](https://playwright.dev/docs/debug)
- [Inspector Tool](https://playwright.dev/docs/inspector)
- [Trace Viewer](https://trace.playwright.dev)

## Support

For issues or questions:
1. Check test output and HTML report
2. Run with `--debug` flag
3. Check Playwright documentation
4. Enable verbose logging: `DEBUG=pw:api npx playwright test`
