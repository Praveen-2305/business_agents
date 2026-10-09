import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  HelpCircle,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import { askQuestion } from '../api/client';
import { AnswerCard } from './AnswerCard';

const SUGGESTED_QUESTIONS = [
  'Why is File B revenue lower than File A?',
  'What is the net impact of refunded transactions?',
  'How much variance is caused by Jan 31 cutoff timing?',
  'Which factors account for the residual unexplained gap?',
];

export const AskPanel: React.FC = () => {
  const { session, addAnswer, setToast } = useAuditStore();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (queryText: string) => {
    if (!session) {
      setToast({ text: 'Please load datasets or run an audit first.', type: 'error' });
      return;
    }
    const q = queryText.trim();
    if (!q) return;

    try {
      setIsLoading(true);
      const answer = await askQuestion(session.session_id, q);
      addAnswer(answer);
      setQuestion('');
    } catch (err: any) {
      setToast({ text: err.message || 'Failed to query agent', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(question);
  };

  return (
    <div className="space-y-6">
      {/* Input Box and Prompt Suggestions */}
      <div className="glass-panel rounded-xl p-6 border-slate-800 space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Interactive Audit & Reconciliation Q&A</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Query the dual-engine agent using natural language. Every answer is backed by mathematical proof across Pandas and DuckDB.
          </p>
        </div>

        {/* Suggested Question Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase">
            Suggested Hypotheses & Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(sq)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-sky-300 font-medium transition text-left flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{sq}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={onSubmit} className="relative mt-2">
          <input
            type="text"
            placeholder="Ask about variances, specific accounts, timing discrepancies, or calculations..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="absolute right-2 top-2 p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-40 disabled:pointer-events-none transition"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      {/* Answer Stream History */}
      <div className="space-y-6">
        {session?.chat_history && session.chat_history.length > 0 ? (
          session.chat_history.map((card, idx) => (
            <AnswerCard key={idx} card={card} />
          ))
        ) : (
          <div className="glass-panel rounded-xl p-8 text-center border-slate-800 text-slate-500 text-xs">
            <FileSearch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            Select a suggested inquiry above or enter a custom question to inspect reconciliation root causes.
          </div>
        )}
      </div>
    </div>
  );
};
