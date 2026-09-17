import React, { useMemo, useState } from 'react';
import type { ExecutiveBrief, WhoDidWhatItem, DataGroundingItem } from '../types';
import { EmptyState, ReliabilityBadge } from './Common';
import { DataGroundedText, ProvenanceDrawer } from './DataProvenance';

const classify = (actor: WhoDidWhatItem) => {
  const text = `${actor.entity} ${actor.role} ${actor.action} ${actor.impact}`.toLowerCase();
  if (/regulat|ministry|authority|compliance|environment/.test(text)) return 'Policy';
  if (/buyer|consumer|downstream|demand|compound/.test(text)) return 'Demand';
  if (/agrocel|commercial|sales|customer/.test(text)) return 'Commercial';
  return 'Supply';
};

// Formats bullet-point or multi-item text into clean lines
function parseListItems(rawText?: string | null): string[] {
  if (!rawText) return [];
  return rawText
    .split(/\n+|•|(?:\s*\d+\.\s+)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function MarketNarrative({ brief }: { brief?: ExecutiveBrief | null }) {
  const [filter, setFilter] = useState('All');
  const [showAllActors, setShowAllActors] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [selectedGrounding, setSelectedGrounding] = useState<DataGroundingItem | null>(null);

  const narrative = brief?.market_narrative;
  const actors = narrative?.who_did_what || [];
  const categories = ['All', 'Supply', 'Demand', 'Policy', 'Commercial'];
  const visible = actors.filter(a => filter === 'All' || classify(a) === filter);

  // Informative limit: show top 5 by default, with toggle
  const displayedActors = showAllActors ? visible : visible.slice(0, 5);

  const driverCounts = useMemo(
    () => categories.slice(1).map(name => ({
      name,
      count: actors.filter(a => classify(a) === name).length
    })),
    [actors]
  );
  const maxDrivers = Math.max(1, ...driverCounts.map(x => x.count));
  const direction = brief?.overall_market_direction || 'NEUTRAL';

  if (!brief || !narrative) {
    return (
      <section id="ai-market-synthesis" className="narrative-section">
        <EmptyState
          title="AI market synthesis is not available"
          detail="The dashboard will display this section after the backend publishes an executive brief."
        />
      </section>
    );
  }

  // Parse why_it_matters bullets
  const whyItems = parseListItems(brief.why_it_matters);

  // Parse management_attention action points
  const attentionItems = parseListItems(brief.management_attention);

  // Parse explanation pillars from narrative full_text
  const explanationParagraphs = (narrative.full_text || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <section id="ai-market-synthesis" className="narrative-section">
      {/* 1. Header with Badges */}
      <header className="brief-heading">
        <div>
          <div className="brief-eyebrow-row">
            <span className="ai-pill">
              <i className="ai-dot" /> AI-Grounded Executive Brief
            </span>
            <span className="source-counter-pill">
              ✓ {brief.source_count || actors.length} Verified Sources
            </span>
          </div>
          <h2 className="brief-title">{narrative.headline || 'Market Pulse: Who Did What & What Is Happening'}</h2>
        </div>
        <div className="brief-status">
          <span className={`direction direction-${direction.toLowerCase()}`}>
            ● {direction}
          </span>
          <span className="date-pill">{brief.period_start} — {brief.period_end}</span>
        </div>
      </header>

      {/* 2. Top 3 Executive Takeaway Cards */}
      <div className="decision-grid">
        {/* Card 1: Executive Read */}
        <article className="decision-card">
          <div className="card-badge">
            <span className="card-num">01</span>
            <span className="card-label">Executive Read</span>
          </div>
          <p className="card-body-text">
            <DataGroundedText
              text={brief.executive_summary}
              grounding={brief.data_grounding}
              onSelect={setSelectedGrounding}
            />
          </p>
        </article>

        {/* Card 2: Why It Matters */}
        <article className="decision-card">
          <div className="card-badge">
            <span className="card-num">02</span>
            <span className="card-label">Why It Matters to Agrocel</span>
          </div>
          {whyItems.length > 1 ? (
            <ul className="card-bullet-list">
              {whyItems.map((item, idx) => (
                <li key={idx}>
                  {item.includes(':') ? (
                    <>
                      <strong>{item.split(':')[0]}:</strong>
                      <DataGroundedText
                        text={item.substring(item.indexOf(':') + 1)}
                        grounding={brief.data_grounding}
                        onSelect={setSelectedGrounding}
                      />
                    </>
                  ) : (
                    <DataGroundedText
                      text={item}
                      grounding={brief.data_grounding}
                      onSelect={setSelectedGrounding}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="card-body-text">
              <DataGroundedText
                text={brief.why_it_matters || 'Domestic contract pricing provides steady margin protection.'}
                grounding={brief.data_grounding}
                onSelect={setSelectedGrounding}
              />
            </p>
          )}
        </article>

        {/* Card 3: Priority Management Actions */}
        <article className="decision-card attention-card">
          <div className="card-badge">
            <span className="card-num alert-num">03</span>
            <span className="card-label alert-label">What Management Should Do</span>
          </div>
          {attentionItems.length > 0 ? (
            <div className="action-step-list">
              {attentionItems.map((step, idx) => (
                <div className="action-step-item" key={idx}>
                  <span className="step-idx">{idx + 1}</span>
                  <div className="step-content">
                    {step.includes(':') ? (
                      <>
                        <strong>{step.split(':')[0]}:</strong>
                        <DataGroundedText
                          text={step.substring(step.indexOf(':') + 1)}
                          grounding={brief.data_grounding}
                          onSelect={setSelectedGrounding}
                        />
                      </>
                    ) : (
                      <DataGroundedText
                        text={step}
                        grounding={brief.data_grounding}
                        onSelect={setSelectedGrounding}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="card-body-text">
              <DataGroundedText
                text={brief.management_attention || 'Track upcoming winter plant shutdowns and protect contract renewal pricing.'}
                grounding={brief.data_grounding}
                onSelect={setSelectedGrounding}
              />
            </p>
          )}
        </article>
      </div>

      {/* 3. Market Explanation & Driver Balance */}
      <div className="brief-grid">
        {/* Left: What is driving the movement */}
        <article className="narrative-copy-card">
          <div className="brief-card-title">
            <div>
              <span className="sub-tag">Market Drivers</span>
              <h3>What Is Driving The Movement</h3>
            </div>
            <span className="info-chip">High-Signal Summary</span>
          </div>

          <div className="pillars-container">
            {explanationParagraphs.map((para, i) => {
              const lines = para.split('\n');
              const hasHeader = lines.length > 1 && lines[0].endsWith(':');
              const pillarTitle = hasHeader ? lines[0].replace(':', '') : null;
              const pillarBody = hasHeader ? lines.slice(1).join(' ') : para;

              return (
                <div className="pillar-item" key={i}>
                  {pillarTitle && <h4 className="pillar-title">{pillarTitle}</h4>}
                  <p className="pillar-text">
                    <DataGroundedText
                      text={pillarBody}
                      grounding={brief.data_grounding}
                      onSelect={setSelectedGrounding}
                    />
                  </p>
                </div>
              );
            })}
          </div>

          {brief.citations && brief.citations.length > 0 && (
            <div className="evidence-accordion">
              <button
                className="evidence-toggle-btn"
                onClick={() => setSourcesOpen(!sourcesOpen)}
                aria-expanded={sourcesOpen}
              >
                <span>{sourcesOpen ? '▲ Hide Verified Evidence' : `▼ Review ${brief.citations.length} Verified Evidence Sources`}</span>
              </button>
              {sourcesOpen && (
                <div className="evidence-panel">
                  {brief.citations.map((c, i) => (
                    <article className="evidence-item" key={c.id || i}>
                      <div className="evidence-item-header">
                        <strong>[{i + 1}] {c.source_title}</strong>
                        <ReliabilityBadge grade={c.reliability_grade} />
                      </div>
                      <p className="evidence-text">{c.citation_text}</p>
                      {c.page_number && <small className="evidence-meta">Page {c.page_number}</small>}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </article>

        {/* Right: Driver Distribution Balance */}
        <aside className="driver-balance-card">
          <div className="brief-card-title">
            <div>
              <span className="sub-tag">Evidence Distribution</span>
              <h3>Market Driver Balance</h3>
            </div>
          </div>
          <p className="driver-intro">
            Distribution of observed market moves across supply, buyer demand, policy, and commercial operations.
          </p>
          <div className="driver-bars">
            {driverCounts.map(x => (
              <div key={x.name} className="driver-bar-row">
                <label>
                  <span>{x.name}</span>
                  <b>{x.count} signals</b>
                </label>
                <div className="bar-track">
                  <span
                    className={`bar-fill bar-${x.name.toLowerCase()}`}
                    style={{ width: `${(x.count / maxDrivers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="signal-legend">
            <span><i className="supply-dot" />Producers (Supply)</span>
            <span><i className="demand-dot" />Buyers (Demand)</span>
            <span><i className="policy-dot" />Regulations</span>
          </div>
        </aside>
      </div>

      {/* 4. Market Pulse: Who Did What & What Is Happening */}
      <div className="actor-section">
        <div className="actor-heading">
          <div>
            <span className="ai-pill small">Market Pulse</span>
            <h3 className="actor-section-title">Who Did What & What Is Happening</h3>
            <p className="actor-section-desc">
              Verified actions taken by key market players and their direct impact on Agrocel.
            </p>
          </div>
          <div className="actor-filters">
            {categories.map(x => (
              <button
                className={`actor-filter-pill ${filter === x ? 'active' : ''}`}
                onClick={() => setFilter(x)}
                key={x}
              >
                {x === 'All' ? `All (${actors.length})` : x}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Actor Cards List */}
        <div className="actor-cards-grid">
          {displayedActors.length > 0 ? (
            displayedActors.map((a, i) => {
              const category = classify(a);
              return (
                <article className="actor-card-item" key={`${a.entity}-${i}`}>
                  <div className="actor-card-header">
                    <div className="actor-id-group">
                      <h4 className="actor-entity-name">{a.entity}</h4>
                      <span className="actor-role-badge">{a.role}</span>
                      <span className={`actor-category-tag tag-${category.toLowerCase()}`}>{category}</span>
                    </div>
                    <ReliabilityBadge grade={a.reliability_grade} />
                  </div>

                  <div className="actor-card-details">
                    <div className="actor-action-block">
                      <span className="detail-heading action-heading">Action Observed</span>
                      <p className="detail-paragraph">{a.action}</p>
                    </div>

                    <div className="actor-impact-block">
                      <span className="detail-heading impact-heading">Impact on Agrocel & Market</span>
                      <p className="detail-paragraph impact-paragraph">{a.impact}</p>
                    </div>
                  </div>

                  <div className="actor-card-footer">
                    <span className="source-attribution">
                      <strong>Source:</strong> {a.source}
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title={`No actors found for "${filter}"`}
              detail="Try selecting 'All' to view all tracked market moves."
            />
          )}
        </div>

        {/* Informative Toggle: Show All vs Top 5 */}
        {visible.length > 5 && (
          <div className="show-more-container">
            <button
              className="show-more-toggle-btn"
              onClick={() => setShowAllActors(!showAllActors)}
            >
              {showAllActors ? (
                <>▲ Show Top 5 Key Informative Actors</>
              ) : (
                <>▼ View All {visible.length} Market Actors ({visible.length - 5} More)</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 5. Slide-Over Data Provenance & Audit Inspector Drawer */}
      <ProvenanceDrawer
        item={selectedGrounding}
        onClose={() => setSelectedGrounding(null)}
      />
    </section>
  );
}
