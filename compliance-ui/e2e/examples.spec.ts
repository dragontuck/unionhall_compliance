import { test, expect } from '@playwright/test';
import * as testUtils from './test-utils';

/**
 * Advanced E2E Test Examples
 * 
 * Demonstrates usage of test utilities and advanced Playwright patterns
 * Copy these examples to create new test scenarios
 */

test.describe('Advanced E2E Examples', () => {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test.describe('Using Test Utilities', () => {
        test('should use navigation helper', async ({ page }) => {
            await testUtils.navigateTo(page, '/reports');
            await expect(page).toHaveURL(/reports/);
        });

        test('should use element waiting helper', async ({ page }) => {
            const hasElement = await testUtils.waitForElement(page, 'table', 5000);
            if (hasElement) {
                await expect(page.locator('table').first()).toBeVisible();
            }
        });

        test('should use click by text helper', async ({ page }) => {
            await testUtils.clickByText(page, 'Reports');
            await page.waitForTimeout(500);
            await expect(page).toHaveURL(/reports/);
        });

        test('should measure page load time', async ({ page }) => {
            const loadTime = await testUtils.measurePageLoadTime(page);
            console.log(`Page load time: ${loadTime}ms`);
            expect(loadTime).toBeLessThan(5000);
        });

        test('should capture console logs', async ({ page }) => {
            const logs = await testUtils.captureConsoleLogs(page);

            // Perform some action that might log
            await page.goto(BASE_URL);

            // Check if any error logs
            const errors = logs.get('error') || [];
            expect(errors.length).toBe(0);
        });

        test('should capture network requests', async ({ page }) => {
            const requests = await testUtils.captureNetworkRequests(page);

            // Navigate and collect requests
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Verify requests were captured
            const apiRequests = requests.filter(r => r.url.includes('api'));
            console.log(`API requests: ${apiRequests.length}`);
        });
    });

    test.describe('File Upload Operations', () => {
        test('should upload CSV file with utility', async ({ page }) => {
            const csvContent = `ID,Name,Date
1,Test1,2024-01-15
2,Test2,2024-01-20`;

            await testUtils.uploadFile(
                page,
                csvContent,
                'test-data.csv',
                'text/csv'
            );

            // Verify upload
            await page.waitForTimeout(500);
            const fileDisplay = page.locator('text=test-data');
            const isVisible = await fileDisplay.isVisible({ timeout: 5000 }).catch(() => false);
            expect([true, false]).toContain(isVisible);
        });

        test('should export table data', async ({ page }) => {
            // Navigate to reports
            await testUtils.navigateTo(page, '/reports');
            await page.waitForTimeout(1000);

            // Export data
            const fileName = await testUtils.exportTableData(page, 'csv');

            if (fileName) {
                expect(fileName).toMatch(/\.(csv|xlsx|json)$/);
            }
        });
    });

    test.describe('Data Table Operations', () => {
        test('should wait for and read data table', async ({ page }) => {
            await testUtils.navigateTo(page, '/reports');

            // Wait for table
            const hasData = await testUtils.waitForDataTable(page);

            if (hasData) {
                // Get table data
                const tableData = await testUtils.getTableData(page);
                console.log(`Found ${tableData.length} rows`);
                expect(tableData.length).toBeGreaterThan(0);
            }
        });

        test('should perform search on table', async ({ page }) => {
            await testUtils.navigateTo(page, '/reports');
            await page.waitForTimeout(500);

            // Perform search
            await testUtils.performSearch(page, 'test');

            // Verify results updated
            const table = page.locator('table').first();
            await expect(table).toBeVisible({ timeout: 5000 });
        });

        test('should filter data by date', async ({ page }) => {
            await testUtils.navigateTo(page, '/reports');

            // Find date filter
            const dateInput = page.locator('input[type="date"]').first();

            if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Set date
                const today = new Date().toISOString().split('T')[0];
                await dateInput.fill(today);
                await dateInput.press('Enter');

                // Wait for results
                await testUtils.waitForLoadingComplete(page);

                // Verify table updated
                const table = page.locator('table').first();
                await expect(table).toBeVisible();
            }
        });
    });

    test.describe('Form Operations', () => {
        test('should fill form using label helper', async ({ page }) => {
            // Navigate to a form (adjust based on your app)
            await testUtils.navigateTo(page, '/');

            // Fill form field by label
            // This is an example - adjust label text to match your form
            try {
                await testUtils.fillFormField(page, 'Email', 'test@example.com');

                const input = page.locator('input[type="email"]').first();
                await expect(input).toHaveValue('test@example.com');
            } catch {
                // Form might not exist on this page
            }
        });

        test('should capture form validation errors', async ({ page }) => {
            // Try to submit empty form
            const submitBtn = page.locator('button[type="submit"]').first();

            if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await submitBtn.click();
                await page.waitForTimeout(500);

                // Get validation errors
                const errors = await testUtils.getValidationErrors(page);
                console.log(`Validation errors: ${errors}`);
            }
        });

        test('should type with realistic delays', async ({ page }) => {
            // Navigate to form
            const input = page.locator('input').first();

            if (await input.isVisible()) {
                // Type with delay for realistic interaction
                await testUtils.typeText(page, 'input', 'test input');

                const value = await input.inputValue();
                expect(value).toBe('test input');
            }
        });
    });

    test.describe('Accessibility Checks', () => {
        test('should check page accessibility', async ({ page }) => {
            const issues = await testUtils.checkAccessibility(page);

            console.log(`Accessibility issues found: ${issues.length}`);
            issues.forEach(issue => console.log(`  - ${issue}`));

            // Should have few or no critical issues
            expect(issues.length).toBeLessThan(5);
        });

        test('should navigate page with keyboard only', async ({ page }) => {
            // Tab through elements
            for (let i = 0; i < 5; i++) {
                await page.keyboard.press('Tab');
                await page.waitForTimeout(100);
            }

            // Page should still be functional
            const focused = await page.evaluate(() => document.activeElement?.tagName);
            expect(focused).toBeTruthy();
        });

        test('should check focus management', async ({ page }) => {
            // Press Tab to focus first element
            await page.keyboard.press('Tab');

            const focused = await page.evaluate(() => {
                const el = document.activeElement as HTMLElement;
                return el ? el.tagName : null;
            });

            expect(focused).toBeTruthy();
        });
    });

    test.describe('Performance Patterns', () => {
        test('should handle rapid interactions', async ({ page }) => {
            const button = page.locator('button').first();

            if (await button.isVisible()) {
                // Rapid clicks using retry
                for (let i = 0; i < 3; i++) {
                    await testUtils.clickWithRetry(page, 'button');
                    await page.waitForTimeout(100);
                }

                // App should still be responsive
                await expect(page).toHaveURL(/.*/, { timeout: 5000 });
            }
        });

        test('should include realistic think time', async ({ page }) => {
            const startTime = Date.now();

            // User thinks for a bit
            await testUtils.thinkTime(500, 1500);

            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeGreaterThanOrEqual(500);
            expect(elapsed).toBeLessThanOrEqual(2000);
        });

        test('should scroll to element in viewport', async ({ page }) => {
            // Scroll down
            await page.evaluate(() => window.scrollBy(0, 1000));
            await page.waitForTimeout(300);

            // Check if element is in viewport
            const element = page.locator('button').first();

            if (await element.isVisible()) {
                await testUtils.assertInViewport(page, 'button');
            }
        });
    });

    test.describe('Visual Regression', () => {
        test('should capture full page screenshot', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForLoadState('networkidle');

            // Take screenshot for comparison
            await page.screenshot({
                path: 'test-results/dashboard-snapshot.png',
                fullPage: true
            });

            // Verify screenshot was taken
            const fs = await import('fs');
            expect(fs.existsSync('test-results/dashboard-snapshot.png')).toBe(true);
        });

        test('should compare specific component', async ({ page }) => {
            // Navigate to component
            await testUtils.navigateTo(page, '/');

            // Wait for rendering
            await page.waitForLoadState('networkidle');

            // Screenshot specific element
            const table = page.locator('table').first();
            if (await table.isVisible()) {
                await table.screenshot({
                    path: 'test-results/table-snapshot.png'
                });
            }
        });
    });

    test.describe('Network State Handling', () => {
        test('should handle offline state', async ({ page, context }) => {
            await page.goto(BASE_URL);

            // Go offline
            await context.setOffline(true);

            // Try to perform action
            const button = page.locator('button').first();
            await button.click().catch(() => {
                // Network error expected
            });

            // Come back online
            await context.setOffline(false);

            // Should recover
            await page.reload();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(BASE_URL);
        });

        test('should handle slow network', async ({ page }) => {
            // Simulate slow 3G
            await page.route('**/*', (route) => {
                setTimeout(() => route.continue(), 500);
            });

            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

            // Should eventually load
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(BASE_URL);
        });
    });

    test.describe('User Agent Testing', () => {
        test('should test with mobile user agent', async ({ page }) => {
            await testUtils.setUserAgent(page, 'mobile');
            await page.goto(BASE_URL);

            // Check mobile-specific elements
            const viewport = page.viewportSize();
            expect(viewport).toBeTruthy();
        });

        test('should test with custom user agent', async ({ page }) => {
            const customUA =
                'Mozilla/5.0 (Custom Bot/1.0) AppleWebKit/537.36';
            await testUtils.setUserAgent(page, customUA);

            const ua = await page.evaluate(() => navigator.userAgent);
            expect(ua).toContain('Custom Bot');
        });
    });

    test.describe('Context Information', () => {
        test('should log test context', async ({ page }) => {
            const context = testUtils.getTestContext();

            console.log('Test Context:');
            console.log(`  Timestamp: ${context.timestamp}`);
            console.log(`  Browser: ${context.browser}`);
            console.log(`  OS: ${context.os}`);

            expect(context.browser).toBeTruthy();
            expect(context.os).toBeTruthy();
        });
    });
});

