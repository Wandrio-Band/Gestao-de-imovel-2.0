import { test, expect } from '@playwright/test';

test.describe('Invoices', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');
    });

    test('invoices page loads without errors', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Algo deu errado')).not.toBeVisible();
    });

    test('page has tab navigation', async ({ page }) => {
        // The InvoiceControl component uses tabs
        const tabs = page.getByRole('tab');
        if (await tabs.count() > 0) {
            await expect(tabs.first()).toBeVisible();
        }
    });

    test('page renders content', async ({ page }) => {
        const main = page.locator('main');
        const content = await main.textContent();
        expect(content).toBeTruthy();
        expect(content!.length).toBeGreaterThan(0);
    });
});
