# E2E Testing Quick Reference

Quick commands for running end-to-end tests for Union Hall Compliance UI.

## Installation (One-time setup)

```bash
cd compliance-ui
npm install -D @playwright/test
npx playwright install
```

## Run Tests

### Start dev server (terminal 1)
```bash
npm run dev
```

### Run tests (terminal 2)

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:ui` | Interactive UI mode with test inspector |
| `npm run test:e2e:headed` | Tests visible in browser windows |
| `npm run test:e2e:debug` | Debug mode with step-through |
| `npm run test:e2e:report` | View HTML report of last run |

## Specific Test Runs

```bash
# Single test file
npx playwright test e2e/main.spec.ts

# Tests containing "Navigation"
npx playwright test -g "Navigation"

# Tests containing "File Upload"
npx playwright test -g "File Upload"

# Single browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Specific number of workers
npx playwright test --workers=1   # Sequential
npx playwright test --workers=4   # Parallel
```

## Test Structure

```
✓ Navigation
  ✓ should load dashboard page
  ✓ should navigate to Reports page
  ✓ should navigate to Contractor Blacklist
  ✓ should navigate back to Dashboard

✓ File Upload
  ✓ should display file upload section
  ✓ should accept file selection
  ✓ should show error for invalid file type

✓ Compliance Run Execution
  ✓ should display run execution options
  ✓ should show available modes in dropdown
  ✓ should execute compliance run

✓ Reports Page
  ✓ should display reports list
  ✓ should filter reports by date
  ✓ should export report data

✓ Contractor Blacklist
  ✓ should display blacklist page
  ✓ should display contractors in list
  ✓ should allow adding contractor

✓ Error Handling
  ✓ should display error on invalid URL
  ✓ should handle network errors gracefully
  ✓ should handle missing data gracefully

✓ Performance
  ✓ page should load within acceptable time
  ✓ should handle multiple rapid clicks
  ✓ should render large data sets without freezing
```

## Test Results

### Visual Report
After running tests, view results:
```bash
npm run test:e2e:report
```

Opens HTML report with:
- ✅ Passed/❌ Failed tests
- 📹 Video recordings (failures)
- 📸 Screenshots (failures)
- 🔍 Trace files

### CI/CD Integration

Reports saved to:
- HTML: `playwright-report/`
- JSON: `test-results/results.json`
- JUnit: `test-results/junit.xml`

## Troubleshooting

### Browser Installation Issues
```bash
npx playwright install --with-deps
```

### Port 5173 Already in Use
```bash
# Find and kill process
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows
```

### Tests Hang/Timeout
- Ensure dev server is running: `npm run dev`
- Check network connectivity
- Run with `--workers=1` for sequential execution
- Check browser console for errors

### Element Not Found
- Run in UI mode: `npm run test:e2e:ui`
- Use Playwright inspector to find selectors
- Verify element is visible: `--headed` flag

## Configuration

Custom base URL:
```bash
BASE_URL=http://your-server:5173 npm run test:e2e
```

Debug mode with verbose logging:
```bash
DEBUG=pw:api npm run test:e2e
```

## File Structure

```
compliance-ui/
├── e2e/
│   └── main.spec.ts           # Main test file
├── playwright.config.ts       # Playwright configuration
├── E2E_TESTING_GUIDE.md       # Full documentation
├── E2E_TESTING_QUICKREF.md    # This file
└── package.json               # Updated with test:e2e scripts
```

## Expected Behavior

### ✅ Successful Test Run
- All tests pass (green ✓)
- Page loads <5 seconds
- No console errors
- No flaky/timeout failures

### ⚠️ Expected Warnings
- Tests may show timing variations (1-2 tests flaky)
- PDF exports may be PDF mime type dependent
- Mobile tests may have different layout

### ❌ Common Failures
- Port 5173 not running
- Element selectors changed
- Network timeouts
- Backend API issues

## Next Steps

1. **Run full test suite:** `npm run test:e2e`
2. **Identify failures:** `npm run test:e2e:report`
3. **Debug specific test:** `npx playwright test -g "test name" --debug`
4. **Add to CI/CD:** Copy GitHub Actions example from E2E_TESTING_GUIDE.md
5. **Keep updated:** Maintain tests as UI changes

## Resources

- [Playwright Docs](https://playwright.dev)
- [GitHub Actions Integration](https://playwright.dev/docs/ci)
- [Inspector Tool](https://playwright.dev/docs/inspector)
- [Trace Viewer](https://trace.playwright.dev)

---

**Total Tests:** 27
**Est. Time:** 2-5 minutes (all browsers)
**Last Updated:** March 2026
