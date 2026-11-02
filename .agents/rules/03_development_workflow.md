# Agrocel MI Rule 03: Multi-Agent Development Workflow & Quality Gates

This rule defines the mandatory lifecycle for introducing any new feature, analytical enhancement, or bug fix into the Agrocel Market Intelligence platform.

---

## 1. Development Lifecycle Sequence

```
[1. Business Review] (Agent 1: Business Strategist)
        │
        ▼
[2. Product Owner Approval] (User Sign-off)  ◄── MANDATORY GATE
        │
        ▼
[3. Development] (Agent 2: Full-Stack Developer)
        │
        ▼
[4. QA Testing] (Agent 3: QA Testing Engineer)
        │
        ├─► [FAIL / Bugs] ───► [Bug Fixing by Developer] ───► (Re-test)
        │
        ▼ [PASS]
[5. Performance Optimization] (Agent 4: Performance Optimizer)
        │
        ▼
[6. Regression Testing] (Agent 3: QA Testing Engineer)
        │
        ▼
[7. Final PO Approval] (User Sign-off) ◄── FINAL PRODUCTION GATE
```

---

## 2. Stage Transition Criteria & Deliverables

### Stage 1: Business Review (Agent 1: Business Strategist)
* **Objective:** Assess business necessity, evaluate management utility, question vanity charts, and structure requirements.
* **Deliverable:** Feature Specification Document (`PRD-<FEATURE_ID>.md`).
* **Required Contents:**
  * Business Objective & Blueprint Alignment (Section of Blueprint v1).
  * Impacted Dashboard Views & User Personas (Leadership, Sales, Procurement).
  * Data Requirements (Source Tables, Units, Frequencies).
  * Measurable Acceptance Criteria (Given / When / Then).
  * Priority (P0: Critical, P1: High, P2: Enhancement).

### Stage 2: Product Owner Approval (User)
* **The Gate:** Development CANNOT proceed until the Product Owner explicitly approves the PRD.
* Status in `.agents/TASK_STATUS.md` is updated to `APPROVED_BY_PO`.

### Stage 3: Development (Agent 2: Full-Stack Developer)
* **Objective:** Implement approved requirements using existing architecture, models, and design tokens.
* **Deliverable:** Development Summary (`DEV-<FEATURE_ID>.md`).
* **Required Contents:**
  * Files modified / added (with clickable markdown file links).
  * API endpoints introduced/updated with request/response payloads.
  * UI components reused and styling classes applied.
  * Local test results confirming service health.

### Stage 4: QA Testing (Agent 3: QA Testing Engineer)
* **Objective:** Validate numerical calculations, test edge cases (empty states, missing FX rates, date boundaries), check responsiveness, and verify data masking.
* **Deliverable:** QA Audit Report (`QA-<FEATURE_ID>.md`).
* **Outcomes:**
  * `PASS`: Proceed to Performance Optimization.
  * `FAIL`: Log reproducible bug tickets, assign back to Agent 2 (Full-Stack Developer), and loop back through Stage 3.

### Stage 5: Performance Optimization (Agent 4: Performance Optimizer)
* **Objective:** Profile API response times, eliminate N+1 queries, audit React re-renders, optimize database indices, and reduce bundle payloads without altering functional output.
* **Deliverable:** Performance Benchmark Report (`PERF-<FEATURE_ID>.md`).
* **Required Contents:**
  * Baseline vs. Optimized latency (milliseconds).
  * Query count reduction and payload size comparison.
  * Proof that calculation values and UI behavior remain identical.

### Stage 6: Regression Testing (Agent 3: QA Testing Engineer)
* **Objective:** Verify that optimizations introduced by Agent 4 caused zero side effects, calculation drifts, or interface regressions.
* **Deliverable:** Final QA Verification stamp in `.agents/TASK_STATUS.md`.

### Stage 7: Final PO Approval (User)
* **Objective:** Product Owner reviews the working feature, verifies business value, and grants final authorization to merge/deploy into production.
