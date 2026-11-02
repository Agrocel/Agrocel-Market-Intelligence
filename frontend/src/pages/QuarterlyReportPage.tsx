import React, { useState } from 'react';
import type { DashboardData, DataGroundingItem } from '../types';
import type { AppRoute } from '../navigation';
import { generateReport } from '../api';
import { PageHeader, IntelligenceStatusStrip, SectionNav } from '../components/PageHeader';

interface Props {
  data: DashboardData;
  onNavigate: (route: AppRoute, subTab?: string) => void;
  onSelectGrounding?: (item: DataGroundingItem) => void;
}

const num = (n: number | null | undefined, digits: number = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

export function QuarterlyReportPage({ data, onNavigate }: Props) {
  const { overview, brief, sales, trade } = data;
  const execOverview = overview?.executive_overview;

  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1 FY 2025-26');
  const [generating, setGenerating] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Key figures from engine - strictly dynamic
  const chinaSpot = execOverview?.section_1_price_benchmarks?.latest_metrics?.china_spot_benchmark_usd_mt ?? null;
  const landedCif = execOverview?.section_1_price_benchmarks?.latest_metrics?.cif_india_import_parity_usd_mt ?? null;
  const agrocelPriceInr = execOverview?.section_1_price_benchmarks?.domestic_pricing_headroom?.agrocel_price_inr_kg ??
    (execOverview?.section_1_price_benchmarks?.latest_metrics?.agrocel_weighted_realization_inr_mt ? execOverview.section_1_price_benchmarks.latest_metrics.agrocel_weighted_realization_inr_mt / 1000 : null);
  const headroomInr = execOverview?.section_1_price_benchmarks?.domestic_pricing_headroom?.headroom_inr_kg ?? null;
  const headroomPct = execOverview?.section_1_price_benchmarks?.domestic_pricing_headroom?.headroom_pct ?? null;
  const landedCifInr = execOverview?.section_1_price_benchmarks?.domestic_pricing_headroom?.import_parity_inr_kg ?? null;
  const fxRate = execOverview?.section_1_price_benchmarks?.domestic_pricing_headroom?.inr_usd_exchange_rate || 86.8;

  const totalSalesVolume = sales.reduce((sum, s) => sum + (Number(s.quantity_mt) || 0), 0) || null;
  const nameplateCap = execOverview?.section_2_supply?.executive_supply_summary?.kpi_metrics?.total_nameplate_capacity_mt ?? execOverview?.section_2_supply?.total_global_capacity_mt ?? null;
  const actualOutput = execOverview?.section_2_supply?.executive_supply_summary?.kpi_metrics?.total_estimated_production_mt ?? null;
  const globalUtil = execOverview?.section_2_supply?.executive_supply_summary?.kpi_metrics?.effective_global_utilization_pct ?? null;

  const handleGenerateFresh = async () => {
    setGenerating(true);
    try {
      const res = await generateReport('quarterly');
      if (res && res.markdown) {
        setReportResult(res.markdown);
      }
    } catch (e) {
      console.error('Could not generate quarterly report via API:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    const textToCopy = reportResult || getDefaultReportMarkdown();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getDefaultReportMarkdown = () => {
    const period = brief?.period_start && brief?.period_end
      ? `${brief.period_start} — ${brief.period_end}`
      : 'No verified reporting period supplied';
    return [
      '# AGROCEL BROMINE QUARTERLY INTELLIGENCE REPORT',
      `Reporting Cycle: ${selectedQuarter} | Verified data period: ${period}`,
      '',
      '## Executive summary',
      brief?.executive_summary || 'No verified executive summary is available. Generate a fresh briefing after data refresh.',
      '',
      '## Current verified metrics',
      `- China spot: ${chinaSpot != null ? `$${num(chinaSpot, 0)}/MT` : 'Not available'}`,
      `- Landed CIF parity: ${landedCif != null ? `$${num(landedCif, 0)}/MT` : 'Not available'}`,
      `- Agrocel realization: ${agrocelPriceInr != null ? `₹${num(agrocelPriceInr, 1)}/kg` : 'Not available'}`,
      `- Domestic price cushion: ${headroomInr != null ? `₹${num(headroomInr, 1)}/kg` : 'Not available'}`,
      `- Global utilization: ${globalUtil != null ? `${num(globalUtil, 1)}%` : 'Not available'}`,
      `- Loaded sales volume: ${totalSalesVolume != null ? `${num(totalSalesVolume)} MT` : 'Not available'}`,
      '',
      '## Management follow-up',
      'Review the detailed pricing, supply, and trade pages before approving commercial actions.'
    ].join('\n');
  };

  return (
    <div className="page-shell quarterly-report-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <>
            <button className="breadcrumb-btn" onClick={() => onNavigate('overview')}>Executive Overview</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Quarterly Strategic Report</span>
          </>
        }
        title="Consolidated Quarterly Strategic Report"
        actions={
          <>
            <select
              className="quarter-select-box"
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(e.target.value)}
              aria-label="Select reporting quarter"
            >
              <option value="Q1 FY 2025-26">Q1 FY 2025-26 (Current Active)</option>
              <option value="Q4 FY 2024-25">Q4 FY 2024-25 (Audited Close)</option>
              <option value="Q3 FY 2024-25">Q3 FY 2024-25 (Historical)</option>
              <option value="Q2 FY 2024-25">Q2 FY 2024-25 (Historical)</option>
            </select>

            <button
              className="btn-exec-action btn-primary-action"
              onClick={handleGenerateFresh}
              disabled={generating}
            >
              {generating ? 'Synthesizing...' : '⚡ Generate Briefing'}
            </button>

            <button
              className="btn-exec-action"
              onClick={handleCopyMarkdown}
            >
              {copied ? '✓ Copied' : '📋 Copy Report'}
            </button>

            <button
              className="btn-exec-action"
              onClick={() => window.print()}
            >
              🖨️ Print / PDF
            </button>
          </>
        }
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Reporting Cycle',
            value: selectedQuarter,
            dot: 'green'
          },
          {
            label: 'Data Verification',
            value: brief?.status || 'Unified Feb 2026 Audit',
            tone: 'positive'
          },
          {
            label: 'Landed CIF Parity',
            value: landedCif != null ? `$${num(landedCif, 0)}/MT` : '—'
          },
          {
            label: 'Agrocel Realization',
            value: agrocelPriceInr != null ? `₹${num(agrocelPriceInr, 1)}/kg` : '—'
          },
          {
            label: 'Domestic Cushion',
            value: headroomInr != null ? `+₹${num(headroomInr, 1)}/kg spread` : '—',
            tone: 'positive'
          }
        ]}
      />

      {/* Report Container */}
      <div className="report-paper-container">
        {/* Report Header Block */}
        <div className="report-meta-header">
          <div className="rmh-left">
            <span className="rmh-org">AGROCEL INDUSTRIES PRIVATE LIMITED</span>
            <h2 className="rmh-title font-serif">Quarterly Bromine Strategic Intelligence Briefing</h2>
            <span className="rmh-subtitle">Prepared for Commercial VP, Strategy Desk & Executive Leadership</span>
          </div>
          <div className="rmh-right">
            <div className="rmh-badge">Reporting Window: <b>{selectedQuarter}</b></div>
            <div className="rmh-badge">Data period: <b>{brief?.period_start && brief?.period_end ? `${brief.period_start} — ${brief.period_end}` : 'Not supplied'}</b></div>
            <div className={`rmh-badge ${brief?.status === 'VERIFIED' ? 'status-green' : ''}`}>Data status: <b>{brief?.status || 'Not verified'}</b></div>
          </div>
        </div>

        <section className="quarterly-decision-brief">
          <div className="quarterly-decision-head">
            <div>
              <span className="decision-panel-eyebrow">Decision brief</span>
              <h3>{reportResult ? 'Freshly generated briefing' : 'Current executive briefing'}</h3>
            </div>
            <span className="quarterly-data-note">Selected period: {selectedQuarter}</span>
          </div>
          {reportResult ? (
            <pre className="quarterly-generated-report">{reportResult}</pre>
          ) : (
            <>
              <p className="quarterly-summary-copy">
                {brief?.executive_summary || 'No verified quarterly narrative is available. Generate a fresh briefing after the relevant data sources have been updated.'}
              </p>
              <div className="quarterly-metric-grid">
                <div><span>Landed CIF parity</span><strong>{landedCif != null ? `$${num(landedCif, 0)} / MT` : '—'}</strong></div>
                <div><span>Agrocel realization</span><strong>{agrocelPriceInr != null ? `₹${num(agrocelPriceInr, 1)} / kg` : '—'}</strong></div>
                <div><span>Domestic price cushion</span><strong>{headroomInr != null ? `₹${num(headroomInr, 1)} / kg` : '—'}</strong></div>
                <div><span>Global utilization</span><strong>{globalUtil != null ? `${num(globalUtil, 1)}%` : '—'}</strong></div>
                <div><span>Loaded sales volume</span><strong>{totalSalesVolume != null ? `${num(totalSalesVolume)} MT` : '—'}</strong></div>
                <div><span>Verified output estimate</span><strong>{actualOutput != null ? `${num(actualOutput)} MT` : '—'}</strong></div>
              </div>
            </>
          )}
        </section>

        {/* Report Footer */}
        <div className="report-signoff-footer">
          <div className="rsf-left">
            <small>Report generated from Agrocel Market Intelligence Core Engine.</small>
            <small>Data Sources: Indian Customs NIDB, Agrocel SAP Sales Ledger, SunSirs Commodity Index, USGS, Company Filings.</small>
          </div>
          <div className="rsf-right">
            <span className="rsf-stamp">CONFIDENTIAL · AGROCEL MANAGEMENT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
