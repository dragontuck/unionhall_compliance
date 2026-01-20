import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        exclude: ['node_modules', 'dist', 'server', '**/*.node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                'server/',
                'src/setupTests.ts',
                'src/main.tsx',
                '**/*.d.ts',
            ],
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
        },
        silent: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
