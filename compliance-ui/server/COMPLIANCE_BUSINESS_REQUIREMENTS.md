# Compliance Business Requirements

## Purpose
Describe, in business terms, how the compliance system determines whether a contractor is compliant, how many dispatch hires are needed, and whether the next hire must be a dispatch hire.

## What the Business Needs
The system must support two operating modes:

- `2:1` mode, where the contractor can have up to 2 direct hires before dispatch is required
- `3:1` mode, where the contractor can have up to 3 direct hires before dispatch is required

The system must show the current compliance result for each contractor, the number of dispatch hires still needed, and whether the next hire must be dispatch.

## Business Rules

### Compliance status
Each contractor shall be shown as either:

- Compliant
- Noncompliant

The status is determined by the selected mode and the contractor’s current hire count.

### Dispatch needed
When a contractor goes over the allowed number of direct hires, the system shall calculate how many dispatch hires are needed to return to compliance.

This number shall never be negative.

### Next hire dispatch
The system shall show whether the next hire must be a dispatch hire.

- `Y` means dispatch is required next
- `N` means a direct hire is allowed next

## Mode Behavior

### Compliance during restoration
When a run starts and restores a contractor's prior state, compliance is determined by:

- If previously compliant: contractor remains compliant
- If previously noncompliant: contractor remains noncompliant if EITHER:
  - The direct hire count still exceeds the mode's allowed limit, OR
  - There are still pending dispatch hires that must be worked off (even if the direct count is below the limit)

### Changing from 2:1 to 3:1
When the business changes from `2:1` to `3:1`, the direct-hire allowance increases.

Expected business effect:

- Some contractors who were previously flagged may now become compliant (if their direct count is now below 3)
- Contractors with pending dispatch obligations may still remain flagged until those dispatches are processed
- The next-hire dispatch flag may turn off if the contractor is now within the higher limit and has no pending dispatches
- Existing history should stay intact; only future runs should use the new mode

### Changing from 3:1 to 2:1
When the business changes from `3:1` to `2:1`, the direct-hire allowance decreases.

Expected business effect:

- More contractors may become noncompliant because the limit is tighter
- The next-hire dispatch flag may turn on sooner
- Contractors already flagged as noncompliant remain flagged if they have pending dispatch work
- Existing history should stay intact; only future runs should use the new mode

## Expected Results by Mode Change

| Current Situation | 2:1 to 3:1 | 3:1 to 2:1 |
| --- | --- | --- |
| Contractor is within the limit | More likely to stay compliant | More likely to need dispatch |
| Contractor has already exceeded the limit | May be reclassified as compliant if now within the higher limit | Usually remains noncompliant until dispatches are applied |
| Next hire dispatch flag | May change from `Y` to `N` | May change from `N` to `Y` |

## Reporting Requirements
Each contractor summary and detail record shall show:

- Compliance status
- Direct hire count
- Dispatches still needed
- Next hire dispatch flag

## Business Acceptance Criteria

- The compliance result must match the active mode
- Dispatch needed must reflect only the remaining work required to return to compliance
- The next hire dispatch flag must clearly tell users whether the next hire must be dispatch
- Mode changes must affect future runs without rewriting prior completed runs

## Notes for Review
This business version describes what the system must do from an operations and reporting perspective. It does not describe the internal calculation logic or implementation details.