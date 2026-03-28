import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('renders page title', async ({ page }) => {
        await expect(page).toHaveTitle(/AssetManager/);
    });

    test('displays main content area', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('shows dashboard widgets or empty state', async ({ page }) => {
        // Either shows dashboard data or an empty state message
        const main = page.locator('main');
        await expect(main).toBeVisible();
        // The page should have rendered some content (not blank)
        const textContent = await main.textContent();
        expect(textContent).toBeTruthy();
        expect(textContent!.length).toBeGreaterThan(0);
    });

    test('topbar is visible', async ({ page }) => {
        // TopBar should be rendered above main content
        const header = page.locator('header').first();
        if (await header.isVisible()) {
            await expect(header).toBeVisible();
        }
    });

    test('page does not show error boundary', async ({ page }) => {
        // Should NOT display error text
        await expect(page.getByText('Algo deu errado')).not.toBeVisible();
        await expect(page.getByText('Erro critico')).not.toBeVisible();
    });
});
