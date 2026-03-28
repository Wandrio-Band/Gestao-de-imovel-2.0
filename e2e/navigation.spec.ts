import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test('sidebar is visible', async ({ page }) => {
        await page.goto('/dashboard');
        // Sidebar should contain navigation elements
        const sidebar = page.locator('nav').first();
        await expect(sidebar).toBeVisible();
    });

    test('dashboard page loads', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveTitle(/AssetManager/);
        // Should have main content area
        await expect(page.locator('main')).toBeVisible();
    });

    test('navigates to assets page', async ({ page }) => {
        await page.goto('/assets');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('navigates to contracts page', async ({ page }) => {
        await page.goto('/contracts');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('navigates to tenants page', async ({ page }) => {
        await page.goto('/tenants');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('navigates to financial page', async ({ page }) => {
        await page.goto('/financial');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('navigates to invoices page', async ({ page }) => {
        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('navigates to system audit page', async ({ page }) => {
        await page.goto('/system-audit');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });
});
