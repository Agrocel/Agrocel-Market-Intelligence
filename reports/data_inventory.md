# Agrocel Bromine Market Intelligence — Raw Data Inventory & Profiling Report

**Generated Date**: 2026-09-10 10:40:38

> [!NOTE]
> Confidential internal sales and customer information has been summarized without exposing individual sensitive commercial transactions.

## Summary of Discovered Raw Files

| Directory | File Name | File Size | Formats | Category |
| :--- | :--- | :--- | :--- | :--- |
| `AGROCEL-Sales` | `AIPL_data_Jan_26.xlsx` | 264.9 KB | .xlsx | Sales Data (Internal) |
| `AGROCEL-Sales` | `Solaris_Br2 Sale-2024-25.xlsx` | 67.6 KB | .xlsx | Sales Data (Internal) |
| `CHINA-PRICE` | `China Price Data.xlsx` | 31.9 KB | .xlsx | China Price Benchmark |
| `Compititor` | `Competitor's Data_23-24.xlsx` | 3222.0 KB | .xlsx | Competitor Shipments |
| `IMP-EXP` | `Br_IMPEX Data 2021-22.xlsx` | 3976.2 KB | .xlsx | Trade Import/Export |
| `IMP-EXP` | `Br_IMPEX Data 2022-23.xlsx` | 153.9 KB | .xlsx | Trade Import/Export |
| `IMP-EXP` | `Br_IMPEX Data 2023-24.xlsx` | 153.2 KB | .xlsx | Trade Import/Export |
| `RICHARD REPORT` | `Market Report Bromine Jun 23.docx` | 31.3 KB | .docx | Market Reports (PDF/DOCX) |
| `RICHARD REPORT` | `Market report-bromine-Jun. 2026.pdf` | 35.9 KB | .pdf | Market Reports (PDF/DOCX) |
| `RICHARD REPORT` | `bromine import data-202401-202503.xlsx` | 11.7 KB | .xlsx | Monthly Trade Statistics |

*Total Raw Files found*: 64 files (including 8 workbooks and 56 report documents).

## Detailed Workbook Profiling

### File: `Br_IMPEX Data 2021-22.xlsx`

- **Path**: `Data\Raw\IMP-EXP\Br_IMPEX Data 2021-22.xlsx`
- **Description**: Indian Customs Import/Export (FY 2021-22)
- **Target Table**: `trade_records`
- **Sheets Present**: Imports_Apl'21_Mar'22, Exports_Apl'21_Mar'22

#### Sheet: `Imports_Apl'21_Mar'22`

