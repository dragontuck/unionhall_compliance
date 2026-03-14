import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'json-summary', 'html'],
            include: ['src/**/*.js'],
            exclude: [
                'src/index.js',
                'src/config/**',
                'node_modules/',
                'dist/',
            ],
            all: true,
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
        },
        include: ['src/**/*.test.js', 'src/**/__tests__/**/*.js'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
});
