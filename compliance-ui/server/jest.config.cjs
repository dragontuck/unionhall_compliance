/**
 * Jest Configuration
 * Configured for ES modules and code coverage
 */

module.exports = {
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
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
        '^.+\\.js$': ['babel-jest', { useESM: true }],
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    modulePathIgnorePatterns: ['/dist/', '/node_modules/'],
};
