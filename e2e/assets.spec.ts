import { test, expect } from '@playwright/test';

test.describe('Assets / Properties', () => {
    test('assets page loads without errors', async ({ page }) => {
        await page.goto('/assets');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Algo deu errado')).not.toBeVisible();
    });

    test('properties page loads', async ({ page }) => {
        await page.goto('/properties');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('asset values page loads', async ({ page }) => {
        await page.goto('/assets/values');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('new asset page loads', async ({ page }) => {
        await page.goto('/assets/new');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('IRPF import page loads', async ({ page }) => {
        await page.goto('/assets/import');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('holdings page loads', async ({ page }) => {
        await page.goto('/holdings');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });
});
