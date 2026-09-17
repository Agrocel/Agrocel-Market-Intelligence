import React, { useEffect, useState } from 'react';

interface Props {
  refreshed: Date | null;
  currentPage?: 'dashboard' | 'datasources';
  onNavigate?: (page: 'dashboard' | 'datasources') => void;
}

export function ExecutiveHeader({ refreshed, currentPage = 'dashboard', onNavigate }: Props) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    ['overview', 'Overview'],
    ['ai-market-synthesis', 'AI Brief'],
    ['market', 'Market'],
    ['trade', 'Trade'],
    ['sales', 'Sales'],
    ['news-intelligence-radar', 'News Radar'],
    ['intelligence', 'Intelligence'],
    ['chat', 'Ask AI'],
  ];

  return (
    <header className={compact ? 'compact' : ''}>
      <a
        className="brand"
        href="#overview"
        aria-label="Agrocel Market Intelligence home"
        onClick={e => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate('dashboard');
          }
        }}
      >
        <img src="/brand/agrocel-logo.png" alt="Agrocel Industries Pvt Ltd" />
        <span className="brand-title">
          <b>Market Intelligence</b>
          <small>Bromine decision desk</small>
        </span>
      </a>
      <span className="product-tag">Bromine Pilot</span>

      {currentPage === 'dashboard' ? (
        <nav className={open ? 'open' : ''}>
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      ) : (
        <nav className={open ? 'open' : ''}>
          <a
            href="#dashboard"
            onClick={e => {
              e.preventDefault();
              onNavigate?.('dashboard');
              setOpen(false);
            }}
          >
            ← Back to Dashboard
          </a>
        </nav>
      )}

      <div className="header-actions">
        {onNavigate && (
          <button
            className={`nav-page-btn ${currentPage === 'datasources' ? 'active' : ''}`}
            onClick={() => onNavigate(currentPage === 'dashboard' ? 'datasources' : 'dashboard')}
            title="Inspect all data sources, time horizons, and where news has come from"
          >
            {currentPage === 'dashboard' ? '📊 Data Sources & Lineage' : '📈 Back to Dashboard'}
          </button>
        )}
        <small>
          Updated {refreshed ? refreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </small>
        <button
          className="menu"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
