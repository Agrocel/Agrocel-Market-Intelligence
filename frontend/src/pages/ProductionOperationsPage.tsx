import React from 'react';
import type { DashboardData, Section5Production, DataGroundingItem } from '../types';
import type { AppRoute } from '../navigation';

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

  const agrocelProd = production?.agrocel_production || {
    facility_location: 'Greater Rann of Kutch, Gujarat, India',
    nameplate_capacity_mt_year: 18000,
    active_production_run_rate_mt: 16930,
    capacity_utilization_pct: 94.1,
    extraction_process: 'Solar evaporation of sub-soil marine bitterns followed by steaming out process (chlorination & desorption)',
    seasonal_cycle: {
      peak_season: 'October to May (Dry, low humidity, high solar insolation)',
      lean_season: 'June to September (Southwest monsoon, rain dilution of bitterns)',
      peak_bittern_density_be: '28° - 30° Baumé',
      operational_note: 'Production operates at peak thermal efficiency during Q4 and Q1. Buffer storage tanks in Kutch maintain continuous supply to downstream plants during monsoon months.'
    }
  };

  const footprint = production?.global_production_footprint || [
    { producer: 'Agrocel Industries', location: 'Kutch, India', capacity_mt: 18000, source: 'Solar salt bitterns', utilization_pct: 94.1 },
    { producer: 'Archean Chemical', location: 'Hajipir, Kutch, India', capacity_mt: 42000, source: 'Solar salt bitterns', utilization_pct: 82.0 },
    { producer: 'ICL Group', location: 'Sodom, Dead Sea, Israel', capacity_mt: 280000, source: 'Dead Sea carnallite end-brines', utilization_pct: 88.5 },
    { producer: 'Jordan Bromine Co (Albemarle)', location: 'Safi, Dead Sea, Jordan', capacity_mt: 150000, source: 'Dead Sea bitterns', utilization_pct: 85.0 },
    { producer: 'Albemarle / LANXESS', location: 'Magnolia & El Dorado, AR, USA', capacity_mt: 110000, source: 'Smackover subterranean brine', utilization_pct: 84.0 },
    { producer: 'Shandong Producers (Multiple)', location: 'Laizhou Bay, Shandong, China', capacity_mt: 80000, source: 'Underground well brine', utilization_pct: 42.5 }
  ];

  const monsoonTracker = production?.monsoon_inventory_tracker || {
    monsoon_window: 'June 15 – October 15 (122-Day Harvesting Halt)',
    required_monsoon_reserve_mt: 5640,
    current_finished_stockpile_mt: 4850,
    stockpile_target_pct: 86.0,
    customer_days_coverage: 103,
    days_until_shutdown: 110,
    weekly_build_rate_mt: 85,
    status: 'ON TRACK',
    operational_readiness: '86.0% of monsoon reserve accumulated; 103 days of domestic contract demand protected against import substitution.'
  };

  return (
    <div className="page-shell production-operations-page">
      {/* Page Header */}
      <header className="page-header-bar">
        <div className="ph-breadcrumb">
          <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">06. Production & Operations</span>
        </div>
        <div className="ph-main-title-row">
          <div>
            <h1 className="page-main-title font-serif">Production & Operational Intelligence</h1>
            <p className="page-subtitle text-muted">
              Monitoring actual operational run-rates, solar bittern harvesting kinetics, monsoon inventory buffer readiness, and global cost curves.
            </p>
          </div>
          <div className="ph-badge-cluster">
            <span className="status-pill status-green">Agrocel Utilization: <b>{agrocelProd.capacity_utilization_pct}%</b></span>
            <span className="status-pill status-blue">Monsoon Buffer: <b>{monsoonTracker.stockpile_target_pct}% Built</b></span>
          </div>
        </div>
      </header>

      {/* A. Executive Production Assessment */}
      <section className="exec-card section-container production-executive-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">OPERATIONAL ASSESSMENT</span>
            <h2 className="section-title">Extraction Efficiency & Capacity Discipline</h2>
          </div>
          <span className="evidence-badge">Physical Asset Audit · Kutch Solar Basins</span>
        </div>

        <div className="production-lead-text">
          <p>
            {production?.ai_production_summary || (
              <>
                Unlike nominal nameplate permits, actual global elemental bromine production is strictly governed by <strong>sub-soil brine concentrations and solar thermodynamics</strong>. In Shandong, China, well brine depletion has dropped bromide grades from &gt;300 ppm down to 120–180 ppm, escalating pumping power costs and keeping Chinese effective utilization pinned near <strong>42.5%</strong>. Conversely, Agrocel leverages the hyper-saline Rann of Kutch micro-climate, yielding concentrated bitterns exceeding <strong>2,500 ppm bromide</strong> to operate at an industry-leading <strong>94.1% run-rate</strong>.
              </>
            )}
          </p>
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
      <section className="exec-card section-container monsoon-reserve-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">SEASONAL RISK MANAGEMENT</span>
            <h2 className="section-title">Monsoon Inventory Buffer Readiness</h2>
            <p className="section-subtitle-muted">
              Monitoring finished elemental stockpile accumulation ahead of the annual 122-day solar evaporation halt (June 15 – October 15).
            </p>
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
      <section className="exec-card section-container footprint-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">GLOBAL ASSET BENCHMARK</span>
            <h2 className="section-title">Global Bromine Extraction Footprint & Utilization</h2>
            <p className="section-subtitle-muted">
              Actual production methods, source brines, and effective operating run-rates across major world producers.
            </p>
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
      <section className="exec-card section-container process-moat-card">
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
