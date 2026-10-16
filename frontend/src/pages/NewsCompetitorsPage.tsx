import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type {
  DashboardData,
  CuratedNewsItem,
  NewsPipelineStatus,
  NewsSourceItem,
  CompetitorDossierSummary,
  CompetitorDossierDetail
} from '../types';
import {
  getCuratedNews,
  getNewsStatus,
  getNewsSources,
  triggerNewsIngestion,
  getCompetitorDossiers,
  getCompetitorDossier
} from '../api';
import { TrendChart } from '../components/Charts';
import { EmptyState, ReliabilityBadge } from '../components/Common';

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

export interface PeerCurrencyConfig {
  nativeCurrency: string;
  symbol: string;
  flag: string;
  revenueUnit: string;
  revenueMultiplier: number;
  pricingMultiplier: number;
  domesticPriceUnit?: string;
  authority: string;
  stockCurrency: string;
  usdToStockFx: number;
  tag: string;
}

export const PEER_CURRENCY_CONFIG: Record<string, PeerCurrencyConfig> = {
  ACI: {
    nativeCurrency: 'INR',
    symbol: '₹',
    flag: '🇮🇳',
    revenueUnit: '₹ Cr',
    revenueMultiplier: 8.35,     // 1 USD M ≈ 8.35 INR Cr
    pricingMultiplier: 83.5,     // 1 USD/MT ≈ 83.5 INR/MT
    domesticPriceUnit: '₹ / kg',
    authority: 'BSE / NSE (India)',
    stockCurrency: 'INR',
    usdToStockFx: 83.5,
    tag: '₹ INR Statutory',
  },
  LXS: {
    nativeCurrency: 'EUR',
    symbol: '€',
    flag: '🇩🇪',
    revenueUnit: '€M',
    revenueMultiplier: 0.925,    // 1 USD M ≈ 0.925 EUR M
    pricingMultiplier: 0.925,    // 1 USD/MT ≈ 0.925 EUR/MT
    domesticPriceUnit: '€ / MT',
    authority: 'Deutsche Börse (Germany)',
    stockCurrency: 'EUR',
    usdToStockFx: 0.925,
    tag: '€ EUR Statutory',
  },
  GURE: {
    nativeCurrency: 'USD',
    symbol: '$',
    flag: '🇨🇳',
    revenueUnit: '$M',
    revenueMultiplier: 1.0,
    pricingMultiplier: 1.0,
    domesticPriceUnit: '¥ / MT',
    authority: 'NASDAQ (SEC 10-Q) · Shandong Ops',
    stockCurrency: 'USD',
    usdToStockFx: 1.0,
    tag: '$ USD / ¥ CNY',
  },
  ICL: {
    nativeCurrency: 'USD',
    symbol: '$',
    flag: '🇮🇱',
    revenueUnit: '$M',
    revenueMultiplier: 1.0,
    pricingMultiplier: 1.0,
    authority: 'NYSE / TASE (Form 20-F / 6-K)',
    stockCurrency: 'USD',
    usdToStockFx: 1.0,
    tag: '$ USD Statutory',
  },
  ALB: {
    nativeCurrency: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    revenueUnit: '$M',
    revenueMultiplier: 1.0,
    pricingMultiplier: 1.0,
    authority: 'NYSE (Form 10-K / 10-Q)',
    stockCurrency: 'USD',
    usdToStockFx: 1.0,
    tag: '$ USD Statutory',
  }
};

