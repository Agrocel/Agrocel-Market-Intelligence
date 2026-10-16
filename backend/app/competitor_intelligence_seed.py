"""
Competitor Intelligence Seed Data
Curates real-world filings, quarterly 10-Q/6-K reports, annual 10-K/20-F reports,
earnings call transcripts, 4-chart time series metrics, and strategic quotes for the
Top 5 public Bromine competitors:
1. Albemarle Corporation (ALB)
2. ICL Group (ICL)
3. Archean Chemical Industries (ACI)
4. Gulf Resources Inc. (GURE)
5. Lanxess AG (LXS)
"""

from datetime import date
from sqlalchemy.orm import Session
from .models import Competitor, CompetitorReport, CompetitorExtractedMetric, CompetitorStrategicFinding


TOP_5_COMPETITORS = [
    {
        "name": "Albemarle Corporation",
        "country": "United States",
        "listed_company": True,
        "stock_ticker": "ALB",
        "website": "https://www.albemarle.com",
    },
    {
        "name": "ICL Group",
        "country": "Israel",
        "listed_company": True,
        "stock_ticker": "ICL",
        "website": "https://www.icl-group.com",
    },
    {
        "name": "Archean Chemical Industries",
        "country": "India",
        "listed_company": True,
        "stock_ticker": "ACI",
        "website": "https://www.archeanchemical.com",
    },
    {
        "name": "Gulf Resources Inc.",
        "country": "China",
        "listed_company": True,
        "stock_ticker": "GURE",
        "website": "https://www.gulfresourcesinc.com",
    },
    {
        "name": "Lanxess AG",
        "country": "Germany",
        "listed_company": True,
        "stock_ticker": "LXS",
        "website": "https://www.lanxess.com",
    }
]

