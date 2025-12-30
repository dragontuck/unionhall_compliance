/**
 * Core compliance business logic
 */

function statusToCode(s) {
  const v = String(s || '').toLowerCase();
  if (v.startsWith('non')) return 'N';
  return 'C';
}

function codeToStatus(c) {
  return c === 'N' ? 'Noncompliant' : 'Compliant';
}

/**
 * Compliance state update.
 * - allowedDirect = 2 for 2To1, 3 for 3To1
 */
function applyHire(state, hireType, allowedDirect) {
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

module.exports = {
  statusToCode,
  codeToStatus,
  applyHire
};
function createComplianceState(seed, allowedDirect) {
  const state = {
    compliance: seed ? statusToCode(seed.ComplianceStatus) : 'C',
    dispatchNeeded: seed && seed.DispatchNeeded != null ? Number(seed.DispatchNeeded) : 0,
    directCount: seed && seed.DirectCount != null ? Number(seed.DirectCount) : 0,
    nextHireDispatch: seed && seed.NextHireDispatch ? String(seed.NextHireDispatch) : 'N',
  };
  state.nextHireDispatch = state.dispatchNeeded > 0 || state.directCount >= allowedDirect ? 'Y' : 'N';
  return state;
}

module.exports = {
  statusToCode,
  codeToStatus,
  applyHire,
  createComplianceState
};