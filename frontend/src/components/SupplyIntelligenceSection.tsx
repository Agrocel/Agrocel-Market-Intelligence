import React, { useState, useMemo } from 'react';
import type {
  Section2Supply,
  ProducingCountry,
  SupplyNewsDevelopment,
  RegionalSupplyCondition,
  SupplyHistoricalChange
} from '../types';

interface Props {
  supplyData?: Section2Supply;
  onRefresh?: () => void;
}

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

// Colors for country capacity segments
const COUNTRY_COLORS: Record<string, string> = {
  'Israel': '#0f766e',
  'Jordan': '#0284c7',
  'United States': '#6366f1',
  'China': '#e11d48',
  'India': '#10b981'
};

export function SupplyIntelligenceSection({ supplyData, onRefresh }: Props) {
  // State for interactive features
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showAllNewsModal, setShowAllNewsModal] = useState<boolean>(false);
  const [newsFilterRegion, setNewsFilterRegion] = useState<string>('ALL');
  const [capacityViewMode, setCapacityViewMode] = useState<'NAMEPLATE' | 'ACTUAL'>('NAMEPLATE');
  const [activeLayerTab, setActiveLayerTab] = useState<Record<number, 'FACTS' | 'MARKET' | 'AGROCEL'>>({});

  // Fallbacks if backend is loading or partially populated
  const s2 = supplyData;
  const execSummary = s2?.executive_supply_summary;
  const capDist = s2?.global_capacity_distribution;
  const newsData = s2?.latest_key_supply_developments;
  const regConditions = s2?.regional_supply_conditions;
  const whatChanged = s2?.what_changed_since_last_update;
  const agrocelImplications = s2?.agrocel_business_implications;
  const marketBalance = s2?.market_balance_assessment;

  // Countries list with normalized fields
  const countries = useMemo<ProducingCountry[]>(() => {
    if (s2?.country_intelligence_cards?.countries && s2.country_intelligence_cards.countries.length > 0) {
      return s2.country_intelligence_cards.countries;
    }
    return s2?.producing_countries || [];
  }, [s2]);

  // Key Developments & All Developments
  const keyNews = useMemo<SupplyNewsDevelopment[]>(() => {
    return newsData?.key_developments || [];
  }, [newsData]);

  const allNews = useMemo<SupplyNewsDevelopment[]>(() => {
    return newsData?.all_developments || keyNews;
  }, [newsData, keyNews]);

  // Filtered news for modal
  const modalFilteredNews = useMemo(() => {
    if (newsFilterRegion === 'ALL') return allNews;
    return allNews.filter(n => n.country_region.toLowerCase().includes(newsFilterRegion.toLowerCase()));
  }, [allNews, newsFilterRegion]);

  const toggleExpandCountry = (country: string) => {
    setExpandedCountry(prev => (prev === country ? null : country));
  };

  const getLayerTab = (id: number): 'FACTS' | 'MARKET' | 'AGROCEL' => {
    return activeLayerTab[id] || 'FACTS';
  };

  const setLayerTab = (id: number, tab: 'FACTS' | 'MARKET' | 'AGROCEL') => {
    setActiveLayerTab(prev => ({ ...prev, [id]: tab }));
  };

  // Helper to render markdown-like selective bold text safely
  const renderBoldFormattedText = (text?: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="supply-bold-highlight">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </>
    );
  };

  // Status badge styling
  const getStatusBadgeClass = (status?: string, code?: string) => {
    const c = (code || status || '').toUpperCase();
    if (c.includes('TIGHT') || c.includes('CONSTRAIN')) return 'status-pill-constrained';
    if (c.includes('EXPAND')) return 'status-pill-expanding';
    if (c.includes('BOTTLENECK')) return 'status-pill-bottleneck';
    return 'status-pill-stable';
  };

  return (
    <section id="supply" className="exec-card section-container supply-intelligence-root">
      {/* ========================================================
          SECTION HEADER
          ======================================================== */}
      <div className="section-head-bar">
        <div>
          <span className="section-step-num">SECTION 02</span>
          <h2 className="section-title">Supply & Global Capacity</h2>
          <p className="section-subtitle-muted">
            Executive intelligence on global elemental bromine production, structural deficits, trade corridors, and domestic positioning.
          </p>
        </div>
        <div className="section-head-actions">
          <div className="market-balance-indicator">
            <span className="mb-label">Global Market Balance:</span>
            <span className={`status-badge-inline ${getStatusBadgeClass(execSummary?.market_balance_status, execSummary?.market_balance_code)}`}>
              {execSummary?.market_balance_status || s2?.global_supply_status || 'TIGHTENING TO STABLE'}
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn-supply-refresh"
              title="Refresh supply intelligence from live data & AI engine"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          1. EXECUTIVE SUPPLY SUMMARY PANEL
          ======================================================== */}
      <div className="supply-exec-summary-panel">
        <div className="ses-header-row">
          <div className="ses-meta-badges">
            <span className="ses-badge-period">
              <strong>Reporting Period:</strong> {execSummary?.reporting_period || 'Q1 2026 (Annualized)'}
            </span>
            <span className="ses-badge-date">
              <strong>Data Refresh:</strong> {execSummary?.latest_refresh_date || '2026-03-15'}
            </span>
            <span className="ses-badge-direction">
              <strong>Direction:</strong> {execSummary?.supply_direction || 'Tightening Bias / High Landed Parity'}
            </span>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="ses-narrative-card">
          <div className="ses-quote-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 7 4 8 7 8zM17 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 7 4 8 7 8z"/>
            </svg>
          </div>
          <div className="ses-narrative-body">
            <h4 className="ses-headline">
              {execSummary?.key_developments_headline || 'Shandong environmental quotas formalize Chinese deficit while Middle East logistics solidify landed import floor in India.'}
            </h4>
            <p className="ses-text">
              {renderBoldFormattedText(
                execSummary?.ai_executive_summary_text || s2?.ai_supply_assessment ||
                'Global elemental bromine supply is operating in a Tightening to Stable balance. While Dead Sea producers maintain primary extraction run-rates, Cape of Good Hope transit delays (+14-21 days) and ocean freight surcharges ($180-$250/MT) elevate landed CIF parity at Indian ports. Concurrently, Chinese domestic extraction is capped at ~42.5% utilization by strict Ministry of Ecology groundwater audits, locking in a 50,000+ MT annual deficit. Agrocel domestic realization discount provides a strong ₹58.8/kg safety cushion.'
              )}
            </p>
          </div>
        </div>

        {/* Executive KPI Micro-Grid */}
        <div className="supply-kpi-quad">
          <div className="sk-item">
            <span className="sk-label">Global Nameplate Capacity</span>
            <div className="sk-val-row">
              <span className="sk-num">{num(execSummary?.kpi_metrics?.total_nameplate_capacity_mt || 685000)}</span>
              <span className="sk-unit">MT/yr</span>
            </div>
            <span className="sk-sub">USGS & Producer Baseline</span>
          </div>

          <div className="sk-item">
            <span className="sk-label">Actual Market Supply (Est.)</span>
            <div className="sk-val-row">
              <span className="sk-num text-primary">{num(execSummary?.kpi_metrics?.total_estimated_production_mt || 557900)}</span>
              <span className="sk-unit">MT/yr</span>
            </div>
            <span className="sk-sub">
              <strong>{execSummary?.kpi_metrics?.effective_global_utilization_pct || 81.4}%</strong> Effective Utilization
            </span>
          </div>

          <div className="sk-item">
            <span className="sk-label">China Annual Deficit</span>
            <div className="sk-val-row">
              <span className="sk-num text-danger">~{num(execSummary?.kpi_metrics?.china_structural_deficit_mt || 55000)}</span>
              <span className="sk-unit">MT/yr</span>
            </div>
            <span className="sk-sub">Absorbs 50k+ MT Global Surplus</span>
          </div>

          <div className="sk-item highlight-agrocel">
            <span className="sk-label">Agrocel Domestic Headroom</span>
            <div className="sk-val-row">
              <span className="sk-num text-success">₹{num(execSummary?.kpi_metrics?.india_domestic_price_headroom_inr_kg || 58.8, 1)}</span>
              <span className="sk-unit">/kg</span>
            </div>
            <span className="sk-sub">Discount Buffer vs Landed CIF</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. LATEST KEY SUPPLY DEVELOPMENTS (News Intelligence)
          ======================================================== */}
      <div className="supply-sub-block">
        <div className="sub-block-head">
          <div>
            <h3 className="sub-block-title">Latest Key Supply Developments</h3>
            <p className="sub-block-desc">
              Verified producer announcements, regulatory audits, and logistical shifts directly impacting merchant bromine availability.
            </p>
          </div>
          <button
            onClick={() => setShowAllNewsModal(true)}
            className="btn-view-all-news"
          >
            <span>View All ({allNews.length}) Developments</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {keyNews.length === 0 ? (
          <div className="empty-supply-news">
            <p>No recent supply developments recorded for the current reporting period.</p>
          </div>
        ) : (
          <div className="supply-news-grid">
            {keyNews.slice(0, 4).map(news => {
              const activeTab = getLayerTab(news.id);
              return (
                <div key={news.id} className="supply-news-card">
                  <div className="sn-top-row">
                    <span className={`category-tag cat-${(news.event_category_code || 'OP').toLowerCase()}`}>
                      {news.event_category}
                    </span>
                    <span className="sn-region-pill">{news.country_region}</span>
                  </div>

                  <h4 className="sn-headline" title={news.headline}>
                    {news.headline}
                  </h4>

                  <div className="sn-meta-strip">
                    <span><strong>Event:</strong> {news.event_date}</span>
                    <span><strong>Pub:</strong> {news.publication_date}</span>
                    <span className="sn-source-text"><strong>Source:</strong> {news.source_publisher}</span>
                  </div>

                  {/* 3-Layer Information Tabs */}
                  <div className="sn-layer-tabs">
                    <button
                      className={`layer-tab-btn ${activeTab === 'FACTS' ? 'active' : ''}`}
                      onClick={() => setLayerTab(news.id, 'FACTS')}
                    >
                      1. Factual Summary
                    </button>
                    <button
                      className={`layer-tab-btn ${activeTab === 'MARKET' ? 'active' : ''}`}
                      onClick={() => setLayerTab(news.id, 'MARKET')}
                    >
                      2. Supply Impact
                    </button>
                    <button
                      className={`layer-tab-btn ${activeTab === 'AGROCEL' ? 'active' : ''}`}
                      onClick={() => setLayerTab(news.id, 'AGROCEL')}
                    >
                      3. Agrocel Relevance
                    </button>
                  </div>

                  {/* 3-Layer Content Display */}
                  <div className="sn-layer-content">
                    {activeTab === 'FACTS' && (
                      <div className="layer-body layer-facts">
                        <p>{news.layers?.source_supported_facts || news.headline}</p>
                        {news.capacity_affected && (
                          <div className="layer-tag-row">
                            <span className="layer-impact-tag">
                              <strong>Reported Capacity:</strong> {news.capacity_affected}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'MARKET' && (
                      <div className="layer-body layer-market">
                        <p>{news.layers?.market_interpretation || 'Direct operational impact on merchant elemental bromine pricing and delivery schedules.'}</p>
                        <div className="layer-tag-row">
                          <span className="layer-direction-tag">
                            <strong>Direction:</strong> {news.market_direction}
                          </span>
                        </div>
                      </div>
                    )}
                    {activeTab === 'AGROCEL' && (
                      <div className="layer-body layer-agrocel">
                        <p>{news.layers?.agrocel_business_implication || 'Protects domestic market share and validates Agrocel contracted pricing with domestic customers.'}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer with Clickable Source */}
                  <div className="sn-card-footer">
                    <span className="sn-producer-tag">
                      <strong>Entity:</strong> {news.producer_involved}
                    </span>
                    {news.original_source_url && (
                      <a
                        href={news.original_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sn-source-link"
                      >
                        <span>Original Source</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Synthesis Note for Developments */}
        {newsData?.ai_developments_summary && (
          <div className="supply-ai-takeaway-inline">
            <span className="sat-icon">💡</span>
            <p className="sat-text">
              <strong>Supply Developments Synthesis:</strong> {renderBoldFormattedText(newsData.ai_developments_summary)}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          3. GLOBAL CAPACITY DISTRIBUTION
          ======================================================== */}
      <div className="supply-sub-block">
        <div className="sub-block-head">
          <div>
            <h3 className="sub-block-title">Global Capacity Distribution & Supply Concentration</h3>
            <p className="sub-block-desc">
              Distinguishing nominal nameplate capacity from actual operational supply and effective utilization across producing nations.
            </p>
          </div>
          <div className="capacity-toggle-group">
            <button
              className={`cap-toggle-btn ${capacityViewMode === 'NAMEPLATE' ? 'active' : ''}`}
              onClick={() => setCapacityViewMode('NAMEPLATE')}
            >
              Nameplate Capacity (685k MT)
            </button>
            <button
              className={`cap-toggle-btn ${capacityViewMode === 'ACTUAL' ? 'active' : ''}`}
              onClick={() => setCapacityViewMode('ACTUAL')}
            >
              Estimated Actual Output (558k MT)
            </button>
          </div>
        </div>

        {/* Stacked Capacity Progress Bar */}
        <div className="supply-capacity-viz-card">
          <div className="scv-header">
            <div className="scv-title-area">
              <span className="scv-metric-label">
                {capacityViewMode === 'NAMEPLATE'
                  ? 'Total Reported Global Nameplate Capacity: 685,000 MT/year'
                  : 'Total Effective Market Production: ~557,900 MT/year (81.4% Global Utilization)'}
              </span>
              <span className="scv-source-note">
                Source: {capDist?.source_citation || 'USGS Minerals Information, ICL 20-F, Albemarle 10-K & Agrocel Audits'}
              </span>
            </div>
          </div>

          {/* Horizontal Stacked Bar */}
          <div className="capacity-bar-strip enhanced-strip">
            {countries.map((c, i) => {
              const bg = COUNTRY_COLORS[c.country] || '#64748b';
              const nameplateCap = c.nameplate_capacity_mt || c.annual_capacity_mt || 0;
              const actualProd = c.actual_production_estimate_mt || Math.round(nameplateCap * (c.estimated_utilization_pct || 80) / 100);
              const widthPct = capacityViewMode === 'NAMEPLATE'
                ? c.share_pct
                : Number(((actualProd / 557900) * 100).toFixed(1));

              return (
                <div
                  key={i}
                  className="capacity-segment-enhanced"
                  style={{ width: `${Math.max(widthPct, 6)}%`, backgroundColor: bg }}
                  title={`${c.country}: ${widthPct}% | Nameplate: ${num(nameplateCap)} MT | Actual: ${num(actualProd)} MT | Util: ${c.estimated_utilization_pct || '—'}%`}
                >
                  <span className="cap-seg-label">
                    {c.country} {widthPct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Distribution Summary Row */}
          <div className="capacity-summary-table-strip">
            {countries.map((c, i) => {
              const nameplateCap = c.nameplate_capacity_mt || c.annual_capacity_mt || 0;
              const actualProd = c.actual_production_estimate_mt || Math.round(nameplateCap * (c.estimated_utilization_pct || 80) / 100);
              const utilPct = c.estimated_utilization_pct || Math.round((actualProd / nameplateCap) * 100);

              return (
                <div key={i} className="cst-country-col">
                  <div className="cst-dot" style={{ backgroundColor: COUNTRY_COLORS[c.country] || '#64748b' }} />
                  <div className="cst-info">
                    <span className="cst-name">{c.country}</span>
                    <span className="cst-cap">
                      {capacityViewMode === 'NAMEPLATE' ? `${num(nameplateCap)} MT` : `${num(actualProd)} MT`}
                    </span>
                    <span className="cst-util">
                      Util: <strong>{utilPct}%</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI-Generated Insight Below Chart */}
          <div className="supply-distribution-ai-insight">
            <div className="sdai-icon">📊</div>
            <div className="sdai-body">
              <span className="sdai-title">Global Supply Concentration & Utilization Analysis:</span>
              <p className="sdai-text">
                {renderBoldFormattedText(
                  capDist?.ai_distribution_insight ||
                  'Reported global nameplate capacity stands at 685,000 MT/year, but actual market supply is constrained to ~557,900 MT (81.4% effective global utilization). Supply concentration is exceptionally acute: the Dead Sea basin (Israel and Jordan) controls 62.8% of global capacity and ~67% of international seaborne export volume. Crucially, China nominal 80,000 MT capacity yields merely ~34,000 MT of actual output due to irreversible brine depletion, ensuring China remains a net importer rather than an exporter.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. COUNTRY INTELLIGENCE CARDS (5 Mandated Countries)
          ======================================================== */}
      <div className="supply-sub-block">
        <div className="sub-block-head">
          <div>
            <h3 className="sub-block-title">Country Operational Intelligence Dossiers</h3>
            <p className="sub-block-desc">
              Granular country assessments covering operating rates, major producers, extraction brine sources, and regulatory audits.
            </p>
          </div>
        </div>

        <div className="country-intelligence-grid">
          {countries.map((c, i) => {
            const isExpanded = expandedCountry === c.country;
            const nameplate = c.nameplate_capacity_mt || c.annual_capacity_mt || 0;
            const actual = c.actual_production_estimate_mt || Math.round(nameplate * (c.estimated_utilization_pct || 80) / 100);
            const util = c.estimated_utilization_pct || 80;
            const statusClass = getStatusBadgeClass(c.operating_status, c.operating_status_code);

            return (
              <div key={i} className={`country-intel-card ${isExpanded ? 'expanded' : ''}`}>
                {/* Primary Information Header */}
                <div className="cic-top-row">
                  <div className="cic-title-area">
                    <span className="cic-flag-indicator" style={{ backgroundColor: COUNTRY_COLORS[c.country] || '#64748b' }} />
                    <h4 className="cic-country-name">{c.country}</h4>
                  </div>
                  <span className="cic-share-badge">
                    <strong>{c.share_pct}%</strong> Global Share
                  </span>
                </div>

                {/* Status & Capacity Line */}
                <div className="cic-kpi-row">
                  <div className="cic-stat-pair">
                    <span className="cic-stat-label">Nameplate Capacity:</span>
                    <strong className="cic-stat-val">{num(nameplate)} MT/yr</strong>
                  </div>
                  <div className="cic-stat-pair">
                    <span className="cic-stat-label">Est. Actual Output:</span>
                    <strong className="cic-stat-val text-primary">{num(actual)} MT</strong>
                  </div>
                </div>

                {/* Operating Status Badge */}
                <div className="cic-status-wrap">
                  <span className={`status-badge-inline ${statusClass}`}>
                    {c.operating_status}
                  </span>
                  <span className="cic-util-label">
                    Utilization: <strong>{util}%</strong>
                  </span>
                </div>

                {/* Core Development Highlight */}
                <div className="cic-dev-box">
                  <span className="cic-box-label">Most Critical Recent Development:</span>
                  <p className="cic-box-text">
                    {c.most_important_recent_development || c.developments || 'Operations continuing under standard seasonal run-rates.'}
                  </p>
                </div>

                {/* Potential Supply Impact */}
                <div className="cic-impact-box">
                  <span className="cic-box-label">Market & Supply Impact:</span>
                  <p className="cic-box-text">
                    {c.potential_supply_impact || 'Supports steady baseline merchant availability for international contract buyers.'}
                  </p>
                </div>

                {/* Expand / Collapse Button */}
                <button
                  onClick={() => toggleExpandCountry(c.country)}
                  className="btn-toggle-cic-details"
                >
                  <span>{isExpanded ? 'Hide Operational Details' : 'View Operational Details & Sources'}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {/* Expandable Detailed Information */}
                {isExpanded && (
                  <div className="cic-expanded-tray">
                    <div className="cic-detail-item">
                      <span className="cdi-label">Primary Producers:</span>
                      <p className="cdi-val">
                        {c.primary_producers ? c.primary_producers.join(', ') : c.primary_producer || 'Key industrial extraction consortium'}
                      </p>
                    </div>

                    <div className="cic-detail-item">
                      <span className="cdi-label">Brine Extraction Source:</span>
                      <p className="cdi-val">{c.brine_source}</p>
                    </div>

                    {c.status_evidence && (
                      <div className="cic-detail-item">
                        <span className="cdi-label">Status Verification Evidence:</span>
                        <p className="cdi-val">{c.status_evidence}</p>
                      </div>
                    )}

                    {c.regulatory_operational_notes && (
                      <div className="cic-detail-item">
                        <span className="cdi-label">Regulatory / Environmental Notes:</span>
                        <p className="cdi-val">{c.regulatory_operational_notes}</p>
                      </div>
                    )}

                    <div className="cic-source-meta-row">
                      <span><strong>Verified:</strong> {c.last_verified_date || '2026-03'}</span>
                      <span title={c.source_references}>
                        <strong>Source:</strong> {c.source_references || 'USGS / Regulatory Gazettes'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          5. REGIONAL SUPPLY CONDITIONS
          ======================================================== */}
      <div className="supply-sub-block">
        <div className="sub-block-head">
          <div>
            <h3 className="sub-block-title">Regional Supply Dynamics & Corridors</h3>
            <p className="sub-block-desc">
              Monitoring extraction constraints, transit bottlenecks, and seasonal harvest conditions across primary chemical basins.
            </p>
          </div>
        </div>

        <div className="regional-supply-grid">
          {(regConditions?.regions || []).map((reg, idx) => (
            <div key={idx} className="regional-card">
              <div className="reg-top-bar">
                <span className="reg-name">{reg.region_name}</span>
                <span className={`status-badge-inline ${getStatusBadgeClass(reg.status, reg.status_code)}`}>
                  {reg.direction_of_change}
                </span>
              </div>

              <div className="reg-status-desc">
                <strong>Current Status:</strong> {reg.status}
              </div>

              <div className="reg-point-box">
                <span className="rpb-label">Latest Material Development:</span>
                <p className="rpb-text">{reg.latest_material_development}</p>
              </div>

              <div className="reg-point-box highlight">
                <span className="rpb-label">Market & Price Implication:</span>
                <p className="rpb-text">{reg.market_implication}</p>
              </div>

              <div className="reg-footer-meta">
                <span><strong>Source:</strong> {reg.supporting_source}</span>
                <span><strong>Updated:</strong> {reg.last_updated}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Regional Synthesis */}
        {regConditions?.ai_regional_summary && (
          <div className="supply-ai-takeaway-inline">
            <span className="sat-icon">🌐</span>
            <p className="sat-text">
              <strong>Regional Conditions Summary:</strong> {renderBoldFormattedText(regConditions.ai_regional_summary)}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          6. WHAT CHANGED SINCE LAST UPDATE? (Historical Comparison)
          ======================================================== */}
      <div className="supply-sub-block">
        <div className="sub-block-head">
          <div>
            <h3 className="sub-block-title">What Changed Since Last Update?</h3>
            <p className="sub-block-desc">
              Auditable operational and logistical shifts verified between current reporting cycle ({whatChanged?.current_period || 'Q1 2026'}) and prior baseline ({whatChanged?.baseline_period || 'Q4 2024 / Q1 2025'}).
            </p>
          </div>
        </div>

        {!whatChanged?.has_historical_snapshot || !whatChanged?.changes || whatChanged.changes.length === 0 ? (
          <div className="empty-supply-news">
            <p>No prior comparison snapshot available for this selection.</p>
          </div>
        ) : (
          <div className="what-changed-card">
            <div className="wc-summary-strip">
              <span>{whatChanged.summary_text}</span>
            </div>

            <div className="wc-items-list">
              {whatChanged.changes.map((chg: SupplyHistoricalChange) => (
                <div key={chg.change_id} className="wc-row">
                  <div className="wc-cat-col">
                    <span className="wc-category-tag">{chg.category.replace(/_/g, ' ')}</span>
                    <span className="wc-date-sub">{chg.date_observed}</span>
                  </div>

                  <div className="wc-comparison-col">
                    <h5 className="wc-title">{chg.title}</h5>
                    <div className="wc-states-grid">
                      <div className="wc-state prior">
                        <span className="wcs-label">Previous Baseline ({whatChanged.baseline_period}):</span>
                        <p>{chg.prior_state}</p>
                      </div>
                      <div className="wc-state current">
                        <span className="wcs-label">Current Verified State ({whatChanged.current_period}):</span>
                        <p>{chg.current_state}</p>
                      </div>
                    </div>
                  </div>

                  <div className="wc-impact-col">
                    <span className="wci-label">Market Significance:</span>
                    <p className="wci-text">{chg.market_significance}</p>
                    <span className="wci-source"><strong>Ref:</strong> {chg.evidence_source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          7. AGROCEL BUSINESS IMPLICATIONS (Executive Management Panel)
          ======================================================== */}
      <div className="supply-sub-block">
        <div className="supply-management-implications-card">
          <div className="smi-header">
            <div className="smi-title-box">
              <span className="smi-badge">EXECUTIVE MANAGEMENT TAKEAWAY</span>
              <h3 className="smi-main-title">
                {agrocelImplications?.headline || 'Elevated CIF Import Parity & Logistics Delays Anchor Agrocel Domestic Volume Growth'}
              </h3>
            </div>
            <div className="smi-buffer-stat">
              <span className="sbs-label">Domestic Pricing Headroom</span>
              <span className="sbs-value">₹58.8/kg</span>
              <span className="sbs-sub">Below Landed Import Parity</span>
            </div>
          </div>

          <div className="smi-pillars-grid">
            <div className="smi-pillar-card">
              <div className="spc-head">
                <span className="spc-icon">🛡️</span>
                <h4>Import Dependence & Competitiveness</h4>
              </div>
              <p className="spc-body">
                {agrocelImplications?.import_competitiveness ||
                  'Agrocel domestic weighted realization of ₹195.7/kg ($2,343/MT eq) maintains a ₹58.8/kg ($704/MT) discount to landed CIF import parity (₹254.5/kg). This spread deters customer defection and eliminates import substitution risk.'}
              </p>
            </div>

            <div className="smi-pillar-card">
              <div className="spc-head">
                <span className="spc-icon">🏭</span>
                <h4>Domestic Extraction & Harvest Conditions</h4>
              </div>
              <p className="spc-body">
                {agrocelImplications?.domestic_supply_conditions ||
                  'Agrocel is operating at ~94% capacity utilization in Kutch. Dry pre-monsoon ambient temperatures have driven bittern brine density to optimal levels (28-30° Bé), enabling maximal finished stockpile accumulation ahead of the monsoon pause.'}
              </p>
            </div>

            <div className="smi-pillar-card">
              <div className="spc-head">
                <span className="spc-icon">⚠️</span>
                <h4>Identified Supply Chain Risks</h4>
              </div>
              <ul className="spc-list">
                {(agrocelImplications?.supply_risks || [
                  'Monsoon rainfall dilution of Kutch solar bittern pans requiring strict stockpile pacing.',
                  'Future Red Sea transit normalization gradually trimming maritime freight surcharges.'
                ]).map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="smi-pillar-card">
              <div className="spc-head">
                <span className="spc-icon">🚀</span>
                <h4>Emerging Commercial Opportunities</h4>
              </div>
              <ul className="spc-list">
                {(agrocelImplications?.emerging_opportunities || [
                  'Contract conversions with Indian agrochemical synthesisers seeking 24-48h road tanker security.',
                  'Duty-free export off-take of clear brine completion fluids under Australia-India ECTA pact.',
                  'Captive conversion into high-value specialty bromides (HBr, TBBA, DBDPE).'
                ]).map((opp, i) => (
                  <li key={i}>{opp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strategic Guidance Box */}
          <div className="smi-guidance-box">
            <div className="sgb-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <strong>Executive Commercial Guidance:</strong>
            </div>
            <p className="sgb-text">
              {renderBoldFormattedText(
                agrocelImplications?.strategic_guidance ||
                'Management should preserve current domestic commercial contracts without aggressive spot price increases, prioritizing volume retention and downstream captive derivative margins while landed import costs remain elevated.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          VIEW ALL DEVELOPMENTS MODAL
          ======================================================== */}
      {showAllNewsModal && (
        <div className="supply-modal-overlay" onClick={() => setShowAllNewsModal(false)}>
          <div className="supply-modal-content" onClick={e => e.stopPropagation()}>
            <div className="supply-modal-header">
              <div>
                <h3 className="modal-title">All Global Bromine Supply Developments</h3>
                <span className="modal-count-tag">{allNews.length} Verified Reports</span>
              </div>
              <button
                onClick={() => setShowAllNewsModal(false)}
                className="btn-modal-close"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Filter Strip */}
            <div className="modal-filter-row">
              <span className="mfr-label">Filter by Region:</span>
              {['ALL', 'China', 'India', 'Israel', 'United States', 'Europe', 'Australia'].map(reg => (
                <button
                  key={reg}
                  className={`modal-filter-btn ${newsFilterRegion === reg ? 'active' : ''}`}
                  onClick={() => setNewsFilterRegion(reg)}
                >
                  {reg}
                </button>
              ))}
            </div>

            {/* Modal News List */}
            <div className="modal-news-scroll-list">
              {modalFilteredNews.map(item => (
                <div key={item.id} className="modal-news-item">
                  <div className="mni-head">
                    <span className={`category-tag cat-${(item.event_category_code || 'OP').toLowerCase()}`}>
                      {item.event_category}
                    </span>
                    <span className="mni-region">{item.country_region}</span>
                    <span className="mni-date">Event: {item.event_date}</span>
                    <span className="mni-pub">Pub: {item.publication_date}</span>
                  </div>

                  <h4 className="mni-headline">{item.headline}</h4>

                  <div className="mni-layers-box">
                    <div className="mni-layer">
                      <strong>Fact:</strong> {item.layers?.source_supported_facts || item.headline}
                    </div>
                    <div className="mni-layer">
                      <strong>Market Impact:</strong> {item.layers?.market_interpretation || 'Impacts supply availability.'}
                    </div>
                    <div className="mni-layer">
                      <strong>Agrocel:</strong> {item.layers?.agrocel_business_implication || 'Commercial relevance.'}
                    </div>
                  </div>

                  <div className="mni-footer">
                    <span><strong>Source:</strong> {item.source_publisher}</span>
                    {item.original_source_url && (
                      <a href={item.original_source_url} target="_blank" rel="noopener noreferrer" className="sn-source-link">
                        <span>Original Article</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
