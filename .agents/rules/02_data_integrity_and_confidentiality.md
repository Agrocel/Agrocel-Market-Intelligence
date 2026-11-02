# Agrocel MI Rule 02: Data Integrity & Commercial Confidentiality

Data accuracy and strict corporate confidentiality are non-negotiable standards for the Agrocel Market Intelligence Platform.

---

## 1. Zero-Tolerance for Data Fabrication
* **Never invent market numbers:** Agents must NEVER hallucinate or fabricate trade volumes, competitor pricing, domestic realisations, shipment quantities, or financial ratios.
* **Absence of Data Protocol:** If a historical data point, CIF price, or competitor metric is missing, the agent/system must explicitly record or display:
  `DATA_UNAVAILABLE` or `INSUFFICIENT_OBSERVATIONS`.
* Mock data, placeholder dummy values, or simulated curves are strictly prohibited in production APIs and calculation pipelines.

---

## 2. Strict Unit & Currency Discipline
* Every numerical figure displayed in the UI, stored in the database, or returned by an API must explicitly declare its unit and currency:
  * **Units:** Metric Tons (`MT`), Kilograms (`kg`), Percentage (`%`), Thousand Metric Tons (`kMT`).
  * **Currencies:** `USD`, `INR`, `RMB` (or `CNY`).
  * **Rate Benchmarks:** `USD/MT`, `INR/kg`, `RMB/MT`.
* **Standard Conversion Formulas:**
  * Metric Weight: $1\text{ MT} = 1{,}000\text{ kg}$.
  * Foreign Exchange Rates: Must use official RBI reference rates or explicit historical date-matched currency exchange rates (via `backend/app/services/currency_service.py`).
  * China Spot Price: SunSirs RMB/MT prices converted to USD/MT with documented VAT/tax logic ($13\%$ VAT exclusion/inclusion explicitly labeled).

---

## 3. Commercial Confidentiality & Entity Masking
* **Internal Sales & Commercial Terms:** Agrocel's internal sales transactions (from AIPL and Solaris ERPs) contain sensitive customer relationships, negotiated price discounts, and contract terms.
* **Customer Masking Rules:**
  * In executive dashboards and cross-functional views, customer names and individual buyer entities must be masked or anonymized (e.g., `Customer [MASKED]` or categorized by industry segment: *Agrochemicals, Pharmaceuticals, Flame Retardants, Water Treatment*).
  * Consignee identities and specific invoice numbers must not be exposed in public or general leadership views without role-based access.
* **Separation of Internal vs. External:**
  * External Market Parity (CIF India, China Spot, Competitor Filings) is public/subscription intelligence.
  * Internal Realization is proprietary Agrocel commercial performance. The delta (**Domestic Price Headroom**) must be treated as sensitive intelligence.

---

## 4. Methodological Traceability
* Every metric card, chart series, and synthesized AI report must expose provenance:
  * **Source Identification:** Customs Bill of Entry, SunSirs Observation, SEC/BSE Competitor Filing, USGS Mineral Commodity Summary, or Richard Report excerpt.
  * **Record Date / Period:** Explicit timestamp or fiscal period (e.g., `FY 2023-24 Q3`, `Oct 2026`).
  * **Calculation Method:** Plain-English definition of the calculation formula (e.g., `Sum(Trade Value USD) / Sum(Quantity MT)`).
  * **Data Status:** `VERIFIED`, `CALCULATED`, or `ESTIMATED`.
