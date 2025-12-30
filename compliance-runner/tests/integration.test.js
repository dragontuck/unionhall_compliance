const { parseArgs } = require('../src/utils');

// Mock modules
jest.mock('mssql');
jest.mock('../src/excel-export');

describe('CMP Run Integration', () => {
  describe('Command Line Interface', () => {
    test('validates required arguments for new run', () => {
      const args = parseArgs(['node', 'cmp-run.js']);
      
      expect(args.startDate).toBe(null);
      expect(args.mode).toBe(null);
      expect(args.runId).toBe(null);
    });

    test('parses complete new run arguments', () => {
      const args = parseArgs(['node', 'cmp-run.js', '--startDate', '2025-01-01', '--mode', '2To1', '--out', 'test.xlsx', '--dryRun']);
      
      expect(args.startDate).toBe('2025-01-01');
      expect(args.mode).toBe('2To1');
      expect(args.outFile).toBe('test.xlsx');
      expect(args.dryRun).toBe(true);
    });

    test('parses report regeneration arguments', () => {
      const args = parseArgs(['node', 'cmp-run.js', '--runId', '123', '--out', 'report.xlsx']);
      
      expect(args.runId).toBe(123);
      expect(args.outFile).toBe('report.xlsx');
    });
  });

  describe('Error Handling', () => {
    test('handles missing environment variables', () => {
      const originalEnv = process.env;
      process.env = {};
      
      const { dbConfigFromEnv } = require('../src/utils');
      
      expect(() => dbConfigFromEnv()).toThrow('Missing DB env vars');
      
      process.env = originalEnv;
    });

    test('handles invalid date format', () => {
      const { assertIsoDate } = require('../src/utils');
      
      expect(() => assertIsoDate('invalid-date')).toThrow('startDate must be YYYY-MM-DD');
    });

    test('handles invalid mode', () => {
      const { normalizeMode } = require('../src/utils');
      
      expect(() => normalizeMode('invalid')).toThrow('mode must be 2To1 or 3To1');
    });
  });
});