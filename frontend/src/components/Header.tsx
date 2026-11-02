import React, { useEffect, useState, useRef } from 'react';
import type { AppRoute } from '../navigation';

interface Props {
  refreshed: Date | null;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, subTab?: string) => void;
}

interface NavItem {
  route: AppRoute;
  label: string;
  badge?: string;
}

export function ExecutiveHeader({ refreshed, currentRoute, onNavigate }: Props) {
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supplyOpen, setSupplyOpen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [allModulesOpen, setAllModulesOpen] = useState(false);

  const supplyMenuRef = useRef<HTMLDivElement>(null);
  const demandMenuRef = useRef<HTMLDivElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);
  const allModulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (supplyMenuRef.current && !supplyMenuRef.current.contains(target)) {
        setSupplyOpen(false);
      }
      if (demandMenuRef.current && !demandMenuRef.current.contains(target)) {
        setDemandOpen(false);
      }
      if (dataMenuRef.current && !dataMenuRef.current.contains(target)) {
        setDataOpen(false);
      }
      if (allModulesRef.current && !allModulesRef.current.contains(target)) {
        setAllModulesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileOpen(false);
      setSupplyOpen(false);
      setDemandOpen(false);
      setDataOpen(false);
      setAllModulesOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleNav = (route: AppRoute, subTab?: string) => {
    onNavigate(route, subTab);
    setMobileOpen(false);
    setSupplyOpen(false);
    setDemandOpen(false);
    setDataOpen(false);
    setAllModulesOpen(false);
  };

  const isSupplyActive = ['supply-capacity', 'production-operations', 'plant-outages'].includes(currentRoute);
  const isDemandActive = ['demand-intelligence', 'business-trade', 'trade-intelligence'].includes(currentRoute);
  const isIntelligenceActive = ['competitor-intelligence', 'quarterly-report', 'forecasts-scenarios', 'news-developments', 'news-competitors', 'ask-intelligence'].includes(currentRoute);

  return (
    <header className={`executive-app-header ${compact ? 'compact' : ''}`}>
      {/* Brand Logo & Title */}
      <div className="header-brand-group">
        <a
          className="brand"
          href="#/overview"
          aria-label="Agrocel Market Intelligence home"
          onClick={e => {
            e.preventDefault();
            handleNav('overview');
          }}
        >
          <img src="/brand/agrocel-logo.png" alt="Agrocel Industries Pvt Ltd" />
          <span className="brand-title">
            <b>Market Intelligence</b>
            <small>Bromine Decision Desk</small>
          </span>
        </a>
      </div>

      {/* Primary Executive Navigation */}
      <nav className={`primary-nav-bar ${mobileOpen ? 'open' : ''}`} role="navigation">
        <button
          className={`nav-tab-btn ${currentRoute === 'overview' ? 'active' : ''}`}
          onClick={() => handleNav('overview')}
        >
          Overview
        </button>

        <button
          className={`nav-tab-btn ${currentRoute === 'price-intelligence' || currentRoute === 'market-intelligence' ? 'active' : ''}`}
          onClick={() => handleNav('price-intelligence')}
        >
          Pricing
        </button>

        {/* Supply Intelligence Tab (Single Unified Command Center) */}
        <button
          className={`nav-tab-btn ${isSupplyActive ? 'active' : ''}`}
          onClick={() => handleNav('supply-capacity')}
        >
          Supply
        </button>

        {/* Demand & Trade Dropdown */}
        <div className="nav-dropdown-item" ref={demandMenuRef}>
          <button
            className={`nav-tab-btn dropdown-btn ${isDemandActive ? 'active' : ''}`}
            onClick={() => setDemandOpen(!demandOpen)}
            aria-expanded={demandOpen}
          >
            <span>Demand & Trade</span>
            <span className="nav-caret">{demandOpen ? '▲' : '▾'}</span>
          </button>
          {demandOpen && (
            <div className="nav-dropdown-menu">
              <button
                className={`dropdown-sub-btn ${currentRoute === 'demand-intelligence' ? 'active' : ''}`}
                onClick={() => handleNav('demand-intelligence')}
              >
                <strong>Demand Intelligence</strong>
                <small>Downstream synthesis, domestic end-use sectors</small>
              </button>
              <button
                className={`dropdown-sub-btn ${currentRoute === 'business-trade' || currentRoute === 'trade-intelligence' ? 'active' : ''}`}
                onClick={() => handleNav('business-trade')}
              >
                <strong>Global Trade Intelligence</strong>
                <small>Customs trade flows, bilateral port rankings</small>
              </button>
            </div>
          )}
        </div>

        {/* Intelligence Dropdown (Direct Access to Competitor Intelligence) */}
        <div className="nav-dropdown-item" ref={allModulesRef}>
          <button
            className={`nav-tab-btn dropdown-btn ${isIntelligenceActive ? 'active' : ''}`}
            onClick={() => setAllModulesOpen(!allModulesOpen)}
            aria-expanded={allModulesOpen}
          >
            <span>Intelligence</span>
            <span className="nav-caret">{allModulesOpen ? '▲' : '▾'}</span>
          </button>
          {allModulesOpen && (
            <div className="nav-dropdown-menu nav-dropdown-menu-wide">
              <button className={`dropdown-sub-btn ${currentRoute === 'competitor-intelligence' ? 'active' : ''}`} onClick={() => handleNav('competitor-intelligence')}>
                <strong>Competitor Intelligence</strong>
                <small>Financial dossiers, peer benchmarker, and concall takeaways</small>
              </button>
              <button className={`dropdown-sub-btn ${currentRoute === 'news-developments' || currentRoute === 'news-competitors' ? 'active' : ''}`} onClick={() => handleNav('news-developments')}>
                <strong>Market Developments</strong>
                <small>Verified news, competitor moves, and event tracking</small>
              </button>
              <button className={`dropdown-sub-btn ${currentRoute === 'quarterly-report' ? 'active' : ''}`} onClick={() => handleNav('quarterly-report')}>
                <strong>Quarterly Report</strong>
                <small>Management briefing and priority watchlist</small>
              </button>
              <button className={`dropdown-sub-btn ${currentRoute === 'forecasts-scenarios' ? 'active' : ''}`} onClick={() => handleNav('forecasts-scenarios')}>
                <strong>Forecasts & Scenarios</strong>
                <small>Forward outlook and commercial stress tests</small>
              </button>
              <button className={`dropdown-sub-btn ${currentRoute === 'ask-intelligence' ? 'active' : ''}`} onClick={() => handleNav('ask-intelligence')}>
                <strong>Ask Intelligence</strong>
                <small>Evidence-backed answers from internal and market sources</small>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Directory */}
        <div className="mobile-data-links">
          <div className="mobile-section-label">MARKET INTELLIGENCE MODULES</div>
          <button className="nav-tab-btn" onClick={() => handleNav('overview')}>Executive Overview</button>
          <button className="nav-tab-btn" onClick={() => handleNav('price-intelligence')}>Price Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('supply-capacity')}>Supply Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('demand-intelligence')}>Demand Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('business-trade')}>Global Trade Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('competitor-intelligence')}>Competitor Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('quarterly-report')}>Quarterly Report</button>
          <button className="nav-tab-btn" onClick={() => handleNav('forecasts-scenarios')}>Forecasts & Scenarios</button>
          <button className="nav-tab-btn" onClick={() => handleNav('news-developments')}>News & Market Developments</button>
          <button className="nav-tab-btn" onClick={() => handleNav('ask-intelligence')}>Ask Intelligence</button>
          <button className="nav-tab-btn mt-2" onClick={() => handleNav('data-coverage')}>📊 Data Coverage & Provenance</button>
        </div>
      </nav>

      {/* Right Header Actions */}
      <div className="header-actions">
        {/* Data ▾ Dropdown Menu */}
        <div className="data-dropdown-container" ref={dataMenuRef}>
          <button
            className={`data-menu-trigger ${currentRoute === 'data-coverage' || dataOpen ? 'active' : ''}`}
            onClick={() => setDataOpen(!dataOpen)}
            aria-expanded={dataOpen}
            aria-haspopup="true"
            title="Inspect underlying data sources, synchronization baseline, and news crawler registry"
          >
            <span>Data</span>
            <span className="dropdown-caret">{dataOpen ? '▲' : '▾'}</span>
          </button>

          {dataOpen && (
            <div className="data-dropdown-popover" role="menu">
              <div className="dropdown-header">
                <small>Audited Governance</small>
                <strong>System Data Ledger</strong>
              </div>
              <button
                className="dropdown-item"
                role="menuitem"
                onClick={() => handleNav('data-coverage')}
              >
                <span className="item-icon">✓</span>
                <div>
                  <strong>Data Coverage & Horizon</strong>
                  <small>Feb 2026 unified baseline & spans</small>
                </div>
              </button>
              <button
                className="dropdown-item"
                role="menuitem"
                onClick={() => handleNav('data-coverage')}
              >
                <span className="item-icon">📰</span>
                <div>
                  <strong>News Registry & Lineage</strong>
                  <small>Crawl status, RSS & GDELT feeds</small>
                </div>
              </button>
              <div className="dropdown-footer">
                <span className="sync-status-dot" />
                <small>Backend synchronized</small>
              </div>
            </div>
          )}
        </div>

        {/* Refreshed timestamp */}
        <small className="header-refresh-time" title="Last API synchronisation timestamp">
          Updated {refreshed ? refreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </small>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}
