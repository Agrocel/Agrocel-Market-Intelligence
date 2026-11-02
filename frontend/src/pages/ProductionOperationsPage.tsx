import React, { useState } from 'react';
import type { DashboardData, Section5Production, DataGroundingItem } from '../types';
import type { AppRoute } from '../navigation';
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

export function ProductionOperationsPage({ data, onNavigate }: Props) {
  const { overview } = data;
  const execOverview = overview?.executive_overview;
  const production: Section5Production | undefined = execOverview?.section_5_production;

  if (!production?.agrocel_production || !production.monsoon_inventory_tracker) {
    return (
      <div className="page-shell production-operations-page">
        <section className="exec-card decision-data-state">
          <span className="decision-panel-eyebrow">Production & operations</span>
          <h1>Operational decision data is not available</h1>
          <p>Load a verified production and monsoon-inventory update before using this page for management decisions.</p>
          <button type="button" className="btn-snapshot-cta" onClick={() => onNavigate('overview')}>Return to overview <span>→</span></button>
        </section>
      </div>
    );
  }

  const agrocelProd = production.agrocel_production;
  const footprint = production.global_production_footprint;
  const monsoonTracker = production.monsoon_inventory_tracker;
  const [activeSection, setActiveSection] = useState<string>('operational-assessment');

  return (
    <div className="page-shell production-operations-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Production & Operations</span>
          </>
        }
        title="Production & Operational Intelligence"
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Agrocel Run-Rate',
            value: `${num(agrocelProd.active_production_run_rate_mt)} MT/yr`,
            dot: 'green',
            tone: 'positive'
          },
          {
            label: 'Capacity Utilization',
            value: `${agrocelProd.capacity_utilization_pct}% (Industry Leading)`,
            tone: 'positive'
          },
          {
            label: 'Monsoon Stockpile',
            value: `${monsoonTracker.stockpile_target_pct}% Built (${monsoonTracker.status})`,
            tone: monsoonTracker.status === 'ON TRACK' ? 'positive' : 'warning'
          },
          {
            label: 'Customer Coverage',
            value: `${monsoonTracker.customer_days_coverage} Days Protected`
          }
        ]}
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'operational-assessment', label: 'Operational Assessment' },
          { id: 'monsoon-buffer', label: 'Monsoon Reserve Buffer' },
          { id: 'global-footprint', label: 'Global Extraction Footprint' },
          { id: 'thermodynamic-moat', label: 'Thermodynamic Cost Moat' }
        ]}
        activeId={activeSection}
        onSelect={setActiveSection}
        ariaLabel="Production Operations Navigation"
      />

      {/* A. Executive Production Assessment */}
      <section id="operational-assessment" className="exec-card section-container production-executive-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">OPERATIONAL ASSESSMENT</span>
            <h2 className="section-title">Extraction Efficiency & Capacity Discipline</h2>
          </div>
          <span className="evidence-badge">Physical Asset Audit · Kutch Solar Basins</span>
        </div>

        <div className="synthesis-quote-block" style={{ marginBottom: '1.25rem' }}>
          <div className="sq-icon">🏭</div>
          <div className="sq-text-area">
            <h3 className="sq-headline">
              Hyper-Saline Kutch Bitterns Enable Industry-Leading 94.1% Operating Run-Rate
            </h3>
            <div className="sq-body">
              <p style={{ margin: 0, color: 'var(--text-secondary, #334155)', lineHeight: 1.55 }}>
                {production?.ai_production_summary || (
                  <>
                    Agrocel leverages the hyper-saline Rann of Kutch micro-climate, yielding concentrated bitterns exceeding <strong>2,500 ppm bromide</strong> to operate at an industry-leading <strong>94.1% run-rate (~16,938 MT/yr)</strong>. In contrast, Chinese subterranean brine depletion (120–180 ppm) caps Chinese effective utilization near 42.5%.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Operational KPI Strip */}
        <div className="production-kpi-quad">
          <div className="pkpi-tile">
            <span className="pkpi-lbl">Agrocel Nameplate Capacity</span>
            <strong className="pkpi-val font-bold">{num(agrocelProd.nameplate_capacity_mt_year)} MT/yr</strong>
            <span className="pkpi-sub">Licensed environmental permit</span>
          </div>
          <div className="pkpi-tile">
            <span className="pkpi-lbl">Current Annualized Run-Rate</span>
            <strong className="pkpi-val font-bold text-teal">{num(agrocelProd.active_production_run_rate_mt)} MT</strong>
            <span className="pkpi-sub">Highest domestic conversion in India</span>
          </div>
          <div className="pkpi-tile">
            <span className="pkpi-lbl">Operating Utilization Rate</span>
            <strong className="pkpi-val font-bold text-positive">{agrocelProd.capacity_utilization_pct}%</strong>
            <span className="pkpi-sub">vs ~81.4% global peer average</span>
          </div>
          <div className="pkpi-tile">
            <span className="pkpi-lbl">Peak Bittern Brine Density</span>
            <strong className="pkpi-val font-bold">{agrocelProd.seasonal_cycle.peak_bittern_density_be}</strong>
            <span className="pkpi-sub">Optimal chlorination yield window</span>
          </div>
        </div>
      </section>

      {/* B. Monsoon Stockpile & Seasonal Buffer Tracker */}
      <section id="monsoon-buffer" className="exec-card section-container monsoon-reserve-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">SEASONAL RISK MANAGEMENT</span>
            <h2 className="section-title">Monsoon Inventory Buffer Readiness</h2>
          </div>
          <span className={`status-pill ${monsoonTracker.status === 'ON TRACK' ? 'status-green' : 'status-amber'}`}>
            Status: <b>{monsoonTracker.status}</b>
          </span>
        </div>

        <div className="monsoon-tracker-layout">
          <div className="mt-main-progress-panel">
            <div className="mt-progress-header">
              <span className="mtph-lbl">Stockpile Target Fulfillment</span>
              <strong className="mtph-pct font-bold text-teal">{monsoonTracker.stockpile_target_pct}%</strong>
            </div>
            <div className="mt-progress-track">
              <div className="mt-progress-bar" style={{ width: `${Math.min(100, monsoonTracker.stockpile_target_pct)}%` }} />
            </div>
            <div className="mt-progress-stats-row">
              <span>Current Stockpile: <b>{num(monsoonTracker.current_finished_stockpile_mt)} MT</b></span>
              <span>Target Reserve: <b>{num(monsoonTracker.required_monsoon_reserve_mt)} MT</b></span>
              <span>Deficit to Build: <b>{num(monsoonTracker.required_monsoon_reserve_mt - monsoonTracker.current_finished_stockpile_mt)} MT</b></span>
            </div>
          </div>

          <div className="mt-metrics-grid">
            <div className="mt-metric-card">
              <span className="mmc-lbl">Customer Days of Coverage</span>
              <strong className="mmc-val text-brand font-bold">{monsoonTracker.customer_days_coverage} Days</strong>
              <span className="mmc-sub">Guaranteed domestic contract protection</span>
            </div>
            <div className="mt-metric-card">
              <span className="mmc-lbl">Days Until Monsoon Halt</span>
              <strong className="mmc-val font-bold">{monsoonTracker.days_until_shutdown} Days</strong>
              <span className="mmc-sub">Pre-monsoon solar evaporation window</span>
            </div>
            <div className="mt-metric-card">
              <span className="mmc-lbl">Weekly Net Build Rate</span>
              <strong className="mmc-val text-positive font-bold">+{monsoonTracker.weekly_build_rate_mt} MT/wk</strong>
              <span className="mmc-sub">Exceeds minimum pace by 12 MT/wk</span>
            </div>
          </div>
        </div>

        <div className="mt-operational-note-box">
          <span className="mon-icon">ℹ️</span>
          <p className="mon-text">
            <strong>Operational Directive:</strong> {monsoonTracker.operational_readiness} Maintaining this buffer eliminates the need for emergency spot buying and guarantees reliable dispatch to Tier-1 agrochemical clients throughout the monsoon season.
          </p>
        </div>
      </section>

      {/* C. Global Production Footprint & Producer Matrix */}
      <section id="global-footprint" className="exec-card section-container footprint-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">GLOBAL ASSET BENCHMARK</span>
            <h2 className="section-title">Global Bromine Extraction Footprint & Utilization</h2>
          </div>
        </div>

        <div className="footprint-table-wrap">
          <table className="standard-data-table">
            <thead>
              <tr>
                <th>Producer / Facility</th>
                <th>Extraction Location</th>
                <th>Brine Feedstock Origin</th>
                <th>Capacity (MT/yr)</th>
                <th>Effective Utilization</th>
                <th>Operating Posture</th>
              </tr>
            </thead>
            <tbody>
              {footprint.map(f => (
                <tr key={f.producer} className={f.producer.includes('Agrocel') ? 'highlight-row' : ''}>
                  <td className="font-semibold">
                    {f.producer}
                    {f.producer.includes('Agrocel') && <span className="agrocel-tag ml-2">Agrocel</span>}
                  </td>
                  <td>{f.location}</td>
                  <td>{f.source}</td>
                  <td className="font-mono">{num(f.capacity_mt)} MT</td>
                  <td>
                    <div className="util-cell">
                      <div className="util-bar-track">
                        <div
                          className={`util-bar-fill ${f.utilization_pct < 50 ? 'bg-red' : f.utilization_pct > 90 ? 'bg-green' : 'bg-teal'}`}
                          style={{ width: `${f.utilization_pct}%` }}
                        />
                      </div>
                      <span className="util-num font-bold">{f.utilization_pct}%</span>
                    </div>
                  </td>
                  <td>
                    {f.utilization_pct < 50 ? (
                      <span className="status-pill status-red">Depleted / Regulated</span>
                    ) : f.utilization_pct > 90 ? (
                      <span className="status-pill status-green">Optimal Peak Run-Rate</span>
                    ) : (
                      <span className="status-pill status-blue">Continuous Baseline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* D. Process Dynamics & Thermodynamic Cost Moat */}
      <section id="thermodynamic-moat" className="exec-card section-container process-moat-card">
        <div className="takeaway-card-inner">
          <div className="takeaway-header-bar">
            <div>
              <span className="thb-badge">THERMODYNAMIC ADVANTAGE</span>
              <h2 className="thb-title">Kutch Solar Evaporation vs Underground Pumping</h2>
            </div>
          </div>
          <div className="takeaway-pillars-grid">
            <div className="tp-card">
              <div className="tpc-icon">☀️</div>
              <h4 className="tpc-title">Free Solar Energy Concentration</h4>
              <p className="tpc-body">
                Kutch receives over <strong>300 sunny days per year</strong> with severe arid pan evaporation. Solar insolation naturally pre-concentrates seawater bitterns without artificial fossil fuel heating, reducing steam consumption by <strong>~35%</strong> relative to subterranean wells.
              </p>
            </div>
            <div className="tp-card">
              <div className="tpc-icon">🧪</div>
              <h4 className="tpc-title">Steaming-Out Tower Desorption</h4>
              <p className="tpc-body">
                Chlorination kinetics in Kutch are optimized at elevated ambient temperatures. Chlorine-to-bromine stoichiometric recovery efficiency exceeds <strong>96.5%</strong>, minimizing byproduct effluent and delivering low operating cash costs.
              </p>
            </div>
            <div className="tp-card">
              <div className="tpc-icon">🚚</div>
              <h4 className="tpc-title">Dedicated ISO Tanker Logistics</h4>
              <p className="tpc-body">
                Direct highway access connects the Kutch production complex to Dahej and Vapi within <strong>24–36 hours</strong>, sidestepping port handling delays and international maritime container demurrage entirely.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