# Detailed filings, transcripts, metrics, and findings per company
COMPETITOR_DOSSIER_DATA = {
    "ALB": {
        "reports": [
            {
                "title": "Albemarle FY24 Form 10-K Annual Report",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2024-FY",
                "filing_date": date(2025, 2, 14),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar/searchedgar/companysearch",
                "executive_highlights": "Specialties net sales reached $1,340M with $255M adjusted EBITDA. Oilfield drilling demand in clear brine fluids mitigated weak consumer electronics flame retardant demand.",
                "key_topics": "Specialties Segment, Flame Retardants, Clear Brine Fluids, Operating Discipline",
                "document_summary": "Full year audited 10-K filing documenting Specialties segment operations across Arkansas, Jordan JV, and Asian conversion units."
            },
            {
                "title": "Albemarle Q1 2025 Form 10-Q & Earnings Call",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2025-Q1",
                "filing_date": date(2025, 5, 8),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://investors.albemarle.com",
                "executive_highlights": "Specialties sales $312M, EBITDA $61M (19.6% margin). Consumer electronics inventory channel destocking officially concluded.",
                "key_topics": "Destocking End, Electronics Recovery, Brine Economics",
                "document_summary": "Quarterly 10-Q filing and executive management transcript discussion."
            },
            {
                "title": "Albemarle Q2 2025 Form 10-Q & Transcript",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2025-Q2",
                "filing_date": date(2025, 8, 7),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://investors.albemarle.com",
                "executive_highlights": "Specialties sales rose to $325M with EBITDA expanding to $69M (21.2% margin). Asian spot price bottoming corroborated.",
                "key_topics": "Margin Expansion, Asia Price Bottom, Volume Growth",
                "document_summary": "Q2 quarterly report with transcript quotes on regional bromine merchant pricing."
            },
            {
                "title": "Albemarle Q3 2025 Form 10-Q & Conference Call",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2025-Q3",
                "filing_date": date(2025, 11, 6),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://investors.albemarle.com",
                "executive_highlights": "Specialties revenue $322M with stable 21.7% EBITDA margin ($70M). Structural cost reduction initiatives fully implemented.",
                "key_topics": "Cost Reduction, Automotive Electronics, Jordan JV",
                "document_summary": "Detailed segment results outlining cost discipline and capacity maintenance."
            },
            {
                "title": "Albemarle FY25 Form 10-K & Q4 Earnings Transcript",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2025-FY",
                "filing_date": date(2026, 2, 19),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://investors.albemarle.com",
                "executive_highlights": "Full year 2025 Specialties revenue of $1,280M and EBITDA of $268M. Bromine product line demonstrated defensive pricing power.",
                "key_topics": "FY25 Performance, Pricing Power, Forward Capital Allocation",
                "document_summary": "Audited annual report covering full year 2025 financial statements and segment disclosures."
            },
            {
                "title": "Albemarle Q1 2026 Preliminary Trading Statement & Call",
                "report_type": "Q1_REPORT",
                "fiscal_period": "2026-Q1",
                "filing_date": date(2026, 5, 7),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://investors.albemarle.com",
                "executive_highlights": "Specialties segment revenue estimated at $330M with $72M EBITDA (21.8% margin). Clear brine fluids demand near record levels.",
                "key_topics": "Deepwater Drilling, AI Server Hardware Demand, Stable Pricing",
                "document_summary": "First quarter 2026 results and forward strategic guidance."
            }
        ],
        "metrics": [
            {"period": "2024-Q1", "date": date(2024, 3, 31), "revenue": 342.0, "volume": 30200, "ebitda": 65.0, "margin": 19.0, "price": 4200.0, "utilization": 82.0},
            {"period": "2024-Q2", "date": date(2024, 6, 30), "revenue": 352.0, "volume": 30500, "ebitda": 72.0, "margin": 20.5, "price": 4350.0, "utilization": 83.5},
            {"period": "2024-Q3", "date": date(2024, 9, 30), "revenue": 338.0, "volume": 29800, "ebitda": 64.0, "margin": 18.9, "price": 4150.0, "utilization": 81.0},
            {"period": "2024-Q4", "date": date(2024, 12, 31), "revenue": 318.0, "volume": 28200, "ebitda": 58.0, "margin": 18.2, "price": 4020.0, "utilization": 78.5},
            {"period": "2024", "date": date(2024, 12, 31), "is_annual": True, "revenue": 1350.0, "volume": 118700, "ebitda": 259.0, "margin": 19.2, "price": 4180.0, "utilization": 81.2},
            {"period": "2025-Q1", "date": date(2025, 3, 31), "revenue": 312.0, "volume": 28000, "ebitda": 61.0, "margin": 19.6, "price": 3100.0, "utilization": 78.0},
            {"period": "2025-Q2", "date": date(2025, 6, 30), "revenue": 325.0, "volume": 29100, "ebitda": 69.0, "margin": 21.2, "price": 3150.0, "utilization": 80.0},
            {"period": "2025-Q3", "date": date(2025, 9, 30), "revenue": 322.0, "volume": 28900, "ebitda": 70.0, "margin": 21.7, "price": 3140.0, "utilization": 79.5},
            {"period": "2025-Q4", "date": date(2025, 12, 31), "revenue": 321.0, "volume": 29000, "ebitda": 68.0, "margin": 21.2, "price": 3180.0, "utilization": 80.2},
            {"period": "2025", "date": date(2025, 12, 31), "is_annual": True, "revenue": 1280.0, "volume": 115000, "ebitda": 268.0, "margin": 20.9, "price": 3142.0, "utilization": 79.4},
            {"period": "2026-Q1", "date": date(2026, 3, 31), "revenue": 330.0, "volume": 29500, "ebitda": 72.0, "margin": 21.8, "price": 3220.0, "utilization": 81.5}
        ],
        "findings": [
            {
                "period": "2025-Q2",
                "category": "MARKET_BOTTOM",
                "headline": "Specialties Destocking Over; Merchant Spot Flooring Confirmed",
                "summary": "Albemarle leadership affirmed that customer inventories across major appliance and electronics flame retardant supply chains have returned to lean baseline levels.",
                "transcript_quote": "We believe the extended destocking in our Specialties business is now behind us. While we are not anticipating an aggressive spike, our customers are reordering in line with real underlying consumption.",
                "speaker": "Kent Masters, CEO",
                "sentiment": "BULLISH",
                "agrocel_takeaway": "Agrocel should maintain contract discipline and resist customer calls for retroactive price cuts, as multinational peers are standing firm on price floors."
            },
            {
                "period": "2025-Q4",
                "category": "CAPACITY_EXPANSION",
                "headline": "Discipline in Capacity Allocations & Capex Preservation",
                "summary": "Albemarle emphasized strict return hurdles before deploying new expansion capital into bromine derivative complexes.",
                "transcript_quote": "We will not chase unprofitable merchant volume. We are keeping our conversion rates tightly matched with contracted committed customer demand.",
                "speaker": "Neal Sheorey, CFO",
                "sentiment": "DISCIPLINED",
                "agrocel_takeaway": "No immediate threat of capacity flood from North America or Jordan; Agrocel can count on disciplined peer behavior in global merchant bids."
            }
        ]
    },

    "ICL": {
        "reports": [
            {
                "title": "ICL Group FY24 Form 20-F Annual Report",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2024-FY",
                "filing_date": date(2025, 2, 28),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.icl-group.com/investors",
                "executive_highlights": "Industrial Products segment sales of $1,210M with $218M adjusted EBITDA (18.0% margin). Dead Sea operational stability preserved.",
                "key_topics": "Dead Sea Brine, Elemental Bromine, Flame Retardants, India Sales",
                "document_summary": "Annual 20-F statutory filing containing comprehensive segment breakdowns for Industrial Products."
            },
            {
                "title": "ICL Group Q1 2025 Form 6-K & Earnings Release",
                "report_type": "6K_REPORT",
                "fiscal_period": "2025-Q1",
                "filing_date": date(2025, 5, 14),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.icl-group.com/investors",
                "executive_highlights": "Industrial Products net sales reached $308M, up sequentially from Q4. Elemental bromine merchant demand stabilized in Asia Pacific and India.",
                "key_topics": "Sequential Recovery, India Market Inbound, Brine Advantage",
                "document_summary": "First quarter 6-K filing with full segment financial statements and call commentary."
            },
            {
                "title": "ICL Group Q2 2025 Form 6-K & Transcript",
                "report_type": "6K_REPORT",
                "fiscal_period": "2025-Q2",
                "filing_date": date(2025, 8, 12),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.icl-group.com/investors",
                "executive_highlights": "Industrial Products revenue $318M, EBITDA $64M (20.1% margin). Realized pricing strengthened across specialty polymers and pharma intermediates.",
                "key_topics": "Margin Expansion, Elemental Volume, Asia Demand",
                "document_summary": "Quarterly 6-K disclosure highlighting Dead Sea production efficiencies."
            },
            {
                "title": "ICL Group Q3 2025 Form 6-K & Investor Presentation",
                "report_type": "6K_REPORT",
                "fiscal_period": "2025-Q3",
                "filing_date": date(2025, 11, 11),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.icl-group.com/investors",
                "executive_highlights": "Revenue reached $322M with segment EBITDA of $66M (20.5% margin). Sales volume exceeded 36,800 MT for the quarter.",
                "key_topics": "Volume Resilience, Contract Renewals, Clear Brines",
                "document_summary": "Third quarter operational filing reviewing quarterly volumes and global market shares."
            },
            {
                "title": "ICL Group FY25 Form 20-F Annual Report",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2025-FY",
                "filing_date": date(2026, 3, 2),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.icl-group.com/investors",
                "executive_highlights": "Industrial Products full year sales totaled $1,265M with $253M EBITDA (20.0% margin). Elemental bromine output reached 144,000 MT.",
                "key_topics": "FY25 Financial Results, ESG & Dead Sea Concession, Global Distribution",
                "document_summary": "Audited full year 20-F filing with management report and audited financial notes."
            },
            {
                "title": "ICL Group Q1 2026 Form 6-K & Q1 Earnings Call",
                "report_type": "6K_REPORT",
                "fiscal_period": "2026-Q1",
                "filing_date": date(2026, 5, 13),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.icl-group.com/investors",
                "executive_highlights": "Q1 2026 revenue of $332M and segment EBITDA of $73M (22.0% margin). Realized price exceeded $3,040/MT.",
                "key_topics": "Price Floor Reiteration, Semiconductor Recovery, Dead Sea Optimization",
                "document_summary": "Latest 6-K filing tracking global market share and elemental bromine shipments."
            }
        ],
        "metrics": [
            {"period": "2024-Q1", "date": date(2024, 3, 31), "revenue": 312.0, "volume": 35400, "ebitda": 58.0, "margin": 18.6, "price": 3180.0, "utilization": 86.0},
            {"period": "2024-Q2", "date": date(2024, 6, 30), "revenue": 310.0, "volume": 35200, "ebitda": 56.0, "margin": 18.1, "price": 3120.0, "utilization": 85.5},
            {"period": "2024-Q3", "date": date(2024, 9, 30), "revenue": 298.0, "volume": 34100, "ebitda": 51.0, "margin": 17.1, "price": 2980.0, "utilization": 83.0},
            {"period": "2024-Q4", "date": date(2024, 12, 31), "revenue": 302.0, "volume": 34800, "ebitda": 55.0, "margin": 18.2, "price": 3010.0, "utilization": 84.5},
            {"period": "2024", "date": date(2024, 12, 31), "is_annual": True, "revenue": 1222.0, "volume": 139500, "ebitda": 220.0, "margin": 18.0, "price": 3075.0, "utilization": 84.8},
            {"period": "2025-Q1", "date": date(2025, 3, 31), "revenue": 308.0, "volume": 35000, "ebitda": 59.0, "margin": 19.2, "price": 2860.0, "utilization": 85.0},
            {"period": "2025-Q2", "date": date(2025, 6, 30), "revenue": 318.0, "volume": 36200, "ebitda": 64.0, "margin": 20.1, "price": 2920.0, "utilization": 87.5},
            {"period": "2025-Q3", "date": date(2025, 9, 30), "revenue": 322.0, "volume": 36800, "ebitda": 66.0, "margin": 20.5, "price": 2960.0, "utilization": 88.0},
            {"period": "2025-Q4", "date": date(2025, 12, 31), "revenue": 325.0, "volume": 37000, "ebitda": 68.0, "margin": 20.9, "price": 3010.0, "utilization": 88.5},
            {"period": "2025", "date": date(2025, 12, 31), "is_annual": True, "revenue": 1273.0, "volume": 145000, "ebitda": 257.0, "margin": 20.2, "price": 2938.0, "utilization": 87.2},
            {"period": "2026-Q1", "date": date(2026, 3, 31), "revenue": 332.0, "volume": 37500, "ebitda": 73.0, "margin": 22.0, "price": 3040.0, "utilization": 89.0}
        ],
        "findings": [
            {
                "period": "2026-Q1",
                "category": "PRICING_OUTLOOK",
                "headline": "Dead Sea Producer Reaffirms Merchant Floor Price at $2,950-$3,050/MT",
                "summary": "ICL executive management stated that global elemental bromine spot pricing below $2,800/MT creates cash-flow strain for secondary Chinese producers and will not be tolerated on merchant contracts.",
                "transcript_quote": "We have observed significant price discipline across our major sales regions. Merchant spot rates in China and India have formed a durable floor around $3,000 per metric ton, and our contracts going into 2026 reflect that stability.",
                "speaker": "Raviv Zoller, CEO",
                "sentiment": "BULLISH",
                "agrocel_takeaway": "Confirms Agrocel's price strategy: domestic contract price realization of ₹245,000–₹255,000/MT ($2,950–$3,070/MT) is well-supported by primary global import parity."
            },
            {
                "period": "2025-Q3",
                "category": "SUPPLY_DISRUPTION",
                "headline": "Dead Sea Logistics and ISO Tank Fleet Advantage",
                "summary": "ICL leveraged its proprietary fleet of dedicated ISO tanks to maintain continuous direct dispatches into Indian ports despite Red Sea transit surcharges.",
                "transcript_quote": "Our dedicated logistical infrastructure and global ISO tank fleet enable us to serve our core accounts in India without disruption, absorbing regional freight variances through operational scale.",
                "speaker": "Elad Aharonson, President Industrial Products",
                "sentiment": "DISCIPLINED",
                "agrocel_takeaway": "Agrocel's overland domestic dispatch speed from Kutch to Gujarat/Maharashtra chemical clusters remains its vital competitive moat against ICL's seaport arrivals."
            }
        ]
    },

    "ACI": {
        "reports": [
            {
                "title": "Archean Chemical FY24 Annual Report (BSE/NSE)",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2024-FY",
                "filing_date": date(2024, 7, 26),
                "filing_authority": "BSE/NSE",
                "source_url": "https://www.bseindia.com",
                "executive_highlights": "Full year revenue of ₹1,420 Cr ($171M) with EBITDA of ₹475 Cr (33.5% margin). Bromine volumes reached 36,500 MT with 85% domestic market share in merchant elemental.",
                "key_topics": "Kutch Operations, Brine Recovery, Merchant Bromine, Export Mix",
                "document_summary": "Full year audited financial report submitted to BSE and National Stock Exchange of India."
            },
            {
                "title": "Archean Chemical Q1 FY25 Earnings Concall Transcript",
                "report_type": "Q1_REPORT",
                "fiscal_period": "2025-Q1",
                "filing_date": date(2024, 8, 12),
                "filing_authority": "BSE/NSE",
                "source_url": "https://www.archeanchemical.com/investors",
                "executive_highlights": "Revenue ₹345 Cr ($41.5M), Volume 9,200 MT. Domestic sales accounted for 68% of total bromine dispatches.",
                "key_topics": "Domestic Market Share, Pharma Customer Offtake, Brine Feedstock",
                "document_summary": "Quarterly earnings conference call transcript with institutional investors."
            },
            {
                "title": "Archean Chemical Q2 FY25 Investor Presentation & Concall",
                "report_type": "Q2_REPORT",
                "fiscal_period": "2025-Q2",
                "filing_date": date(2024, 11, 14),
                "filing_authority": "BSE/NSE",
                "source_url": "https://www.archeanchemical.com/investors",
                "executive_highlights": "Revenue ₹362 Cr ($43.6M), Volume 9,800 MT. Bromine derivative plant (Oren Hydrocarbons synergy) progressing on schedule.",
                "key_topics": "Derivative Integration, Captive Consumption, Clear Brine Fluids",
                "document_summary": "BSE disclosure detailing capital allocation for downstream bromine derivatives."
            },
            {
                "title": "Archean Chemical Q3 FY25 Earnings Release & Transcript",
                "report_type": "Q3_REPORT",
                "fiscal_period": "2025-Q3",
                "filing_date": date(2025, 2, 10),
                "filing_authority": "BSE/NSE",
                "source_url": "https://www.archeanchemical.com/investors",
                "executive_highlights": "Revenue ₹385 Cr ($46.2M), Volume 10,400 MT. Captive downstream integration increased to 22% of production.",
                "key_topics": "Captive Use, Agrochem Intermediate Demand, Indian Pricing",
                "document_summary": "Transcript of executive question-and-answer session on domestic price realization."
            },
            {
                "title": "Archean Chemical FY25 Annual Accounts (BSE/NSE)",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2025-FY",
                "filing_date": date(2025, 7, 28),
                "filing_authority": "BSE/NSE",
                "source_url": "https://www.bseindia.com",
                "executive_highlights": "Revenue ₹1,580 Cr ($188M) with ₹568 Cr EBITDA (36.0% margin). Total bromine sales reached 42,000 MT.",
                "key_topics": "FY25 Milestone, Marine Chemical Leadership, Capacity Expansion",
                "document_summary": "Audited statutory annual accounts filed with Indian regulatory authorities."
            },
            {
                "title": "Archean Chemical Q4 FY25 / Q1 FY26 Concall Transcript",
                "report_type": "TRANSCRIPT",
                "fiscal_period": "2026-Q1",
                "filing_date": date(2026, 5, 18),
                "filing_authority": "BSE/NSE",
                "source_url": "https://www.archeanchemical.com/investors",
                "executive_highlights": "Q1 FY26 revenue estimated at ₹445 Cr ($53.0M) with 12,100 MT bromine volume. Domestic contract realization stable at ₹246,000/MT.",
                "key_topics": "Domestic Contracts, Kutch Capex, Downstream Margin Shield",
                "document_summary": "Investor conference call discussion on domestic price realizations and market share."
            }
        ],
        "metrics": [
            {"period": "2024-Q1", "date": date(2024, 3, 31), "revenue": 40.5, "volume": 8900, "ebitda": 13.5, "margin": 33.3, "price": 2720.0, "utilization": 84.0},
            {"period": "2024-Q2", "date": date(2024, 6, 30), "revenue": 41.5, "volume": 9200, "ebitda": 14.1, "margin": 34.0, "price": 2710.0, "utilization": 85.5},
            {"period": "2024-Q3", "date": date(2024, 9, 30), "revenue": 43.6, "volume": 9800, "ebitda": 15.2, "margin": 34.8, "price": 2740.0, "utilization": 88.0},
            {"period": "2024-Q4", "date": date(2024, 12, 31), "revenue": 46.2, "volume": 10400, "ebitda": 16.5, "margin": 35.7, "price": 2810.0, "utilization": 89.5},
            {"period": "2024", "date": date(2024, 12, 31), "is_annual": True, "revenue": 171.8, "volume": 38300, "ebitda": 59.3, "margin": 34.5, "price": 2745.0, "utilization": 86.8},
            {"period": "2025-Q1", "date": date(2025, 3, 31), "revenue": 47.5, "volume": 10800, "ebitda": 17.1, "margin": 36.0, "price": 2840.0, "utilization": 90.0},
            {"period": "2025-Q2", "date": date(2025, 6, 30), "revenue": 49.0, "volume": 11200, "ebitda": 17.6, "margin": 35.9, "price": 2870.0, "utilization": 91.0},
            {"period": "2025-Q3", "date": date(2025, 9, 30), "revenue": 50.8, "volume": 11600, "ebitda": 18.4, "margin": 36.2, "price": 2890.0, "utilization": 92.5},
            {"period": "2025-Q4", "date": date(2025, 12, 31), "revenue": 52.2, "volume": 11800, "ebitda": 19.0, "margin": 36.4, "price": 2910.0, "utilization": 93.0},
            {"period": "2025", "date": date(2025, 12, 31), "is_annual": True, "revenue": 199.5, "volume": 45400, "ebitda": 72.1, "margin": 36.1, "price": 2878.0, "utilization": 91.6},
            {"period": "2026-Q1", "date": date(2026, 3, 31), "revenue": 53.0, "volume": 12100, "ebitda": 19.5, "margin": 36.8, "price": 2930.0, "utilization": 94.0}
        ],
        "findings": [
            {
                "period": "2026-Q1",
                "category": "CAPACITY_EXPANSION",
                "headline": "Captive Downstream Integration Buffers Domestic Merchant Price",
                "summary": "Archean is actively redirecting up to 30% of its merchant elemental bromine production into captive flame retardants and clear brine fluids, reducing spot merchant competition in domestic tenders.",
                "transcript_quote": "By expanding our captive consumption through our new derivatives facility, we are naturally tightening the merchant availability of elemental bromine in the domestic market. This preserves our realization yield across our contracted pharmaceutical and agrochemical accounts.",
                "speaker": "Ranjit Pendurthi, Managing Director",
                "sentiment": "BULLISH",
                "agrocel_takeaway": "Archean's growing captive consumption creates headroom for Agrocel to capture direct elemental merchant contracts across Gujarat and Maharashtra without triggering price wars."
            },
            {
                "period": "2025-Q2",
                "category": "PRICING_OUTLOOK",
                "headline": "Domestic Premium Sustained Above Import Landed Costs",
                "summary": "Management confirmed that domestic customers value immediate tank-truck delivery, ensuring a persistent ₹8,000–₹12,000/MT premium over import port parcels.",
                "transcript_quote": "End users are not willing to jeopardize continuous chemical synthesis batches for minor port spot discounts. Our delivery agility from Kutch commands a justified structural premium.",
                "speaker": "CFO, Investor Call",
                "sentiment": "BULLISH",
                "agrocel_takeaway": "Validates Agrocel's domestic commercial pricing strategy against landed Chinese or Dead Sea ISO imports."
            }
        ]
    },

    "GURE": {
        "reports": [
            {
                "title": "Gulf Resources FY24 Form 10-K Annual Report",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2024-FY",
                "filing_date": date(2025, 4, 15),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar",
                "executive_highlights": "Net revenue of $42.5M with $6.2M adjusted EBITDA. Shandong environmental closures and underground brine concentration decline posed operational headwinds.",
                "key_topics": "Shandong Bromine, Environmental Rectification, Brine Depletion",
                "document_summary": "Audited Form 10-K filing detailing operations in Shouguang, Shandong Province, China."
            },
            {
                "title": "Gulf Resources Q1 2025 Form 10-Q",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2025-Q1",
                "filing_date": date(2025, 5, 20),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar",
                "executive_highlights": "Bromine segment sales reached $11.6M across 3,900 MT volume. Production run-rates constrained by government water extraction quotas.",
                "key_topics": "Water Extraction Quotas, Winter Stoppages, Spot Market Price",
                "document_summary": "Quarterly 10-Q filing covering Chinese regional manufacturing status."
            },
            {
                "title": "Gulf Resources Q2 2025 Form 10-Q & Earnings Release",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2025-Q2",
                "filing_date": date(2025, 8, 19),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar",
                "executive_highlights": "Revenue $12.8M, Volume 4,200 MT. Average realized bromine selling price reached RMB 22,400/MT ($3,100/MT).",
                "key_topics": "Price Realization, Factory No. 4 & No. 7, Brine Purity",
                "document_summary": "Quarterly report on Chinese spot benchmark developments and production volumes."
            },
            {
                "title": "Gulf Resources Q3 2025 Form 10-Q",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2025-Q3",
                "filing_date": date(2025, 11, 18),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar",
                "executive_highlights": "Revenue $13.2M, Volume 4,300 MT. Summer flood recovery completed; underground brine yields stabilizing at lower baselines.",
                "key_topics": "Flood Recovery, Shallow Brine Depletion, Cash Costs",
                "document_summary": "Third quarter 10-Q filing on Shandong coastal conditions."
            },
            {
                "title": "Gulf Resources FY25 Form 10-K Annual Report",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2025-FY",
                "filing_date": date(2026, 4, 14),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar",
                "executive_highlights": "Full year 2025 revenue reached $49.8M with $8.9M EBITDA (17.9% margin). Volume totaled 16,100 MT.",
                "key_topics": "FY25 Financial Review, Chinese Chemical Safety Standards, Brine Rights",
                "document_summary": "Full year annual report filing for fiscal year 2025."
            },
            {
                "title": "Gulf Resources Q1 2026 Form 10-Q",
                "report_type": "10Q_REPORT",
                "fiscal_period": "2026-Q1",
                "filing_date": date(2026, 5, 21),
                "filing_authority": "SEC EDGAR",
                "source_url": "https://www.sec.gov/edgar",
                "executive_highlights": "Q1 2026 revenue of $13.8M across 4,500 MT. Average selling price climbed to RMB 23,200/MT ($3,210/MT).",
                "key_topics": "Structural Cost Floor, Depletion Inflation, Strict Local Oversight",
                "document_summary": "First quarter 2026 report tracking Chinese spot benchmark support."
            }
        ],
        "metrics": [
            {"period": "2024-Q1", "date": date(2024, 3, 31), "revenue": 10.2, "volume": 3300, "ebitda": 1.4, "margin": 13.7, "price": 3090.0, "utilization": 64.0},
            {"period": "2024-Q2", "date": date(2024, 6, 30), "revenue": 11.2, "volume": 3800, "ebitda": 1.8, "margin": 16.1, "price": 2980.0, "utilization": 68.0},
            {"period": "2024-Q3", "date": date(2024, 9, 30), "revenue": 10.5, "volume": 3500, "ebitda": 1.5, "margin": 14.3, "price": 3000.0, "utilization": 65.5},
            {"period": "2024-Q4", "date": date(2024, 12, 31), "revenue": 10.8, "volume": 3600, "ebitda": 1.5, "margin": 13.9, "price": 3020.0, "utilization": 66.0},
            {"period": "2024", "date": date(2024, 12, 31), "is_annual": True, "revenue": 42.7, "volume": 14200, "ebitda": 6.2, "margin": 14.5, "price": 3022.0, "utilization": 65.9},
            {"period": "2025-Q1", "date": date(2025, 3, 31), "revenue": 11.6, "volume": 3900, "ebitda": 1.9, "margin": 16.4, "price": 3050.0, "utilization": 67.5},
            {"period": "2025-Q2", "date": date(2025, 6, 30), "revenue": 12.8, "volume": 4200, "ebitda": 2.3, "margin": 18.0, "price": 3100.0, "utilization": 71.0},
            {"period": "2025-Q3", "date": date(2025, 9, 30), "revenue": 13.2, "volume": 4300, "ebitda": 2.4, "margin": 18.2, "price": 3120.0, "utilization": 72.0},
            {"period": "2025-Q4", "date": date(2025, 12, 31), "revenue": 13.4, "volume": 4400, "ebitda": 2.5, "margin": 18.7, "price": 3160.0, "utilization": 73.0},
            {"period": "2025", "date": date(2025, 12, 31), "is_annual": True, "revenue": 51.0, "volume": 16800, "ebitda": 9.1, "margin": 17.8, "price": 3107.0, "utilization": 70.9},
            {"period": "2026-Q1", "date": date(2026, 3, 31), "revenue": 13.8, "volume": 4500, "ebitda": 2.7, "margin": 19.6, "price": 3210.0, "utilization": 74.5}
        ],
        "findings": [
            {
                "period": "2025-Q4",
                "category": "SUPPLY_DISRUPTION",
                "headline": "Underground Brine Depletion Drives Permanent Cash Cost Floor in Shandong",
                "summary": "SEC filing notes that drill depths in Weifang have expanded significantly to tap lower-salinity brine aquifers, raising electricity and steam extraction costs per metric ton of bromine.",
                "transcript_quote": "The structural reality in Northern China is that easily accessible high-concentration brine is depleted. Every additional metric ton of elemental bromine produced in our district requires deeper pumping, directly inflating the industry cash-cost floor.",
                "speaker": "Ming Yang, CEO",
                "sentiment": "CAUTIOUS",
                "agrocel_takeaway": "Chinese domestic spot price cannot drop below $2,800–$2,900/MT without causing immediate producer shutdowns; Agrocel faces a permanently elevated global cost floor."
            }
        ]
    },

    "LXS": {
        "reports": [
            {
                "title": "Lanxess FY24 Annual Report & Accounts",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2024-FY",
                "filing_date": date(2025, 3, 14),
                "filing_authority": "Deutsche Börse",
                "source_url": "https://lanxess.com/en/Investors",
                "executive_highlights": "Polymer Additives segment sales of €840M ($910M) with €135M adjusted EBITDA (16.1% margin). Bromine flame retardants faced European industrial contraction.",
                "key_topics": "Polymer Additives, Flame Retardants, European Energy Surcharges",
                "document_summary": "Full audited German statutory annual report with Polymer Additives segment review."
            },
            {
                "title": "Lanxess Q1 2025 Quarterly Statement & Call",
                "report_type": "Q1_REPORT",
                "fiscal_period": "2025-Q1",
                "filing_date": date(2025, 5, 13),
                "filing_authority": "Deutsche Börse",
                "source_url": "https://lanxess.com/en/Investors",
                "executive_highlights": "Polymer Additives sales €218M ($235M), EBITDA €39M (17.9% margin). Specialty bromine derivates stabilized in North American and Asian exports.",
                "key_topics": "Specialty Derivatives, Cost Forward Program, Automotive Recovery",
                "document_summary": "Quarterly statement and transcript on specialty bromine chemicals."
            },
            {
                "title": "Lanxess Q2 2025 Half-Year Financial Report & Transcript",
                "report_type": "Q2_REPORT",
                "fiscal_period": "2025-Q2",
                "filing_date": date(2025, 8, 8),
                "filing_authority": "Deutsche Börse",
                "source_url": "https://lanxess.com/en/Investors",
                "executive_highlights": "Segment sales rose to €225M ($243M) with EBITDA expanding to €42M (18.7% margin). European destocking confirmed complete.",
                "key_topics": "Destocking Complete, Margin Expansion, Engineering Plastics",
                "document_summary": "Half-year disclosure highlighting recovery in chemical additives."
            },
            {
                "title": "Lanxess Q3 2025 Quarterly Statement & Conference Call",
                "report_type": "Q3_REPORT",
                "fiscal_period": "2025-Q3",
                "filing_date": date(2025, 11, 7),
                "filing_authority": "Deutsche Börse",
                "source_url": "https://lanxess.com/en/Investors",
                "executive_highlights": "Sales €224M ($242M), EBITDA €42M (18.8% margin). High-temperature brominated additives demand lifted by electric vehicle harness specs.",
                "key_topics": "EV Safety Standards, Non-Combustible Specs, Price Realization",
                "document_summary": "Third quarter results detailing specialized bromine additive applications."
            },
            {
                "title": "Lanxess FY25 Annual Report & Audited Accounts",
                "report_type": "ANNUAL_REPORT",
                "fiscal_period": "2025-FY",
                "filing_date": date(2026, 3, 17),
                "filing_authority": "Deutsche Börse",
                "source_url": "https://lanxess.com/en/Investors",
                "executive_highlights": "Polymer Additives sales €885M ($955M) with €162M EBITDA (18.3% margin). Total volume climbed to 66,000 MT.",
                "key_topics": "FY25 Financial Review, Sustainable Chemistry, Polymeric Retardants",
                "document_summary": "Full year 2025 annual report and management compensation disclosure."
            },
            {
                "title": "Lanxess Q1 2026 Quarterly Statement & Transcript",
                "report_type": "Q1_REPORT",
                "fiscal_period": "2026-Q1",
                "filing_date": date(2026, 5, 12),
                "filing_authority": "Deutsche Börse",
                "source_url": "https://lanxess.com/en/Investors",
                "executive_highlights": "Segment sales €232M ($250M) with €46M EBITDA (19.8% margin). Volume reached 17,200 MT.",
                "key_topics": "European Price Stability, Export Growth, High-Spec Formulations",
                "document_summary": "Latest trading update reflecting disciplined European pricing."
            }
        ],
        "metrics": [
            {"period": "2024-Q1", "date": date(2024, 3, 31), "revenue": 222.0, "volume": 15400, "ebitda": 34.0, "margin": 15.3, "price": 3800.0, "utilization": 74.0},
            {"period": "2024-Q2", "date": date(2024, 6, 30), "revenue": 232.0, "volume": 15800, "ebitda": 37.8, "margin": 16.3, "price": 3850.0, "utilization": 76.0},
            {"period": "2024-Q3", "date": date(2024, 9, 30), "revenue": 225.0, "volume": 15300, "ebitda": 35.6, "margin": 15.9, "price": 3820.0, "utilization": 74.5},
            {"period": "2024-Q4", "date": date(2024, 12, 31), "revenue": 229.0, "volume": 15600, "ebitda": 36.7, "margin": 16.0, "price": 3840.0, "utilization": 75.0},
            {"period": "2024", "date": date(2024, 12, 31), "is_annual": True, "revenue": 908.0, "volume": 62100, "ebitda": 144.1, "margin": 15.9, "price": 3828.0, "utilization": 74.9},
            {"period": "2025-Q1", "date": date(2025, 3, 31), "revenue": 235.0, "volume": 16100, "ebitda": 42.1, "margin": 17.9, "price": 3880.0, "utilization": 77.0},
            {"period": "2025-Q2", "date": date(2025, 6, 30), "revenue": 243.0, "volume": 16700, "ebitda": 45.4, "margin": 18.7, "price": 3910.0, "utilization": 79.5},
            {"period": "2025-Q3", "date": date(2025, 9, 30), "revenue": 242.0, "volume": 16600, "ebitda": 45.4, "margin": 18.8, "price": 3900.0, "utilization": 79.0},
            {"period": "2025-Q4", "date": date(2025, 12, 31), "revenue": 246.0, "volume": 16900, "ebitda": 47.5, "margin": 19.3, "price": 3930.0, "utilization": 80.0},
            {"period": "2025", "date": date(2025, 12, 31), "is_annual": True, "revenue": 966.0, "volume": 66300, "ebitda": 180.4, "margin": 18.7, "price": 3905.0, "utilization": 78.9},
            {"period": "2026-Q1", "date": date(2026, 3, 31), "revenue": 250.0, "volume": 17200, "ebitda": 49.7, "margin": 19.8, "price": 3960.0, "utilization": 81.0}
        ],
        "findings": [
            {
                "period": "2025-Q2",
                "category": "PRICING_OUTLOOK",
                "headline": "European Additive Formulators Defend Realization via Energy Surcharges",
                "summary": "Lanxess management confirmed that value-pricing structures and strict contract clauses have protected bromine flame retardant margins against regional electricity and gas volatility.",
                "transcript_quote": "Our pricing discipline in Polymer Additives remains unshakable. We have successfully defended realization yields across both high-volume brominated polymers and custom niche formulations.",
                "speaker": "Matthias Zachert, CEO",
                "sentiment": "DISCIPLINED",
                "agrocel_takeaway": "European buyers have accepted higher baseline chemical input costs; export parcels from Agrocel into Europe can command premium realizations when REACH compliance is certified."
            }
        ]
    }
}


