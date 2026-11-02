import React, { useEffect, useState, useCallback } from 'react';
import type {
  DashboardData,
  CuratedNewsItem,
  NewsPipelineStatus,
  NewsSourceItem
} from '../types';
import {
  getCuratedNews,
  getNewsStatus,
  getNewsSources,
  triggerNewsIngestion
} from '../api';
import { EmptyState, ReliabilityBadge } from '../components/Common';
import { PageHeader, IntelligenceStatusStrip, SectionNav } from '../components/PageHeader';

interface Props {
  data: DashboardData;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Price Benchmark', value: 'PRICE' },
  { label: 'Capacity & Capex', value: 'CAPACITY' },
  { label: 'Supply Disruption', value: 'SUPPLY' },
  { label: 'Regulation & Policy', value: 'REGULATION' },
  { label: 'Competitor Actions', value: 'COMPETITOR_MOVE' },
  { label: 'Trade & Logistics', value: 'TRADE' }
];

const GEOGRAPHIES = ['All Regions', 'Australia', 'China', 'India', 'Europe', 'United States', 'Middle East'];
const IMPACTS = [
  { label: 'All Severity', value: '' },
  { label: 'Critical / High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' }
];

export function NewsCompetitorsPage({
  activeSubTab = 'news',
  onSubTabChange
}: Props) {
  const [tab, setTab] = useState(activeSubTab === 'competitors' ? 'news' : activeSubTab);

  useEffect(() => {
    if (activeSubTab && activeSubTab !== tab) {
      if (activeSubTab === 'competitors') {
        window.location.hash = '#/competitor-intelligence';
      } else {
        setTab(activeSubTab);
      }
    }
  }, [activeSubTab, tab]);

  const handleTabClick = (newTab: string) => {
    if (newTab === 'competitor-intelligence' || newTab === 'competitors') {
      window.location.hash = '#/competitor-intelligence';
      return;
    }
    setTab(newTab);
    onSubTabChange?.(newTab);
  };

  // ---------------------------------------------------------------------------
  // 1. MARKET NEWS STATE & API
  // ---------------------------------------------------------------------------
  const [newsItems, setNewsItems] = useState<CuratedNewsItem[]>([]);
  const [newsTotal, setNewsTotal] = useState(0);
  const [newsLoading, setNewsLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGeo, setSelectedGeo] = useState('All Regions');
  const [selectedImpact, setSelectedImpact] = useState('');

  const [newsStatus, setNewsStatus] = useState<NewsPipelineStatus | null>(null);
  const [sources, setSources] = useState<NewsSourceItem[]>([]);
  const [showSources, setShowSources] = useState(false);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const geoParam = selectedGeo === 'All Regions' ? undefined : selectedGeo;
      const res = await getCuratedNews({
        category: selectedCategory || undefined,
        geography: geoParam,
        impact_level: selectedImpact || undefined,
        limit: 30
      });
      setNewsItems(res.items || []);
      setNewsTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch curated news:', err);
    } finally {
      setNewsLoading(false);
    }
  }, [selectedCategory, selectedGeo, selectedImpact]);

  const loadStatus = useCallback(async () => {
    try {
      const s = await getNewsStatus();
      setNewsStatus(s);
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
    setTriggerMsg('Running multi-source news discovery crawler...');
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

  // Regulatory filtered items
  const regulatoryNews = newsItems.filter(
    item => (item.intelligence?.category || '').toUpperCase() === 'REGULATION' ||
            /regulat|ministry|inspection|compliance|environmental|customs advisory|ban/i.test(item.title + ' ' + item.summary)
  );

  return (
    <div className="page-shell news-competitors-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        title="News & Chemical Developments"
        actions={
          <button
            className={`btn-exec-action ${triggering ? 'spinning' : ''}`}
            onClick={handleTrigger}
            disabled={triggering}
          >
            <span className={triggering ? 'spin-anim' : ''}>⚡</span>
            <span>{triggering ? 'Ingesting Feeds...' : 'Scan Feeds'}</span>
          </button>
        }
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Pipeline State',
            value: newsStatus?.scheduler?.is_running ? 'Auto-Crawling Active' : 'Crawler Standing By',
            dot: newsStatus?.scheduler?.is_running ? 'green' : 'blue',
            tone: 'positive'
          },
          {
            label: 'Verified Corpus',
            value: `${newsStatus?.database_counts?.total_articles ?? newsTotal} Curated Articles`
          },
          {
            label: 'Primary Coverage',
            value: 'Global Chemical Press, Customs Manifests & Regulators'
          },
          {
            label: 'Update Frequency',
            value: 'Daily Ingestion & Grounding'
          }
        ]}
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'news', label: 'Market News', badge: newsTotal },
          { id: 'regulatory', label: 'Regulatory & Policy', badge: regulatoryNews.length },
          {
            id: 'competitor-intelligence',
            label: 'Competitor Intelligence ↗',
            onClick: () => { window.location.hash = '#/competitor-intelligence'; }
          }
        ]}
        activeId={tab}
        onSelect={handleTabClick}
        ariaLabel="News & Developments Navigation"
      />

      {triggerMsg && <div className="news-toast-msg">{triggerMsg}</div>}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MARKET NEWS                                                    */}
      {/* ========================================================================= */}
      {tab === 'news' && (
        <section className="subtab-content">
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
            {newsLoading ? (
              <div className="news-loading-placeholder">
                <div className="spinner-icon" />
                <p>Loading curated bromine news items...</p>
              </div>
            ) : newsItems.length === 0 ? (
              <EmptyState
                title="No news articles match the selected criteria"
                detail="Try selecting 'All Categories' or trigger a fresh news discovery scan."
              />
            ) : (
              <div className="news-grid">
                {newsItems.map(art => {
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

                      {intel?.strategic_implication && (
                        <div className="strategic-impact-box">
                          <div className="impact-box-title">
                            <span>🎯 Agrocel Strategic Implication</span>
                          </div>
                          <p className="impact-text">{intel.strategic_implication}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: REGULATORY                                                     */}
      {/* ========================================================================= */}
      {tab === 'regulatory' && (
        <section className="subtab-content">
          <div className="regulatory-section-wrap">
            <div className="section-heading">
              <div>
                <h2>Official Regulatory Bulletins & Port Compliance</h2>
              </div>
              <button className="view-sources-btn" onClick={handleToggleSources}>
                {showSources ? 'Hide Source Registry' : 'Approved Source Registry ↗'}
              </button>
            </div>

            {/* Collapsible Source Registry */}
            {showSources && (
              <div className="sources-drawer">
                <div className="sources-drawer-header">
                  <h4>Approved Government & Chemical Sources ({sources.length})</h4>
                </div>
                <div className="sources-table-wrap">
                  <table className="sources-table">
                    <thead>
                      <tr>
                        <th>Registry Name</th>
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

            {/* Regulatory Specific News Cards */}
            {regulatoryNews.length > 0 ? (
              <div className="news-grid">
                {regulatoryNews.map(art => (
                  <article key={art.id} className="news-card regulatory-card">
                    <header className="card-top-row">
                      <div className="tag-badges">
                        <span className="category-tag tag-regulation">REGULATION</span>
                        <span className="geo-tag">{art.intelligence?.geography || art.publisher_region}</span>
                      </div>
                      <span className="meta-date">{art.published_at ? art.published_at.slice(0, 10) : 'Recent'}</span>
                    </header>
                    <h3 className="card-headline">
                      <a href={art.canonical_url} target="_blank" rel="noopener noreferrer">
                        {art.title} ↗
                      </a>
                    </h3>
                    <p className="card-snippet">{art.summary}</p>
                    {art.intelligence?.strategic_implication && (
                      <div className="strategic-impact-box">
                        <div className="impact-box-title">
                          <span>Compliance Implication</span>
                        </div>
                        <p className="impact-text">{art.intelligence.strategic_implication}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No active regulatory alerts found"
                detail="All active environmental and port compliance notices will appear here."
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