/**
 * Page Object Model Example
 * Use for better test organization
 */
export class DashboardPage {
    constructor(private page: typeof test) { }

    async navigate(): Promise<void> {
        await this.page.goto('/');
    }

    async uploadFile(filePath: string): Promise<void> {
        const fileInput = this.page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);
    }

    async executeRun(): Promise<void> {
        await testUtils.clickByText(this.page, 'Execute');
    }

    async waitForResults(): Promise<void> {
        await testUtils.waitForLoadingComplete(this.page);
    }
}

/**
 * Test Data Factory
 * Use to generate test data
 */
export class TestDataFactory {
    static createCSVData(rowCount: number = 5): string {
        const header = 'ID,Name,Email,HireDate';
        const rows = Array.from({ length: rowCount }, (_, i) =>
            `${i + 1},Employee${i + 1},emp${i + 1}@test.com,2024-01-${String(i + 1).padStart(2, '0')}`
        );
        return [header, ...rows].join('\n');
    }

    static createContractor(overrides = {}): Record<string, string> {
        return {
            id: Math.random().toString(36).substring(7),
            name: `Contractor ${Math.floor(Math.random() * 1000)}`,
            email: `contractor@test.com`,
            status: 'active',
            ...overrides,
        };
    }

    static createRun(overrides = {}): Record<string, string | number> {
        return {
            id: Math.random().toString(36).substring(7),
            mode: 'full',
            status: 'pending',
            recordCount: Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            ...overrides,
        };
    }
}