- **Data Rows**: 454
- **Duplicate Rows**: 0
- **Date Range**: `2021-04-01` to `2022-03-28`
- **Products Detected**: BROMINE ELEMENTAL/ISO, LIQUID BROMINE (TANK CONTAIENR), BROMINE - ELEMENTAL/BULK (TANK), BROMINE/BULK (1X20 ISO TANK CONTAINER), LIQUID BROMINE ( ISO TANK)
- **Units Detected**: 4.3000000621, 5.2500000038, 4.2451612903, 4.1029062087, 3750
- **Currencies Detected**: USD

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Column_1` | 0.2% | `Apl` | Operational Metadata |
| 2 | `DATE` | 0.2% | `2021-04-01 00:00:00` | Transaction Date |
| 3 | `HS CODE` | 0.2% | `28013020` | HSN / Tariff Code |
| 4 | `PRODUCT DESCRIPTION` | 0.2% | `LIQUID BROMINE` | Product / Commodity |
| 5 | `QUANTITY` | 0.0% | `15220` | Quantity (needs MT standard) |
| 6 | `UNIT` | 0.2% | `KGS` | Operational Metadata |
| 7 | `CIF VALUE (USD)` | 0.2% | `57836` | Trade Value |
| 8 | `UNIT PRICE (USD)` | 0.2% | `3.8` | Price / Realization |
| 9 | `ESTIMATED TARIFF` | 0.2% | `0` | HSN / Tariff Code |
| 10 | `EXCHANGE RATE(USD)` | 0.2% | `73.35` | Price / Realization |
| 11 | `ITEM RATE` | 0.2% | `3.8` | Price / Realization |
| 12 | `CURRENCY` | 0.2% | `USD` | Currency / Exchange |
| 13 | `IMPORTER CODE` | 0.2% | `70140` | Operational Metadata |
| 14 | `IMPORTER NAME` | 0.2% | `DECCAN FINE CHEMICALS (INDIA) PV...` | Entity (Customer/Competitor) |
| 15 | `IMPORTER ADDRESS` | 0.2% | `PLOT NO. 74A D.NO. 8-2-293/82/A/...` | Operational Metadata |
| 16 | `IMPORTER CITY` | 0.2% | `HYDERABAD` | Geographic / Shipping Destination |
| 17 | `IMPORTER PIN` | 14.3% | `500033` | Operational Metadata |
| 18 | `IMPORTER STATE` | 0.2% | `TELANGANA` | Operational Metadata |
| 19 | `SUPPLIER CODE` | 0.2% | `137971` | Operational Metadata |
| 20 | `SUPPLIER NAME` | 0.2% | `DEAD SEA BROMINE COMPANY LTD` | Entity (Customer/Competitor) |
| 21 | `SUPPLIER ADDRESS` | 0.2% | `N/A` | Operational Metadata |
| 22 | `SUPPLIER COUNTRY` | 0.2% | `N/A` | Operational Metadata |
| 23 | `FOREIGN PORT` | 0.2% | `ASHDOD` | Operational Metadata |
| 24 | `FOREIGN COUNTRY` | 0.2% | `ISRAEL` | Operational Metadata |
| 25 | `FOREIGN REGIONS` | 0.2% | `MIDDLE EAST` | Operational Metadata |
| 26 | `HSCODE(2 DIGIT)` | 0.2% | `28` | HSN / Tariff Code |
| 27 | `HSCODE(4 DIGIT)` | 0.2% | `2801` | HSN / Tariff Code |
| 28 | `INDIAN PORT` | 0.2% | `GOA` | Operational Metadata |
| 29 | `SHIPMENT MODE` | 0.2% | `SEA` | Operational Metadata |
| 30 | `INDIAN REGIONS` | 0.2% | `WEST` | Operational Metadata |
| 31 | `SHIPMENT PORT` | 100.0% | `None` | Operational Metadata |
| 32 | `HSCODE(6 DIGIT)` | 0.2% | `280130` | HSN / Tariff Code |
| 33 | `BCD AMOUNT(INR)` | 98.2% | `None` | Trade Value |
| 34 | `REMARK` | 100.0% | `None` | Operational Metadata |
| 35 | `INCOTERMS` | 20.5% | `CIF` | Operational Metadata |
| 36 | `TOTAL FREIGHT VALUE(FORGN CUR)` | 20.5% | `0` | Trade Value |
| 37 | `FREIGHT_CURRENCY` | 100.0% | `None` | Currency / Exchange |
| 38 | `TOTAL INSU VALUE(FORGN CUR)` | 20.5% | `0` | Trade Value |
| 39 | `INSURANCE_CURRENCY` | 100.0% | `None` | Currency / Exchange |
| 40 | `TOTAL GROSS WEIGHT` | 20.5% | `15220` | Operational Metadata |
| 41 | `GROSS WEIGHT UNIT` | 20.5% | `KGS` | Operational Metadata |
| 42 | `CUSTOM_NOTIFICATION` | 100.0% | `None` | Operational Metadata |
| 43 | `STANDARD QUANTITY` | 0.2% | `15220` | Quantity (needs MT standard) |
| 44 | `STANDARD QUANTITY UNIT` | 0.2% | `KGS` | Quantity (needs MT standard) |
| 45 | `STANDARD_UNIT_PRICE_USD` | 0.2% | `3.8` | Price / Realization |
| 46 | `MONTH` | 1.8% | `2021-APR` | Operational Metadata |
| 47 | `YEAR` | 1.8% | `2021` | Operational Metadata |
| 48 | `ROW ID` | 0.2% | `385748227` | Operational Metadata |
| 49 | `GROUP CODE` | 0.2% | `IMAPR21164147` | Operational Metadata |
| 50 | `ITEM NUMBER` | 0.2% | `1` | Operational Metadata |


#### Sheet: `Exports_Apl'21_Mar'22`

- **Data Rows**: 190
- **Duplicate Rows**: 1
- **Date Range**: `2021-04-02` to `2022-03-31`
- **Products Detected**: LIQUID BROMINE, LIQUIED BROMINE, LIQUID BROMINE (CAS NO 7726-95-6. 99.9, LIQUID BROMINE BIS MARK, BROMINE IN ISO TANK
- **Units Detected**: 5.97594, 5.46175, 12.5, 358.1944, 4.10057
- **Currencies Detected**: 368917537, 356.9144859301, 369479317, 367972491, 5TH FLOOR TOWER 2 TVH BELICIAA TOWERS 94 MRC NAGAR CHENNAI TAMILNADU

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Column_1` | 0.5% | `Apl` | Operational Metadata |
| 2 | `SBDATE` | 0.5% | `2021-04-02 00:00:00` | Transaction Date |
| 3 | `HS CODE` | 0.5% | `28013020` | HSN / Tariff Code |
| 4 | `PRODUCT DESCRIPTION` | 0.5% | `LIQUID BROMINE` | Product / Commodity |
| 5 | `QUANTITY` | 0.0% | `4005` | Quantity (needs MT standard) |
| 6 | `UNIT` | 0.5% | `KGS` | Operational Metadata |
| 7 | `FOB VALUE (INR)` | 0.5% | `2681335.38` | Trade Value |
| 8 | `UNIT PRICE (INR)` | 0.5% | `669.49697` | Price / Realization |
| 9 | `FOB VALUE (USD)` | 0.5% | `37009.46004` | Trade Value |
| 10 | `UNIT PRICE (USD)` | 0.5% | `9.24081` | Price / Realization |
| 11 | `EXCHANGE RATE(USD)` | 0.5% | `72.45` | Price / Realization |
| 12 | `VALUE_INV_CURR` | 0.5% | `38047.5` | Identifier/Index |
| 13 | `ITEM RATE_INV_CURR` | 0.5% | `9.5` | Identifier/Index |
| 14 | `INVOICE CURRENCY` | 0.5% | `USD` | Identifier/Index |
| 15 | `DRAWBACK` | 0.5% | `26813.35` | Operational Metadata |
| 16 | `EXPORTER CODE` | 0.5% | `31005` | Operational Metadata |
| 17 | `EXPORTER NAME` | 0.5% | `MODY CHEMI PHARMA LTD` | Entity (Customer/Competitor) |
| 18 | `EXPORTER ADDRESS` | 1.1% | `UNIT NO.407/408/409 SWASTIK DISA...` | Operational Metadata |
| 19 | `EXPORTER CITY` | 0.5% | `MUMBAI` | Geographic / Shipping Destination |
| 20 | `EXPORTER PIN` | 4.7% | `400086` | Operational Metadata |
| 21 | `EXPORTER STATE` | 1.6% | `MAHARASHTRA` | Operational Metadata |
| 22 | `CONSIGNEE CODE` | 0.5% | `154188` | Operational Metadata |
| 23 | `CONSIGNEE NAME` | 0.5% | `JSC FARMAK` | Entity (Customer/Competitor) |
| 24 | `CONSIGNEE ADDRESS` | 0.5% | `NOT KNOWN` | Operational Metadata |
| 25 | `CONSIGNEE COUNTRY` | 0.5% | `NOT KNOWN` | Operational Metadata |
| 26 | `DESTINATION_PORT` | 0.5% | `ODESSA` | Operational Metadata |
| 27 | `DESTINATION_COUNTRY` | 0.5% | `UKRAINE` | Operational Metadata |
| 28 | `FOREIGN REGIONS` | 0.5% | `EUROPE` | Operational Metadata |
| 29 | `INVOICE NUMBER` | 0.5% | `MCPL/EX/03` | Identifier/Index |
| 30 | `ITEM NUMBER` | 0.5% | `1` | Operational Metadata |
| 31 | `CHA NAME` | 14.2% | `N.A.` | Entity (Customer/Competitor) |
| 32 | `CHA PAN` | 1.6% | `N.A.` | Operational Metadata |
| 33 | `IEC` | 24.2% | `0302063188` | Operational Metadata |
| 34 | `IEC CODE` | 6.3% | `302063188` | Operational Metadata |
| 35 | `HSCODE(2 DIGIT)` | 6.3% | `28` | HSN / Tariff Code |
| 36 | `HSCODE(4 DIGIT)` | 6.3% | `2801` | HSN / Tariff Code |
| 37 | `INDIAN PORT` | 6.3% | `JNPT` | Operational Metadata |
| 38 | `SHIPMENT MODE` | 6.3% | `SEA` | Operational Metadata |
| 39 | `INDIAN REGIONS` | 5.3% | `WEST` | Operational Metadata |
| 40 | `HS_CODE(6 DIGIT)` | 5.3% | `280130` | HSN / Tariff Code |
| 41 | `REMARK` | 76.8% | `None` | Operational Metadata |
| 42 | `INCOTERMS` | 7.9% | `CIF` | Operational Metadata |
| 43 | `TOTAL FREIGHT VALUE_FORGN CUR` | 30.5% | `1000` | Trade Value |
| 44 | `FREIGHT_CURRENCY` | 7.9% | `USD` | Currency / Exchange |
| 45 | `TOTAL INSU VALUE_ FORGN CUR` | 7.9% | `38` | Trade Value |
| 46 | `INSURANCE_CURRENCY` | 30.5% | `USD` | Currency / Exchange |
| 47 | `TOTAL GROSS WEIGHT` | 30.5% | `7763` | Operational Metadata |
| 48 | `GROSS WEIGHT UNIT` | 44.2% | `KGS` | Operational Metadata |
| 49 | `STANDARD QUANTITY` | 36.8% | `4005` | Quantity (needs MT standard) |
| 50 | `STANDARD QUANTITY UNIT` | 36.8% | `KGS` | Quantity (needs MT standard) |
| 51 | `FOB_VALUE_TOTAL(INR)` | 100.0% | `None` | Trade Value |
| 52 | `AMOUNT IN FOREIGN CURRENCY` | 100.0% | `None` | Trade Value |
| 53 | `Column_53` | 54.2% | `None` | Operational Metadata |
| 54 | `Column_54` | 54.2% | `None` | Operational Metadata |


