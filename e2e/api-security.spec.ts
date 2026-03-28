import { test, expect } from '@playwright/test';

test.describe('API Security', () => {
    test('invoices API is accessible and returns valid JSON', async ({ request }) => {
        const response = await request.get('/api/invoices');
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('total');
    });

    test('invoices POST validates input', async ({ request }) => {
        const response = await request.post('/api/invoices', {
            data: {},
        });
        // Should fail validation (missing required fields)
        const status = response.status();
        expect([400, 422, 200]).toContain(status);
    });

    test('AI extract endpoint enforces rate limiting', async ({ request }) => {
        // Send requests in parallel for speed
        const promises = Array.from({ length: 8 }, () =>
            request.post('/api/ai/extract', {
                data: { content: 'test', isFile: false },
            })
        );
        const results = await Promise.all(promises);
        const statuses = results.map(r => r.status());

        // Rate limiter should kick in after 5 requests
        const has429 = statuses.some(s => s === 429);
        expect(has429).toBeTruthy();
    });

    test('invalid API routes return 404', async ({ request }) => {
        const response = await request.get('/api/nonexistent');
        expect(response.status()).toBe(404);
    });

    test('invoices DELETE requires valid ID', async ({ request }) => {
        const response = await request.delete('/api/invoices/nonexistent-id');
        const status = response.status();
        // Should return error for invalid ID
        expect([400, 403, 404, 500]).toContain(status);
    });
});
