import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        testTimeout: 10000,
        environment: 'node',
        include: ['__tests__/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/lib/**', 'src/utils/**', 'src/app/actions/**', 'src/app/api/**'],
            thresholds: {
                statements: 40,
                branches: 30,
                functions: 35,
                lines: 40,
            },
        },
        setupFiles: ['__tests__/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
