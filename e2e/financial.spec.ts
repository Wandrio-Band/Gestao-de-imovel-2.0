import { test, expect } from '@playwright/test';

test.describe('Financial', () => {
    test('financial overview loads', async ({ page }) => {
        await page.goto('/financial');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Algo deu errado')).not.toBeVisible();
    });

    test('financial schedule loads', async ({ page }) => {
        await page.goto('/financial/schedule');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('debt management loads', async ({ page }) => {
        await page.goto('/financial/debt');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('consolidated statement loads', async ({ page }) => {
        await page.goto('/financial/consolidated');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });
});
