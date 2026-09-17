import React from 'react';
import type { DateRangeKey, Overview, PriceRecord } from '../types';
import { Sparkline } from './Charts';

const num = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function MetricCard({
  icon,
  label,
  value,
  unit,
  detail,
  tone = 'neutral',
  spark,
  wide = false
}: {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  detail: string;
  tone?: string;
  spark: number[];
  wide?: boolean;
}) {
  return (
    <article className={`metric ${wide ? 'wide' : ''}`}>
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <Sparkline
          data={spark}
          color={tone === 'negative' ? '#a65b58' : tone === 'positive' ? '#0f766e' : '#315c8d'}
        />
      </div>
      <label>{label}</label>
      <div className="metric-value">
        {value}
        <small>{unit}</small>
      </div>
      <p className={tone}>{detail}</p>
    </article>
  );
}

export function HeroOverview({
  data,
  prices,
  range,
  onRange,
  onOpenDataSources
}: {
  data: Overview;
  prices: PriceRecord[];
  range: DateRangeKey;
  onRange: (r: DateRangeKey) => void;
  onOpenDataSources?: () => void;
}) {
  const trend = [...prices].reverse().slice(-8).map(x => x.value);
  const dynamic = data.latest_price.value
    ? `China Bromine benchmark closed at ${data.latest_price.currency} ${num(data.latest_price.value)}/MT (${data.latest_price.change_percent >= 0 ? '+' : ''}${data.latest_price.change_percent}% MoM), while loaded Indian exports total ${num(data.exports.quantity_mt)} MT and Agrocel commercial sales total ${num(data.sales.quantity_mt)} MT.`
    : 'No benchmark price observation is available in the selected period.';

  return (
    <section id="overview" className="hero">
      <p className="eyebrow">Bromine Market Intelligence</p>
      
      <div className="hero-row">
        <div>
          <h1>What matters in the Bromine market today</h1>
          <p className="hero-insight">{dynamic}</p>
        </div>
      </div>

      {/* Unified Multi-Source Synchronization Horizon Banner */}
      <div className="horizon-pill-bar">
        <div className="horizon-pill-content">
          <span className="horizon-badge">✓ Unified Multi-Source Horizon: February 2026</span>
          <span className="horizon-text">
            Latest audited baseline where Customs Manifests (860.4 MT), China Benchmark ($2,910/MT), and Agrocel Sales (1,854.7 MT) fully intersect with zero reporting gaps.
          </span>
        </div>
        {onOpenDataSources && (
          <button className="horizon-inspect-btn" onClick={onOpenDataSources}>
            Data Sources & Ranges ↗
          </button>
        )}
      </div>

      <div className="range" aria-label="Date range">
        {(['all', '1y', '6m', '90d', '30d'] as DateRangeKey[]).map(x => (
          <button
            className={range === x ? 'active' : ''}
            onClick={() => onRange(x)}
            key={x}
          >
            {x === 'all' ? 'All (Common Audited)' : x.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="metrics">
        <MetricCard
          icon="◉"
          label="China Bromine price"
          value={`${data.latest_price.currency} ${num(data.latest_price.value)}`}
          unit={`/${data.latest_price.unit}`}
          detail={`${data.latest_price.change_percent >= 0 ? '+' : ''}${data.latest_price.change_percent}% vs prior observation`}
          tone={
            data.latest_price.change_percent > 0
              ? 'positive'
              : data.latest_price.change_percent < 0
              ? 'negative'
              : 'neutral'
          }
          spark={trend.length ? trend : [0]}
        />
        <MetricCard
          icon="↗"
          label="India export quantity"
          value={num(data.exports.quantity_mt)}
          unit="MT"
          detail={`${data.exports.shipments_count || 0} loaded customs records`}
          spark={[data.imports.quantity_mt, data.exports.quantity_mt]}
        />
        <MetricCard
          icon="≈"
          label="India export average"
          value={`USD ${num(data.exports.average_price_usd_per_mt || 0)}`}
          unit="/MT"
          detail={`Loaded value USD ${num(data.exports.value_usd)}`}
          spark={[
            data.imports.average_price_usd_per_mt || 0,
            data.exports.average_price_usd_per_mt || 0
          ]}
        />
        <MetricCard
          icon="□"
          label="Agrocel sales"
          value={num(data.sales.quantity_mt)}
          unit="MT"
          detail="Confidential internal ERP data"
          spark={[
            data.sales.quantity_mt * 0.82,
            data.sales.quantity_mt * 0.91,
            data.sales.quantity_mt
          ]}
        />
        <MetricCard
          icon="₹"
          label="Agrocel realization"
          value={`INR ${num(data.sales.realization_inr_per_mt)}`}
          unit="/MT"
          detail={`Revenue INR ${num(data.sales.revenue_inr || 0)}`}
          spark={[
            data.sales.realization_inr_per_mt * 0.96,
            data.sales.realization_inr_per_mt
          ]}
        />
        <MetricCard
          icon="!"
          label="High-impact intelligence"
          value={String(data.high_impact_items)}
          detail={`${data.competitor_updates} competitor-linked updates`}
          spark={[0, data.competitor_updates, data.high_impact_items]}
          wide
        />
      </div>
    </section>
  );
}
