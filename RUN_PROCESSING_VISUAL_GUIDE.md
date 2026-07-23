# Union Hall Compliance - Run Processing Visual Guide

**Quick Reference for Business Stakeholders**

---

## 1. Run Processing - Step-by-Step Overview

```
PHASE 1: SETUP
┌─────────────────────────────────────┐
│ 1. User Specifies Run Parameters    │
│    • Reviewed Date (YYYY-MM-DD)    │
│    • Mode (2To1 or 3To1)           │
│    • Optional: Dry-Run for testing │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. System Creates Run Record        │
│    • Assigns unique Run ID          │
│    • Records ReportDate = today     │
│    • Records ReviewedDate = param   │
│    • Sets mode from parameter       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Find Previous Run Baseline       │
│    • Query: Most recent run with    │
│      ReviewedDate < current date    │
│    • If found: Use for state seed   │
│    • If not found: Start fresh      │
└──────────────┬──────────────────────┘

PHASE 2: DISCOVER
               ↓
┌─────────────────────────────────────┐
│ 4. Build Contractor List            │
│    • Contractors with new hires     │
│      (ReviewedDate = current)       │
│    • OR contractors in prior run    │
│    • EXCLUDE blacklisted ones       │
└──────────────┬──────────────────────┘

PHASE 3: PROCESS (FOR EACH CONTRACTOR)
               ↓
        ┌──────────────────┐
        │ Contractor Loop  │
        └────────┬─────────┘
                 ↓
    ┌─────────────────────────────────┐
    │ 5. Load Historical State        │
    │    • Prior run report if exists │
    │    • OR clean state             │
    └────────┬────────────────────────┘
             ↓
    ┌─────────────────────────────────┐
    │ 6. Fetch & Sort Hires           │
    │    • Get all hires from data    │
    │    • Sort: Dispatch, then       │
    │      StartDate, then IA Number  │
    └────────┬────────────────────────┘
             ↓
    ┌─────────────────────────────────┐
    │ 7. Process Each Hire            │
    │    • Apply compliance rules     │
    │    • Update state object        │
    │    • Record detail row          │
    │    (repeat for each hire)       │
    └────────┬────────────────────────┘
             ↓
    ┌─────────────────────────────────┐
    │ 8. Generate Summary             │
    │    • Final compliance status    │
    │    • Attach snapshot metadata   │
    │    • Insert summary report      │
    └────────┬────────────────────────┘
             ↓
        ┌──────────────────┐
        │ Next Contractor? │──→ YES → Back to Step 5
        └─────┬────────────┘
              NO
              ↓

PHASE 4: FINALIZE
┌─────────────────────────────────────┐
│ 9. Commit or Rollback               │
│    • If dry-run: ROLLBACK (discard) │
│    • If success: COMMIT (save)      │
│    • If error: ROLLBACK (undo)      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 10. Export Results                  │
│     • Create Excel workbook         │
│     • Tab 1: Detail (all hires)    │
│     • Tab 2: Report (summaries)    │
│     • Tab 3: Last 4 Hires          │
│     • Tab 4: Recent Hires          │
└─────────────────────────────────────┘
```

---

## 2. Compliance Engine - Decision Tree

### Processing a DIRECT Hire (Not Dispatch)

```
        ┌─ DIRECT HIRE RECEIVED ─┐
        │                         │
        ↓                         
  increment DirectCount by 1      
        ↓
    ┌───┴───────────────────────────────────┐
    │                                       │
    ↓                                       ↓
Is Compliance                    Compliance was
'C' (Compliant)?                'N' (Noncompliant)?
    │                                       │
    YES                                    YES
    │                                       │
    ↓                                       ↓
Is DirectCount == ┐                 Is DirectCount >
(allowedDirect+1)?│         (allowedDirect+1)?
    │         │                          │
   YES        NO                        YES
    │         │                          │
    ↓         ↓                          ↓
Set       Stay          Increment
Compliance C'           dispatchNeeded
= 'N'     (no change)  by 1
Set                    Compliance
dispatchN  ↓            stays 'N'
eeded=1  Continue
    ↓       ↓          ↓
    └───────┴──────────┘
            ↓
    ┌─ UPDATE NEXT HIRE FLAG ─┐
    │                         │
    ↓
IF (dispatchNeeded > 0 OR
    directCount >= allowedDirect):
  nextHireDispatch = 'Y'
ELSE:
  nextHireDispatch = 'N'
    ↓
    └─ RECORD STATE & CONTINUE ─┘
```

