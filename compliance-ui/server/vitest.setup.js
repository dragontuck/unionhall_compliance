/**
 * vitest.setup.js - Global test setup and mocks
 * Handles problematic transitive dependencies
 */

import { vi } from 'vitest';

// Mock problematic transitive dependencies that have broken package.json entries
vi.mock('iconv-lite', () => ({
    decode: (buffer, encoding) => buffer.toString(),
    encode: (str, encoding) => Buffer.from(str),
    getCodec: () => ({
        decode: (buffer) => buffer.toString(),
        encode: (str) => Buffer.from(str),
    }),
}), { virtual: true });

vi.mock('js-md4', () => ({
    md4: (str) => str,
}), { virtual: true });
