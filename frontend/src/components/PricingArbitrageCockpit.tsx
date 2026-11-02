import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ArbitrageCockpitData, ArbitrageSpreadPoint } from '../types';
import { getArbitrageCockpit } from '../api';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface Props {
  initialCifUsd?: number;
  initialFx?: number;
}

const formatInr = (val?: number | null, decimals: number = 1) => {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return `₹${val.toFixed(decimals)}`;
};

const formatUsd = (val?: number | null) => {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return `$${Math.round(val).toLocaleString()}`;
};

export function PricingArbitrageCockpit({ initialCifUsd, initialFx }: Props) {
  const [data, setData] = useState<ArbitrageCockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Simulation Controls
  const [cifUsd, setCifUsd] = useState<number>(initialCifUsd || 2400);
  const [fxRate, setFxRate] = useState<number>(initialFx || 86.8);
  const [bcdPct, setBcdPct] = useState<number>(7.5);
  const [portHandling, setPortHandling] = useState<number>(2.5);
  const [inlandFreight, setInlandFreight] = useState<number>(3.0);
  const [localDiscount, setLocalDiscount] = useState<number>(6.0);

  // Fetch initial cockpit data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getArbitrageCockpit();
      setData(res);
      if (res.baseline_parameters) {
        if (!initialCifUsd && res.baseline_parameters.latest_cif_usd_mt) {
          setCifUsd(res.baseline_parameters.latest_cif_usd_mt);
        }
        if (!initialFx && res.baseline_parameters.current_fx_rate) {
          setFxRate(res.baseline_parameters.current_fx_rate);
        }
        setBcdPct(res.baseline_parameters.default_bcd_pct);
        setPortHandling(res.baseline_parameters.default_port_handling_inr_kg);
        setInlandFreight(res.baseline_parameters.default_inland_freight_inr_kg);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load arbitrage cockpit');
    } finally {
      setLoading(false);
    }
  }, [initialCifUsd, initialFx]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side instantaneous simulation calculations for 0ms slider latency
  const simulatedBreakdown = useMemo(() => {
    const assessedCifInrKg = (cifUsd * fxRate) / 1000.0;
    const swcPct = bcdPct * 0.10; // 10% on BCD
    const dutyRate = (bcdPct + swcPct) / 100.0;
    const customsDutyInrKg = assessedCifInrKg * dutyRate;
    const trueLandedInrKg = assessedCifInrKg + customsDutyInrKg + portHandling + inlandFreight;
    const trueLandedUsdMt = fxRate > 0 ? (trueLandedInrKg * 1000.0) / fxRate : 0;

    const ceilingPrice = trueLandedInrKg;
    const targetPrice = Math.max(170, ceilingPrice - localDiscount);
    const floorPrice = Math.max(160, targetPrice - 25);

    const agrocelRealization = data?.baseline_parameters?.agrocel_latest_realization_inr_kg || 195.0;
    const headroomInrKg = ceilingPrice - agrocelRealization;
    const headroomPct = ceilingPrice > 0 ? (headroomInrKg / ceilingPrice) * 100.0 : 0;

    let guidance = '';
    let badgeType: 'safe' | 'balanced' | 'risk' = 'safe';

    if (headroomInrKg > 10.0) {
      badgeType = 'safe';
      guidance = `Healthy pricing headroom: Agrocel net realization (${formatInr(agrocelRealization)}/kg) sits ${formatInr(headroomInrKg)}/kg (${headroomPct > 0 ? '+' : ''}${headroomPct.toFixed(1)}%) below landed import parity. Sales has commercial room to increase contract pricing towards ${formatInr(targetPrice)}/kg without triggering import substitution.`;
    } else if (headroomInrKg >= 0) {
      badgeType = 'balanced';
      guidance = `Balanced domestic buffer: Agrocel is ${formatInr(headroomInrKg)}/kg below landed parity. Maintain contract pricing near ${formatInr(targetPrice)}/kg to defend key agrochemical accounts against spot ISO container orders.`;
    } else {
      badgeType = 'risk';
      guidance = `Import vulnerability: Agrocel domestic realization (${formatInr(agrocelRealization)}/kg) exceeds landed import parity by ${formatInr(Math.abs(headroomInrKg))}/kg. Acute churn risk to imported bromine from Dead Sea/Jordan at Mundra port.`;
    }

    return {
      assessedCifInrKg,
      customsDutyInrKg,
      swcPct,
      trueLandedInrKg,
      trueLandedUsdMt,
      ceilingPrice,
      targetPrice,
      floorPrice,
      agrocelRealization,
      headroomInrKg,
      headroomPct,
      guidance,
      badgeType
    };
  }, [cifUsd, fxRate, bcdPct, portHandling, inlandFreight, localDiscount, data]);

  const resetToVerifiedDefaults = () => {
    if (data?.baseline_parameters) {
      setCifUsd(data.baseline_parameters.latest_cif_usd_mt);
      setFxRate(data.baseline_parameters.current_fx_rate);
      setBcdPct(data.baseline_parameters.default_bcd_pct);
      setPortHandling(data.baseline_parameters.default_port_handling_inr_kg);
      setInlandFreight(data.baseline_parameters.default_inland_freight_inr_kg);
      setLocalDiscount(6.0);
    }
  };

  if (loading && !data) {
    return (
      <div className="card loading-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
          Loading Domestic Pricing Arbitrage & Landed Parity Cockpit...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card error-box" style={{ padding: '1.5rem' }}>
        <h4>Pricing Arbitrage Unavailable</h4>
        <p style={{ fontSize: '0.875rem' }}>{error}</p>
        <button className="btn-secondary" onClick={loadData} style={{ marginTop: '0.5rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const series = data?.historical_spread_series || [];

  return (
    <div className="arbitrage-cockpit-container">
      {/* Top Controls & Reset Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge" style={{ backgroundColor: '#0f766e', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            HS 28013020
          </span>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Statutory Parity Engine · Import Threat & Negotiation Corridor
          </span>
        </div>

        <button
          onClick={resetToVerifiedDefaults}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
          title="Reset sliders to latest verified customs & RBI benchmarks"
        >
          ↺ Reset to Verified Defaults
        </button>
      </div>

      {/* Commercial Guidance Alert Box */}
      <div
        style={{
          marginBottom: '1.25rem',
          padding: '0.9rem 1.25rem',
          borderRadius: '8px',
          backgroundColor: simulatedBreakdown.badgeType === 'safe'
            ? 'rgba(16, 185, 129, 0.08)'
            : simulatedBreakdown.badgeType === 'balanced'
              ? 'rgba(59, 130, 246, 0.08)'
              : 'rgba(239, 68, 68, 0.08)',
          borderLeft: `4px solid ${
            simulatedBreakdown.badgeType === 'safe'
              ? '#10b981'
              : simulatedBreakdown.badgeType === 'balanced'
                ? '#3b82f6'
                : '#ef4444'
          }`,
          border: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong style={{ fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Strategic Commercial Recommendation:
          </strong>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              color: '#fff',
              backgroundColor: simulatedBreakdown.badgeType === 'safe'
                ? '#10b981'
                : simulatedBreakdown.badgeType === 'balanced'
                  ? '#3b82f6'
                  : '#ef4444'
            }}
          >
            {simulatedBreakdown.badgeType === 'safe'
              ? 'PRICING POWER: EXPAND MARGIN'
              : simulatedBreakdown.badgeType === 'balanced'
                ? 'DEFEND ACCOUNTS: MAINTAIN SPREAD'
                : 'CHURN ALERT: REDUCE CONTRACT PRICE'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.45', color: 'var(--text-primary)' }}>
          {simulatedBreakdown.guidance}
        </p>
      </div>

      {/* 2-Column Layout: Left = Negotiation Corridor & Breakdown, Right = Interactive Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Left Column: 3-Tier Negotiation Corridor Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Pricing Negotiation Corridor (Domestic INR/kg)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Ceiling Price (Import Parity Level) */}
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                  Ceiling Price (Import Parity Threat)
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                  {formatInr(simulatedBreakdown.ceilingPrice, 1)}
                  <small style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}> / kg</small>
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Exact landed cost of Dead Sea spot ISO tank at Dahej. Pricing above this induces immediate client import orders.
              </p>
            </div>

            {/* Target Price (Agrocel Negotiation Anchor) */}
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  ★ Agrocel Target Contract Price
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                  {formatInr(simulatedBreakdown.targetPrice, 1)}
                  <small style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}> / kg</small>
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Captures maximum margin while offering customer {formatInr(localDiscount)}/kg local supply discount (prompt bulk tank delivery with 0 customs friction).
              </p>
            </div>

            {/* Floor Price (Historical Operational Band) */}
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(100, 116, 139, 0.06)',
                border: '1px solid rgba(100, 116, 139, 0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Floor Price (Defensive Threshold)
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatInr(simulatedBreakdown.floorPrice, 1)}
                  <small style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}> / kg</small>
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Defensive contract baseline to protect annual volume commitment during heavy international dumping cycles.
              </p>
            </div>
          </div>

          {/* Current Realization Comparison */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Realized Selling Price</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-primary, #0284c7)' }}>
                {formatInr(simulatedBreakdown.agrocelRealization, 1)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ kg</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Headroom vs. Landed Parity</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: simulatedBreakdown.headroomInrKg >= 0 ? '#10b981' : '#ef4444' }}>
                {simulatedBreakdown.headroomInrKg >= 0 ? '+' : ''}{formatInr(simulatedBreakdown.headroomInrKg, 1)}/kg
                <small style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '0.35rem' }}>
                  ({simulatedBreakdown.headroomPct >= 0 ? '+' : ''}{simulatedBreakdown.headroomPct.toFixed(1)}%)
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Sensitivity Simulator */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Interactive Landed Cost Simulator
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Slider 1: CIF India (USD/MT) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>CIF India Price (USD/MT):</span>
                <strong style={{ color: 'var(--brand-primary)' }}>{formatUsd(cifUsd)}/MT</strong>
              </div>
              <input
                type="range"
                min="1400"
                max="4500"
                step="25"
                value={cifUsd}
                onChange={e => setCifUsd(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>$1,400 (Trough)</span>
                <span>$2,400 (Typical)</span>
                <span>$4,500 (Tightness)</span>
              </div>
            </div>

            {/* Slider 2: Exchange Rate USD/INR */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>RBI Reference Rate (USD/INR):</span>
                <strong style={{ color: 'var(--brand-primary)' }}>₹{fxRate.toFixed(2)} / USD</strong>
              </div>
              <input
                type="range"
                min="75"
                max="95"
                step="0.1"
                value={fxRate}
                onChange={e => setFxRate(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>₹75.0</span>
                <span>₹86.8 (Prompt)</span>
                <span>₹95.0</span>
              </div>
            </div>

            {/* Duty & Logistics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Customs BCD (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="25"
                  value={bcdPct}
                  onChange={e => setBcdPct(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Port Clr (₹/kg)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={portHandling}
                  onChange={e => setPortHandling(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Inland Frt (₹/kg)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={inlandFreight}
                  onChange={e => setInlandFreight(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Calculated Breakdown Summary Box */}
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(0,0,0,0.03)',
                borderRadius: '6px',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>1. Assessed CIF Value:</span>
                <strong>{formatInr(simulatedBreakdown.assessedCifInrKg, 2)} / kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>2. Customs Duty ({bcdPct}% BCD + {simulatedBreakdown.swcPct.toFixed(2)}% SWC):</span>
                <strong>+{formatInr(simulatedBreakdown.customsDutyInrKg, 2)} / kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>3. Port & Inland Logistics (Mundra ➔ Dahej):</span>
                <strong>+{formatInr(portHandling + inlandFreight, 2)} / kg</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.4rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px dashed var(--border-medium)',
                  fontWeight: 700
                }}
              >
                <span>True Landed Replacement Cost:</span>
                <span style={{ color: '#dc2626' }}>
                  {formatInr(simulatedBreakdown.trueLandedInrKg, 2)} / kg ({formatUsd(simulatedBreakdown.trueLandedUsdMt)}/MT eq)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Month Historical Arbitrage Spread Chart */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              24-Month Historical Arbitrage Spread (Landed Parity vs. Agrocel Realization)
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Positive green spread indicates Agrocel pricing competitively below import replacement parity; negative spread signals import substitution vulnerability.
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Source: Indian Customs Import Ledger (HS 28013020) & AIPL Invoiced Sales
          </div>
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                unit="₹"
                label={{ value: 'Price (₹/kg)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--text-muted)' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                domain={[-40, 60]}
                unit="₹"
                label={{ value: 'Spread (₹/kg)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: 'var(--text-muted)' } }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d: ArbitrageSpreadPoint = payload[0]?.payload;
                  return (
                    <div style={{ backgroundColor: 'var(--bg-card, #fff)', padding: '0.75rem', border: '1px solid var(--border-medium, #cbd5e1)', borderRadius: '6px', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <strong style={{ display: 'block', marginBottom: '0.35rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem' }}>
                        {label} ({d?.period})
                      </strong>
                      <div style={{ color: '#ef4444', marginBottom: '0.2rem' }}>
                        Landed CIF Parity: <strong>{formatInr(d?.landed_parity_inr_kg, 1)}/kg</strong> ({formatUsd(d?.cif_usd_mt)}/MT)
                      </div>
                      <div style={{ color: 'var(--brand-primary, #0284c7)', marginBottom: '0.2rem' }}>
                        Agrocel Realization: <strong>{formatInr(d?.agrocel_realization_inr_kg, 1)}/kg</strong>
                      </div>
                      <div style={{ color: (d?.arbitrage_spread_inr_kg || 0) >= 0 ? '#10b981' : '#dc2626', fontWeight: 700, marginTop: '0.35rem', paddingTop: '0.25rem', borderTop: '1px dashed #e2e8f0' }}>
                        Domestic Spread: {d?.arbitrage_spread_inr_kg !== null ? `${d?.arbitrage_spread_inr_kg! >= 0 ? '+' : ''}₹${d?.arbitrage_spread_inr_kg}/kg (${d?.spread_pct}%)` : '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Import Vol: {d?.import_volume_mt} MT | Agrocel Vol: {d?.agrocel_volume_mt} MT
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem' }} />
              <ReferenceLine y={0} yAxisId="right" stroke="#94a3b8" strokeDasharray="3 3" />

              {/* Spread Bar: Green when positive, Red when negative */}
              <Bar
                yAxisId="right"
                dataKey="arbitrage_spread_inr_kg"
                name="Domestic Headroom Spread (₹/kg)"
                fill="#10b981"
                opacity={0.65}
                radius={[3, 3, 0, 0]}
              />

              {/* Lines for Parity vs Realization */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="landed_parity_inr_kg"
                name="True Landed CIF Parity (₹/kg)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="agrocel_realization_inr_kg"
                name="Agrocel Net Invoiced Realization (₹/kg)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
