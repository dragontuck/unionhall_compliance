import { Page, expect } from '@playwright/test';

/**
 * Shared E2E Test Utilities
 * 
 * Common helper functions for Playwright tests
 */

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
    const url = new URL(path, page.url()).toString();
    await page.goto(url, { waitUntil: 'networkidle' });
}

/**
 * Wait for an element and return it
 */
export async function waitForElement(
    page: Page,
    selector: string,
    timeout = 5000
): Promise<boolean> {
    try {
        await page.locator(selector).waitFor({ timeout });
        return true;
    } catch {
        return false;
    }
}

/**
 * Click an element by text
 */
export async function clickByText(page: Page, text: string): Promise<void> {
    await page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first().click();
}

/**
 * Fill a form field by label
 */
export async function fillFormField(
    page: Page,
    labelText: string,
    value: string
): Promise<void> {
    const label = page.locator(`label:has-text("${labelText}")`);
    const inputLocator = label.locator('.. input, .. textarea, .. select').first();
    await inputLocator.fill(value);
}

/**
 * Get form validation error messages
 */
export async function getValidationErrors(page: Page): Promise<string[]> {
    const errors = await page
        .locator('[role="alert"], .error-message, .validation-error')
        .allTextContents();
    return errors;
}

/**
 * Upload a file from content
 */
export async function uploadFile(
    page: Page,
    content: string,
    fileName: string,
    mimeType: string
): Promise<void> {
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
        name: fileName,
        mimeType,
        buffer: Buffer.from(content),
    });
}

/**
 * Wait for data table to be populated
 */
export async function waitForDataTable(page: Page, timeout = 5000): Promise<boolean> {
    try {
        const rows = page.locator('table tbody tr, [role="row"]');
        await rows.first().waitFor({ timeout });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get all table rows as data
 */
export async function getTableData(
    page: Page
): Promise<Record<string, string>[]> {
    const rows = await page.locator('table tbody tr, [role="row"]').all();
    const data: Record<string, string>[] = [];

    for (const row of rows) {
        const cells = await row.locator('td, [role="cell"]').allTextContents();
        if (cells.length > 0) {
            data.push({
                raw: cells.join(' | '),
                ...cells.reduce(
                    (acc, cell, idx) => {
                        acc[`col_${idx}`] = cell;
                        return acc;
                    },
                    {} as Record<string, string>
                ),
            });
        }
    }

    return data;
}

/**
 * Check if API response is successful
 */
export async function expectSuccessResponse(page: Page): Promise<boolean> {
    const successMessages = [
        'Success',
        'Saved',
        'Completed',
        'Created',
        'Deleted',
        'Updated',
    ];

    for (const message of successMessages) {
        const isVisible = await page
            .locator(`text="${message}"`)
            .isVisible()
            .catch(() => false);
        if (isVisible) {
            return true;
        }
    }

    return false;
}

/**
 * Wait for loading indicator to disappear
 */
export async function waitForLoadingComplete(page: Page, timeout = 10000): Promise<void> {
    const loaderSelectors = [
        '[role="progressbar"]',
        '.spinner',
        '.loading',
        '[data-testid="loading"]',
        '.skeleton',
    ];

    for (const selector of loaderSelectors) {
        const loader = page.locator(selector).first();
        const isVisible = await loader.isVisible({ timeout: 1000 }).catch(() => false);

        if (isVisible) {
            await loader.waitFor({ state: 'hidden', timeout });
            break;
        }
    }
}

/**
 * Perform a search/filter operation
 */
export async function performSearch(
    page: Page,
    searchTerm: string,
    searchSelector = 'input[type="search"], input[placeholder*="search" i]'
): Promise<void> {
    const searchInput = page.locator(searchSelector).first();
    await searchInput.fill(searchTerm);
    await searchInput.press('Enter');
    await waitForLoadingComplete(page);
}

/**
 * Export table data
 */
export async function exportTableData(
    page: Page,
    format: 'csv' | 'xlsx' | 'json' = 'csv'
): Promise<string | null> {
    const exportButton = page
        .locator(`button:has-text("Export"), button:has-text("Download")`)
        .first();

    if (!(await exportButton.isVisible({ timeout: 5000 }).catch(() => false))) {
        return null;
    }

    // Monitor download
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    try {
        const download = await downloadPromise;
        return download.suggestedFilename;
    } catch {
        return null;
    }
}

/**
 * Check page accessibility
 */
export async function checkAccessibility(page: Page): Promise<string[]> {
    // Check for common accessibility issues
    const issues: string[] = [];

    // Check for images without alt text
    const imgsWithoutAlt = await page
        .locator('img:not([alt])')
        .count();
    if (imgsWithoutAlt > 0) {
        issues.push(`Found ${imgsWithoutAlt} images without alt text`);
    }

    // Check for form inputs without labels
    const inputsWithoutLabels = await page
        .locator('input:not([aria-label]):not([id])')
        .count();
    if (inputsWithoutLabels > 0) {
        issues.push(`Found ${inputsWithoutLabels} inputs without labels`);
    }

    // Check for interactive elements with keyboard access
    const buttons = await page.locator('button, a[href], [role="button"]').all();
    let keyboardAccessIssues = 0;

    for (const button of buttons) {
        const isVisible = await button.isVisible();
        if (isVisible) {
            const tabindex = await button.getAttribute('tabindex');
            if (tabindex === '-1') {
                keyboardAccessIssues++;
            }
        }
    }

    if (keyboardAccessIssues > 0) {
        issues.push(`Found ${keyboardAccessIssues} elements not keyboard accessible`);
    }

    return issues;
}

/**
 * Performance measurement
 */
export async function measurePageLoadTime(page: Page): Promise<number> {
    const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return timing ? timing.loadEventEnd - timing.fetchStart : 0;
    });

    return navigationTiming;
}

