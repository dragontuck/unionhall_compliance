const { statusToCode, codeToStatus, applyHire, createComplianceState } = require('../src/compliance-engine');

describe('Compliance Engine', () => {
  describe('statusToCode', () => {
    test('converts compliant status to C', () => {
      expect(statusToCode('Compliant')).toBe('C');
      expect(statusToCode('compliant')).toBe('C');
      expect(statusToCode('COMPLIANT')).toBe('C');
      expect(statusToCode('')).toBe('C');
      expect(statusToCode(null)).toBe('C');
      expect(statusToCode(undefined)).toBe('C');
    });

    test('converts noncompliant status to N', () => {
      expect(statusToCode('Noncompliant')).toBe('N');
      expect(statusToCode('noncompliant')).toBe('N');
      expect(statusToCode('NONCOMPLIANT')).toBe('N');
      expect(statusToCode('non-compliant')).toBe('N');
    });
  });

  describe('codeToStatus', () => {
    test('converts codes to status strings', () => {
      expect(codeToStatus('C')).toBe('Compliant');
      expect(codeToStatus('N')).toBe('Noncompliant');
    });
  });

  describe('applyHire', () => {
    test('handles dispatch hire when compliant', () => {
      const state = { compliance: 'C', dispatchNeeded: 0, directCount: 1, nextHireDispatch: 'N' };
      const result = applyHire(state, 'dispatch', 2);
      
      expect(result.compliance).toBe('C');
      expect(result.dispatchNeeded).toBe(0);
      expect(result.directCount).toBe(0);
      expect(result.nextHireDispatch).toBe('N');
    });

    test('handles dispatch hire when noncompliant with 1 dispatch needed', () => {
      const state = { compliance: 'N', dispatchNeeded: 1, directCount: 3, nextHireDispatch: 'Y' };
      const result = applyHire(state, 'dispatch', 2);
      
      expect(result.compliance).toBe('C');
      expect(result.dispatchNeeded).toBe(0);
      expect(result.directCount).toBe(0);
      expect(result.nextHireDispatch).toBe('N');
    });

    test('handles dispatch hire when noncompliant with multiple dispatches needed', () => {
      const state = { compliance: 'N', dispatchNeeded: 3, directCount: 5, nextHireDispatch: 'Y' };
      const result = applyHire(state, 'dispatch', 2);
      
      expect(result.compliance).toBe('N');
      expect(result.dispatchNeeded).toBe(2);
      expect(result.directCount).toBe(4);
      expect(result.nextHireDispatch).toBe('Y');
    });

    test('handles direct hire within limit (2To1 mode)', () => {
      const state = { compliance: 'C', dispatchNeeded: 0, directCount: 1, nextHireDispatch: 'N' };
      const result = applyHire(state, 'direct', 2);
      
      expect(result.compliance).toBe('C');
      expect(result.dispatchNeeded).toBe(0);
      expect(result.directCount).toBe(2);
      expect(result.nextHireDispatch).toBe('Y');
    });

    test('handles direct hire exceeding limit (2To1 mode)', () => {
      const state = { compliance: 'C', dispatchNeeded: 0, directCount: 2, nextHireDispatch: 'Y' };
      const result = applyHire(state, 'direct', 2);
      
      expect(result.compliance).toBe('N');
      expect(result.dispatchNeeded).toBe(1);
      expect(result.directCount).toBe(3);
      expect(result.nextHireDispatch).toBe('Y');
    });

    test('handles direct hire when already noncompliant', () => {
      const state = { compliance: 'N', dispatchNeeded: 1, directCount: 3, nextHireDispatch: 'Y' };
      const result = applyHire(state, 'direct', 2);
      
      expect(result.compliance).toBe('N');
      expect(result.dispatchNeeded).toBe(2);
      expect(result.directCount).toBe(4);
      expect(result.nextHireDispatch).toBe('Y');
    });

    test('handles 3To1 mode correctly', () => {
      const state = { compliance: 'C', dispatchNeeded: 0, directCount: 3, nextHireDispatch: 'Y' };
      const result = applyHire(state, 'direct', 3);
      
      expect(result.compliance).toBe('N');
      expect(result.dispatchNeeded).toBe(1);
      expect(result.directCount).toBe(4);
      expect(result.nextHireDispatch).toBe('Y');
    });

    test('handles empty or null hire type as direct', () => {
      const state = { compliance: 'C', dispatchNeeded: 0, directCount: 2, nextHireDispatch: 'Y' };
      const result = applyHire(state, '', 2);
      
      expect(result.compliance).toBe('N');
      expect(result.dispatchNeeded).toBe(1);
      expect(result.directCount).toBe(3);
      expect(result.nextHireDispatch).toBe('Y');
    });

    test('handles edge cases in compliance state', () => {
      const state = { compliance: 'C', dispatchNeeded: 0, directCount: 0, nextHireDispatch: 'N' };
      
      // Test with whitespace in hire type
      applyHire(state, '  dispatch  ', 2);
      expect(state.compliance).toBe('C');
      
      // Test with mixed case
      const state2 = { compliance: 'C', dispatchNeeded: 0, directCount: 2, nextHireDispatch: 'Y' };
      applyHire(state2, 'DiSpAtCh', 2);
      expect(state2.compliance).toBe('C');
    });

    test('handles boundary conditions', () => {
      const state = { compliance: 'N', dispatchNeeded: 0, directCount: 0, nextHireDispatch: 'N' };
      
      // Test dispatch when dispatchNeeded is 0
      applyHire(state, 'dispatch', 2);
      expect(state.dispatchNeeded).toBe(0);
      expect(state.directCount).toBe(0);
    });
  });
});
  describe('createComplianceState', () => {
    test('creates default state when no seed provided', () => {
      const state = createComplianceState(null, 2);
      
      expect(state.compliance).toBe('C');
      expect(state.dispatchNeeded).toBe(0);
      expect(state.directCount).toBe(0);
      expect(state.nextHireDispatch).toBe('N');
    });

    test('creates state from seed data', () => {
      const seed = {
        ComplianceStatus: 'Noncompliant',
        DirectCount: 3,
        DispatchNeeded: 1,
        NextHireDispatch: 'Y'
      };
      const state = createComplianceState(seed, 2);
      
      expect(state.compliance).toBe('N');
      expect(state.dispatchNeeded).toBe(1);
      expect(state.directCount).toBe(3);
      expect(state.nextHireDispatch).toBe('Y');
    });

    test('handles null values in seed', () => {
      const seed = {
        ComplianceStatus: 'Compliant',
        DirectCount: null,
        DispatchNeeded: null,
        NextHireDispatch: null
      };
      const state = createComplianceState(seed, 2);
      
      expect(state.compliance).toBe('C');
      expect(state.dispatchNeeded).toBe(0);
      expect(state.directCount).toBe(0);
      expect(state.nextHireDispatch).toBe('N');
    });

    test('sets nextHireDispatch correctly based on state', () => {
      const seed = {
        ComplianceStatus: 'Compliant',
        DirectCount: 2,
        DispatchNeeded: 0,
        NextHireDispatch: 'N'
      };
      const state = createComplianceState(seed, 2);
      
      expect(state.nextHireDispatch).toBe('Y');
    });
  });
});