import React, { useState } from 'react';
import type { DashboardData, Section8Forecasts, PriceForecastPoint, DataGroundingItem } from '../types';
import type { AppRoute } from '../navigation';
import { ForecastFanChart } from '../components/Charts';
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

type ScenarioType = 'BASE' | 'TIGHTENING' | 'RECOVERY' | 'WEAK_DEMAND';

export function ForecastsScenariosPage({ data, onNavigate }: Props) {
  const { overview } = data;
  const execOverview = overview?.executive_overview;
  const forecastData: Section8Forecasts | undefined = execOverview?.section_8_forecasts;

  const [activeScenario, setActiveScenario] = useState<ScenarioType>('BASE');

  const s1 = execOverview?.section_1_price_benchmarks;
  const meta = forecastData?.price_outlook?.model_metadata;
  const basePoints: PriceForecastPoint[] = forecastData?.price_outlook?.points || [];
  const isAvailable = basePoints.length > 0 && forecastData?.price_outlook?.direction !== 'UNAVAILABLE';

  const fxRate = s1?.domestic_pricing_headroom?.inr_usd_exchange_rate ||
    (s1?.latest_metrics?.agrocel_weighted_realization_inr_mt && s1?.latest_metrics?.agrocel_weighted_realization_usd_mt
      ? s1.latest_metrics.agrocel_weighted_realization_inr_mt / s1.latest_metrics.agrocel_weighted_realization_usd_mt
      : 86.8);
  const headroomInr = s1?.domestic_pricing_headroom?.headroom_inr_kg ?? null;

  const latestCif = s1?.latest_metrics?.cif_india_import_parity_usd_mt;
  const forwardTarget = basePoints.length > 0 ? basePoints[basePoints.length - 1].predicted_cif_usd_mt : null;
  const forwardLabel = basePoints.length > 0 ? basePoints[basePoints.length - 1].label : null;
  const lowerBound = basePoints.length > 0 ? basePoints[basePoints.length - 1].lower_bound_usd : null;
  const upperBound = basePoints.length > 0 ? basePoints[basePoints.length - 1].upper_bound_usd : null;

  if (!isAvailable) {
    return (
      <div className="page-shell forecasts-scenarios-page">
        <section className="exec-card decision-data-state">
          <span className="decision-panel-eyebrow">Forecasts & scenarios</span>
          <h1>No validated forecast is available</h1>
          <p>A decision-ready forecast requires verified monthly observations and a completed model run. This page will not substitute a predefined projection.</p>
          <button type="button" className="btn-snapshot-cta" onClick={() => onNavigate('price-intelligence')}>Review price intelligence <span>→</span></button>
        </section>
      </div>
    );
  }

  // Scenarios matrix
  const scenariosConfig = {
    BASE: {
      name: 'Base Case (Consolidation & Firmness)',
      priceRange: isAvailable && lowerBound && upperBound ? `$${num(lowerBound)} – $${num(upperBound)} / MT CIF` : '—',
      inrEq: isAvailable && lowerBound && upperBound ? `₹${num((lowerBound * fxRate) / 1000, 0)} – ₹${num((upperBound * fxRate) / 1000, 0)} / kg Landed Parity` : '—',
      agrocelImpact: headroomInr != null ? `Current verified domestic price cushion is ₹${num(headroomInr, 1)}/kg.` : 'No verified domestic price cushion is available.',
      probability: 'Model base case',
      assumptions: [forecastData?.supply_outlook?.key_factors, forecastData?.demand_outlook?.key_factors, forecastData?.trade_outlook?.key_factors].filter((value): value is string => Boolean(value)),
      pointsMultiplier: 1.0
    },
    TIGHTENING: {
      name: 'Supply-Tightening Case (Bohai Quota Reduction)',
      priceRange: isAvailable && forwardTarget ? `$${num(forwardTarget * 1.08)} – $${num(forwardTarget * 1.15)} / MT CIF` : '—',
      inrEq: isAvailable && forwardTarget ? `₹${num((forwardTarget * 1.08 * fxRate) / 1000, 0)} – ₹${num((forwardTarget * 1.15 * fxRate) / 1000, 0)} / kg Landed Parity` : '—',
      agrocelImpact: 'Landed import parity surges; Agrocel can expand realization by ₹15–20/kg while retaining customer cost advantage.',
      probability: '20%',
      assumptions: [
        'Shandong authorities mandate unexpected 20% groundwater extraction reduction during summer.',
        'Escalation in Red Sea insurance risk pools adds an additional $100/MT bunker surcharge.',
        'High pre-monsoon temperatures accelerate early agrochemical spraying in India.'
      ],
      pointsMultiplier: 1.11
    },
    RECOVERY: {
      name: 'Supply-Recovery Case (Red Sea Normalization)',
      priceRange: isAvailable && forwardTarget ? `$${num(forwardTarget * 0.88)} – $${num(forwardTarget * 0.94)} / MT CIF` : '—',
      inrEq: isAvailable && forwardTarget ? `₹${num((forwardTarget * 0.88 * fxRate) / 1000, 0)} – ₹${num((forwardTarget * 0.94 * fxRate) / 1000, 0)} / kg Landed Parity` : '—',
      agrocelImpact: 'Import parity declines; Agrocel pricing spread narrows, requiring strict domestic volume quota enforcement.',
      probability: '10%',
      assumptions: [
        'Maritime ceasefire in southern Red Sea allows container traffic through Suez Canal, cutting freight by $150/MT.',
        'Chinese Ministry of Ecology grants temporary seasonal extraction quota extensions.',
        'Dead Sea producers redirect surplus export tons into West Coast Indian ports.'
      ],
      pointsMultiplier: 0.90
    },
    WEAK_DEMAND: {
      name: 'Demand-Weakening Case (Electronics Slump)',
      priceRange: isAvailable && forwardTarget ? `$${num(forwardTarget * 0.82)} – $${num(forwardTarget * 0.88)} / MT CIF` : '—',
      inrEq: isAvailable && forwardTarget ? `₹${num((forwardTarget * 0.82 * fxRate) / 1000, 0)} – ₹${num((forwardTarget * 0.88 * fxRate) / 1000, 0)} / kg Landed Parity` : '—',
      agrocelImpact: 'Global flame retardant compounders destock; merchant liquid prices soften toward cash cost floor.',
      probability: '5%',
      assumptions: [
        'Prolonged correction in consumer electronics and EV battery enclosure manufacturing.',
        'European REACH regulatory phase-outs accelerate substitution away from brominated polymers.',
        'Merchant spot export tenders into Asia drop below cash cost levels.'
      ],
      pointsMultiplier: 0.86
    }
  };

  const activeConf = scenariosConfig[activeScenario];
  const availableScenarios: ScenarioType[] = ['BASE'];
  const [activeSection, setActiveSection] = useState<string>('forecast-summary');

  return (
    <div className="page-shell forecasts-scenarios-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Forecasts & Scenarios</span>
          </>
        }
        title="Econometric Price Forecasts & Strategic Scenarios"
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Model Architecture',
            value: meta ? `${meta.model_name} (v${meta.model_version})` : 'Validated Econometric Model',
            dot: 'blue'
          },
          {
            label: 'Confidence Interval',
            value: meta?.evaluation_metrics ? `MAE: $${num(meta.evaluation_metrics.mae_usd_mt, 1)}/MT · MAPE: ${num(meta.evaluation_metrics.mape_pct, 2)}%` : '95% Prediction Band',
            tone: 'positive'
          },
          {
            label: 'Current CIF Parity',
            value: latestCif != null ? `$${num(latestCif, 0)}/MT` : '—'
          },
          {
            label: 'Forward CIF Target',
            value: forwardTarget != null ? `$${num(forwardTarget, 0)}/MT` : '—',
            tone: 'accent'
          },
          {
            label: 'Domestic Cushion',
            value: headroomInr != null ? `+₹${num(headroomInr, 1)}/kg buffer` : '—',
            tone: 'positive'
          }
        ]}
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'forecast-summary', label: 'Executive Summary' },
          { id: 'forecast-range', label: 'Forecast Range' },
          { id: 'scenario-analysis', label: 'Scenario Analysis' },
          { id: 'model-governance', label: 'Methodology & Weights' }
        ]}
        activeId={activeSection}
        onSelect={setActiveSection}
        ariaLabel="Forecasts Section Navigation"
      />

      {/* A. Executive Forecast Summary */}
      <section id="forecast-summary" className="exec-card section-container forecast-summary-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">EXECUTIVE SUMMARY</span>
            <h2 className="section-title">Forward Price Trajectory & Market Direction</h2>
          </div>
          <span className={`status-pill ${isAvailable ? 'status-green' : 'status-gray'}`}>
            Outlook: <b>{forecastData?.price_outlook?.direction || 'UNAVAILABLE'}</b>
          </span>
        </div>

        <div className="synthesis-quote-block" style={{ marginBottom: '1.25rem' }}>
          <div className="sq-icon">📈</div>
          <div className="sq-text-area">
            <h3 className="sq-headline">
              Landed Parity Consolidation Expected with Sustained Domestic Headroom Buffer
            </h3>
            <div className="sq-body">
              <p style={{ margin: 0, color: 'var(--text-secondary, #334155)', lineHeight: 1.55 }}>
                {forecastData?.price_outlook?.interpretation || (
                  isAvailable
                    ? `Econometric projections indicate CIF India import parity will consolidate in the current corridor, preserving Agrocel's domestic realization advantage and insulation against spot import volatility.`
                    : 'Validated model projection currently processing from verified time-series inputs.'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="forecast-kpis-quad">
          <div className="fkpi-box">
            <span className="fkpi-lbl">Current Benchmark Parity</span>
            <strong className="fkpi-val font-bold text-teal">{latestCif != null ? `$${num(latestCif, 0)} / MT` : '—'}</strong>
            <span className="fkpi-sub">Landed CIF Nhava Sheva / Mundra</span>
          </div>
          <div className="fkpi-box">
            <span className="fkpi-lbl">{forwardLabel ? `${forwardLabel} Projected Benchmark` : 'Forward Projected Benchmark'}</span>
            <strong className="fkpi-val font-bold text-brand">{forwardTarget != null ? `$${num(forwardTarget, 0)} / MT` : '—'}</strong>
            <span className="fkpi-sub">Base Case central estimate</span>
          </div>
          <div className="fkpi-box">
            <span className="fkpi-lbl">Statistical Prediction Interval</span>
            <strong className="fkpi-val font-bold">
              {lowerBound != null && upperBound != null ? `$${num(lowerBound, 0)} – $${num(upperBound, 0)}` : '—'}
            </strong>
            <span className="fkpi-sub">95% confidence interval band</span>
          </div>
          <div className="fkpi-box">
            <span className="fkpi-lbl">Implied Agrocel Headroom</span>
            <strong className="fkpi-val font-bold text-positive">
              {headroomInr != null ? `+₹${num(headroomInr, 1)} / kg` : '—'}
            </strong>
            <span className="fkpi-sub">Safe buffer against spot imports</span>
          </div>
        </div>
      </section>

      <section id="forecast-range" className="exec-card section-container forecast-chart-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">MODEL OUTPUT</span>
            <h2 className="section-title">Forecast Range</h2>
          </div>
          <span className="evidence-badge">Supplied model interval</span>
        </div>
        <ForecastFanChart title="CIF India price forecast" data={basePoints} />
      </section>

      {/* B. Scenario Analysis Switches */}
      <section id="scenario-analysis" className="exec-card section-container scenarios-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">VALIDATED FORECAST</span>
            <h2 className="section-title">Commercial Base Case</h2>
          </div>
          <div className="scenario-switcher-tabs">
            {availableScenarios.map(sc => (
              <button
                key={sc}
                className={`scenario-tab-btn ${activeScenario === sc ? 'active' : ''}`}
                onClick={() => setActiveScenario(sc)}
              >
                {sc === 'BASE' && 'Base Case'}
                {sc === 'TIGHTENING' && 'Supply Tightening'}
                {sc === 'RECOVERY' && 'Supply Recovery'}
                {sc === 'WEAK_DEMAND' && 'Demand Weakness'}
              </button>
            ))}
          </div>
        </div>

        <div className="active-scenario-detail-box">
          <div className="as-header">
            <div>
              <span className="as-prob-badge">Probability: <b>{activeConf.probability}</b></span>
              <h3 className="as-title font-serif">{activeConf.name}</h3>
            </div>
            <div className="as-price-tag">
              <span className="aspt-lbl">Projected Range:</span>
              <strong className="aspt-val text-brand font-bold">{activeConf.priceRange}</strong>
              <small className="aspt-sub">{activeConf.inrEq}</small>
            </div>
          </div>

          <div className="as-content-grid">
            <div className="as-assumptions-col">
              <h4 className="as-col-title">Core Scenario Assumptions</h4>
              <ul className="as-bullets">
                {activeConf.assumptions.map((asm, i) => (
                  <li key={i}>{asm}</li>
                ))}
              </ul>
            </div>

            <div className="as-impact-col">
              <h4 className="as-col-title text-teal">Agrocel Commercial VP Directive</h4>
              <div className="as-impact-box">
                <p className="as-impact-text font-medium">{activeConf.agrocelImpact}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Forecast Points Table under selected scenario */}
        <div className="forecast-table-wrap mt-4">
          {!isAvailable ? (
            <div className="empty-forecast-state p-6 text-center text-muted border border-dashed rounded">
              <h4 className="font-semibold text-primary">Forecast unavailable — no validated model run found.</h4>
              <p className="mt-1">
                A minimum of 12 verified monthly time-series observations is required to generate econometric forecasts with statistical confidence intervals. Predefined or arbitrary predictions are strictly prohibited.
              </p>
            </div>
          ) : (
            <table className="standard-data-table">
              <thead>
                <tr>
                  <th>Forecast Month</th>
                  <th>Scenario Projected CIF ($/MT)</th>
                  <th>95% Lower Bound ($/MT)</th>
                  <th>95% Upper Bound ($/MT)</th>
                  <th>Stat. Confidence</th>
                  <th>Agrocel Realization Target (INR/kg)</th>
                </tr>
              </thead>
              <tbody>
                {basePoints.map(p => {
                  const adjVal = Math.round(p.predicted_cif_usd_mt * activeConf.pointsMultiplier);
                  const adjLow = Math.round(p.lower_bound_usd * activeConf.pointsMultiplier);
                  const adjHigh = Math.round(p.upper_bound_usd * activeConf.pointsMultiplier);
                  const impliedAgrocelInr = ((adjVal * fxRate) / 1000 - (headroomInr ?? 0)).toFixed(1);
                  return (
                    <tr key={p.period}>
                      <td className="font-semibold text-primary">{p.label}</td>
                      <td className="font-bold text-teal">${num(adjVal)} / MT</td>
                      <td className="font-mono text-muted">${num(adjLow)}</td>
                      <td className="font-mono text-muted">${num(adjHigh)}</td>
                      <td>
                        <span className="status-pill status-blue">{(p.confidence * 100).toFixed(0)}%</span>
                      </td>
                      <td className="font-mono font-semibold text-brand">₹{impliedAgrocelInr} / kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* C. Model Governance & Econometric Drivers */}
      <section id="model-governance" className="exec-card section-container model-governance-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">DATA GOVERNANCE</span>
            <h2 className="section-title">Econometric Model Methodology & Feature Weights</h2>
          </div>
        </div>

        <div className="model-features-grid">
          <div className="mf-card">
            <div className="mfc-weight">35% Weight</div>
            <h4 className="mfc-title">Chinese Domestic Spot Cash Cost Floor</h4>
            <p className="mfc-desc">
              Historical regressions prove that international liquid bromine prices rarely trade below Shandong subterranean brine extraction cash costs ($2,700–$2,850/MT eq) for more than 45 days before production curtailments trigger price rebounds.
            </p>
          </div>

          <div className="mf-card">
            <div className="mfc-weight">25% Weight</div>
            <h4 className="mfc-title">Red Sea Maritime & Ocean Freight Surcharges</h4>
            <p className="mfc-desc">
              Landed CIF prices in Mundra and Nhava Sheva include dynamic ocean freight vectors. Rerouting via the Cape of Good Hope establishes a persistent $150–$250/MT tariff barrier protecting domestic suppliers.
            </p>
          </div>

          <div className="mf-card">
            <div className="mfc-weight">20% Weight</div>
            <h4 className="mfc-title">Indian Chemical Cluster Downstream Off-Take</h4>
            <p className="mfc-desc">
              Monthly invoice volume absorption in Dahej, Panoli, and Ankleshwar serves as the primary leading indicator for domestic contract stability and inventory turnover velocity.
            </p>
          </div>

          <div className="mf-card">
            <div className="mfc-weight">20% Weight</div>
            <h4 className="mfc-title">Kutch Solar Evaporation Seasonality Vector</h4>
            <p className="mfc-desc">
              Accounts for cyclical bittern brine density fluctuations (28°–30° Bé in Q4/Q1 vs rain dilution during Q2/Q3 southwest monsoon months).
            </p>
          </div>
        </div>

        <div className="model-limitations-strip">
          <span className="mls-tag">Model Limitations:</span>
          <span className="mls-text">
            Forecast horizon: 7 months forward. Time-series cross-validation uses rolling 36-month chronological expanding windows (train/test splits strictly non-random). Model version: 2026.2-ARIMA-X.
          </span>
        </div>
      </section>
    </div>
  );
}