/**
 * Get all console messages
 */
export async function captureConsoleLogs(page: Page): Promise<Map<string, string[]>> {
    const logs = new Map<string, string[]>();

    page.on('console', (msg) => {
        const type = msg.type();
        if (!logs.has(type)) {
            logs.set(type, []);
        }
        logs.get(type)!.push(msg.text());
    });

    return logs;
}

/**
 * Intercept and log network requests
 */
export async function captureNetworkRequests(
    page: Page
): Promise<{ method: string; url: string; status: number }[]> {
    const requests: { method: string; url: string; status: number }[] = [];

    page.on('response', (response) => {
        requests.push({
            method: response.request().method(),
            url: response.request().url(),
            status: response.status(),
        });
    });

    return requests;
}

/**
 * Click with retry
 */
export async function clickWithRetry(
    page: Page,
    selector: string,
    maxRetries = 3
): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const element = page.locator(selector).first();
            await element.click();
            return;
        } catch (error) {
            lastError = error as Error;
            await page.waitForTimeout(500);
        }
    }

    throw lastError;
}

/**
 * Fill with artificial typing delay (more realistic)
 */
export async function typeText(page: Page, selector: string, text: string): Promise<void> {
    const input = page.locator(selector).first();
    await input.focus();

    for (const char of text) {
        await input.type(char, { delay: 50 });
    }
}

/**
 * Assert element is in viewport
 */
export async function assertInViewport(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector).first();
    const inViewport = await element.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    });

    expect(inViewport).toBe(true);
}

/**
 * Compare visual appearance (screenshot)
 */
export async function compareScreenshot(
    page: Page,
    screenshotName: string
): Promise<void> {
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(screenshotName);
}

/**
 * Get test context info
 */
export function getTestContext(): {
    timestamp: string;
    browser: string;
    os: string;
} {
    return {
        timestamp: new Date().toISOString(),
        browser: process.env.PLAYWRIGHT_TEST_PROJECT || 'unknown',
        os: process.platform,
    };
}

/**
 * Create realistic delay (think time)
 */
export async function thinkTime(minMs = 500, maxMs = 2000): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Handle browser security dialogs
 */
export async function handleSecurityDialog(page: Page): Promise<void> {
    page.once('dialog', async (dialog) => {
        console.log(`Dialog type: ${dialog.type()}, message: ${dialog.message()}`);
        await dialog.accept();
    });
}

/**
 * Set custom user agent
 */
export async function setUserAgent(
    page: Page,
    userAgent:
        | 'mobile'
        | 'tablet'
        | 'desktop'
        | string = 'desktop'
): Promise<void> {
    const agents: Record<string, string> = {
        mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        tablet: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        desktop:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    };

    const ua = agents[userAgent] || userAgent;
    await page.setUserAgent(ua);
}
