import React, { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export interface ForecastDataPoint {
  date: string;
  monthLabel: string;
  avg_unit_value: number | null;
  predicted_price: number | null;
  displayDate?: string;
}

// 48-Month Dataset extracted directly from the proprietary forecasting model (June 2022 – May 2026)
export const FORECAST_CHART_DATA: ForecastDataPoint[] = [
  { date: '2022-06', monthLabel: 'Jun 22', avg_unit_value: 2.81, predicted_price: null },
  { date: '2022-07', monthLabel: 'Jul 22', avg_unit_value: 2.92, predicted_price: null },
  { date: '2022-08', monthLabel: 'Aug 22', avg_unit_value: 3.06, predicted_price: null },
  { date: '2022-09', monthLabel: 'Sep 22', avg_unit_value: 3.32, predicted_price: null },
  { date: '2022-10', monthLabel: 'Oct 22', avg_unit_value: 3.23, predicted_price: null },
  { date: '2022-11', monthLabel: 'Nov 22', avg_unit_value: 3.10, predicted_price: null },
  { date: '2022-12', monthLabel: 'Dec 22', avg_unit_value: 3.33, predicted_price: null },
  { date: '2023-01', monthLabel: 'Jan 23', avg_unit_value: 3.17, predicted_price: null },
  { date: '2023-02', monthLabel: 'Feb 23', avg_unit_value: 3.54, predicted_price: null },
  { date: '2023-03', monthLabel: 'Mar 23', avg_unit_value: 3.76, predicted_price: null },
  { date: '2023-04', monthLabel: 'Apr 23', avg_unit_value: 3.82, predicted_price: null },
  { date: '2023-05', monthLabel: 'May 23', avg_unit_value: 3.66, predicted_price: null },
  { date: '2023-06', monthLabel: 'Jun 23', avg_unit_value: 3.76, predicted_price: null },
  { date: '2023-07', monthLabel: 'Jul 23', avg_unit_value: 3.73, predicted_price: null },
  { date: '2023-08', monthLabel: 'Aug 23', avg_unit_value: 3.85, predicted_price: null },
  { date: '2023-09', monthLabel: 'Sep 23', avg_unit_value: 4.05, predicted_price: null },
  { date: '2023-10', monthLabel: 'Oct 23', avg_unit_value: 4.19, predicted_price: null },
  { date: '2023-11', monthLabel: 'Nov 23', avg_unit_value: 4.32, predicted_price: null },
  { date: '2023-12', monthLabel: 'Dec 23', avg_unit_value: 4.61, predicted_price: null },
  { date: '2024-01', monthLabel: 'Jan 24', avg_unit_value: 4.74, predicted_price: null },
  { date: '2024-02', monthLabel: 'Feb 24', avg_unit_value: 5.02, predicted_price: null },
  { date: '2024-03', monthLabel: 'Mar 24', avg_unit_value: 5.91, predicted_price: null },
  { date: '2024-04', monthLabel: 'Apr 24', avg_unit_value: 6.20, predicted_price: null },
  { date: '2024-05', monthLabel: 'May 24', avg_unit_value: 6.38, predicted_price: null },
  { date: '2024-06', monthLabel: 'Jun 24', avg_unit_value: 6.64, predicted_price: null }, // Historical Peak
  { date: '2024-07', monthLabel: 'Jul 24', avg_unit_value: 5.91, predicted_price: null },
  { date: '2024-08', monthLabel: 'Aug 24', avg_unit_value: 5.74, predicted_price: null },
  { date: '2024-09', monthLabel: 'Sep 24', avg_unit_value: 5.90, predicted_price: null },
  { date: '2024-10', monthLabel: 'Oct 24', avg_unit_value: 5.59, predicted_price: null },
  { date: '2024-11', monthLabel: 'Nov 24', avg_unit_value: 5.24, predicted_price: null },
  { date: '2024-12', monthLabel: 'Dec 24', avg_unit_value: 4.74, predicted_price: null },
  { date: '2025-01', monthLabel: 'Jan 25', avg_unit_value: 4.31, predicted_price: null },
  { date: '2025-02', monthLabel: 'Feb 25', avg_unit_value: 3.88, predicted_price: null },
  { date: '2025-03', monthLabel: 'Mar 25', avg_unit_value: 3.39, predicted_price: null },
  { date: '2025-04', monthLabel: 'Apr 25', avg_unit_value: 3.26, predicted_price: null },
  { date: '2025-05', monthLabel: 'May 25', avg_unit_value: 2.60, predicted_price: null },
  { date: '2025-06', monthLabel: 'Jun 25', avg_unit_value: 2.43, predicted_price: null },
  { date: '2025-07', monthLabel: 'Jul 25', avg_unit_value: 2.30, predicted_price: null }, // Historical Trough
  { date: '2025-08', monthLabel: 'Aug 25', avg_unit_value: 2.51, predicted_price: null },
  { date: '2025-09', monthLabel: 'Sep 25', avg_unit_value: 2.36, predicted_price: null },
  { date: '2025-10', monthLabel: 'Oct 25', avg_unit_value: 2.49, predicted_price: null },
  { date: '2025-11', monthLabel: 'Nov 25', avg_unit_value: 2.66, predicted_price: null },
  { date: '2025-12', monthLabel: 'Dec 25', avg_unit_value: 2.83, predicted_price: null },
  { date: '2026-01', monthLabel: 'Jan 26', avg_unit_value: 3.17, predicted_price: null },
  // Connection point: Feb 2026 serves as junction from historical to predicted
  { date: '2026-02', monthLabel: 'Feb 26', avg_unit_value: 3.02, predicted_price: 3.02 },
  // 3-Month Forward Forecast (Predicted Price)
  { date: '2026-03', monthLabel: 'Mar 26', avg_unit_value: null, predicted_price: 3.01, displayDate: 'Tuesday, March 31, 2026' },
  { date: '2026-04', monthLabel: 'Apr 26', avg_unit_value: null, predicted_price: 3.05, displayDate: 'Thursday, April 30, 2026' },
  { date: '2026-05', monthLabel: 'May 26', avg_unit_value: null, predicted_price: 3.04, displayDate: 'Sunday, May 31, 2026' },
];

export const FORECAST_PREDICTIONS = [
  { fullDate: 'Tuesday, March 31, 2026', shortDate: 'March 2026', price: 3.01, trend: 'stable' },
  { fullDate: 'Thursday, April 30, 2026', shortDate: 'April 2026', price: 3.05, trend: 'up' },
  { fullDate: 'Sunday, May 31, 2026', shortDate: 'May 2026', price: 3.04, trend: 'stable' },
];

export function IndiaPriceForecastSection() {
  const chartData = useMemo(() => FORECAST_CHART_DATA, []);

  return (
    <article className="forecast-model-card">
      <header className="forecast-card-header">
        <div>
          <div className="forecast-eyebrow-row">
            <span className="ai-pill small">
              <i className="ai-dot" /> Proprietary Forecast Model
            </span>
            <span className="forecast-horizon-tag">3-Month Forward Horizon</span>
          </div>
          <h3 className="forecast-card-title">Historical and Forecasted Price Trend</h3>
          <p className="forecast-card-desc">
            Monthly Average Price in India (Avg Unit Value USD/kg) mapped across 48 observation points with machine learning predictive modeling.
          </p>
        </div>
        <div className="forecast-legend-pills">
          <span className="legend-pill blue">
            <i className="legend-dot blue-dot" /> Avg Unit Value USD
          </span>
          <span className="legend-pill red">
            <i className="legend-dot red-dot" /> Predicted Price
          </span>
        </div>
      </header>

      <div className="forecast-layout-grid">
        {/* Left Table: Monthly Average Price in India */}
        <aside className="forecast-table-panel">
          <div className="forecast-table-head">
            <h4>Monthly Average Price in India</h4>
            <span className="model-tag">Forecast Model</span>
          </div>

          <div className="forecast-table-container">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="th-right">Predicted Price</th>
                </tr>
              </thead>
              <tbody>
                {FORECAST_PREDICTIONS.map((row) => (
                  <tr key={row.fullDate}>
                    <td>
                      <strong>{row.fullDate}</strong>
                    </td>
                    <td className="td-right">
                      <span className="predicted-price-badge">
                        ${row.price.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="model-summary-box">
            <div className="summary-row">
              <span>Projected Stability:</span>
              <b>$3.01 – $3.05 / kg</b>
            </div>
            <div className="summary-row">
              <span>Metric Ton Parity:</span>
              <b>$3,010 – $3,050 / MT</b>
            </div>
            <div className="summary-row">
              <span>Historical Inflections:</span>
              <small>Peak $6.64 (Jun '24) · Floor $2.30 (Jul '25)</small>
            </div>
          </div>
        </aside>

        {/* Right Chart: Historical & Forecasted Price Trend */}
        <div className="forecast-chart-panel">
          <div className="chart-panel-meta">
            <span className="chart-stat-chip">
              Latest Historical: <b>$3.02 USD/kg</b> (Feb 2026)
            </span>
            <span className="chart-stat-chip highlight">
              May 2026 Forecast: <b>$3.04 USD/kg</b>
            </span>
          </div>

          <div className="forecast-chart-wrap" role="img" aria-label="Historical and Forecasted Price Trend Chart">
            <ResponsiveContainer width="100%" height={330}>
              <ComposedChart
                data={chartData}
                margin={{ top: 18, right: 18, left: -8, bottom: 4 }}
              >
                <CartesianGrid stroke="#e4eae7" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  minTickGap={22}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[2.0, 7.2]}
                  ticks={[2.0, 3.0, 4.0, 5.0, 6.0, 7.0]}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `$${Number(val).toFixed(2)} USD / kg`,
                    name === 'avg_unit_value' ? 'Avg Unit Value USD' : 'Predicted Price'
                  ]}
                  labelFormatter={(_label: any, payload: any) => {
                    const pt = payload?.[0]?.payload;
                    return pt?.displayDate || `Observation: ${pt?.monthLabel || _label}`;
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    fontSize: 12
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(value) => (value === 'avg_unit_value' ? 'Avg Unit Value USD' : 'Predicted Price')}
                />
                
                {/* Historical Benchmark Reference Lines */}
                <ReferenceLine
                  y={6.64}
                  stroke="#b91c1c"
                  strokeDasharray="3 3"
                  label={{ value: 'Peak $6.64 (Jun 2024)', position: 'top', fill: '#b91c1c', fontSize: 10, fontWeight: 700 }}
                />
                <ReferenceLine
                  y={2.30}
                  stroke="#0f766e"
                  strokeDasharray="3 3"
                  label={{ value: 'Trough $2.30 (Jul 2025)', position: 'bottom', fill: '#0f766e', fontSize: 10, fontWeight: 700 }}
                />

                {/* Blue Line: Historical Unit Value */}
                <Line
                  type="monotone"
                  dataKey="avg_unit_value"
                  name="Avg Unit Value USD"
                  stroke="#0284c7"
                  strokeWidth={2.4}
                  dot={{ r: 2.5, fill: '#0284c7', strokeWidth: 1 }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#ffffff' }}
                  connectNulls={false}
                />

                {/* Red Line: Predicted Forward Curve */}
                <Line
                  type="monotone"
                  dataKey="predicted_price"
                  name="Predicted Price"
                  stroke="#dc2626"
                  strokeWidth={2.8}
                  dot={{ r: 4, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#ffffff' }}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic Takeaway Banner */}
      <footer className="forecast-takeaway-banner">
        <span>Strategic Outlook:</span>
        <p>
          Internal model forecast projects balanced price stability through May 2026 ($3.01–$3.05/kg / $3,010–$3,050/MT), 
          confirming that international supply and merchant demand have stabilized post-2025 bottom. Agrocel can maintain domestic contract pricing with confidence while quoting export parcels at full parity.
        </p>
      </footer>
    </article>
  );
}
