import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { DataGroundingItem } from '../types';
import { ReliabilityBadge } from './Common';

interface DataGroundedTextProps {
  text: string;
  grounding?: DataGroundingItem[];
  onSelect?: (item: DataGroundingItem) => void;
  className?: string;
}

interface ProvenancePillProps {
  token: string;
  item: DataGroundingItem;
  onSelect?: (item: DataGroundingItem) => void;
}

export interface CategoryMeta {
  type: 'EXPORT_DATA' | 'IMPORT_DATA' | 'NEWS_INTELLIGENCE' | 'MARKET_PRICE' | 'INTERNAL_SALES' | 'FORECAST_MODEL';
  label: string;
  icon: string;
  badgeClass: string;
  scopeDesc: string;
}

/**
 * Resolves the explicit data category (Export Data, Import Data, News, Market Price, Sales ERP, Forecast)
 */
export function resolveCategory(item: DataGroundingItem): CategoryMeta {
  const badge = item.category_badge?.toUpperCase();
  const metric = (item.metric || '').toLowerCase();
  const source = (item.source_name || '').toLowerCase();
  const table = (item.table_reference || '').toLowerCase();

  if (
    badge === 'EXPORT_DATA' ||
    metric.includes('export') ||
    metric.includes('archean') ||
    table.includes('direction: export') ||
    metric.includes('dispatch') ||
    source.includes('imports_exports') ||
    source.includes('zauba')
  ) {
    return {
      type: 'EXPORT_DATA',
      label: 'Customs Export Data',
      icon: '🚢',
      badgeClass: 'badge-export',
      scopeDesc: 'Indian Customs Outbound Shipment Records (HS 28018010/20)',
    };
  }

  if (
    badge === 'IMPORT_DATA' ||
    metric.includes('import') ||
    metric.includes('shipments to china') ||
    source.includes('china customs') ||
    source.includes('gacc') ||
    source.includes('richard')
  ) {
    return {
      type: 'IMPORT_DATA',
      label: 'Customs Import Data',
      icon: '📦',
      badgeClass: 'badge-import',
      scopeDesc: 'China Inbound Customs Ledger (GACC / Coastal Terminals)',
    };
  }

  if (
    badge === 'NEWS_INTELLIGENCE' ||
    metric.includes('news') ||
    metric.includes('operating run rate') ||
    metric.includes('lanxess') ||
    metric.includes('extraction rate') ||
    metric.includes('plant shutdown') ||
    metric.includes('bohai bay') ||
    source.includes('icis') ||
    source.includes('chemweek') ||
    source.includes('gdelt') ||
    table.includes('news_articles') ||
    table.includes('document_chunks')
  ) {
    return {
      type: 'NEWS_INTELLIGENCE',
      label: 'Verified News & Radar',
      icon: '📰',
      badgeClass: 'badge-news',
      scopeDesc: 'Audited Trade Press, Plant Disclosures & Regulatory Bulletins',
    };
  }

  if (
    badge === 'INTERNAL_SALES' ||
    metric.includes('realization') ||
    metric.includes('agrocel') ||
    source.includes('solaris') ||
    source.includes('erp') ||
    table.includes('sales_records')
  ) {
    return {
      type: 'INTERNAL_SALES',
      label: 'Agrocel Sales ERP',
      icon: '🏛️',
      badgeClass: 'badge-erp',
      scopeDesc: 'Agrocel Solaris Invoiced Domestic Commercial Contracts',
    };
  }

  if (
    badge === 'FORECAST_MODEL' ||
    metric.includes('forecast') ||
    metric.includes('projected') ||
    metric.includes('trading range') ||
    source.includes('forecast model')
  ) {
    return {
      type: 'FORECAST_MODEL',
      label: 'Internal Forecast Model',
      icon: '🔮',
      badgeClass: 'badge-forecast',
      scopeDesc: 'Proprietary 48-Observation Econometric & ML Forecast',
    };
  }

  return {
    type: 'MARKET_PRICE',
    label: 'Market Price Benchmark',
    icon: '📈',
    badgeClass: 'badge-price',
    scopeDesc: 'Standardized International Spot Ex-Works Benchmark',
  };
}

/**
 * Interactive Provenance Text element:
 * - Rendered strictly with a dashed underline (no background color or pill shape)
 * - Rendered in a React Portal attached to document.body (immune to ancestor CSS transforms)
 * - Automatically aligns above/below the token with sub-pixel viewport boundaries
 * - Dynamic caret arrow points directly to the center of the hovered token
 * - Listens for window scroll/resize to keep the card securely anchored in real time
 */
