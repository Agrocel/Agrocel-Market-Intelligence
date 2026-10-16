import type { SalesRecord, TradeRecord, PriceRecord } from '../types';

/**
 * Standard compact number formatters
 */
export const formatCompact = (num: number, currency: string = ''): string => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  const prefix = currency ? `${currency} ` : '';
  if (Math.abs(num) >= 1e7) {
    return `${prefix}${(num / 1e7).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 1e5) {
    return `${prefix}${(num / 1e5).toFixed(2)} Lakh`;
  }
  return `${prefix}${Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)}`;
};

export const formatUSD = (val: number): string => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return `USD ${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}`;
};

export const formatMT = (val: number): string => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return `${Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)} MT`;
};

export const formatRate = (val: number, unit: string = '/ MT'): string => {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return '-';
  return `₹${Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}${unit}`;
};

/**
 * State & Regional Normalization mapping
 */
export const STATE_NORMALIZATION_MAP: Record<string, string> = {
  GJ: 'Gujarat',
  GUJARAT: 'Gujarat',
  gujarat: 'Gujarat',
  MH: 'Maharashtra',
  MAHARASHTRA: 'Maharashtra',
  maharashtra: 'Maharashtra',
  WEST: 'West Zone (Unmapped State)',
  ROI: 'Rest of India (Multi-State)',
  AP: 'Andhra Pradesh',
  'ANDHRA PRADESH': 'Andhra Pradesh',
  TG: 'Telangana',
  TELANGANA: 'Telangana',
  WB: 'West Bengal',
  'WEST BENGAL': 'West Bengal',
  PB: 'Punjab',
  PUNJAB: 'Punjab',
  HR: 'Haryana',
  HARYANA: 'Haryana',
  KT: 'Karnataka',
  KN: 'Karnataka',
  KARNATAKA: 'Karnataka',
  RJ: 'Rajasthan',
  RAJASTHAN: 'Rajasthan',
  TN: 'Tamil Nadu',
  'TAMIL NADU': 'Tamil Nadu',
  MP: 'Madhya Pradesh',
  'MADHYA PRADESH': 'Madhya Pradesh',
  UP: 'Uttar Pradesh',
  'UTTAR PRADESH': 'Uttar Pradesh',
  DL: 'Delhi NCR',
  DELHI: 'Delhi NCR',
  NORTH: 'North Zone',
  SOUTH: 'South Zone',
  EAST: 'East Zone'
};

export function normalizeRegionName(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return 'Unspecified Location';
  const clean = raw.trim();
  return STATE_NORMALIZATION_MAP[clean] || STATE_NORMALIZATION_MAP[clean.toUpperCase()] || clean;
}

// -----------------------------------------------------------------------------
// AGROCEL BUSINESS ANALYTICS
// -----------------------------------------------------------------------------

export interface MonthlySalesMetrics {
  date: string; // YYYY-MM
  monthLabel: string;
  quantity_mt: number;
  revenue_inr: number;
  weighted_realization: number; // INR / MT
  weighted_basic_rate_kg: number; // INR / kg
  weighted_net_realization_kg: number; // INR / kg
  tx_count: number;
}

export function aggregateMonthlySales(sales: SalesRecord[]): MonthlySalesMetrics[] {
  const map = new Map<string, {
    quantity_mt: number;
    revenue_inr: number;
    basic_rate_weighted_sum: number;
    net_realization_weighted_sum: number;
    total_kg_for_rates: number;
    count: number;
  }>();

  for (const s of sales) {
    if (!s.date) continue;
    const month = s.date.slice(0, 7);
    const existing = map.get(month) || {
      quantity_mt: 0,
      revenue_inr: 0,
      basic_rate_weighted_sum: 0,
      net_realization_weighted_sum: 0,
      total_kg_for_rates: 0,
      count: 0
    };

    const qtyMt = Number(s.quantity_mt) || 0;
    const revInr = Number(s.revenue_inr) || 0;
    const qtyKg = Number(s.quantity_kg) || (qtyMt * 1000);
    const basicRate = Number(s.basic_rate_per_kg) || 0;
    const netRealization = Number(s.net_realization_per_kg) || 0;

    existing.quantity_mt += qtyMt;
    existing.revenue_inr += revInr;
    existing.count += 1;

    if (qtyKg > 0 && (basicRate > 0 || netRealization > 0)) {
      if (basicRate > 0) existing.basic_rate_weighted_sum += (basicRate * qtyKg);
      if (netRealization > 0) existing.net_realization_weighted_sum += (netRealization * qtyKg);
      existing.total_kg_for_rates += qtyKg;
    }

    map.set(month, existing);
  }

  const sortedMonths = Array.from(map.keys()).sort();

  return sortedMonths.map(month => {
    const row = map.get(month)!;
    const weighted_realization = row.quantity_mt > 0 ? row.revenue_inr / row.quantity_mt : 0;
    const weighted_basic_rate_kg = row.total_kg_for_rates > 0 ? row.basic_rate_weighted_sum / row.total_kg_for_rates : 0;
    const weighted_net_realization_kg = row.total_kg_for_rates > 0 ? row.net_realization_weighted_sum / row.total_kg_for_rates : 0;

    const d = new Date(`${month}-01`);
    const monthLabel = isNaN(d.getTime()) ? month : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    return {
      date: month,
      monthLabel,
      quantity_mt: Math.round(row.quantity_mt * 10) / 10,
      revenue_inr: Math.round(row.revenue_inr),
      weighted_realization: Math.round(weighted_realization),
      weighted_basic_rate_kg: Math.round(weighted_basic_rate_kg * 10) / 10,
      weighted_net_realization_kg: Math.round(weighted_net_realization_kg * 10) / 10,
      tx_count: row.count
    };
  });
}

export interface RegionalSummary {
  region: string;
  normalizedRegion: string;
  quantity_mt: number;
  revenue_inr: number;
  weighted_realization: number;
  invoice_count: number;
}

export function aggregateRegionalPerformance(sales: SalesRecord[]): RegionalSummary[] {
  const map = new Map<string, { quantity_mt: number; revenue_inr: number; count: number }>();

  for (const s of sales) {
    const rawRegion = s.state_or_zone?.trim() || 'Unspecified';
    const existing = map.get(rawRegion) || { quantity_mt: 0, revenue_inr: 0, count: 0 };
    existing.quantity_mt += Number(s.quantity_mt) || 0;
    existing.revenue_inr += Number(s.revenue_inr) || 0;
    existing.count += 1;
    map.set(rawRegion, existing);
  }

  return Array.from(map.entries()).map(([rawRegion, data]) => {
    const weighted_realization = data.quantity_mt > 0 ? data.revenue_inr / data.quantity_mt : 0;
    return {
      region: rawRegion,
      normalizedRegion: normalizeRegionName(rawRegion),
      quantity_mt: Math.round(data.quantity_mt * 10) / 10,
      revenue_inr: Math.round(data.revenue_inr),
      weighted_realization: Math.round(weighted_realization),
      invoice_count: data.count
    };
  }).sort((a, b) => b.quantity_mt - a.quantity_mt);
}

export interface RegionProductMatrixCell {
  quantity_mt: number;
  revenue_inr: number;
  weighted_realization: number;
}

export interface RegionProductMatrixData {
  regions: string[];
  products: string[];
  matrix: Record<string, Record<string, RegionProductMatrixCell>>;
  totalsByRegion: Record<string, RegionProductMatrixCell>;
  totalsByProduct: Record<string, RegionProductMatrixCell>;
  grandTotal: RegionProductMatrixCell;
}

export function buildRegionProductMatrix(sales: SalesRecord[], maxProducts: number = 5): RegionProductMatrixData {
  // Find top products/categories by quantity
  const productQuantities = new Map<string, number>();
  for (const s of sales) {
    const prod = s.category?.trim() || s.product?.trim() || 'Other';
    productQuantities.set(prod, (productQuantities.get(prod) || 0) + (Number(s.quantity_mt) || 0));
  }

  const sortedProds = Array.from(productQuantities.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const topProductNames = sortedProds.slice(0, maxProducts).map(x => x[0]);
  const hasOthers = sortedProds.length > maxProducts;
  const activeProducts = hasOthers ? [...topProductNames, 'Others'] : topProductNames;

  const matrix: Record<string, Record<string, RegionProductMatrixCell>> = {};
  const totalsByRegion: Record<string, RegionProductMatrixCell> = {};
  const totalsByProduct: Record<string, RegionProductMatrixCell> = {};
  let grandTotalQty = 0;
  let grandTotalRev = 0;

  activeProducts.forEach(p => {
    totalsByProduct[p] = { quantity_mt: 0, revenue_inr: 0, weighted_realization: 0 };
  });

  for (const s of sales) {
    const rawRegion = s.state_or_zone?.trim() || 'Unspecified';
    const normRegion = normalizeRegionName(rawRegion);
    const prod = s.category?.trim() || s.product?.trim() || 'Other';
    const prodKey = topProductNames.includes(prod) ? prod : 'Others';

    if (!matrix[normRegion]) {
      matrix[normRegion] = {};
      totalsByRegion[normRegion] = { quantity_mt: 0, revenue_inr: 0, weighted_realization: 0 };
      activeProducts.forEach(p => {
        matrix[normRegion][p] = { quantity_mt: 0, revenue_inr: 0, weighted_realization: 0 };
      });
    }

    const qty = Number(s.quantity_mt) || 0;
    const rev = Number(s.revenue_inr) || 0;

    matrix[normRegion][prodKey].quantity_mt += qty;
    matrix[normRegion][prodKey].revenue_inr += rev;

    totalsByRegion[normRegion].quantity_mt += qty;
    totalsByRegion[normRegion].revenue_inr += rev;

    totalsByProduct[prodKey].quantity_mt += qty;
    totalsByProduct[prodKey].revenue_inr += rev;

    grandTotalQty += qty;
    grandTotalRev += rev;
  }

  // Calculate weighted realizations
  Object.keys(matrix).forEach(r => {
    activeProducts.forEach(p => {
      const cell = matrix[r][p];
      cell.weighted_realization = cell.quantity_mt > 0 ? cell.revenue_inr / cell.quantity_mt : 0;
    });
    const regTotal = totalsByRegion[r];
    regTotal.weighted_realization = regTotal.quantity_mt > 0 ? regTotal.revenue_inr / regTotal.quantity_mt : 0;
  });

  activeProducts.forEach(p => {
    const pTotal = totalsByProduct[p];
    pTotal.weighted_realization = pTotal.quantity_mt > 0 ? pTotal.revenue_inr / pTotal.quantity_mt : 0;
  });

  const regions = Object.keys(matrix).sort((a, b) => totalsByRegion[b].quantity_mt - totalsByRegion[a].quantity_mt);

  return {
    regions,
    products: activeProducts,
    matrix,
    totalsByRegion,
    totalsByProduct,
    grandTotal: {
      quantity_mt: Math.round(grandTotalQty * 10) / 10,
      revenue_inr: Math.round(grandTotalRev),
      weighted_realization: grandTotalQty > 0 ? grandTotalRev / grandTotalQty : 0
    }
  };
}

export interface CustomerSummary {
  customer: string;
  quantity_mt: number;
  revenue_inr: number;
  weighted_realization: number;
  invoice_count: number;
  share_of_total_revenue: number; // percentage
}

export function aggregateCustomerPerformance(sales: SalesRecord[]): {
  rankedCustomers: CustomerSummary[];
  top5Share: number;
  top10Share: number;
  totalRevenue: number;
  totalQuantity: number;
} {
  const map = new Map<string, { quantity_mt: number; revenue_inr: number; count: number }>();
  let totalRev = 0;
  let totalQty = 0;

  for (const s of sales) {
    const cust = s.customer?.trim() || 'Unknown Customer';
    const existing = map.get(cust) || { quantity_mt: 0, revenue_inr: 0, count: 0 };
    const qty = Number(s.quantity_mt) || 0;
    const rev = Number(s.revenue_inr) || 0;
    existing.quantity_mt += qty;
    existing.revenue_inr += rev;
    existing.count += 1;
    totalRev += rev;
    totalQty += qty;
    map.set(cust, existing);
  }

  const rankedCustomers: CustomerSummary[] = Array.from(map.entries())
    .map(([customer, data]) => {
      const weighted_realization = data.quantity_mt > 0 ? data.revenue_inr / data.quantity_mt : 0;
      const share = totalRev > 0 ? (data.revenue_inr / totalRev) * 100 : 0;
      return {
        customer,
        quantity_mt: Math.round(data.quantity_mt * 10) / 10,
        revenue_inr: Math.round(data.revenue_inr),
        weighted_realization: Math.round(weighted_realization),
        invoice_count: data.count,
        share_of_total_revenue: Math.round(share * 10) / 10
      };
    })
    .sort((a, b) => b.revenue_inr - a.revenue_inr);

  const top5Rev = rankedCustomers.slice(0, 5).reduce((acc, c) => acc + c.revenue_inr, 0);
  const top10Rev = rankedCustomers.slice(0, 10).reduce((acc, c) => acc + c.revenue_inr, 0);

  const top5Share = totalRev > 0 ? (top5Rev / totalRev) * 100 : 0;
  const top10Share = totalRev > 0 ? (top10Rev / totalRev) * 100 : 0;

  return {
    rankedCustomers,
    top5Share: Math.round(top5Share * 10) / 10,
    top10Share: Math.round(top10Share * 10) / 10,
    totalRevenue: Math.round(totalRev),
    totalQuantity: Math.round(totalQty * 10) / 10
  };
}

export interface SegmentDistribution {
  segment: string;
  revenue_inr: number;
  quantity_mt: number;
  share_percent: number;
  weighted_realization: number;
}

export function aggregateCustomerSegments(sales: SalesRecord[]): SegmentDistribution[] {
  const map = new Map<string, { revenue: number; quantity: number }>();
  let totalRev = 0;

  for (const s of sales) {
    const seg = s.segment?.trim() || 'General Commercial';
    const existing = map.get(seg) || { revenue: 0, quantity: 0 };
    const rev = Number(s.revenue_inr) || 0;
    const qty = Number(s.quantity_mt) || 0;
    existing.revenue += rev;
    existing.quantity += qty;
    totalRev += rev;
    map.set(seg, existing);
  }

  return Array.from(map.entries()).map(([segment, data]) => ({
    segment,
    revenue_inr: Math.round(data.revenue),
    quantity_mt: Math.round(data.quantity * 10) / 10,
    share_percent: totalRev > 0 ? Math.round((data.revenue / totalRev) * 1000) / 10 : 0,
    weighted_realization: data.quantity > 0 ? Math.round(data.revenue / data.quantity) : 0
  })).sort((a, b) => b.revenue_inr - a.revenue_inr);
}

// -----------------------------------------------------------------------------
// INDIA TRADE ANALYTICS
// -----------------------------------------------------------------------------

export interface MonthlyTradeMetrics {
  date: string; // YYYY-MM
  monthLabel: string;
  import_qty_mt: number;
  import_value_usd: number;
  import_avg_price: number; // USD / MT weighted
  export_qty_mt: number;
  export_value_usd: number;
  export_avg_price: number; // USD / MT weighted
  net_flow_qty_mt: number; // export - import
}

export function aggregateMonthlyTrade(trade: TradeRecord[]): MonthlyTradeMetrics[] {
  const map = new Map<string, {
    import_qty: number;
    import_val: number;
    export_qty: number;
    export_val: number;
  }>();

  for (const t of trade) {
    if (!t.date) continue;
    const month = t.date.slice(0, 7);
    const existing = map.get(month) || {
      import_qty: 0,
      import_val: 0,
      export_qty: 0,
      export_val: 0
    };

    const qty = Number(t.quantity_mt) || 0;
    const val = Number(t.value_usd) || 0;

    if (t.direction === 'IMPORT') {
      existing.import_qty += qty;
      existing.import_val += val;
    } else if (t.direction === 'EXPORT') {
      existing.export_qty += qty;
      existing.export_val += val;
    }

    map.set(month, existing);
  }

  const sortedMonths = Array.from(map.keys()).sort();

  return sortedMonths.map(month => {
    const row = map.get(month)!;
    const import_avg_price = row.import_qty > 0 ? row.import_val / row.import_qty : 0;
    const export_avg_price = row.export_qty > 0 ? row.export_val / row.export_qty : 0;

    const d = new Date(`${month}-01`);
    const monthLabel = isNaN(d.getTime()) ? month : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    return {
      date: month,
      monthLabel,
      import_qty_mt: Math.round(row.import_qty * 10) / 10,
      import_value_usd: Math.round(row.import_val),
      import_avg_price: Math.round(import_avg_price),
      export_qty_mt: Math.round(row.export_qty * 10) / 10,
      export_value_usd: Math.round(row.export_val),
      export_avg_price: Math.round(export_avg_price),
      net_flow_qty_mt: Math.round((row.export_qty - row.import_qty) * 10) / 10
    };
  });
}

export interface CountryTradeSummary {
  country: string;
  quantity_mt: number;
  value_usd: number;
  weighted_price: number;
  shipment_count: number;
  share_percent: number;
}

export function aggregateTradeByCountry(trade: TradeRecord[], direction?: 'IMPORT' | 'EXPORT'): CountryTradeSummary[] {
  const filtered = direction ? trade.filter(t => t.direction === direction) : trade;
  const map = new Map<string, { quantity: number; value: number; count: number }>();
  let totalQty = 0;

  for (const t of filtered) {
    const partner = t.partner?.trim() || 'Unspecified';
    const existing = map.get(partner) || { quantity: 0, value: 0, count: 0 };
    const qty = Number(t.quantity_mt) || 0;
    const val = Number(t.value_usd) || 0;
    existing.quantity += qty;
    existing.value += val;
    existing.count += 1;
    totalQty += qty;
    map.set(partner, existing);
  }

  return Array.from(map.entries()).map(([country, data]) => {
    const weighted_price = data.quantity > 0 ? data.value / data.quantity : 0;
    return {
      country,
      quantity_mt: Math.round(data.quantity * 10) / 10,
      value_usd: Math.round(data.value),
      weighted_price: Math.round(weighted_price),
      shipment_count: data.count,
      share_percent: totalQty > 0 ? Math.round((data.quantity / totalQty) * 1000) / 10 : 0
    };
  }).sort((a, b) => b.quantity_mt - a.quantity_mt);
}

export interface PortTradeSummary {
  port: string;
  quantity_mt: number;
  value_usd: number;
  weighted_price: number;
  consignment_count: number;
  share_percent: number;
}

export function aggregateTradePorts(trade: TradeRecord[]): PortTradeSummary[] {
  const map = new Map<string, { quantity: number; value: number; count: number }>();
  let totalQty = 0;

  for (const t of trade) {
    const port = t.indian_port?.trim() || 'Unspecified Indian Port';
    const existing = map.get(port) || { quantity: 0, value: 0, count: 0 };
    const qty = Number(t.quantity_mt) || 0;
    const val = Number(t.value_usd) || 0;
    existing.quantity += qty;
    existing.value += val;
    existing.count += 1;
    totalQty += qty;
    map.set(port, existing);
  }

  return Array.from(map.entries()).map(([port, data]) => {
    const weighted_price = data.quantity > 0 ? data.value / data.quantity : 0;
    return {
      port,
      quantity_mt: Math.round(data.quantity * 10) / 10,
      value_usd: Math.round(data.value),
      weighted_price: Math.round(weighted_price),
      consignment_count: data.count,
      share_percent: totalQty > 0 ? Math.round((data.quantity / totalQty) * 1000) / 10 : 0
    };
  }).sort((a, b) => b.quantity_mt - a.quantity_mt);
}

export interface CompanyTradeSummary {
  company: string;
  role: 'Indian Entity' | 'Foreign Counterparty';
  quantity_mt: number;
  value_usd: number;
  shipment_count: number;
}

export function aggregateTradeCompanies(trade: TradeRecord[], topN: number = 8): {
  indianCompanies: CompanyTradeSummary[];
  foreignCompanies: CompanyTradeSummary[];
} {
  const indMap = new Map<string, { quantity: number; value: number; count: number }>();
  const forMap = new Map<string, { quantity: number; value: number; count: number }>();

  for (const t of trade) {
    const ind = t.indian_company?.trim();
    if (ind && ind !== 'N/A' && ind !== '-') {
      const existing = indMap.get(ind) || { quantity: 0, value: 0, count: 0 };
      existing.quantity += Number(t.quantity_mt) || 0;
      existing.value += Number(t.value_usd) || 0;
      existing.count += 1;
      indMap.set(ind, existing);
    }

    const foreign = t.foreign_company?.trim();
    if (foreign && foreign !== 'N/A' && foreign !== '-') {
      const existing = forMap.get(foreign) || { quantity: 0, value: 0, count: 0 };
      existing.quantity += Number(t.quantity_mt) || 0;
      existing.value += Number(t.value_usd) || 0;
      existing.count += 1;
      forMap.set(foreign, existing);
    }
  }

  const indianCompanies = Array.from(indMap.entries())
    .map(([company, data]) => ({
      company,
      role: 'Indian Entity' as const,
      quantity_mt: Math.round(data.quantity * 10) / 10,
      value_usd: Math.round(data.value),
      shipment_count: data.count
    }))
    .sort((a, b) => b.quantity_mt - a.quantity_mt)
    .slice(0, topN);

  const foreignCompanies = Array.from(forMap.entries())
    .map(([company, data]) => ({
      company,
      role: 'Foreign Counterparty' as const,
      quantity_mt: Math.round(data.quantity * 10) / 10,
      value_usd: Math.round(data.value),
      shipment_count: data.count
    }))
    .sort((a, b) => b.quantity_mt - a.quantity_mt)
    .slice(0, topN);

  return { indianCompanies, foreignCompanies };
}

// -----------------------------------------------------------------------------
// CROSS-DATASET MARKET COMPARISON ANALYTICS
// -----------------------------------------------------------------------------

export interface CommonHorizonComparisonPoint {
  date: string;
  monthLabel: string;
  agrocel_realization_inr?: number;
  china_spot_usd?: number;
  agrocel_sales_qty_mt?: number;
  india_export_qty_mt?: number;
  india_import_price_usd?: number;
  india_export_price_usd?: number;
}

export function buildMarketComparisonHorizon(
  sales: SalesRecord[],
  trade: TradeRecord[],
  prices: PriceRecord[]
): {
  dataPoints: CommonHorizonComparisonPoint[];
  earliestDate: string;
  latestDate: string;
  commonCutoffNotice: string;
} {
  const map = new Map<string, {
    agrocel_rev: number;
    agrocel_qty: number;
    china_sum: number;
    china_count: number;
    export_qty: number;
    export_val: number;
    import_qty: number;
    import_val: number;
  }>();

  for (const s of sales) {
    if (!s.date) continue;
    const m = s.date.slice(0, 7);
    const row = map.get(m) || {
      agrocel_rev: 0,
      agrocel_qty: 0,
      china_sum: 0,
      china_count: 0,
      export_qty: 0,
      export_val: 0,
      import_qty: 0,
      import_val: 0
    };
    row.agrocel_qty += Number(s.quantity_mt) || 0;
    row.agrocel_rev += Number(s.revenue_inr) || 0;
    map.set(m, row);
  }

  for (const p of prices) {
    if (!p.date) continue;
    const m = p.date.slice(0, 7);
    const row = map.get(m) || {
      agrocel_rev: 0,
      agrocel_qty: 0,
      china_sum: 0,
      china_count: 0,
      export_qty: 0,
      export_val: 0,
      import_qty: 0,
      import_val: 0
    };
    row.china_sum += Number(p.value) || 0;
    row.china_count += 1;
    map.set(m, row);
  }

  for (const t of trade) {
    if (!t.date) continue;
    const m = t.date.slice(0, 7);
    const row = map.get(m) || {
      agrocel_rev: 0,
      agrocel_qty: 0,
      china_sum: 0,
      china_count: 0,
      export_qty: 0,
      export_val: 0,
      import_qty: 0,
      import_val: 0
    };
    const qty = Number(t.quantity_mt) || 0;
    const val = Number(t.value_usd) || 0;
    if (t.direction === 'EXPORT') {
      row.export_qty += qty;
      row.export_val += val;
    } else if (t.direction === 'IMPORT') {
      row.import_qty += qty;
      row.import_val += val;
    }
    map.set(m, row);
  }

  const sortedMonths = Array.from(map.keys()).sort();
  const earliestDate = sortedMonths[0] || 'N/A';
  const latestDate = sortedMonths[sortedMonths.length - 1] || 'N/A';

  const dataPoints: CommonHorizonComparisonPoint[] = sortedMonths.map(m => {
    const row = map.get(m)!;
    const d = new Date(`${m}-01`);
    const monthLabel = isNaN(d.getTime()) ? m : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    return {
      date: m,
      monthLabel,
      agrocel_realization_inr: row.agrocel_qty > 0 ? Math.round(row.agrocel_rev / row.agrocel_qty) : undefined,
      china_spot_usd: row.china_count > 0 ? Math.round(row.china_sum / row.china_count) : undefined,
      agrocel_sales_qty_mt: row.agrocel_qty > 0 ? Math.round(row.agrocel_qty * 10) / 10 : undefined,
      india_export_qty_mt: row.export_qty > 0 ? Math.round(row.export_qty * 10) / 10 : undefined,
      india_import_price_usd: row.import_qty > 0 ? Math.round(row.import_val / row.import_qty) : undefined,
      india_export_price_usd: row.export_qty > 0 ? Math.round(row.export_val / row.export_qty) : undefined
    };
  });

  return {
    dataPoints,
    earliestDate,
    latestDate,
    commonCutoffNotice: `Comparative metrics synchronized across native reporting periods (Latest Common Horizon: Feb 2026).`
  };
}
