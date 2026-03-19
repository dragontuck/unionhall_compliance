/**
 * compliance-engine.test.js - Unit tests for ComplianceEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceEngine } from './compliance-engine.js';

describe('ComplianceEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new ComplianceEngine();
    });

    describe('statusToCode', () => {
        it('should convert "Compliant" to "C"', () => {
            expect(engine.statusToCode('Compliant')).toBe('C');
        });

        it('should convert "Noncompliant" to "N"', () => {
            expect(engine.statusToCode('Noncompliant')).toBe('N');
        });

        it('should convert lowercase "compliant" to "C"', () => {
            expect(engine.statusToCode('compliant')).toBe('C');
        });

        it('should convert lowercase "noncompliant" to "N"', () => {
            expect(engine.statusToCode('noncompliant')).toBe('N');
        });

        it('should handle case-insensitive "Non" prefix', () => {
            expect(engine.statusToCode('NONCOMPLIANT')).toBe('N');
            expect(engine.statusToCode('Non-Compliant')).toBe('N');
        });

        it('should return "C" for null input', () => {
            expect(engine.statusToCode(null)).toBe('C');
        });

        it('should return "C" for undefined input', () => {
            expect(engine.statusToCode(undefined)).toBe('C');
        });

        it('should return "C" for empty string', () => {
            expect(engine.statusToCode('')).toBe('C');
        });

        it('should return "C" for any status not starting with "non"', () => {
            expect(engine.statusToCode('Other')).toBe('C');
            expect(engine.statusToCode('Unknown')).toBe('C');
        });
    });

    describe('codeToStatus', () => {
        it('should convert "C" to "Compliant"', () => {
            expect(engine.codeToStatus('C')).toBe('Compliant');
        });

        it('should convert "N" to "Noncompliant"', () => {
            expect(engine.codeToStatus('N')).toBe('Noncompliant');
        });

        it('should convert any non-"N" code to "Compliant"', () => {
            expect(engine.codeToStatus('X')).toBe('Compliant');
            expect(engine.codeToStatus('Other')).toBe('Compliant');
            expect(engine.codeToStatus('')).toBe('Compliant');
        });

        it('should return "Compliant" for null input', () => {
            expect(engine.codeToStatus(null)).toBe('Compliant');
        });

        it('should return "Compliant" for undefined input', () => {
            expect(engine.codeToStatus(undefined)).toBe('Compliant');
        });
    });

    describe('createComplianceState', () => {
        it('should create initial compliant state with no seed', () => {
            const state = engine.createComplianceState(null, 2);

            expect(state).toEqual({
                compliance: 'C',
                dispatchNeeded: 0,
                directCount: 0,
                nextHireDispatch: 'N'
            });
        });

        it('should create initial state with allowedDirect=3', () => {
            const state = engine.createComplianceState(null, 3);

            expect(state).toEqual({
                compliance: 'C',
                dispatchNeeded: 0,
                directCount: 0,
                nextHireDispatch: 'N'
            });
        });

        it('should restore compliance status from seed', () => {
            const seed = {
                ComplianceStatus: 'Noncompliant',
                DispatchNeeded: 2,
                DirectCount: 3,
                NextHireDispatch: 'Y'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.compliance).toBe('N');
            expect(state.dispatchNeeded).toBe(2);
            expect(state.directCount).toBe(3);
        });

        it('Compliant 3to1 converted to 2to1', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: 0,
                DirectCount: 3,
                NextHireDispatch: 'Y'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.compliance).toBe('C');
            expect(state.dispatchNeeded).toBe(0);
            expect(state.directCount).toBe(3);
            expect(state.nextHireDispatch).toBe('Y');
        });

        it('should restore compliance status from seed 3to1 -> 2to1', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: 0,
                DirectCount: 3,
                NextHireDispatch: 'Y'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.compliance).toBe('C');
            expect(state.dispatchNeeded).toBe(0);
            expect(state.directCount).toBe(3);
            expect(state.nextHireDispatch).toBe('Y');
        });

        it('should set nextHireDispatch to Y when at allowed direct limit', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: 0,
                DirectCount: 2,
                NextHireDispatch: 'N'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.nextHireDispatch).toBe('Y');
        });

        it('should set nextHireDispatch to Y when dispatch is needed', () => {
            const seed = {
                ComplianceStatus: 'Noncompliant',
                DispatchNeeded: 1,
                DirectCount: 2,
                NextHireDispatch: 'Y'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.nextHireDispatch).toBe('Y');
        });

        it('should set nextHireDispatch to N when not at limit and no dispatch needed', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: 0,
                DirectCount: 1,
                NextHireDispatch: 'N'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.nextHireDispatch).toBe('N');
        });

        it('should handle seed with null DispatchNeeded', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: null,
                DirectCount: 0,
                NextHireDispatch: 'N'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.dispatchNeeded).toBe(0);
        });

        it('should handle seed with null DirectCount', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: 0,
                DirectCount: null,
                NextHireDispatch: 'N'
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.directCount).toBe(0);
        });

        it('should handle seed with null NextHireDispatch', () => {
            const seed = {
                ComplianceStatus: 'Compliant',
                DispatchNeeded: 0,
                DirectCount: 0,
                NextHireDispatch: null
            };

            const state = engine.createComplianceState(seed, 2);

            expect(state.nextHireDispatch).toBe('N');
        });
    });

    describe('applyHire', () => {
        describe('with dispatch hire', () => {
            it('should clear state when compliant and dispatch hire is applied', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 2,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'dispatch', 2);

                expect(result.compliance).toBe('C');
                expect(result.dispatchNeeded).toBe(0);
                expect(result.directCount).toBe(0);
            });

            it('should clear state when noncompliant with 1 dispatch needed', () => {
                const state = {
                    compliance: 'N',
                    dispatchNeeded: 1,
                    directCount: 3,
                    nextHireDispatch: 'Y'
                };

                const result = engine.applyHire(state, 'dispatch', 2);

                expect(result.compliance).toBe('C');
                expect(result.dispatchNeeded).toBe(0);
                expect(result.directCount).toBe(0);
            });

            it('should decrement dispatch needed when noncompliant with multiple dispatches needed', () => {
                const state = {
                    compliance: 'N',
                    dispatchNeeded: 3,
                    directCount: 5,
                    nextHireDispatch: 'Y'
                };

                const result = engine.applyHire(state, 'dispatch', 2);

                expect(result.compliance).toBe('N');
                expect(result.dispatchNeeded).toBe(2);
                expect(result.directCount).toBe(4);
            });

            it('should not go below 0 for dispatch needed', () => {
                const state = {
                    compliance: 'N',
                    dispatchNeeded: 0,
                    directCount: 1,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'dispatch', 2);

                expect(result.dispatchNeeded).toBeGreaterThanOrEqual(0);
            });

            it('should update nextHireDispatch after dispatch hire', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 2,
                    nextHireDispatch: 'Y'
                };

                const result = engine.applyHire(state, 'dispatch', 2);

                expect(result.nextHireDispatch).toBe('N');
            });

            it('should handle whitespace in hire type', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 0,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, '  dispatch  ', 2);

                expect(result.compliance).toBe('C');
                expect(result.directCount).toBe(0);
            });

            it('should handle case-insensitive dispatch', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 0,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'DISPATCH', 2);

                expect(result.compliance).toBe('C');
            });
        });
        it('should restore compliance status from seed 2to1 to 3to1', () => {
            const seed = {
                ComplianceStatus: 'Noncompliant',
                DispatchNeeded: 2,
                DirectCount: 3,
                NextHireDispatch: 'Y'
            };

            const state = engine.createComplianceState(seed, 3);

            expect(state.compliance).toBe('C');
            expect(state.dispatchNeeded).toBe(2);
            expect(state.directCount).toBe(3);
        });

        describe('with direct hire', () => {
            it('should increment direct count on compliant state', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 1,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'direct', 2);

                expect(result.directCount).toBe(2);
                expect(result.compliance).toBe('C');
            });

            it('should become noncompliant when exceeding allowed direct by 1 (2To1)', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 2,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'direct', 2);

                expect(result.directCount).toBe(3);
                expect(result.compliance).toBe('N');
                expect(result.dispatchNeeded).toBe(1);
            });

            it('should increment dispatch needed on further direct hires', () => {
                const state = {
                    compliance: 'N',
                    dispatchNeeded: 1,
                    directCount: 3,
                    nextHireDispatch: 'Y'
                };

                const result = engine.applyHire(state, 'direct', 2);

                expect(result.directCount).toBe(4);
                expect(result.compliance).toBe('N');
                expect(result.dispatchNeeded).toBe(2);
            });

            it('should set nextHireDispatch to Y when at allowed limit', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 1,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'direct', 2);

                expect(result.nextHireDispatch).toBe('Y');
            });

            it('should work with 3To1 mode (allowedDirect=3)', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 3,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'direct', 3);

                expect(result.directCount).toBe(4);
                expect(result.compliance).toBe('N');
                expect(result.dispatchNeeded).toBe(1);
            });

            it('should handle hire type that is not dispatch', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 0,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'other', 2);

                expect(result.directCount).toBe(1);
            });

            it('should handle null hire type as direct', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 0,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, null, 2);

                expect(result.directCount).toBe(1);
            });
        });

        describe('state mutation', () => {
            it('should mutate the passed state object', () => {
                const state = {
                    compliance: 'C',
                    dispatchNeeded: 0,
                    directCount: 0,
                    nextHireDispatch: 'N'
                };

                const result = engine.applyHire(state, 'direct', 2);

                expect(result).toBe(state);
                expect(state.directCount).toBe(1);
            });
        });
    });

    describe('getComplianceSummary', () => {
        it('should return compliant summary', () => {
            const state = {
                compliance: 'C',
                directCount: 1,
                dispatchNeeded: 0,
                nextHireDispatch: 'N'
            };

            const summary = engine.getComplianceSummary(state);

            expect(summary).toEqual({
                status: 'Compliant',
                code: 'C',
                directCount: 1,
                dispatchNeeded: 0,
                nextHireDispatch: 'N'
            });
        });

        it('should return noncompliant summary', () => {
            const state = {
                compliance: 'N',
                directCount: 3,
                dispatchNeeded: 1,
                nextHireDispatch: 'Y'
            };

            const summary = engine.getComplianceSummary(state);

            expect(summary).toEqual({
                status: 'Noncompliant',
                code: 'N',
                directCount: 3,
                dispatchNeeded: 1,
                nextHireDispatch: 'Y'
            });
        });

        it('should include all state properties in summary', () => {
            const state = {
                compliance: 'C',
                directCount: 2,
                dispatchNeeded: 0,
                nextHireDispatch: 'Y'
            };

            const summary = engine.getComplianceSummary(state);

            expect(summary).toHaveProperty('status');
            expect(summary).toHaveProperty('code');
            expect(summary).toHaveProperty('directCount');
            expect(summary).toHaveProperty('dispatchNeeded');
            expect(summary).toHaveProperty('nextHireDispatch');
        });
    });

    describe('integration scenarios', () => {
        it('should track compliance through multiple hires (2To1 scenario)', () => {
            // Start compliant
            let state = engine.createComplianceState(null, 2);
            expect(state.compliance).toBe('C');

            // Hire 1 direct
            state = engine.applyHire(state, 'direct', 2);
            expect(state.compliance).toBe('C');
            expect(state.directCount).toBe(1);

            // Hire 2 direct
            state = engine.applyHire(state, 'direct', 2);
            expect(state.compliance).toBe('C');
            expect(state.directCount).toBe(2);
            expect(state.nextHireDispatch).toBe('Y');

            // Hire 3 direct - becomes noncompliant
            state = engine.applyHire(state, 'direct', 2);
            expect(state.compliance).toBe('N');
            expect(state.directCount).toBe(3);
            expect(state.dispatchNeeded).toBe(1);

            // Hire dispatch - restore compliance
            state = engine.applyHire(state, 'dispatch', 2);
            expect(state.compliance).toBe('C');
            expect(state.directCount).toBe(0);
            expect(state.dispatchNeeded).toBe(0);
        });

        it('should track compliance through multiple hires (3To1 scenario)', () => {
            let state = engine.createComplianceState(null, 3);

            // Add 3 direct hires (allowed)
            state = engine.applyHire(state, 'direct', 3);
            state = engine.applyHire(state, 'direct', 3);
            state = engine.applyHire(state, 'direct', 3);
            expect(state.compliance).toBe('C');
            expect(state.directCount).toBe(3);

            // 4th direct hire makes noncompliant
            state = engine.applyHire(state, 'direct', 3);
            expect(state.compliance).toBe('N');
            expect(state.directCount).toBe(4);
            expect(state.dispatchNeeded).toBe(1);
        });

        it('should handle multiple dispatch hires from noncompliant state - start 3to1 convert to 2to1', () => {
            const seed = {
                ComplianceStatus: 'Noncompliant',
                DispatchNeeded: 3,
                DirectCount: 5,
                NextHireDispatch: 'Y'
            };

            let state = engine.createComplianceState(seed, 2);
            expect(state.compliance).toBe('N');

            // First dispatch hire
            state = engine.applyHire(state, 'dispatch', 2);
            expect(state.dispatchNeeded).toBe(2);

            // Second dispatch hire
            state = engine.applyHire(state, 'dispatch', 2);
            expect(state.dispatchNeeded).toBe(1);

            // Third dispatch hire - back to compliant
            state = engine.applyHire(state, 'dispatch', 2);
            expect(state.compliance).toBe('C');
            expect(state.dispatchNeeded).toBe(0);
        });

        it('should return correct summary after multiple operations', () => {
            let state = engine.createComplianceState(null, 2);
            state = engine.applyHire(state, 'direct', 2);
            state = engine.applyHire(state, 'direct', 2);
            state = engine.applyHire(state, 'direct', 2);

            const summary = engine.getComplianceSummary(state);

            expect(summary.status).toBe('Noncompliant');
            expect(summary.code).toBe('N');
            expect(summary.directCount).toBe(3);
            expect(summary.dispatchNeeded).toBe(1);
        });
    });
});
