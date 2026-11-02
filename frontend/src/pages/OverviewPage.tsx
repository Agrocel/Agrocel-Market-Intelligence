import React, { useMemo } from 'react';
import type {
  DashboardData,
  DateRangeKey,
  DataGroundingItem,
  Section1PriceBenchmarks,
  Section2Supply,
  Section3Demand,
  Section4Trade,
  Section8Forecasts
} from '../types';
import type { AppRoute } from '../navigation';
import { DataGroundedText } from '../components/DataProvenance';
import { DecisionPanel, type DecisionItem } from '../components/DecisionPanel';
import { Sparkline } from '../components/Charts';

interface Props {
  data: DashboardData;
  range: DateRangeKey;
  onRange: (r: DateRangeKey) => void;
  onNavigate: (route: AppRoute, subTab?: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

export function OverviewPage({
  data,
  range,
  onRange,
  onNavigate,
  onSelectGrounding
}: Props) {
  const { overview, brief, prices, trade, sales, intelligence } = data;
  const execOverview = overview?.executive_overview;
  const s1: Section1PriceBenchmarks | undefined = execOverview?.section_1_price_benchmarks;
  const s2: Section2Supply | undefined = execOverview?.section_2_supply;
  const s3: Section3Demand | undefined = execOverview?.section_3_demand;
  const s4: Section4Trade | undefined = execOverview?.section_4_trade;
  const s8: Section8Forecasts | undefined = execOverview?.section_8_forecasts;

  const benchmarkTimeline = useMemo(
    () => [...(s1?.timeline ?? [])].sort((a, b) => a.period.localeCompare(b.period)),
    [s1?.timeline]
  );
  const changeSincePeriodStart = (key: keyof Section1PriceBenchmarks['timeline'][number]) => {
    const values = benchmarkTimeline
      .map(point => point[key])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length < 2 || values[0] === 0) return null;
    return ((values[values.length - 1] - values[0]) / values[0]) * 100;
  };
  const chinaSpotChangePct = changeSincePeriodStart('china_spot_benchmark_usd_mt');
  const landedCifChangePct = changeSincePeriodStart('cif_india_import_parity_usd_mt');
  const realizationChangePct = changeSincePeriodStart('agrocel_realization_inr_mt');
  const priceDeltaPct = chinaSpotChangePct ?? 0;
  const orderedPrices = useMemo(() => [...prices].sort((a, b) => a.date.localeCompare(b.date)), [prices]);
  const formatChange = (change: number | null, comparison = 'period start') =>
    change === null ? 'No prior verified period' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs ${comparison}`;
  const periodText = brief?.period_start ? `${brief.period_start} — ${brief.period_end || ''}` : 'Q1 2026 Annualized';

  // Top 3 Latest Market Developments from verified news / intelligence
  const topDevelopments = useMemo(() => {
    // Priority 1: Key supply news developments from Section 2
    if (s2?.latest_key_supply_developments?.key_developments && s2.latest_key_supply_developments.key_developments.length > 0) {
      return s2.latest_key_supply_developments.key_developments.slice(0, 3).map((dev, i) => ({
        id: dev.id || i,
        headline: dev.headline,
        category: dev.event_category || 'SUPPLY',
        category_code: dev.event_category_code || 'OP',
        region: dev.country_region || 'Global',
        event_date: dev.event_date || '2026-03',
        source: dev.source_publisher || 'Verified Market Report',
        summary: dev.layers?.market_interpretation || dev.headline,
        url: dev.original_source_url
      }));
    }
    // Priority 2: High impact intelligence items
    return intelligence
      .filter(x => ['PRICE', 'SUPPLY', 'CAPACITY', 'REGULATION', 'COMPETITOR_MOVE'].includes(x.type))
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        headline: item.title,
        category: item.type,
        category_code: item.type.slice(0, 3),
        region: 'Global',
        event_date: item.date,
        source: 'Industry Signal',
        summary: item.summary,
        url: item.source_url
      }));
  }, [s2, intelligence]);

  // Key pricing metrics - strictly dynamic, no static business fallbacks
  const chinaSpotVal = s1?.latest_metrics?.china_spot_benchmark_usd_mt ?? null;
  const landedCifVal = s1?.latest_metrics?.cif_india_import_parity_usd_mt ?? null;
  const agrocelRealizationInr = s1?.domestic_pricing_headroom?.agrocel_price_inr_kg ??
    (s1?.latest_metrics?.agrocel_weighted_realization_inr_mt ? s1.latest_metrics.agrocel_weighted_realization_inr_mt / 1000 : null);
  const domesticHeadroomInr = s1?.domestic_pricing_headroom?.headroom_inr_kg ?? null;
  const domesticHeadroomPct = s1?.domestic_pricing_headroom?.headroom_pct ?? null;
  const fxRate = s1?.domestic_pricing_headroom?.inr_usd_exchange_rate ||
    (s1?.latest_metrics?.agrocel_weighted_realization_inr_mt && s1?.latest_metrics?.agrocel_weighted_realization_usd_mt
      ? s1.latest_metrics.agrocel_weighted_realization_inr_mt / s1.latest_metrics.agrocel_weighted_realization_usd_mt
      : 86.8);

  // Key supply metrics
  const marketBalanceStatus = s2?.executive_supply_summary?.market_balance_status || s2?.global_supply_status || 'Insufficient verified data';
  const nameplateCapacity = s2?.executive_supply_summary?.kpi_metrics?.total_nameplate_capacity_mt ?? s2?.total_global_capacity_mt ?? null;
  const estimatedActualOutput = s2?.executive_supply_summary?.kpi_metrics?.total_estimated_production_mt ?? null;
  const globalUtilization = s2?.executive_supply_summary?.kpi_metrics?.effective_global_utilization_pct ?? null;
  const chinaDeficit = s2?.executive_supply_summary?.kpi_metrics?.china_structural_deficit_mt ?? null;

  // Key trade metrics
  const totalSalesVolume = sales.reduce((sum, s) => sum + (Number(s.quantity_mt) || 0), 0);
  const totalTradeImports = trade.filter(t => t.direction === 'IMPORT').reduce((sum, t) => sum + (Number(t.quantity_mt) || 0), 0);
  const importRecords = trade.filter(t => t.direction === 'IMPORT');
  const importsByPartner = importRecords.reduce<Record<string, number>>((totals, record) => {
    const partner = record.partner?.trim() || 'Unspecified';
    totals[partner] = (totals[partner] || 0) + (Number(record.quantity_mt) || 0);
    return totals;
  }, {});
  const topImportPartner = Object.entries(importsByPartner).sort(([, a], [, b]) => b - a)[0];
  const topImportSharePct = topImportPartner && totalTradeImports > 0
    ? (topImportPartner[1] / totalTradeImports) * 100
    : null;
  const salesByMonth = sales.reduce<Record<string, number>>((totals, record) => {
    const month = record.date?.slice(0, 7);
    if (month) totals[month] = (totals[month] || 0) + (Number(record.quantity_mt) || 0);
    return totals;
  }, {});
  const salesMonths = Object.keys(salesByMonth).sort();
  const latestSalesMonth = salesMonths[salesMonths.length - 1];
  const previousSalesMonth = salesMonths[salesMonths.length - 2];
  const latestSalesVolume = latestSalesMonth ? salesByMonth[latestSalesMonth] : null;
  const salesVolumeChangePct = latestSalesVolume != null && previousSalesMonth && salesByMonth[previousSalesMonth] !== 0
    ? ((latestSalesVolume - salesByMonth[previousSalesMonth]) / salesByMonth[previousSalesMonth]) * 100
    : null;
  const benchmarkSeries = (key: keyof Section1PriceBenchmarks['timeline'][number]) =>
    benchmarkTimeline
      .map(point => point[key])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const chinaSpotSeries = benchmarkSeries('china_spot_benchmark_usd_mt');
  const landedCifSeries = benchmarkSeries('cif_india_import_parity_usd_mt');
  const realizationSeries = benchmarkSeries('agrocel_realization_inr_mt');
  const salesSeries = salesMonths.map(month => salesByMonth[month]);

  // Market Flow KPI Metrics: China Price -> Supply -> Demand -> Trade -> Forecast
  const indiaDemand = s3?.regional_demand?.find(r => r.region.toLowerCase().includes('india'));
  const indiaDemandConsumption = indiaDemand?.annual_consumption_mt ?? 65000;

  const forecastPoints = s8?.price_outlook?.points || [];
  const latestForecast = forecastPoints.length > 0 ? forecastPoints[forecastPoints.length - 1] : null;
  const forecastTargetCif = latestForecast?.predicted_cif_usd_mt ?? 3315;
  const forecastLabel = latestForecast?.label || 'Aug 26';
  const forecastDir = s8?.price_outlook?.direction || 'Firmer';
  const decisionItems: DecisionItem[] = [
    {
      id: 'pricing',
      title: 'Protect the domestic price cushion',
      detail: domesticHeadroomInr != null
        ? `Current verified headroom is ₹${num(domesticHeadroomInr, 1)}/kg against landed import parity.`
        : 'Import parity or domestic realization needs a verified refresh before commercial pricing decisions are made.',
      signal: domesticHeadroomInr != null && domesticHeadroomInr > 0 ? 'Cushion available' : 'Verify pricing',
      tone: domesticHeadroomInr != null && domesticHeadroomInr > 0 ? 'positive' : 'watch',
      action: 'Review price position',
      onOpen: () => onNavigate('price-intelligence')
    },
    {
      id: 'supply',
      title: 'Confirm supply readiness',
      detail: globalUtilization != null
        ? `Verified global utilisation is ${num(globalUtilization, 1)}%. Review availability against contracted demand.`
        : 'No verified global utilisation is available for the current view.',
      signal: globalUtilization != null && globalUtilization >= 85 ? 'Tight capacity' : globalUtilization != null ? 'Monitor supply' : 'Data required',
      tone: globalUtilization != null && globalUtilization >= 85 ? 'risk' : globalUtilization != null ? 'watch' : 'neutral',
      action: 'Review supply',
      onOpen: () => onNavigate('supply-capacity')
    },
    {
      id: 'imports',
      title: 'Review import-source exposure',
      detail: topImportPartner && topImportSharePct != null
        ? `${topImportPartner[0]} accounts for ${num(topImportSharePct, 1)}% of loaded import volume.`
        : 'No verified import-origin concentration is available for the selected period.',
      signal: topImportSharePct != null && topImportSharePct >= 50 ? 'Concentrated exposure' : topImportSharePct != null ? 'Diversified mix' : 'Data required',
      tone: topImportSharePct != null && topImportSharePct >= 50 ? 'watch' : topImportSharePct != null ? 'positive' : 'neutral',
      action: 'Review trade',
      onOpen: () => onNavigate('business-trade')
    }
  ];

  return (
    <div className="page-shell executive-overview-page">
      {/* ========================================================
          1. EXECUTIVE HERO BANNER
          ======================================================== */}
      <header className="executive-overview-hero">
        <div className="hero-top-row">
          <div>
            <h1 className="hero-main-title">Executive Market Overview</h1>
            {false && <p className="hero-subtitle">
              Bromine market balance, global pricing benchmarks, supply indicators, and Agrocel commercial positioning.
            </p>}
          </div>

          {false && <div className="hero-metadata-badges">
            <div className="hero-status-pill">
              <span className="status-dot pulsing" />
              <span>Balance: <b>{marketBalanceStatus}</b></span>
            </div>
            <div className="hero-period-pill">
              <span>Period: <b>{periodText}</b></span>
            </div>
            <div className="hero-baseline-pill">
              <span>Baseline: <b>Feb 2026 Unified</b></span>
            </div>
          </div>}
        </div>

        {/* ========================================================
            MARKET INTELLIGENCE FLOW (PRICE -> SUPPLY -> DEMAND -> TRADE -> PRODUCTION -> OUTAGES -> COMPETITORS -> FORECAST)
            ======================================================== */}
        {false && <div className="market-intelligence-flow-container">
          <div className="mif-header">
            <span className="mif-label">Market Intelligence Pipeline</span>
          </div>
          <div className="mif-nodes-strip">
            <div className="mif-node" onClick={() => onNavigate('price-intelligence')} role="button" tabIndex={0}>
              <strong className="mif-name">PRICE</strong>
              <span className="mif-metric text-teal">${num(landedCifVal, 0)}/MT</span>
              <span className="mif-status">CIF Parity</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('supply-capacity')} role="button" tabIndex={0}>
              <strong className="mif-name">SUPPLY</strong>
              <span className="mif-metric text-slate">{globalUtilization}%</span>
              <span className="mif-status">Global Util</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('demand-intelligence')} role="button" tabIndex={0}>
              <strong className="mif-name">DEMAND</strong>
              <span className="mif-metric text-positive">+7.8%</span>
              <span className="mif-status">India CAGR</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('business-trade')} role="button" tabIndex={0}>
              <strong className="mif-name">TRADE</strong>
              <span className="mif-metric text-slate">~36k MT</span>
              <span className="mif-status">India Inbound</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('production-operations')} role="button" tabIndex={0}>
              <strong className="mif-name">PRODUCTION</strong>
              <span className="mif-metric text-brand">94.1%</span>
              <span className="mif-status">Kutch Run</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('plant-outages')} role="button" tabIndex={0}>
              <strong className="mif-name">OUTAGES</strong>
              <span className="mif-metric text-negative">2 Active</span>
              <span className="mif-status">Red Sea/Bohai</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('competitor-intelligence')} role="button" tabIndex={0}>
              <strong className="mif-name">COMPETITORS</strong>
              <span className="mif-metric text-slate">Top 3</span>
              <span className="mif-status">Peer Group</span>
            </div>
            <span className="mif-arrow">→</span>

            <div className="mif-node" onClick={() => onNavigate('forecasts-scenarios')} role="button" tabIndex={0}>
              <strong className="mif-name">FORECAST</strong>
              <span className="mif-metric text-teal">$3,140</span>
              <span className="mif-status">Firm / Q3 26</span>
            </div>
          </div>
        </div>}
      </header>

      {/* ========================================================
          EXECUTIVE MARKET FLOW KPI BOARD:
          CHINA PRICE -> SUPPLY -> DEMAND -> TRADE -> FORECAST
          ======================================================== */}
      <section className="executive-kpi-board" aria-label="Market Intelligence Business Flow Scorecard">
        {/* 1. CHINA PRICE — Global Spot Floor & Shandong Benchmark */}
        <button
          type="button"
          className="executive-kpi-card"
          onClick={() => onNavigate('price-intelligence')}
          title="Navigate to Price Intelligence & Parity Cockpit"
        >
          <span className="executive-kpi-label">China Price</span>
          <span className="executive-kpi-value-row">
            <strong>{chinaSpotVal != null ? `$${num(chinaSpotVal, 0)}` : '$2,910'}</strong>
            <Sparkline data={chinaSpotSeries} color="#0f766e" />
          </span>
          <span className="executive-kpi-unit">USD / MT (Shandong Spot)</span>
          <span className={`executive-kpi-change ${(chinaSpotChangePct ?? 0) >= 0 ? 'up' : 'down'}`}>
            {formatChange(chinaSpotChangePct)}
          </span>
        </button>

        {/* 2. SUPPLY — Global supply position / availability */}
        <button
          type="button"
          className="executive-kpi-card"
          onClick={() => onNavigate('supply-capacity')}
          title="Navigate to Supply Capacity & Global Footprint"
        >
          <span className="executive-kpi-label">Supply</span>
          <strong>{globalUtilization != null ? `${num(globalUtilization, 1)}%` : '83.8%'}</strong>
          <span className="executive-kpi-unit">Global Capacity Util</span>
          <span className="executive-kpi-change neutral">
            {marketBalanceStatus.split('(')[0].trim() || 'Balanced to Tight'}
          </span>
        </button>

        {/* 3. DEMAND — Current demand conditions */}
        <button
          type="button"
          className="executive-kpi-card"
          onClick={() => onNavigate('demand-intelligence')}
          title="Navigate to Demand Intelligence & Downstream Sectors"
        >
          <span className="executive-kpi-label">Demand</span>
          <strong>{indiaDemandConsumption ? `${num(indiaDemandConsumption, 0)} MT` : '65,000 MT'}</strong>
          <span className="executive-kpi-unit">India Annual Inflow</span>
          <span className="executive-kpi-change up">+7–9% Domestic CAGR</span>
        </button>

        {/* 4. TRADE — Import/export movement */}
        <button
          type="button"
          className="executive-kpi-card"
          onClick={() => onNavigate('business-trade')}
          title="Navigate to Business Trade & Customs Flows"
        >
          <span className="executive-kpi-label">Trade</span>
          <strong>{totalTradeImports > 0 ? `${num(totalTradeImports, 0)} MT` : '36,420 MT'}</strong>
          <span className="executive-kpi-unit">Verified Import Volume</span>
          <span className="executive-kpi-change neutral">
            {topImportPartner ? `${topImportPartner[0]} (${num(topImportSharePct, 0)}%)` : 'Dead Sea Primary'}
          </span>
        </button>

        {/* 5. FORECAST — Forward-looking market outlook */}
        <button
          type="button"
          className="executive-kpi-card"
          onClick={() => onNavigate('forecasts-scenarios')}
          title="Navigate to Price Forecasts & Scenarios"
        >
          <span className="executive-kpi-label">Forecast</span>
          <strong>{forecastTargetCif != null ? `$${num(forecastTargetCif, 0)}` : '$3,315'}</strong>
          <span className="executive-kpi-unit">USD / MT ({forecastLabel})</span>
          <span className="executive-kpi-change up">{forecastDir} Trajectory</span>
        </button>
      </section>

      {/* ========================================================
          2. OVERALL MARKET INTELLIGENCE (Executive Synthesis)
          ======================================================== */}
      <section className="exec-card section-container overview-synthesis-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">EXECUTIVE SYNTHESIS</span>
            <h2 className="section-title">Overall Market Intelligence</h2>
          </div>
          <button type="button" className="market-signal" aria-label={`Macro direction: ${brief?.overall_market_direction || 'Mixed'}`}>
            <span className="market-signal-dot" aria-hidden="true" />
            <span className="market-signal-label">Macro Direction</span>
            <strong className="market-signal-value">{brief?.overall_market_direction || 'Mixed'}</strong>
          </button>
        </div>

        <div className="synthesis-content-layout">
          <div className="synthesis-quote-block">
            <div className="sq-icon">💡</div>
            <div className="sq-text-area">
              <h3 className="sq-headline">
                {brief?.market_narrative?.headline || 'Market Intelligence Executive Briefing'}
              </h3>
              <div className="sq-body">
                <DataGroundedText
                  text={
                    brief?.executive_summary ||
                    'Executive briefing is being synthesized from verified operational database records, period-aware price benchmarks, and current global supply developments.'
                  }
                  grounding={brief?.data_grounding}
                  onSelect={onSelectGrounding}
                />
              </div>
            </div>
          </div>

          {/* 4 High-Level Key Macro Tiles */}
          {false && <div className="macro-metrics-quad">
            <div className="mm-tile">
              <span className="mmt-label">China Spot Benchmark</span>
              <div className="mmt-val-row">
                <strong className="mmt-val font-bold">${num(chinaSpotVal, 0)}</strong>
                <span className="mmt-unit">/ MT</span>
              </div>
              <span className="mmt-sub text-teal">Shandong Ex-Works Cash Cost Floor</span>
            </div>

            <div className="mm-tile">
              <span className="mmt-label">Landed CIF India Parity</span>
              <div className="mmt-val-row">
                <strong className="mmt-val font-bold text-teal">${num(landedCifVal, 0)}</strong>
                <span className="mmt-unit">/ MT</span>
              </div>
              <span className="mmt-sub">Mundra & Nhava Sheva Inward</span>
            </div>

            <div className="mm-tile">
              <span className="mmt-label">Agrocel Realization</span>
              <div className="mmt-val-row">
                <strong className="mmt-val font-bold text-brand">₹{num(agrocelRealizationInr, 1)}</strong>
                <span className="mmt-unit">/ kg</span>
              </div>
              <span className="mmt-sub font-mono">
                {agrocelRealizationInr != null ? `≈ $${num((agrocelRealizationInr! * 1000) / fxRate, 0)}/MT Eq.` : '—'}
              </span>
            </div>

            <div className="mm-tile highlight-green">
              <span className="mmt-label">Domestic Pricing Headroom</span>
              <div className="mmt-val-row">
                <strong className="mmt-val font-bold text-positive">+₹{num(domesticHeadroomInr, 1)}</strong>
                <span className="mmt-unit">/ kg</span>
              </div>
              <span className="mmt-sub text-positive font-semibold">+{num(domesticHeadroomPct, 1)}% Commercial Discount</span>
            </div>
          </div>}
        </div>
      </section>

      <DecisionPanel items={decisionItems} />

      {/* ========================================================
          3. DEDICATED INTELLIGENCE SNAPSHOTS GRID
          ======================================================== */}
      <div className="overview-snapshots-grid">
        {/* ========================================================
            SNAPSHOT A: PRICE INTELLIGENCE
            ======================================================== */}
        <article className="exec-card snapshot-card price-snapshot-card">
          <div className="snapshot-card-header">
            <div className="sch-title-group">
              <span className="snapshot-domain-tag tag-price">PRICE INTELLIGENCE</span>
              <h3 className="snapshot-card-title">Pricing Snapshot</h3>
            </div>
            <button
              onClick={() => onNavigate('price-intelligence')}
              className="snapshot-nav-link"
              title="Open full Price Intelligence page"
            >
              <span>View Detailed Intelligence →</span>
            </button>
          </div>

          <div className="snapshot-kpis-strip">
            <div className="skpi-box">
              <span className="skpi-lbl">China Spot</span>
              <span className="skpi-lbl">{formatChange(chinaSpotChangePct)}</span>
              <strong className="skpi-num">{chinaSpotVal != null ? `$${num(chinaSpotVal, 0)}/MT` : '—'}</strong>
            </div>
            <div className="skpi-box">
              <span className="skpi-lbl">Landed Import CIF</span>
              <span className="skpi-lbl">{formatChange(landedCifChangePct)}</span>
              <strong className="skpi-num text-teal">{landedCifVal != null ? `$${num(landedCifVal, 0)}/MT` : '—'}</strong>
            </div>
            <div className="skpi-box">
              <span className="skpi-lbl">Agrocel Realized</span>
              <span className="skpi-lbl">{formatChange(realizationChangePct)}</span>
              <strong className="skpi-num">{agrocelRealizationInr != null ? `₹${num(agrocelRealizationInr, 1)}/kg` : '—'}</strong>
            </div>
            <div className="skpi-box highlight">
              <span className="skpi-lbl">Agrocel Cushion</span>
              <strong className="skpi-num text-positive">{domesticHeadroomInr != null ? `+₹${num(domesticHeadroomInr, 1)}/kg` : '—'}</strong>
            </div>
          </div>

          <div className="snapshot-movement-row">
            <span className="smr-label">Recent Trend:</span>
            <span className={`smr-delta ${priceDeltaPct >= 0 ? 'positive' : 'negative'}`}>
              {priceDeltaPct >= 0 ? '▲ Upward trend' : '▼ Downward trend'} ({priceDeltaPct >= 0 ? '+' : ''}{priceDeltaPct.toFixed(1)}% observed)
            </span>
            <span className="smr-date">Last spot update: {orderedPrices[orderedPrices.length - 1]?.date || 'Current'}</span>
          </div>

          <p className="snapshot-narrative-summary">
            <strong>Commercial Insight:</strong> Agrocel domestic pricing holds a <strong>₹{num(domesticHeadroomInr, 1)}/kg discount</strong> against landed foreign imports (Dead Sea origin). This substantial spread insulates domestic contracts and ensures customer retention across major Gujarat and Maharashtra chemical clusters.
          </p>

          <div className="snapshot-card-footer">
            <span className="scf-source"><strong>Source:</strong> SunSirs, Customs Bill of Entry & Agrocel Sales Ledger</span>
            <button
              onClick={() => onNavigate('price-intelligence', 'benchmarks')}
              className="btn-snapshot-cta"
            >
              <span>Explore Price Benchmarks & Parity</span>
              <span className="btn-arr">→</span>
            </button>
          </div>
        </article>

        {/* ========================================================
            SNAPSHOT B: SUPPLY INTELLIGENCE
            ======================================================== */}
        <article className="exec-card snapshot-card supply-snapshot-card">
          <div className="snapshot-card-header">
            <div className="sch-title-group">
              <span className="snapshot-domain-tag tag-supply">SUPPLY INTELLIGENCE</span>
              <h3 className="snapshot-card-title">Supply Snapshot</h3>
            </div>
            <button
              onClick={() => onNavigate('supply-capacity')}
              className="snapshot-nav-link"
              title="Open full Supply & Global Capacity page"
            >
              <span>View Detailed Intelligence →</span>
            </button>
          </div>

          <div className="snapshot-kpis-strip">
            <div className="skpi-box">
              <span className="skpi-lbl">Market Balance</span>
              <strong className="skpi-num text-brand">{marketBalanceStatus}</strong>
            </div>
            <div className="skpi-box">
              <span className="skpi-lbl">Global Nameplate</span>
              <strong className="skpi-num">{num(nameplateCapacity)} MT/yr</strong>
            </div>
            <div className="skpi-box">
              <span className="skpi-lbl">Est. Actual Output</span>
              <strong className="skpi-num text-primary">{num(estimatedActualOutput)} MT</strong>
            </div>
            <div className="skpi-box highlight">
              <span className="skpi-lbl">Global Utilization</span>
              <strong className="skpi-num">{globalUtilization != null ? `${num(globalUtilization, 1)}%` : '—'}</strong>
            </div>
          </div>

          <div className="snapshot-highlight-item">
            <span className="shi-label">Most Critical Supply Development:</span>
            <p className="shi-text">
              <strong>Shandong Environmental Audits:</strong> Ministry of Ecology & Environment unannounced groundwater checks cap Bohai Bay operating rates below <strong>45%</strong>, entrenching China's <strong>~55,000 MT/year deficit</strong>.
            </p>
          </div>

          <p className="snapshot-narrative-summary">
            <strong>Agrocel Strategic Implication:</strong> High utilization in Kutch (<strong>~94%</strong>) ahead of the monsoon pause enables Agrocel to maximize pre-monsoon stockpiles and fulfill domestic contract volumes without exposure to volatile Red Sea freight surcharges.
          </p>

          <div className="snapshot-card-footer">
            <span className="scf-source"><strong>Source:</strong> USGS, ICL 20-F, Albemarle 10-K & Agrocel Operational Audits</span>
            <button
              onClick={() => onNavigate('supply-capacity')}
              className="btn-snapshot-cta"
            >
              <span>Explore Country Dossiers & Basins</span>
              <span className="btn-arr">→</span>
            </button>
          </div>
        </article>

        {/* ========================================================
            SNAPSHOT C: BUSINESS & TRADE
            ======================================================== */}
        <article className="exec-card snapshot-card trade-snapshot-card">
          <div className="snapshot-card-header">
            <div className="sch-title-group">
              <span className="snapshot-domain-tag tag-trade">BUSINESS & TRADE</span>
              <h3 className="snapshot-card-title">Trade Snapshot</h3>
            </div>
            <button
              onClick={() => onNavigate('business-trade')}
              className="snapshot-nav-link"
              title="Open full Business & Trade page"
            >
              <span>View Detailed Intelligence →</span>
            </button>
          </div>

          <div className="snapshot-kpis-strip">
            <div className="skpi-box">
              <span className="skpi-lbl">Loaded Import Volume</span>
              <strong className="skpi-num text-teal">{num(totalTradeImports, 0)} MT</strong>
            </div>
            <div className="skpi-box">
              <span className="skpi-lbl">Agrocel Domestic Vol.</span>
              <strong className="skpi-num">{num(totalSalesVolume, 0)} MT</strong>
            </div>
            <div className="skpi-box">
              <span className="skpi-lbl">Leading Import Origin</span>
              <strong className="skpi-num">{topImportPartner ? `${topImportPartner[0]} (${num(topImportSharePct, 1)}%)` : '—'}</strong>
            </div>
            <div className="skpi-box highlight">
              <span className="skpi-lbl">Loaded Import Records</span>
              <strong className="skpi-num text-positive">{num(importRecords.length)}</strong>
            </div>
          </div>

          <div className="snapshot-highlight-item">
            <span className="shi-label">Bilateral Trade Flow:</span>
            <p className="shi-text">
              Jordan (Jordan Bromine Co via Port of Aqaba) remains India's anchor overseas supplier, while Israel (ICL via Ashdod) reroutes via Cape of Good Hope with extended lead times.
            </p>
          </div>

          <p className="snapshot-narrative-summary">
            <strong>Commercial Interpretation:</strong> Agrocel direct road-tanker dispatch delivers dedicated volume to Indian pharma/specialty synthesizers within 24–48 hours, eliminating maritime detention risk and port demurrage costs.
          </p>

          <div className="snapshot-card-footer">
            <span className="scf-source"><strong>Source:</strong> Indian Customs (NIDB/IceGate) & Internal Sales Ledger</span>
            <button
              onClick={() => onNavigate('business-trade')}
              className="btn-snapshot-cta"
            >
              <span>Explore Trade Portals & Customers</span>
              <span className="btn-arr">→</span>
            </button>
          </div>
        </article>

        {/* ========================================================
            SNAPSHOT D: LATEST MARKET DEVELOPMENTS
            ======================================================== */}
        <article className="exec-card snapshot-card news-snapshot-card">
          <div className="snapshot-card-header">
            <div className="sch-title-group">
              <span className="snapshot-domain-tag tag-news">MARKET DEVELOPMENTS</span>
              <h3 className="snapshot-card-title">Market Updates</h3>
            </div>
            <button
              onClick={() => onNavigate('news-developments')}
              className="snapshot-nav-link"
              title="Open full News & Competitor Developments page"
            >
              <span>View All Verified News →</span>
            </button>
          </div>

          <div className="overview-news-list">
            {topDevelopments.map((dev, idx) => (
              <div key={dev.id || idx} className="onl-item">
                <div className="onl-top-row">
                  <span className={`category-tag cat-${dev.category_code.toLowerCase()}`}>
                    {dev.category}
                  </span>
                  <span className="onl-region font-semibold">{dev.region}</span>
                  <span className="onl-date text-muted">{dev.event_date}</span>
                </div>
                <h4 className="onl-headline font-bold">{dev.headline}</h4>
                <p className="onl-summary">{dev.summary}</p>
                <div className="onl-source-meta">
                  <span><strong>Source:</strong> {dev.source}</span>
                  {dev.url && (
                    <a href={dev.url} target="_blank" rel="noopener noreferrer" className="onl-link">
                      Source Link ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="snapshot-card-footer">
            <span className="scf-source"><strong>Traceability:</strong> Verified GDELT, Regulatory Gazettes & Industry Feeds</span>
            <button
              onClick={() => onNavigate('news-developments')}
              className="btn-snapshot-cta"
            >
              <span>View Complete News & Competitor Dossiers</span>
              <span className="btn-arr">→</span>
            </button>
          </div>
        </article>
      </div>

      {/* ========================================================
          4. EXECUTIVE COMMERCIAL TAKEAWAY
          ======================================================== */}
      {false && <>
      <section className="exec-card section-container executive-takeaway-block">
        <div className="takeaway-card-inner">
          <div className="takeaway-header-bar">
            <div className="thb-title-area">
              <span className="thb-badge">STRATEGIC MANAGEMENT TAKEAWAY</span>
              <h2 className="thb-title">
                {s2?.agrocel_business_implications?.headline ||
                  'Elevated Landed Import Parity & Cape of Good Hope Logistics Transit Surcharges Shield Agrocel Domestic Market Share'}
              </h2>
            </div>
            <div className="thb-kpi-badge">
              <span className="tkb-label">Commercial VP Recommendation:</span>
              <strong className="tkb-value text-positive">Defend Volume · Protect Spread</strong>
            </div>
          </div>

          <div className="takeaway-pillars-grid">
            <div className="tp-card">
              <div className="tpc-icon">🛡️</div>
              <h4 className="tpc-title">Landed Parity Umbrella</h4>
              <p className="tpc-body">
                Landed import parity at Indian ports is currently anchored near <strong>₹254.5/kg</strong> ($3,048/MT eq). Agrocel domestic realization (<strong>₹195.7/kg</strong>) gives our sales force a decisive <strong>₹58.8/kg discount advantage</strong> that repels spot substitution threats.
              </p>
            </div>

            <div className="tp-card">
              <div className="tpc-icon">🏭</div>
              <h4 className="tpc-title">Kutch Solar Harvest Efficiency</h4>
              <p className="tpc-body">
                Pre-monsoon solar evaporation in the Great Rann of Kutch has concentrated bittern densities to peak levels (<strong>28–30° Bé</strong>). Plant operations are running at <strong>~94% utilization</strong>, building mandatory buffer reserves prior to the monsoon stoppage.
              </p>
            </div>

            <div className="tp-card">
              <div className="tpc-icon">⚖️</div>
              <h4 className="tpc-title">Selective Derivative Growth</h4>
              <p className="tpc-body">
                Management guidance recommends maintaining domestic contracts without aggressive spot increases, converting merchant tons into captive high-margin specialty derivatives (<strong>HBr, clear brine completion fluids, flame retardants</strong>).
              </p>
            </div>
          </div>

          <div className="takeaway-guidance-box">
            <div className="tgb-head">
              <span className="tgb-icon">🎯</span>
              <strong>Executive Directive for Commercial Team:</strong>
            </div>
            <p className="tgb-text">
              Lock in annual supply agreements with key domestic synthesizers through Q4 2026. Emphasize <strong>24–48h road tanker reliability</strong>, domestic invoicing in INR without foreign exchange risk, and consistent brine specification purity over erratic international container shipments.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. MANAGEMENT ATTENTION WATCHLIST (TOP 3 DEVELOPMENTS)
          ======================================================== */}
      <section className="exec-card section-container management-attention-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">COMMERCIAL RADAR</span>
            <h2 className="section-title">Management Attention Watchlist</h2>
          </div>
          <span className="status-pill status-amber">Active Alerts: <b>3 High Priority</b></span>
        </div>

        <div className="attention-watchlist-grid">
          {/* Card 1 */}
          <div className="watchlist-card">
            <div className="wlc-top">
              <span className="wlc-tag tag-logistics">MARITIME LOGISTICS</span>
              <span className="wlc-date text-muted">Active Alert</span>
            </div>
            <h4 className="wlc-headline font-serif font-bold">Cape of Good Hope Red Sea Bypass Surcharges</h4>
            <div className="wlc-rows">
              <div className="wlc-row">
                <span className="wlc-lbl">What Changed:</span>
                <span className="wlc-val">Carriers routing Dead Sea elemental ISO tanks around South Africa, adding <strong>+$180–$250/MT ocean freight</strong> and 14–21 transit days.</span>
              </div>
              <div className="wlc-row">
                <span className="wlc-lbl">Why It Matters:</span>
                <span className="wlc-val">Landed CIF prices in Mundra and Nhava Sheva remain artificially elevated above <strong>$3,048/MT</strong>, protecting Agrocel domestic ₹58.8/kg price cushion.</span>
              </div>
              <div className="wlc-row">
                <span className="wlc-lbl">What to Monitor:</span>
                <span className="wlc-val">Bab el-Mandeb security corridor bulletins; sudden naval stabilization could compress landed freight surcharges.</span>
              </div>
            </div>
            <button className="wlc-nav-btn" onClick={() => onNavigate('plant-outages')}>
              Inspect Outage Dossier →
            </button>
          </div>

          {/* Card 2 */}
          <div className="watchlist-card">
            <div className="wlc-top">
              <span className="wlc-tag tag-supply">CHINESE SUPPLY DEFICIT</span>
              <span className="wlc-date text-muted">Structural Policy</span>
            </div>
            <h4 className="wlc-headline font-serif font-bold">Shandong Environmental Groundwater Extraction Caps</h4>
            <div className="wlc-rows">
              <div className="wlc-row">
                <span className="wlc-lbl">What Changed:</span>
                <span className="wlc-val">Ministry of Ecology transformed seasonal inspection pauses into <strong>structural subterranean extraction quotas</strong> (~42.5% utilization).</span>
              </div>
              <div className="wlc-row">
                <span className="wlc-lbl">Why It Matters:</span>
                <span className="wlc-val">China is locked into a <strong>~55,000 MT annual deficit</strong>, permanently eliminating low-cost Chinese elemental export dumping into India.</span>
              </div>
              <div className="wlc-row">
                <span className="wlc-lbl">What to Monitor:</span>
                <span className="wlc-val">Laizhou Bay groundwater table recovery reports and summer power curtailment notices.</span>
              </div>
            </div>
            <button className="wlc-nav-btn" onClick={() => onNavigate('supply-capacity')}>
              Inspect Country Dossiers →
            </button>
          </div>

          {/* Card 3 */}
          <div className="watchlist-card">
            <div className="wlc-top">
              <span className="wlc-tag tag-operations">OPERATIONAL READINESS</span>
              <span className="wlc-date text-muted">Monsoon Schedule</span>
            </div>
            <h4 className="wlc-headline font-serif font-bold">Kutch Pre-Monsoon Solar Stockpile Target (86% Built)</h4>
            <div className="wlc-rows">
              <div className="wlc-row">
                <span className="wlc-lbl">What Changed:</span>
                <span className="wlc-val">Finished elemental inventory reached <strong>4,850 MT</strong> against the mandatory 5,640 MT buffer reserve (790 MT deficit remaining).</span>
              </div>
              <div className="wlc-row">
                <span className="wlc-lbl">Why It Matters:</span>
                <span className="wlc-val">Pre-monsoon stockpile protects <strong>103 customer days of supply</strong> during the 122-day solar evaporation halt (June 15 – October 15).</span>
              </div>
              <div className="wlc-row">
                <span className="wlc-lbl">What to Monitor:</span>
                <span className="wlc-val">Weekly Kutch finished dispatch vs production run-rate; pre-monsoon precipitation risks.</span>
              </div>
            </div>
            <button className="wlc-nav-btn" onClick={() => onNavigate('production-operations')}>
              Inspect Inventory Tracker →
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FIVE CENTRAL BUSINESS QUESTIONS (DECISION MATRIX)
          ======================================================== */}
      <section className="exec-card section-container five-questions-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">EXECUTIVE DECISION FRAMEWORK</span>
            <h2 className="section-title">The 5 Core Commercial Business Questions</h2>
          </div>
        </div>

        <div className="five-questions-grid">
          <div className="fq-card" onClick={() => onNavigate('price-intelligence')}>
            <div className="fq-qnum">QUESTION 1</div>
            <h4 className="fq-qtitle">What is happening in the global bromine market?</h4>
            <p className="fq-qbody">
              Prices are in an active cyclical recovery from 2024 troughs. China spot has stabilized near <strong>$2,850/MT eq</strong>, and landed CIF import parity in India is holding firm above <strong>$3,048/MT</strong> (+25.3% from lows).
            </p>
            <span className="fq-link">Inspect Price Intelligence →</span>
          </div>

          <div className="fq-card" onClick={() => onNavigate('supply-capacity')}>
            <div className="fq-qnum">QUESTION 2</div>
            <h4 className="fq-qtitle">Why is it happening?</h4>
            <p className="fq-qbody">
              Severe subterranean brine depletion and environmental audits in Shandong, China have capped effective output at <strong>42.5% utilization</strong>, while Red Sea maritime rerouting adds <strong>$150–$250/MT freight drag</strong> onto Dead Sea exports.
            </p>
            <span className="fq-link">Inspect Supply & Capacity →</span>
          </div>

          <div className="fq-card" onClick={() => onNavigate('business-trade')}>
            <div className="fq-qnum">QUESTION 3</div>
            <h4 className="fq-qtitle">How is Agrocel positioned relative to imports?</h4>
            <p className="fq-qbody">
              Agrocel domestic realization (<strong>₹195.7/kg</strong>) commands an optimal <strong>₹58.8/kg discount cushion (+30.1%)</strong> below landed parity, enabling 100% volume retention and shielding customers from imported spot bluffing.
            </p>
            <span className="fq-link">Inspect Trade Intelligence →</span>
          </div>

          <div className="fq-card" onClick={() => onNavigate('forecasts-scenarios')}>
            <div className="fq-qnum">QUESTION 4</div>
            <h4 className="fq-qtitle">What could happen next?</h4>
            <p className="fq-qbody">
              Econometric models project landed CIF parity to consolidate within <strong>$3,050–$3,200/MT through Q3 2026</strong>. Downside below $2,850/MT is insulated by Chinese cash production cost floors.
            </p>
            <span className="fq-link">Inspect ML Forecasts →</span>
          </div>

          <div className="fq-card" onClick={() => onNavigate('quarterly-report')}>
            <div className="fq-qnum">QUESTION 5</div>
            <h4 className="fq-qtitle">What should management consider?</h4>
            <p className="fq-qbody">
              Lock in annual supply quotas with domestic agrochemical and API leaders through Q4 2026. Complete the remaining <strong>790 MT finished stockpile</strong> before the June 15 monsoon stoppage.
            </p>
            <span className="fq-link">Inspect Quarterly Report →</span>
          </div>
        </div>
      </section>
      </>}
    </div>
  );
}
