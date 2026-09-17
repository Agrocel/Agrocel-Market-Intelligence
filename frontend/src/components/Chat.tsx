import React, { useState } from 'react';
import { askQuestion } from '../api';
import type { ChatResponse } from '../types';
import { SourceCitation } from './Common';

const prompts = [
  ['Price', 'What happened to China Bromine price in the last 90 days?'],
  ['Trade', 'Show India’s Bromine export trend.'],
  ['Competition', 'What competitor developments need attention this month?'],
  ['Commercial', 'How does Agrocel realization compare with the market?'],
  ['Outlook', 'What are the current Bromine risks and opportunities?'],
];

export function ChatInterface() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async (text = question) => {
    if (!text.trim()) return;
    setQuestion(text); setLoading(true); setAnswer(null);
    try { setAnswer(await askQuestion(text)); }
    catch { setAnswer({ question: text, answer: 'The intelligence service could not be reached. No answer has been presented as fact.', confidence: 0, sources: [] }); }
    finally { setLoading(false); }
  };

  return (
    <section id="chat" className="chat-section">
      <div className="chat-intro">
        <div className="ai-mark">AI</div>
        <div><p className="eyebrow">Evidence-based assistant</p><h2>Ask Bromine Intelligence</h2><p>Query market prices, Indian trade, competitor reports, and confidential Agrocel sales through one grounded interface.</p></div>
        <div className="chat-scope"><span>Connected scope</span><b>Structured data + source documents</b><small>Responses require supporting evidence</small></div>
      </div>

      <div className="prompt-grid">{prompts.map(([label, text]) => <button key={label} onClick={() => ask(text)}><span>{label}</span><p>{text}</p><b>↗</b></button>)}</div>

      <div className="chat-composer">
        <textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }} placeholder="Ask a question about prices, trade, competitors or sales…" aria-label="Question for Bromine Intelligence" />
        <div className="composer-footer"><small>Enter to send · Shift + Enter for a new line</small><button onClick={() => ask()} disabled={loading || !question.trim()}>{loading ? 'Searching evidence…' : 'Ask intelligence'} <span>↗</span></button></div>
      </div>

      {loading && <div className="thinking" aria-live="polite"><i/><div><strong>Reviewing the evidence base</strong><small>Searching relevant structured records and document citations…</small></div></div>}
      {answer && <article className="answer" aria-live="polite">
        <div className="answer-head"><span>AI</span><div><strong>Evidence-backed response</strong><small>{answer.confidence ? `${Math.round(answer.confidence * 100)}% retrieval confidence` : 'Evidence check complete'}</small></div></div>
        <div className="answer-body"><p>{answer.answer}</p><aside><span>Evidence standard</span><b>{answer.sources?.length || 0} cited sources</b><small>{answer.sources?.length ? 'Review citations before commercial action.' : 'No evidence returned.'}</small></aside></div>
        {answer.sources?.length ? <details open><summary>Supporting evidence ({answer.sources.length})</summary><div className="citation-list">{answer.sources.map((x, i) => <SourceCitation source={x} key={i} />)}</div></details> : <div className="insufficient">◇ Insufficient supporting evidence available. Treat this response as unavailable.</div>}
      </article>}
    </section>
  );
}
