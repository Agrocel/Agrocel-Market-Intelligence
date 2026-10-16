import React, { useMemo, useState, useEffect } from 'react';
import type {
  DashboardData,
  DataGroundingItem,
  WhoDidWhatItem,
  PriceBenchmarkPoint
} from '../types';
import { TrendChart } from '../components/Charts';
import { EmptyState, ReliabilityBadge } from '../components/Common';
import { DataGroundedText } from '../components/DataProvenance';
import { IndiaPriceForecastSection } from '../components/PriceForecast';
import { RiskOpportunityPanel } from '../components/Intelligence';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface Props {
  data: DashboardData;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

const classify = (actor: WhoDidWhatItem) => {
  if (actor.category && ['Competitors', 'Supply', 'Demand', 'Policy', 'Commercial'].includes(actor.category)) {
    return actor.category;
  }
  const text = `${actor.entity} ${actor.role} ${actor.action} ${actor.impact}`.toLowerCase();
  if (/albemarle|icl|archean|lanxess|gulf resources|competitor|peer/.test(text)) return 'Competitors';
  if (/regulat|ministry|authority|compliance|environment/.test(text)) return 'Policy';
  if (/buyer|consumer|downstream|demand|compound/.test(text)) return 'Demand';
  if (/agrocel|commercial|sales|customer/.test(text)) return 'Commercial';
  return 'Supply';
};

function parseListItems(rawText?: string | null): string[] {
  if (!rawText) return [];
  return rawText
    .split(/\n+|•|(?:\s*\d+\.\s+)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function PriceIntelligencePage({
  data,
  activeSubTab = 'benchmarks',
  onSubTabChange,
  onSelectGrounding
}: Props) {
  const [tab, setTab] = useState(activeSubTab || 'benchmarks');
  const [filter, setFilter] = useState('All');
  const [showAllActors, setShowAllActors] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [priceUnit, setPriceUnit] = useState<'USD_MT' | 'INR_KG' | 'INR_MT'>('USD_MT');

  useEffect(() => {
    if (activeSubTab && activeSubTab !== tab) {
      setTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabClick = (newTab: string) => {
    setTab(newTab);
    onSubTabChange?.(newTab);
  };

  const { brief, prices, intelligence, overview } = data;
  const s1 = overview?.executive_overview?.section_1_price_benchmarks;
  const narrative = brief?.market_narrative;
  const actors = narrative?.who_did_what || [];
  const categories: string[] = ['All', 'Competitors', 'Supply', 'Demand', 'Policy', 'Commercial'];
  const visibleActors = actors.filter(a => filter === 'All' || classify(a) === filter);
  const displayedActors = showAllActors ? visibleActors : visibleActors.slice(0, 6);

  // Driver Counts for Market Drivers tab
  const driverCounts = useMemo(
    () => categories.slice(1).map((name: string) => ({
      name,
      count: actors.filter(a => classify(a) === name).length
    })),
    [actors]
  );
  const maxDrivers = Math.max(1, ...driverCounts.map((x: { name: string; count: number }) => x.count));

  // Price Trend Chart preparation
  const usdPrices = prices.filter(p => !p.currency || p.currency === 'USD');
  const dataset = usdPrices.length > 0 ? usdPrices : prices;
  const orderedPrices = [...dataset].sort((a, b) => a.date.localeCompare(b.date));
  const firstPrice = orderedPrices[0]?.value;
  const lastPrice = orderedPrices[orderedPrices.length - 1]?.value;
  const deltaPrice = firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const pulseItems = intelligence
    .filter(x => ['PRICE', 'SUPPLY', 'DEMAND', 'REGULATION', 'MARKET_EVENT', 'COMPETITOR_MOVE', 'COMPETITOR_UPDATE'].includes(x.type))
    .slice(0, 5);

  // Parse why_it_matters bullets & management_attention
  const whyItems = parseListItems(brief?.why_it_matters);
  const attentionItems = parseListItems(brief?.management_attention);
  const explanationParagraphs = (narrative?.full_text || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  // Price unit converter for benchmarks
  const formatPriceVal = (usdMtVal: number | null | undefined, inrMtVal?: number | null) => {
    if (usdMtVal === null || usdMtVal === undefined || isNaN(usdMtVal)) return { formatted: '—', unit: '' };
    if (priceUnit === 'USD_MT') {
      return { formatted: `$${num(usdMtVal, 0)}`, unit: '/ MT' };
    }
    if (priceUnit === 'INR_KG') {
      if (inrMtVal) return { formatted: `₹${num(inrMtVal / 1000, 1)}`, unit: '/ kg' };
      return { formatted: `₹${num((usdMtVal * 83.5) / 1000, 1)}`, unit: '/ kg' };
    }
    if (inrMtVal) return { formatted: `₹${num(inrMtVal, 0)}`, unit: '/ MT' };
    return { formatted: `₹${num(usdMtVal * 83.5, 0)}`, unit: '/ MT' };
  };

  // Trajectory chart points
  const priceChartData = useMemo(() => {
    if (!s1?.timeline) return [];
    return s1.timeline.map((item: PriceBenchmarkPoint) => ({
      period: item.period,
      cif_import: item.cif_india_import_parity_usd_mt,
      agrocel_realization: item.agrocel_realization_usd_mt,
      china_spot: item.china_spot_benchmark_usd_mt,
      india_export: item.fob_india_export_price_usd_mt
    }));
  }, [s1]);

  return (
    <div className="page-shell market-intelligence-page price-intelligence-page">
      {/* Page Header */}
      <header className="subpage-header">
        <div className="subpage-title-row">
          <div>
            <p className="eyebrow">Price Benchmarks, Domestic Parity & Econometrics</p>
            <h1 className="subpage-title">Price Intelligence</h1>
            <p className="subpage-subtitle">
              China spot benchmarks, import landed parity, domestic pricing headroom, and 48-observation econometric ML forecast.
            </p>
          </div>

          <div className="subpage-status-pill">
            <span className="status-dot" />
            <span>Direction: <b>{brief?.overall_market_direction || 'Firm / Tightening'}</b></span>
            {brief?.period_start && brief?.period_end && (
              <small className="date-range-sub">({brief.period_start} — {brief.period_end})</small>
            )}
          </div>
        </div>

        {/* Secondary Sub-Tabs */}
        <div className="secondary-nav-tabs" role="tablist">
          <button
            className={`subtab-btn ${tab === 'benchmarks' ? 'active' : ''}`}
            onClick={() => handleTabClick('benchmarks')}
            role="tab"
            aria-selected={tab === 'benchmarks'}
          >
            📊 Price Benchmarks & Import Parity
          </button>
          <button
            className={`subtab-btn ${tab === 'trends' || tab === 'price' ? 'active' : ''}`}
            onClick={() => handleTabClick('trends')}
            role="tab"
            aria-selected={tab === 'trends' || tab === 'price'}
          >
            📈 Price Trends & ML Forecast
          </button>
          <button
            className={`subtab-btn ${tab === 'brief' ? 'active' : ''}`}
            onClick={() => handleTabClick('brief')}
            role="tab"
            aria-selected={tab === 'brief'}
          >
            📋 Executive Price Brief
          </button>
          <button
            className={`subtab-btn ${tab === 'drivers' ? 'active' : ''}`}
            onClick={() => handleTabClick('drivers')}
            role="tab"
            aria-selected={tab === 'drivers'}
          >
            ⚖️ Market Drivers
          </button>
          <button
            className={`subtab-btn ${tab === 'risks' ? 'active' : ''}`}
            onClick={() => handleTabClick('risks')}
            role="tab"
            aria-selected={tab === 'risks'}
          >
            🛡️ Risks & Opportunities
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: BENCHMARKS & DOMESTIC HEADROOM                                 */}
      {/* ========================================================================= */}
      {(tab === 'benchmarks') && (
        <section className="subtab-content">
          {/* Domestic Pricing Headroom Banner */}
          {s1?.domestic_pricing_headroom && (
            <div className="pricing-headroom-banner">
              <div className="ph-left">
                <div className="ph-badge-row">
                  <span className="ph-badge">DOMESTIC PRICING HEADROOM</span>
                  <span className="ph-status-chip positive">
                    {s1.domestic_pricing_headroom.status_label}
                  </span>
                </div>
                <h3 className="ph-title">Agrocel Realization vs. Landed CIF Import Parity</h3>
                <p className="ph-desc">
                  Agrocel net domestic price is currently <strong>₹{num(s1.domestic_pricing_headroom.headroom_inr_kg, 1)}/kg ({s1.domestic_pricing_headroom.headroom_pct > 0 ? '+' : ''}{s1.domestic_pricing_headroom.headroom_pct}%) below</strong> landed CIF replacement costs from Dead Sea Jordan/Israel. This grants sales strong commercial insulation to defend domestic accounts against import substitution.
                </p>
              </div>
              <div className="ph-metrics-row">
                <div className="ph-metric-box">
                  <span className="ph-m-label">Agrocel Realization</span>
                  <span className="ph-m-val text-brand font-bold">₹{num(s1.domestic_pricing_headroom.agrocel_price_inr_kg, 1)}</span>
                  <span className="ph-m-sub">per kg domestic</span>
                </div>
                <div className="ph-metric-divider">vs</div>
                <div className="ph-metric-box">
                  <span className="ph-m-label">Landed CIF Parity</span>
                  <span className="ph-m-val text-teal font-bold">₹{num(s1.domestic_pricing_headroom.import_parity_inr_kg, 1)}</span>
                  <span className="ph-m-sub">Mundra / Nhava Sheva</span>
                </div>
                <div className="ph-metric-divider">=</div>
                <div className="ph-metric-box highlight-buffer">
                  <span className="ph-m-label">Competitive Headroom</span>
                  <span className="ph-m-val text-positive font-bold">+{num(s1.domestic_pricing_headroom.headroom_inr_kg, 1)} ₹/kg</span>
                  <span className="ph-m-sub">+{s1.domestic_pricing_headroom.headroom_pct}% domestic buffer</span>
                </div>
              </div>
            </div>
          )}

          {/* Currency / Unit Toggle Bar */}
          <div className="benchmark-unit-toggle-bar">
            <span className="toggle-label">Commercial Currency Basis:</span>
            <div className="unit-toggle-group">
              <button
                className={`unit-toggle-btn ${priceUnit === 'USD_MT' ? 'active' : ''}`}
                onClick={() => setPriceUnit('USD_MT')}
              >
                USD / MT
              </button>
              <button
                className={`unit-toggle-btn ${priceUnit === 'INR_KG' ? 'active' : ''}`}
                onClick={() => setPriceUnit('INR_KG')}
              >
                INR / kg (Domestic)
              </button>
              <button
                className={`unit-toggle-btn ${priceUnit === 'INR_MT' ? 'active' : ''}`}
                onClick={() => setPriceUnit('INR_MT')}
              >
                INR / MT
              </button>
            </div>
          </div>

          {/* Benchmark KPI Grid */}
          <div className="benchmark-kpi-grid">
            <div className="b-kpi-card highlight-border">
              <span className="b-kpi-label">CIF India Import Parity (Benchmark)</span>
              <div className="b-kpi-value-row">
                <span className="b-kpi-val text-teal font-bold">{formatPriceVal(s1?.latest_metrics.cif_india_import_parity_usd_mt).formatted}</span>
                <small>{formatPriceVal(s1?.latest_metrics.cif_india_import_parity_usd_mt).unit}</small>
              </div>
              <p className="b-kpi-sub">Landed replacement cost at Indian ports</p>
            </div>

            <div className="b-kpi-card">
              <span className="b-kpi-label">Agrocel Realization</span>
              <div className="b-kpi-value-row">
                <span className="b-kpi-val font-bold">{formatPriceVal(s1?.latest_metrics.agrocel_weighted_realization_usd_mt, s1?.latest_metrics.agrocel_weighted_realization_inr_mt).formatted}</span>
                <small>{formatPriceVal(s1?.latest_metrics.agrocel_weighted_realization_usd_mt, s1?.latest_metrics.agrocel_weighted_realization_inr_mt).unit}</small>
              </div>
              <p className="b-kpi-sub">
                {priceUnit === 'INR_KG'
                  ? `₹${num(s1?.latest_metrics.agrocel_weighted_realization_inr_mt)}/MT bulk basis`
                  : `₹${num(s1?.latest_metrics.agrocel_weighted_realization_inr_mt ? s1.latest_metrics.agrocel_weighted_realization_inr_mt / 1000 : null, 1)}/kg domestic sales`}
              </p>
            </div>

            <div className="b-kpi-card">
              <span className="b-kpi-label">China Domestic Spot</span>
              <div className="b-kpi-value-row">
                <span className="b-kpi-val font-bold">{formatPriceVal(s1?.latest_metrics.china_spot_benchmark_usd_mt).formatted}</span>
                <small>{formatPriceVal(s1?.latest_metrics.china_spot_benchmark_usd_mt).unit}</small>
              </div>
              <p className="b-kpi-sub">Shandong ex-works marginal cost</p>
            </div>

            <div className="b-kpi-card">
              <span className="b-kpi-label">FOB India Outbound Export</span>
              <div className="b-kpi-value-row">
                <span className="b-kpi-val font-bold">{formatPriceVal(s1?.latest_metrics.fob_india_export_price_usd_mt).formatted}</span>
                <small>{formatPriceVal(s1?.latest_metrics.fob_india_export_price_usd_mt).unit}</small>
              </div>
              <p className="b-kpi-sub">Declared customs export value</p>
            </div>

            <div className="b-kpi-card spread-card">
              <span className="b-kpi-label">Agrocel Domestic Advantage</span>
              <div className="b-kpi-value-row">
                <span className="b-kpi-val text-positive font-bold">
                  {priceUnit === 'INR_KG'
                    ? `+₹${num(s1?.domestic_pricing_headroom?.headroom_inr_kg ?? 58.8, 1)}`
                    : priceUnit === 'INR_MT'
                    ? `+₹${num((s1?.domestic_pricing_headroom?.headroom_inr_kg ?? 58.8) * 1000, 0)}`
                    : `+$${num(s1?.latest_metrics.agrocel_spread_vs_cif_usd_mt)}`}
                </span>
                <small>
                  {priceUnit === 'INR_KG' ? '/kg' : '/MT'}
                </small>
              </div>
              <p className="b-kpi-sub">{s1?.domestic_pricing_headroom?.headroom_pct ?? 30.1}% domestic discount vs imports</p>
            </div>
          </div>

          {/* Interactive Benchmark Trends Chart */}
          <div className="chart-wrapper-card">
            <div className="chart-header-row">
              <h4 className="chart-title">Benchmark Trajectory (Monthly)</h4>
              <div className="chart-legend-hints">
                <span className="hint-pill" style={{ color: '#0d9488' }}>● CIF India Landed</span>
                <span className="hint-pill" style={{ color: '#4f46e5' }}>● Agrocel Realization</span>
                <span className="hint-pill" style={{ color: '#f59e0b' }}>● China Spot</span>
                <span className="hint-pill" style={{ color: '#64748b' }}>● FOB India Export</span>
              </div>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={priceChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${num(val)}/MT`, '']}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                    contentStyle={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  />
                  <Line type="monotone" dataKey="cif_import" name="CIF India Import Parity" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="agrocel_realization" name="Agrocel Realization ($ eq)" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="china_spot" name="China Domestic Spot" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="india_export" name="FOB India Export" stroke="#64748b" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Import Deal Verifier: Customer Bluff Buster */}
          {s1?.recent_import_deals && s1.recent_import_deals.length > 0 && (
            <div className="import-verifier-card">
              <div className="iv-header">
                <div>
                  <div className="iv-badge-row">
                    <span className="iv-tag">IMPORT DEAL VERIFIER</span>
                    <span className="iv-live-tag">VERIFIED CUSTOMS SHIPMENTS</span>
                  </div>
                  <h4 className="iv-title">Actual Customs Clearance Manifests at Indian Ports</h4>
                  <p className="iv-sub">
                    Verify competitor import claims against verified Bill of Entry customs shipments at Indian ports. Exposes bluff quotes by displaying actual landed costs in ₹/kg.
                  </p>
                </div>
                <div className="iv-ports-pill-group">
                  <span className="iv-pill-label">Major Clearance Hubs: Mundra · Chennai · Vizag · Nhava Sheva</span>
                </div>
              </div>

              <div className="iv-table-wrap">
                <table className="exec-table iv-table">
                  <thead>
                    <tr>
                      <th>Shipment Date</th>
                      <th>Origin Country</th>
                      <th>Indian Port of Entry</th>
                      <th>Importer / Consignee</th>
                      <th>Volume (MT)</th>
                      <th>Declared CIF ($/MT)</th>
                      <th>Landed Realized Cost (₹/kg)</th>
                      <th>Agrocel Advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s1.recent_import_deals.map((deal: any, idx: number) => {
                      const agrocelInrKg = s1.domestic_pricing_headroom?.agrocel_price_inr_kg ?? 195.7;
                      const diff = deal.price_inr_kg ? Math.round((deal.price_inr_kg - agrocelInrKg) * 10) / 10 : null;
                      return (
                        <tr key={idx}>
                          <td className="font-semibold">{deal.date}</td>
                          <td>
                            <span className="country-chip">{deal.origin_country}</span>
                          </td>
                          <td><strong>{deal.port}</strong></td>
                          <td className="text-muted">{deal.importer}</td>
                          <td className="font-mono">{num(deal.quantity_mt, 2)} MT</td>
                          <td className="font-semibold text-teal">${num(deal.price_usd_mt, 0)}/MT</td>
                          <td>
                            <span className="deal-landed-badge">
                              ₹{num(deal.price_inr_kg, 1)} / kg
                            </span>
                          </td>
                          <td>
                            {diff !== null ? (
                              <span className={diff >= 0 ? 'text-positive font-bold' : 'text-danger font-bold'}>
                                {diff >= 0 ? `Agrocel ₹${num(diff, 1)}/kg cheaper` : `Import ₹${num(Math.abs(diff), 1)}/kg cheaper`}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="iv-footer-note">
                <span>* Landed cost is calculated at Bill of Entry benchmark exchange rate (1 USD = ₹83.50) + basic port handling & clearance charges.</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PRICE TRENDS & FORECAST                                        */}
      {/* ========================================================================= */}
      {(tab === 'trends' || tab === 'price') && (
        <section className="subtab-content">
          <div className="market-grid">
            {orderedPrices.length ? (
              <TrendChart
                title="China Bromine Spot Price Benchmark"
                unit={`${orderedPrices[orderedPrices.length - 1]?.currency || 'USD'} / ${orderedPrices[orderedPrices.length - 1]?.unit || 'MT'}`}
                data={orderedPrices}
                series={[{ key: 'value', name: 'China Bromine price', color: '#0f766e', kind: 'area' }]}
                annotation={`${deltaPrice >= 0 ? 'Rose' : 'Fell'} ${Math.abs(deltaPrice).toFixed(1)}% across the observed timeline.`}
              />
            ) : (
              <EmptyState title="No price data available in this range" />
            )}

            <aside className="pulse">
              <div className="pulse-head">
                <span>Executive Pulse</span>
                <strong>{pulseItems.length} signals</strong>
              </div>
              {pulseItems.length ? (
                pulseItems.map((x, i) => (
                  <article key={x.id || i}>
                    <span className="pulse-index">0{i + 1}</span>
                    <div>
                      <div className="item-meta">
                        <span className={`impact impact-${x.impact.toLowerCase()}`}>{x.impact}</span>
                        <ReliabilityBadge grade={x.reliability} />
                      </div>
                      <h3>{x.title}</h3>
                      <p>{x.summary}</p>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState title="No active pulse signals" />
              )}
            </aside>
          </div>

          {/* Proprietary 48-Observation Econometric & ML Forecast Model */}
          <div className="forecast-container">
            <IndiaPriceForecastSection />
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: EXECUTIVE BRIEF                                                */}
      {/* ========================================================================= */}
      {tab === 'brief' && (
        <section className="subtab-content">
          <div className="narrative-section">
            <header className="brief-heading">
              <div>
                <div className="brief-eyebrow-row">
                  <span className="ai-pill">
                    <i className="ai-dot" /> Verified Synthesis
                  </span>
                  <span className="source-counter-pill">
                    ✓ {brief?.source_count || actors.length} Grounded Sources
                  </span>
                </div>
                <h2 className="brief-title">
                  {narrative?.headline || 'Market Pulse: What Is Happening & Why It Matters'}
                </h2>
              </div>
            </header>

            {/* Top 3 Executive Takeaway Cards (Insight Layer) */}
            <div className="decision-grid">
              {/* Card 1: Executive Read */}
              <article className="decision-card">
                <div className="card-badge">
                  <span className="card-num">01</span>
                  <span className="card-label">Executive Read</span>
                </div>
                <div className="card-body-text">
                  <DataGroundedText
                    text={brief?.executive_summary || 'China Bromine benchmark closed higher while domestic supply contracts remain intact.'}
                    grounding={brief?.data_grounding}
                    onSelect={onSelectGrounding}
                  />
                </div>
              </article>

              {/* Card 2: Why It Matters */}
              <article className="decision-card">
                <div className="card-badge">
                  <span className="card-num">02</span>
                  <span className="card-label">Why It Matters to Agrocel</span>
                </div>
                {whyItems.length > 1 ? (
                  <ul className="card-bullet-list">
                    {whyItems.map((item, idx) => (
                      <li key={idx}>
                        <DataGroundedText
                          text={item}
                          grounding={brief?.data_grounding}
                          onSelect={onSelectGrounding}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="card-body-text">
                    <DataGroundedText
                      text={brief?.why_it_matters || 'Domestic contract pricing provides steady margin protection against volatile spot import arbitrage.'}
                      grounding={brief?.data_grounding}
                      onSelect={onSelectGrounding}
                    />
                  </div>
                )}
              </article>

              {/* Card 3: What Management Should Do */}
              <article className="decision-card attention-card">
                <div className="card-badge">
                  <span className="card-num alert-num">03</span>
                  <span className="card-label alert-label">What Management Should Do</span>
                </div>
                {attentionItems.length > 0 ? (
                  <div className="action-step-list">
                    {attentionItems.map((step, idx) => (
                      <div className="action-step-item" key={idx}>
                        <span className="step-idx">{idx + 1}</span>
                        <div className="step-content">
                          <DataGroundedText
                            text={step}
                            grounding={brief?.data_grounding}
                            onSelect={onSelectGrounding}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-body-text">
                    <DataGroundedText
                      text={brief?.management_attention || 'Track upcoming winter plant shutdowns and protect contract renewal pricing.'}
                      grounding={brief?.data_grounding}
                      onSelect={onSelectGrounding}
                    />
                  </div>
                )}
              </article>
            </div>

            {/* Evidence Accordion (Evidence Layer) */}
            {brief?.citations && brief.citations.length > 0 && (
              <div className="evidence-accordion">
                <button
                  className="evidence-toggle-btn"
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  aria-expanded={sourcesOpen}
                >
                  <span>{sourcesOpen ? '▲ Hide Grounded Evidence Sources' : `▼ Review ${brief.citations.length} Grounded Evidence Citations`}</span>
                </button>
                {sourcesOpen && (
                  <div className="evidence-panel">
                    {brief.citations.map((c, i) => (
                      <article className="evidence-item" key={c.id || i}>
                        <div className="evidence-item-header">
                          <strong>[{i + 1}] {c.source_title}</strong>
                          <ReliabilityBadge grade={c.reliability_grade} />
                        </div>
                        <p className="evidence-text">{c.citation_text}</p>
                        {c.page_number && <small className="evidence-meta">Document Page {c.page_number}</small>}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key Market Moves */}
            <div className="actor-section">
              <div className="actor-heading">
                <div>
                  <span className="ai-pill small">Market Pulse</span>
                  <h3 className="actor-section-title">Key Market Moves</h3>
                  <p className="actor-section-desc">
                    Observed commercial, production, and regulatory actions taken by key industry actors.
                  </p>
                </div>
                <div className="actor-filters">
                  {categories.map((x: string) => (
                    <button
                      className={`actor-filter-pill ${filter === x ? 'active' : ''}`}
                      onClick={() => setFilter(x)}
                      key={x}
                    >
                      {x === 'All' ? `All Moves (${actors.length})` : x}
                    </button>
                  ))}
                </div>
              </div>

              <div className="actor-cards-grid">
                {displayedActors.length > 0 ? (
                  displayedActors.map((a, i) => {
                    const category = classify(a);
                    return (
                      <article className="actor-card-item" key={`${a.entity}-${i}`}>
                        <div className="actor-card-header">
                          <div className="actor-id-group">
                            <h4 className="actor-entity-name">{a.entity}</h4>
                            <span className="actor-role-badge">{a.role}</span>
                            <span className={`actor-category-tag tag-${category.toLowerCase()}`}>{category}</span>
                            {a.sentiment && (
                              <span className={`actor-sentiment-badge sentiment-${a.sentiment.toLowerCase()}`}>
                                {a.sentiment}
                              </span>
                            )}
                          </div>
                          <ReliabilityBadge grade={a.reliability_grade} />
                        </div>

                        <div className="actor-card-details">
                          {a.quote && (
                            <div className="actor-quote-box">
                              <span className="quote-icon">“</span>
                              <div className="quote-body">
                                <p className="quote-text">{a.quote}</p>
                                {a.speaker && <span className="quote-speaker">— {a.speaker}</span>}
                              </div>
                            </div>
                          )}

                          <div className="actor-action-block">
                            <span className="detail-heading action-heading">Action Observed</span>
                            <p className="detail-paragraph">{a.action}</p>
                          </div>

                          <div className="actor-impact-block">
                            <span className="detail-heading impact-heading">Impact on Agrocel & Market</span>
                            <p className="detail-paragraph impact-paragraph">{a.impact}</p>
                          </div>
                        </div>

                        <div className="actor-card-footer">
                          <span className="source-attribution">
                            <strong>Source:</strong> {a.source}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState
                    title={`No market moves found for "${filter}"`}
                    detail="Try selecting 'All' to view all tracked actions."
                  />
                )}
              </div>

              {visibleActors.length > 6 && (
                <div className="show-more-container">
                  <button
                    className="show-more-toggle-btn"
                    onClick={() => setShowAllActors(!showAllActors)}
                  >
                    {showAllActors ? (
                      <>▲ Show Top 6 Key Actors</>
                    ) : (
                      <>▼ View All {visibleActors.length} Tracked Moves ({visibleActors.length - 6} More)</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MARKET DRIVERS                                                 */}
      {/* ========================================================================= */}
      {tab === 'drivers' && (
        <section className="subtab-content">
          <div className="brief-grid">
            {/* Left: What is driving the movement */}
            <article className="narrative-copy-card">
              <div className="brief-card-title">
                <div>
                  <span className="sub-tag">Analytical Pillars</span>
                  <h3>What Is Driving The Movement</h3>
                </div>
                <span className="info-chip">Causal Driver Analysis</span>
              </div>

              <div className="pillars-container">
                {explanationParagraphs.map((para, i) => {
                  const lines = para.split('\n');
                  const hasHeader = lines.length > 1 && lines[0].endsWith(':');
                  const headerText = hasHeader ? lines[0] : null;
                  const bodyText = hasHeader ? lines.slice(1).join('\n') : para;

                  return (
                    <div className="driver-pillar-item" key={i}>
                      <div className="pillar-index-col">
                        <span className="pillar-num">{i + 1}</span>
                      </div>
                      <div className="pillar-content-col">
                        {headerText && <strong className="pillar-title">{headerText}</strong>}
                        <p className="pillar-body">{bodyText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Right: Driver breakdown by category */}
            <aside className="driver-summary-card">
              <div className="brief-card-title">
                <div>
                  <span className="sub-tag">Category Distribution</span>
                  <h3>Pillars of Impact</h3>
                </div>
              </div>
              <p className="driver-summary-intro">
                Observed driver distribution across competitors, supply, demand, regulatory policies, and commercial shifts.
              </p>
              <div className="driver-bars-list">
                {driverCounts.map((d: { name: string; count: number }) => (
                  <div className="driver-bar-row" key={d.name}>
                    <div className="driver-bar-label">
                      <span>{d.name}</span>
                      <strong>{d.count}</strong>
                    </div>
                    <div className="driver-bar-track">
                      <div
                        className={`driver-bar-fill fill-${d.name.toLowerCase()}`}
                        style={{ width: `${(d.count / maxDrivers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: RISKS & OPPORTUNITIES                                          */}
      {/* ========================================================================= */}
      {tab === 'risks' && (
        <section className="subtab-content">
          <RiskOpportunityPanel items={intelligence} />
        </section>
      )}
    </div>
  );
}

// Backwards-compatible export
export const MarketIntelligencePage = PriceIntelligencePage;