# Processing a DISPATCH Hire

```
        ┌─ DISPATCH HIRE RECEIVED ─┐
        │                          │
        ↓
    ┌───────────────────────────────────────────┐
    │                                           │
    ↓                                           ↓
Is Compliance 'C'          Is Compliance 'N' AND
(Compliant)?               dispatchNeeded == 1?
    │                                   │
   YES                                 YES
    │                                   │
    ↓                                   ↓
┌─ FULL RESET ─┐            ┌─ FULL RESET ─┐
│              │            │              │
Set C = 'C'    │            Set C = 'C'    │
Set DC = 0     │            Set DC = 0     │
Set DN = 0     │            Set DN = 0     │
└──────┬───────┘            └──────┬───────┘
       │                           │
       └───────────┬───────────────┘
                   ↓
    (Now contractor is back to
     clean compliant state)
                   ↓

    NO to BOTH conditions?
    (Compliance='N' AND DN > 1)
    │
    ↓
┌─ PARTIAL REDUCTION ─┐
│                     │
Decrement DN by 1     
Decrement DC by 1     
(if DC > 0)           
Compliance stays 'N'  
└──────┬──────────────┘
       ↓
(Requirement partially met,
 still more dispatches needed)
       ↓
    
    ↓
┌─ UPDATE NEXT HIRE FLAG ─┐
│                         │
IF (dispatchNeeded > 0 OR
    directCount >= allowedDirect):
  nextHireDispatch = 'Y'
ELSE:
  nextHireDispatch = 'N'
    ↓
    └─ RECORD STATE & CONTINUE ─┘
```

---

## 3. Compliance Rules Summary - 2To1 vs 3To1

### 2To1 Mode (Stricter)

```
ALLOWED: 2 Direct Hires per 1 Dispatch

State Evolution:

Starting State:
compliance=C, directCount=0, dispatchNeeded=0, nextHireDispatch=N

After 1st Direct:
compliance=C, directCount=1, dispatchNeeded=0, nextHireDispatch=N

After 2nd Direct:
compliance=C, directCount=2, dispatchNeeded=0, nextHireDispatch=Y ← CAUTION!

After 3rd Direct: ⚠️ VIOLATION
compliance=N, directCount=3, dispatchNeeded=1, nextHireDispatch=Y ← NONCOMPLIANT

After 4th Direct: 🚨 ESCALATION
compliance=N, directCount=4, dispatchNeeded=2, nextHireDispatch=Y

Recovery Path (after dispatch):
After 1st Dispatch:
compliance=C, directCount=0, dispatchNeeded=0, nextHireDispatch=N ← COMPLIANT!
```

### 3To1 Mode (More Flexible)

```
ALLOWED: 3 Direct Hires per 1 Dispatch

State Evolution:

Starting State:
compliance=C, directCount=0, dispatchNeeded=0, nextHireDispatch=N

After 1st Direct:
compliance=C, directCount=1, dispatchNeeded=0, nextHireDispatch=N

After 2nd Direct:
compliance=C, directCount=2, dispatchNeeded=0, nextHireDispatch=N

After 3rd Direct:
compliance=C, directCount=3, dispatchNeeded=0, nextHireDispatch=Y ← CAUTION!

After 4th Direct: ⚠️ VIOLATION
compliance=N, directCount=4, dispatchNeeded=1, nextHireDispatch=Y ← NONCOMPLIANT

After 5th Direct: 🚨 ESCALATION
compliance=N, directCount=5, dispatchNeeded=2, nextHireDispatch=Y

Recovery Path (after dispatch):
After 1st Dispatch:
compliance=C, directCount=0, dispatchNeeded=0, nextHireDispatch=N ← COMPLIANT!
```

---

## 4. Data Sequence in a Run

### Timeline Example: 2To1 Mode Contractor