### File: `Br_IMPEX Data 2022-23.xlsx`

- **Path**: `Data\Raw\IMP-EXP\Br_IMPEX Data 2022-23.xlsx`
- **Description**: Indian Customs Import/Export (FY 2022-23)
- **Target Table**: `trade_records`
- **Sheets Present**: Br_Imports_Apl'22-Mar'23, Br_Exports_Apl'22_Mar'23

#### Sheet: `Br_Imports_Apl'22-Mar'23`

- **Data Rows**: 377
- **Duplicate Rows**: 1
- **Date Range**: `2022-04-01` to `2023-03-30`
- **Products Detected**: LIQUID BROMINE (PONO.14300417), BROMINE (TANK CONTAINER), BROMINE ELEMENTAL/ISO, BROMINE - (ISO TANK CONTAINER), LIQUID BROMINE ( ISO TANK)
- **Units Detected**: 2366346.6, 1723856, 405.0375, 2279851.3, 6.7
- **Currencies Detected**: 30400, 23820, USD, 24170, 218840

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `MONTH` | 0.3% | `APL` | Operational Metadata |
| 2 | `DATE` | 0.3% | `2022-04-11 00:00:00` | Transaction Date |
| 3 | `HS CODE` | 0.3% | `28013020` | HSN / Tariff Code |
| 4 | `PRODUCT DESCRIPTION` | 0.3% | `BROMINE/BULK (ISO TANK CONTAINER)` | Product / Commodity |
| 5 | `QUANTITY` | 0.0% | `17500` | Quantity (needs MT standard) |
| 6 | `UNIT` | 0.3% | `KGS` | Operational Metadata |
| 7 | `CIF VALUE (USD)` | 0.3% | `122500` | Trade Value |
| 8 | `UNIT PRICE IN INR` | 0.3% | `537.6` | Price / Realization |
| 9 | `UNIT PRICE (USD)` | 1.1% | `7` | Price / Realization |
| 10 | `ESTIMATED TARIFF` | 0.3% | `0` | HSN / Tariff Code |
| 11 | `EXCHANGE RATE(USD)` | 0.5% | `76.8` | Price / Realization |
| 12 | `ITEM RATE` | 0.5% | `7` | Price / Realization |
| 13 | `CURRENCY` | 0.5% | `USD` | Currency / Exchange |
| 14 | `IMPORTER CODE` | 0.3% | `33402` | Operational Metadata |
| 15 | `IMPORTER NAME` | 0.5% | `ASTEC LIFESCIENCES LTD` | Entity (Customer/Competitor) |
| 16 | `IMPORTER ADDRESS` | 0.5% | `ELITE SQUARE 7TH FLOOR 274 PERIN...` | Operational Metadata |
| 17 | `IMPORTER CITY` | 1.6% | `MUMBAI` | Geographic / Shipping Destination |
| 18 | `IMPORTER PIN` | 1.9% | `400001` | Operational Metadata |
| 19 | `IMPORTER STATE` | 0.5% | `MAHARASHTRA` | Operational Metadata |
| 20 | `SUPPLIER CODE` | 0.3% | `180257` | Operational Metadata |
| 21 | `SUPPLIER NAME` | 1.1% | `LANXESS SALES NETHERLANDS B V` | Entity (Customer/Competitor) |
| 22 | `SUPPLIER ADDRESS` | 1.1% | `N/A` | Operational Metadata |
| 23 | `SUPPLIER COUNTRY` | 0.3% | `N/A` | Operational Metadata |
| 24 | `FOREIGN PORT` | 0.3% | `FELIXSTOWE` | Operational Metadata |
| 25 | `FOREIGN COUNTRY` | 0.5% | `ISRAEL` | Operational Metadata |
| 26 | `FOREIGN REGIONS` | 1.1% | `MIDDLE EAST` | Operational Metadata |
| 27 | `HSCODE(2 DIGIT)` | 1.1% | `28` | HSN / Tariff Code |
| 28 | `HSCODE(4 DIGIT)` | 0.3% | `2801` | HSN / Tariff Code |
| 29 | `INDIAN PORT` | 0.5% | `JNPT` | Operational Metadata |
| 30 | `SHIPMENT MODE` | 0.5% | `SEA` | Operational Metadata |
| 31 | `INDIAN REGIONS` | 91.0% | `WEST` | Operational Metadata |
| 32 | `SHIPMENT PORT` | 10.1% | `None` | Operational Metadata |
| 33 | `HSCODE(6 DIGIT)` | 90.2% | `280130` | HSN / Tariff Code |
| 34 | `BCD AMOUNT(INR)` | 100.0% | `None` | Trade Value |
| 35 | `REMARK` | 25.2% | `None` | Operational Metadata |
| 36 | `INCOTERMS` | 17.0% | `CIF` | Operational Metadata |
| 37 | `TOTAL FREIGHT VALUE(FORGN CUR)` | 91.8% | `0` | Trade Value |
| 38 | `FREIGHT_CURRENCY` | 25.2% | `None` | Currency / Exchange |
| 39 | `TOTAL INSU VALUE(FORGN CUR)` | 91.8% | `0` | Trade Value |
| 40 | `INSURANCE_CURRENCY` | 25.2% | `None` | Currency / Exchange |
| 41 | `TOTAL GROSS WEIGHT` | 17.0% | `17500` | Operational Metadata |
| 42 | `GROSS WEIGHT UNIT` | 91.8% | `KGS` | Operational Metadata |
| 43 | `CUSTOM_NOTIFICATION` | 10.1% | `None` | Operational Metadata |
| 44 | `STANDARD QUANTITY` | 1.1% | `17500` | Quantity (needs MT standard) |
| 45 | `STANDARD QUANTITY UNIT` | 1.1% | `KGS` | Quantity (needs MT standard) |
| 46 | `STANDARD_UNIT_PRICE_USD` | 1.1% | `7` | Price / Realization |
| 47 | `MONTH` | 1.1% | `2022-APRIL` | Operational Metadata |
| 48 | `YEAR` | 1.1% | `2022` | Operational Metadata |
| 49 | `ROW ID` | 1.1% | `452631117` | Operational Metadata |
| 50 | `GROUP CODE` | 1.1% | `IMAPR22275517` | Operational Metadata |
| 51 | `ITEM NUMBER` | 91.0% | `1` | Operational Metadata |


