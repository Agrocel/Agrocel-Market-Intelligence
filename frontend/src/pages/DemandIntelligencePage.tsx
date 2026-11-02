import React, { useState } from 'react';
import type { DashboardData, Section3Demand, DataGroundingItem } from '../types';
import type { AppRoute } from '../navigation';
import { DataGroundedText } from '../components/DataProvenance';
import { PageHeader, IntelligenceStatusStrip, SectionNav } from '../components/PageHeader';

interface Props {
  data: DashboardData;
  onNavigate: (route: AppRoute, subTab?: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

export function DemandIntelligencePage({ data, onNavigate, onSelectGrounding }: Props) {
  const { overview, sales } = data;
  const execOverview = overview?.executive_overview;
  const demand: Section3Demand | undefined = execOverview?.section_3_demand;

  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('demand-assessment');

  if (!demand?.downstream_sectors?.length || !demand.regional_demand?.length) {
    return (
      <div className="page-shell demand-intelligence-page">
        <section className="exec-card decision-data-state">
          <span className="decision-panel-eyebrow">Demand intelligence</span>
          <h1>Verified demand data is not available</h1>
          <p>Load a verified downstream-sector and regional-demand update before using this page for management decisions.</p>
          <button type="button" className="btn-snapshot-cta" onClick={() => onNavigate('overview')}>Return to overview <span>→</span></button>
        </section>
      </div>
    );
  }

  const sectors = demand.downstream_sectors;
  const regions = demand.regional_demand;
  const leadingSector = [...sectors].sort((a, b) => b.share_pct - a.share_pct)[0];
  const indiaDemand = regions.find(region => region.region.toLowerCase() === 'india');

  // Internal customer segments from sales records
  const totalAgrocelSales = sales.reduce((sum, s) => sum + (Number(s.quantity_mt) || 0), 0);
  const agrochemSales = sales.filter(s => (s.segment || '').toLowerCase().includes('agro')).reduce((sum, s) => sum + (Number(s.quantity_mt) || 0), 0);
  const pharmaSales = sales.filter(s => (s.segment || '').toLowerCase().includes('pharma')).reduce((sum, s) => sum + (Number(s.quantity_mt) || 0), 0);
  const specialtySales = Math.max(0, totalAgrocelSales - agrochemSales - pharmaSales);

  const activeSectorObj = sectors.find(s => s.sector === selectedSector) || sectors[0];

  return (
    <div className="page-shell demand-intelligence-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Demand Intelligence</span>
          </>
        }
        title="Global & Domestic Demand Intelligence"
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Anchor Sector',
            value: leadingSector ? `${leadingSector.sector} (${num(leadingSector.share_pct, 1)}%)` : '—',
            dot: 'blue'
          },
          {
            label: 'Sector Outlook',
            value: activeSectorObj?.trend || 'Expanding',
            tone: 'positive'
          },
          {
            label: 'India Consumption',
            value: indiaDemand ? `${num(indiaDemand.annual_consumption_mt)} MT/year` : '—'
          },
          {
            label: 'Agrocel Sales Volume',
            value: `${num(totalAgrocelSales, 0)} MT`,
            tone: 'positive'
          }
        ]}
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'demand-assessment', label: 'Executive Assessment' },
          { id: 'downstream-sectors', label: 'Downstream Sectors' },
          { id: 'regional-demand', label: 'Regional Absorption' },
          { id: 'commercial-strategy', label: 'Commercial Guidance' }
        ]}
        activeId={activeSection}
        onSelect={setActiveSection}
        ariaLabel="Demand Section Navigation"
      />

      {/* A. Executive Demand Assessment */}
      <section id="demand-assessment" className="exec-card section-container demand-executive-brief">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">EXECUTIVE ASSESSMENT</span>
            <h2 className="section-title">Demand Dynamics & Sector Resilience</h2>
          </div>
          <span className="evidence-badge">Validated Downstream Baseline · 2026</span>
        </div>

        <div className="synthesis-quote-block" style={{ marginBottom: '1.25rem' }}>
          <div className="sq-icon">💡</div>
          <div className="sq-text-area">
            <h3 className="sq-headline">
              Specialty Synthesis Insulates Indian Offtake Against Global Cyclicality
            </h3>
            <div className="sq-body">
              <p style={{ margin: 0, color: 'var(--text-secondary, #334155)', lineHeight: 1.55 }}>
                {demand?.ai_demand_interpretation || (
                  <>
                    Indian bromine demand is expanding at <strong>7–9% CAGR</strong> driven by agrochemical and API synthesis clusters in Dahej and Panoli. While global flame retardants (42% share) recover gradually, domestic specialty off-take remains firm and price-inelastic.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Primary Demand Indicators */}
        <div className="demand-kpi-quad">
          <div className="dkpi-box">
            <span className="dkpi-label">Anchor Downstream Sector</span>
            <strong className="dkpi-val font-bold text-teal">{leadingSector ? `${leadingSector.sector} (${num(leadingSector.share_pct, 1)}%)` : '—'}</strong>
            <span className="dkpi-sub">Largest global demand category</span>
          </div>
          <div className="dkpi-box">
            <span className="dkpi-label">Selected sector outlook</span>
            <strong className="dkpi-val font-bold text-positive">{activeSectorObj?.trend || '—'}</strong>
            <span className="dkpi-sub">Verified sector momentum</span>
          </div>
          <div className="dkpi-box">
            <span className="dkpi-label">India Annual Consumption</span>
            <strong className="dkpi-val font-bold">{indiaDemand ? `${num(indiaDemand.annual_consumption_mt)} MT/year` : '—'}</strong>
            <span className="dkpi-sub">Domestic absorption footprint</span>
          </div>
          <div className="dkpi-box">
            <span className="dkpi-label">Agrocel Domestic Run-Rate</span>
            <strong className="dkpi-val font-bold text-brand">{num(totalAgrocelSales, 0)} MT</strong>
            <span className="dkpi-sub">Verified sales ledger volume</span>
          </div>
        </div>
      </section>

      {/* B. Demand by End-Use Industry & Interactive Dossier */}
      <section id="downstream-sectors" className="exec-card section-container downstream-sectors-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">DOWNSTREAM DECOMPOSITION</span>
            <h2 className="section-title">End-Use Consuming Industry Breakdown</h2>
          </div>
        </div>

        <div className="sectors-layout-grid">
          {/* Sector Selector List */}
          <div className="sectors-nav-list">
            {sectors.map(sec => {
              const isSelected = activeSectorObj.sector === sec.sector;
              return (
                <div
                  key={sec.sector}
                  className={`sector-select-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSector(sec.sector)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ss-top">
                    <strong className="ss-name font-semibold">{sec.sector}</strong>
                    <span className="ss-share font-bold text-teal">{sec.share_pct}%</span>
                  </div>
                  <div className="ss-progress-bar">
                    <div className="ss-progress-fill" style={{ width: `${(sec.share_pct / 45) * 100}%` }} />
                  </div>
                  <div className="ss-bottom">
                    <span className="ss-trend font-medium">{sec.trend}</span>
                    <span className="ss-arrow">→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Sector Detailed Dossier */}
          <div className="sector-detail-dossier">
            <div className="sdd-header">
              <div>
                <span className="sdd-tag">END-USE SECTOR PROFILE</span>
                <h3 className="sdd-title font-serif">{activeSectorObj.sector}</h3>
              </div>
              <div className="sdd-share-badge">
                <span className="ssb-lbl">Global Share:</span>
                <strong className="ssb-val font-bold text-teal">{activeSectorObj.share_pct}%</strong>
              </div>
            </div>

            <div className="sdd-props-grid">
              <div className="sdd-prop-box">
                <span className="sdd-prop-lbl">Key Chemical Derivatives</span>
                <strong className="sdd-prop-val">{activeSectorObj.key_products}</strong>
              </div>
              <div className="sdd-prop-box">
                <span className="sdd-prop-lbl">End-Market Applications</span>
                <strong className="sdd-prop-val">{activeSectorObj.end_markets}</strong>
              </div>
              <div className="sdd-prop-box">
                <span className="sdd-prop-lbl">Demand Trajectory & Velocity</span>
                <strong className="sdd-prop-val text-brand">{activeSectorObj.trend}</strong>
              </div>
              <div className="sdd-prop-box">
                <span className="sdd-prop-lbl">Pricing Elasticity</span>
                <strong className="sdd-prop-val">
                  {activeSectorObj.sector.includes('Pharma') || activeSectorObj.sector.includes('Agro')
                    ? 'Inelastic (Formulation Spec Locked)'
                    : 'Moderate (Substitution to PFRs possible)'}
                </strong>
              </div>
            </div>

            <div className="sdd-commentary-box">
              <h4 className="sdd-subheading">Analytical Commentary & Commercial Relevance</h4>
              <p className="sdd-commentary-text">{activeSectorObj.commentary}</p>
            </div>

            <div className="sdd-agrocel-angle">
              <h4 className="sdd-subheading text-teal">Agrocel Commercial Positioning</h4>
              <p className="sdd-agrocel-text">
                {activeSectorObj.sector.includes('Agro') && (
                  <>Agrocel maintains dedicated pipeline and bulk tanker delivery agreements with major Gujarat agrochemical formulators in Dahej and Ankleshwar, securing baseline offtake with zero maritime demurrage risk.</>
                )}
                {activeSectorObj.sector.includes('Pharma') && (
                  <>Agrocel supplies high-purity elemental bromine and captive hydrobromic acid (HBr) for API manufacturing, capturing premium realizations over raw liquid merchant contracts.</>
                )}
                {activeSectorObj.sector.includes('Flame') && (
                  <>While China and Israel dominate bulk TBBA export compounding, Agrocel evaluates captive TBBA and brominated polymer development to supply domestic electronics PCB compounders under the Make in India initiative.</>
                )}
                {activeSectorObj.sector.includes('Drilling') && (
                  <>Clear brine completion fluids represent an attractive export growth corridor under the India-Australia ECTA trade pact, targeting Australian offshore oil and geothermal projects.</>
                )}
                {activeSectorObj.sector.includes('Water') && (
                  <>Industrial biocide demand in power plant cooling towers provides counter-cyclical volume absorption during monsoon periods when agricultural spraying softens.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* C. Geographic Demand & Regional Patterns */}
      <section id="regional-demand" className="exec-card section-container regional-demand-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">GEOGRAPHIC ABSORPTION</span>
            <h2 className="section-title">Regional Consumption & Trade Imbalances</h2>
          </div>
        </div>

        <div className="regional-demand-table-wrap">
          <table className="standard-data-table">
            <thead>
              <tr>
                <th>Consuming Region</th>
                <th>Global Share (%)</th>
                <th>Estimated Annual MT</th>
                <th>Structural Operating Status</th>
                <th>Agrocel Exposure / Alignment</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((reg, idx) => (
                <tr key={reg.region || idx}>
                  <td className="font-semibold text-primary">{reg.region}</td>
                  <td className="font-bold text-teal">{reg.share_pct}%</td>
                  <td className="font-mono">{num(reg.annual_consumption_mt)} MT</td>
                  <td className="text-muted">{reg.status}</td>
                  <td>
                    {reg.region === 'India' && (
                      <span className="status-pill status-green">Primary Market (99%+ of Dispatches)</span>
                    )}
                    {reg.region === 'China' && (
                      <span className="status-pill status-blue">Price Umbrella & Deficit Pull</span>
                    )}
                    {reg.region === 'United States' && (
                      <span className="status-pill status-grey">Captively Supplied by Smackover</span>
                    )}
                    {reg.region === 'Europe' && (
                      <span className="status-pill status-grey">REACH Regulatory Screening</span>
                    )}
                    {reg.region === 'Rest of World' && (
                      <span className="status-pill status-blue">Australia ECTA Opportunity</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* D. Agrocel Commercial Relevance & Takeaway */}
      <section id="commercial-strategy" className="exec-card section-container demand-takeaway-card">
        <div className="takeaway-card-inner">
          <div className="takeaway-header-bar">
            <div>
              <span className="thb-badge">COMMERCIAL VP STRATEGY</span>
              <h2 className="thb-title">Downstream Demand Synthesis & Sales Guidance</h2>
            </div>
          </div>
          <div className="takeaway-pillars-grid">
            <div className="tp-card">
              <div className="tpc-icon">🌱</div>
              <h4 className="tpc-title">Agrochemical Decoupling</h4>
              <p className="tpc-body">
                India's crop protection sector is expanding at <strong>~9% CAGR</strong>. Agrocel domestic volume is insulated from global electronics by multi-year relationships with Gujarat formulation leaders.
              </p>
            </div>
            <div className="tp-card">
              <div className="tpc-icon">💊</div>
              <h4 className="tpc-title">API Purity Premium</h4>
              <p className="tpc-body">
                Pharma synthesizers require low-chlorine (&lt;0.05%) bromine. Agrocel marine bittern extraction delivers certified high-assay specs, capturing <strong>₹5–8/kg premiums</strong> over crude imports.
              </p>
            </div>
            <div className="tp-card">
              <div className="tpc-icon">📈</div>
              <h4 className="tpc-title">Captive Derivative Transition</h4>
              <p className="tpc-body">
                Forward-integrating <strong>20–30% of elemental volume</strong> into captive HBr and specialty derivatives locks in margin defense against merchant liquid cycle fluctuations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