```
WEEK BEGINNING: 2025-12-01 (reviewedDate)

Prior Run State (SEED):
  Compliance=C, DirectCount=0, DispatchNeeded=0

NEW HIRES THIS WEEK (sorted):

Hire 1: 2025-12-01
  Type: Direct (Mike Johnson)
  Processing:
    DirectCount: 0 → 1
    Result: C, 1, 0, N
  Detail Row: [Hire 1 data, Compliance=C, DC=1]

Hire 2: 2025-12-02
  Type: Direct (Sarah Lee)
  Processing:
    DirectCount: 1 → 2
    Result: C, 2, 0, Y ← CAUTION LEVEL
  Detail Row: [Hire 2 data, Compliance=C, DC=2]

Hire 3: 2025-12-03
  Type: Direct (James Davis)
  Processing:
    DirectCount: 2 → 3
    Violation! directCount > allowedDirect+1
    Result: N, 3, 1, Y ← NONCOMPLIANT
  Detail Row: [Hire 3 data, Compliance=N, DC=3, DN=1]

Hire 4: 2025-12-05
  Type: Dispatch (via Union Hall)
  Processing:
    Compliance='N' AND DispatchNeeded=1
    Full Reset!
    Result: C, 0, 0, N
  Detail Row: [Hire 4 data, Compliance=C, DC=0]

Hire 5: 2025-12-08
  Type: Direct (Lisa Chen)
  Processing:
    DirectCount: 0 → 1
    Result: C, 1, 0, N
  Detail Row: [Hire 5 data, Compliance=C, DC=1]

END OF WEEK:
Final Summary Report:
  ComplianceStatus: Compliant
  DirectCount: 1
  DispatchNeeded: 0
  NextHireDispatch: N

Contractor Action: ✓ No action needed next week
```

---

## 5. Data Import & Validation Flow

```
HIRE DATA IMPORT
                ↓
         ┌─ CSV FILE ─┐
         │ (from HR)  │
         └─────┬──────┘
               ↓
    ┌─ VALIDATE EACH ROW ─┐
    │                     │
    ├─ Check required     │
    │   fields exist      │
    │                     │
    ├─ Validate IA        │
    │   Number format     │
    │                     │
    ├─ Validate Start     │
    │   Date (past/valid) │
    │                     │
    ├─ Validate Hire Type │
    │   (D or D only)     │
    │                     │
    └──┬──────────────┬───┘
       │              │
      PASS           FAIL
       │              │
       ↓              ↓
    Insert      Log Error
    into        Increment
    Table       failCount
       │              │
       ↓              ↓
  SUCCESS        ERROR REPORT
  RESULTS    {successCount: n,
             failCount: m,
             errors: [...]}


CONTRACTOR SNAPSHOT IMPORT
                ↓
         ┌─ CSV FILE ─┐
         │ (Metadata) │
         └─────┬──────┘
               ↓
    ┌─ VALIDATE EACH ROW ─┐
    │                     │
    ├─ Contractor ID      │
    │   (pad to 6 digits) │
    │                     │
    ├─ Validate Company   │
    │   Type not null     │
    │                     │
    ├─ Validate Snapshot  │
    │   WED date          │
    │                     │
    └──┬──────────────┬───┘
       │              │
      PASS           FAIL
       │              │
       ↓              ↓
    Insert      Log Error
    into        Increment
    Snapshot    failCount
    Table       
       │              │
       ↓              ↓
  SUCCESS        ERROR REPORT
  RESULTS
```

---

## 6. Contractor Filtering Logic

### Who Gets Processed in a Run?

```
┌─ START: All Contractors in Database ─┐
│                                       │
├─ Step 1: Hire-Based Selection ────────┤
│ SELECT DISTINCT contractors          │
│ FROM CMP_HireData                     │
│ WHERE ReviewedDate = @reviewDate      │
│                                       │
├─ Step 2: Prior Run Continuation ──────┤
│ UNION                                 │
│ SELECT DISTINCT contractors           │
│ FROM CMP_Reports                      │
│ WHERE RunId = @priorRunId              │
│                                       │
├─ Step 3: Remove Blacklisted ─────────┤
│ EXCLUDE contractors WHERE             │
│ Id IN (CMP_ContractorBlacklist        │
│        AND DeletedOn IS NULL)         │
│                                       │
└─ RESULT: Final Contractor List ───────┘
         ↓
    Process each
```

