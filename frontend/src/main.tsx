import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getDashboard } from './api';
import type { DashboardData, DateRangeKey, DataGroundingItem } from './types';
import { ErrorState, LoadingSkeleton } from './components/Common';
import { ExecutiveHeader } from './components/Header';
import { ManualModal } from './components/Modals';
import { DataSourcesPage } from './components/DataSourcesPage';
import { ProvenanceDrawer } from './components/DataProvenance';

import { OverviewPage } from './pages/OverviewPage';
import { PriceIntelligencePage } from './pages/PriceIntelligencePage';
import { SupplyCapacityPage } from './pages/SupplyCapacityPage';
import { DemandIntelligencePage } from './pages/DemandIntelligencePage';
import { BusinessTradePage } from './pages/BusinessTradePage';
import { ProductionOperationsPage } from './pages/ProductionOperationsPage';
import { PlantOutagesPage } from './pages/PlantOutagesPage';
import { CompetitorIntelligencePage } from './pages/CompetitorIntelligencePage';
import { QuarterlyReportPage } from './pages/QuarterlyReportPage';
import { ForecastsScenariosPage } from './pages/ForecastsScenariosPage';
import { NewsCompetitorsPage } from './pages/NewsCompetitorsPage';
import { AskIntelligencePage } from './pages/AskIntelligencePage';

import { parseHash, navigateTo, type AppRoute, type RouteState } from './navigation';
import './style.css';

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [range, setRange] = useState<DateRangeKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshed, setRefreshed] = useState<Date | null>(null);
  const [manual, setManual] = useState(false);

  // Hash-based routing state
  const [routeState, setRouteState] = useState<RouteState>(() =>
    parseHash(window.location.hash)
  );

  // Global Provenance Drawer state
  const [selectedGrounding, setSelectedGrounding] = useState<DataGroundingItem | null>(null);

  // Synchronize with URL hash changes (browser Back/Forward/direct link)
  useEffect(() => {
    const onHashChange = () => {
      setRouteState(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // If no initial hash, set to #/overview
    if (!window.location.hash) {
      window.location.hash = '#/overview';
    }

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = useCallback((route: AppRoute, subTab?: string) => {
    navigateTo(route, subTab);
    setRouteState({ route, subTab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getDashboard(range);
      setData(res);
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

  // Initial loading state before data is populated
  if (loading && !data && routeState.route !== 'data-coverage') {
    return (
      <>
        <ExecutiveHeader
          refreshed={refreshed}
          currentRoute={routeState.route}
          onNavigate={handleNavigate}
        />
        <LoadingSkeleton />
      </>
    );
  }

  return (
    <>
      <ExecutiveHeader
        refreshed={refreshed}
        currentRoute={routeState.route}
        onNavigate={handleNavigate}
      />

      {loading && <div className="refresh-line" aria-label="Refreshing data" />}

      {/* Main Page Area */}
      <main className="app-main-content">
        {error && !data ? (
          <div className="page-shell">
            <ErrorState retry={load} />
          </div>
        ) : (
          <>
            {routeState.route === 'overview' && data && (
              <OverviewPage
                data={data}
                range={range}
                onRange={setRange}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {(routeState.route === 'price-intelligence' || routeState.route === 'market-intelligence') && data && (
              <PriceIntelligencePage
                data={data}
                activeSubTab={routeState.subTab || 'benchmarks'}
                onSubTabChange={tab => handleNavigate('price-intelligence', tab)}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {routeState.route === 'supply-capacity' && data && (
              <SupplyCapacityPage
                data={data}
                onNavigate={handleNavigate}
              />
            )}

            {routeState.route === 'demand-intelligence' && data && (
              <DemandIntelligencePage
                data={data}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {(routeState.route === 'business-trade' || routeState.route === 'trade-intelligence') && data && (
              <BusinessTradePage
                data={data}
                activeSubTab={routeState.subTab || 'agrocel'}
                onSubTabChange={tab => handleNavigate('business-trade', tab)}
              />
            )}

            {routeState.route === 'production-operations' && data && (
              <ProductionOperationsPage
                data={data}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {routeState.route === 'plant-outages' && data && (
              <PlantOutagesPage
                data={data}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {routeState.route === 'competitor-intelligence' && data && (
              <CompetitorIntelligencePage
                data={data}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {routeState.route === 'quarterly-report' && data && (
              <QuarterlyReportPage
                data={data}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {routeState.route === 'forecasts-scenarios' && data && (
              <ForecastsScenariosPage
                data={data}
                onNavigate={handleNavigate}
                onSelectGrounding={setSelectedGrounding}
              />
            )}

            {(routeState.route === 'news-developments' || routeState.route === 'news-competitors') && data && (
              <NewsCompetitorsPage
                data={data}
                activeSubTab={routeState.subTab || 'news'}
                onSubTabChange={tab => handleNavigate('news-developments', tab)}
              />
            )}

            {routeState.route === 'ask-intelligence' && (
              <AskIntelligencePage />
            )}

            {routeState.route === 'data-coverage' && (
              <DataSourcesPage onBackToDashboard={() => handleNavigate('overview')} />
            )}
          </>
        )}
      </main>

      {/* Global Application Footer */}
      <footer className="page-footer">
        <div className="footer-brand">
          <strong>Agrocel Market Intelligence</strong>
          <span>Bromine Pilot · Strategic Decision Desk</span>
        </div>
        <div className="footer-links">
          <button
            className="footer-link-btn"
            onClick={() => handleNavigate('data-coverage')}
          >
            Data Coverage & Spans
          </button>
          <button
            className="footer-link-btn primary-action"
            onClick={() => setManual(true)}
          >
            + Add Field Intelligence
          </button>
        </div>
        <small className="footer-disclaimer">
          Confidential commercial and custom records. Data is restricted to authorized Agrocel management.
        </small>
      </footer>

      {/* Global Slide-Over Provenance Inspector Drawer */}
      <ProvenanceDrawer
        item={selectedGrounding}
        onClose={() => setSelectedGrounding(null)}
      />

      {/* Manual Field Intelligence Modal */}
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
