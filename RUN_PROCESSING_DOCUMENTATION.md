# Union Hall Compliance Management - Run Processing Documentation

**Audience:** Business Stakeholders, Process Improvement Teams  
**Document Version:** 1.0  
**Last Updated:** 2026-07-17

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Process Flow Diagram](#process-flow-diagram)
3. [Data Inputs & Preparation](#data-inputs--preparation)
4. [Run Execution Process](#run-execution-process)
5. [Compliance Engine Logic](#compliance-engine-logic)
6. [Report Generation](#report-generation)
7. [Key Metrics & Definitions](#key-metrics--definitions)
8. [Process Workflow Details](#process-workflow-details)
9. [Data Quality & Validation](#data-quality--validation)
10. [Process Improvement Considerations](#process-improvement-considerations)

---

## Executive Overview

### What is a "Run"?

A **Run** is a compliance evaluation cycle that processes hiring data to determine contractor compliance status against union hall dispatch and hire management regulations. Each run:

- Processes all hires that occurred during a specific review period
- Evaluates compliance based on the hiring mode (2To1 or 3To1)
- Generates detailed reports on contractor hiring practices
- Provides recommendations for corrective actions (dispatch requirements)

### Run Lifecycle Overview

```
Document Upload
    ↓
Hire Data Import (CSV) + Contractor Snapshots (CSV)
    ↓
Create Run Instance
    ↓
Load Historical Baseline (Previous Run)
    ↓
Process Hires Chronologically
    ↓
Apply Compliance Rules
    ↓
Generate Reports
    ↓
Export Results (Excel)
```

### Why Runs Matter

- **Regulatory Compliance:** Ensures contractors follow union hall dispatch policies
- **Fair Competition:** Prevents unfair hiring practices
- **Data-Driven Decisions:** Provides objective metrics for compliance status
- **Historical Tracking:** Maintains audit trail of compliance over time

---

## Process Flow Diagram

### High-Level Data Flow

```
External Data Sources (HR Systems, Excel Files)
        ↓
    ┌───────────────────────────────┐
    │  IMPORT PHASE                 │
    ├───────────────────────────────┤
    │ • Hire Data CSV Import        │
    │ • Contractor Snapshot Import  │
    │ • Data Validation             │
    └───────┬───────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  RUN SETUP PHASE              │
    ├───────────────────────────────┤
    │ • Create Run Instance         │
    │ • Select Mode (2To1 / 3To1)   │
    │ • Set Review Date             │
    │ • Retrieve Previous Run State  │
    └───────┬───────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  PROCESSING PHASE             │
    ├───────────────────────────────┤
    │ • Identify Contractors        │
    │ • Load Historical State       │
    │ • Process Hires (Ordered)     │
    │ • Apply Compliance Rules      │
    │ • Calculate Metrics           │
    └───────┬───────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  REPORT GENERATION PHASE      │
    ├───────────────────────────────┤
    │ • Create Detail Records       │
    │ • Create Summary Records      │
    │ • Attach Contractor Metadata  │
    └───────┬───────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  OUTPUT PHASE                 │
    ├───────────────────────────────┤
    │ • Export Excel Report         │
    │ • Save to Database            │
    │ • Generate Audit Trail        │
    └───────────────────────────────┘
```

---

## Data Inputs & Preparation

### 1. Hire Data Import

#### Source
- CSV file extracted from HR/HRIS systems
- Contains all new hiring activity records

#### Required Fields
| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| Employer ID | Text | Identify the hiring employer | Links to contractor |
| Contractor Name | Text | Contractor organization name | For reporting |
| Member Name | Text | Individual worker hired | Key person record |
| IA Number | Integer | Unique member identifier | Union membership |
| Start Date | Date | Hire effective date | Critical for chronological ordering |
| Hire Type | Text | "Dispatch" or "Direct" | Determines compliance logic |
| Is Reviewed | Boolean | Data validation flag | Filter for cleaned data |
| Is Excluded | Boolean | Exclusion flag | Special circumstances |
| End Date | Date (optional) | Hire termination date | Duration calculation |
| Contractor ID | Integer | Numeric contractor ID | Database key |
| Is Inactive | Boolean | Record status | Filter for active records |
| Reviewed Date | Date | Review cycle date | Groups hires into runs |
| Excluded Compliance Rules | Text (optional) | Reason for exclusion | Audit trail |
| Created By / Created On | Text, Date | Audit trail | Who imported and when |

#### Data Validation Rules
- All required fields must be populated
- Start Date must be valid and not in future
- Hire Type must be either "Dispatch" or "Direct"
- IA Number must be positive integer
- Contractor ID must exist in contractor master data

#### Processing Logic
- **Inactive Records:** Filtered out (only active hires processed)
- **Excluded Records:** Skipped from compliance calculations
- **Duplicates:** Handled by Created On timestamp

### 2. Contractor Snapshot Import

#### Source
- CSV file with contractor organizational metadata
- Captures company profile at point in time

#### Required Fields
| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| Contractor ID | Text | Unique contractor identifier | Padded to 6 digits |
| Contractor Name | Text | Official company name | For reporting |
| Last WED Reported | Date | Prior week-ending date reported | Historical reference |
| Snapshot WED | Date | Current week-ending date | Report date reference |
| Company Type | Text | Contractor classification | Strategic grouping |
| Last Hire Date | Date | Most recent hire | Activity indicator |
| Journeypersons | Integer | Total journeyperson count | Scale metric |
| Is Inactive | Boolean | Business status | Filter for active contractors |

#### Data Standardization
- Contractor IDs padded to 6 characters with leading zeros
- Dates normalized to consistent format
- Company Type categorized for analysis

### 3. Relationship Between Imports
- **Hire Data** contains transaction-level hiring records
- **Contractor Snapshots** provide organizational context
- Joined via Contractor ID for enriched reporting
- Contractor Snapshots may be updated weekly; hire data is transaction-based

---

## Run Execution Process

### Phase 1: Run Initialization

**Step 1a: Create Run Record**
- Insert new record into `CMP_Runs` table
- Record captures:
  - Reviewed Date: The cutoff date for hire inclusion
  - Report Date: Auto-set to current date
  - Mode ID: Links to 2To1 or 3To1 mode
  - Run Number: Sequential counter within mode

```sql
INSERT INTO dbo.CMP_Runs 
  (ReportDate, ReviewedDate, ModeId, Run)
OUTPUT INSERTED.id AS runId
VALUES 
  (CAST(SYSDATETIME() AS date), @reviewed, @modeId, @runNum)
```

**Step 1b: Identify Baseline (Previous Run)**
- Query for most recent run with ReviewedDate < current ReviewedDate
- This becomes the "seed" for contractor compliance state
- If no prior run exists, all contractors start from clean state (Compliant, DirectCount=0)

### Phase 2: Contractor Discovery

**Step 2: Build Contractor List**
- Identifies all unique contractors that:
  1. Have new hires in current review period (CMP_HireData), OR
  2. Had activity in prior run (CMP_Reports)
- Excludes contractors on blacklist (CMP_ContractorBlacklist with DeletedOn = NULL)
- Result: Set of contractors to process

**Query Logic:**
```
SELECT DISTINCT contractors
WHERE (
  (Has hires with ReviewedDate >= current_reviewed_date AND not blacklisted)
  OR
  (In previous run's reports AND not blacklisted)
)
```

### Phase 3: Per-Contractor Processing Loop

**For each contractor identified:**

#### Step 3a: Load Historical State

If previous run exists:
- Query contractor's final state from prior run's report:
  - Compliance Status: "Compliant" or "Noncompliant"
  - Direct Count: Number of direct hires in prior state
  - Dispatch Needed: Remaining dispatch requirements
  - Next Hire Dispatch: Whether next hire must be dispatch

```sql
SELECT TOP 1 
  ComplianceStatus, DirectCount, DispatchNeeded, NextHireDispatch
FROM dbo.CMP_Reports
WHERE RunId = @prevRunId 
  AND ContractorId = @contractorId 
  AND EmployerId = @employerId
```

#### Step 3b: Initialize Compliance State
- Create in-memory state object with:
  - Starting compliance status (from seed or "Compliant")
  - Direct count (from seed or 0)
  - Dispatch needed (from seed or 0)
  - Next hire dispatch flag

#### Step 3c: Fetch and Sort Hires

Retrieve all hires for contractor in current review period:

```sql
SELECT 
  EmployerId, StartDate, ReviewedDate, MemberName, 
  IANumber, HireType, ListPosition
FROM dbo.CMP_HireData
WHERE ContractorID = @contractorId
  AND CAST(ReviewedDate AS DATE) = @reviewed
ORDER BY 
  HireTypeOrder (Dispatch=0, Direct=1),
  StartDate,
  ReviewedDate,
  IANumber
```

**Ordering Importance:**
- Dispatch hires processed FIRST (even if same start date)
- Then chronological by start date
- Ensures correct compliance state transitions

#### Step 3d: Process Each Hire (In Order)

For each hire, apply compliance rules:

```
FOR each hire in chronological order:
  Apply hire to current state
  Record state snapshot after this hire
  Insert into CMP_ReportDetails
```

**Details Recorded per Hire:**
- All hire information (member, hire type, dates)
- Current compliance status after processing
- Current metrics (direct count, dispatch needed)
- Review date and list position

### Phase 4: Generate Summary Reports

**For each contractor:**

#### Step 4a: Final State Summary
- Extract final compliance state after processing all hires
- Retrieve contractor snapshot data for enrichment

**Data enrichment:**
```sql
SELECT TOP 1
  LastWedReported, SnapshotWed, CompanyType
FROM dbo.CMP_ContractorSnapshot
WHERE EmployerId = @employerId
  AND SnapshotWed <= @reviewedDate
ORDER BY SnapshotWed DESC
```

#### Step 4b: Insert Summary Report
Create one record per contractor in `CMP_Reports`:

```sql
INSERT INTO dbo.CMP_Reports
  (RunId, EmployerId, ContractorId, ContractorName,
   ComplianceStatus, DispatchNeeded, NextHireDispatch, DirectCount,
   LastWedReported, SnapshotWed, CompanyType)
VALUES
  (@runId, @employerId, @contractorId, @contractorName,
   @complianceStatus, @dispatchNeeded, @nextHireDispatch, @directCount,
   @lastWedReported, @snapshotWed, @companyType)
```

---

## Compliance Engine Logic

### Core Algorithm: State Machine

The compliance system maintains a state for each contractor consisting of:

```
State = {
  compliance: 'C' (Compliant) | 'N' (Noncompliant),
  directCount: number,           // Consecutive direct hires
  dispatchNeeded: number,        // Outstanding dispatch requirements
  nextHireDispatch: 'Y' | 'N'    // Must next hire be dispatch?
}
```

### Compliance Rules by Mode

#### 2To1 Mode (allowedDirect = 2)
- After 2 direct hires: Still compliant
- On 3rd direct hire: Becomes **Noncompliant**, dispatchNeeded = 1
- Additional direct hires: dispatchNeeded increments

**Requirement:** For every 1 dispatch hire, up to 2 direct hires are allowed.

#### 3To1 Mode (allowedDirect = 3)
- After 3 direct hires: Still compliant
- On 4th direct hire: Becomes **Noncompliant**, dispatchNeeded = 1
- Additional direct hires: dispatchNeeded increments

**Requirement:** For every 1 dispatch hire, up to 3 direct hires are allowed.

### State Transition Rules

#### Rule 1: Processing a DIRECT Hire
```
IF current hire is NOT dispatch:
  increment directCount by 1
  
  IF compliance is 'C' AND directCount == (allowedDirect + 1):
    SET compliance = 'N'
    SET dispatchNeeded = 1
  
  ELSE IF directCount > (allowedDirect + 1):
    SET compliance = 'N'
    increment dispatchNeeded by 1
```

**Example (2To1 Mode):**
- Start: compliance=C, directCount=0, dispatchNeeded=0
- Direct hire 1: compliance=C, directCount=1, dispatchNeeded=0
- Direct hire 2: compliance=C, directCount=2, dispatchNeeded=0
- Direct hire 3: compliance=N, directCount=3, dispatchNeeded=1 ← **Violation triggered**
- Direct hire 4: compliance=N, directCount=4, dispatchNeeded=2

#### Rule 2: Processing a DISPATCH Hire
```
IF current hire is dispatch:
  IF compliance is 'C' OR 
     (compliance is 'N' AND dispatchNeeded == 1):
    // Dispatch "resets" the contractor when clearing requirement
    SET dispatchNeeded = 0
    SET directCount = 0
    SET compliance = 'C'
  
  ELSE IF dispatchNeeded > 1:
    // Dispatch satisfies one requirement, but more remain
    decrement dispatchNeeded by 1
    decrement directCount by 1 (if > 0)
```

**Example (2To1 Mode - Remediation):**
- Start: compliance=N, directCount=3, dispatchNeeded=1
- Dispatch hire 1: compliance=C, directCount=0, dispatchNeeded=0 ← **Reset to compliant**
- Direct hire 1: compliance=C, directCount=1, dispatchNeeded=0

#### Rule 3: Update Next Hire Dispatch Flag
After each hire, recalculate:
```
IF dispatchNeeded > 0 OR directCount >= allowedDirect:
  nextHireDispatch = 'Y'
ELSE:
  nextHireDispatch = 'N'
```

**Business Meaning:**
- 'Y' = The NEXT hire must be dispatch to maintain compliance
- 'N' = The next hire can be either dispatch or direct

### Code Reference: compliance-engine.js

```javascript
function applyHire(state, hireType, allowedDirect) {
  const h = String(hireType || '').trim();
  
  if (h.toLowerCase() === 'dispatch') {
    // Dispatch processing logic
    if (state.compliance === 'C' || 
        (state.compliance === 'N' && state.dispatchNeeded === 1)) {
      state.dispatchNeeded = 0;
      state.directCount = 0;
      state.compliance = 'C';
    } else {
      state.dispatchNeeded = Math.max(0, state.dispatchNeeded - 1);
      state.directCount = Math.max(0, state.directCount - 1);
    }
  } else {
    // Direct hire processing
    state.directCount += 1;
    if (state.compliance === 'C' && 
        state.directCount === allowedDirect + 1) {
      state.compliance = 'N';
      state.dispatchNeeded = 1;
    } else if (state.directCount > allowedDirect + 1) {
      state.compliance = 'N';
      state.dispatchNeeded += 1;
    }
  }
  
  state.nextHireDispatch = 
    (state.dispatchNeeded > 0 || state.directCount >= allowedDirect) ? 'Y' : 'N';
  return state;
}
```

### State Initialization: Seed from Previous Run

If a previous run exists:
- Contractor state CARRIES FORWARD from prior run's final state
- This enables compliance tracking across reporting cycles
- Dispatch requirements must be met before returning to compliant status

**Example (Continuing from prior run):**
- Prior Run End: compliance=N, directCount=4, dispatchNeeded=2
- New Run Start: Same state (to carry forward the requirement)
- Process dispatch hire: compliance=N, directCount=3, dispatchNeeded=1
- Process 2nd dispatch: compliance=C, directCount=0, dispatchNeeded=0 ← **Requirement satisfied**

---

## Report Generation

### Two-Level Reporting Structure

#### 1. Detail Records (CMP_ReportDetails)
**Granularity:** Per hire  
**Purpose:** Audit trail and detailed compliance tracking

**Fields:**
```
RunId             - Which run created this detail
EmployerId        - Contractor employer identifier
ContractorId      - Contractor numeric ID
ContractorName    - Organization name (from hire data)
MemberName        - Worker name
IANumber          - Union member ID
StartDate         - Hire date
HireType          - "Dispatch" or "Direct"
ComplianceStatus  - Compliance state AFTER this hire
DirectCount       - Direct count AFTER this hire
DispatchNeeded    - Dispatch requirement AFTER this hire
NextHireDispatch  - Next hire requirement (Y/N) AFTER this hire
ReviewedDate      - Review cycle date
ListPosition      - Position at dispatch (if applicable)
```

**Why Detail Records?**
- Enables drill-down analysis
- Audit trail for investigation
- Identifies exactly which hire caused violation
- Historical comparison across runs

#### 2. Summary Records (CMP_Reports)
**Granularity:** Per contractor per run  
**Purpose:** Executive summary and current status

**Fields:**
```
RunId              - Which run
EmployerId        - Contractor employer ID
ContractorId      - Contractor numeric ID
ContractorName    - Organization name
ComplianceStatus  - Final compliance status (Compliant/Noncompliant)
DirectCount       - Final direct count
DispatchNeeded    - Remaining dispatch requirement
NextHireDispatch  - Next hire requirement (Y/N)
LastWedReported   - Prior reporting date (from snapshot)
SnapshotWed       - Current week-end date (from snapshot)
CompanyType       - Contractor classification (from snapshot)
```

**Enrichment with Snapshot Data:**
- `LastWedReported`, `SnapshotWed`, `CompanyType` linked from Contractor Snapshot
- Provides organizational context without joining
- Enables reporting on company type trends

### Excel Export: Four-Tab Workbook

#### Tab 1: "Detail"
- All detail records for this run (CMP_ReportDetails)
- Sortable/filterable by contractor, compliance, hire type
- Use for detailed investigation

#### Tab 2: "Report"
- Summary records for this run (CMP_Reports)
- One row per contractor
- Use for compliance dashboard and trending

#### Tab 3: "Last 4"
- Last 4 hires per contractor (from CMP_HireData)
- Snapshot of recent hiring pattern
- Contextual information for compliance discussion

#### Tab 4: "Recent Hire"
- All hires in the current review period matching this run's date
- Raw transaction data for verification
- Links back to source HR data

### Date Formatting & Data Quality
- All date columns formatted as text in Excel to prevent date reinterpretation
- Ensures data integrity when Excel file is manipulated
- Maintains referential integrity with source systems

---

## Key Metrics & Definitions

### Compliance Status

| Status | Meaning | Trigger | Action |
|--------|---------|---------|--------|
| **Compliant** | Contractor following all regulations | Direct count ≤ allowedDirect OR all required dispatches completed | Continue monitoring |
| **Noncompliant** | Violation detected | Direct count > allowedDirect | Dispatch requirement issued |

### Direct Count

**Definition:** Number of consecutive direct (non-dispatch) hires in current compliance cycle.

**Reset Triggers:**
- Dispatch hire that satisfies the requirement
- Completion of compliance cycle
- Manual adjustment by compliance officer

**Business Meaning:**
- Tracks unmet compliance requirement
- Higher count = greater urgency for dispatch hire

### Dispatch Needed

**Definition:** Number of outstanding dispatch hires required to restore compliance.

**Calculation:**
- Increases by 1 for each direct hire beyond allowedDirect
- Decreases by 1 for each dispatch hire (when noncompliant)
- Returns to 0 when compliance restored

**Business Meaning:**
- Concrete action item for contractor
- Used to prioritize enforcement

### Next Hire Dispatch

**Definition:** Flag indicating whether next hire must be dispatch.

**Values:**
- `Y` = Next hire MUST be dispatch
- `N` = Next hire can be dispatch or direct

**Conditions for 'Y':**
- `dispatchNeeded > 0` (outstanding requirement), OR
- `directCount >= allowedDirect` (at threshold)

**Business Meaning:**
- Early warning of compliance pressure
- Used in proactive outreach

### Mode (2To1 vs 3To1)

**2To1 Mode:**
- Allows 2 direct hires per 1 dispatch
- Stricter compliance requirement
- Used for certain contractor classifications

**3To1 Mode:**
- Allows 3 direct hires per 1 dispatch
- More flexible compliance requirement
- Used for other contractor classifications

---

## Process Workflow Details

### Transaction Processing

#### 1. Transaction Wrapping
All database operations wrapped in SQL transaction:
- Enables atomic commit/rollback
- Prevents partial data states
- Supports dry-run mode (rollback all changes)

#### 2. Dry-Run Mode
Optional flag for validation without writes:
```
node cmp-run.js --reviewedDate 2025-12-01 --mode 2To1 --dryRun
```
- Executes all processing logic
- Does NOT insert to database
- Useful for testing and validation
- Returns success/error messages

#### 3. Commit Strategy
After all contractors processed:
- If successful: COMMIT transaction (all data written)
- If error: ROLLBACK transaction (all data discarded)
- Maintains data consistency

### Contractor Filtering: Blacklist Exclusion

Two-stage exclusion to prevent excluded contractors from being reported:

**Stage 1 - Hiring Data:**
```sql
SELECT contractors
FROM CMP_HireData h
LEFT JOIN CMP_ContractorBlacklist b 
  ON h.EmployerId = b.EmployerID 
  AND b.DeletedOn IS NOT NULL
WHERE b.Id IS NULL  -- Exclude blacklisted
```

**Stage 2 - Prior Run Data:**
```sql
SELECT contractors
FROM CMP_Reports r
LEFT JOIN CMP_ContractorBlacklist b 
  ON r.EmployerId = b.EmployerID 
  AND b.DeletedOn IS NULL
WHERE b.Id IS NULL  -- Exclude blacklisted
```

**Business Logic:**
- `DeletedOn IS NOT NULL` = Blacklist record deleted (contractor active)
- `DeletedOn IS NULL` = Blacklist record active (contractor excluded)
- Supports reversible exclusions

### Contractor State Seeding

#### Scenario 1: First Run (No Prior Run)
```
IF prevRunId IS NULL:
  state = {
    compliance: 'C',      // Start compliant
    directCount: 0,
    dispatchNeeded: 0,
    nextHireDispatch: 'N'
  }
```

#### Scenario 2: Contractor Active in Prior Run
```
IF contractor has report in prevRun:
  state = {
    compliance: priorReport.ComplianceStatus,
    directCount: priorReport.DirectCount,
    dispatchNeeded: priorReport.DispatchNeeded,
    nextHireDispatch: priorReport.NextHireDispatch
  }
```

#### Scenario 3: Contractor New in Current Run
```
IF contractor in CMP_HireData but not in prevRun:
  state = {
    compliance: 'C',
    directCount: 0,
    dispatchNeeded: 0,
    nextHireDispatch: 'N'
  }
```

### Mode Configuration

Modes stored in `CMP_Modes` table:

| Mode Name | Mode Value | Allowable Direct | Dispatch Ratio |
|-----------|-----------|------------------|-----------------|
| 2To1 | 2 | 2 | 1 dispatch per 2 direct |
| 3To1 | 3 | 3 | 1 dispatch per 3 direct |

**Flexibility Note:** Algorithm is mode-agnostic. Additional modes can be added by:
1. Inserting new row in CMP_Modes
2. Selecting new mode when creating run
3. allowedDirect parameter auto-populates from mode_value

---

## Data Quality & Validation

### Import-Time Validation

#### Hire Data Validation
```
✓ Employer ID populated
✓ Contractor ID is positive integer
✓ Member Name populated
✓ Start Date is valid date and not in future
✓ Hire Type is "Dispatch" or "Direct"
✓ IA Number is valid integer
✓ Is Reviewed = true (filtered only reviewed data)
✓ Is Excluded = false or null (active records only)
✗ Fails: Create error record, increment failCount
✓ Passes: Insert into CMP_ReviewedHires
```

#### Contractor Snapshot Validation
```
✓ Contractor ID populated and valid
✓ Contractor Name populated
✓ Snapshot WED is valid date
✓ Last Hire Date is valid date (if provided)
✓ Journeypersons is non-negative integer
✗ Fails: Create error record, increment failCount
✓ Passes: Insert into CMP_ContractorSnapshot
```

**Import Result Summary:**
```
{
  successCount: number,    // Records successfully imported
  failCount: number,       // Records with validation errors
  errors: [                // List of specific errors
    "Row 5: IA Number is required",
    "Row 12: Start Date must not be in future",
    ...
  ]
}
```

### Run-Time Data Quality Checks

| Check | Condition | Action |
|-------|-----------|--------|
| Null ContractorId | Contractor missing | Skip contractor |
| Missing Previous Run | Cannot establish baseline | Start with clean state |
| Hires out of order | System orders hires | Documented in logs |
| Blacklist changes | During run execution | Exclude contractor |

### Audit Trail

Every run maintains audit trail:

```
CMP_Runs:
  - ReportDate: When report generated
  - ReviewedDate: What period included
  - ModeId: What mode used

CMP_ReportDetails:
  - RunId: Which run
  - ReviewedDate: Confirms period
  - Each hire snapshot captured

CMP_Reports:
  - RunId: Which run
  - Final state recorded
```

---

## Process Improvement Considerations

### Potential Pain Points & Optimization Opportunities

#### 1. Data Import Timing
**Current State:**
- Hire data and contractor snapshots imported as separate operations
- Manual CSV preparation from HR systems

**Improvement Opportunities:**
- Automated daily feed from HR systems
- Real-time or near-real-time imports
- Reduce manual data entry errors
- Enable more frequent compliance runs

#### 2. Blacklist Management
**Current State:**
- Blacklist records maintained with DeletedOn flag
- Checked during run execution

**Improvement Opportunities:**
- Dashboard UI for blacklist management
- Automation trigger for known violation types
- Appeal/review process workflow
- Historical blacklist tracking

#### 3. Compliance State Carryover
**Current State:**
- State carries forward from prior run
- Enables persistent tracking across cycles

**Improvement Opportunities:**
- Configurable reset cycles (e.g., monthly compliance reset)
- Exception handling for long-term remediation
- State anomaly detection (unexpected transitions)

#### 4. Reporting & Insights
**Current State:**
- Excel exports with four tabs
- Summary at contractor level

**Improvement Opportunities:**
- Dashboard with compliance trends
- Predictive analytics for violation risk
- Company type-based benchmarking
- Historical compliance scoring
- Contractor hotspot identification

#### 5. Manual Corrections
**Current State:**
- No mechanism to override computed compliance

**Improvement Opportunities:**
- Compliance officer manual override with audit trail
- Exception notes linked to specific hires
- Dispute/appeal workflow
- Dry-run validation before override

#### 6. Run Scheduling & Automation
**Current State:**
- Manual trigger for each run
- Ad-hoc scheduling

**Improvement Opportunities:**
- Scheduled run execution (daily, weekly, monthly)
- Automated report distribution
- Failure notifications
- Performance monitoring

#### 7. Mode-Specific Rules
**Current State:**
- 2To1 and 3To1 modes supported
- Rule applied uniformly within mode

**Improvement Opportunities:**
- Contractor-specific mode assignments
- Graduated requirements based on company size
- Seasonal adjustment factors
- Escalation paths for chronic violations

#### 8. Performance Optimization
**Current State:**
- Sequential processing per contractor
- SQL queries executed in transaction

**Improvement Opportunities:**
- Batch processing optimization for large datasets
- Caching of contractor snapshots
- Index optimization on key queries
- Parallel processing of independent contractors

#### 9. Data Governance
**Current State:**
- Hire data marked as Is_Reviewed and Is_Excluded
- Manual data quality responsibility

**Improvement Opportunities:**
- Data quality scoring per import
- Automated duplicate detection
- Source data validation before import
- Compliance with data retention policies

#### 10. Stakeholder Communication
**Current State:**
- Excel exports for analysis
- Manual distribution

**Improvement Opportunities:**
- Automated compliance alerts to contractors
- Public dashboard for transparency
- Regulatory reporting automation
- Metrics briefings for leadership

---

## Glossary of Terms

| Term | Definition |
|------|-----------|
| **Contractor** | Union hall employer hiring workers |
| **Direct Hire** | Worker hired directly by contractor (not through dispatch) |
| **Dispatch Hire** | Worker hired through union dispatch system |
| **Compliance Cycle** | Period of time between compliance evaluations (typically weekly) |
| **Run** | Single execution of compliance evaluation for all contractors |
| **Reviewed Date** | The cutoff date for hire inclusion in a run |
| **Mode** | Compliance strictness setting (2To1 or 3To1) |
| **State Seeding** | Initialize current run with prior run's compliance status |
| **Dispatch Needed** | Outstanding requirement for dispatch hires to restore compliance |
| **Next Hire Dispatch** | Flag indicating if next hire must be dispatch (Y/N) |
| **Noncompliant** | Contractor not following dispatch requirements |
| **Snapshot** | Corporate metadata captured at point in time (WED, company type, etc.) |

---

## Appendix: System Components

### Services Layer

| Service | Responsibility |
|---------|-----------------|
| **RunService** | Orchestrates run creation, execution, reporting |
| **HireDataService** | Manages hire data import and retrieval |
| **ContractorSnapshotService** | Manages contractor metadata |
| **ReportService** | Manages report generation and updates |
| **ComplianceEngine** | Core compliance state machine logic |
| **BlacklistService** | Manages contractor exclusions |

### Repository Layer (Data Access)

All data operations abstracted through repository pattern for consistency:
- HireDataRepository
- ContractorSnapshotRepository
- RunRepository
- ReportRepository
- ReportDetailRepository
- BlacklistRepository

### Database Tables

| Table | Purpose |
|-------|---------|
| **CMP_Runs** | Master records for each compliance run |
| **CMP_ReportDetails** | Per-hire detail records |
| **CMP_Reports** | Per-contractor summary records |
| **CMP_HireData** | View of active reviewed hires |
| **CMP_ReviewedHires** | Source table for hire data |
| **CMP_Modes** | Configuration of compliance modes |
| **CMP_ContractorSnapshot** | Contractor metadata by date |
| **CMP_ContractorBlacklist** | Exclusion list management |

---

## Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-17 | Initial documentation |

---

## Contact & Questions

For clarifications on this documentation, contact:
- **System Owner:** [Product Owner Name]
- **Technical Lead:** [Technical Lead Name]
- **Data Governance:** [Data Steward Name]

---

**END OF DOCUMENTATION**
