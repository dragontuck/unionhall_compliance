const { addSheetFromRows, generateExcelReport } = require('../src/excel-export');
const ExcelJS = require('exceljs');

// Mock ExcelJS
jest.mock('exceljs');

describe('Excel Export', () => {
  describe('addSheetFromRows', () => {
    let mockWorkbook, mockWorksheet, mockRow;

    beforeEach(() => {
      mockRow = {
        font: {}
      };
      mockWorksheet = {
        addRow: jest.fn(),
        eachRow: jest.fn(),
        getRow: jest.fn(() => mockRow),
        columns: [],
        views: []
      };
      mockWorkbook = {
        addWorksheet: jest.fn(() => mockWorksheet)
      };
    });

    test('creates worksheet with empty rows', async () => {
      await addSheetFromRows(mockWorkbook, 'test', []);
      
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('test');
      expect(mockWorksheet.columns).toEqual([]);
    });

    test('creates worksheet with data rows', async () => {
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      
      mockWorksheet.eachRow.mockImplementation((options, callback) => {
        callback({ getCell: () => ({ value: 'test' }) }, 2);
      });

      await addSheetFromRows(mockWorkbook, 'test', rows);
      
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('test');
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(2);
      expect(mockWorksheet.columns).toHaveLength(2);
      expect(mockWorksheet.views).toEqual([{ state: 'frozen', ySplit: 1 }]);
      expect(mockRow.font).toEqual({ bold: true });
    });

    test('handles null and undefined values', async () => {
      const rows = [{ name: null, age: undefined, city: 'NYC' }];
      
      mockWorksheet.eachRow.mockImplementation((options, callback) => {
        callback({ getCell: (key) => ({ value: key === 'name' ? null : key === 'age' ? undefined : 'NYC' }) }, 2);
      });

      await addSheetFromRows(mockWorkbook, 'test', rows);
      
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(rows[0]);
    });
  });

  describe('generateExcelReport', () => {
    let mockPool, mockRequest, mockWorkbook;

    beforeEach(() => {
      mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn()
      };
      mockPool = {
        request: jest.fn(() => mockRequest)
      };
      mockWorkbook = {
        creator: '',
        created: null,
        xlsx: {
          writeFile: jest.fn()
        }
      };
      ExcelJS.Workbook.mockImplementation(() => mockWorkbook);
    });

    test('generates excel report successfully', async () => {
      const runId = 123;
      const outFile = 'test.xlsx';
      
      // Mock database responses
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ StartDate: '2025-01-01', ModeId: 1, Run: 1, mode_name: '2To1' }] })
        .mockResolvedValueOnce({ recordset: [{ id: 123, StartDate: '2025-01-01', ModeId: 1 }] })
        .mockResolvedValueOnce({ recordset: [] })
        .mockResolvedValueOnce({ recordset: [] })
        .mockResolvedValueOnce({ recordset: [] })
        .mockResolvedValueOnce({ recordset: [] });

      const result = await generateExcelReport(mockPool, runId, outFile);
      
      expect(mockPool.request).toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeFile).toHaveBeenCalledWith(outFile);
      expect(result.outFile).toBe(outFile);
      expect(result.runInfo).toBeDefined();
    });

    test('handles database query errors', async () => {
      const runId = 123;
      const outFile = 'test.xlsx';
      
      mockRequest.query.mockRejectedValue(new Error('Database error'));
      
      await expect(generateExcelReport(mockPool, runId, outFile)).rejects.toThrow('Database error');
    });
  });
});