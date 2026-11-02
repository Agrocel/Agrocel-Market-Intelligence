import React, { useMemo, useState, useEffect } from 'react';
import type {
  DashboardData,
  DataGroundingItem,
  PriceBenchmarkPoint
} from '../types';
import { EmptyState } from '../components/Common';
import { IndiaPriceForecastSection } from '../components/PriceForecast';
import { PricingArbitrageCockpit } from '../components/PricingArbitrageCockpit';
import { PageHeader, SectionNav } from '../components/PageHeader';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface Props {
  data: DashboardData;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
  onNavigate?: (route: any, subTab?: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

type SectionKey = 'all' | 'parity' | 'arbitrage' | 'forecast';

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

export function PriceIntelligencePage({
  data,
  activeSubTab,
  onSubTabChange,
  onNavigate
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>('all');
  const [priceUnit, setPriceUnit] = useState<'INR_KG' | 'USD_MT' | 'INR_MT'>('INR_KG');

  const { brief, overview } = data;
  const s1 = overview?.executive_overview?.section_1_price_benchmarks;

  // Contemporary FX rate
  const contemporaryFxRate = s1?.domestic_pricing_headroom?.inr_usd_exchange_rate ||
    (s1?.latest_metrics?.agrocel_weighted_realization_inr_mt && s1?.latest_metrics?.agrocel_weighted_realization_usd_mt
      ? s1.latest_metrics.agrocel_weighted_realization_inr_mt / s1.latest_metrics.agrocel_weighted_realization_usd_mt
      : 86.8);

  // Price unit converter for benchmarks
  const formatPriceVal = (usdMtVal: number | null | undefined, inrMtVal?: number | null) => {
    if (usdMtVal === null || usdMtVal === undefined || isNaN(usdMtVal)) return { formatted: '—', unit: '' };
    if (priceUnit === 'USD_MT') {
      return { formatted: `$${num(usdMtVal, 0)}`, unit: '/ MT' };
    }
    if (priceUnit === 'INR_KG') {
      if (inrMtVal) return { formatted: `₹${num(inrMtVal / 1000, 1)}`, unit: '/ kg' };
      return { formatted: `₹${num((usdMtVal * contemporaryFxRate) / 1000, 1)}`, unit: '/ kg' };
    }
    if (inrMtVal) return { formatted: `₹${num(inrMtVal, 0)}`, unit: '/ MT' };
    return { formatted: `₹${num(usdMtVal * contemporaryFxRate, 0)}`, unit: '/ MT' };
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

  // Handle incoming sub-tab parameter
  useEffect(() => {
    if (activeSubTab) {
      if (['benchmarks', 'trends', 'price', 'parity'].includes(activeSubTab)) {
        setActiveSection('parity');
      } else if (['arbitrage', 'cockpit'].includes(activeSubTab)) {
        setActiveSection('arbitrage');
      } else if (['forecast'].includes(activeSubTab)) {
        setActiveSection('forecast');
      } else if (activeSubTab === 'all') {
        setActiveSection('all');
      }
    }
  }, [activeSubTab]);

  const handleSectionSwitch = (section: SectionKey) => {
    setActiveSection(section);
    onSubTabChange?.(section);
  };

  return (
    <div className="page-shell market-intelligence-page price-intelligence-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate?.('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Pricing Desk</span>
          </>
        }
        title="Price Intelligence & Landed Parity Desk"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Single Market Price Indicator */}
            <div
              className="exec-single-price-indicator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.85rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#0d9488',
                  boxShadow: '0 0 0 3px rgba(13, 148, 136, 0.15)',
                  display: 'inline-block'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Bromine Market Price (CIF India)
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Fraunces, serif' }}>
                  {formatPriceVal(s1?.latest_metrics?.cif_india_import_parity_usd_mt).formatted}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '0.25rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {formatPriceVal(s1?.latest_metrics?.cif_india_import_parity_usd_mt).unit}
                  </span>
                </span>
              </div>
            </div>

            <div className="benchmark-unit-toggle-bar" style={{ margin: 0 }}>
              <div className="unit-toggle-group">
                <button
                  className={`unit-toggle-btn ${priceUnit === 'INR_KG' ? 'active' : ''}`}
                  onClick={() => setPriceUnit('INR_KG')}
                  title="Domestic realisations benchmark (INR/kg)"
                >
                  INR / kg (Domestic)
                </button>
                <button
                  className={`unit-toggle-btn ${priceUnit === 'USD_MT' ? 'active' : ''}`}
                  onClick={() => setPriceUnit('USD_MT')}
                  title="Global import/export trade basis (USD/MT)"
                >
                  USD / MT
                </button>
                <button
                  className={`unit-toggle-btn ${priceUnit === 'INR_MT' ? 'active' : ''}`}
                  onClick={() => setPriceUnit('INR_MT')}
                  title="Domestic bulk contract basis (INR/MT)"
                >
                  INR / MT
                </button>
              </div>
            </div>
          </div>
        }
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'all', label: 'All Pricing Sections' },
          { id: 'parity', label: '1. Parity & Headroom' },
          { id: 'arbitrage', label: '2. Arbitrage Cockpit' },
          { id: 'forecast', label: '3. Econometric Forecast' }
        ]}
        activeId={activeSection}
        onSelect={id => handleSectionSwitch(id as SectionKey)}
        ariaLabel="Price Intelligence Navigation"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: DOMESTIC PRICING HEADROOM & CORE BENCHMARKS                   */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'parity') && (
        <section id="parity" className="exec-card section-container" style={{ marginBottom: '1.75rem' }}>
          <div className="section-head-bar">
            <div>
              <span className="section-step-num">SECTION 01 · BENCHMARK PARITY</span>
              <h2 className="section-title">Domestic Pricing Headroom & Import Replacement Parity</h2>
            </div>
            <span className="evidence-badge">
              Landed CIF vs. Agrocel Invoiced Domestic Benchmark
            </span>
          </div>

          {/* Domestic Pricing Headroom Banner (Clean Metrics, No Paragraph Walls) */}
          {s1?.domestic_pricing_headroom && (
            <div className="pricing-headroom-banner" style={{ marginBottom: '1.25rem' }}>
              <div className="ph-left">
                <div className="ph-badge-row">
                  <span className="ph-badge">DOMESTIC PRICING HEADROOM</span>
                  <span className="ph-status-chip positive">
                    {s1.domestic_pricing_headroom.status_label || 'INSULATED DOMESTIC BUFFER'}
                  </span>
                </div>
                <h3 className="ph-title" style={{ margin: '0.25rem 0 0' }}>Agrocel Realization vs. Landed CIF Import Parity</h3>
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

          {/* Benchmark KPI Grid (Dynamic Currency Conversion) */}
          <div className="benchmark-kpi-grid" style={{ marginBottom: '1.5rem' }}>
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
              <p className="b-kpi-sub">
                {s1?.domestic_pricing_headroom?.headroom_pct != null
                  ? `${num(s1.domestic_pricing_headroom.headroom_pct, 1)}% domestic discount vs imports`
                  : 'Verified domestic discount available'}
              </p>
            </div>
          </div>

          {/* Master Monthly Benchmark Trajectory Chart */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                Master Monthly Benchmark Trajectory
              </h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ color: '#0d9488' }}>● CIF India Landed</span>
                <span style={{ color: '#4f46e5' }}>● Agrocel Realization</span>
                <span style={{ color: '#f59e0b' }}>● China Spot</span>
                <span style={{ color: '#64748b' }}>● FOB India Export</span>
              </div>
            </div>

            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DOMESTIC PRICING ARBITRAGE & LANDED PARITY COCKPIT            */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'arbitrage') && (
        <section id="arbitrage" className="exec-card section-container" style={{ marginBottom: '1.75rem' }}>
          <div className="section-head-bar">
            <div>
              <span className="section-step-num">SECTION 02 · SIMULATION COCKPIT</span>
              <h2 className="section-title">Domestic Pricing Arbitrage & Sensitivity Simulator</h2>
            </div>
            <span className="evidence-badge">
              Interactive CIF / FX Scenarios & Negotiation Corridor
            </span>
          </div>

          <PricingArbitrageCockpit
            initialCifUsd={s1?.latest_metrics?.cif_india_import_parity_usd_mt}
            initialFx={contemporaryFxRate}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: FORWARD ML PRICE FORECAST                                     */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'forecast') && (
        <section id="forecast" className="exec-card section-container" style={{ marginBottom: '1.75rem' }}>
          <div className="section-head-bar">
            <div>
              <span className="section-step-num">SECTION 03 · ECONOMETRIC TRAJECTORY</span>
              <h2 className="section-title">Proprietary 48-Month Econometric & ML Price Forecast</h2>
            </div>
            <span className="evidence-badge">
              Projected Indian Landed Parity Corridor (Next 3 Quarters)
            </span>
          </div>

          <IndiaPriceForecastSection />
        </section>
      )}
    </div>
  );
}

// Backwards-compatible export
export const MarketIntelligencePage = PriceIntelligencePage;