export function NewsCompetitorsPage({
  data,
  activeSubTab = 'news',
  onSubTabChange
}: Props) {
  const [tab, setTab] = useState(activeSubTab);

  useEffect(() => {
    if (activeSubTab && activeSubTab !== tab) {
      setTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabClick = (newTab: string) => {
    setTab(newTab);
    onSubTabChange?.(newTab);
  };

  const { competitors, stocks } = data;

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
        limit: 25
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

  // ---------------------------------------------------------------------------
  // 2. COMPETITOR FINANCIAL TRACKER DATA & MULTI-CURRENCY NORMALIZATION
  // ---------------------------------------------------------------------------
  const [stockViewMode, setStockViewMode] = useState<'indexed' | 'usd' | 'native'>('indexed');
  const [currencyMode, setCurrencyMode] = useState<'native' | 'usd'>('native');

  const stockData = useMemo(() => {
    const map: Record<string, any> = {};
    stocks.forEach(x => {
      map[x.date] = map[x.date] || { date: x.date };
      map[x.date][x.ticker] = x.close_price;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stocks]);

  const indexedStockData = useMemo(() => {
    if (!stocks.length) return [];
    const basePrices: Record<string, number> = {};
    const sortedStocks = [...stocks].sort((a, b) => a.date.localeCompare(b.date));
    sortedStocks.forEach(s => {
      if (s.close_price > 0 && !basePrices[s.ticker]) {
        basePrices[s.ticker] = s.close_price;
      }
    });

    const map: Record<string, any> = {};
    sortedStocks.forEach(s => {
      map[s.date] = map[s.date] || { date: s.date };
      const base = basePrices[s.ticker];
      if (base && base > 0) {
        map[s.date][s.ticker] = Number(((s.close_price / base) * 100).toFixed(2));
      }
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stocks]);

  const usdStockData = useMemo(() => {
    if (!stocks.length) return [];
    const map: Record<string, any> = {};
    stocks.forEach(x => {
      map[x.date] = map[x.date] || { date: x.date };
      let priceUsd = x.close_price;
      const t = x.ticker.toUpperCase();
      if (t === 'ACI' || x.currency === 'INR') {
        priceUsd = Number((x.close_price / 83.5).toFixed(2));
      } else if (t === 'LXS' || x.currency === 'EUR') {
        priceUsd = Number((x.close_price / 0.925).toFixed(2));
      }
      map[x.date][x.ticker] = priceUsd;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stocks]);

  const activeStockData = useMemo(() => {
    if (stockViewMode === 'indexed') return indexedStockData;
    if (stockViewMode === 'usd') return usdStockData;
    return stockData;
  }, [stockViewMode, indexedStockData, usdStockData, stockData]);

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
          currency: last.currency || (comp.ticker.toUpperCase() === 'ACI' ? 'INR' : 'USD'),
          changePct,
          recordsCount: compStocks.length
        };
      }
    });
    return result;
  }, [competitors, stocks]);

  const tickers = Array.from(new Set(stocks.map(x => x.ticker))).slice(0, 5);
  const colorMap: Record<string, string> = {
    ACI: '#0f766e',
    ICL: '#2563eb',
    GURE: '#b45309',
    ALB: '#7c3aed',
    LXS: '#dc2626'
  };

  const stockUnit = useMemo(() => {
    if (stockViewMode === 'indexed') return 'Index Base = 100 (Relative % Gain/Loss)';
    if (stockViewMode === 'usd') return 'USD per share ($)';
    return 'Native exchange currencies (ACI: ₹ INR, ICL/GURE: $ USD)';
  }, [stockViewMode]);

  const stockSeries = useMemo(() => {
    return tickers.map(ticker => {
      const comp = competitors.find(c => c.ticker === ticker);
      const name = comp?.name || ticker;
      let displayName = `${ticker} (${name})`;
      if (stockViewMode === 'native') {
        const curr = ticker === 'ACI' ? '₹ INR' : (ticker === 'LXS' ? '€ EUR' : '$ USD');
        displayName = `${ticker} · ${name} (${curr})`;
      } else if (stockViewMode === 'usd') {
        displayName = `${ticker} · ${name} ($/sh)`;
      } else {
        displayName = `${ticker} · ${name} (Base=100)`;
      }
      return {
        key: ticker,
        name: displayName,
        color: colorMap[ticker] || '#285686'
      };
    });
  }, [tickers, competitors, stockViewMode, colorMap]);

  // ---------------------------------------------------------------------------
  // 2B. TOP 5 COMPETITOR DOSSIER & AI EXTRACTIONS
  // ---------------------------------------------------------------------------
  const [dossierSummaries, setDossierSummaries] = useState<CompetitorDossierSummary[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [dossierCache, setDossierCache] = useState<Record<number, CompetitorDossierDetail>>({});
  const [activeDossier, setActiveDossier] = useState<CompetitorDossierDetail | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCompetitorDossiers()
      .then(list => {
        if (!mounted) return;
        const publicPeers = list.filter(d => d.reports_count > 0 || d.ticker);
        setDossierSummaries(publicPeers);
        setSelectedCompId(prev => (prev !== null ? prev : (publicPeers[0]?.id ?? null)));
      })
      .catch(err => {
        console.error('Failed to load competitor dossier summaries:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompId) return;
    if (dossierCache[selectedCompId]) {
      setActiveDossier(dossierCache[selectedCompId]);
      setDossierLoading(false);
      return;
    }
    let mounted = true;
    setDossierLoading(true);
    getCompetitorDossier(selectedCompId)
      .then(detail => {
        if (mounted) {
          setActiveDossier(detail);
          setDossierCache(prev => ({ ...prev, [selectedCompId]: detail }));
        }
      })
      .catch(err => {
        console.error(`Failed to load dossier detail for ID ${selectedCompId}:`, err);
      })
      .finally(() => {
        if (mounted) setDossierLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedCompId, dossierCache]);

  const handleSelectPeer = (peerId: number) => {
    if (peerId === selectedCompId) return;
    setSelectedCompId(peerId);
  };

  const selectedSummary = useMemo(() => {
    return dossierSummaries.find(d => d.id === selectedCompId);
  }, [dossierSummaries, selectedCompId]);

  const peerCfg = useMemo(() => {
    const ticker = selectedSummary?.ticker?.toUpperCase() || activeDossier?.competitor.ticker?.toUpperCase() || '';
    return PEER_CURRENCY_CONFIG[ticker] || {
      nativeCurrency: 'USD',
      symbol: '$',
      flag: '🌐',
      revenueUnit: '$M',
      revenueMultiplier: 1.0,
      pricingMultiplier: 1.0,
      authority: 'Global Standard',
      stockCurrency: 'USD',
      usdToStockFx: 1.0,
      tag: '$ USD Statutory',
    };
  }, [selectedSummary, activeDossier]);

  const chartMetricsData = useMemo(() => {
    if (!activeDossier?.metrics) return [];
    const isNative = currencyMode === 'native';
    const revMult = isNative ? peerCfg.revenueMultiplier : 1.0;
    const priceMult = isNative ? peerCfg.pricingMultiplier : 1.0;

    return activeDossier.metrics
      .filter(m => !m.is_annual)
      .map(m => {
        const revDisplay = m.revenue_usd_m !== null && m.revenue_usd_m !== undefined
          ? Number((m.revenue_usd_m * revMult).toFixed(1))
          : null;
        const ebitdaDisplay = m.ebitda_usd_m !== null && m.ebitda_usd_m !== undefined
          ? Number((m.ebitda_usd_m * revMult).toFixed(1))
          : null;
        const priceDisplay = m.realized_price_per_mt !== null && m.realized_price_per_mt !== undefined
          ? Math.round(m.realized_price_per_mt * priceMult)
          : null;

        return {
          date: m.date,
          period: m.period,
          revenue_display: revDisplay,
          ebitda_display: ebitdaDisplay,
          price_display: priceDisplay,
          revenue_usd_m: m.revenue_usd_m,
          volume_mt: m.volume_mt,
          ebitda_usd_m: m.ebitda_usd_m,
          ebitda_margin_pct: m.ebitda_margin_pct,
          realized_price_per_mt: m.realized_price_per_mt,
          capacity_utilization_pct: m.capacity_utilization_pct,
        };
      });
  }, [activeDossier, currencyMode, peerCfg]);

  // ---------------------------------------------------------------------------
  // 3. REGULATORY FILTERED DATA
  // ---------------------------------------------------------------------------
  const regulatoryNews = newsItems.filter(
    item => (item.intelligence?.category || '').toUpperCase() === 'REGULATION' ||
            /regulat|ministry|inspection|compliance|environmental|customs advisory|ban/i.test(item.title + ' ' + item.summary)
  );

  return (
    <div className="page-shell news-competitors-page">
      {/* Page Header */}
      <header className="subpage-header">
        <div className="subpage-title-row">
          <div>
            <p className="eyebrow">External Market Monitoring</p>
            <h1 className="subpage-title">News & Competitors</h1>
            <p className="subpage-subtitle">
              Live external intelligence tracking global commodity news feeds, listed peer financial health, and environmental compliance notices.
            </p>
          </div>

          <div className="news-action-group">
            <div className="news-status-pill">
              <span className="live-pulse" />
              <small>
                {newsStatus?.scheduler?.is_running ? 'Auto-crawling Active' : 'Crawler Standing By'}
              </small>
              {newsStatus?.database_counts?.total_articles !== undefined && (
                <span className="count-pill">{newsStatus.database_counts.total_articles} Articles</span>
              )}
            </div>

            <button
              className={`trigger-news-btn ${triggering ? 'spinning' : ''}`}
              onClick={handleTrigger}
              disabled={triggering}
            >
              {triggering ? 'Ingesting Feeds...' : '⚡ Scan Feeds'}
            </button>
          </div>
        </div>

        {/* Secondary Sub-Tabs */}
        <div className="secondary-nav-tabs" role="tablist">
          <button
            className={`subtab-btn ${tab === 'news' ? 'active' : ''}`}
            onClick={() => handleTabClick('news')}
            role="tab"
            aria-selected={tab === 'news'}
          >
            📰 Market News ({newsTotal})
          </button>
          <button
            className={`subtab-btn ${tab === 'competitors' ? 'active' : ''}`}
            onClick={() => handleTabClick('competitors')}
            role="tab"
            aria-selected={tab === 'competitors'}
          >
            🏢 Competitor Watch ({competitors.length} Peers)
          </button>
          <button
            className={`subtab-btn ${tab === 'regulatory' ? 'active' : ''}`}
            onClick={() => handleTabClick('regulatory')}
            role="tab"
            aria-selected={tab === 'regulatory'}
          >
            ⚖️ Regulatory & Policy ({regulatoryNews.length})
          </button>
        </div>
      </header>

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
        </section>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SUB-TAB 2: COMPETITORS · INTERACTIVE PUBLIC PEER DOSSIER                  */}
      {/* ========================================================================= */}
      {tab === 'competitors' && (
        <section className="subtab-content">
          <div className="competitor-tracker-section">
            {/* 1. Top 5 Peer Selector Pill Ribbon */}
            <div className="dossier-peer-nav" role="tablist" aria-label="Top 5 Public Competitors">
              {dossierSummaries.map(peer => {
                const isActive = peer.id === selectedCompId;
                const peerColor = (peer.ticker && colorMap[peer.ticker]) || '#0f766e';
                const pCfg = peer.ticker ? PEER_CURRENCY_CONFIG[peer.ticker.toUpperCase()] : undefined;
                return (
                  <button
                    key={peer.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`dossier-peer-pill ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectPeer(peer.id)}
                    style={{
                      borderLeftColor: peerColor,
                      borderColor: isActive ? peerColor : undefined
                    }}
                  >
                    <div className="peer-pill-top">
                      <span className="peer-pill-ticker" style={{ color: peerColor }}>
                        {peer.ticker || 'PEER'}
                      </span>
                      <div className="peer-pill-top-right">
                        {pCfg?.tag && (
                          <span className="peer-currency-badge">{pCfg.symbol} {pCfg.nativeCurrency}</span>
                        )}
                        <span className="peer-pill-country">{peer.country}</span>
                      </div>
                    </div>
                    <strong className="peer-pill-name">{peer.name}</strong>
                    <div className="peer-pill-meta">
                      <small>{peer.reports_count} Reports & Transcripts</small>
                      {isActive && <span className="active-peer-dot" style={{ color: peerColor }}>● Active</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 2. Selected Competitor Executive Scorecard */}
            {selectedSummary && (
              <div className="dossier-scorecard-section">
                <div className="scorecard-title-row">
                  <div className="scorecard-title-left">
                    <h3 className="scorecard-heading">
                      Executive Scorecard: {selectedSummary.name} ({selectedSummary.ticker || 'PEER'})
                    </h3>
                    <span className="scorecard-country-badge">{peerCfg.flag} {selectedSummary.country}</span>
                    <span className="reporting-authority-tag">{peerCfg.authority}</span>
                  </div>

                  <div className="currency-pill-btns" role="group" aria-label="Currency view mode">
                    <button
                      type="button"
                      className={`currency-pill-btn ${currencyMode === 'native' ? 'active' : ''}`}
                      onClick={() => setCurrencyMode('native')}
                    >
                      {peerCfg.flag} Native Statutory ({peerCfg.symbol} {peerCfg.nativeCurrency})
                    </button>
                    <button
                      type="button"
                      className={`currency-pill-btn ${currencyMode === 'usd' ? 'active' : ''}`}
                      onClick={() => setCurrencyMode('usd')}
                    >
                      🌐 Standardized Benchmark ($ USD)
                    </button>
                  </div>
                </div>

                <div className="dossier-scorecard">
                  {/* Card 1: Segment Net Revenue */}
                  <div className="scorecard-metric-card">
                    <span className="scorecard-metric-label">Bromine Segment Net Revenue</span>
                    <div className="scorecard-metric-val">
                      <b>
                        {selectedSummary.scorecard?.latest_revenue_usd_m !== null && selectedSummary.scorecard?.latest_revenue_usd_m !== undefined
                          ? (currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                              ? `₹${(selectedSummary.scorecard.latest_revenue_usd_m * peerCfg.revenueMultiplier).toFixed(1)} Cr`
                              : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                              ? `€${(selectedSummary.scorecard.latest_revenue_usd_m * peerCfg.revenueMultiplier).toFixed(1)}M`
                              : `$${selectedSummary.scorecard.latest_revenue_usd_m.toFixed(1)}M`)
                          : '—'}
                      </b>
                      <small>{currencyMode === 'native' ? peerCfg.nativeCurrency : 'USD'}</small>
                    </div>
                    <span className="scorecard-metric-sub">
                      {currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? `~$${selectedSummary.scorecard?.latest_revenue_usd_m?.toFixed(1)}M USD parity · ${selectedSummary.scorecard?.period || 'Q1 FY26'}`
                        : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                        ? `~$${selectedSummary.scorecard?.latest_revenue_usd_m?.toFixed(1)}M USD parity · ${selectedSummary.scorecard?.period || 'Q1 2026'}`
                        : peerCfg.nativeCurrency === 'INR'
                        ? `Native Statutory: ₹${((selectedSummary.scorecard?.latest_revenue_usd_m || 0) * peerCfg.revenueMultiplier).toFixed(1)} Cr INR`
                        : `Latest Period: ${selectedSummary.scorecard?.period || 'Q1 2026'}`}
                    </span>
                  </div>

                  {/* Card 2: Operating EBITDA & Margin */}
                  <div className="scorecard-metric-card">
                    <span className="scorecard-metric-label">Operating EBITDA & Margin</span>
                    <div className="scorecard-metric-val">
                      <b>
                        {selectedSummary.scorecard?.latest_ebitda_usd_m !== null && selectedSummary.scorecard?.latest_ebitda_usd_m !== undefined
                          ? (currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                              ? `₹${(selectedSummary.scorecard.latest_ebitda_usd_m * peerCfg.revenueMultiplier).toFixed(1)} Cr`
                              : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                              ? `€${(selectedSummary.scorecard.latest_ebitda_usd_m * peerCfg.revenueMultiplier).toFixed(1)}M`
                              : `$${selectedSummary.scorecard.latest_ebitda_usd_m.toFixed(1)}M`)
                          : '—'}
                      </b>
                      {selectedSummary.scorecard?.latest_margin_pct !== null && selectedSummary.scorecard?.latest_margin_pct !== undefined && (
                        <span className="scorecard-margin-badge">
                          {selectedSummary.scorecard.latest_margin_pct.toFixed(1)}% Margin
                        </span>
                      )}
                    </div>
                    <span className="scorecard-metric-sub">
                      {currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? `Structural Operating Yield (₹ Crores · ${selectedSummary.scorecard?.period || 'Q1 FY26'})`
                        : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                        ? `European Additive Operational Yield · ${selectedSummary.scorecard?.period || 'Q1 2026'}`
                        : peerCfg.nativeCurrency === 'INR'
                        ? `Native EBITDA: ₹${((selectedSummary.scorecard?.latest_ebitda_usd_m || 0) * peerCfg.revenueMultiplier).toFixed(1)} Cr INR`
                        : 'Structural Operating Yield'}
                    </span>
                  </div>

                  {/* Card 3: Dispatched Sales Volume */}
                  <div className="scorecard-metric-card">
                    <span className="scorecard-metric-label">Dispatched Sales Volume</span>
                    <div className="scorecard-metric-val">
                      <b>
                        {selectedSummary.scorecard?.latest_volume_mt !== null && selectedSummary.scorecard?.latest_volume_mt !== undefined
                          ? selectedSummary.scorecard.latest_volume_mt.toLocaleString()
                          : '—'}
                      </b>
                      <small>MT</small>
                    </div>
                    <span className="scorecard-metric-sub">
                      {selectedSummary.scorecard?.latest_utilization_pct
                        ? `Plant Run-Rate: ${selectedSummary.scorecard.latest_utilization_pct}%`
                        : 'Physical Offtake Volume'}
                    </span>
                  </div>

                  {/* Card 4: Realized Pricing Benchmark */}
                  <div className="scorecard-metric-card">
                    <span className="scorecard-metric-label">Realized Pricing Benchmark</span>
                    <div className="scorecard-metric-val">
                      <b>
                        {selectedSummary.scorecard?.latest_price_per_mt !== null && selectedSummary.scorecard?.latest_price_per_mt !== undefined
                          ? (currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                              ? `₹${Math.round(selectedSummary.scorecard.latest_price_per_mt * peerCfg.pricingMultiplier).toLocaleString()}`
                              : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                              ? `€${Math.round(selectedSummary.scorecard.latest_price_per_mt * peerCfg.pricingMultiplier).toLocaleString()}`
                              : `$${selectedSummary.scorecard.latest_price_per_mt.toLocaleString()}`)
                          : '—'}
                      </b>
                      <small>/ MT</small>
                      {currencyMode === 'native' && peerCfg.nativeCurrency === 'INR' && selectedSummary.scorecard?.latest_price_per_mt && (
                        <span className="domestic-rate-badge">
                          ₹{((selectedSummary.scorecard.latest_price_per_mt * peerCfg.pricingMultiplier) / 1000).toFixed(1)} / kg
                        </span>
                      )}
                    </div>
                    <span className="scorecard-metric-sub">
                      {currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? `~$${selectedSummary.scorecard?.latest_price_per_mt?.toLocaleString()}/MT import parity · Gujarat spot contract baseline`
                        : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                        ? `~$${selectedSummary.scorecard?.latest_price_per_mt?.toLocaleString()}/MT global parity`
                        : peerCfg.nativeCurrency === 'INR'
                        ? `Native Domestic: ₹${((Number(selectedSummary.scorecard?.latest_price_per_mt || 0) * peerCfg.pricingMultiplier) / 1000).toFixed(1)} / kg (₹${Math.round(Number(selectedSummary.scorecard?.latest_price_per_mt || 0) * peerCfg.pricingMultiplier).toLocaleString()}/MT)`
                        : (selectedSummary.strategic_pulse || 'Primary Contract Baseline')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI-Generated 4-Chart Financial & Operational Matrix */}
            <div className="dossier-charts-block">
              <div className="dossier-subheading">
                <div>
                  <h3 className="subheading-title">
                    Financial & Operational Matrix: {selectedSummary?.name || activeDossier?.competitor.name || 'Selected Competitor'}
                  </h3>
                  <p className="subheading-desc">
                    {currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                      ? 'Extracted from BSE/NSE statutory filings and concalls (values expressed in Indian Rupees: ₹ Crores and ₹/MT).'
                      : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                      ? 'Extracted from Deutsche Börse statutory accounts (values expressed in Euros: € Millions and €/MT).'
                      : 'Standardized quarterly and annual time series extracted from regulatory filings (2024–2026).'}
                  </p>
                </div>
              </div>

              {dossierLoading ? (
                <div className="news-loading-placeholder">
                  <div className="spinner-icon" />
                  <p>Synthesizing competitor disclosures and time series...</p>
                </div>
              ) : chartMetricsData.length > 0 ? (
                <div className="competitor-chart-matrix">
                  {/* Chart 1: Segment Revenue */}
                  <TrendChart
                    title={
                      currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? 'Bromine Segment Revenue (₹ Cr)'
                        : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                        ? 'Bromine Segment Revenue (€M)'
                        : 'Bromine Segment Revenue ($M)'
                    }
                    unit={currencyMode === 'native' ? (peerCfg.nativeCurrency === 'INR' ? 'INR Crores (₹ Cr)' : peerCfg.nativeCurrency === 'EUR' ? 'EUR Millions (€M)' : 'USD Millions ($M)') : 'USD Millions ($M)'}
                    data={chartMetricsData}
                    series={[
                      {
                        key: 'revenue_display',
                        name: `Net Segment Revenue (${currencyMode === 'native' ? peerCfg.revenueUnit : '$M'})`,
                        color: '#0f766e',
                        kind: 'bar'
                      }
                    ]}
                    annotation={
                      currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? 'Reported revenue converted to ₹ Crores per Indian statutory standard (1 USD M ≈ ₹8.35 Cr).'
                        : 'Quarterly and annual reported bromine and specialty chemical revenues.'
                    }
                  />

                  {/* Chart 2: Dispatched Volumes & Capacity Utilization */}
                  <TrendChart
                    title="Sales Volume & Capacity Run-Rate"
                    unit="MT · % Capacity Run-Rate"
                    data={chartMetricsData}
                    series={[
                      {
                        key: 'volume_mt',
                        name: 'Sales Volume (MT)',
                        color: '#2563eb',
                        kind: 'bar'
                      },
                      {
                        key: 'capacity_utilization_pct',
                        name: 'Capacity Run-Rate (%)',
                        color: '#d97706',
                        axis: 'right'
                      }
                    ]}
                    annotation="Dispatched physical volume alongside operating plant utilization rate."
                  />

                  {/* Chart 3: Segment EBITDA & Margin */}
                  <TrendChart
                    title={
                      currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? 'Segment EBITDA & Margin (₹ Cr)'
                        : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                        ? 'Segment EBITDA & Margin (€M)'
                        : 'Segment EBITDA & Operating Margin ($M)'
                    }
                    unit={`${currencyMode === 'native' ? peerCfg.revenueUnit : 'USD Millions'} · % Margin`}
                    data={chartMetricsData}
                    series={[
                      {
                        key: 'ebitda_display',
                        name: `Segment EBITDA (${currencyMode === 'native' ? peerCfg.revenueUnit : '$M'})`,
                        color: '#16a34a',
                        kind: 'bar'
                      },
                      {
                        key: 'ebitda_margin_pct',
                        name: 'EBITDA Margin (%)',
                        color: '#7c3aed',
                        axis: 'right'
                      }
                    ]}
                    annotation="Reported operational profitability and margin discipline."
                  />

                  {/* Chart 4: Realized Price Trajectory */}
                  <TrendChart
                    title={
                      currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? 'Realized Selling Price (₹ / MT)'
                        : currencyMode === 'native' && peerCfg.nativeCurrency === 'EUR'
                        ? 'Realized Selling Price (€ / MT)'
                        : 'Realized Selling Price ($ / MT)'
                    }
                    unit={currencyMode === 'native' ? (peerCfg.nativeCurrency === 'INR' ? 'INR / Metric Ton (₹)' : peerCfg.nativeCurrency === 'EUR' ? 'EUR / Metric Ton (€)' : 'USD / Metric Ton ($)') : 'USD / Metric Ton ($)'}
                    data={chartMetricsData}
                    series={[
                      {
                        key: 'price_display',
                        name: `Realized Price (${currencyMode === 'native' ? (peerCfg.symbol + '/MT') : '$/MT'})`,
                        color: '#dc2626'
                      }
                    ]}
                    annotation={
                      currencyMode === 'native' && peerCfg.nativeCurrency === 'INR'
                        ? 'Domestic realization (₹/MT). Divide by 1,000 for ₹/kg domestic merchant benchmark.'
                        : 'Average realized contract and merchant pricing across observation points.'
                    }
                  />
                </div>
              ) : (
                <EmptyState title="No financial metrics available for this peer." />
              )}
            </div>

            {/* 4. AI Strategic Findings & Direct Transcript Quotes */}
            {activeDossier?.findings && activeDossier.findings.length > 0 && (
              <div className="dossier-findings-block">
                <div className="dossier-subheading">
                  <div>
                    <h3 className="subheading-title">
                      C-Suite Earnings Call Transcripts & Strategic Findings
                    </h3>
                    <p className="subheading-desc">
                      Executive statements on pricing floors, market bottom inflection points, capex allocations, and actionable implications for Agrocel.
                    </p>
                  </div>
                </div>

                <div className="dossier-findings-grid">
                  {activeDossier.findings.map(finding => (
                    <article key={finding.id} className="transcript-finding-card">
                      <header className="finding-card-head">
                        <div className="finding-tags">
                          <span className={`finding-category-tag tag-${finding.category.toLowerCase()}`}>
                            {finding.category.replace(/_/g, ' ')}
                          </span>
                          <span className={`finding-sentiment-tag sentiment-${finding.sentiment.toLowerCase()}`}>
                            {finding.sentiment}
                          </span>
                          <span className="finding-period-tag">{finding.period}</span>
                        </div>
                      </header>

                      <h4 className="finding-headline">{finding.headline}</h4>
                      <p className="finding-summary">{finding.summary}</p>

                      {finding.transcript_quote && (
                        <blockquote className="transcript-blockquote">
                          <span className="quote-mark">“</span>
                          <p>{finding.transcript_quote}</p>
                          {finding.speaker && (
                            <cite className="transcript-speaker">— {finding.speaker}</cite>
                          )}
                        </blockquote>
                      )}

                      {finding.agrocel_takeaway && (
                        <div className="agrocel-takeaway-box">
                          <div className="takeaway-header">
                            <span>🎯 Agrocel Commercial Implication</span>
                          </div>
                          <p className="takeaway-body">{finding.agrocel_takeaway}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Official Regulatory Filing & Disclosure Library */}
            {activeDossier?.reports && activeDossier.reports.length > 0 && (
              <div className="filing-library-block">
                <div className="dossier-subheading">
                  <div>
                    <h3 className="subheading-title">
                      Regulatory Filing & Document Archive ({activeDossier.reports.length})
                    </h3>
                    <p className="subheading-desc">
                      Verified statutory disclosures submitted to securities commissions and stock exchanges.
                    </p>
                  </div>
                </div>

                <div className="filing-library-grid">
                  {activeDossier.reports.map(report => (
                    <article key={report.id} className="filing-doc-card">
                      <div className="filing-doc-top">
                        <span className="filing-type-pill">{report.report_type.replace(/_/g, ' ')}</span>
                        <span className="filing-authority-tag">{report.filing_authority}</span>
                        <span className="filing-date-text">{report.filing_date}</span>
                      </div>

                      <h4 className="filing-doc-title">{report.title}</h4>
                      <p className="filing-doc-summary">{report.highlights}</p>

                      <div className="filing-topics-row">
                        {(report.key_topics || '').split(',').map((topic, i) => (
                          <span key={i} className="filing-topic-pill">
                            {topic.trim()}
                          </span>
                        ))}
                      </div>

                      {report.source_url && (
                        <div className="filing-doc-footer">
                          <a
                            href={report.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="filing-external-link"
                          >
                            Access Filing Source ↗
                          </a>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Competitor Equity Price Trajectory */}
            {stocks.length > 0 && (
              <div className="peer-chart-wrap" style={{ marginTop: 36 }}>
                <div className="dossier-subheading">
                  <div>
                    <h3 className="subheading-title">Competitor Equity Price Trajectory</h3>
                    <p className="subheading-desc">
                      Comparative market valuation trends across domestic (ACI) and multinational peers (ICL, GURE, ALB, LXS).
                    </p>
                  </div>
                  <div className="stock-view-switcher" role="group" aria-label="Stock chart view mode">
                    <button
                      type="button"
                      className={`stock-view-btn ${stockViewMode === 'indexed' ? 'active' : ''}`}
                      onClick={() => setStockViewMode('indexed')}
                      title="Normalize all peers to 100 on start date to compare relative percentage performance without currency scale distortion"
                    >
                      📈 Indexed % (Base = 100)
                    </button>
                    <button
                      type="button"
                      className={`stock-view-btn ${stockViewMode === 'usd' ? 'active' : ''}`}
                      onClick={() => setStockViewMode('usd')}
                      title="Convert all prices to USD/share using exchange rates (e.g. ~$8.40 for ACI) to compare absolute levels"
                    >
                      💵 USD Converted ($/sh)
                    </button>
                    <button
                      type="button"
                      className={`stock-view-btn ${stockViewMode === 'native' ? 'active' : ''}`}
                      onClick={() => setStockViewMode('native')}
                      title="Show raw exchange closing prices in their respective local currencies"
                    >
                      💱 Native Currencies
                    </button>
                  </div>
                </div>
                <TrendChart
                  title={
                    stockViewMode === 'indexed'
                      ? 'Competitor Equity Performance (Indexed Base = 100)'
                      : stockViewMode === 'usd'
                      ? 'Competitor Stock Price Trajectory (USD Converted $/share)'
                      : 'Competitor Stock Price Trajectory (Native Currencies)'
                  }
                  unit={stockUnit}
                  data={activeStockData}
                  series={stockSeries}
                  annotation={
                    stockViewMode === 'indexed'
                      ? 'Base = 100 benchmark allows fair relative % return comparison across Indian Rupees (ACI) and US Dollars (ICL, GURE).'
                      : stockViewMode === 'usd'
                      ? 'ACI closing prices converted to USD ($/share) using exchange rates (~83.5 INR/USD).'
                      : 'Raw closing prices on local exchanges (ACI trades in ₹ INR on NSE/BSE; ICL & GURE trade in $ USD).'
                  }
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REGULATORY                                                     */}
      {/* ========================================================================= */}
      {tab === 'regulatory' && (
        <section className="subtab-content">
          <div className="regulatory-section-wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Government & Environmental Mandates</p>
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
                  <small>Regulated data ingestion points verified for Bromine compliance monitoring.</small>
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
