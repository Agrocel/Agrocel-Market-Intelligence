import React, { useMemo, useState } from 'react';
import type { TradeRecord } from '../types';
import { EmptyState, SectionHeader } from './Common';
import { TrendChart } from './Charts';

type Dir = 'BOTH' | 'IMPORT' | 'EXPORT';

export function TradeIntelligence({ records }: { records: TradeRecord[] }) {
  const [dir, setDir] = useState<Dir>('BOTH');
  const [country, setCountry] = useState('ALL');

  const countries = useMemo(
    () => ['ALL', ...Array.from(new Set(records.map(x => x.partner).filter(Boolean))).sort()],
    [records]
  );

  const shown = records.filter(
    x => (dir === 'BOTH' || x.direction === dir) && (country === 'ALL' || x.partner === country)
  );

  const monthly = Object.values(
    shown.reduce((a: Record<string, any>, x) => {
      const d = x.date.slice(0, 7);
      const r = a[d] || {
        date: d,
        export_qty: 0,
        import_qty: 0,
        export_value: 0,
        import_value: 0,
        export_price: 0,
        import_price: 0,
        ec: 0,
        ic: 0
      };
      const k = x.direction === 'EXPORT' ? 'export' : 'import';
      r[`${k}_qty`] += x.quantity_mt;
      r[`${k}_value`] += x.value_usd;
      r[`${k}_price`] += x.average_price;
      r[x.direction === 'EXPORT' ? 'ec' : 'ic']++;
      a[d] = r;
      return a;
    }, {})
  )
    .map((x: any) => ({
      ...x,
      export_price: x.ec ? x.export_price / x.ec : 0,
      import_price: x.ic ? x.import_price / x.ic : 0
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  const flows = Object.values(
    shown.reduce((a: Record<string, any>, x) => {
      const r = a[x.partner] || { country: x.partner, quantity: 0, value: 0 };
      r.quantity += x.quantity_mt;
      r.value += x.value_usd;
      a[x.partner] = r;
      return a;
    }, {})
  )
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 6) as any[];

  const top = flows[0];

  // Dynamic titles and series based on the selected Trade Direction (dir) filter
  const isExport = dir === 'EXPORT';
  const isImport = dir === 'IMPORT';

  const quantityTitle = isExport
    ? (country === 'ALL' ? 'India Bromine Export Quantity' : `Exports to ${country} (Quantity)`)
    : isImport
    ? (country === 'ALL' ? 'India Bromine Import Quantity' : `Imports from ${country} (Quantity)`)
    : (country === 'ALL' ? 'Import vs Export Quantity' : `Trade Volume with ${country} (Import vs Export)`);

  const valueTitle = isExport
    ? (country === 'ALL' ? 'Export Shipment Value' : `Export Value to ${country}`)
    : isImport
    ? (country === 'ALL' ? 'Import Inflow Value' : `Import Inflow Value from ${country}`)
    : (country === 'ALL' ? 'Import vs Export Value' : `Trade Value with ${country}`);

  const priceTitle = isExport
    ? (country === 'ALL' ? 'Average Export Realization' : `Export Realization to ${country}`)
    : isImport
    ? (country === 'ALL' ? 'Average Import Landed Price' : `Import Landed Price from ${country}`)
    : (country === 'ALL' ? 'Average Trade Price' : `Average Trade Price with ${country}`);

  const tableTitle = isExport
    ? 'Top Export Destination Countries'
    : isImport
    ? 'Top Import Origin Countries'
    : 'Top Trade Partners';

  const tableSub = isExport
    ? 'Ranked by outbound export volume'
    : isImport
    ? 'Ranked by inbound import volume'
    : 'Ranked by total loaded volume';

  const quantitySeries = isExport
    ? [{ key: 'export_qty', name: 'Exports', color: '#0f766e', kind: 'bar' as const }]
    : isImport
    ? [{ key: 'import_qty', name: 'Imports', color: '#7d91aa', kind: 'bar' as const }]
    : [
        { key: 'export_qty', name: 'Exports', color: '#0f766e', kind: 'bar' as const },
        { key: 'import_qty', name: 'Imports', color: '#7d91aa', kind: 'bar' as const }
      ];

  const valueSeries = isExport
    ? [{ key: 'export_value', name: 'Export value', color: '#315c8d' }]
    : isImport
    ? [{ key: 'import_value', name: 'Import value', color: '#9a7650' }]
    : [
        { key: 'export_value', name: 'Export value', color: '#315c8d' },
        { key: 'import_value', name: 'Import value', color: '#9a7650' }
      ];

  const priceSeries = isExport
    ? [{ key: 'export_price', name: 'Export avg.', color: '#0f766e' }]
    : isImport
    ? [{ key: 'import_price', name: 'Import avg.', color: '#697f99' }]
    : [
        { key: 'export_price', name: 'Export avg.', color: '#0f766e' },
        { key: 'import_price', name: 'Import avg.', color: '#697f99' }
      ];

  const signalLabel = isExport ? 'Export Signal' : isImport ? 'Import Signal' : 'Trade Signal';
  const signalText = top
    ? isExport
      ? `${top.country} is India's leading export destination in this view with ${top.quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT exported.`
      : isImport
      ? `${top.country} is India's leading supplier in this view with ${top.quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT imported.`
      : `${top.country} is the largest loaded partner in this view at ${top.quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT.`
    : 'No partner concentration is available.';

  return (
    <section id="trade">
      <SectionHeader
        eyebrow="Trade intelligence"
        title="India’s Bromine trade, in context"
        action={
          <div className="filters">
            <div className="segmented">
              {(['BOTH', 'EXPORT', 'IMPORT'] as Dir[]).map(x => (
                <button
                  className={dir === x ? 'active' : ''}
                  onClick={() => setDir(x)}
                  key={x}
                >
                  {x === 'BOTH' ? 'Both' : x === 'EXPORT' ? 'Exports' : 'Imports'}
                </button>
              ))}
            </div>
            <select
              aria-label="Partner country"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              {countries.map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        }
      />
      {shown.length ? (
        <>
          <div className="trade-callout">
            <span>{signalLabel}</span>
            <p>{signalText}</p>
          </div>
          <div className="chart-grid">
            <TrendChart
              title={quantityTitle}
              unit="Metric tons"
              data={monthly}
              series={quantitySeries}
            />
            <TrendChart
              title={valueTitle}
              unit="USD"
              data={monthly}
              series={valueSeries}
            />
            <TrendChart
              title={priceTitle}
              unit="USD / MT"
              data={monthly}
              series={priceSeries}
            />
            <article className="flow-table">
              <div className="chart-head">
                <div>
                  <h3>{tableTitle}</h3>
                  <p>{tableSub}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Quantity</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.map(x => (
                    <tr key={x.country}>
                      <td>{x.country || 'Unspecified'}</td>
                      <td>
                        {x.quantity.toLocaleString(undefined, {
                          maximumFractionDigits: 0
                        })}{' '}
                        MT
                      </td>
                      <td>
                        USD{' '}
                        {Intl.NumberFormat('en', { notation: 'compact' }).format(
                          x.value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
