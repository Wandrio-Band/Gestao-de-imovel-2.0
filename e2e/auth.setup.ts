import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ request, context }) => {
    // Call the dev-only test session endpoint
    const response = await request.post('/api/auth/test-session');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Save the authenticated state (cookies) for reuse in all tests
    await context.storageState({ path: authFile });
});