#### Sheet: `Br_Exports_Apl'22_Mar'23`

- **Data Rows**: 231
- **Duplicate Rows**: 0
- **Date Range**: `2022-04-07` to `2023-03-10`
- **Products Detected**: LIQUID BROMINE, LIQUID BROMINE (BATCH NO.: 02101122), LIQUID BROMINE (INV), LIQUID BROMINE (CAS NO: 7726-95-6. 99.9, LIQUID BROMINE (CAS NO 7726-95-6. 99.9
- **Units Detected**: 23360, 499.656822, 17770, 426.209773, 5.39301
- **Currencies Detected**: 4.8240321504, 7.7879628175, 4680, 90502, 3894

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Month` | 0.4% | `Apl` | Operational Metadata |
| 2 | `DATE` | 0.4% | `2022-04-16 00:00:00` | Transaction Date |
| 3 | `HS CODE` | 0.4% | `28013020` | HSN / Tariff Code |
| 4 | `PRODUCT DESCRIPTION` | 0.4% | `BROMINE IN ISO TANK` | Product / Commodity |
| 5 | `QUANTITY` | 0.0% | `23330` | Quantity (needs MT standard) |
| 6 | `UNIT` | 0.4% | `KGS` | Operational Metadata |
| 7 | `FOB VALUE (USD)` | 0.4% | `155219.70706` | Trade Value |
| 8 | `UNIT PRICE (USD)` | 0.4% | `6.65322` | Price / Realization |
| 9 | `UNIT PRICE (INR)` | 0.4% | `499.656822` | Price / Realization |
| 10 | `EXCHANGE RATE(USD)` | 0.4% | `75.1` | Price / Realization |
| 11 | `ITEM RATE` | 0.4% | `6.7` | Price / Realization |
| 12 | `CURRENCY` | 0.4% | `USD` | Currency / Exchange |
| 13 | `EXPORTER CODE` | 0.4% | `12147` | Operational Metadata |
| 14 | `EXPORTER NAME` | 0.4% | `AGROCEL INDUSTRIES PVT LTD` | Entity (Customer/Competitor) |
| 15 | `EXPORTER ADDRESS` | 0.4% | `4TH FLOOR, DOCTOR HOUSE,,OPP.GEN...` | Operational Metadata |
| 16 | `EXPORTER CITY` | 6.1% | `N/A` | Geographic / Shipping Destination |
| 17 | `EXPORTER PIN` | 1.7% | `None` | Operational Metadata |
| 18 | `EXPORTER STATE` | 0.4% | `GUJARAT` | Operational Metadata |
| 19 | `CONSIGNEE CODE` | 0.4% | `5838919` | Operational Metadata |
| 20 | `CONSIGNEE NAME` | 0.4% | `SHANDONG RIXING NEW MATERIAL CO L` | Entity (Customer/Competitor) |
| 21 | `CONSIGNEE ADDRESS` | 0.4% | `N/A` | Operational Metadata |
| 22 | `CONSIGNEE COUNTRY` | 0.4% | `N/A` | Operational Metadata |
| 23 | `DESTINATION_PORT` | 0.4% | `QINGDAO` | Operational Metadata |
| 24 | `DESTINATION_COUNTRY` | 0.4% | `CHINA` | Operational Metadata |
| 25 | `FOREIGN REGIONS` | 0.4% | `ASIA` | Operational Metadata |
| 26 | `HSCODE(2 DIGIT)` | 0.4% | `28` | HSN / Tariff Code |
| 27 | `HSCODE(4 DIGIT)` | 0.4% | `2801` | HSN / Tariff Code |
| 28 | `INDIAN PORT` | 0.4% | `MUNDRA` | Operational Metadata |
| 29 | `SHIPMENT MODE` | 0.4% | `SEA` | Operational Metadata |
| 30 | `INDIAN REGIONS` | 0.4% | `WEST` | Operational Metadata |
| 31 | `HS_CODE(6 DIGIT)` | 88.7% | `280130` | HSN / Tariff Code |
| 32 | `REMARK` | 14.7% | `None` | Operational Metadata |
| 33 | `INCOTERMS` | 4.8% | `CIF` | Operational Metadata |
| 34 | `TOTAL FREIGHT VALUE(FORGN CUR)` | 4.8% | `1050` | Trade Value |
| 35 | `FREIGHT_CURRENCY` | 4.8% | `USD` | Currency / Exchange |
| 36 | `TOTAL INSU VALUE FORGN CUR` | 4.8% | `35` | Trade Value |
| 37 | `INSURANCE CURRENCY` | 5.2% | `USD` | Currency / Exchange |
| 38 | `TOTAL GROSS WEIGHT` | 4.8% | `30445` | Operational Metadata |
| 39 | `GROSS WEIGHT UNIT` | 0.4% | `KGS` | Operational Metadata |
| 40 | `STANDARD QUANTITY` | 0.4% | `23330` | Quantity (needs MT standard) |
| 41 | `STANDARD QUANTITY UNIT` | 90.0% | `KGS` | Quantity (needs MT standard) |
| 42 | `AMOUNT IN FOREIGN CURRENCY` | 10.4% | `None` | Trade Value |
| 43 | `STANDARD UNIT PRICE USD` | 0.9% | `None` | Price / Realization |
| 44 | `ITEM NUMBER` | 0.9% | `None` | Operational Metadata |
| 45 | `MONTH` | 0.9% | `None` | Operational Metadata |
| 46 | `YEAR` | 0.9% | `None` | Operational Metadata |
| 47 | `ROW ID` | 0.9% | `None` | Operational Metadata |
| 48 | `GROUP CODE` | 90.5% | `None` | Operational Metadata |


### File: `Br_IMPEX Data 2023-24.xlsx`

- **Path**: `Data\Raw\IMP-EXP\Br_IMPEX Data 2023-24.xlsx`
- **Description**: Indian Customs Import/Export (FY 2023-24)
- **Target Table**: `trade_records`
- **Sheets Present**: Br_Imports_Apl'23_Mar'24, Br_Exports_Apl'23_Mar'24

#### Sheet: `Br_Imports_Apl'23_Mar'24`

- **Data Rows**: 509
- **Duplicate Rows**: 1
- **Date Range**: `2023-04-01` to `2024-03-31`
- **Products Detected**: LIQUID BROMINE (PONO.14300417), BROMINE - ISO TANK, BROMINE ELEMENT, LIQUID BROMINE ( ISO TANK ), BROMINE ELEMENTAL/ISO
- **Units Detected**: 5.7424998036803, 2.7716507747, 4.0000000012, 4.0167064439141, 2.4014302741
- **Currencies Detected**: USD

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Month` | 0.2% | `Apl` | Operational Metadata |
| 2 | `DATE` | 0.2% | `2023-04-06 00:00:00` | Transaction Date |
| 3 | `HS CODE` | 0.2% | `28013020` | HSN / Tariff Code |
| 4 | `PRODUCT DESCRIPTION` | 0.2% | `BROMINE- ELEMENTAL/BULK(LIQUID B...` | Product / Commodity |
| 5 | `QUANTITY` | 0.0% | `17540` | Quantity (needs MT standard) |
| 6 | `UNIT` | 0.2% | `KGS` | Operational Metadata |
| 7 | `CIF VALUE (USD)` | 0.2% | `96470` | Trade Value |
| 8 | `UNIT PRICE (USD)` | 0.2% | `5.5` | Price / Realization |
| 9 | `ESTIMATED TARIFF` | 3.5% | `0` | HSN / Tariff Code |
| 10 | `EXCHANGE RATE(USD)` | 0.2% | `83.7` | Price / Realization |
| 11 | `ITEM RATE` | 0.2% | `5.5` | Price / Realization |
| 12 | `CURRENCY` | 0.2% | `USD` | Currency / Exchange |
| 13 | `IMPORTER CODE` | 0.8% | `430210` | Operational Metadata |
| 14 | `IMPORTER NAME` | 0.2% | `INTECH ORGANICS LTD` | Entity (Customer/Competitor) |
| 15 | `IMPORTER ADDRESS` | 2.2% | `543D PACE CITY-II SECTOR-37` | Operational Metadata |
| 16 | `IMPORTER CITY` | 2.9% | `GURGAON` | Geographic / Shipping Destination |
| 17 | `IMPORTER PIN` | 3.7% | `122001` | Operational Metadata |
| 18 | `IMPORTER STATE` | 3.1% | `HARYANA` | Operational Metadata |
| 19 | `SUPPLIER CODE` | 3.3% | `347158` | Operational Metadata |
| 20 | `SUPPLIER NAME` | 0.6% | `ALBEMARLE EUROPE SPRL` | Entity (Customer/Competitor) |
| 21 | `SUPPLIER ADDRESS` | 3.5% | `9 RUE DU BOSQUET LOUVAIN LA NEUV...` | Operational Metadata |
| 22 | `SUPPLIER COUNTRY` | 3.5% | `BELGIUM` | Operational Metadata |
| 23 | `FOREIGN PORT` | 0.8% | `ABOA` | Operational Metadata |
| 24 | `FOREIGN COUNTRY` | 0.8% | `JORDAN` | Operational Metadata |
| 25 | `FOREIGN REGIONS` | 0.8% | `MIDDLE EAST` | Operational Metadata |
| 26 | `HSCODE(2 DIGIT)` | 3.3% | `28` | HSN / Tariff Code |
| 27 | `HSCODE(4 DIGIT)` | 3.3% | `2801` | HSN / Tariff Code |
| 28 | `INDIAN PORT` | 0.4% | `MUNDRA` | Operational Metadata |
| 29 | `SHIPMENT MODE` | 3.3% | `SEA` | Operational Metadata |
| 30 | `INDIAN REGIONS` | 3.3% | `WEST` | Operational Metadata |
| 31 | `SHIPMENT PORT` | 100.0% | `None` | Operational Metadata |
| 32 | `HSCODE(6 DIGIT)` | 3.3% | `280130` | HSN / Tariff Code |
| 33 | `BCD AMOUNT(INR)` | 100.0% | `None` | Trade Value |
| 34 | `REMARK` | 100.0% | `None` | Operational Metadata |
| 35 | `INCOTERMS` | 32.6% | `CIF` | Operational Metadata |
| 36 | `TOTAL FREIGHT VALUE(FORGN CUR)` | 32.8% | `0` | Trade Value |
| 37 | `FREIGHT_CURRENCY` | 100.0% | `None` | Currency / Exchange |
| 38 | `TOTAL INSU VALUE(FORGN CUR)` | 32.8% | `0` | Trade Value |
| 39 | `INSURANCE_CURRENCY` | 100.0% | `None` | Currency / Exchange |
| 40 | `TOTAL GROSS WEIGHT` | 32.8% | `48810` | Operational Metadata |
| 41 | `GROSS WEIGHT UNIT` | 32.8% | `KGS` | Operational Metadata |
| 42 | `CUSTOM_NOTIFICATION` | 100.0% | `None` | Operational Metadata |
| 43 | `STANDARD QUANTITY` | 3.3% | `17540` | Quantity (needs MT standard) |
| 44 | `STANDARD QUANTITY UNIT` | 3.3% | `KGS` | Quantity (needs MT standard) |
| 45 | `STANDARD_UNIT_PRICE_USD` | 3.5% | `5.5` | Price / Realization |
| 46 | `MONTH` | 3.5% | `2023-APR` | Operational Metadata |
| 47 | `YEAR` | 3.5% | `2023` | Operational Metadata |
| 48 | `ROW ID` | 3.5% | `520362096` | Operational Metadata |
| 49 | `GROUP CODE` | 3.5% | `IMAPR23212701` | Operational Metadata |
| 50 | `ITEM NUMBER` | 3.5% | `2` | Operational Metadata |


#### Sheet: `Br_Exports_Apl'23_Mar'24`

- **Data Rows**: 112
- **Duplicate Rows**: 0
- **Date Range**: `2023-04-13` to `2024-03-28`
- **Products Detected**: LABORATORY CHEMICALS BROMINE LIQUID, LIQUID BROMINE, BROMINE ( CAS NO.7726-95-6), LIQUID BROMINE (INV), BROMINE IN ISO TANK
- **Units Detected**: 2.59361, 2.5947734104, 2.69394, 2.74452, 2.773628686
- **Currencies Detected**: USD, EUR

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `DATE` | 0.9% | `2023-04-13 00:00:00` | Transaction Date |
| 2 | `HS CODE` | 0.9% | `28013020` | HSN / Tariff Code |
| 3 | `PRODUCT DESCRIPTION` | 0.9% | `LIQUID BROMINE (CAS NO 7726-95-6...` | Product / Commodity |
| 4 | `QUANTITY` | 0.0% | `154310` | Quantity (needs MT standard) |
| 5 | `UNIT` | 0.9% | `KGS` | Operational Metadata |
| 6 | `FOB VALUE (USD)` | 0.9% | `461023.42787` | Trade Value |
| 7 | `UNIT PRICE (USD)` | 0.9% | `2.98764` | Price / Realization |
| 8 | `EXCHANGE RATE(USD)` | 0.9% | `81.1` | Price / Realization |
| 9 | `ITEM RATE` | 0.9% | `3` | Price / Realization |
| 10 | `CURRENCY` | 0.9% | `USD` | Currency / Exchange |
| 11 | `EXPORTER CODE` | 0.9% | `27333` | Operational Metadata |
| 12 | `EXPORTER NAME` | 0.9% | `ARCHEAN CHEMICAL INDUSTRIES LTD` | Entity (Customer/Competitor) |
| 13 | `EXPORTER ADDRESS` | 0.9% | `5TH FLOOR TOWER 2 TVH BELICIAA T...` | Operational Metadata |
| 14 | `EXPORTER CITY` | 0.9% | `CHENNAI` | Geographic / Shipping Destination |
| 15 | `EXPORTER PIN` | 6.2% | `600028` | Operational Metadata |
| 16 | `EXPORTER STATE` | 5.4% | `TAMIL NADU` | Operational Metadata |
| 17 | `CONSIGNEE CODE` | 0.9% | `4855407` | Operational Metadata |
| 18 | `CONSIGNEE NAME` | 0.9% | `SHANDONG MATE TECH CO LTD` | Entity (Customer/Competitor) |
| 19 | `CONSIGNEE ADDRESS` | 0.9% | `NO 1222 BOHAI ROAD SHOUGUANG BOH...` | Operational Metadata |
| 20 | `CONSIGNEE COUNTRY` | 0.9% | `CHINA` | Operational Metadata |
| 21 | `DESTINATION_PORT` | 0.9% | `QINGDAO` | Operational Metadata |
| 22 | `DESTINATION_COUNTRY` | 0.9% | `CHINA` | Operational Metadata |
| 23 | `FOREIGN REGIONS` | 0.9% | `ASIA` | Operational Metadata |
| 24 | `HSCODE(2 DIGIT)` | 0.9% | `28` | HSN / Tariff Code |
| 25 | `HSCODE(4 DIGIT)` | 0.9% | `2801` | HSN / Tariff Code |
| 26 | `INDIAN PORT` | 0.9% | `MUNDRA` | Operational Metadata |
| 27 | `SHIPMENT MODE` | 0.9% | `SEA` | Operational Metadata |
| 28 | `INDIAN REGIONS` | 0.9% | `WEST` | Operational Metadata |
| 29 | `HS_CODE(6 DIGIT)` | 0.9% | `280130` | HSN / Tariff Code |
| 30 | `REMARK` | 97.3% | `None` | Operational Metadata |
| 31 | `INCOTERMS` | 10.7% | `CIF` | Operational Metadata |
| 32 | `TOTAL FREIGHT VALUE(FORGN CUR)` | 10.7% | `1820` | Trade Value |
| 33 | `FREIGHT_CURRENCY` | 10.7% | `USD` | Currency / Exchange |
| 34 | `TOTAL INSU VALUE FORGN CUR` | 10.7% | `90` | Trade Value |
| 35 | `INSURANCE CURRENCY` | 11.6% | `USD` | Currency / Exchange |
| 36 | `TOTAL GROSS WEIGHT` | 10.7% | `202512` | Operational Metadata |
| 37 | `GROSS WEIGHT UNIT` | 10.7% | `KGS` | Operational Metadata |
| 38 | `STANDARD QUANTITY` | 0.9% | `154310` | Quantity (needs MT standard) |
| 39 | `STANDARD QUANTITY UNIT` | 0.9% | `KGS` | Quantity (needs MT standard) |
| 40 | `AMOUNT IN FOREIGN CURRENCY` | 100.0% | `None` | Trade Value |
| 41 | `STANDARD UNIT PRICE USD` | 0.9% | `2.9876445329` | Price / Realization |
| 42 | `ITEM NUMBER` | 1.8% | `1` | Operational Metadata |
| 43 | `MONTH` | 0.9% | `2023-APR` | Operational Metadata |
| 44 | `YEAR` | 0.9% | `2023` | Operational Metadata |
| 45 | `ROW ID` | 0.9% | `465207140` | Operational Metadata |
| 46 | `GROUP CODE` | 0.9% | `EXAPR23627493` | Operational Metadata |


### File: `China Price Data.xlsx`

- **Path**: `Data\Raw\CHINA-PRICE\China Price Data.xlsx`
- **Description**: China Domestic & Export Bromine Prices
- **Target Table**: `market_prices`
- **Sheets Present**: China Price Data

#### Sheet: `China Price Data`

- **Data Rows**: 540
- **Duplicate Rows**: 0
- **Date Range**: `2021-09-01` to `2024-01-05`

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Bromine` | 0.0% | `Bromine` | Operational Metadata |
| 2 | `Chemical` | 0.0% | `Chemical` | Operational Metadata |
| 3 | `6763.27` | 0.0% | `6767.36` | Operational Metadata |
| 4 | `2021-09-08 00:00:00` | 0.0% | `2021-09-09 00:00:00` | Operational Metadata |
| 5 | `499224.0118` | 0.0% | `497617.5155` | Operational Metadata |
| 6 | `Column_6` | 99.8% | `None` | Operational Metadata |
| 7 | `499.22` | 0.0% | `497.62` | Operational Metadata |
| 8 | `2021-09-01 00:00:00` | 0.0% | `2021-09-01 00:00:00` | Operational Metadata |
| 9 | `6.76` | 0.0% | `6.77` | Operational Metadata |
| 10 | `73.814` | 0.0% | `73.532` | Operational Metadata |


### File: `bromine import data-202401-202503.xlsx`

- **Path**: `Data\Raw\RICHARD REPORT\bromine import data-202401-202503.xlsx`
- **Description**: China Monthly Bromine Import Statistics
- **Target Table**: `market_prices / trade_records`
- **Sheets Present**: Sheet1

#### Sheet: `Sheet1`

- **Data Rows**: 17
- **Duplicate Rows**: 0
- **Date Range**: `None` to `None`

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Time` | 0.0% | `Jan.2024` | Operational Metadata |
| 2 | `Quantity(mt)` | 0.0% | `6702.45` | Quantity (needs MT standard) |
| 3 | `Compared to last month` | 5.9% | `-0.0902` | Operational Metadata |
| 4 | `Amount (USD)` | 0.0% | `17652079` | Trade Value |
| 5 | `Average Price` | 0.0% | `2633.68` | Price / Realization |
| 6 | `Compared to last month` | 5.9% | `0.0336` | Operational Metadata |
| 7 | `Total imported quantity` | 5.9% | `6702.45` | Quantity (needs MT standard) |


### File: `Competitor's Data_23-24.xlsx`

- **Path**: `Data\Raw\Compititor\Competitor's Data_23-24.xlsx`
- **Description**: Archean & Satyesh Domestic & Export Movements
- **Target Table**: `competitor_shipments / trade_records`
- **Sheets Present**: Sales Data_Domestic, Exports

#### Sheet: `Sales Data_Domestic`

- **Data Rows**: 1,260
- **Duplicate Rows**: 20
- **Date Range**: `None` to `None`
- **Products Detected**: Liquid Bromine, LIQUID BROMINE, LIQUID BROMINE 3 KG, LIQUID BROMINE LOOSE, DRY BROMINE

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Months` | 0.1% | `APRIL` | HSN / Tariff Code |
| 2 | `Supplier Name` | 0.1% | `ARCHEAN CHEMICAL INDUSTRIES LIMI...` | Entity (Customer/Competitor) |
| 3 | `Customer's Name` | 0.1% | `INTECH ORGANICS LTD` | Entity (Customer/Competitor) |
| 4 | `To Place & Pin` | 0.1% | `North GOA / 403513` | Geographic / Shipping Destination |
| 5 | `Doc No. & Dt.` | 0.1% | `4005052 - 22/04/2023` | Identifier/Index |
| 6 | `Assess Val.` | 0.1% | `7611860` | Trade Value |
| 7 | `Tax Val.` | 3.3% | `1370135` | Trade Value |
| 8 | `HSN` | 0.1% | `28013020` | HSN / Tariff Code |
| 9 | `HSN Desc.` | 0.1% | `LIQUID BROMINE` | HSN / Tariff Code |
| 10 | `Qty(Kgs)` | 82.2% | `None` | Quantity (needs MT standard) |
| 11 | `Basic Rs./kg.` | 82.2% | `None` | Operational Metadata |
| 12 | `Qty(Kgs)` | 18.0% | `18000` | Quantity (needs MT standard) |
| 13 | `Basic Rs./kg.` | 18.1% | `422.8811111111111` | Operational Metadata |
| 14 | `Qty(Kgs)` | 26.6% | `22000` | Quantity (needs MT standard) |
| 15 | `Basic Rs./kg.` | 19.1% | `345.99363636363637` | Operational Metadata |
| 16 | `Qty(Kgs)` | 26.7% | `24000` | Quantity (needs MT standard) |
| 17 | `Basic Rs./kg.` | 26.7% | `317.16083333333336` | Operational Metadata |
| 18 | `Column_18` | 0.4% | `ISO` | Operational Metadata |
| 19 | `Column_19` | 100.0% | `None` | Operational Metadata |


#### Sheet: `Exports`

- **Data Rows**: 150
- **Duplicate Rows**: 71
- **Date Range**: `None` to `None`
- **Products Detected**: LIQUID BROMINE, BROMINE

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Months` | 0.0% | `APRIL` | HSN / Tariff Code |
| 2 | `Supplier Name` | 0.0% | `ARCHEAN CHEMICAL INDUSTRIES LIMI...` | Entity (Customer/Competitor) |
| 3 | `Customer's Name` | 0.0% | `URP / UNIBROM CORP.` | Entity (Customer/Competitor) |
| 4 | `To Place & Pin` | 0.0% | `P.R.CHINA / 999999` | Geographic / Shipping Destination |
| 5 | `Doc No. & Dt.` | 0.0% | `6003002 - 15/04/2023` | Identifier/Index |
| 6 | `Assess Val.` | 0.0% | `49556589` | Trade Value |
| 7 | `Tax Val.` | 0.0% | `0` | Trade Value |
| 8 | `HSN` | 0.0% | `28013020` | HSN / Tariff Code |
| 9 | `HSN Desc.` | 0.0% | `BROMINE` | HSN / Tariff Code |
| 10 | `Qty(Kgs)` | 90.0% | `204850` | Quantity (needs MT standard) |
| 11 | `Basic Rs./kg.` | 94.0% | `241.91647058823528` | Operational Metadata |
| 12 | `Qty(Kgs)` | 97.3% | `None` | Quantity (needs MT standard) |
| 13 | `Basic Rs./kg.` | 98.0% | `None` | Operational Metadata |
| 14 | `Qty(Kgs)` | 97.3% | `None` | Quantity (needs MT standard) |
| 15 | `Basic Rs./kg.` | 98.0% | `None` | Operational Metadata |
| 16 | `Column_16` | 14.7% | `ISO` | Operational Metadata |
| 17 | `Column_17` | 98.7% | `None` | Operational Metadata |
| 18 | `Column_18` | 98.7% | `None` | Operational Metadata |
| 19 | `Column_19` | 100.0% | `None` | Operational Metadata |
| 20 | `Column_20` | 100.0% | `None` | Operational Metadata |
| 21 | `Column_21` | 100.0% | `None` | Operational Metadata |


### File: `Solaris_Br2 Sale-2024-25.xlsx`

- **Path**: `Data\Raw\AGROCEL-Sales\Solaris_Br2 Sale-2024-25.xlsx`
- **Description**: Solaris/Agrocel Sales Transactions (FY 2024-25)
- **Target Table**: `sales_records (confidential)`
- **Sheets Present**: Sheet1

#### Sheet: `Sheet1`

- **Data Rows**: 618
- **Duplicate Rows**: 0
- **Date Range**: `2024-08-22` to `2025-03-31`
- **Products Detected**: Bromine (Br2), Ratadia, Bromine
- **Units Detected**: TON, MT

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Column_1` | 0.2% | `Apl` | Operational Metadata |
| 2 | `Invoice No` | 0.2% | `2415000001` | Identifier/Index |
| 3 | `Invoice Dt` | 0.2% | `01.04.2024` | Identifier/Index |
| 4 | `BillT` | 0.2% | `ZUIV` | Operational Metadata |
| 5 | `Plant Desc` | 0.2% | `Ratadia` | Product / Commodity |
| 6 | `Plnt` | 0.2% | `RD01` | Operational Metadata |
| 7 | `Ship-To-Party Code` | 0.2% | `10003491` | Entity (Customer/Competitor) |
| 8 | `Ship-To-Party Name` | 0.2% | `NACL SPEC-CHEM LIMITED` | Entity (Customer/Competitor) |
| 9 | `Sold-To-Party Code` | 0.2% | `10000324` | Entity (Customer/Competitor) |
| 10 | `Sold-To-Party Name` | 0.2% | `NACL INDUSTRIES LIMITED` | Entity (Customer/Competitor) |
| 11 | `Agent Code` | 82.0% | `None` | Operational Metadata |
| 12 | `Agent Name` | 82.0% | `None` | Entity (Customer/Competitor) |
| 13 | `Mat. Desc.` | 0.2% | `Bromine (Br2)` | Product / Commodity |
| 14 | `Inv Qty.` | 0.0% | `17.4` | Identifier/Index |
| 15 | `Inv Qty UOM.` | 0.2% | `MT` | Identifier/Index |
| 16 | `Basic Rate` | 0.2% | `200000` | Price / Realization |
| 17 | `Basic Value` | 0.0% | `3480000` | Trade Value |
| 18 | `Invoice Value` | 0.0% | `4106400` | Identifier/Index |


### File: `AIPL_data_Jan_26.xlsx`

- **Path**: `Data\Raw\AGROCEL-Sales\AIPL_data_Jan_26.xlsx`
- **Description**: Historic AIPL Sales Transactions (2011-2026)
- **Target Table**: `sales_records (confidential)`
- **Sheets Present**: Sheet1

#### Sheet: `Sheet1`

- **Data Rows**: 7,242
- **Duplicate Rows**: 788
- **Date Range**: `2011-04-01` to `2026-01-31`
- **Products Detected**: Br (P), BR, Bromine (Br2), BR (P), Bromine (Br2)

**Column Specifications & Quality Metrics**:

| # | Column Header | Null % | Sample Value | Suspected Meaning & Target Mapping |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `INV. NO.` | 8.3% | `1` | Identifier/Index |
| 2 | `DATE` | 0.0% | `2011-04-01 00:00:00` | Transaction Date |
| 3 | `BUYER` | 0.0% | `TAGROS CHEMICALS INDIA LTD.` | Entity (Customer/Competitor) |
| 4 | `PRODUCT` | 2.1% | `Br` | Product / Commodity |
| 5 | `QTY.` | 0.0% | `8550` | Quantity (needs MT standard) |
| 6 | `RATE` | 0.0% | `207` | Price / Realization |


## Unstructured Document Profiling (Richard Market Reports)

- **Location**: `Data/Raw/RICHARD REPORT/`
- **Total Documents**: 56 reports (52 PDF documents, 4 DOCX documents)
- **Coverage**: Monthly & bi-monthly bromine industry reviews spanning November 2023 through June 2026
- **Key Topics Covered**: China domestic pricing trends, Shandong production run rates, environmental inspections, Dead Sea / ICL supply conditions, India import parity, downstream flame retardant and agrochemical demand, shipping freight
- **Target Storage**: MySQL `source_documents` & `document_chunks`; vectors indexed in local Qdrant collection `bromine_intelligence_documents`

## Data Cleaning & Standardisation Strategy

1. **Unit Standardisation**: Convert all quantities (KGS, LBS) into Metric Tonnes (MT = KGS / 1000). Retain original values for audit.

2. **Currency & Valuation Standardisation**: Retain explicit ISO currency codes (USD, INR, CNY/RMB). Do not convert currencies without exchange rate source.

3. **Average Price Rule**: `average_price_usd_per_mt = trade_value_usd / quantity_mt` computed only when both fields are valid and non-zero.

4. **Controlled Aliases**: Map country names (e.g., 'P.R.CHINA' -> 'China', 'USA' -> 'United States') and competitor names ('ARCHEAN CHEMICAL INDUSTRIES LIMITED' -> 'Archean Chemical') using editable JSON mappings.

5. **Confidentiality Fence**: Mark internal sales records as confidential, masking customer entities in public demonstration endpoints.
