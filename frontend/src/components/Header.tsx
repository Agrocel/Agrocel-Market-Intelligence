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

  return (
    <header className={`executive-app-header ${compact ? 'compact' : ''}`}>
      {/* Brand Logo & Title */}
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
          <small>Bromine decision desk</small>
        </span>
      </a>

      <span className="product-tag">Bromine Pilot</span>

      {/* Primary 12-Module Executive Navigation */}
      <nav className={`primary-nav-bar ${mobileOpen ? 'open' : ''}`} role="navigation">
        {/* 01. Overview */}
        <button
          className={`nav-tab-btn ${currentRoute === 'overview' ? 'active' : ''}`}
          onClick={() => handleNav('overview')}
        >
          Overview
        </button>

        {/* 02. Price Intelligence */}
        <button
          className={`nav-tab-btn ${currentRoute === 'price-intelligence' || currentRoute === 'market-intelligence' ? 'active' : ''}`}
          onClick={() => handleNav('price-intelligence')}
        >
          Pricing
        </button>

        {/* 03 & 06 & 07. Supply & Operations Dropdown */}
        <div className="nav-dropdown-item" ref={supplyMenuRef}>
          <button
            className={`nav-tab-btn dropdown-btn ${isSupplyActive ? 'active' : ''}`}
            onClick={() => setSupplyOpen(!supplyOpen)}
            aria-expanded={supplyOpen}
          >
            <span>Supply & Ops</span>
            <span className="nav-caret">{supplyOpen ? '▲' : '▾'}</span>
          </button>
          {supplyOpen && (
            <div className="nav-dropdown-menu">
              <button
                className={`dropdown-sub-btn ${currentRoute === 'supply-capacity' ? 'active' : ''}`}
                onClick={() => handleNav('supply-capacity')}
              >
                <strong>03. Supply & Global Capacity</strong>
                <small>685k baseline, country dossiers & utilization</small>
              </button>
              <button
                className={`dropdown-sub-btn ${currentRoute === 'production-operations' ? 'active' : ''}`}
                onClick={() => handleNav('production-operations')}
              >
                <strong>06. Production & Operations</strong>
                <small>Agrocel Kutch runs, solar bitterns & monsoon buffer</small>
              </button>
              <button
                className={`dropdown-sub-btn ${currentRoute === 'plant-outages' ? 'active' : ''}`}
                onClick={() => handleNav('plant-outages')}
              >
                <strong>07. Plant Outages & Disruptions</strong>
                <small>Shandong audits, Red Sea bypass & timelines</small>
              </button>
            </div>
          )}
        </div>

        {/* 04 & 05. Demand & Trade Dropdown */}
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
                <strong>04. Demand Intelligence</strong>
                <small>Flame retardants, agrochem & API synthesis</small>
              </button>
              <button
                className={`dropdown-sub-btn ${currentRoute === 'business-trade' || currentRoute === 'trade-intelligence' ? 'active' : ''}`}
                onClick={() => handleNav('business-trade')}
              >
                <strong>05. Global Trade Intelligence</strong>
                <small>OEC HS 280130, customs bills & Indian flows</small>
              </button>
            </div>
          )}
        </div>

        {/* 08. Competitors */}
        <button
          className={`nav-tab-btn ${currentRoute === 'competitor-intelligence' ? 'active' : ''}`}
          onClick={() => handleNav('competitor-intelligence')}
        >
          Competitors
        </button>

        {/* 09. Quarterly Report */}
        <button
          className={`nav-tab-btn ${currentRoute === 'quarterly-report' ? 'active' : ''}`}
          onClick={() => handleNav('quarterly-report')}
        >
          Quarterly Report
        </button>

        {/* 10. Forecasts & Scenarios */}
        <button
          className={`nav-tab-btn ${currentRoute === 'forecasts-scenarios' ? 'active' : ''}`}
          onClick={() => handleNav('forecasts-scenarios')}
        >
          Forecasts
        </button>

        {/* 11. News & Market Developments */}
        <button
          className={`nav-tab-btn ${currentRoute === 'news-developments' || currentRoute === 'news-competitors' ? 'active' : ''}`}
          onClick={() => handleNav('news-developments')}
        >
          News
        </button>

        {/* 12. Ask Intelligence */}
        <button
          className={`nav-tab-btn ${currentRoute === 'ask-intelligence' ? 'active' : ''}`}
          onClick={() => handleNav('ask-intelligence')}
        >
          Ask AI
        </button>

        {/* Mobile Directory of all 12 modules */}
        <div className="mobile-data-links">
          <div className="mobile-section-label">MARKET INTELLIGENCE DIRECTORY</div>
          <button className="nav-tab-btn" onClick={() => handleNav('overview')}>01. Executive Overview</button>
          <button className="nav-tab-btn" onClick={() => handleNav('price-intelligence')}>02. Price Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('supply-capacity')}>03. Supply & Global Capacity</button>
          <button className="nav-tab-btn" onClick={() => handleNav('demand-intelligence')}>04. Demand Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('business-trade')}>05. Global Trade Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('production-operations')}>06. Production & Operations</button>
          <button className="nav-tab-btn" onClick={() => handleNav('plant-outages')}>07. Plant Outages & Disruptions</button>
          <button className="nav-tab-btn" onClick={() => handleNav('competitor-intelligence')}>08. Competitor Intelligence</button>
          <button className="nav-tab-btn" onClick={() => handleNav('quarterly-report')}>09. Quarterly Intelligence Report</button>
          <button className="nav-tab-btn" onClick={() => handleNav('forecasts-scenarios')}>10. Forecasts & Scenarios</button>
          <button className="nav-tab-btn" onClick={() => handleNav('news-developments')}>11. News & Market Developments</button>
          <button className="nav-tab-btn" onClick={() => handleNav('ask-intelligence')}>12. Ask Market Intelligence</button>
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
