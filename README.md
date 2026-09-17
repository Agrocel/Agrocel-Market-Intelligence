# Agrocel Bromine Market Intelligence Pilot

A unified, high-performance market intelligence platform for the Bromine industry. It combines 3 years of Indian customs trade data, China daily spot price indices, 56 parsed Richard market intelligence reports, competitor stock price filings and shipment tracking, industry signals, and Agrocel's confidential internal commercial performance.

Built with a **React + TypeScript** single-page dashboard, a **FastAPI** backend, a normalized **MySQL** structured database, and an embedded **Qdrant** semantic vector database for local semantic retrieval without external paid API keys.

---

## Key Capabilities

1. **Trade & Custom Ingestion**: Ingests and normalizes 3,535+ Indian customs records across ports (Nhava Sheva, Mundra, Hazira, etc.) with standardized metric units (MT), USD values, and normalized country names.
2. **China Spot Price Dynamics**: 540 daily price points and monthly import records converted to standardized USD/MT.
3. **Semantic Document Retrieval**: 56 PDF & DOCX market intelligence reports (Richard reports) extracted page-by-page, chunked into 143 semantic passages, vector-indexed in an embedded local Qdrant collection (`bromine_intelligence_documents`).
4. **Competitor Radar**: Tracks listed competitors (Archean Chemical Industries `ACI`, ICL Group `ICL`, Gulf Resources `GURE`) with monthly stock price histories and competitor domestic shipment dispatches.
5. **Confidentiality-Protected Internal Performance**: Ingests 7,843 sales transaction records (AIPL + Solaris), masking customer identities and commercial terms while surfacing macro realization vs spot market arbitrage.
6. **Automated Intelligence Reports**: Instant synthesis of Weekly Digests, Monthly Reviews, Competitor Dynamics, Price & Arbitrage, and Risk/Opportunity reports with traceable citations.
7. **Hybrid Evidence-Based AI Chat**: Dual-channel retrieval fusing MySQL transactional aggregations with Qdrant vector semantic matches. Every response includes traceable source citations, reliability grades (A–D), and page references.
8. **Manual Intelligence Logger**: In-field market signals and counterparty observations can be entered with impact ratings and reliability grades.

---

## Architecture Overview

```
                          ┌────────────────────────┐
                          │   React + Vite SPA     │
                          │ (TypeScript + Recharts)│
                          └───────────┬────────────┘
                                      │ REST API / JSON
                                      ▼
                          ┌────────────────────────┐
                          │     FastAPI Backend    │
                          │   (Uvicorn / Python)   │
                          └─────┬────────────┬─────┘
                                │            │
               SQLAlchemy ORM   │            │  Semantic Search / 384-d
                                ▼            ▼
                   ┌──────────────────┐  ┌───────────────────────┐
                   │ MySQL (localhost)│  │ Local Embedded Qdrant │
                   │  `agrocel_mi`    │  │ Data/qdrant_storage/  │
                   └──────────────────┘  └───────────────────────┘
```

---

## Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── cleaning/              # Reusable idempotent ETL pipelines
│   │   │   ├── common.py          # Shared normalization, date parsing, unit conversion
│   │   │   ├── clean_trade_data.py
│   │   │   ├── clean_china_price_data.py
│   │   │   ├── clean_sales_data.py
│   │   │   ├── clean_competitor_stock_data.py
│   │   │   ├── clean_news_data.py
│   │   │   ├── ingest_documents.py
│   │   │   └── run_all_pipelines.py
│   │   ├── mappings/              # Editable business rule dictionaries
│   │   │   ├── country_aliases.json
│   │   │   ├── competitor_aliases.json
│   │   │   ├── product_aliases.json
│   │   │   ├── unit_conversion_rules.json
│   │   │   ├── hs_code_mappings.json
│   │   │   ├── reliability_defaults.json
│   │   │   └── column_mappings.json
│   │   ├── vector/                # Qdrant local vector store & dense embedding engine
│   │   │   ├── embedding_provider.py
│   │   │   └── qdrant_store.py
│   │   ├── retrieval/             # Hybrid MySQL + Vector retriever & report synthesizer
│   │   │   ├── hybrid_retriever.py
│   │   │   └── report_generator.py
│   │   ├── database.py            # MySQL engine & session factory
│   │   ├── models.py              # SQLAlchemy ORM entities
│   │   ├── services.py            # Aggregations & business logic
│   │   └── main.py                # FastAPI routes & endpoints
│   ├── tests/                     # Pytest automated test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # Main Dashboard application & modal components
│   │   └── style.css              # Custom design system (Fraunces + Inter)
│   ├── package.json
│   └── vite.config.ts
├── Data/
│   ├── Raw/                       # Original unchanged workbooks & documents
│   │   ├── Competitor's Data_23-24.xlsx
│   │   ├── China Price Data.xlsx
│   │   ├── Imports_Apl'21_Mar'22.xlsx
│   │   ├── Imports_Exports_2022-23.xlsx
│   │   ├── Imports_Exports_2023-24.xlsx
│   │   ├── Solaris Sales.xlsx
│   │   ├── Sales Data.xlsx
│   │   └── Richard Reports/       # 56 PDF/DOCX market reports
│   └── qdrant_storage/            # Persistent local Qdrant vector database
└── reports/
    └── data_inventory.md          # Comprehensive data profiling catalog
