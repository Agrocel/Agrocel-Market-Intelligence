import React, { useState, useEffect, useMemo } from 'react';
import type {
  DashboardData,
  CompetitorDossierSummary,
  CompetitorDossierDetail,
  CompetitorMetricItem,
  CompetitorReportItem,
  CompetitorStrategicFindingItem,
  DataGroundingItem,
  CompetitorExportRadarData
} from '../types';
import { getCompetitorDossiers, getCompetitorDossier, getCompetitorExportRadar } from '../api';
import { TrendChart } from '../components/Charts';
import { EmptyState } from '../components/Common';
import type { AppRoute } from '../navigation';
import { PageHeader, IntelligenceStatusStrip, SectionNav } from '../components/PageHeader';

interface Props {
  data: DashboardData;
  activeSectionAnchor?: string;
  onNavigate: (route: AppRoute, subTab?: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

export interface PeerCurrencyConfig {
  nativeCurrency: string;
  symbol: string;
  flag: string;
  revenueUnit: string;
  revenueMultiplier: number;
  pricingMultiplier: number;
  domesticPriceUnit?: string;
  authority: string;
  stockCurrency: string;
  usdToStockFx: number;
  tag: string;
}

export const PEER_CURRENCY_CONFIG: Record<string, PeerCurrencyConfig> = {
  ACI: {
    nativeCurrency: 'INR',
    symbol: '₹',
    flag: '🇮🇳',
    revenueUnit: '₹ Cr',
    revenueMultiplier: 8.35,     // 1 USD M ≈ 8.35 INR Cr
    pricingMultiplier: 83.5,     // 1 USD/MT ≈ 83.5 INR/MT
    domesticPriceUnit: '₹ / kg',
    authority: 'BSE / NSE (India)',
    stockCurrency: 'INR',
    usdToStockFx: 83.5,
    tag: '₹ INR Statutory',
  },
  SATYESH: {
    nativeCurrency: 'INR',
    symbol: '₹',
    flag: '🇮🇳',
    revenueUnit: '₹ Cr',
    revenueMultiplier: 8.35,     // 1 USD M ≈ 8.35 INR Cr
    pricingMultiplier: 83.5,     // 1 USD/MT ≈ 83.5 INR/MT
    domesticPriceUnit: '₹ / kg',
    authority: 'MCA Form AOC-4 (Unlisted Private)',
    stockCurrency: 'INR',
    usdToStockFx: 83.5,
    tag: '₹ INR (MCA Unlisted)',
  },
  LXS: {
    nativeCurrency: 'EUR',
    symbol: '€',
    flag: '🇩🇪',
    revenueUnit: '€M',
    revenueMultiplier: 0.925,    // 1 USD M ≈ 0.925 EUR M
    pricingMultiplier: 0.925,    // 1 USD/MT ≈ 0.925 EUR/MT
    domesticPriceUnit: '€ / MT',
    authority: 'Deutsche Börse (Germany)',
    stockCurrency: 'EUR',
    usdToStockFx: 0.925,
    tag: '€ EUR Statutory',
  },
  GURE: {
    nativeCurrency: 'USD',
    symbol: '$',
    flag: '🇨🇳',
    revenueUnit: '$M',
    revenueMultiplier: 1.0,
    pricingMultiplier: 1.0,
    domesticPriceUnit: '¥ / MT',
    authority: 'NASDAQ (SEC 10-Q) · Shandong Ops',
    stockCurrency: 'USD',
    usdToStockFx: 1.0,
    tag: '$ USD / ¥ CNY',
  },
  ICL: {
    nativeCurrency: 'USD',
    symbol: '$',
    flag: '🇮🇱',
    revenueUnit: '$M',
    revenueMultiplier: 1.0,
    pricingMultiplier: 1.0,
    authority: 'NYSE / TASE (Form 20-F / 6-K)',
    stockCurrency: 'USD',
    usdToStockFx: 1.0,
    tag: '$ USD Statutory',
  },
  ALB: {
    nativeCurrency: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    revenueUnit: '$M',
    revenueMultiplier: 1.0,
    pricingMultiplier: 1.0,
    authority: 'NYSE (Form 10-K / 10-Q)',
    stockCurrency: 'USD',
    usdToStockFx: 1.0,
    tag: '$ USD Statutory',
  }
};

const COLOR_MAP: Record<string, string> = {
  ACI: '#0f766e',
  SATYESH: '#0891b2',
  ICL: '#0284c7',
  ALB: '#6366f1',
  GURE: '#b45309',
  LXS: '#16a34a'
};

interface StrategicFindingExtended extends CompetitorStrategicFindingItem {
  competitor_ticker: string;
  competitor_name: string;
}

interface FilingReportExtended extends CompetitorReportItem {
  competitor_ticker: string;
  competitor_name: string;
}

export function CompetitorIntelligencePage({ activeSectionAnchor, onNavigate }: Props) {

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [dossierSummaries, setDossierSummaries] = useState<CompetitorDossierSummary[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<number | 'agrocel'>('agrocel');
  const [allDossierDetails, setAllDossierDetails] = useState<Record<number, CompetitorDossierDetail>>({});
  const [loading, setLoading] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<'native' | 'usd'>('native');
  const [timeSeriesMode, setTimeSeriesMode] = useState<'quarterly' | 'annual'>('quarterly');
  const [activeNavAnchor, setActiveNavAnchor] = useState<string>('executive-brief');

  // Filter states for Strategic Signals and Filings Explorer
  const [signalCategory, setSignalCategory] = useState<string>('ALL');
  const [signalPeerFilter, setSignalPeerFilter] = useState<string>('ALL');
  const [filingSearch, setFilingSearch] = useState<string>('');
  const [filingAuthorityFilter, setFilingAuthorityFilter] = useState<string>('ALL');
  const [filingPeerFilter, setFilingPeerFilter] = useState<string>('ALL');

  // Automated Customs Manifest & Early-Warning Export Radar State
  const [radarCompany, setRadarCompany] = useState<'ARCHEAN' | 'SATYESH' | 'ALL'>('ARCHEAN');
  const [radarData, setRadarData] = useState<CompetitorExportRadarData | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);

  useEffect(() => {
    setRadarLoading(true);
    getCompetitorExportRadar(radarCompany)
      .then(res => setRadarData(res))
      .catch(err => console.error('Failed to load export radar:', err))
      .finally(() => setRadarLoading(false));
  }, [radarCompany]);

  // ---------------------------------------------------------------------------
  // DATA FETCHING: Load all dossiers on mount for instant zero-latency filtering
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    getCompetitorDossiers()
      .then(async (summaries) => {
        if (summaries && summaries.length > 0) {
          setDossierSummaries(summaries);
          
          // Pre-fetch details for all public peers
          const detailsMap: Record<number, CompetitorDossierDetail> = {};
          await Promise.all(
            summaries
              .filter(s => s.ticker)
              .map(async (s) => {
                try {
                  const detail = await getCompetitorDossier(s.id);
                  detailsMap[s.id] = detail;
                } catch (e) {
                  console.error(`Failed to load details for competitor ${s.id}:`, e);
                }
              })
          );
          setAllDossierDetails(detailsMap);
        }
      })
      .catch((err) => console.error('Failed to load competitor dossiers:', err))
      .finally(() => setLoading(false));
  }, []);

  // Handle incoming section anchor
  useEffect(() => {
    if (activeSectionAnchor) {
      const el = document.getElementById(activeSectionAnchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveNavAnchor(activeSectionAnchor);
      }
    }
  }, [activeSectionAnchor]);

