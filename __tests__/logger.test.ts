import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
    const originalEnv = process.env.NODE_ENV;
    let consoleSpy: { log: ReturnType<typeof vi.spyOn>; warn: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

    beforeEach(() => {
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        vi.restoreAllMocks();
    });

    it('logger.error always logs', async () => {
        process.env.NODE_ENV = 'production';
        vi.resetModules();
        const { logger } = await import('@/lib/logger');
        logger.error('test error');
        expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'test error');
    });

    it('logger.warn always logs', async () => {
        process.env.NODE_ENV = 'production';
        vi.resetModules();
        const { logger } = await import('@/lib/logger');
        logger.warn('test warn');
        expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'test warn');
    });

    it('logger.info logs in development', async () => {
        process.env.NODE_ENV = 'development';
        vi.resetModules();
        const { logger } = await import('@/lib/logger');
        logger.info('test info');
        expect(consoleSpy.log).toHaveBeenCalledWith('[INFO]', 'test info');
    });

    it('logger.info does NOT log in production', async () => {
        process.env.NODE_ENV = 'production';
        vi.resetModules();
        const { logger } = await import('@/lib/logger');
        logger.info('test info');
        expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('logger.debug logs in development', async () => {
        process.env.NODE_ENV = 'development';
        vi.resetModules();
        const { logger } = await import('@/lib/logger');
        logger.debug('test debug');
        expect(consoleSpy.log).toHaveBeenCalledWith('[DEBUG]', 'test debug');
    });

    it('logger.debug does NOT log in production', async () => {
        process.env.NODE_ENV = 'production';
        vi.resetModules();
        const { logger } = await import('@/lib/logger');
        logger.debug('test debug');
        expect(consoleSpy.log).not.toHaveBeenCalled();
    });
});
