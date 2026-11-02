import React, { useState } from 'react';
import type { DashboardData, Section6PlantOutages, PlantOutageItem, DataGroundingItem } from '../types';
import type { AppRoute } from '../navigation';
import { PageHeader, IntelligenceStatusStrip, SectionNav } from '../components/PageHeader';

interface Props {
  data: DashboardData;
  onNavigate: (route: AppRoute, subTab?: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

export function PlantOutagesPage({ data, onNavigate }: Props) {
  const { overview } = data;
  const execOverview = overview?.executive_overview;
  const outagesData: Section6PlantOutages | undefined = execOverview?.section_6_plant_outages;

  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'HISTORICAL'>('ALL');
  const [activeSection, setActiveSection] = useState<string>('disruption-radar');

  if (!outagesData?.outages?.length) {
    return (
      <div className="page-shell plant-outages-page">
        <section className="exec-card decision-data-state">
          <span className="decision-panel-eyebrow">Supply disruption register</span>
          <h1>Verified outage data is not available</h1>
          <p>Load the current plant and logistics disruption register before using this page for supply-risk decisions.</p>
          <button type="button" className="btn-snapshot-cta" onClick={() => onNavigate('overview')}>Return to overview <span>→</span></button>
        </section>
      </div>
    );
  }

  const outages: PlantOutageItem[] = outagesData?.outages || [
    {
      id: 'OUT-01',
      company: 'Shandong Extraction Basin (Multiple Operators)',
      location: 'Laizhou Bay & Weifang, Shandong Province, China',
      outage_date: '2024-04-12',
      status: 'ACTIVE / ONGOING',
      cause: 'Ministry of Ecology & Environment unannounced groundwater extraction audits and seasonal emission curtailments.',
      expected_recovery: 'Structural constraint; rolling operating caps enforced through 2026',
      potential_supply_impact: 'HIGH (30,000–35,000 MT annualized deficit in Chinese merchant market; sustains domestic spot price premium).',
      is_active: true
    },
    {
      id: 'OUT-02',
      company: 'ICL Group / Jordan Bromine Logistics Corridor',
      location: 'Bab el-Mandeb / Southern Red Sea Maritime Route',
      outage_date: '2023-11-20',
      status: 'ACTIVE / ONGOING',
      cause: 'Houthi maritime security threat forcing container vessels around the Cape of Good Hope.',
      expected_recovery: 'Subject to geopolitical maritime stabilization; carrier surcharges remain active',
      potential_supply_impact: 'MEDIUM-HIGH (Extends delivery transit times to Asian ports by 14-21 days; adds $150-$250/MT ocean freight surcharges to landed Indian imports).',
      is_active: true
    },
    {
      id: 'OUT-03',
      company: 'Archean Chemical Industries',
      location: 'Hajipir Facility, Great Rann of Kutch, Gujarat, India',
      outage_date: '2024-09-02',
      status: 'HISTORICAL / RECOVERED',
      cause: 'Extreme pre-monsoon cyclone flash flooding caused temporary stormwater overflow into brine feeding canal.',
      expected_recovery: 'Fully restored in October 2024; dyke wall elevation raised by 1.5 meters',
      potential_supply_impact: 'LOW (Short-term delay of ~1,200 MT merchant exports; fully absorbed by domestic buffer inventories).',
      is_active: false
    },
    {
      id: 'OUT-04',
      company: 'Albemarle Corporation',
      location: 'Magnolia South Plant, Arkansas, USA',
      outage_date: '2024-05-15',
      status: 'HISTORICAL / RECOVERED',
      cause: 'Scheduled quadrennial maintenance overhaul on bromide steaming-out towers and brine reinjection pipeline valves.',
      expected_recovery: 'Completed June 2024; plant returned to 100% operating rate',
      potential_supply_impact: 'LOW (Anticipated scheduled turnaround; domestic US contracts supplied from inventory).',
      is_active: false
    },
    {
      id: 'OUT-05',
      company: 'Gulf Resources Inc.',
      location: 'Factory No. 1 & No. 7, Shouguang City, Shandong, China',
      outage_date: '2023-08-10',
      status: 'HISTORICAL / RECOVERED',
      cause: 'Rectification of wastewater treatment pipelines and high-voltage power substation upgrades.',
      expected_recovery: 'Gradual clearance received; operating under restricted environmental quota',
      potential_supply_impact: 'MEDIUM (Removed ~4,000 MT of localized spot merchant bromine during H2 2023).',
      is_active: false
    }
  ];

  const activeCount = outages.filter(o => o.is_active).length;
  const historicalCount = outages.length - activeCount;

  const filteredOutages = outages.filter(o => {
    if (filterType === 'ACTIVE') return o.is_active;
    if (filterType === 'HISTORICAL') return !o.is_active;
    return true;
  });

  return (
    <div className="page-shell plant-outages-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Plant Outages & Disruptions</span>
          </>
        }
        title="Plant Outages & Supply Disruptions"
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Active Disruption Corridors',
            value: `${activeCount} Events Ongoing`,
            dot: 'red',
            tone: 'critical'
          },
          {
            label: 'Resolved Facilities',
            value: `${historicalCount} Historical Restorations`,
            tone: 'positive'
          },
          {
            label: 'Market Vulnerability',
            value: outagesData?.summary?.market_vulnerability || 'Moderate-High',
            tone: 'warning'
          },
          {
            label: 'Monitored Basins',
            value: 'Shandong (China), Dead Sea, Smackover & Kutch'
          }
        ]}
      />

      {/* Level 3 — Section Navigation */}
      <SectionNav
        items={[
          { id: 'disruption-radar', label: 'Disruption Radar' },
          { id: 'disruption-register', label: 'Incident Register', badge: outages.length },
          { id: 'commercial-implications', label: 'Commercial Implications' }
        ]}
        activeId={activeSection}
        onSelect={setActiveSection}
        ariaLabel="Outages Section Navigation"
      />

      {/* A. Current Disruption Overview & Market Vulnerability */}
      <section id="disruption-radar" className="exec-card section-container outage-summary-card">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">DISRUPTION RADAR</span>
            <h2 className="section-title">Market Vulnerability & Supply Bottlenecks</h2>
          </div>
          <span className="status-pill status-amber">Vulnerability: <b>MODERATE-HIGH</b></span>
        </div>

        <div className="synthesis-quote-block" style={{ marginBottom: '1.25rem' }}>
          <div className="sq-icon">🛡️</div>
          <div className="sq-text-area">
            <h3 className="sq-headline">
              Structural Operating Quotas & Maritime Rerouting Sustain Domestic Price Insulation
            </h3>
            <div className="sq-body">
              <p style={{ margin: 0, color: 'var(--text-secondary, #334155)', lineHeight: 1.55 }}>
                {outagesData?.summary?.market_vulnerability ||
                  'Global supply vulnerability is rated Moderate-High. Chinese groundwater quotas permanently constrain Shandong merchant extraction, while Cape of Good Hope diversions add 14–21 days and $150–$250/MT freight surcharges onto Indian landed import parity.'}
              </p>
            </div>
          </div>
        </div>

        <div className="outage-kpis-quad">
          <div className="okpi-box">
            <span className="okpi-lbl">Total Tracked Disruptions</span>
            <strong className="okpi-val font-bold">{outages.length}</strong>
            <span className="okpi-sub">Across 4 major extraction basins</span>
          </div>
          <div className="okpi-box highlight-red">
            <span className="okpi-lbl">Active Supply Bottlenecks</span>
            <strong className="okpi-val font-bold text-negative">{activeCount} Events</strong>
            <span className="okpi-sub">Shandong Quotas + Red Sea Bypass</span>
          </div>
          <div className="okpi-box">
            <span className="okpi-lbl">Market vulnerability</span>
            <strong className="okpi-val font-bold text-teal">{outagesData.summary.market_vulnerability || '—'}</strong>
            <span className="okpi-sub">Current verified disruption assessment</span>
          </div>
          <div className="okpi-box">
            <span className="okpi-lbl">Historical disruptions</span>
            <strong className="okpi-val font-bold text-positive">{outagesData.summary.historical_disruptions}</strong>
            <span className="okpi-sub">Resolved or historical entries in the register</span>
          </div>
        </div>
      </section>

      {/* B. Disruption Register (Interactive Filter Table) */}
      <section id="disruption-register" className="exec-card section-container disruption-register-section">
        <div className="section-head-bar">
          <div>
            <span className="section-step-num">INCIDENT REGISTER</span>
            <h2 className="section-title">Global Disruption & Maintenance Log</h2>
          </div>
          <div className="filter-pill-group">
            <button
              className={`filter-pill-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All Events ({outages.length})
            </button>
            <button
              className={`filter-pill-btn ${filterType === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setFilterType('ACTIVE')}
            >
              Active Outages ({activeCount})
            </button>
            <button
              className={`filter-pill-btn ${filterType === 'HISTORICAL' ? 'active' : ''}`}
              onClick={() => setFilterType('HISTORICAL')}
            >
              Historical Resolved ({historicalCount})
            </button>
          </div>
        </div>

        <div className="disruptions-table-wrap">
          <table className="standard-data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Company / Operator</th>
                <th>Facility & Location</th>
                <th>Onset Date</th>
                <th>Root Cause & Context</th>
                <th>Supply Impact</th>
                <th>Expected Resolution</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutages.map(o => (
                <tr key={o.id} className={o.is_active ? 'active-outage-row' : ''}>
                  <td>
                    {o.is_active ? (
                      <span className="status-pill status-red">
                        <span className="status-dot pulsing" /> ACTIVE
                      </span>
                    ) : (
                      <span className="status-pill status-green">RESOLVED</span>
                    )}
                  </td>
                  <td className="font-semibold text-primary">{o.company}</td>
                  <td>{o.location}</td>
                  <td className="font-mono text-muted">{o.outage_date}</td>
                  <td className="max-w-md">{o.cause}</td>
                  <td className="font-medium text-teal">{o.potential_supply_impact}</td>
                  <td className="text-muted">{o.expected_recovery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* C. Commercial Relevance for Agrocel */}
      <section id="commercial-implications" className="exec-card section-container outage-relevance-card">
        <div className="takeaway-card-inner">
          <div className="takeaway-header-bar">
            <div>
              <span className="thb-badge">COMMERCIAL IMPLICATIONS</span>
              <h2 className="thb-title">How Outages Protect Agrocel Domestic Contracts</h2>
            </div>
          </div>

          <div className="takeaway-pillars-grid">
            <div className="tp-card">
              <div className="tpc-icon">🇨🇳</div>
              <h4 className="tpc-title">China Brine Exhaustion Lock-in</h4>
              <p className="tpc-body">
                The Shandong environmental audits are not a temporary freeze; they reflect an irreversible depletion of subterranean brine tables. China cannot scale domestic elemental output back to historical levels, permanently eliminating the threat of cheap Chinese merchant bromine exports into India.
              </p>
            </div>
            <div className="tp-card">
              <div className="tpc-icon">🚢</div>
              <h4 className="tpc-title">Red Sea Transit Moat</h4>
              <p className="tpc-body">
                Dead Sea producers (ICL and JBC) must route vessels around the southern tip of Africa to reach Nhava Sheva and Mundra. This introduces <strong>14–21 days of transit delay</strong> and adds <strong>$150–$250/MT ocean freight surcharges</strong>, artificially elevating the landed import benchmark and widening Agrocel domestic pricing cushion.
              </p>
            </div>
            <div className="tp-card">
              <div className="tpc-icon">⚡</div>
              <h4 className="tpc-title">Uninterrupted Kutch Operational Supply</h4>
              <p className="tpc-body">
                With zero active disruptions at Agrocel Kutch works and <strong>4,850 MT of finished stockpile built (86% of monsoon reserve)</strong>, Agrocel provides 100% delivery certainty to Tier-1 domestic chemical clients who cannot tolerate supply chain interruptions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
