import React, { useEffect, useRef } from 'react';

export interface StatusIndicatorItem {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'critical' | 'accent';
  dot?: boolean | string; // true for default green dot, or specific color string 'green' | 'amber' | 'red' | 'blue'
  tooltip?: string;
}

export interface NavSectionItem {
  id: string;
  label: string;
  badge?: string | number;
  onClick?: () => void;
}

interface PageHeaderProps {
  breadcrumb?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
}

interface IntelligenceStatusStripProps {
  items: StatusIndicatorItem[];
}

interface SectionNavProps {
  items: NavSectionItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  ariaLabel?: string;
}

/**
 * Level 1 — Page Header
 * Renders the page title, optional breadcrumb, and aligned executive actions.
 */
export function PageHeader({ breadcrumb, title, actions }: PageHeaderProps) {
  return (
    <div className="exec-level1-header">
      <div className="elh-title-column">
        {breadcrumb && <div className="elh-breadcrumb">{breadcrumb}</div>}
        <h1 className="elh-title">{title}</h1>
      </div>
      {actions && <div className="elh-actions-group">{actions}</div>}
    </div>
  );
}

/**
 * Level 2 — Intelligence Status Strip
 * Renders essential business indicators in a single, compact, structured status strip.
 */
export function IntelligenceStatusStrip({ items }: IntelligenceStatusStripProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="exec-level2-status-strip" role="region" aria-label="Intelligence Status">
      {items.map((item, idx) => {
        let dotClass = '';
        if (item.dot === true || item.dot === 'green') dotClass = 'dot-green';
        else if (item.dot === 'amber') dotClass = 'dot-amber';
        else if (item.dot === 'red') dotClass = 'dot-red';
        else if (item.dot === 'blue') dotClass = 'dot-blue';

        return (
          <div
            key={idx}
            className={`esis-item ${item.tone ? `tone-${item.tone}` : ''}`}
            title={item.tooltip}
          >
            <span className="esis-label">{item.label}</span>
            <div className="esis-val-wrapper">
              {item.dot && <span className={`esis-dot ${dotClass}`} />}
              <span className="esis-value">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Level 3 — Section Navigation
 * Minimal, integrated sticky horizontal navigation with clear active tab indicator.
 */
export function SectionNav({
  items,
  activeId,
  onSelect,
  ariaLabel = 'Section Navigation'
}: SectionNavProps) {
  const navTrackRef = useRef<HTMLDivElement>(null);

  // Keep active tab visible in horizontal scroll view if needed
  useEffect(() => {
    if (!navTrackRef.current) return;
    const activeBtn = navTrackRef.current.querySelector<HTMLElement>(`.esn-tab[data-id="${activeId}"]`);
    if (activeBtn) {
      const track = navTrackRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnRight = btnLeft + activeBtn.offsetWidth;
      if (btnLeft < track.scrollLeft) {
        track.scrollTo({ left: btnLeft - 16, behavior: 'smooth' });
      } else if (btnRight > track.scrollLeft + track.clientWidth) {
        track.scrollTo({ left: btnRight - track.clientWidth + 16, behavior: 'smooth' });
      }
    }
  }, [activeId]);

  if (!items || items.length === 0) return null;

  const handleClick = (item: NavSectionItem) => {
    if (item.onClick) {
      item.onClick();
    } else {
      onSelect?.(item.id);
      const el = document.getElementById(item.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="exec-level3-nav" aria-label={ariaLabel}>
      <div className="esn-track" ref={navTrackRef}>
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              data-id={item.id}
              className={`esn-tab ${isActive ? 'active' : ''}`}
              onClick={() => handleClick(item)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== null && (
                <span className={`esn-badge ${isActive ? 'active' : ''}`}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