### Blacklist Status Meanings

```
Contractor Blacklist Record Exists

DeletedOn = NULL (Active Blacklist)
    ↓
   EXCLUDE contractor
   Don't process in run
   Don't generate reports
   ✗ Contractor blocked

DeletedOn = NOT NULL (Deleted/Inactive Blacklist)
    ↓
   INCLUDE contractor
   Process normally
   Generate reports
   ✓ Contractor active
```

---

## 7. Excel Export Structure

### Four-Tab Workbook

```
RUN EXPORT WORKBOOK: CMP_Report_RunId_XXXX.xlsx

┌─ TAB 1: "Detail" ───────────────────────────┐
│ ROWS: One per hire processed in run         │
│ COLUMNS: Hire info + compliance state after│
│         EmployerId, ContractorName,         │
│         MemberName, IANumber, HireType,     │
│         StartDate, ComplianceStatus,        │
│         DirectCount, DispatchNeeded,        │
│         NextHireDispatch, ReviewedDate      │
│ USE: Audit trail, drill-down analysis       │
└─────────────────────────────────────────────┘

┌─ TAB 2: "Report" ───────────────────────────┐
│ ROWS: One per contractor processed         │
│ COLUMNS: Final state + snapshot metadata   │
│         ContractorId, ContractorName,       │
│         ComplianceStatus,                   │
│         DirectCount, DispatchNeeded,        │
│         NextHireDispatch,                   │
│         LastWedReported, SnapshotWed,       │
│         CompanyType                         │
│ USE: Executive dashboard, compliance view  │
└─────────────────────────────────────────────┘

┌─ TAB 3: "Last 4" ───────────────────────────┐
│ ROWS: Last 4 hires per contractor (raw)    │
│ COLUMNS: Historical hiring pattern         │
│ USE: Context for hiring behavior analysis  │
└─────────────────────────────────────────────┘

┌─ TAB 4: "Recent Hire" ──────────────────────┐
│ ROWS: All hires in review period (raw)     │
│ COLUMNS: Transaction data from source HR   │
│ USE: Data verification, source validation  │
└─────────────────────────────────────────────┘
```

---

## 8. State Carryover Example

### Multi-Run Compliance Tracking

```
RUN 1 (Week of 12-01):
  ├─ Process hires
  └─ Final: Noncompliant, DC=4, DN=2, Dispatch needed

RUN 2 (Week of 12-08):
  ├─ SEED from Run 1:
  │  Start: Noncompliant, DC=4, DN=2
  │
  ├─ Process new hires this week
  │  (dispatch hire received)
  │  
  └─ Final: Dispatch reduced requirement
     Result: Noncompliant, DC=3, DN=1

RUN 3 (Week of 12-15):
  ├─ SEED from Run 2:
  │  Start: Noncompliant, DC=3, DN=1
  │
  ├─ Process new hires
  │  (dispatch hire received)
  │
  └─ Final: Requirement satisfied
     Result: Compliant, DC=0, DN=0 ✓

RUN 4 (Week of 12-22):
  ├─ SEED from Run 3:
  │  Start: Compliant, DC=0, DN=0
  │
  ├─ Fresh start with clean slate
  │
  └─ Result: Tracks new hiring cycle
```

---

## 9. Run Modes: 2To1 vs 3To1 Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                    2To1 MODE    │    3To1 MODE              │
├─────────────────────────────────────────────────────────────┤
│ Allowed Direct Hires:                                       │
│         2 per 1 dispatch   │    3 per 1 dispatch           │
│                                                              │
│ Violation Trigger:                                          │
│    3rd direct hire        │    4th direct hire             │
│                                                              │
│ Use Case:                                                   │
│    Stricter regulation    │    More flexible regulation    │
│    High-turnover roles    │    Lower-turnover roles       │
│                                                              │
│ Contractor Impact:                                          │
│    More likely to require │    More headroom for           │
│    dispatch hires         │    direct hires               │
│                                                              │
│ Compliance Difficulty:                                      │
│    Higher enforcement     │    Easier compliance           │
│    More violations        │    Fewer violations           │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Dry-Run vs Production Run

