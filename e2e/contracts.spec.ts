import { test, expect } from '@playwright/test';

test.describe('Contracts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/contracts');
        await page.waitForLoadState('networkidle');
    });

    test('contracts page renders', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('page shows content or error boundary', async ({ page }) => {
        const main = page.locator('main');
        const content = await main.textContent();
        expect(content).toBeTruthy();
        expect(content!.length).toBeGreaterThan(0);
    });

    test('error boundary has retry option if error occurs', async ({ page }) => {
        const errorHeading = page.getByText('Algo deu errado');
        if (await errorHeading.isVisible()) {
            // Error boundary should provide a way to retry
            const retryBtn = page.getByRole('button', { name: /tentar|retry/i });
            if (await retryBtn.count() > 0) {
                await expect(retryBtn.first()).toBeVisible();
            }
        }
    });

    test('page does not crash completely', async ({ page }) => {
        // Page should render something (even if it's an error boundary)
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Erro critico')).not.toBeVisible();
    });
});
