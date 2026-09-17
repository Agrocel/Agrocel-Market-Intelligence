import React, { useEffect, useState, useCallback } from 'react';
import { getCuratedNews, getNewsStatus, getNewsSources, triggerNewsIngestion } from '../api';
import type { CuratedNewsItem, NewsPipelineStatus, NewsSourceItem } from '../types';
import { ReliabilityBadge } from './Common';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Price Benchmark', value: 'PRICE' },
  { label: 'Capacity & Capex', value: 'CAPACITY' },
  { label: 'Supply Disruption', value: 'SUPPLY' },
  { label: 'Regulation & Policy', value: 'REGULATION' },
  { label: 'Competitor Actions', value: 'COMPETITOR_MOVE' },
  { label: 'Trade & Logistics', value: 'TRADE' }
];

const GEOGRAPHIES = ['All Regions', 'China', 'India', 'Europe', 'United States', 'Middle East'];
const IMPACTS = [
  { label: 'All Severity', value: '' },
  { label: 'Critical / High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' }
];

export function NewsIntelligenceSection() {
  const [items, setItems] = useState<CuratedNewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGeo, setSelectedGeo] = useState('All Regions');
  const [selectedImpact, setSelectedImpact] = useState('');

  // Status & Sources Drawer
  const [status, setStatus] = useState<NewsPipelineStatus | null>(null);
  const [sources, setSources] = useState<NewsSourceItem[]>([]);
  const [showSources, setShowSources] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const geoParam = selectedGeo === 'All Regions' ? undefined : selectedGeo;
      const res = await getCuratedNews({
        category: selectedCategory || undefined,
        geography: geoParam,
        impact_level: selectedImpact || undefined,
        limit: 20
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch curated news:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedGeo, selectedImpact]);

  const loadStatus = useCallback(async () => {
    try {
      const s = await getNewsStatus();
      setStatus(s);
    } catch (e) {
      console.error('Could not load news status:', e);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerMsg('Running multi-source news discovery...');
    try {
      const res = await triggerNewsIngestion();
      setTriggerMsg(res.message || 'News ingestion completed successfully.');
      await fetchNews();
      await loadStatus();
      setTimeout(() => setTriggerMsg(null), 5000);
    } catch (err) {
      setTriggerMsg('Ingestion failed. Check backend log.');
      setTimeout(() => setTriggerMsg(null), 4000);
    } finally {
      setTriggering(false);
    }
  };

  const handleToggleSources = async () => {
    if (!showSources && sources.length === 0) {
      try {
        const srcList = await getNewsSources();
        setSources(srcList);
      } catch (e) {
        console.error('Failed fetching sources:', e);
      }
    }
    setShowSources(!showSources);
  };

  const getCategoryClass = (cat?: string) => {
    switch ((cat || '').toUpperCase()) {
      case 'PRICE': return 'tag-price';
      case 'CAPACITY': return 'tag-capacity';
      case 'SUPPLY': return 'tag-supply';
      case 'REGULATION': return 'tag-regulation';
      case 'COMPETITOR_MOVE': return 'tag-competitor';
      case 'TRADE': return 'tag-trade';
      default: return 'tag-general';
    }
  };

  return (
    <section id="news-intelligence-radar" className="news-radar-section">
      <header className="news-radar-header">
        <div className="news-title-group">
          <p className="eyebrow">Global Market News Ingestion & Intelligence Pipeline</p>
          <h2>Bromine Market News & Official Regulatory Radar</h2>
          <p className="news-subtitle">
            Audited market developments from GDELT, approved chemical RSS feeds, and official competitor portals with AI causal synthesis.
          </p>
        </div>

        <div className="news-action-group">
          <div className="news-status-pill">
            <span className="live-pulse" />
            <small>
              {status?.scheduler?.is_running ? 'Auto-discovery Active (3h interval)' : 'Scheduler Standing By'}
            </small>
            {status?.database_counts?.total_articles !== undefined && (
              <span className="count-pill">{status.database_counts.total_articles} Tracked</span>
            )}
          </div>

          <button
            className={`trigger-news-btn ${triggering ? 'spinning' : ''}`}
            onClick={handleTrigger}
            disabled={triggering}
          >
            {triggering ? 'Ingesting Feeds...' : '⚡ Run News Discovery'}
          </button>

          <button className="view-sources-btn" onClick={handleToggleSources}>
            {showSources ? 'Hide Sources' : 'Registry & Health'}
          </button>
        </div>
      </header>

      {triggerMsg && <div className="news-toast-msg">{triggerMsg}</div>}

      {/* Sources Registry Collapsible */}
      {showSources && (
        <div className="sources-drawer">
          <div className="sources-drawer-header">
            <h4>Approved Intelligence Sources ({sources.length})</h4>
            <small>Strictly limited to Bromine and verified chemical registries.</small>
          </div>
          <div className="sources-table-wrap">
            <table className="sources-table">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>Type</th>
                  <th>Region</th>
                  <th>Reliability</th>
                  <th>Auto-Fetch</th>
                  <th>Last Ingestion</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(s => (
                  <tr key={s.id}>
                    <td>
                      <a href={s.base_url} target="_blank" rel="noopener noreferrer">
                        <strong>{s.source_name}</strong>
                      </a>
                    </td>
                    <td><span className="source-type-pill">{s.source_type}</span></td>
                    <td>{s.publisher_region}</td>
                    <td><ReliabilityBadge grade={s.default_reliability_grade} /></td>
                    <td>{s.allowed_for_automated_fetch ? '✓ Enabled' : 'Manual'}</td>
                    <td>{s.last_fetched_at ? s.last_fetched_at.slice(0, 16).replace('T', ' ') : 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Filter Bar */}
      <div className="news-filter-bar">
        <div className="filter-pill-group">
          <label>Category:</label>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`pill-btn ${selectedCategory === c.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="filter-dropdowns">
          <div className="select-wrap">
            <label>Geography:</label>
            <select value={selectedGeo} onChange={e => setSelectedGeo(e.target.value)}>
              {GEOGRAPHIES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="select-wrap">
            <label>Impact:</label>
            <select value={selectedImpact} onChange={e => setSelectedImpact(e.target.value)}>
              {IMPACTS.map(imp => <option key={imp.value} value={imp.value}>{imp.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* News Cards Grid */}
      <div className="news-cards-container">
        {loading ? (
          <div className="news-loading-placeholder">
            <div className="spinner-icon" />
            <p>Loading curated bromine news items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="news-empty-placeholder">
            <p>No news articles match the selected criteria.</p>
            <small>Try selecting "All Categories" or trigger a manual news discovery run.</small>
          </div>
        ) : (
          <div className="news-grid">
            {items.map(art => {
              const intel = art.intelligence;
              const catClass = getCategoryClass(intel?.category);
              const impactLevel = intel?.impact_level || 'MEDIUM';

              return (
                <article key={art.id} className="news-card">
                  <header className="card-top-row">
                    <div className="tag-badges">
                      <span className={`category-tag ${catClass}`}>
                        {intel?.category || 'MARKET'}
                      </span>
                      <span className={`impact-tag impact-${impactLevel.toLowerCase()}`}>
                        {impactLevel}
                      </span>
                      <span className="geo-tag">
                        {intel?.geography || art.publisher_region}
                      </span>
                    </div>

                    <div className="card-meta">
                      <span className="meta-publisher">{art.publisher}</span>
                      {art.published_at && (
                        <span className="meta-date">{art.published_at.slice(0, 10)}</span>
                      )}
                    </div>
                  </header>

                  <h3 className="card-headline">
                    <a href={art.canonical_url} target="_blank" rel="noopener noreferrer" title="View original article">
                      {art.title}
                      <span className="ext-arrow"> ↗</span>
                    </a>
                  </h3>

                  <p className="card-snippet">{art.summary}</p>

                  {/* Corroboration and Reliability Row */}
                  <div className="corroboration-row">
                    {art.is_multi_source_corroborated ? (
                      <span className="corroborated-pill">
                        ✓ Multi-source Corroborated ({art.corroboration_count} sources)
                      </span>
                    ) : (
                      <span className="single-source-pill">Single Publisher Report</span>
                    )}

                    <div className="reliability-wrap">
                      <small>Grade:</small>
                      <ReliabilityBadge grade={intel?.reliability_grade || 'B'} />
                    </div>
                  </div>

                  {/* Agrocel Strategic Implication Box */}
                  {intel?.strategic_implication && (
                    <div className="strategic-impact-box">
                      <div className="impact-box-title">
                        <span>🎯 Agrocel Strategic Implication</span>
                      </div>
                      <p className="impact-text">{intel.strategic_implication}</p>
                      {intel.why_it_matters && intel.why_it_matters.includes('Recommendation:') && (
                        <div className="action-tag">
                          <b>Action:</b> {intel.why_it_matters.split('Recommendation:')[1].trim()}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {total > 0 && (
        <footer className="news-radar-footer">
          <small>Showing {items.length} of {total} curated Bromine market developments.</small>
        </footer>
      )}
    </section>
  );
}
