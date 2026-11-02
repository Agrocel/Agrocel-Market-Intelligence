# Agrocel MI Rule 01: Core Project Principles & Governance

All Antigravity agents participating in the development, testing, and optimization of the Agrocel Market Intelligence Platform must strictly adhere to these fundamental principles.

---

## 1. The User is the Sole Product Owner (PO)
* The user represents executive leadership and commercial decision-makers at Agrocel.
* **No assumption of approval:** No business requirement, architectural overhaul, schema modification, or feature deletion may be executed without explicit Product Owner approval.
* **Approval Gates:** Progression from Business Strategy to Development, and from QA/Optimization to Production, strictly requires PO sign-off.

---

## 2. Business Blueprint Fidelity
* The strategic foundation is defined in:
  `D:\Parthiv\Market Intelligence\Data\documents\Agrocel_Market_Intelligence_Blueprint_v1 (1).docx` (Draft v1.0, JMD Office).
* The current Bromine Market Intelligence platform represents the **Phase 2 Pilot** of a multi-phase corporate expansion.
* All feature proposals must align with the blueprint's 6-step AI pipeline:
  `Ingest` ➔ `Convert` ➔ `Structure` ➔ `Tag` ➔ `Grade` ➔ `Link` ➔ `Present`.
* Intelligence classification must conform to the 4-tier reliability hierarchy:
  * **Grade A (Trusted / Confirmed):** Verified source, official filing, or multiple corroborated reports.
  * **Grade B (Reliable):** Reputable source track record, pending cross-corroboration.
  * **Grade C (Unverified):** Single-source market observation; requires corroboration.
  * **Grade D (Rumour):** Market talk / hearsay; tracked explicitly with warning labels, never presented as confirmed fact.

---

## 3. Preservation of Working Pilot Functionality
* The existing application is active and operational:
  * **Backend:** FastAPI on `http://localhost:8000` (Uvicorn).
  * **Frontend:** React + TypeScript + Vite on `http://localhost:5173`.
  * **Databases:** MySQL (`agrocel_mi`) and local embedded Qdrant vector database (`Data/qdrant_storage/`).
* **Never break existing flows:** Do not introduce breaking changes to running endpoints, established database tables, or the unified runner (`run_app.py`).
* Before modifying any component or service, agents must inspect existing implementation files.

---

## 4. Design & Architectural Consistency
* **No Unnecessary Redesigns:** The application features an executive visual language (`frontend/src/style.css`) using *Fraunces* serif for editorial typography, *Inter* for numeric and data grids, and bespoke executive dark/light themes.
* Do not introduce extraneous styling frameworks (e.g. TailwindCSS, Bootstrap) unless explicitly ordered by the Product Owner.
* Reuse existing modular UI components (`Charts.tsx`, `Header.tsx`, `DataProvenance.tsx`, `Overview.tsx`, etc.).

---

## 5. Auditability & Decision Documentation
* Every significant architectural, algorithmic, or business decision must be documented in `.agents/TASK_STATUS.md` and the appropriate feature log.
* All data aggregations must cite source documents or database tables with timestamps and record counts.