```
DRY-RUN EXECUTION
  ↓
Execute all compliance logic
  ↓
Process all hires
  ↓
Calculate all state transitions
  ↓
Prepare all database operations
  ↓
ROLLBACK transaction
(Don't write to DB)
  ↓
Return results & validation messages
  ↓
Use for: Testing, validation, preview


PRODUCTION RUN
  ↓
Execute all compliance logic
  ↓
Process all hires
  ↓
Calculate all state transitions
  ↓
Prepare all database operations
  ↓
COMMIT transaction
(Write all data to DB)
  ↓
Generate Excel export
  ↓
Return results with Run ID
  ↓
Use for: Live compliance reporting
```

---

## 11. Error Handling & Rollback

```
Run Execution Flow

Start Transaction
    ↓
    ├─ Create Run Record
    │   ├─ Insert OK → Continue
    │   └─ Error → ROLLBACK all
    ↓
    ├─ Process Contractors
    │   ├─ Process OK → Record details
    │   ├─ Database Error → ROLLBACK all
    │   └─ Validation Error → Skip, log, continue
    ↓
    ├─ Generate Reports
    │   ├─ Insert OK → Continue
    │   └─ Database Error → ROLLBACK all
    ↓
    └─ Decision Point
        ├─ Dry-Run? → ROLLBACK (discard all)
        ├─ Error occurred? → ROLLBACK (undo all)
        └─ Success? → COMMIT (save all)
            ↓
        All or nothing:
        Either all data written OR
        None written (atomic transaction)
```

---

## 12. Key Transition Moments

### When Compliance Status Changes

```
FROM COMPLIANT TO NONCOMPLIANT:
  ├─ TRIGGER: Direct hire count exceeds allowed
  ├─ ACTION: Set dispatchNeeded = 1
  ├─ IMPACT: Contractor must hire dispatch next
  └─ NOTIFICATION: Alert compliance team

FROM NONCOMPLIANT TO COMPLIANT:
  ├─ TRIGGER: Dispatch hire satisfies requirement
  ├─ ACTION: Reset directCount to 0, dispatchNeeded to 0
  ├─ IMPACT: Contractor back in good standing
  └─ NOTIFICATION: Compliance achieved

NONCOMPLIANT ESCALATION:
  ├─ TRIGGER: Additional direct hires without dispatch
  ├─ ACTION: Increment dispatchNeeded
  ├─ IMPACT: More dispatches required to remediate
  └─ NOTIFICATION: Escalation alert to leadership
```

---

## 13. Performance Indicators

### Metrics to Monitor

```
CONTRACTOR LEVEL:
  • Compliance Status: C / N
  • Direct Count: Trend over runs
  • Dispatch Needed: Outstanding requirement
  • Next Hire Requirement: Y/N

POPULATION LEVEL:
  • % Compliant Contractors: Trending metric
  • Average Direct Count: Across portfolio
  • Total Dispatch Needed: Portfolio obligation
  • Violation Frequency: By hire type or contractor type
  • Blacklist Growth: New exclusions per run
  
SYSTEM LEVEL:
  • Run Execution Time: Performance metric
  • Import Success Rate: Data quality indicator
  • Error Rate: Data issues detected
  • Report Generation Time: Responsiveness
```

---

## 14. Decision Support: When to Intervene

```
COMPLIANCE MONITORING DASHBOARD

CONTRACTOR STATUS          RECOMMENDED ACTION
────────────────────────────────────────────────────

Compliant                  ✓ Continue monitoring
(C, DC=0, DN=0)           No action needed

Caution                    ⚠ Proactive outreach
(C, DC=2 for 2To1)        Educate on requirements
(C, DC=3 for 3To1)        Next hire planning

At Risk                    🔔 Active monitoring
(N, DN=1)                 Compliance meeting
                          Dispatch requirement notice

Critical                   🚨 Intervention
(N, DN>1)                 Escalate to leadership
                          Enforcement action
                          Appeal/review option

Chronic Violation          ⛔ Blacklist review
(Multiple runs N)          Remove contract
                          Restore with conditions
```

---

**END OF VISUAL GUIDE**