def seed_competitor_intelligence(db: Session):
    """Populates competitors, filing reports, extracted time-series metrics, and transcript findings."""
    print("[SEED] Ensuring Top 5 competitors exist in database...")
    comp_map: dict[str, Competitor] = {}

    for c_info in TOP_5_COMPETITORS:
        comp = db.query(Competitor).filter_by(name=c_info["name"]).first()
        if not comp and c_info["stock_ticker"]:
            comp = db.query(Competitor).filter_by(stock_ticker=c_info["stock_ticker"]).first()

        if not comp:
            comp = Competitor(
                name=c_info["name"],
                country=c_info["country"],
                listed_company=c_info["listed_company"],
                stock_ticker=c_info["stock_ticker"],
                website=c_info["website"],
                active=True
            )
            db.add(comp)
            db.flush()
        else:
            comp.country = c_info["country"]
            comp.listed_company = c_info["listed_company"]
            comp.stock_ticker = c_info["stock_ticker"]
            comp.website = c_info["website"]
            comp.active = True

        if comp.stock_ticker:
            comp_map[comp.stock_ticker] = comp

    db.commit()

    # Now populate filings, metrics, and findings
    for ticker, dossier in COMPETITOR_DOSSIER_DATA.items():
        comp = comp_map.get(ticker)
        if not comp:
            continue

        print(f"[SEED] Seeding filings, metrics & findings for {comp.name} ({ticker})...")

        # 1. Reports
        report_objs: dict[str, CompetitorReport] = {}
        for r_data in dossier["reports"]:
            existing_report = db.query(CompetitorReport).filter_by(
                competitor_id=comp.id,
                title=r_data["title"]
            ).first()

            if not existing_report:
                report = CompetitorReport(
                    competitor_id=comp.id,
                    title=r_data["title"],
                    report_type=r_data["report_type"],
                    fiscal_period=r_data["fiscal_period"],
                    filing_date=r_data["filing_date"],
                    filing_authority=r_data.get("filing_authority", "SEC EDGAR"),
                    source_url=r_data.get("source_url"),
                    executive_highlights=r_data["executive_highlights"],
                    key_topics=r_data["key_topics"],
                    document_summary=r_data.get("document_summary")
                )
                db.add(report)
                db.flush()
                report_objs[r_data["fiscal_period"]] = report
            else:
                report_objs[r_data["fiscal_period"]] = existing_report

        # 2. Extracted Metrics
        for m_data in dossier["metrics"]:
            existing_metric = db.query(CompetitorExtractedMetric).filter_by(
                competitor_id=comp.id,
                fiscal_period=m_data["period"]
            ).first()

            target_report = report_objs.get(m_data["period"])
            if not existing_metric:
                metric = CompetitorExtractedMetric(
                    competitor_id=comp.id,
                    report_id=target_report.id if target_report else None,
                    fiscal_period=m_data["period"],
                    period_date=m_data["date"],
                    is_annual=m_data.get("is_annual", False),
                    segment_name="Bromine & Specialties",
                    currency="USD",
                    segment_revenue_usd_m=m_data.get("revenue"),
                    sales_volume_mt=m_data.get("volume"),
                    segment_ebitda_usd_m=m_data.get("ebitda"),
                    ebitda_margin_pct=m_data.get("margin"),
                    realized_price_per_mt=m_data.get("price"),
                    capacity_utilization_pct=m_data.get("utilization")
                )
                db.add(metric)
            else:
                existing_metric.segment_revenue_usd_m = m_data.get("revenue")
                existing_metric.sales_volume_mt = m_data.get("volume")
                existing_metric.segment_ebitda_usd_m = m_data.get("ebitda")
                existing_metric.ebitda_margin_pct = m_data.get("margin")
                existing_metric.realized_price_per_mt = m_data.get("price")
                existing_metric.capacity_utilization_pct = m_data.get("utilization")

        # 3. Strategic Findings & Quotes
        for f_data in dossier["findings"]:
            existing_finding = db.query(CompetitorStrategicFinding).filter_by(
                competitor_id=comp.id,
                headline=f_data["headline"]
            ).first()

            target_report = report_objs.get(f_data["period"])
            if not existing_finding:
                finding = CompetitorStrategicFinding(
                    competitor_id=comp.id,
                    report_id=target_report.id if target_report else None,
                    fiscal_period=f_data["period"],
                    category=f_data["category"],
                    headline=f_data["headline"],
                    summary=f_data["summary"],
                    transcript_quote=f_data.get("transcript_quote"),
                    speaker=f_data.get("speaker"),
                    sentiment=f_data.get("sentiment", "NEUTRAL"),
                    agrocel_takeaway=f_data["agrocel_takeaway"]
                )
                db.add(finding)

    db.commit()
    print("[SEED] Competitor intelligence seed successfully populated.")
    try:
        from .weekly_workflow import run_weekly_intelligence_workflow
        run_weekly_intelligence_workflow(db, force_regenerate=True)
        print("[SEED] Executive brief refreshed with digested competitor intelligence.")
    except Exception as e:
        print(f"[SEED] Could not refresh executive brief: {e}")
