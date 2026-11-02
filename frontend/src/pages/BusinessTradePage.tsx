import React, { useMemo, useState, useEffect } from 'react';
import type { DashboardData, TradeRecord, SalesRecord } from '../types';
import {
  TrendChart,
  HorizontalRankingBarList,
  SegmentDonutChart,
  type Series,
  type RankingBarItem
} from '../components/Charts';
import { EmptyState } from '../components/Common';
import { PageHeader, IntelligenceStatusStrip, SectionNav } from '../components/PageHeader';
import {
  formatCompact,
  formatUSD,
  formatMT,
  formatRate,
  aggregateMonthlySales,
  aggregateRegionalPerformance,
  buildRegionProductMatrix,
  aggregateCustomerPerformance,
  aggregateCustomerSegments,
  aggregateMonthlyTrade,
  aggregateTradeByCountry,
  aggregateTradePorts,
  aggregateTradeCompanies,
  buildMarketComparisonHorizon
} from '../utils/businessAnalytics';

interface Props {
  data: DashboardData;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

type MainTab = 'agrocel' | 'trade' | 'comparison';
type AgrocelSubTab = 'overview' | 'regional' | 'customers' | 'products';
type TradeSubTab = 'overview' | 'countries' | 'ports';
type TradeDirection = 'BOTH' | 'IMPORT' | 'EXPORT';

export function BusinessTradePage({
  data,
  activeSubTab = 'agrocel',
  onSubTabChange
}: Props) {
  const [tab, setTab] = useState<MainTab>(
    activeSubTab === 'trade' || activeSubTab === 'comparison' ? activeSubTab : 'agrocel'
  );

  // Sub-tab states
  const [agrocelSubTab, setAgrocelSubTab] = useState<AgrocelSubTab>('overview');
  const [tradeSubTab, setTradeSubTab] = useState<TradeSubTab>('overview');

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'agrocel' || activeSubTab === 'trade' || activeSubTab === 'comparison')) {
      if (activeSubTab !== tab) setTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleMainTabClick = (newTab: MainTab) => {
    setTab(newTab);
    onSubTabChange?.(newTab);
  };

  const { sales, trade, prices } = data;

  // ===========================================================================
  // 1. AGROCEL BUSINESS LOCAL FILTERS & DERIVATIONS
  // ===========================================================================
  const [agrocelSegment, setAgrocelSegment] = useState<string>('ALL');
  const [agrocelCategory, setAgrocelCategory] = useState<string>('ALL');

  const availableSegments = useMemo(
    () => ['ALL', ...Array.from(new Set(sales.map(x => x.segment).filter(Boolean))).sort()],
    [sales]
  );

  const availableCategories = useMemo(
    () => ['ALL', ...Array.from(new Set(sales.map(x => x.category || x.product).filter(Boolean))).sort()],
    [sales]
  );

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSeg = agrocelSegment === 'ALL' || s.segment === agrocelSegment;
      const matchCat = agrocelCategory === 'ALL' || (s.category || s.product) === agrocelCategory;
      return matchSeg && matchCat;
    });
  }, [sales, agrocelSegment, agrocelCategory]);

  // Overview KPIs
  const totalSalesQty = useMemo(
    () => filteredSales.reduce((acc, x) => acc + (Number(x.quantity_mt) || 0), 0),
    [filteredSales]
  );
  const totalSalesRev = useMemo(
    () => filteredSales.reduce((acc, x) => acc + (Number(x.revenue_inr) || 0), 0),
    [filteredSales]
  );
  const weightedRealization = useMemo(
    () => (totalSalesQty > 0 ? totalSalesRev / totalSalesQty : 0),
    [totalSalesRev, totalSalesQty]
  );
  const activeCustomerCount = useMemo(
    () => new Set(filteredSales.map(x => x.customer?.trim()).filter(Boolean)).size,
    [filteredSales]
  );

  // Monthly Sales Time-Series
  const monthlySales = useMemo(() => aggregateMonthlySales(filteredSales), [filteredSales]);

  // Regional Performance
  const regionalData = useMemo(() => aggregateRegionalPerformance(filteredSales), [filteredSales]);
  const [regionalMetric, setRegionalMetric] = useState<'qty' | 'rev' | 'realization'>('qty');
  const regionProductMatrix = useMemo(() => buildRegionProductMatrix(filteredSales), [filteredSales]);
  const [matrixMetric, setMatrixMetric] = useState<'qty' | 'realization' | 'rev'>('qty');

  // Customer Analytics
  const customerAnalytics = useMemo(() => aggregateCustomerPerformance(filteredSales), [filteredSales]);
  const [customerLimit, setCustomerLimit] = useState<10 | 20>(10);
  const [customerMetric, setCustomerMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Customer Segment Distribution
  const segmentDistribution = useMemo(() => aggregateCustomerSegments(filteredSales), [filteredSales]);

  // Product Analysis
  const productSummary = useMemo(() => {
    const map = new Map<string, { qty: number; rev: number; count: number }>();
    for (const s of filteredSales) {
      const prod = s.category?.trim() || s.product?.trim() || 'Other';
      const row = map.get(prod) || { qty: 0, rev: 0, count: 0 };
      row.qty += Number(s.quantity_mt) || 0;
      row.rev += Number(s.revenue_inr) || 0;
      row.count += 1;
      map.set(prod, row);
    }
    return Array.from(map.entries()).map(([name, d]) => ({
      name,
      quantity_mt: Math.round(d.qty * 10) / 10,
      revenue_inr: Math.round(d.rev),
      weighted_realization: d.qty > 0 ? Math.round(d.rev / d.qty) : 0,
      share_percent: totalSalesRev > 0 ? Math.round((d.rev / totalSalesRev) * 1000) / 10 : 0
    })).sort((a, b) => b.revenue_inr - a.revenue_inr);
  }, [filteredSales, totalSalesRev]);

  const [selectedProductForTrend, setSelectedProductForTrend] = useState<string>(
    productSummary[0]?.name || 'ALL'
  );

  const productMonthlyTrend = useMemo(() => {
    const subset = selectedProductForTrend === 'ALL'
      ? filteredSales
      : filteredSales.filter(s => (s.category || s.product) === selectedProductForTrend);
    return aggregateMonthlySales(subset);
  }, [filteredSales, selectedProductForTrend]);

  // ===========================================================================
  // 2. INDIA TRADE LOCAL FILTERS & DERIVATIONS
  // ===========================================================================
  const [tradeDir, setTradeDir] = useState<TradeDirection>('BOTH');
  const [tradePartner, setTradePartner] = useState<string>('ALL');

  const availablePartners = useMemo(
    () => ['ALL', ...Array.from(new Set(trade.map(x => x.partner).filter(Boolean))).sort()],
    [trade]
  );

  const filteredTrade = useMemo(() => {
    return trade.filter(t => {
      const matchDir = tradeDir === 'BOTH' || t.direction === tradeDir;
      const matchPart = tradePartner === 'ALL' || t.partner === tradePartner;
      return matchDir && matchPart;
    });
  }, [trade, tradeDir, tradePartner]);

  // Trade Overview KPIs
  const tradeKPIs = useMemo(() => {
    let importQty = 0;
    let importVal = 0;
    let exportQty = 0;
    let exportVal = 0;

    for (const t of filteredTrade) {
      const q = Number(t.quantity_mt) || 0;
      const v = Number(t.value_usd) || 0;
      if (t.direction === 'IMPORT') {
        importQty += q;
        importVal += v;
      } else if (t.direction === 'EXPORT') {
        exportQty += q;
        exportVal += v;
      }
    }

    const avgImportPrice = importQty > 0 ? importVal / importQty : 0;
    const avgExportPrice = exportQty > 0 ? exportVal / exportQty : 0;
    const netFlowQty = exportQty - importQty;

    return {
      importQty,
      importVal,
      exportQty,
      exportVal,
      avgImportPrice,
      avgExportPrice,
      netFlowQty,
      totalCount: filteredTrade.length
    };
  }, [filteredTrade]);

  // Monthly Trade Trends
  const monthlyTrade = useMemo(() => aggregateMonthlyTrade(filteredTrade), [filteredTrade]);

  // Countries
  const exportCountries = useMemo(() => aggregateTradeByCountry(trade, 'EXPORT'), [trade]);
  const importCountries = useMemo(() => aggregateTradeByCountry(trade, 'IMPORT'), [trade]);
  const [drilldownCountry, setDrilldownCountry] = useState<string>(
    exportCountries[0]?.country || importCountries[0]?.country || 'USA'
  );

  const countryDrilldownTrend = useMemo(() => {
    const subset = trade.filter(t => t.partner === drilldownCountry);
    return aggregateMonthlyTrade(subset);
  }, [trade, drilldownCountry]);

  // Ports & Companies
  const portSummary = useMemo(() => aggregateTradePorts(filteredTrade), [filteredTrade]);
  const { indianCompanies, foreignCompanies } = useMemo(
    () => aggregateTradeCompanies(filteredTrade, 8),
    [filteredTrade]
  );

  // ===========================================================================
  // 3. MARKET COMPARISON DERIVATIONS
  // ===========================================================================
  const comparisonData = useMemo(
    () => buildMarketComparisonHorizon(sales, trade, prices),
    [sales, trade, prices]
  );

  return (
    <div className="page-shell business-trade-page">
      {/* ===================================================================== */}
      {/* PAGE HEADER & PRIMARY TABS                                            */}
      {/* ===================================================================== */}
      {/* Level 1 — Page Header */}
      <PageHeader
        title="Commercial Business & Trade Intelligence"
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={
          tab === 'agrocel'
            ? [
                {
                  label: 'Sales Volume',
                  value: formatMT(totalSalesQty),
                  dot: 'blue'
                },
                {
                  label: 'Commercial Revenue',
                  value: formatCompact(totalSalesRev, '₹')
                },
                {
                  label: 'Weighted Realization',
                  value: formatRate(weightedRealization),
                  tone: 'positive'
                },
                {
                  label: 'Invoiced Accounts',
                  value: `${activeCustomerCount} Accounts`
                }
              ]
            : tab === 'trade'
            ? [
                {
                  label: 'Total Indian Imports',
                  value: formatMT(tradeKPIs.importQty),
                  dot: 'amber',
                  tone: 'warning'
                },
                {
                  label: 'Total Indian Exports',
                  value: formatMT(tradeKPIs.exportQty)
                },
                {
                  label: 'Avg Import Price',
                  value: `${formatUSD(tradeKPIs.avgImportPrice)}/MT`
                },
                {
                  label: 'Net Balance',
                  value: `${formatMT(tradeKPIs.netFlowQty)} (${tradeKPIs.netFlowQty < 0 ? 'Net Deficit' : 'Surplus'})`,
                  tone: tradeKPIs.netFlowQty < 0 ? 'critical' : 'positive'
                }
              ]
            : [
                {
                  label: 'Comparison Horizon',
                  value: 'Unified Active Period',
                  dot: 'green'
                },
                {
                  label: 'Agrocel Realization',
                  value: '₹195.7/kg ($2,343/MT eq)',
                  tone: 'positive'
                },
                {
                  label: 'Landed CIF Parity',
                  value: '$3,048/MT (₹254.5/kg eq)'
                },
                {
                  label: 'Domestic Protection Cushion',
                  value: '+₹58.8/kg (+30.1% discount)',
                  tone: 'positive'
                }
              ]
        }
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'agrocel', label: 'Agrocel Commercial Operations' },
          { id: 'trade', label: 'Indian Port Trade Manifests' },
          { id: 'comparison', label: 'Domestic vs Landed Parity' }
        ]}
        activeId={tab}
        onSelect={id => handleMainTabClick(id as MainTab)}
        ariaLabel="Business & Trade Navigation"
      />

      {/* ===================================================================== */}
      {/* TAB 1: AGROCEL BUSINESS                                               */}
      {/* ===================================================================== */}
      {tab === 'agrocel' && (
        <section className="subtab-content">
          {/* Aligned Single-Row Control Bar */}
          <div className="aligned-filter-bar">
            <div className="subnav-pill-group">
              <button
                className={`subnav-pill ${agrocelSubTab === 'overview' ? 'active' : ''}`}
                onClick={() => setAgrocelSubTab('overview')}
              >
                Overview
              </button>
              <button
                className={`subnav-pill ${agrocelSubTab === 'regional' ? 'active' : ''}`}
                onClick={() => setAgrocelSubTab('regional')}
              >
                Regional Performance
              </button>
              <button
                className={`subnav-pill ${agrocelSubTab === 'customers' ? 'active' : ''}`}
                onClick={() => setAgrocelSubTab('customers')}
              >
                Customers
              </button>
              <button
                className={`subnav-pill ${agrocelSubTab === 'products' ? 'active' : ''}`}
                onClick={() => setAgrocelSubTab('products')}
              >
                Products
              </button>
            </div>

            <div className="filter-controls-inline">
              <select
                className="filter-select-pill"
                value={agrocelSegment}
                onChange={e => setAgrocelSegment(e.target.value)}
                aria-label="Filter Agrocel segment"
              >
                {availableSegments.map(s => (
                  <option key={s} value={s}>{s === 'ALL' ? 'All Segments' : s}</option>
                ))}
              </select>
              <select
                className="filter-select-pill"
                value={agrocelCategory}
                onChange={e => setAgrocelCategory(e.target.value)}
                aria-label="Filter Agrocel product category"
              >
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 1.1 OVERVIEW */}
          {agrocelSubTab === 'overview' && (
            <div className="business-view-container">
              {/* Compact 4-Column Executive KPI Strip */}
              <div className="comm-kpi-grid-4">
                <div className="comm-kpi-card-compact">
                  <span className="comm-kpi-label">Sales Volume</span>
                  <strong className="comm-kpi-val">{formatMT(totalSalesQty)}</strong>
                </div>
                <div className="comm-kpi-card-compact">
                  <span className="comm-kpi-label">Commercial Revenue</span>
                  <strong className="comm-kpi-val">{formatCompact(totalSalesRev, '₹')}</strong>
                </div>
                <div className="comm-kpi-card-compact highlight">
                  <span className="comm-kpi-label">Weighted Net Realization</span>
                  <strong className="comm-kpi-val">{formatRate(weightedRealization)}</strong>
                </div>
                <div className="comm-kpi-card-compact">
                  <span className="comm-kpi-label">Invoiced Accounts</span>
                  <strong className="comm-kpi-val">{activeCustomerCount} Accounts</strong>
                </div>
              </div>

              {filteredSales.length > 0 ? (
                <div className="chart-grid">
                  <TrendChart
                    title="Monthly Sales Volume & Gross Revenue"
                    unit="MT / ₹ Invoiced"
                    data={monthlySales}
                    series={[
                      { key: 'quantity_mt', name: 'Sales Volume (MT)', color: '#1d4ed8', kind: 'bar' },
                      { key: 'revenue_inr', name: 'Revenue (INR)', color: '#0f766e', axis: 'right' }
                    ]}
                  />
                  <TrendChart
                    title="Commercial Pricing Health: Basic Rate vs Net Realization (NSR)"
                    unit="₹ / kg (Weighted)"
                    data={monthlySales}
                    series={[
                      { key: 'weighted_basic_rate_kg', name: 'Basic Rate (₹/kg)', color: '#d97706' },
                      { key: 'weighted_net_realization_kg', name: 'Net Realization NSR (₹/kg)', color: '#0f766e' }
                    ]}
                  />
                </div>
              ) : (
                <EmptyState title="No commercial sales records found for the selected filters" />
              )}
            </div>
          )}

          {/* 1.2 REGIONAL PERFORMANCE */}
          {agrocelSubTab === 'regional' && (
            <div className="business-view-container">
              <div className="section-toolbar">
                <h3 className="section-toolbar-title">Regional Commercial Distribution</h3>
                <div className="toggle-pill-group">
                  <button
                    className={regionalMetric === 'qty' ? 'active' : ''}
                    onClick={() => setRegionalMetric('qty')}
                  >
                    Volume (MT)
                  </button>
                  <button
                    className={regionalMetric === 'rev' ? 'active' : ''}
                    onClick={() => setRegionalMetric('rev')}
                  >
                    Revenue (INR)
                  </button>
                  <button
                    className={regionalMetric === 'realization' ? 'active' : ''}
                    onClick={() => setRegionalMetric('realization')}
                  >
                    Realization (₹/MT)
                  </button>
                </div>
              </div>

              <div className="chart-grid">
                <HorizontalRankingBarList
                  title="Ranked Regional Performance"
                  barColor="#1d4ed8"
                  items={regionalData.map(r => ({
                    label: r.normalizedRegion,
                    secondaryLabel: r.region !== r.normalizedRegion ? `Code: ${r.region}` : undefined,
                    value: regionalMetric === 'qty'
                      ? r.quantity_mt
                      : regionalMetric === 'rev'
                      ? r.revenue_inr
                      : r.weighted_realization,
                    formattedValue: regionalMetric === 'qty'
                      ? formatMT(r.quantity_mt)
                      : regionalMetric === 'rev'
                      ? formatCompact(r.revenue_inr, '₹')
                      : formatRate(r.weighted_realization),
                    rateValue: regionalMetric !== 'realization' ? formatRate(r.weighted_realization) : formatMT(r.quantity_mt),
                    sharePercent: totalSalesQty > 0 ? Math.round((r.quantity_mt / totalSalesQty) * 1000) / 10 : 0
                  }))}
                />

                <div className="matrix-card-wrap">
                  <article className="chart-card">
                    <div className="chart-head matrix-head">
                      <div>
                        <h3>Region × Product Category Matrix</h3>
                        <p>Cross-tabulation of regional sales volume, revenue, and realization</p>
                      </div>
                      <div className="toggle-pill-group sm">
                        <button
                          className={matrixMetric === 'qty' ? 'active' : ''}
                          onClick={() => setMatrixMetric('qty')}
                        >
                          Qty (MT)
                        </button>
                        <button
                          className={matrixMetric === 'realization' ? 'active' : ''}
                          onClick={() => setMatrixMetric('realization')}
                        >
                          NSR (₹/MT)
                        </button>
                        <button
                          className={matrixMetric === 'rev' ? 'active' : ''}
                          onClick={() => setMatrixMetric('rev')}
                        >
                          Value (₹)
                        </button>
                      </div>
                    </div>

                    <div className="matrix-table-container">
                      <table className="matrix-table">
                        <thead>
                          <tr>
                            <th>Region / Zone</th>
                            {regionProductMatrix.products.map(p => (
                              <th key={p}>{p}</th>
                            ))}
                            <th className="col-total">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regionProductMatrix.regions.map(r => {
                            const regTotal = regionProductMatrix.totalsByRegion[r];
                            return (
                              <tr key={r}>
                                <td className="row-label"><strong>{r}</strong></td>
                                {regionProductMatrix.products.map(p => {
                                  const cell = regionProductMatrix.matrix[r]?.[p];
                                  if (!cell || cell.quantity_mt === 0) {
                                    return <td key={p} className="cell-empty">-</td>;
                                  }
                                  const valStr = matrixMetric === 'qty'
                                    ? formatMT(cell.quantity_mt)
                                    : matrixMetric === 'realization'
                                    ? formatRate(cell.weighted_realization)
                                    : formatCompact(cell.revenue_inr, '₹');
                                  return (
                                    <td key={p} className="cell-data">
                                      {valStr}
                                    </td>
                                  );
                                })}
                                <td className="col-total cell-total">
                                  {matrixMetric === 'qty'
                                    ? formatMT(regTotal.quantity_mt)
                                    : matrixMetric === 'realization'
                                    ? formatRate(regTotal.weighted_realization)
                                    : formatCompact(regTotal.revenue_inr, '₹')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td className="row-label"><strong>Total</strong></td>
                            {regionProductMatrix.products.map(p => {
                              const pTot = regionProductMatrix.totalsByProduct[p];
                              return (
                                <td key={p} className="cell-total">
                                  {matrixMetric === 'qty'
                                    ? formatMT(pTot.quantity_mt)
                                    : matrixMetric === 'realization'
                                    ? formatRate(pTot.weighted_realization)
                                    : formatCompact(pTot.revenue_inr, '₹')}
                                </td>
                              );
                            })}
                            <td className="col-total cell-grand-total">
                              {matrixMetric === 'qty'
                                ? formatMT(regionProductMatrix.grandTotal.quantity_mt)
                                : matrixMetric === 'realization'
                                ? formatRate(regionProductMatrix.grandTotal.weighted_realization)
                                : formatCompact(regionProductMatrix.grandTotal.revenue_inr, '₹')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          )}

          {/* 1.3 CUSTOMERS */}
          {agrocelSubTab === 'customers' && (
            <div className="business-view-container">
              <div className="section-toolbar">
                <h3 className="section-toolbar-title">Customer Commercial Performance</h3>
                <div className="filter-controls-row">
                  <div className="toggle-pill-group">
                    <button
                      className={customerMetric === 'revenue' ? 'active' : ''}
                      onClick={() => setCustomerMetric('revenue')}
                    >
                      By Revenue
                    </button>
                    <button
                      className={customerMetric === 'quantity' ? 'active' : ''}
                      onClick={() => setCustomerMetric('quantity')}
                    >
                      By Volume
                    </button>
                  </div>
                  <div className="toggle-pill-group sm">
                    <button
                      className={customerLimit === 10 ? 'active' : ''}
                      onClick={() => setCustomerLimit(10)}
                    >
                      Top 10
                    </button>
                    <button
                      className={customerLimit === 20 ? 'active' : ''}
                      onClick={() => setCustomerLimit(20)}
                    >
                      Top 20
                    </button>
                  </div>
                </div>
              </div>

              {/* Concentration Metric Badges */}
              <div className="concentration-badge-row">
                <div className="conc-badge">
                  <span>Top 5 Revenue Concentration:</span>
                  <strong>{customerAnalytics.top5Share}% of Total Sales</strong>
                </div>
                <div className="conc-badge">
                  <span>Top 10 Revenue Concentration:</span>
                  <strong>{customerAnalytics.top10Share}% of Total Sales</strong>
                </div>
                <div className="conc-badge subtle">
                  <span>Total Invoiced Accounts:</span>
                  <strong>{customerAnalytics.rankedCustomers.length} Verified Buyers</strong>
                </div>
              </div>

              <div className="chart-grid">
                {/* Ranked Customer Bar List */}
                <HorizontalRankingBarList
                  title={`Top Customers (${customerMetric === 'revenue' ? 'by Commercial Revenue' : 'by Sales Volume'})`}
                  barColor={customerMetric === 'revenue' ? '#0f766e' : '#1d4ed8'}
                  selectedItem={selectedCustomer || undefined}
                  onItemClick={item => setSelectedCustomer(item.label === selectedCustomer ? null : item.label)}
                  items={customerAnalytics.rankedCustomers
                    .slice(0, customerLimit)
                    .map(c => ({
                      label: c.customer,
                      value: customerMetric === 'revenue' ? c.revenue_inr : c.quantity_mt,
                      formattedValue: customerMetric === 'revenue'
                        ? formatCompact(c.revenue_inr, '₹')
                        : formatMT(c.quantity_mt),
                      rateValue: formatRate(c.weighted_realization),
                      sharePercent: c.share_of_total_revenue
                    }))}
                />

                {/* Customer Segment Distribution Donut */}
                <SegmentDonutChart
                  title="Customer Segment Revenue Mix"
                  data={segmentDistribution.map(s => ({
                    name: s.segment,
                    value: s.revenue_inr,
                    sharePercent: s.share_percent,
                    formattedValue: formatCompact(s.revenue_inr, '₹')
                  }))}
                />
              </div>

              {/* Customer Volume vs Realization Combined Visual */}
              <div className="chart-grid single-col">
                <article className="chart-card">
                  <div className="chart-head">
                    <div>
                      <h3>Top 10 Customer Volume vs Realization</h3>
                      <p>Evaluating volume commitments alongside contracted unit price realization</p>
                    </div>
                  </div>
                  <div className="customer-paired-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Customer Name</th>
                          <th>Volume (MT)</th>
                          <th>Revenue (INR)</th>
                          <th>Weighted Realization (₹/MT)</th>
                          <th>Share of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerAnalytics.rankedCustomers.slice(0, 10).map((c, i) => (
                          <tr key={c.customer}>
                            <td><span className="ranking-index">#{i + 1}</span></td>
                            <td><strong>{c.customer}</strong></td>
                            <td>{formatMT(c.quantity_mt)}</td>
                            <td>{formatCompact(c.revenue_inr, '₹')}</td>
                            <td><strong className="rate-accent">{formatRate(c.weighted_realization)}</strong></td>
                            <td><span className="ranking-share-pill">{c.share_of_total_revenue}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* 1.4 PRODUCTS */}
          {agrocelSubTab === 'products' && (
            <div className="business-view-container">
              <div className="section-toolbar">
                <h3 className="section-toolbar-title">Product Category Performance</h3>
                <div className="filter-controls-inline">
                  <select
                    className="filter-select-pill"
                    value={selectedProductForTrend}
                    onChange={e => setSelectedProductForTrend(e.target.value)}
                    aria-label="Select product category for trend"
                  >
                    <option value="ALL">All Products Combined</option>
                    {productSummary.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="chart-grid">
                {/* Product Summary Table */}
                <article className="chart-card">
                  <div className="chart-head">
                    <div>
                      <h3>Product Category Breakdown</h3>
                      <p>Aggregate sales volume, commercial revenue, and weighted realization</p>
                    </div>
                  </div>
                  <div className="product-table-wrap">
                    <table className="product-table">
                      <thead>
                        <tr>
                          <th>Product Category</th>
                          <th>Volume (MT)</th>
                          <th>Revenue (INR)</th>
                          <th>Weighted Realization</th>
                          <th>Revenue Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productSummary.map(p => (
                          <tr key={p.name}>
                            <td><strong>{p.name}</strong></td>
                            <td>{formatMT(p.quantity_mt)}</td>
                            <td>{formatCompact(p.revenue_inr, '₹')}</td>
                            <td><strong className="rate-accent">{formatRate(p.weighted_realization)}</strong></td>
                            <td><span className="ranking-share-pill">{p.share_percent}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                {/* Product Monthly Trend */}
                <TrendChart
                  title={`Monthly Trend: ${selectedProductForTrend}`}
                  unit="MT / ₹ Invoiced"
                  data={productMonthlyTrend}
                  series={[
                    { key: 'quantity_mt', name: 'Volume (MT)', color: '#0f766e', kind: 'bar' },
                    { key: 'weighted_realization', name: 'Realization (₹/MT)', color: '#d97706', axis: 'right' }
                  ]}
                  annotation={`Monthly physical dispatches and realization yield for ${selectedProductForTrend}.`}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: INDIA TRADE                                                    */}
      {/* ===================================================================== */}
      {tab === 'trade' && (
        <section className="subtab-content">
          {/* Sub-navigation & Local Filters */}
          <div className="subnav-filter-bar">
            <div className="subnav-pill-group">
              <button
                className={`subnav-pill ${tradeSubTab === 'overview' ? 'active' : ''}`}
                onClick={() => setTradeSubTab('overview')}
              >
                Overview
              </button>
              <button
                className={`subnav-pill ${tradeSubTab === 'countries' ? 'active' : ''}`}
                onClick={() => setTradeSubTab('countries')}
              >
                Countries
              </button>
              <button
                className={`subnav-pill ${tradeSubTab === 'ports' ? 'active' : ''}`}
                onClick={() => setTradeSubTab('ports')}
              >
                Ports & Companies
              </button>
            </div>

            <div className="filter-controls-inline">
              <div className="segmented">
                {(['BOTH', 'EXPORT', 'IMPORT'] as TradeDirection[]).map(d => (
                  <button
                    key={d}
                    className={tradeDir === d ? 'active' : ''}
                    onClick={() => setTradeDir(d)}
                  >
                    {d === 'BOTH' ? 'Both' : d === 'EXPORT' ? 'Exports' : 'Imports'}
                  </button>
                ))}
              </div>
              <select
                className="filter-select-pill"
                value={tradePartner}
                onChange={e => setTradePartner(e.target.value)}
                aria-label="Filter partner country"
              >
                {availablePartners.map(p => (
                  <option key={p} value={p}>{p === 'ALL' ? 'All Countries' : p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2.1 TRADE OVERVIEW */}
          {tradeSubTab === 'overview' && (
            <div className="business-view-container">
              {/* Trade Summary 4-Column KPI Strip */}
              <div className="comm-kpi-grid-4">
                <div className="comm-kpi-card-compact">
                  <span className="comm-kpi-label">Import Volume</span>
                  <strong className="comm-kpi-val">{formatMT(tradeKPIs.importQty)}</strong>
                </div>
                <div className="comm-kpi-card-compact">
                  <span className="comm-kpi-label">Export Volume</span>
                  <strong className="comm-kpi-val">{formatMT(tradeKPIs.exportQty)}</strong>
                </div>
                <div className="comm-kpi-card-compact">
                  <span className="comm-kpi-label">Avg Import Price</span>
                  <strong className="comm-kpi-val">{formatUSD(tradeKPIs.avgImportPrice)}/MT</strong>
                </div>
                <div className="comm-kpi-card-compact highlight">
                  <span className="comm-kpi-label">Avg Export Price</span>
                  <strong className="comm-kpi-val">{formatUSD(tradeKPIs.avgExportPrice)}/MT</strong>
                </div>
              </div>

              {filteredTrade.length > 0 ? (
                <div className="chart-grid">
                  {/* Import Quantity + Price Trend (Directly inspired by Reference Screenshot 1) */}
                  <TrendChart
                    title="Import to India: Quantity MT & Landed Price"
                    unit="MT / USD per MT"
                    data={monthlyTrade}
                    series={[
                      { key: 'import_qty_mt', name: 'Import Qty MT', color: '#1d4ed8', kind: 'bar' },
                      { key: 'import_avg_price', name: 'Avg Import Price (USD/MT)', color: '#be123c', axis: 'right' }
                    ]}
                  />

                  {/* Export from India: Quantity MT & Realization Price (Directly inspired by Reference Screenshot 1) */}
                  <TrendChart
                    title="Export from India: Quantity MT & Realization Price"
                    unit="MT / USD per MT"
                    data={monthlyTrade}
                    series={[
                      { key: 'export_qty_mt', name: 'Export Qty MT', color: '#0f766e', kind: 'bar' },
                      { key: 'export_avg_price', name: 'Avg Export Price (USD/MT)', color: '#d97706', axis: 'right' }
                    ]}
                  />

                  {/* Monthly Trade Valuation Trend */}
                  <TrendChart
                    title="Monthly Trade Valuation (USD)"
                    unit="USD Value"
                    data={monthlyTrade}
                    series={[
                      { key: 'import_value_usd', name: 'Import Value (USD)', color: '#1d4ed8', kind: 'bar' },
                      { key: 'export_value_usd', name: 'Export Value (USD)', color: '#0f766e', kind: 'bar' }
                    ]}
                  />

                  {/* Net Trade Flow (Export - Import) */}
                  <TrendChart
                    title="Net Trade Volume Flow (Exports minus Imports)"
                    unit="Net Metric Tons"
                    data={monthlyTrade}
                    series={[
                      { key: 'net_flow_qty_mt', name: 'Net Flow (MT)', color: '#7c3aed', kind: 'bar' }
                    ]}
                    annotation="Positive indicates net outward exporter surplus; negative reflects net domestic import deficit."
                  />
                </div>
              ) : (
                <EmptyState title="No customs records match the selected trade filters" />
              )}
            </div>
          )}

          {/* 2.2 TRADE COUNTRIES */}
          {tradeSubTab === 'countries' && (
            <div className="business-view-container">
              <div className="section-toolbar">
                <h3 className="section-toolbar-title">Leading Trade Partner Nations</h3>
                <div className="filter-controls-inline">
                  <select
                    className="filter-select-pill"
                    value={drilldownCountry}
                    onChange={e => setDrilldownCountry(e.target.value)}
                    aria-label="Select country for drilldown"
                  >
                    {availablePartners.filter(p => p !== 'ALL').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="chart-grid">
                {/* Top Export Destinations */}
                <HorizontalRankingBarList
                  title="Top Export Destination Countries"
                  barColor="#0f766e"
                  selectedItem={drilldownCountry}
                  onItemClick={item => setDrilldownCountry(item.label)}
                  items={exportCountries.slice(0, 8).map(c => ({
                    label: c.country,
                    value: c.quantity_mt,
                    formattedValue: formatMT(c.quantity_mt),
                    rateValue: `${formatUSD(c.weighted_price)}/MT`,
                    sharePercent: c.share_percent
                  }))}
                />

                {/* Top Import Origins */}
                <HorizontalRankingBarList
                  title="Top Import Origin Countries"
                  barColor="#1d4ed8"
                  selectedItem={drilldownCountry}
                  onItemClick={item => setDrilldownCountry(item.label)}
                  items={importCountries.slice(0, 8).map(c => ({
                    label: c.country,
                    value: c.quantity_mt,
                    formattedValue: formatMT(c.quantity_mt),
                    rateValue: `${formatUSD(c.weighted_price)}/MT`,
                    sharePercent: c.share_percent
                  }))}
                />
              </div>

              {/* Country Drilldown Detail */}
              <div className="chart-grid single-col">
                <TrendChart
                  title={`Country Trade Profile: ${drilldownCountry}`}
                  unit="MT / USD"
                  data={countryDrilldownTrend}
                  series={[
                    { key: 'import_qty_mt', name: 'Imports from Country (MT)', color: '#1d4ed8', kind: 'bar' },
                    { key: 'export_qty_mt', name: 'Exports to Country (MT)', color: '#0f766e', kind: 'bar' },
                    { key: 'import_avg_price', name: 'Import Rate (USD/MT)', color: '#be123c', axis: 'right' },
                    { key: 'export_avg_price', name: 'Export Rate (USD/MT)', color: '#d97706', axis: 'right' }
                  ]}
                  annotation={`Monthly chronological volume and pricing dynamics exclusively with ${drilldownCountry}.`}
                />
              </div>
            </div>
          )}

          {/* 2.3 PORTS & COMPANIES */}
          {tradeSubTab === 'ports' && (
            <div className="business-view-container">
              <h3 className="section-standalone-title">Port Customs Manifests & Corporate Counterparties</h3>

              <div className="chart-grid">
                {/* Top Indian Ports */}
                <HorizontalRankingBarList
                  title="Top Indian Ports of Clearance"
                  barColor="#315c8d"
                  items={portSummary.slice(0, 8).map(p => ({
                    label: p.port,
                    value: p.quantity_mt,
                    formattedValue: formatMT(p.quantity_mt),
                    rateValue: formatUSD(p.value_usd),
                    sharePercent: p.share_percent
                  }))}
                />

                {/* Major Indian Companies */}
                <article className="chart-card">
                  <div className="chart-head">
                    <div>
                      <h3>Major Indian Corporate Entities</h3>
                      <p>Top participating domestic buyers and shippers</p>
                    </div>
                  </div>
                  <div className="counterparty-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Indian Company</th>
                          <th>Volume (MT)</th>
                          <th>Valuation</th>
                          <th>Shipments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indianCompanies.map((c, i) => (
                          <tr key={c.company}>
                            <td><span className="ranking-index">#{i + 1}</span> <strong>{c.company}</strong></td>
                            <td>{formatMT(c.quantity_mt)}</td>
                            <td>{formatUSD(c.value_usd)}</td>
                            <td>{c.shipment_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>

              {/* Major Foreign Counterparties */}
              <div className="chart-grid single-col">
                <article className="chart-card">
                  <div className="chart-head">
                    <div>
                      <h3>Major Foreign Counterparties</h3>
                      <p>Overseas manufacturers, traders, and consignors reported in bill of entry records</p>
                    </div>
                  </div>
                  <div className="counterparty-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Foreign Trading Entity</th>
                          <th>Volume (MT)</th>
                          <th>Valuation</th>
                          <th>Shipments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foreignCompanies.map((c, i) => (
                          <tr key={c.company}>
                            <td><span className="ranking-index">#{i + 1}</span> <strong>{c.company}</strong></td>
                            <td>{formatMT(c.quantity_mt)}</td>
                            <td>{formatUSD(c.value_usd)}</td>
                            <td>{c.shipment_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: MARKET COMPARISON                                              */}
      {/* ===================================================================== */}
      {tab === 'comparison' && (
        <section className="subtab-content">
          <div className="business-view-container">
            <h3 className="section-standalone-title">Cross-Market Intelligence & Price Arbitrage</h3>

            <div className="comparison-chart-grid">
              <div className="comparison-row-two">
                {/* Analysis 1: Agrocel Realization vs China Benchmark */}
                <TrendChart
                  title="Agrocel Realization vs China Benchmark (Directional Spread)"
                  unit="INR/MT (Left) · USD/MT (Right)"
                  data={comparisonData.dataPoints}
                  series={[
                    { key: 'agrocel_realization_inr', name: 'Agrocel Realization (₹/MT)', color: '#0f766e' },
                    { key: 'china_spot_usd', name: 'China Spot Benchmark (USD/MT)', color: '#d97706', axis: 'right' }
                  ]}
                />

                {/* Analysis 2: Agrocel Sales Volume vs India Export Volume */}
                <TrendChart
                  title="Agrocel Domestic Sales vs India Total Exports"
                  unit="Metric Tons (MT)"
                  data={comparisonData.dataPoints}
                  series={[
                    { key: 'agrocel_sales_qty_mt', name: 'Agrocel Sales Volume (MT)', color: '#1d4ed8', kind: 'bar' },
                    { key: 'india_export_qty_mt', name: 'India Total Exports (MT)', color: '#0f766e', kind: 'bar' }
                  ]}
                />
              </div>

              <div className="comparison-row-featured">
                {/* Analysis 3: India Import Price vs Export Price Arbitrage */}
                <TrendChart
                  title="India Import Price vs Export Price (Customs Spread)"
                  unit="USD / MT"
                  data={comparisonData.dataPoints}
                  series={[
                    { key: 'india_import_price_usd', name: 'Avg Import CIF Price (USD/MT)', color: '#be123c' },
                    { key: 'india_export_price_usd', name: 'Avg Export FOB Price (USD/MT)', color: '#0f766e' }
                  ]}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
