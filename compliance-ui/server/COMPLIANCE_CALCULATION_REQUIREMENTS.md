# Compliance Calculation Requirements

## Purpose
Define the business rules for calculating compliance status, dispatch required count, and next-hire dispatch eligibility for the compliance API.

## Scope
These requirements apply to compliance run processing and report generation in the server application.

Historical run data remains unchanged after it is written. A mode change affects the next run that is created with the new mode value.

## Definitions

### Mode
A mode determines the maximum number of direct hires allowed before dispatch hires are required.

- `2:1` mode means `allowedDirect = 2`
- `3:1` mode means `allowedDirect = 3`

### Compliance Status
The contractor state is stored as:

- `Compliant` (`C`)
- `Noncompliant` (`N`)

### Direct Count
The number of direct hires that have been applied to the contractor state for the current run.

### Dispatch Needed
The number of dispatch hires required to restore compliance under the current mode.

### Next Hire Dispatch
A flag that indicates whether the next hire must be a dispatch hire.

- `Y` = dispatch is required for the next hire
- `N` = direct hire is allowed for the next hire

## Core Calculation Rules

### 1. Mode-to-threshold mapping
The system shall derive the compliance threshold from the selected mode.

- `2:1` mode shall use `allowedDirect = 2`
- `3:1` mode shall use `allowedDirect = 3`

### 2. Initial state restoration
When a run starts, the system shall restore contractor state from the previous run seed when one exists.

The restored state shall use these values:

- `ComplianceStatus` from the seed, converted to the internal code format
- `DispatchNeeded` from the seed, or `0` when missing
- `DirectCount` from the seed, or `0` when missing
- `NextHireDispatch` from the seed, or `N` when missing

After restoration, the system shall recalculate `NextHireDispatch` using the current mode threshold.

### 3. Compliance status on restoration
On state restoration, compliance shall be resolved as follows:

- If the seed status is `Compliant`, the restored state shall remain compliant.
- If the seed status is `Noncompliant`, the restored state shall be set to:
  - `Noncompliant` when `DirectCount` is greater than the current `allowedDirect`
  - `Compliant` when `DirectCount` is less than or equal to the current `allowedDirect`

This means a mode increase can restore compliance for a seed that was previously noncompliant under a tighter threshold.

### 4. Next-hire dispatch on restoration
After restoration, `NextHireDispatch` shall be set to `Y` when either of the following is true:

- `DispatchNeeded > 0`
- `DirectCount >= allowedDirect`

Otherwise, `NextHireDispatch` shall be set to `N`.

### 5. Direct hire processing
When a direct hire is applied, the system shall:

- Increment `DirectCount` by `1`
- Leave the state compliant when the direct count is still within the allowed threshold
- Set the state to noncompliant when the direct count becomes one above the threshold
- Increment `DispatchNeeded` for each additional direct hire beyond the first violation

The following direct-hire transitions shall be used:

- If the current state is `Compliant` and `DirectCount` becomes `allowedDirect + 1`, then `ComplianceStatus` shall become `Noncompliant` and `DispatchNeeded` shall become `1`
- If the current state is already `Noncompliant` and `DirectCount` becomes greater than `allowedDirect + 1`, then `DispatchNeeded` shall increase by `1`

### 6. Dispatch hire processing
When a dispatch hire is applied, the system shall:

- Reduce the dispatch obligation
- Reduce the direct count as required by the current state logic
- Restore compliance when the final required dispatch hire is applied

The following dispatch-hire transitions shall be used:

- If the state is `Compliant`, or if the state is `Noncompliant` with `DispatchNeeded = 1`, then the dispatch hire shall:
  - Set `DispatchNeeded` to `0`
  - Set `DirectCount` to `0`
  - Set `ComplianceStatus` to `Compliant`
- Otherwise, the dispatch hire shall:
  - Decrement `DispatchNeeded` by `1`, not below `0`
  - Decrement `DirectCount` by `1`, not below `0`
  - Set `ComplianceStatus` to `Noncompliant` only when `DirectCount` remains above `allowedDirect`

### 7. Recalculation after every hire
After every hire application, the system shall recalculate `NextHireDispatch` using the same rule defined in section 4.

## Mode Change Requirements

### 1. Mode changes do not rewrite history
Changing from one mode to another shall not modify historical run records already written to the database.

The new mode shall apply only to the next run that is executed with that mode.

### 2. Change from 2:1 to 3:1
When the mode changes from `2:1` to `3:1`, the allowed direct hire threshold increases from `2` to `3`.

Expected effects on restored state:

- Contractors with `DirectCount` of `0`, `1`, or `2` shall remain compliant if they were compliant in the seed
- `NextHireDispatch` may change from `Y` to `N` when the contractor is now below the higher threshold and has no dispatch obligation
- Contractors that were previously noncompliant may become compliant if their restored `DirectCount` is less than or equal to `3`
- `DispatchNeeded` shall remain as stored until dispatch hires are actually processed

### 3. Change from 3:1 to 2:1
When the mode changes from `3:1` to `2:1`, the allowed direct hire threshold decreases from `3` to `2`.

Expected effects on restored state:

- Contractors with `DirectCount` of `2` or more shall have `NextHireDispatch = Y`
- Contractors whose seed status is `Noncompliant` shall remain noncompliant when their restored `DirectCount` still exceeds `2`
- `DispatchNeeded` shall remain as stored until dispatch hires are processed
- `DirectCount` shall not be reset automatically by the mode change

## Transition Matrix

| Starting State | Mode Change | Restored Compliance | Dispatch Needed | Next Hire Dispatch |
| --- | --- | --- | --- | --- |
| Compliant, DirectCount = 2, DispatchNeeded = 0 | 2:1 to 3:1 | Compliant | 0 | N |
| Compliant, DirectCount = 2, DispatchNeeded = 0 | 3:1 to 2:1 | Compliant | 0 | Y |
| Noncompliant, DirectCount = 3, DispatchNeeded = 1 | 2:1 to 3:1 | Compliant | 1 | Y |
| Noncompliant, DirectCount = 3, DispatchNeeded = 1 | 3:1 to 2:1 | Noncompliant | 1 | Y |
| Compliant, DirectCount = 3, DispatchNeeded = 0 | 2:1 to 3:1 | Compliant | 0 | Y |
| Compliant, DirectCount = 3, DispatchNeeded = 0 | 3:1 to 2:1 | Compliant | 0 | Y |

## Output Requirements
Every contractor summary and detail row shall expose the following values:

- `ComplianceStatus`
- `DirectCount`
- `DispatchNeeded`
- `NextHireDispatch`

The summary status shall be derived from the internal compliance code.

## Validation Rules

- `DispatchNeeded` shall never be negative
- `DirectCount` shall never be negative
- `NextHireDispatch` shall always be `Y` or `N`
- Mode lookup shall fail when the selected mode does not exist

## Business Clarification Note
The current implementation preserves a compliant seed status during mode restoration and recalculates the rest of the state from the stored counts.

If the business wants a different rule for mode changes, such as forcing a full recalculation of compliance status whenever the threshold changes, that should be defined as a separate requirement before implementation changes are made.