import { test, expect } from '@playwright/test';

test.describe('Tenants', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tenants');
        await page.waitForLoadState('networkidle');
    });

    test('tenants page renders', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('page shows content or error boundary', async ({ page }) => {
        const main = page.locator('main');
        const content = await main.textContent();
        expect(content).toBeTruthy();
    });

    test('page does not crash completely', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Erro critico')).not.toBeVisible();
    });
});
