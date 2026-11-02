import React, { useState, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export type Series = {
  key: string;
  name: string;
  color: string;
  kind?: 'line' | 'bar' | 'area';
  axis?: 'left' | 'right';
};

const compact = (v: number) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

const displayDate = (input: unknown) => {
  const value = String(input ?? '');
  const d = new Date(value.length === 7 ? `${value}-01` : value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

function parseYear(dateStr: unknown): string | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const d = new Date(s.length === 7 ? `${s}-01` : s);
  if (!Number.isNaN(d.getTime())) {
    return String(d.getFullYear());
  }
  const m = s.match(/^(\d{4})/);
  return m ? m[1] : null;
}

export function TrendChart({
  title,
  unit,
  data,
  series,
  annotation,
  height = 300
}: {
  title: string;
  unit: string;
  data: any[];
  series: Series[];
  annotation?: string;
  height?: number;
}) {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Aggregate data for the whole annual trend (e.g. 2022, 2023, 2024, 2025, 2026)
  const yearlyData = useMemo(() => {
    if (!data || !data.length) return [];

    const map = new Map<string, { counts: Record<string, number>; sums: Record<string, number> }>();

    data.forEach(item => {
      const year = parseYear(item.date);
      if (!year) return;

      if (!map.has(year)) {
        map.set(year, { counts: {}, sums: {} });
      }
      const entry = map.get(year)!;

      series.forEach(s => {
        const val = Number(item[s.key]);
        if (!Number.isNaN(val)) {
          entry.sums[s.key] = (entry.sums[s.key] || 0) + val;
          entry.counts[s.key] = (entry.counts[s.key] || 0) + 1;
        }
      });
    });

    const sortedYears = Array.from(map.keys()).sort();
    return sortedYears.map(year => {
      const entry = map.get(year)!;
      const row: Record<string, any> = { date: year };

      series.forEach(s => {
        const total = entry.sums[s.key] || 0;
        const lower = (s.key + ' ' + s.name).toLowerCase();
        // Rate, price, realization, NSR metrics are averaged across the year
        const isRate =
          lower.includes('price') ||
          lower.includes('rate') ||
          lower.includes('realization') ||
          lower.includes('benchmark') ||
          lower.includes('nsr') ||
          lower.includes('average');

        row[s.key] = isRate ? (entry.counts[s.key] > 0 ? total / entry.counts[s.key] : 0) : total;
      });
      return row;
    });
  }, [data, series]);

  const activeData = viewMode === 'year' ? yearlyData : data;
  const isArea = series.length === 1 && series[0].kind === 'area';
  const latest = activeData[activeData.length - 1]?.[series[0].key];

  const formatXAxis = (input: unknown) => {
    if (viewMode === 'year') return String(input ?? '');
    return displayDate(input);
  };

  const formatTooltipLabel = (input: unknown) => {
    if (viewMode === 'year') return `Year ${input}`;
    return displayDate(input);
  };

  if (!data?.length) {
    return (
      <article className="chart-card chart-card-empty">
        <div className="chart-head">
          <div>
            <h3>{title}</h3>
            {annotation && <p>{annotation}</p>}
          </div>
        </div>
        <div className="chart-empty-state">No verified observations are available for this view.</div>
      </article>
    );
  }

  return (
    <article className="chart-card">
      <div className="chart-head">
        <div>
          <h3>{title}</h3>
          {annotation && <p>{annotation}</p>}
        </div>
        <div className="chart-head-right">
          {/* Month / Year Horizon Toggle */}
          <div className="chart-horizon-toggle" role="group" aria-label="Time horizon">
            <button
              type="button"
              className={`chart-horizon-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`chart-horizon-btn ${viewMode === 'year' ? 'active' : ''}`}
              onClick={() => setViewMode('year')}
            >
              Year
            </button>
          </div>

          <div className="chart-summary">
            {latest !== undefined && (
              <>
                <b>{compact(Number(latest))}</b>
                <span>{unit}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="chart-wrap"
        role="img"
        aria-label={`${title}, ${viewMode === 'year' ? 'Yearly aggregated trend' : `${data.length} observations`}`}
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {isArea ? (
            <AreaChart data={activeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={series[0].color} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={series[0].color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e8ece9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: '#69767e' }}
                minTickGap={viewMode === 'year' ? 12 : 28}
              />
              <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: '#69767e' }} width={55} />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                formatter={(v: any, n: any) => [`${Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`, n]}
                contentStyle={{
                  border: '1px solid #dce5e1',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(20,45,40,.09)'
                }}
              />
              <Area
                type="monotone"
                dataKey={series[0].key}
                name={series[0].name}
                stroke={series[0].color}
                strokeWidth={2.6}
                fill="url(#areaTeal)"
                activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          ) : (
            <ComposedChart data={activeData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e8ece9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: '#69767e' }}
                minTickGap={viewMode === 'year' ? 12 : 28}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={compact}
                tick={{ fontSize: 11, fill: '#69767e' }}
                width={55}
              />
              {series.some(s => s.axis === 'right') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={compact}
                  tick={{ fontSize: 11, fill: '#69767e' }}
                  width={55}
                />
              )}
              <Tooltip
                labelFormatter={formatTooltipLabel}
                formatter={(v: any, n: any) => [`${Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`, n]}
                contentStyle={{
                  border: '1px solid #dce5e1',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(20,45,40,.09)'
                }}
              />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {series.map(s =>
                s.kind === 'bar' ? (
                  <Bar
                    key={s.key}
                    yAxisId={s.axis || 'left'}
                    dataKey={s.key}
                    name={s.name}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={viewMode === 'year' ? 50 : 32}
                  />
                ) : (
                  <Line
                    key={s.key}
                    yAxisId={s.axis || 'left'}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2.4}
                    dot={viewMode === 'year' ? { r: 4, strokeWidth: 1.5, fill: '#fff' } : false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                  />
                )
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function ForecastFanChart({
  title,
  data,
  unit = 'USD / MT'
}: {
  title: string;
  data: Array<{ period?: string; label?: string; predicted_cif_usd_mt: number; lower_bound_usd: number; upper_bound_usd: number }>;
  unit?: string;
}) {
  const chartData = data.map(point => ({
    date: point.label || point.period || '',
    forecast: point.predicted_cif_usd_mt,
    lower: point.lower_bound_usd,
    interval: Math.max(0, point.upper_bound_usd - point.lower_bound_usd),
    upper: point.upper_bound_usd
  }));

  if (!chartData.length) {
    return (
      <article className="chart-card chart-card-empty">
        <div className="chart-head"><div><h3>{title}</h3></div></div>
        <div className="chart-empty-state">No verified forecast points are available for this view.</div>
      </article>
    );
  }

  return (
    <article className="chart-card forecast-fan-chart">
      <div className="chart-head">
        <div>
          <h3>{title}</h3>
          <p>Central estimate with the model’s supplied prediction interval</p>
        </div>
        <span className="forecast-fan-legend"><i /> Prediction interval</span>
      </div>
      <div className="chart-wrap" role="img" aria-label={`${title}, predicted price and prediction interval`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e8ece9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#69767e' }} minTickGap={22} />
            <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: '#69767e' }} width={58} />
            <Tooltip
              formatter={(value: any, name: any) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit}`, String(name || '')]}
              contentStyle={{ border: '1px solid #dce5e1', borderRadius: 8, boxShadow: '0 8px 24px rgba(20,45,40,.09)' }}
            />
            <Area type="monotone" dataKey="lower" stackId="interval" stroke="transparent" fill="transparent" legendType="none" name="Lower bound" />
            <Area type="monotone" dataKey="interval" stackId="interval" stroke="transparent" fill="#99d6cc" fillOpacity={0.42} legendType="none" name="Prediction interval" />
            <Line type="monotone" dataKey="forecast" name="Central estimate" stroke="#0f766e" strokeWidth={2.8} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function Sparkline({ data, color = '#0f766e' }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${i * (100 / Math.max(1, data.length - 1))},${27 - ((v - min) * 22) / range}`)
    .join(' ');

  return (
    <svg className="spark" viewBox="0 0 100 30" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

/**
 * Modern Horizontal Ranking Bars for Customers, Regions, and Ports.
 * Solves label truncation and cramped vertical charts cleanly.
 */
export interface RankingBarItem {
  label: string;
  secondaryLabel?: string;
  value: number;
  formattedValue: string;
  metricLabel?: string;
  rateValue?: string;
  sharePercent?: number;
}

export function HorizontalRankingBarList({
  title,
  subtitle,
  items,
  barColor = '#0f766e',
  onItemClick,
  selectedItem
}: {
  title: string;
  subtitle?: string;
  items: RankingBarItem[];
  barColor?: string;
  onItemClick?: (item: RankingBarItem) => void;
  selectedItem?: string;
}) {
  const maxValue = Math.max(...items.map(x => x.value), 1);

  return (
    <article className="chart-card ranking-card">
      <div className="chart-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="ranking-list">
        {items.map((item, idx) => {
          const widthPct = Math.max(4, Math.round((item.value / maxValue) * 100));
          const isSelected = selectedItem === item.label;

          return (
            <div
              key={item.label}
              className={`ranking-row ${isSelected ? 'selected' : ''} ${onItemClick ? 'clickable' : ''}`}
              onClick={() => onItemClick?.(item)}
              role={onItemClick ? 'button' : undefined}
              tabIndex={onItemClick ? 0 : undefined}
            >
              <div className="ranking-row-meta">
                <div className="ranking-row-title-wrap">
                  <span className="ranking-index">#{idx + 1}</span>
                  <strong className="ranking-label" title={item.label}>
                    {item.label}
                  </strong>
                  {item.secondaryLabel && (
                    <span className="ranking-sec-label">{item.secondaryLabel}</span>
                  )}
                </div>
                <div className="ranking-row-vals">
                  <span className="ranking-main-val">{item.formattedValue}</span>
                  {item.rateValue && <span className="ranking-rate-val">{item.rateValue}</span>}
                  {item.sharePercent !== undefined && (
                    <span className="ranking-share-pill">{item.sharePercent}%</span>
                  )}
                </div>
              </div>
              <div className="ranking-track">
                <div
                  className="ranking-bar-fill"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: barColor
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

/**
 * Segment Distribution Donut Chart
 */
export interface DonutSlice {
  name: string;
  value: number;
  sharePercent: number;
  formattedValue?: string;
  color: string;
}

const PALETTE = ['#0f766e', '#1d4ed8', '#7c3aed', '#d97706', '#be123c', '#059669', '#475569'];

export function SegmentDonutChart({
  title,
  subtitle,
  data
}: {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number; sharePercent: number; formattedValue?: string }>;
}) {
  const slices: DonutSlice[] = data.map((d, i) => ({
    ...d,
    color: PALETTE[i % PALETTE.length]
  }));

  return (
    <article className="chart-card donut-card">
      <div className="chart-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="donut-chart-layout">
        <div className="donut-chart-wrap" style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {slices.map(slice => (
                  <Cell key={slice.name} fill={slice.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${item.payload.formattedValue || Number(val).toLocaleString()} (${item.payload.sharePercent}%)`,
                  name
                ]}
                contentStyle={{
                  border: '1px solid #dce5e1',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(20,45,40,.09)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="donut-legend-wrap">
          {slices.map(slice => (
            <div key={slice.name} className="donut-legend-row">
              <span className="donut-legend-dot" style={{ backgroundColor: slice.color }} />
              <div className="donut-legend-info">
                <strong className="donut-legend-name">{slice.name}</strong>
                <span className="donut-legend-pct">{slice.sharePercent}%</span>
              </div>
              {slice.formattedValue && (
                <span className="donut-legend-val">{slice.formattedValue}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
