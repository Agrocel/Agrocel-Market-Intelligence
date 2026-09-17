import React, { useMemo } from 'react';
import type { Competitor, IntelligenceItem, StockRecord } from '../types';
import { EmptyState, ReliabilityBadge, SectionHeader } from './Common';
import { TrendChart } from './Charts';

export function IntelligenceFeed({
  items: _items,
  competitors,
  stocks
}: {
  items?: IntelligenceItem[];
  competitors: Competitor[];
  stocks: StockRecord[];
}) {
  // Aggregate multi-line stock time-series
  const stockData = useMemo(() => {
    const map: Record<string, any> = {};
    stocks.forEach(x => {
      map[x.date] = map[x.date] || { date: x.date };
      map[x.date][x.ticker] = x.close_price;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stocks]);

  // Compute latest metrics and % changes per competitor
  const competitorMetrics = useMemo(() => {
    const result: Record<string, { latestPrice?: number; currency?: string; changePct: number; recordsCount: number }> = {};
    competitors.forEach(comp => {
      if (!comp.ticker) return;
      const compStocks = stocks
        .filter(s => s.ticker.toUpperCase() === comp.ticker?.toUpperCase())
        .sort((a, b) => a.date.localeCompare(b.date));
      if (compStocks.length > 0) {
        const first = compStocks[0];
        const last = compStocks[compStocks.length - 1];
        const changePct = first.close_price > 0
          ? ((last.close_price - first.close_price) / first.close_price) * 100
          : 0;
        result[comp.ticker] = {
          latestPrice: last.close_price,
          currency: last.currency || 'USD',
          changePct,
          recordsCount: compStocks.length
        };
      }
    });
    return result;
  }, [competitors, stocks]);

  const tickers = Array.from(new Set(stocks.map(x => x.ticker))).slice(0, 5);
  const colorMap: Record<string, string> = {
    ACI: '#0f766e',  // Archean Chemical (India domestic peer)
    ICL: '#285686',  // ICL Group (Global leader)
    GURE: '#b45309', // Gulf Resources (China peer)
  };

  return (
    <section id="intelligence" className="competitor-tracker-section">
      <SectionHeader
        eyebrow="Financial & Peer Intelligence"
        title="Listed Competitor Stock & Peer Benchmarks"
      />

      <div className="peer-tracker-intro">
        <p>
          Equity valuation trends and financial indicators for primary global and domestic bromine producers. 
          Tracking peer performance offers early signals on industry capital expenditure, regional capacity additions, and merchant margin pressure.
        </p>
      </div>

      <div className="competitor-peer-grid">
        {competitors.map(comp => {
          const stats = comp.ticker ? competitorMetrics[comp.ticker] : undefined;
          const isListed = Boolean(comp.ticker);
          const color = (comp.ticker && colorMap[comp.ticker]) || '#0f766e';

          return (
            <article className="peer-card" key={comp.id}>
              <div className="peer-card-header">
                <div>
                  <h4 className="peer-name">{comp.name}</h4>
                  <span className="peer-region">{comp.country}</span>
                </div>
                <span className={`peer-status-tag ${isListed ? 'listed' : 'private'}`}>
                  {isListed ? `${comp.ticker}` : 'Private'}
                </span>
              </div>

              <div className="peer-card-body">
                {stats && stats.latestPrice !== undefined ? (
                  <div className="peer-price-row">
                    <div className="peer-price">
                      <b>{stats.currency} {stats.latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                      <small>Latest close</small>
                    </div>
                    <div className={`peer-change ${stats.changePct >= 0 ? 'positive' : 'negative'}`}>
                      <span>{stats.changePct >= 0 ? '▲' : '▼'} {Math.abs(stats.changePct).toFixed(1)}%</span>
                      <small>Period trend</small>
                    </div>
                  </div>
                ) : (
                  <div className="peer-unlisted-note">
                    <small>{isListed ? 'No price data in range' : 'Private entity · Unlisted producer'}</small>
                  </div>
                )}
              </div>

              <footer className="peer-card-footer">
                <span className="peer-dot" style={{ backgroundColor: color }} />
                {comp.website ? (
                  <a href={comp.website} target="_blank" rel="noreferrer" className="peer-link">
                    Company Portal ↗
                  </a>
                ) : (
                  <span className="peer-role">Domestic Producer</span>
                )}
              </footer>
            </article>
          );
        })}
      </div>

      {stocks.length > 0 ? (
        <div className="peer-chart-wrap">
          <TrendChart
            title="Competitor Equity Price Trajectory"
            unit="Native exchange currencies"
            data={stockData}
            series={tickers.map((ticker) => ({
              key: ticker,
              name: `${ticker} (${competitors.find(c => c.ticker === ticker)?.name || ticker})`,
              color: colorMap[ticker] || '#285686'
            }))}
            annotation="Historical close prices across domestic (ACI) and multinational peers (ICL, GURE)."
          />
        </div>
      ) : (
        <EmptyState
          title="No stock signals available in this range"
          detail="Competitor equity observations will appear as trading records are ingested."
        />
      )}
    </section>
  );
}

export function RiskOpportunityPanel({items}:{items:IntelligenceItem[]}){const risks=items.filter(x=>['HIGH','CRITICAL'].includes(x.impact)).slice(0,3);const opportunities=items.filter(x=>!risks.includes(x)).slice(0,3);const Panel=({title,list,kind}:{title:string;list:IntelligenceItem[];kind:string})=><article className={`editorial ${kind}`}><header><span>{kind==='risk'?'↓':'↗'}</span><h3>{title}</h3></header>{list.length?list.map(x=><div className="editorial-item" key={x.id}><h4>{x.title}</h4><p>{x.summary}</p><div><span>{x.impact} impact</span><ReliabilityBadge grade={x.reliability}/>{x.source_url&&<a href={x.source_url}>Evidence ↗</a>}</div></div>):<EmptyState/>}</article>;return <section className="risk-section"><SectionHeader eyebrow="Decision lens" title="Key risks and opportunities"/><div className="risk-grid"><Panel title="Risks to watch" list={risks} kind="risk"/><Panel title="Opportunities to test" list={opportunities} kind="opportunity"/></div></section>}