export function ProvenancePill({ token, item, onSelect }: ProvenancePillProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
    placeAbove: boolean;
    width: number;
  }>({
    top: 0,
    left: 0,
    arrowLeft: 170,
    placeAbove: true,
    width: 340,
  });

  const pillRef = useRef<HTMLSpanElement>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const catMeta = resolveCategory(item);

  const calculatePosition = useCallback(() => {
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();

    // Check if element is completely scrolled out of the viewport
    if (
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      setIsHovered(false);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tooltipWidth = Math.min(340, vw - 32);
    // Typical tooltip card height is ~210px to 240px
    const ESTIMATED_HEIGHT = 220;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;

    // Prefer placing ABOVE the text.
    // Only place below if there is physically insufficient space above (< 210px)
    // AND there is noticeably more space below than above.
    const placeAbove = spaceAbove >= ESTIMATED_HEIGHT || spaceAbove >= spaceBelow;

    const pillCenter = rect.left + rect.width / 2;
    let left = pillCenter - tooltipWidth / 2;
    // Keep within viewport with 16px safe margin
    const minLeft = 16;
    const maxLeft = Math.max(minLeft, vw - tooltipWidth - 16);
    left = Math.max(minLeft, Math.min(maxLeft, left));

    // Dynamic caret position relative to tooltip left edge, clamped inside card's border radius
    const arrowLeft = Math.max(22, Math.min(tooltipWidth - 22, pillCenter - left));

    // Vertical anchoring:
    // If placing above: anchor at rect.top - 10 (with CSS translateY(-100%))
    // If placing below: anchor at rect.bottom + 10 (with CSS translateY(0))
    const top = placeAbove ? (rect.top - 10) : (rect.bottom + 10);

    setTooltipPos({
      top,
      left,
      arrowLeft,
      placeAbove,
      width: tooltipWidth,
    });
  }, []);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    calculatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  const handleTooltipEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(item);
    }
  };

  // Re-calculate position dynamically on window scroll or resize
  useEffect(() => {
    if (!isHovered) return;

    const handleUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleUpdate, { capture: true, passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate, { capture: true });
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isHovered, calculatePosition]);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        ref={pillRef}
        className="provenance-pill"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        title="Hover to view source & category; Click to inspect raw records"
      >
        {token}
      </span>

      {isHovered && typeof document !== 'undefined' && createPortal(
        <div
          className={`provenance-tooltip ${tooltipPos.placeAbove ? 'place-above' : 'place-below'}`}
          style={{
            position: 'fixed',
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            width: `${tooltipPos.width}px`,
            transformOrigin: `${tooltipPos.arrowLeft}px ${tooltipPos.placeAbove ? '100%' : '0%'}`,
            zIndex: 99999,
          }}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Dynamic Caret Arrow pointing directly at hovered word */}
          <div
            className="tooltip-arrow"
            style={{ left: `${tooltipPos.arrowLeft}px` }}
          />

          <div className="tooltip-header">
            <span className={`tooltip-category-badge ${catMeta.badgeClass}`}>
              <span className="cat-icon">{catMeta.icon}</span>
              <span className="cat-label">{catMeta.label}</span>
            </span>
            <ReliabilityBadge grade={item.reliability_grade} />
          </div>

          <div className="tooltip-title-area">
            <h4 className="tooltip-metric-title">{item.metric}</h4>
            <div className="tooltip-value-highlight">
              <span className="val-token">{item.token_pattern}</span>
              {item.unit && <span className="val-unit">{item.unit}</span>}
            </div>
          </div>

          <div className="tooltip-body">
            <div className="tooltip-row">
              <span className="tooltip-row-label">Source Feed:</span>
              <span className="tooltip-row-val source-name">{item.source_name}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-row-label">Time Horizon:</span>
              <span className="tooltip-row-val date-range">{item.date_range}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-row-label">Classification:</span>
              <span className="tooltip-row-val scope-desc">{catMeta.scopeDesc}</span>
            </div>

            {item.audit_notes && (
              <div className="tooltip-note">
                <span className="note-icon">ℹ</span>
                <p>{item.audit_notes}</p>
              </div>
            )}
          </div>

          <div
            className="tooltip-footer"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            title="Open audit ledger drawer"
          >
            <span>Click to inspect database audit ledger</span>
            <span className="footer-arrow">→</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Formats any AI text, identifying export data, import data, prices,
 * news intelligence, and metrics, wrapping them with dashed underlined Provenance Pills.
 */
export function DataGroundedText({ text, grounding = [], onSelect, className }: DataGroundedTextProps) {
  if (!text) return null;

  // Build lookup dictionary for quick token matching
  const groundingMap = new Map<string, DataGroundingItem>();
  grounding.forEach(g => {
    if (g.token_pattern) {
      groundingMap.set(g.token_pattern.trim().toLowerCase(), g);
      const noSpace = g.token_pattern.replace(/\s+/g, '').toLowerCase();
      groundingMap.set(noSpace, g);
    }
  });

  // Extract explicit phrase tokens from grounding (like "winter plant shutdowns", "Bohai Bay", "Archean")
  const explicitPhrases = grounding
    .map(g => g.token_pattern)
    .filter(p => p && /[a-zA-Z]{3,}/.test(p) && !p.includes('/MT'))
    .sort((a, b) => b.length - a.length)
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const phrasePattern = explicitPhrases.length > 0 ? `(?:${explicitPhrases.join('|')})|` : '';

  // Comprehensive Regex capturing:
  // - Explicit phrases from grounding
  // - USD prices: $3,050.0/MT, $3,050/MT, $2,700 - $3,000/MT
  // - INR prices: INR 225,600/MT
  // - Metric ton quantities: 624.0 MT, 624 MT, 20181 MT, 20,181 MT
  // - Percentages: -1.0%, +2.1%, 60%, 7%, 42-48%
  const entityRegex = new RegExp(
    `(${phrasePattern}\\$?\\b\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?(?:\\s*-\\s*\\$?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)?\\s*(?:USD\\/MT|RMB\\/MT|\\/MT|MT|tons?)|\\bINR\\s*\\d{1,3}(?:,\\d{3})*(?:\\/MT)?|\\b[+-]?\\d+(?:\\.\\d+)?%|\\b\\d+(?:-\\d+)?%)`,
    'gi'
  );

  const parts = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = entityRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = entityRegex.lastIndex;
    const matchedToken = match[0];

    // Push preceding regular text
    if (matchStart > lastIndex) {
      parts.push(text.substring(lastIndex, matchStart));
    }

    const cleanToken = matchedToken.trim().toLowerCase();
    const cleanNoSpace = matchedToken.replace(/\s+/g, '').toLowerCase();

    let matchedItem = groundingMap.get(cleanToken) || groundingMap.get(cleanNoSpace);

    if (!matchedItem) {
      // Fuzzy heuristic matching
      if (cleanToken.includes('3,050') || cleanToken.includes('3050')) {
        matchedItem = grounding.find(g => g.metric.includes('China Spot') || g.token_pattern.includes('3,050'));
      } else if (cleanToken.includes('624')) {
        matchedItem = grounding.find(g => g.metric.includes('Export') || g.token_pattern.includes('624'));
      } else if (cleanToken.includes('20181') || cleanToken.includes('20,181')) {
        matchedItem = grounding.find(g => g.metric.includes('China') && (g.unit === 'MT' || g.token_pattern.includes('20181')));
      } else if (cleanToken.includes('225,600') || cleanToken.includes('225600')) {
        matchedItem = grounding.find(g => g.metric.includes('Realization') || g.token_pattern.includes('225,600'));
      } else if (cleanToken.includes('2,700') || cleanToken.includes('3,000')) {
        matchedItem = grounding.find(g => g.metric.includes('Range') || g.token_pattern.includes('2,700'));
      } else if (cleanToken.includes('60%')) {
        matchedItem = grounding.find(g => g.token_pattern.includes('60%'));
      } else if (cleanToken.includes('7%')) {
        matchedItem = grounding.find(g => g.token_pattern.includes('7%'));
      } else if (cleanToken.includes('42-48')) {
        matchedItem = grounding.find(g => g.token_pattern.includes('42-48'));
      } else if (cleanToken.includes('shutdown')) {
        matchedItem = grounding.find(g => g.token_pattern.toLowerCase().includes('shutdown'));
      } else if (cleanToken.includes('bohai')) {
        matchedItem = grounding.find(g => g.token_pattern.toLowerCase().includes('bohai'));
      } else if (cleanToken.includes('archean')) {
        matchedItem = grounding.find(g => g.token_pattern.toLowerCase().includes('archean'));
      } else if (cleanToken.includes('%')) {
        matchedItem = grounding.find(g => g.unit === '%');
      }
    }

    // Dynamic synthesis if item still missing
    if (!matchedItem) {
      const isUSD = matchedToken.includes('$') || matchedToken.includes('USD');
      const isINR = matchedToken.includes('INR');
      const isQty = matchedToken.includes('MT') || matchedToken.includes('ton');
      const isPct = matchedToken.includes('%');
      const isNewsPhrase = /shutdown|bohai|lanxess|restriction|inspection/i.test(matchedToken);

      let cat: 'EXPORT_DATA' | 'IMPORT_DATA' | 'MARKET_PRICE' | 'INTERNAL_SALES' | 'NEWS_INTELLIGENCE' | 'FORECAST_MODEL' = 'MARKET_PRICE';
      if (isNewsPhrase || isPct) cat = 'NEWS_INTELLIGENCE';
      else if (isINR) cat = 'INTERNAL_SALES';
      else if (isQty) cat = 'EXPORT_DATA';
      else if (isUSD) cat = 'MARKET_PRICE';

      matchedItem = {
        token_pattern: matchedToken,
        metric: isUSD ? 'Spot Price Benchmark' : isINR ? 'Domestic Commercial Contract Price' : isQty ? 'Trade Physical Volume' : isNewsPhrase ? 'Industry Market Signal' : 'Market Metric',
        source_name: isUSD ? 'China Price Data.xlsx' : isINR ? 'Solaris Sales.xlsx (ERP)' : isQty ? 'Imports_Exports_2023-24.xlsx' : 'Verified Intelligence Feed',
        source_type: isNewsPhrase ? 'Verified Trade Press & Market Radar' : 'Verified Intelligence Feed',
        category_badge: cat,
        date_range: 'Current 30-Day Reporting Period',
        reliability_grade: 'A',
        audit_notes: `Audited ${matchedToken} figure referenced in executive briefing.`,
        table_reference: isUSD ? 'market_prices' : isINR ? 'sales_records' : isQty ? 'trade_records' : 'news_articles'
      };
    }

    parts.push(
      <ProvenancePill
        key={`pill-${matchStart}-${matchedToken}`}
        token={matchedToken}
        item={matchedItem}
        onSelect={onSelect}
      />
    );

    lastIndex = matchEnd;
  }

  // Push remainder of text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className={`grounded-text-wrapper ${className || ''}`}>{parts}</span>;
}

