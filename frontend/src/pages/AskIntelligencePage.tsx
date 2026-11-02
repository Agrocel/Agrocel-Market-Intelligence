import React, { useState } from 'react';
import { askQuestion } from '../api';
import type { ChatResponse } from '../types';
import { SourceCitation } from '../components/Common';
import { PageHeader, IntelligenceStatusStrip } from '../components/PageHeader';

const PROMPT_SUGGESTIONS = [
  {
    category: 'Price Dynamics',
    label: 'Price Shifts',
    query: 'Why did Bromine prices change in recent months and what is driving the spot trend?'
  },
  {
    category: 'Trade Flows',
    label: 'Import/Export Shifts',
    query: 'Which countries are increasing Bromine imports from India and at what average price?'
  },
  {
    category: 'Commercial Margin',
    label: 'Agrocel Realization',
    query: 'How is Agrocel commercial realization performing against the China spot benchmark?'
  },
  {
    category: 'Competitor Radar',
    label: 'Competitor Moves',
    query: 'What are key competitors like Archean Chemical and ICL currently doing in the market?'
  },
  {
    category: 'Executive Outlook',
    label: 'Risks & Mitigations',
    query: 'What are the major supply and price risks management should monitor this quarter?'
  },
  {
    category: 'Monthly Pulse',
    label: 'Current Month Pulse',
    query: 'What happened in the Bromine market this month across customs manifests and news feeds?'
  }
];

export function AskIntelligencePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (text = question) => {
    const q = text.trim();
    if (!q) return;
    setQuestion(q);
    setLoading(true);
    setAnswer(null);

    try {
      const res = await askQuestion(q);
      setAnswer(res);
    } catch {
      setAnswer({
        question: q,
        answer: 'The intelligence service could not be reached. No ungrounded answer has been presented as fact.',
        confidence: 0,
        sources: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell ask-intelligence-page">
      {/* Level 1 — Page Header */}
      <PageHeader
        breadcrumb={
          <span className="elh-breadcrumb">
            <span className="breadcrumb-current">AI Decision Support</span>
          </span>
        }
        title="Ask Market Intelligence"
      />

      {/* Level 2 — Intelligence Status */}
      <IntelligenceStatusStrip
        items={[
          {
            label: 'Decision Engine',
            value: 'Grounded AI Assistant',
            dot: 'green',
            tone: 'positive'
          },
          {
            label: 'Connected Scope',
            value: 'Agrocel Sales ERP · Customs Manifests · Spot Indices'
          },
          {
            label: 'Vector Library',
            value: '56 Market Reports Indexed'
          },
          {
            label: 'Audit Standard',
            value: 'Evidence Citations Required'
          }
        ]}
      />

      {/* Suggested Questions Grid */}
      <section className="suggested-prompts-section">
        <span className="prompts-label">Suggested Executive Inquiries:</span>
        <div className="prompts-grid">
          {PROMPT_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              className="prompt-chip-card"
              onClick={() => handleAsk(item.query)}
            >
              <div className="prompt-top">
                <span className="prompt-cat">{item.category}</span>
                <span className="prompt-arrow">↗</span>
              </div>
              <p className="prompt-text">{item.query}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Query Composer */}
      <section className="composer-container">
        <div className="ask-composer-card">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Ask a question (e.g., 'Why did Bromine prices rise while Agrocel sales remained steady?')..."
            aria-label="Question for Bromine Market Intelligence"
            rows={3}
          />
          <div className="composer-action-row">
            <small className="keyboard-hint">Press <b>Enter</b> to send · <b>Shift + Enter</b> for new line</small>
            <button
              className="submit-query-btn"
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>Searching Grounded Evidence...</span>
                </>
              ) : (
                <>
                  <span>Ask Intelligence</span>
                  <span className="arrow-icon">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Loading Thinking Indicator */}
      {loading && (
        <div className="intel-thinking-banner" aria-live="polite">
          <div className="thinking-spinner" />
          <div>
            <strong>Reviewing the evidence base & vector index...</strong>
            <p>Searching 3,500+ customs records, 7,800+ sales transactions, and 143 semantic passages in local Qdrant vector store.</p>
          </div>
        </div>
      )}

      {/* Structured AI Response Card */}
      {answer && (
        <section className="intel-answer-section" aria-live="polite">
          <article className="intel-answer-card">
            <header className="answer-header">
              <div className="answer-title-group">
                <span className="answer-pill">Verified Intelligence Answer</span>
                <h2 className="answer-question">"{answer.question}"</h2>
              </div>
              <div className="answer-meta-badges">
                <span className="confidence-pill">
                  {answer.confidence ? `${Math.round(answer.confidence * 100)}% Retrieval Confidence` : 'Evidence Grounded'}
                </span>
                <span className="source-count-pill">
                  {answer.sources?.length || 0} Grounded Sources
                </span>
              </div>
            </header>

            {/* Answer Body */}
            <div className="answer-body-content">
              <div className="answer-text">
                {answer.answer.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <aside className="answer-trust-sidebar">
                <h4>Data Governance Standard</h4>
                <p>All insights generated by the model must cite supporting transaction manifests or recognized market publications.</p>
                <div className="sidebar-stat">
                  <label>Citations Cited</label>
                  <strong>{answer.sources?.length || 0} Records</strong>
                </div>
              </aside>
            </div>

            {/* Supporting Evidence Citations */}
            {answer.sources && answer.sources.length > 0 ? (
              <div className="answer-evidence-accordion">
                <h3 className="evidence-section-title">
                  Supporting Evidence & Source Provenance ({answer.sources.length})
                </h3>
                <div className="citation-list-grid">
                  {answer.sources.map((src, i) => (
                    <SourceCitation source={src} key={i} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="insufficient-evidence-alert">
                <span>◇</span>
                <div>
                  <strong>No direct citations returned for this query</strong>
                  <p>Treat this summary with caution or verify against raw customs or ERP records.</p>
                </div>
              </div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}
