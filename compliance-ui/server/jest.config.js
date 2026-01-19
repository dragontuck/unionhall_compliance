/**
 * Jest Configuration
 * Configured for ES modules and code coverage
 */

export default {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/config/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    testPathIgnorePatterns: ['/node_modules/'],
};