  const scrollToAnchor = (id: string) => {
    setActiveNavAnchor(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };



  // Selected dossier summary & detail
  const selectedDossierSummary = useMemo(() => {
    if (selectedCompId === 'agrocel') return null;
    return dossierSummaries.find(d => d.id === selectedCompId) || dossierSummaries[0];
  }, [dossierSummaries, selectedCompId]);

  const activeDossierDetail = useMemo(() => {
    if (selectedCompId === 'agrocel' || typeof selectedCompId !== 'number') return null;
    return allDossierDetails[selectedCompId] || null;
  }, [allDossierDetails, selectedCompId]);

  const activeTicker = selectedDossierSummary?.ticker?.toUpperCase() || 'ACI';
  const peerCfg = PEER_CURRENCY_CONFIG[activeTicker] || PEER_CURRENCY_CONFIG.ACI;

  // Standardized peer ordering: ICL, Gulf Resources, Archean, Satyesh, Albemarle, Lanxess
  const orderedPeers = useMemo(() => {
    const order = ['ICL', 'GURE', 'ACI', 'SATYESH', 'ALB', 'LXS'];
    return [...dossierSummaries.filter(s => s.ticker)].sort((a, b) => {
      const aIdx = order.indexOf(a.ticker?.toUpperCase() || '');
      const bIdx = order.indexOf(b.ticker?.toUpperCase() || '');
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
  }, [dossierSummaries]);

  // ---------------------------------------------------------------------------
  // TIME SERIES FORMATTING: CRITICAL FIX FOR ANNUAL DOUBLE-COUNTING
  // ---------------------------------------------------------------------------
  const chartMetricsData = useMemo(() => {
    if (!activeDossierDetail?.metrics) return [];
    
    // Filter strictly based on mode: Quarterly vs Annual
    const filteredMetrics = activeDossierDetail.metrics.filter(m => {
      if (timeSeriesMode === 'quarterly') {
        return !m.is_annual; // Strictly quarterly data points
      } else {
        return m.is_annual;  // Strictly audited full-year totals
      }
    });

    return filteredMetrics.map((m: CompetitorMetricItem) => {
      const isNative = currencyMode === 'native';
      const revDisplay = m.revenue_usd_m !== null
        ? Number((m.revenue_usd_m * (isNative ? peerCfg.revenueMultiplier : 1)).toFixed(1))
        : null;
      const ebitdaDisplay = m.ebitda_usd_m !== null
        ? Number((m.ebitda_usd_m * (isNative ? peerCfg.revenueMultiplier : 1)).toFixed(1))
        : null;
      const priceDisplay = m.realized_price_per_mt !== null
        ? Math.round(m.realized_price_per_mt * (isNative ? peerCfg.pricingMultiplier : 1))
        : null;

      return {
        ...m,
        revenue_display: revDisplay,
        ebitda_display: ebitdaDisplay,
        price_display: priceDisplay
      };
    });
  }, [activeDossierDetail, timeSeriesMode, currencyMode, peerCfg]);

  // ---------------------------------------------------------------------------
  // ALL STRATEGIC SIGNALS (Aggregated across entire peer universe)
  // ---------------------------------------------------------------------------
  const allStrategicSignals: StrategicFindingExtended[] = useMemo(() => {
    const list: StrategicFindingExtended[] = [];
    Object.entries(allDossierDetails).forEach(([compStrId, detail]) => {
      const compId = Number(compStrId);
      const summary = dossierSummaries.find(s => s.id === compId);
      const ticker = summary?.ticker?.toUpperCase() || 'PEER';
      const name = summary?.name || 'Peer';

      if (detail?.findings) {
        detail.findings.forEach(f => {
          list.push({
            ...f,
            competitor_ticker: ticker,
            competitor_name: name
          });
        });
      }
    });
    return list;
  }, [allDossierDetails, dossierSummaries]);

  const filteredSignals = useMemo(() => {
    return allStrategicSignals.filter(s => {
      const matchCat = signalCategory === 'ALL' || s.category.toUpperCase().includes(signalCategory);
      const matchPeer = signalPeerFilter === 'ALL' || s.competitor_ticker === signalPeerFilter;
      return matchCat && matchPeer;
    });
  }, [allStrategicSignals, signalCategory, signalPeerFilter]);

  // ---------------------------------------------------------------------------
  // ALL STATUTORY FILINGS (Aggregated across entire peer universe)
  // ---------------------------------------------------------------------------
  const allStatutoryFilings: FilingReportExtended[] = useMemo(() => {
    const list: FilingReportExtended[] = [];
    Object.entries(allDossierDetails).forEach(([compStrId, detail]) => {
      const compId = Number(compStrId);
      const summary = dossierSummaries.find(s => s.id === compId);
      const ticker = summary?.ticker?.toUpperCase() || 'PEER';
      const name = summary?.name || 'Peer';

      if (detail?.reports) {
        detail.reports.forEach(r => {
          list.push({
            ...r,
            competitor_ticker: ticker,
            competitor_name: name
          });
        });
      }
    });
    return list.sort((a, b) => b.filing_date.localeCompare(a.filing_date));
  }, [allDossierDetails, dossierSummaries]);

  const filteredFilings = useMemo(() => {
    return allStatutoryFilings.filter(f => {
      const matchPeer = filingPeerFilter === 'ALL' || f.competitor_ticker === filingPeerFilter;
      const matchAuth = filingAuthorityFilter === 'ALL' || f.filing_authority.includes(filingAuthorityFilter);
      const q = filingSearch.toLowerCase().trim();
      const matchSearch = !q || (
        f.title.toLowerCase().includes(q) ||
        (f.key_topics || '').toLowerCase().includes(q) ||
        f.fiscal_period.toLowerCase().includes(q)
      );
      return matchPeer && matchAuth && matchSearch;
    });
  }, [allStatutoryFilings, filingPeerFilter, filingAuthorityFilter, filingSearch]);

  // ---------------------------------------------------------------------------
  // RENDER COMPONENT
  // ---------------------------------------------------------------------------
  return (
    <div className="page-shell competitor-intelligence-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Competitor Intelligence</span>
          </>
        }
        title="Competitor Intelligence & Peer Disclosures"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Currency Mode Switch */}
            <div className="currency-pill-btns" role="group" aria-label="Currency view mode" style={{ margin: 0 }}>
              <button
                type="button"
                className={`currency-pill-btn ${currencyMode === 'native' ? 'active' : ''}`}
                onClick={() => setCurrencyMode('native')}
                title="View peer accounts in their respective statutory filing currencies"
              >
                🇮🇳 Native Statutory ({peerCfg.symbol} {peerCfg.nativeCurrency})
              </button>
              <button
                type="button"
                className={`currency-pill-btn ${currencyMode === 'usd' ? 'active' : ''}`}
                onClick={() => setCurrencyMode('usd')}
                title="Convert all peer figures to standardized USD benchmarks"
              >
                🌐 Standardized ($ USD)
              </button>
            </div>

            <span className="evidence-badge">
              6 Tracked Producers · SEC / BSE / TASE / DB
            </span>
          </div>
        }
      />

      {/* Level 2 — Intelligence Status Strip */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Agrocel Stance',
            value: 'Domestic Leader (94.1% Run-Rate · ₹195.7/kg)',
            dot: 'green',
            tone: 'positive'
          },
          {
            label: 'Primary Threat',
            value: 'Archean Chemical (Domestic Divergence Risk)',
            dot: 'amber',
            tone: 'warning'
          },
          {
            label: 'Logistics Shield',
            value: '+$180-$250/MT Ocean Freight Protection (Cape detour)',
            dot: 'blue',
            tone: 'accent'
          },
          {
            label: 'Global Cost Floor',
            value: '$2,800-$2,910/MT (Shandong Brine Depletion)',
            tone: 'default'
          },
          {
            label: 'Demand Inflection',
            value: 'Destocking Ended · +4-6% Demand Rebound',
            dot: 'green',
            tone: 'positive'
          }
        ]}
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'executive-brief', label: 'Threat Assessment' },
          { id: 'export-radar', label: 'Export Manifest Monitor', badge: radarData?.summary?.diversion_risk_level === 'ELEVATED' ? 'EARLY WARNING' : undefined },
          { id: 'deep-dive', label: 'Competitor Intelligence' },
          { id: 'financial-matrix', label: 'Financial Matrix' },
          { id: 'signals', label: 'Strategic Signals', badge: allStrategicSignals.length },
          { id: 'filings', label: 'Filings Library', badge: allStatutoryFilings.length }
        ]}
        activeId={activeNavAnchor}
        onSelect={id => scrollToAnchor(id)}
        ariaLabel="Competitor Section Navigation"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: EXECUTIVE COMPETITIVE BRIEF & THREAT RADAR                     */}
      {/* ========================================================================= */}
      <section id="executive-brief" className="exec-card section-container">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Competitive Threat Assessment</h2>
          </div>
          <span className="evidence-badge">
            Audited 10-K, 20-F & MCA Filings · Updated Q1 2026
          </span>
        </div>

        {/* 4 Crisp Strategic Perspective Cards (Compact Workaround) */}
        <div className="comp-brief-grid" style={{ marginBottom: '12px' }}>
          {/* Card 1: Executive Positioning */}
          <div className="comp-brief-card pos-leader" style={{ padding: '14px 16px' }}>
            <div className="cbc-head" style={{ marginBottom: '6px' }}>
              <span className="cbc-label">Agrocel Stance</span>
              <span className="threat-badge threat-benchmark">Market Leader</span>
            </div>
            <div className="cbc-stat-row" style={{ marginBottom: '4px' }}>
              <span className="cbc-stat-val text-brand" style={{ fontSize: '20px' }}>16,930 MT</span>
              <span className="cbc-stat-sub">94.1% Run-Rate</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
              Domestic Leader · 48h Road Logistics Moat
            </div>
            <p className="cbc-desc" style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              Direct road tankers to Dahej & Ankleshwar eliminate maritime demurrage and 8.25% import duty.
            </p>
          </div>

          {/* Card 2: Primary Competitor Threat */}
          <div className="comp-brief-card pos-threat" style={{ padding: '14px 16px' }}>
            <div className="cbc-head" style={{ marginBottom: '6px' }}>
              <span className="cbc-label">Commercial Threat</span>
              <span className="threat-badge threat-high">Elevated Risk</span>
            </div>
            <div className="cbc-stat-row" style={{ marginBottom: '4px' }}>
              <span className="cbc-stat-val text-danger" style={{ fontSize: '20px' }}>42,000 MT</span>
              <span className="cbc-stat-sub">Archean Hajipir</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
              China ISO Export Contraction Risk
            </div>
            <p className="cbc-desc" style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              Softening China spot tenders risk spot diversion into domestic bids; cushioned by 30% captive TBBA unit.
            </p>
          </div>

          {/* Card 3: Pricing Power & Parity Moat */}
          <div className="comp-brief-card pos-cushion" style={{ padding: '14px 16px' }}>
            <div className="cbc-head" style={{ marginBottom: '6px' }}>
              <span className="cbc-label">Landed Parity Shield</span>
              <span className="threat-badge threat-med">Insulated Moat</span>
            </div>
            <div className="cbc-stat-row" style={{ marginBottom: '4px' }}>
              <span className="cbc-stat-val text-teal" style={{ fontSize: '20px' }}>+₹58.8 / kg</span>
              <span className="cbc-stat-sub">+25.3% vs Landed CIF</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
              Cape of Good Hope Freight Barrier
            </div>
            <p className="cbc-desc" style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              Red Sea transit surcharges (+$180–$250/MT, +14–21d) prevent aggressive CIF dumping by ICL/Albemarle.
            </p>
          </div>

          {/* Card 4: Recommended Action */}
          <div className="comp-brief-card pos-action" style={{ padding: '14px 16px' }}>
            <div className="cbc-head" style={{ marginBottom: '6px' }}>
              <span className="cbc-label">Commercial Action</span>
              <span className="threat-badge threat-low">P0 Directive</span>
            </div>
            <div className="cbc-stat-row" style={{ marginBottom: '4px' }}>
              <span className="cbc-stat-val text-positive" style={{ fontSize: '20px' }}>12-Mo Formula</span>
              <span className="cbc-stat-sub">Agrochemical Quotas</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
              Lock Formulas & Advance Derivatives
            </div>
            <p className="cbc-desc" style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              Cement 12-month domestic contract quotas while foreign CIF remains &gt;$3,000/MT; accelerate captive HBr.
            </p>
          </div>
        </div>

        {/* Progressive Disclosure Drawer for Deep Assessment & Decision Framework */}
        <details className="radar-details-drawer" style={{ marginTop: '4px' }}>
          <summary className="radar-drawer-toggle">
            <span>View Full Qualitative Strategic Framework & Decision Pillars</span>
            <span style={{ fontSize: '12px' }}>▾</span>
          </summary>
          <div className="radar-drawer-body">
            <div className="comp-radar-container" style={{ margin: 0, padding: '10px 14px' }}>
              <table className="comp-radar-table">
                <tbody>
                  <tr>
                    <td>
                      <span className="radar-pillar-pill pillar-advantage">✔ Competitive Advantage</span>
                    </td>
                    <td>
                      <strong>Domestic Dispatch Agility & Duty Shield:</strong> 24–48 hour direct road-tanker supply from Kutch to Gujarat formulation clusters eliminates maritime demurrage; zero customs duty exposure saves buyers 8.25% statutory import markup (7.5% BCD + 10% SWC).
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="radar-pillar-pill pillar-risk">⚠ Emerging Risk</span>
                    </td>
                    <td>
                      <strong>Archean Export Diversion & Canal Resumption:</strong> If Chinese spot tenders soften, Archean possesses 42,000 MT capacity that could be diverted into domestic bids. Furthermore, any eventual Red Sea route normalization would lower landed CIF costs by $15–$25/MT.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="radar-pillar-pill pillar-opp">✦ Market Opportunity</span>
                    </td>
                    <td>
                      <strong>Downstream Captive Synthesis & Global Recovery:</strong> Multinationals (ALB, ICL, LXS) confirm consumer electronics and automotive destocking has concluded; demand recovering +4–6% YoY. Captive conversion into HBr and pharmaceutical intermediates yields 35%+ higher gross margins.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="radar-pillar-pill pillar-action">➔ Management Directive</span>
                    </td>
                    <td>
                      <strong>Contract Protection & Port Radar:</strong> Cement 12-month domestic contract quotas with agrochemical synthesis leaders in Dahej and Panoli; track weekly import Bill of Entry manifests at Mundra and Nhava Sheva to detect unannounced Middle Eastern shipments immediately.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: AUTOMATED CUSTOMS MANIFEST & EARLY-WARNING EXPORT RADAR        */}
      {/* ========================================================================= */}
      <section id="export-radar" className="exec-card section-container">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Customs Export Manifest & Spillover Radar</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="evidence-badge">
              Authentic Indian Customs BoE Manifests · Mundra (INMUN1)
            </span>
            <div className="custom-seg-ctrl" role="group" aria-label="Peer Export Selector">
              <button
                type="button"
                className={`seg-btn ${radarCompany === 'ARCHEAN' ? 'active' : ''}`}
                onClick={() => setRadarCompany('ARCHEAN')}
              >
                Archean (ACI)
              </button>
              <button
                type="button"
                className={`seg-btn ${radarCompany === 'SATYESH' ? 'active' : ''}`}
                onClick={() => setRadarCompany('SATYESH')}
              >
                Satyesh Brinechem
              </button>
              <button
                type="button"
                className={`seg-btn ${radarCompany === 'ALL' ? 'active' : ''}`}
                onClick={() => setRadarCompany('ALL')}
              >
                Combined Kutch Peers
              </button>
            </div>
          </div>
        </div>

        {/* Compact Early-Warning Intelligence Module */}
        {radarData?.summary && (
          <div className="export-radar-hero" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            {/* Top Row: Component Title, Period, and Compact Risk Indicator */}
            <div className="radar-monitor-header">
              <div className="rmh-left">
                <h3 className="rmh-title">{radarData.company_display_name} Export Manifest Monitor</h3>
                <span className="rmh-period-badge">Period: {radarData.summary.latest_month}</span>
                <span className="rmh-route">📍 {radarData.plant_location} ➔ ⚓ Mundra ➔ 🌏 {radarData.primary_destination}</span>
              </div>
              <span className={`threat-badge ${
                radarData.summary.diversion_risk_level === 'ELEVATED'
                  ? 'threat-high'
                  : radarData.summary.diversion_risk_level === 'MODERATE'
                  ? 'threat-med'
                  : 'threat-low'
              }`}>
                {radarData.summary.diversion_risk_badge}
              </span>
            </div>

            {/* Second Row: 4 Compact KPI Cards */}
            <div className="export-radar-kpi-grid">
              <div className="export-radar-kpi-box">
                <div className="export-radar-kpi-label">Export Run-Rate</div>
                <div className="export-radar-kpi-val text-brand">
                  {num(radarData.summary.trailing_3m_avg_mt, 1)} MT/mo
                </div>
                <div className="export-radar-kpi-sub">
                  {radarData.summary.trailing_3m_avg_mt < radarData.summary.baseline_export_target_mt ? (
                    <span className="text-danger">
                      -{Math.round(((radarData.summary.baseline_export_target_mt - radarData.summary.trailing_3m_avg_mt) / radarData.summary.baseline_export_target_mt) * 100)}% vs baseline
                    </span>
                  ) : (
                    <span className="text-positive">+Above baseline target</span>
                  )}
                </div>
              </div>

              <div className="export-radar-kpi-box">
                <div className="export-radar-kpi-label">Estimated Domestic Exposure</div>
                <div className={`export-radar-kpi-val ${radarData.summary.estimated_domestic_spillover_mt > 0 ? 'text-danger' : 'text-positive'}`}>
                  {radarData.summary.estimated_domestic_spillover_mt > 0 ? `+${num(radarData.summary.estimated_domestic_spillover_mt, 0)} MT/mo` : '0 MT'}
                </div>
                <div className="export-radar-kpi-sub">
                  {radarData.summary.estimated_domestic_spillover_mt > 0
                    ? 'Modeled unabsorbed scenario'
                    : '100% absorbed in exports'}
                </div>
              </div>

              <div className="export-radar-kpi-box">
                <div className="export-radar-kpi-label">Export Realization</div>
                <div className="export-radar-kpi-val text-teal">
                  ${num(radarData.summary.latest_month_fob_usd_mt, 0)} / MT
                </div>
                <div className="export-radar-kpi-sub">
                  FOB Mundra exit ({radarData.summary.latest_month})
                </div>
              </div>

              <div className="export-radar-kpi-box">
                <div className="export-radar-kpi-label">China Concentration</div>
                <div className="export-radar-kpi-val text-accent">
                  {num(radarData.summary.china_share_pct, 1)}%
                </div>
                <div className="export-radar-kpi-sub">
                  {radarData.summary.total_shipments} verified shipments
                </div>
              </div>
            </div>

            {/* Strategic Signal & Commercial Implication Strip */}
            <div className="radar-compact-signal-card">
              <div className="radar-signal-row">
                <div className="radar-signal-item">
                  <span className="signal-pill signal-shift">Shift</span>
                  <div className="signal-text">
                    <strong>Export Contraction:</strong> China outbound shipments slowed to {num(radarData.summary.trailing_3m_avg_mt, 0)} MT/mo ({radarData.summary.trailing_3m_avg_mt < radarData.summary.baseline_export_target_mt ? `-${Math.round(((radarData.summary.baseline_export_target_mt - radarData.summary.trailing_3m_avg_mt) / radarData.summary.baseline_export_target_mt) * 100)}% vs baseline` : 'on target'}), indicating an estimated {num(radarData.summary.estimated_domestic_spillover_mt, 0)} MT/mo domestic diversion exposure scenario.
                  </div>
                </div>
                <div className="radar-signal-item">
                  <span className="signal-pill signal-action">Takeaway</span>
                  <div className="signal-text">
                    <strong>Commercial Directive:</strong> Defend contracted Dahej and Ankleshwar accounts via 48h dedicated road tanker guarantees to counter potential local spot price discounting.
                  </div>
                </div>
              </div>

              {/* Progressive Disclosure Drawer for Detailed Reasoning & Methodology */}
              <details className="radar-details-drawer">
                <summary className="radar-drawer-toggle">
                  <span>View Detailed Strategic Assessment & Diversion Disclaimer</span>
                  <span style={{ fontSize: '12px' }}>▾</span>
                </summary>
                <div className="radar-drawer-body">
                  <div className="radar-drawer-grid">
                    <div>
                      <span className="drawer-label">Full Strategic Signal Analysis</span>
                      <p className="drawer-p">{radarData.summary.threat_narrative}</p>
                    </div>
                    <div>
                      <span className="drawer-label">Recommended Commercial Countermeasure</span>
                      <p className="drawer-p">{radarData.summary.commercial_action}</p>
                    </div>
                  </div>
                  <div className="radar-drawer-caveat">
                    ⚠️ <strong>Methodology Note:</strong> Domestic diversion is modeled strictly as an <em>estimated exposure scenario</em> derived from unobserved export run-rates. Export contraction alone does not establish confirmed domestic shipments without secondary inland transport manifests.
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Chart & Manifests Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
          {/* Monthly Export Volume Chart */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Monthly Customs Export Volume (MT)
                </h4>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  ISO Tank Export Shipments: China vs Other Destinations
                </span>
              </div>
              <span className="badge" style={{ background: '#ecfdf5', color: '#047857' }}>
                {radarData?.monthly_series?.length || 0} Months Verified
              </span>
            </div>

            <div style={{ flex: 1, minHeight: '280px' }}>
              {radarData?.monthly_series && radarData.monthly_series.length > 0 ? (
                <TrendChart
                  title="Export Volume Trend"
                  unit="MT"
                  height={280}
                  data={radarData.monthly_series.slice(-24).map(m => ({
                    date: m.month,
                    total_mt: m.total_mt,
                    china_mt: m.china_mt,
                    fob_usd_mt: m.fob_usd_mt
                  }))}
                  series={[
                    { key: 'total_mt', name: 'Total Exports (MT)', color: '#0f766e', kind: 'bar', axis: 'left' },
                    { key: 'china_mt', name: 'China Direct (MT)', color: '#0284c7', kind: 'line', axis: 'left' }
                  ]}
                />
              ) : (
                <EmptyState title="No Export Records" detail="Customs export manifests loading..." />
              )}
            </div>
          </div>

          {/* Verified Manifests Register */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Live Customs Manifests (Bill of Entry)
                </h4>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Recent verified Indian Customs outbound shipping manifests
                </span>
              </div>
              <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                Latest 15 Bills
              </span>
            </div>

            <div className="export-manifest-table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="export-manifest-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Exporter</th>
                    <th>Port</th>
                    <th>Destination</th>
                    <th style={{ textAlign: 'right' }}>Volume</th>
                    <th style={{ textAlign: 'right' }}>FOB ($/MT)</th>
                    <th>Bill No</th>
                  </tr>
                </thead>
                <tbody>
                  {radarData?.recent_manifests && radarData.recent_manifests.length > 0 ? (
                    radarData.recent_manifests.map((m) => (
                      <tr key={m.id}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{m.trade_date}</td>
                        <td style={{ fontSize: '11.5px', color: '#334155' }}>
                          {m.company.includes('Archean') ? 'Archean Chemical' : 'Satyesh Brinechem'}
                        </td>
                        <td style={{ fontSize: '11px', color: '#64748b' }}>MUNDRA SEA</td>
                        <td>
                          <span className="badge" style={{ background: '#f0fdf4', color: '#166534', fontSize: '10.5px' }}>
                            {m.destination}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {num(m.quantity_mt, 1)} MT
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f766e' }}>
                          ${num(m.fob_usd_per_mt, 0)}
                        </td>
                        <td>
                          <span className="manifest-bill-tag">{m.bill_no}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        Loading customs manifests...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 4: COMPETITOR INTELLIGENCE                                        */}
      {/* ========================================================================= */}
      <section id="deep-dive" className="exec-card section-container">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Competitor Intelligence</h2>
          </div>
          <span className="evidence-badge">
            Official Regulatory Disclosures & Operating Infrastructure
          </span>
        </div>

        {/* Full-width Responsive Segmented Competitor Selector (Agrocel + 6 Peers) */}
        <div className="comp-segmented-bar" role="tablist" aria-label="Select Competitor Profile">
          {/* 1. Agrocel (Domestic Benchmark) */}
          <button
            type="button"
            className={`comp-tab-btn ${selectedCompId === 'agrocel' ? 'active' : ''}`}
            onClick={() => setSelectedCompId('agrocel')}
          >
            <span className="comp-tab-name">Agrocel</span>
            <span className="comp-tab-sub">Benchmark</span>
          </button>

          {/* 2 to 7: ICL, Gulf Resources, Archean, Satyesh, Albemarle, Lanxess */}
          {orderedPeers.map(peer => {
            const isActive = selectedCompId === peer.id;
            const shortName = peer.ticker === 'GURE'
              ? 'Gulf Resources'
              : peer.ticker === 'ACI'
              ? 'Archean'
              : peer.ticker === 'SATYESH'
              ? 'Satyesh'
              : peer.ticker === 'ICL'
              ? 'ICL Group'
              : peer.name.split(' ')[0];

            const roleSub = peer.ticker === 'ACI'
              ? 'Domestic'
              : peer.ticker === 'SATYESH'
              ? 'Kutch MCA'
              : peer.ticker === 'ICL'
              ? 'Dead Sea'
              : peer.ticker === 'GURE'
              ? 'China Brine'
              : peer.ticker === 'ALB'
              ? 'US / Jordan'
              : 'Europe';

            return (
              <button
                key={peer.id}
                type="button"
                className={`comp-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCompId(peer.id)}
              >
                <span className="comp-tab-name">{shortName}</span>
                <span className="comp-tab-sub">{roleSub}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Entity Intelligence Profile */}
        {selectedCompId === 'agrocel' ? (
          <div className="comp-deepdive-grid">
            {/* Left Column: Company Profile */}
            <div className="cdd-profile-card">
              <div>
                <h3 className="cdd-company-name">Agrocel Industries Private Limited</h3>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>India (Kutch & Bhuj, Gujarat)</span>
                  <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>Private Indian Entity</span>
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>18,000 MT/yr Capacity</span>
                  <span className="threat-badge threat-benchmark">Market Leader</span>
                </div>

                {/* Concise Tactical Edge Box */}
                <div className="cdd-concise-insight">
                  <strong>Agrocel Strategic Moat:</strong> Direct 24–48h dedicated road tanker delivery into Dahej, Ankleshwar & Panoli clusters provides zero maritime delay and an 8.25% landed customs duty savings over foreign CIF imports.
                </div>

                {/* Progressive Disclosure: Detailed Background & History */}
                <details className="cdd-details-drawer">
                  <summary className="cdd-drawer-toggle">
                    <span>View Operating Background & Infrastructure</span>
                    <span style={{ fontSize: '10px' }}>▾</span>
                  </summary>
                  <p style={{ fontSize: '12px', lineHeight: 1.55, color: '#475569', margin: '8px 0 0' }}>
                    Agrocel operates the leading subterranean solar brine bromine extraction facility in the Rann of Kutch. Captive brine concentration ponds and direct dedicated road transport fleets enable continuous just-in-time delivery into major formulation clusters in Dahej, Panoli, and Ankleshwar.
                  </p>
                </details>
              </div>

              <div style={{ marginTop: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11.5px', color: '#475569' }}>
                💡 <strong>Commercial Directive:</strong> Maintain ₹190–₹205/kg domestic corridor while CIF parity exceeds $3,000/MT to guarantee 100% account retention.
              </div>
            </div>

            {/* Right Column: Financial & Operational Snapshot */}
            <div className="cdd-profile-card">
              <div>
                <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Financial & Operational Snapshot (FY 2025-26)
                </h4>

                <div className="cdd-scorecard-grid">
                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Segment Net Revenue</div>
                    <div className="cdd-stat-val text-brand">₹317.3 Cr</div>
                    <div className="cdd-stat-sub">~$38.0M USD equivalent</div>
                  </div>

                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Operating EBITDA Margin</div>
                    <div className="cdd-stat-val text-positive">24.5%</div>
                    <div className="cdd-stat-sub">Structural margin yield</div>
                  </div>

                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Dispatched Volume & Run-Rate</div>
                    <div className="cdd-stat-val text-teal">16,930 MT</div>
                    <div className="cdd-stat-sub">94.1% capacity run-rate</div>
                  </div>

                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Realized Price Benchmark</div>
                    <div className="cdd-stat-val">₹195.7 / kg</div>
                    <div className="cdd-stat-sub">₹58.8/kg discount vs CIF</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Audited statutory accounts · FY 2025-26
                </span>
                <button
                  type="button"
                  className="btn-exec-action"
                  onClick={() => scrollToAnchor('financial-matrix')}
                  style={{ fontSize: '11.5px', padding: '5px 10px' }}
                >
                  View Time Series Charts ↓
                </button>
              </div>
            </div>
          </div>
        ) : selectedDossierSummary ? (
          <div className="comp-deepdive-grid">
            {/* Left Column: Company Profile */}
            <div className="cdd-profile-card">
              <div>
                <h3 className="cdd-company-name">
                  {selectedDossierSummary.name} ({selectedDossierSummary.ticker || 'PEER'})
                </h3>
                
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600 }}>
                    {selectedDossierSummary.country}
                  </span>
                  <span className="badge" style={{ background: '#f0fdfa', color: '#0f766e', fontWeight: 600 }}>
                    {peerCfg.authority} Registrant
                  </span>
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                    {selectedDossierSummary.ticker === 'ACI'
                      ? '42,000 MT/yr Capacity'
                      : selectedDossierSummary.ticker === 'SATYESH'
                      ? '12,000 MT/yr Capacity'
                      : selectedDossierSummary.ticker === 'ICL'
                      ? '280,000 MT/yr Capacity'
                      : selectedDossierSummary.ticker === 'ALB'
                      ? '150,000 MT/yr (Jordan JV)'
                      : selectedDossierSummary.ticker === 'GURE'
                      ? 'Shandong Brine Wells'
                      : 'Specialty Additives'}
                  </span>
                  {selectedDossierSummary.ticker === 'ACI' && (
                    <span className="threat-badge threat-high">High Threat Peer</span>
                  )}
                  {selectedDossierSummary.ticker === 'SATYESH' && (
                    <span className="threat-badge threat-high" style={{ background: '#fef3c7', color: '#b45309' }}>Regional Price Follower</span>
                  )}
                  {selectedDossierSummary.ticker === 'ICL' && (
                    <span className="threat-badge threat-med">Medium Threat</span>
                  )}
                  {['ALB', 'GURE', 'LXS'].includes(selectedDossierSummary.ticker || '') && (
                    <span className="threat-badge threat-low">Low Threat</span>
                  )}
                </div>

                {/* Concise Tactical Edge Box */}
                <div className="cdd-concise-insight">
                  <strong>Agrocel Strategic Moat vs {selectedDossierSummary.name.split(' ')[0]}:</strong>{' '}
                  {selectedDossierSummary.ticker === 'ACI'
                    ? 'Agrocel commands domestic account loyalty with 24-48h road tanker agility, whereas Archean is exposed to volatile Chinese spot export margins and demurrage.'
                    : selectedDossierSummary.ticker === 'SATYESH'
                    ? 'Agrocel counters Satyesh\'s merchant liquid pricing with bundled downstream derivatives and long-term contract security rather than engaging in pure elemental price wars.'
                    : selectedDossierSummary.ticker === 'ICL'
                    ? 'ICL cannot match Agrocel\'s 48h overland delivery into Dahej; Red Sea diversions add +14–21 days and $180–$250/MT ocean freight, keeping landed CIF uncompetitive.'
                    : selectedDossierSummary.ticker === 'ALB'
                    ? 'Albemarle\'s Jordan JV volumes are committed to global contract quotas and will not initiate price wars in India, supporting benchmark stability.'
                    : selectedDossierSummary.ticker === 'GURE'
                    ? 'Gulf Resources cash costs ($2,800–$3,100/MT) establish a firm global floor under merchant pricing, protecting Agrocel domestic margins.'
                    : 'Agrocel holds a structural cost advantage over European additive producers and supplies high-purity REACH-certified intermediates.'}
                </div>

                {/* Progressive Disclosure: Operating Background & Infrastructure History */}
                <details className="cdd-details-drawer">
                  <summary className="cdd-drawer-toggle">
                    <span>View Operating Background & Infrastructure</span>
                    <span style={{ fontSize: '10px' }}>▾</span>
                  </summary>
                  <p style={{ fontSize: '12px', lineHeight: 1.55, color: '#475569', margin: '8px 0 0' }}>
                    {selectedDossierSummary.ticker === 'ACI'
                      ? 'Archean Chemical operates a 42,000 MT elemental bromine plant at Hajipir, Kutch. Primarily geared toward ISO tank exports to China, Archean is now commissioning captive TBBA flame retardant units to absorb merchant volume.'
                      : selectedDossierSummary.ticker === 'SATYESH'
                      ? 'Satyesh Brinechem operates a 12,000 MT solar bittern bromine extraction facility in the Greater Rann of Kutch (CIN: U24299GJ2016PTC092892). A pure-play merchant liquid vendor and Mundra port container exporter with low cash extraction economics.'
                      : selectedDossierSummary.ticker === 'ICL'
                      ? 'ICL is the low-cost global extraction leader (280,000 MT capacity at Dead Sea). Current Red Sea shipping conflict forces rerouting around Cape of Good Hope (+14–21 days transit, +$180–$250/MT ocean freight), insulating Indian ports.'
                      : selectedDossierSummary.ticker === 'ALB'
                      ? 'Albemarle operates Smackover Arkansas underground brine fields and a 50/50 Jordan Bromine Company JV (150,000 MT capacity). Primary focus on high-margin oilfield clear brine fluids and captive flame retardants with disciplined capex.'
                      : selectedDossierSummary.ticker === 'GURE'
                      ? 'Gulf Resources extracts bromine from brine wells in Shandong Province, China. Depleting underground aquifers have driven extraction cash costs above $2,800/MT, establishing a durable global floor under merchant pricing.'
                      : 'Lanxess is a major European specialty chemical producer focusing on high-performance polymer additives. Defending realizations through formula-linked energy and logistics surcharges.'}
                  </p>
                </details>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedDossierSummary.strategic_pulse || 'Continuous regulatory tracking active'}
                </span>
                <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  {selectedDossierSummary.reports_count} Filings Archived
                </span>
              </div>
            </div>

            {/* Right Column: Financial & Operational Snapshot */}
            <div className="cdd-profile-card">
              <div>
                <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Financial & Operational Snapshot ({selectedDossierSummary.scorecard?.period || 'Q1 2026'})
                </h4>

                <div className="cdd-scorecard-grid">
                  {/* Metric 1: Revenue */}
                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Segment Net Revenue</div>
                    <div className="cdd-stat-val text-brand">
                      {selectedDossierSummary.scorecard?.latest_revenue_usd_m !== null && selectedDossierSummary.scorecard?.latest_revenue_usd_m !== undefined
                        ? (currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                            ? `₹${(selectedDossierSummary.scorecard.latest_revenue_usd_m * peerCfg.revenueMultiplier).toFixed(1)} Cr`
                            : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                            ? `€${(selectedDossierSummary.scorecard.latest_revenue_usd_m * peerCfg.revenueMultiplier).toFixed(1)}M`
                            : `$${selectedDossierSummary.scorecard.latest_revenue_usd_m.toFixed(1)}M`)
                        : '—'}
                    </div>
                    <div className="cdd-stat-sub">
                      {currencyMode === 'native' ? `${peerCfg.nativeCurrency} Statutory` : 'Standardized USD'}
                    </div>
                  </div>

                  {/* Metric 2: EBITDA */}
                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Operating EBITDA & Margin</div>
                    <div className="cdd-stat-val text-positive">
                      {selectedDossierSummary.scorecard?.latest_margin_pct !== null && selectedDossierSummary.scorecard?.latest_margin_pct !== undefined
                        ? `${selectedDossierSummary.scorecard.latest_margin_pct.toFixed(1)}%`
                        : '—'}
                    </div>
                    <div className="cdd-stat-sub">
                      {selectedDossierSummary.scorecard?.latest_ebitda_usd_m !== null && selectedDossierSummary.scorecard?.latest_ebitda_usd_m !== undefined
                        ? (currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                            ? `₹${(selectedDossierSummary.scorecard.latest_ebitda_usd_m * peerCfg.revenueMultiplier).toFixed(1)} Cr EBITDA`
                            : `$${selectedDossierSummary.scorecard.latest_ebitda_usd_m.toFixed(1)}M EBITDA`)
                        : 'Operational margin yield'}
                    </div>
                  </div>

                  {/* Metric 3: Volume */}
                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Dispatched Volume & Run-Rate</div>
                    <div className="cdd-stat-val text-teal">
                      {selectedDossierSummary.scorecard?.latest_volume_mt !== null && selectedDossierSummary.scorecard?.latest_volume_mt !== undefined
                        ? `${selectedDossierSummary.scorecard.latest_volume_mt.toLocaleString()} MT`
                        : '—'}
                    </div>
                    <div className="cdd-stat-sub">
                      {selectedDossierSummary.scorecard?.latest_utilization_pct
                        ? `Run-Rate: ${selectedDossierSummary.scorecard.latest_utilization_pct}%`
                        : 'Dispatched sales run-rate'}
                    </div>
                  </div>

                  {/* Metric 4: Realized Price */}
                  <div className="cdd-stat-box">
                    <div className="cdd-stat-label">Realized Price Benchmark</div>
                    <div className="cdd-stat-val">
                      {selectedDossierSummary.scorecard?.latest_price_per_mt !== null && selectedDossierSummary.scorecard?.latest_price_per_mt !== undefined
                        ? (currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                            ? `₹${((selectedDossierSummary.scorecard.latest_price_per_mt * peerCfg.pricingMultiplier) / 1000).toFixed(1)}/kg`
                            : `$${selectedDossierSummary.scorecard.latest_price_per_mt.toLocaleString()}/MT`)
                        : '—'}
                    </div>
                    <div className="cdd-stat-sub">
                      {currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? `~$${selectedDossierSummary.scorecard?.latest_price_per_mt?.toLocaleString()}/MT global basis`
                        : 'Contract benchmark'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-exec-action"
                  onClick={() => scrollToAnchor('financial-matrix')}
                  style={{ fontSize: '11.5px', padding: '5px 10px' }}
                >
                  View Time Series Charts ↓
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Please select a competitor to inspect profile" />
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: FINANCIAL & OPERATIONAL INTELLIGENCE (TIME SERIES)             */}
      {/* ========================================================================= */}
      <section id="financial-matrix" className="exec-card section-container">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">
              Financial & Operational Trends: {selectedDossierSummary?.name || 'Peer Comparison'}
            </h2>
            <p className="section-desc">
              {timeSeriesMode === 'quarterly'
                ? 'Sequential quarterly run-rate (Q1 2024 – Q1 2026). Pure quarterly observations with annual sums isolated.'
                : 'Audited full-year totals (FY 2024 vs FY 2025). Annual statutory financial disclosures.'}
            </p>
          </div>

          {/* Time Series Mode Toggle (CRITICAL FIX FOR ANNUAL SPIKES) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="chart-time-toggle" role="group" aria-label="Time series frequency">
              <button
                type="button"
                className={`ctt-btn ${timeSeriesMode === 'quarterly' ? 'active' : ''}`}
                onClick={() => setTimeSeriesMode('quarterly')}
                title="View sequential quarterly observations without annual sum distortions"
              >
                Quarterly Run-Rate (Q1 '24 – Q1 '26)
              </button>
              <button
                type="button"
                className={`ctt-btn ${timeSeriesMode === 'annual' ? 'active' : ''}`}
                onClick={() => setTimeSeriesMode('annual')}
                title="Compare full-year audited totals"
              >
                Annual Comparison (FY24 vs FY25)
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading peer time series disclosures...
          </div>
        ) : chartMetricsData.length > 0 ? (
          <div className="comp-chart-grid">
            {/* Chart 1: Segment Revenue */}
            <div className="comp-chart-item">
              <TrendChart
                title={
                  currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                    ? `Bromine Revenue (${peerCfg.revenueUnit})`
                    : `Bromine Revenue (${currencyMode === 'native' ? peerCfg.revenueUnit : '$M'})`
                }
                unit={currencyMode === 'native' ? (peerCfg.nativeCurrency === 'INR' ? '₹ Crores' : 'EUR M') : 'USD M'}
                data={chartMetricsData}
                series={[
                  {
                    key: 'revenue_display',
                    name: `Net Revenue (${currencyMode === 'native' ? peerCfg.revenueUnit : '$M'})`,
                    color: '#0f766e',
                    kind: 'bar'
                  }
                ]}
                annotation={
                  timeSeriesMode === 'quarterly'
                    ? 'Sequential quarterly reported revenue without annual sum distortions.'
                    : 'Audited annual segment net sales.'
                }
              />
              <div className="cci-takeaway">
                <strong>Revenue Takeaway:</strong> Segment revenues show consistent top-line expansion across 2025, supported by recovering flame retardant demand and firm base pricing.
              </div>
            </div>

            {/* Chart 2: Volume & Capacity Run-Rate */}
            <div className="comp-chart-item">
              <TrendChart
                title="Dispatched Sales Volume & Capacity Run-Rate"
                unit="MT · % Run-Rate"
                data={chartMetricsData}
                series={[
                  {
                    key: 'volume_mt',
                    name: 'Volume (MT)',
                    color: '#2563eb',
                    kind: 'bar'
                  },
                  {
                    key: 'capacity_utilization_pct',
                    name: 'Run-Rate (%)',
                    color: '#d97706',
                    axis: 'right'
                  }
                ]}
                annotation="Dispatched physical volume alongside operating plant capacity run-rate."
              />
              <div className="cci-takeaway">
                <strong>Volume Takeaway:</strong> Dispatched volume has increased steadily as customer destocking officially concluded, maintaining utilization rates between 78% and 84%.
              </div>
            </div>

            {/* Chart 3: Segment EBITDA & Margin */}
            <div className="comp-chart-item">
              <TrendChart
                title={
                  currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                    ? `Segment EBITDA & Margin (${peerCfg.revenueUnit})`
                    : `Segment EBITDA & Operating Margin ($M)`
                }
                unit={`${currencyMode === 'native' ? peerCfg.revenueUnit : '$M'} · % Margin`}
                data={chartMetricsData}
                series={[
                  {
                    key: 'ebitda_display',
                    name: `EBITDA (${currencyMode === 'native' ? peerCfg.revenueUnit : '$M'})`,
                    color: '#16a34a',
                    kind: 'bar'
                  },
                  {
                    key: 'ebitda_margin_pct',
                    name: 'EBITDA Margin (%)',
                    color: '#7c3aed',
                    axis: 'right'
                  }
                ]}
                annotation="Operating profitability and margin defense discipline."
              />
              <div className="cci-takeaway">
                <strong>Margin Takeaway:</strong> High EBITDA margins confirm strong operating cost pass-through, protecting producers against energy and freight volatility.
              </div>
            </div>

            {/* Chart 4: Realized Pricing Benchmark */}
            <div className="comp-chart-item">
              <TrendChart
                title={
                  currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                    ? 'Realized Price Benchmark (₹/MT)'
                    : 'Realized Price Benchmark ($/MT)'
                }
                unit={currencyMode === 'native' && peerCfg.nativeCurrency === 'INR' ? '₹ / MT' : 'USD / MT'}
                data={chartMetricsData}
                series={[
                  {
                    key: 'price_display',
                    name: `Realized Price (${currencyMode === 'native' && peerCfg.nativeCurrency === 'INR' ? '₹/MT' : '$/MT'})`,
                    color: '#0891b2',
                    kind: 'line'
                  }
                ]}
                annotation={
                  currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                    ? 'Net realization per metric ton in Indian Rupees (1 USD/MT ≈ ₹83.5/MT).'
                    : 'Net realization per metric ton in US Dollars.'
                }
              />
              <div className="cci-takeaway">
                <strong>Pricing Takeaway:</strong> Realized prices have stabilized firmly above $2,700–$3,100/MT, corroborating the structural global floor that supports Agrocel's domestic pricing headroom.
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Time series data currently archived for public peers only"
            detail="Select Archean, ICL, Albemarle, Gulf Resources, or Lanxess from the selector ribbon above to inspect verified multi-period financial trends."
          />
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: STRATEGIC SIGNALS & MANAGEMENT COMMENTARY FEED                 */}
      {/* ========================================================================= */}
      <section id="signals" className="exec-card section-container">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Management Commentary & Strategic Signals Feed</h2>
          </div>
          <span className="evidence-badge">
            Audited Transcripts & SEC 6-K / 10-Q Disclosures ({filteredSignals.length} Signals)
          </span>
        </div>

        {/* Filter Bar */}
        <div className="signals-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Filter Competitor:
            </span>
            <div className="signals-pills-row">
              <button
                type="button"
                className={`signal-pill-filter ${signalPeerFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSignalPeerFilter('ALL')}
              >
                All Peers ({allStrategicSignals.length})
              </button>
              {['ACI', 'ICL', 'ALB', 'GURE', 'LXS'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`signal-pill-filter ${signalPeerFilter === t ? 'active' : ''}`}
                  onClick={() => setSignalPeerFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Category:
            </span>
            <div className="signals-pills-row">
              {[
                { id: 'ALL', label: 'All Signals' },
                { id: 'PRICING', label: 'Pricing Outlook' },
                { id: 'CAPACITY', label: 'Capacity & Capex' },
                { id: 'SUPPLY', label: 'Supply Shocks' },
                { id: 'BOTTOM', label: 'Destocking & Demand' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`signal-pill-filter ${signalCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSignalCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Signals Feed Grid */}
        {filteredSignals.length > 0 ? (
          <div className="signals-feed-grid">
            {filteredSignals.map(signal => {
              const sentimentClass = signal.sentiment.toLowerCase() === 'bullish'
                ? 'status-green'
                : signal.sentiment.toLowerCase() === 'disciplined'
                ? 'status-blue'
                : 'status-amber';

              return (
                <article key={signal.id} className="signal-card">
                  <div>
                    {/* Top Meta Bar */}
                    <div className="sc-top-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="sc-peer-badge" style={{ background: '#0f766e', color: '#ffffff' }}>
                          {signal.competitor_ticker}
                        </span>
                        <span className="font-mono text-muted">{signal.period}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="sc-cat-tag">{signal.category.replace('_', ' ')}</span>
                        <span className={`status-pill ${sentimentClass}`} style={{ fontSize: '10px' }}>
                          {signal.sentiment}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h4 className="sc-headline">{signal.headline}</h4>

                    {/* Summary of What Happened */}
                    <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: '0 0 10px' }}>
                      {signal.summary}
                    </p>

                    {/* Direct Authentic Management Quote */}
                    {signal.transcript_quote && (
                      <blockquote className="sc-quote-block">
                        &ldquo;{signal.transcript_quote}&rdquo;
                        {signal.speaker && (
                          <span className="sc-speaker">— {signal.speaker}</span>
                        )}
                      </blockquote>
                    )}
                  </div>

                  {/* Tactical Implication for Agrocel */}
                  <div className="sc-agrocel-box">
                    <span className="sc-agrocel-label">Strategic Implication for Agrocel</span>
                    {signal.agrocel_takeaway}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No signals match selected criteria"
            detail="Try clearing peer or category filters to view archived management quotes."
          />
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: EVIDENCE & REGULATORY FILINGS EXPLORER                         */}
      {/* ========================================================================= */}
      <section id="filings" className="exec-card section-container">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Statutory Filings & Disclosures Library</h2>
            <p className="section-desc">
              Direct official disclosures synced from SEC EDGAR, BSE/NSE, Deutsche Börse, and TASE.
            </p>
          </div>
          <span className="evidence-badge">
            Primary Evidence Layer · {filteredFilings.length} Documents
          </span>
        </div>

        {/* Filings Filter & Search Bar */}
        <div className="filings-filter-bar">
          <input
            type="text"
            className="filings-search-input"
            placeholder="🔍 Search filings by keyword, title, or period..."
            value={filingSearch}
            onChange={e => setFilingSearch(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Peer Filter */}
            <select
              value={filingPeerFilter}
              onChange={e => setFilingPeerFilter(e.target.value)}
              className="chart-mode-select"
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              <option value="ALL">All Competitors</option>
              <option value="ACI">Archean Chemical (ACI)</option>
              <option value="ICL">ICL Group (ICL)</option>
              <option value="ALB">Albemarle (ALB)</option>
              <option value="GURE">Gulf Resources (GURE)</option>
              <option value="LXS">Lanxess (LXS)</option>
            </select>

            {/* Authority Filter */}
            <select
              value={filingAuthorityFilter}
              onChange={e => setFilingAuthorityFilter(e.target.value)}
              className="chart-mode-select"
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              <option value="ALL">All Authorities</option>
              <option value="SEC EDGAR">SEC EDGAR (USA)</option>
              <option value="BSE / NSE">BSE / NSE (India)</option>
              <option value="Deutsche Börse">Deutsche Börse (Germany)</option>
              <option value="TASE">TASE (Israel)</option>
            </select>
          </div>
        </div>

        {/* Compact Filings Explorer Table */}
        {filteredFilings.length > 0 ? (
          <div className="comp-table-card">
            <table className="comp-matrix-table">
              <thead>
                <tr>
                  <th>Filing Date</th>
                  <th>Company</th>
                  <th>Authority</th>
                  <th>Type</th>
                  <th>Fiscal Period</th>
                  <th>Document Title & Highlights</th>
                  <th>Key Topics</th>
                  <th>Source Document</th>
                </tr>
              </thead>
              <tbody>
                {filteredFilings.map(filing => (
                  <tr key={filing.id}>
                    <td className="font-mono text-xs" style={{ whiteSpace: 'nowrap' }}>
                      {filing.filing_date}
                    </td>
                    <td>
                      <span className="font-bold text-xs" style={{ color: '#0f766e' }}>
                        {filing.competitor_ticker}
                      </span>
                    </td>
                    <td>
                      <span className="reporting-authority-tag" style={{ fontSize: '10.5px' }}>
                        {filing.filing_authority}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ fontSize: '10.5px', background: '#f1f5f9', color: '#475569' }}>
                        {filing.report_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="font-semibold text-xs" style={{ whiteSpace: 'nowrap' }}>
                      {filing.fiscal_period}
                    </td>
                    <td style={{ maxWidth: '340px' }}>
                      <strong className="text-primary block text-xs" style={{ display: 'block', marginBottom: '2px' }}>
                        {filing.title}
                      </strong>
                      <small className="text-muted text-xs leading-relaxed" style={{ display: 'block' }}>
                        {filing.highlights || filing.document_summary}
                      </small>
                    </td>
                    <td style={{ maxWidth: '180px' }}>
                      <small className="text-muted text-xs">{filing.key_topics}</small>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {filing.source_url ? (
                        <a
                          href={filing.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dossier-source-link"
                          style={{ fontSize: '11.5px', padding: '3px 8px' }}
                          title="Open official statutory document"
                        >
                          <span>Official Filing</span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                          </svg>
                        </a>
                      ) : (
                        <span className="text-muted text-xs">Internal Filing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No statutory filings match your search criteria"
            detail="Try adjusting your keyword search or changing the regulator filter."
          />
        )}
      </section>
    </div>
  );
}