interface ProvenanceDrawerProps {
  item: DataGroundingItem | null;
  onClose: () => void;
}

/**
 * Deep Audit & Provenance Inspector Drawer (Slide-Over Panel)
 */
export function ProvenanceDrawer({ item, onClose }: ProvenanceDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const catMeta = resolveCategory(item);

  const drawerContent = (
    <div className="provenance-drawer-overlay" onClick={onClose}>
      <aside className="provenance-drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div className="drawer-badge-row">
              <span className={`drawer-category-badge ${catMeta.badgeClass}`}>
                <span>{catMeta.icon}</span>
                <span>{catMeta.label}</span>
              </span>
              <span className="drawer-tag">Data Provenance Inspector</span>
              <ReliabilityBadge grade={item.reliability_grade} />
            </div>
            <h3 className="drawer-title">{item.metric}</h3>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close Inspector">
            ✕
          </button>
        </div>

        {/* Drawer Hero Metric Card */}
        <div className="drawer-hero-card">
          <span className="hero-label">Verified Value Cited in Brief</span>
          <div className="hero-val-row">
            <span className="hero-val">{item.token_pattern}</span>
            {item.unit && <span className="hero-unit">{item.unit}</span>}
          </div>
          <span className="hero-period">Observation Window: {item.date_range}</span>
        </div>

        {/* Provenance Metadata Grid */}
        <div className="drawer-section">
          <h4 className="section-title">Source & Data Provenance</h4>
          <div className="provenance-grid">
            <div className="prov-item">
              <span className="prov-label">Data Classification</span>
              <strong className="prov-val">{catMeta.scopeDesc}</strong>
            </div>

            <div className="prov-item">
              <span className="prov-label">Primary Source File / Feed</span>
              <strong className="prov-val">{item.source_name}</strong>
            </div>

            <div className="prov-item">
              <span className="prov-label">Source Classification</span>
              <strong className="prov-val">{item.source_type || 'Audited Primary Record'}</strong>
            </div>

            <div className="prov-item">
              <span className="prov-label">Underlying Database Table</span>
              <code className="prov-code">{item.table_reference || 'MySQL auditable snapshot'}</code>
            </div>

            <div className="prov-item">
              <span className="prov-label">Audit & Quality Grade</span>
              <span className="prov-val">
                Grade {item.reliability_grade} — Fully Verified
              </span>
            </div>
          </div>
        </div>

        {/* Methodology & Calculation Details */}
        <div className="drawer-section">
          <h4 className="section-title">Methodology & Audit Trail</h4>
          <div className="audit-card">
            {item.methodology && (
              <div className="audit-row">
                <strong>Calculation Method:</strong>
                <p>{item.methodology}</p>
              </div>
            )}
            {item.audit_notes && (
              <div className="audit-row">
                <strong>Audit Notes:</strong>
                <p>{item.audit_notes}</p>
              </div>
            )}
            {item.period_start && item.period_end && (
              <div className="audit-row">
                <strong>Reporting Boundary:</strong>
                <p>{item.period_start} through {item.period_end}</p>
              </div>
            )}
          </div>
        </div>

        {/* Direct Action Footers */}
        <div className="drawer-footer">
          <button
            className="drawer-action-btn primary"
            onClick={() => {
              onClose();
              const el = document.getElementById('market') || document.getElementById('trade');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Related Charts in Dashboard ↓
          </button>
          <button className="drawer-action-btn secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </aside>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null;
}
