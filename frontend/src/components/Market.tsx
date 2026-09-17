import React from 'react';
import type { IntelligenceItem, PriceRecord } from '../types';
import { EmptyState, ReliabilityBadge, SectionHeader } from './Common';
import { TrendChart } from './Charts';
import { IndiaPriceForecastSection } from './PriceForecast';

export function MarketSection({ prices, items }: { prices: PriceRecord[]; items: IntelligenceItem[] }) {
  // Ensure consistent currency (standard USD/MT benchmark) so trend chart axis remains clean and comparable
  const usdPrices = prices.filter(p => !p.currency || p.currency === 'USD');
  const dataset = usdPrices.length > 0 ? usdPrices : prices;
  const ordered = [...dataset].sort((a, b) => a.date.localeCompare(b.date));
  const first = ordered[0]?.value, last = ordered[ordered.length - 1]?.value;
  const delta = first ? ((last - first) / first * 100) : 0;
  const pulse = items.filter(x => ['PRICE', 'SUPPLY', 'DEMAND', 'REGULATION', 'MARKET_EVENT', 'COMPETITOR_MOVE', 'COMPETITOR_UPDATE'].includes(x.type)).slice(0, 5);

  return (
    <section id="market">
      <SectionHeader eyebrow="Market pulse" title="The signals shaping today’s market" />
      
      {/* 1. China Bromine Price Trend Area Chart & Executive Pulse Signals */}
      <div className="market-grid">
        {ordered.length ? (
          <TrendChart
            title="China Bromine price trend"
            unit={`${ordered[ordered.length - 1]?.currency || 'USD'} / ${ordered[ordered.length - 1]?.unit || 'MT'}`}
            data={ordered}
            series={[{ key: 'value', name: 'China Bromine price', color: '#0f766e', kind: 'area' }]}
            annotation={`${delta >= 0 ? 'Rose' : 'Fell'} ${Math.abs(delta).toFixed(1)}% across the selected observations.`}
          />
        ) : (
          <EmptyState />
        )}
        
        <aside className="pulse">
          <div className="pulse-head">
            <span>Executive briefing</span>
            <strong>{pulse.length} signals</strong>
          </div>
          {pulse.length ? (
            pulse.map((x, i) => (
              <article key={x.id}>
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
            <EmptyState title="No market signals" />
          )}
        </aside>
      </div>

      {/* 2. PLACED DIRECTLY UNDER: Proprietary India Price Forecast Model (Historical & Predicted) */}
      <IndiaPriceForecastSection />
    </section>
  );
}

