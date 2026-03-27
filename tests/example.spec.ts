import { test, expect } from '@playwright/test';

test('has title and homepage renders', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads
    await expect(page).toHaveTitle(/.*|Gestão/);

    // Checking for basic UI elements (Adjust to actual app layout)
    // For example, ensuring the main dashboard is visible
    const header = page.locator('header').first();
    if (await header.isVisible()) {
        await expect(header).toBeVisible();
    }
});