```

---

## Quick Start (Local Setup)

### 1. Unified One-Command Launch (Backend + Frontend)
You can run both services together using any of these commands from the workspace root:

- **Via Python**:
  ```powershell
  python run_app.py
  ```
- **Via Batch Script (or double-click `run_app.bat` in Windows Explorer)**:
  ```powershell
  .\run_app.bat
  ```
- **Via PowerShell**:
  ```powershell
  .\run_app.ps1
  ```

This automatically launches:
- **FastAPI Backend**: `http://localhost:8000` (API documentation at `/docs`)
- **React Frontend**: `http://localhost:5173`
- Streams colored logs from both services and cleanly terminates all child processes upon pressing `Ctrl+C`.

---

### 2. Database Setup (MySQL)
Ensure MySQL is running on `localhost:3306`:
```sql
CREATE DATABASE IF NOT EXISTS agrocel_mi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Run Ingestion Pipelines (Loads All Raw Data)
To re-run the master ingestion script to clean and populate both MySQL and the local Qdrant vector store:
```powershell
python backend/app/cleaning/run_all_pipelines.py
```

### 4. Run Backend Server & Automated Tests
To run the automated tests:
```powershell
python -m pytest tests/
```

To launch the FastAPI development server:
```powershell
uvicorn app.main:app --reload --port 8000
```
FastAPI Swagger documentation is accessible at `http://localhost:8000/docs`.

### 5. Frontend Setup
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## API Reference Highlights

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/dashboard/bromine-overview` | `GET` | High-level metrics with date range filtering (`start`, `end`) |
| `/api/prices` | `GET` | China daily spot prices & monthly imports (USD/MT) |
| `/api/trade-records` | `GET` | Indian customs trade records by direction, date, partner country |
| `/api/sales-records` | `GET` | Confidential internal sales records (customer masked) |
| `/api/competitors` | `GET` | Competitor directory with tickers and profiles |
| `/api/competitors/stocks` | `GET` | Competitor stock price time series (`ACI`, `ICL`, `GURE`) |
| `/api/intelligence-items` | `GET` | Industry signals, plant shutdowns, and market events |
| `/api/documents/search` | `GET` | Qdrant semantic vector search over 56 market reports |
| `/api/chat/query` | `POST` | Hybrid evidence-based question answering with source citations |
| `/api/reports/generate` | `POST` | Generates weekly/monthly/competitor synthesized briefs |
| `/api/intelligence/manual` | `POST` | Ingestion of manual analyst field notes |
| `/api/executive-briefs/latest` | `GET` | **Primary Executive Endpoint**: Returns latest auditable Bromine Executive Brief with all 8 structured sections, market direction, and citations |
| `/api/executive-briefs/{id}` | `GET` | Returns specific historical executive brief snapshot by ID |
| `/api/executive-briefs/history` | `GET` | Lists all historical weekly executive brief snapshots for trend comparison |
| `/api/executive-briefs/generate-weekly` | `POST` | Triggers the scheduled weekly intelligence workflow (Gemini 2.5 Pro / Causal Engine) |
| `/api/executive-briefs/{id}/citations` | `GET` | Detailed audit citations for a specific brief (Grades A-D, documents, pages) |
| `/api/executive-briefs/{id}/market-evidence` | `GET` | Time-series evidence data (China prices, customs trade, Agrocel realization, stocks) aligned with the brief snapshot |


---

## Security & Confidentiality

- **Customer Masking**: Confidential internal customer names in `sales_records` are masked (`Protected Commercial Client #ID`) to prevent exposure of sensitive commercial counterparties.
- **Audit Logging**: Every ingestion pipeline records run counts, file checksums, loaded rows, rejected rows, and duplicate skips in `ingestion_runs` and `ingestion_errors`.
- **Zero External Secrets**: Runs entirely offline/locally without requiring cloud credentials or paid LLM API keys.
