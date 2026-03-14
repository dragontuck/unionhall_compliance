// Mock for js-md4 module
export function md4(str) {
    // Simple mock implementation - not cryptographically secure,
    // just for testing purposes
    return 'd41d8cd98f00b204e9800998ecf8427e'; // Empty string MD4 hash as default
}

export default {
    md4,
};
