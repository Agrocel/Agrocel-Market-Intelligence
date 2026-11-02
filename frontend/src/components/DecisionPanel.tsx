import React from 'react';

export type DecisionTone = 'positive' | 'watch' | 'risk' | 'neutral';

export interface DecisionItem {
  id: string;
  title: string;
  detail: string;
  signal: string;
  tone: DecisionTone;
  action: string;
  onOpen?: () => void;
}

export function DecisionPanel({ items }: { items: DecisionItem[] }) {
  if (!items.length) return null;

  return (
    <section className="decision-panel" aria-labelledby="decision-panel-title">
      <div className="decision-panel-head">
        <div>
          <span className="decision-panel-eyebrow">Management actions</span>
          <h2 id="decision-panel-title">What needs attention now</h2>
        </div>
        <span className="decision-panel-note">Based on the currently loaded verified data</span>
      </div>
      <div className="decision-panel-grid">
        {items.map(item => (
          <article key={item.id} className={`decision-item decision-item-${item.tone}`}>
            <div className="decision-item-topline">
              <span className="decision-status"><i aria-hidden="true" />{item.signal}</span>
              <span className="decision-domain">Decision</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <button type="button" onClick={item.onOpen} disabled={!item.onOpen}>
              {item.action}
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
