const { parseArgs, assertIsoDate, normalizeMode, dbConfigFromEnv } = require('../src/utils');

describe('Utils', () => {
  describe('parseArgs', () => {
    test('parses basic arguments', () => {
      const argv = ['node', 'script.js', '--startDate', '2025-01-01', '--mode', '2To1'];
      const result = parseArgs(argv);
      
      expect(result.startDate).toBe('2025-01-01');
      expect(result.mode).toBe('2To1');
      expect(result.dryRun).toBe(false);
      expect(result.outFile).toBe(null);
    });

    test('parses arguments with equals syntax', () => {
      const argv = ['node', 'script.js', '--startDate=2025-01-01', '--mode=3To1', '--out=test.xlsx'];
      const result = parseArgs(argv);
      
      expect(result.startDate).toBe('2025-01-01');
      expect(result.mode).toBe('3To1');
      expect(result.outFile).toBe('test.xlsx');
    });

    test('parses dry run flag', () => {
      const argv = ['node', 'script.js', '--dryRun', '--startDate', '2025-01-01', '--mode', '2To1'];
      const result = parseArgs(argv);
      
      expect(result.dryRun).toBe(true);
    });

    test('returns defaults for missing arguments', () => {
      const argv = ['node', 'script.js'];
      const result = parseArgs(argv);
      
      expect(result.startDate).toBe(null);
      expect(result.mode).toBe(null);
      expect(result.outFile).toBe(null);
      expect(result.dryRun).toBe(false);
      expect(result.runId).toBe(null);
    });
  });

  describe('assertIsoDate', () => {
    test('accepts valid ISO dates', () => {
      expect(() => assertIsoDate('2025-01-01')).not.toThrow();
      expect(() => assertIsoDate('2025-12-31')).not.toThrow();
    });

    test('rejects invalid date formats', () => {
      expect(() => assertIsoDate('2025-1-1')).toThrow('startDate must be YYYY-MM-DD');
      expect(() => assertIsoDate('25-01-01')).toThrow('startDate must be YYYY-MM-DD');
      expect(() => assertIsoDate('2025/01/01')).toThrow('startDate must be YYYY-MM-DD');
      expect(() => assertIsoDate('invalid')).toThrow('startDate must be YYYY-MM-DD');
    });
  });

  describe('normalizeMode', () => {
    test('normalizes valid modes', () => {
      expect(normalizeMode('2To1')).toBe('2To1');
      expect(normalizeMode('3To1')).toBe('3To1');
      expect(normalizeMode('2to1')).toBe('2To1');
      expect(normalizeMode('3to1')).toBe('3To1');
      expect(normalizeMode('2TO1')).toBe('2To1');
      expect(normalizeMode('3TO1')).toBe('3To1');
    });

    test('handles shorthand modes', () => {
      expect(normalizeMode('2')).toBe('2To1');
      expect(normalizeMode('3')).toBe('3To1');
    });

    test('rejects invalid modes', () => {
      expect(() => normalizeMode('')).toThrow('mode is required');
      expect(() => normalizeMode(null)).toThrow('mode is required');
      expect(() => normalizeMode('4To1')).toThrow('mode must be 2To1 or 3To1');
      expect(() => normalizeMode('invalid')).toThrow('mode must be 2To1 or 3To1');
    });

    test('handles whitespace in mode input', () => {
      expect(normalizeMode('  2To1  ')).toBe('2To1');
      expect(normalizeMode('\t3To1\n')).toBe('3To1');
    });

    test('rejects empty string after trim', () => {
      expect(() => normalizeMode('   ')).toThrow('mode is required');
    });
  });

  describe('dbConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('creates config from required env vars', () => {
      process.env.CMP_DB_SERVER = 'localhost';
      process.env.CMP_DB_DATABASE = 'testdb';
      process.env.CMP_DB_USER = 'testuser';
      process.env.CMP_DB_PASSWORD = 'testpass';

      const config = dbConfigFromEnv();

      expect(config.server).toBe('localhost');
      expect(config.database).toBe('testdb');
      expect(config.user).toBe('testuser');
      expect(config.password).toBe('testpass');
      expect(config.options.encrypt).toBe(true);
      expect(config.options.trustServerCertificate).toBe(false);
    });

    test('includes optional env vars when provided', () => {
      process.env.CMP_DB_SERVER = 'localhost';
      process.env.CMP_DB_DATABASE = 'testdb';
      process.env.CMP_DB_USER = 'testuser';
      process.env.CMP_DB_PASSWORD = 'testpass';
      process.env.CMP_DB_PORT = '1433';
      process.env.CMP_DB_ENCRYPT = 'false';
      process.env.CMP_DB_TRUST_CERT = 'true';

      const config = dbConfigFromEnv();

      expect(config.port).toBe(1433);
      expect(config.options.encrypt).toBe(false);
      expect(config.options.trustServerCertificate).toBe(true);
    });

    test('throws error for missing required env vars', () => {
      delete process.env.CMP_DB_SERVER;
      delete process.env.CMP_DB_DATABASE;
      delete process.env.CMP_DB_USER;
      delete process.env.CMP_DB_PASSWORD;

      expect(() => dbConfigFromEnv()).toThrow('Missing DB env vars');
    });

    test('throws error for partially missing env vars', () => {
      process.env.CMP_DB_SERVER = 'localhost';
      process.env.CMP_DB_DATABASE = 'testdb';
      // Missing user and password

      expect(() => dbConfigFromEnv()).toThrow('Missing DB env vars');
    });
  });
});
    test('parses runId argument', () => {
      const argv = ['node', 'script.js', '--runId', '123'];
      const result = parseArgs(argv);
      
      expect(result.runId).toBe(123);
    });

    test('parses runId with equals syntax', () => {
      const argv = ['node', 'script.js', '--runId=456'];
      const result = parseArgs(argv);
      
      expect(result.runId).toBe(456);
    });