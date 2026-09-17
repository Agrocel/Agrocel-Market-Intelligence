import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getDashboard } from './api';
import type { DashboardData, DateRangeKey } from './types';
import { ChatInterface } from './components/Chat';
import { ErrorState, LoadingSkeleton, Reveal } from './components/Common';
import { ExecutiveHeader } from './components/Header';
import { IntelligenceFeed, RiskOpportunityPanel } from './components/Intelligence';
import { MarketSection } from './components/Market';
import { MarketNarrative } from './components/MarketNarrative';
import { ManualModal } from './components/Modals';
import { HeroOverview } from './components/Overview';
import { SalesMarketComparison } from './components/Sales';
import { TradeIntelligence } from './components/Trade';
import { NewsIntelligenceSection } from './components/NewsIntelligenceSection';
import { DataSourcesPage } from './components/DataSourcesPage';
import './style.css';

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [range, setRange] = useState<DateRangeKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshed, setRefreshed] = useState<Date | null>(null);
  const [manual, setManual] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'datasources'>('dashboard');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getDashboard(range));
      setRefreshed(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data && currentPage === 'dashboard') {
    return (
      <>
        <ExecutiveHeader
          refreshed={refreshed}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
        <LoadingSkeleton />
      </>
    );
  }

  return (
    <>
      <ExecutiveHeader
        refreshed={refreshed}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      {currentPage === 'datasources' ? (
        <DataSourcesPage onBackToDashboard={() => setCurrentPage('dashboard')} />
      ) : (
        <main className="page-shell">
          {error && !data ? (
            <ErrorState retry={load} />
          ) : (
            data && (
              <>
                {/* Hero & KPI Cards */}
                <Reveal>
                  <HeroOverview
                    data={data.overview}
                    prices={data.prices}
                    range={range}
                    onRange={setRange}
                    onOpenDataSources={() => setCurrentPage('datasources')}
                  />
                </Reveal>

                {/* AI Grounded Market Narrative & Who Did What (Directly below KPI cards) */}
                <Reveal>
                  <MarketNarrative brief={data.brief} />
                </Reveal>

                {loading && <div className="refresh-line" aria-label="Refreshing data" />}

                <Reveal>
                  <MarketSection prices={data.prices} items={data.intelligence} />
                </Reveal>

                <Reveal>
                  <TradeIntelligence records={data.trade} />
                </Reveal>

                <Reveal>
                  <SalesMarketComparison sales={data.sales} prices={data.prices} />
                </Reveal>

                {/* Global Bromine News & Official Regulatory Radar */}
                <Reveal>
                  <NewsIntelligenceSection />
                </Reveal>

                <Reveal>
                  <IntelligenceFeed
                    items={data.intelligence}
                    competitors={data.competitors}
                    stocks={data.stocks}
                  />
                </Reveal>

                <Reveal>
                  <RiskOpportunityPanel items={data.intelligence} />
                </Reveal>

                <Reveal>
                  <ChatInterface />
                </Reveal>

                <footer className="page-footer">
                  <div>
                    <strong>Agrocel Market Intelligence</strong>
                    <span>Bromine Pilot</span>
                  </div>
                  <div className="footer-links">
                    <button className="footer-link-btn" onClick={() => setCurrentPage('datasources')}>
                      Data Sources & Ranges
                    </button>
                    <button onClick={() => setManual(true)}>+ Add field intelligence</button>
                  </div>
                  <small>
                    Data is sourced from the connected backend. Confidential commercial information must remain within authorized teams.
                  </small>
                </footer>
              </>
            )
          )}
        </main>
      )}

      {manual && (
        <ManualModal
          onClose={() => setManual(false)}
          onSaved={() => {
            setManual(false);
            load();
          }}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
