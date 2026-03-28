import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to reset the module state between tests
let rateLimit: (key: string, maxRequests?: number, windowMs?: number) => boolean;

describe('rateLimit', () => {
    beforeEach(async () => {
        vi.resetModules();
        // Clear timers from setInterval in rate-limit module
        vi.useFakeTimers();
        const mod = await import('@/lib/rate-limit');
        rateLimit = mod.rateLimit;
    });

    it('allows first request', () => {
        expect(rateLimit('test-key')).toBe(true);
    });

    it('allows requests up to maxRequests', () => {
        for (let i = 0; i < 20; i++) {
            expect(rateLimit('test-max', 20)).toBe(true);
        }
    });

    it('blocks request after maxRequests exceeded', () => {
        for (let i = 0; i < 5; i++) {
            rateLimit('test-block', 5);
        }
        expect(rateLimit('test-block', 5)).toBe(false);
    });

    it('uses separate limits per key', () => {
        for (let i = 0; i < 5; i++) {
            rateLimit('key-a', 5);
        }
        expect(rateLimit('key-a', 5)).toBe(false);
        expect(rateLimit('key-b', 5)).toBe(true);
    });

    it('resets after window expires', () => {
        for (let i = 0; i < 3; i++) {
            rateLimit('test-reset', 3, 1000);
        }
        expect(rateLimit('test-reset', 3, 1000)).toBe(false);

        // Advance past window
        vi.advanceTimersByTime(1001);
        expect(rateLimit('test-reset', 3, 1000)).toBe(true);
    });

    it('defaults to 20 requests per 60s', () => {
        for (let i = 0; i < 20; i++) {
            expect(rateLimit('test-default')).toBe(true);
        }
        expect(rateLimit('test-default')).toBe(false);
    });
});
