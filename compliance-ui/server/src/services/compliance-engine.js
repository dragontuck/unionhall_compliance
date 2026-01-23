/**
 * ComplianceEngine - Core compliance business logic
 * Follows Single Responsibility Principle (SRP)
 * Encapsulates all compliance state and hire application logic
 */

export class ComplianceEngine {
  /**
   * Convert status string to code
   * @param {string} status - Status string (e.g., "Compliant", "Noncompliant")
   * @returns {string} Code ('C' for Compliant, 'N' for Noncompliant)
   */
  statusToCode(status) {
    const v = String(status || '').toLowerCase();
    if (v.startsWith('non')) return 'N';
    return 'C';
  }

  /**
   * Convert code to status string
   * @param {string} code - Code ('C' or 'N')
   * @returns {string} Status string
   */
  codeToStatus(code) {
    return code === 'N' ? 'Noncompliant' : 'Compliant';
  }

  /**
   * Create initial compliance state from seed data
   * @param {Object|null} seed - Previous compliance state
   * @param {number} allowedDirect - Allowed direct hires (2 for 2To1, 3 for 3To1)
   * @returns {Object} Compliance state object
   */
  createComplianceState(seed, allowedDirect) {
    const state = {
      compliance: seed ? this.statusToCode(seed.ComplianceStatus) : 'C',
      dispatchNeeded: seed && seed.DispatchNeeded != null ? Number(seed.DispatchNeeded) : 0,
      directCount: seed && seed.DirectCount != null ? Number(seed.DirectCount) : 0,
      nextHireDispatch: seed && seed.NextHireDispatch ? String(seed.NextHireDispatch) : 'N',
    };
    state.nextHireDispatch = state.dispatchNeeded > 0 || state.directCount >= allowedDirect ? 'Y' : 'N';
    return state;
  }

  /**
   * Apply hire to compliance state
   * Updates compliance state based on hire type
   * @param {Object} state - Current compliance state
   * @param {string} hireType - Type of hire ('direct' or 'dispatch')
   * @param {number} allowedDirect - Allowed direct hires (2 for 2To1, 3 for 3To1)
   * @returns {Object} Updated compliance state
   */
  applyHire(state, hireType, allowedDirect) {
    const h = String(hireType || '').trim();
    if (h.toLowerCase() === 'dispatch') {
      if (state.compliance === 'C' || (state.compliance === 'N' && state.dispatchNeeded === 1)) {
        state.dispatchNeeded = 0;
        state.directCount = 0;
        state.compliance = 'C';
      } else {
        state.dispatchNeeded = Math.max(0, state.dispatchNeeded - 1);
        state.directCount = Math.max(0, state.directCount - 1);
      }
    } else {
      state.directCount += 1;
      if (state.compliance === 'C' && state.directCount === allowedDirect + 1) {
        state.compliance = 'N';
        state.dispatchNeeded = 1;
      } else if (state.directCount > allowedDirect + 1) {
        state.compliance = 'N';
        state.dispatchNeeded += 1;
      }
    }

    state.nextHireDispatch = state.dispatchNeeded > 0 || state.directCount >= allowedDirect ? 'Y' : 'N';
    return state;
  }

  /**
   * Get compliance summary for reporting
   * @param {Object} state - Current compliance state
   * @returns {Object} Compliance summary
   */
  getComplianceSummary(state) {
    return {
      status: this.codeToStatus(state.compliance),
      code: state.compliance,
      directCount: state.directCount,
      dispatchNeeded: state.dispatchNeeded,
      nextHireDispatch: state.nextHireDispatch
    };
  }
}