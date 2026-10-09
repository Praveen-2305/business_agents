import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { AnswerCard as AnswerCardType, EvidenceChip } from '../types';
import { useAuditStore } from '../store/useAuditStore';

interface Props {
  card: AnswerCardType;
}

export const AnswerCard: React.FC<Props> = ({ card }) => {
  const { setActiveEvidence } = useAuditStore();

  const getConfidenceBadge = (confidence: AnswerCardType['confidence']) => {
    switch (confidence) {
      case 'HIGH':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
        };
      case 'LOW':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
        };
    }
  };

  const badgeStyle = getConfidenceBadge(card.confidence);

  return (
    <div className="glass-panel rounded-xl p-6 border-slate-800 space-y-5 animate-fadeIn">
      {/* Question & Confidence Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
            Query Answer
          </span>
          <h3 className="text-base font-bold text-slate-100 mt-1 leading-snug">
            {card.headline}
          </h3>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-2 self-start ${badgeStyle.bg}`}>
          <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
          <span>{card.confidence} CONFIDENCE</span>
        </div>
      </div>

      {/* Confidence Reasons */}
      {card.confidence_reasons && card.confidence_reasons.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confidence Basis & Audit Verification</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            {card.confidence_reasons.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Side-by-Side Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Primary Metric</span>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1">
            {card.primary_value}
          </div>
        </div>

        {Object.entries(card.per_file_values || {}).map(([file, val]) => (
          <div key={file} className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase truncate block">
              {file}
            </span>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">
              {String(val)}
            </div>
          </div>
        ))}
      </div>

      {/* Evidence Chips (Clickable -> Opens EvidenceDrawer) */}
      {card.evidence_chips && card.evidence_chips.length > 0 && (
        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-2">
            Dual-Execution Verification Evidence (Click to inspect proofs)
          </span>
          <div className="flex flex-wrap gap-2">
            {card.evidence_chips.map((chip) => (
              <button
                key={chip.calc_id}
                onClick={() => setActiveEvidence(chip)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-sky-900/50 hover:border-sky-500/60 text-xs font-mono text-slate-300 transition shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sky-300 font-semibold">{chip.label}</span>
                <span className="text-slate-500 text-[10px]">({chip.calc_id})</span>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions & Caveats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 text-xs">
        {card.assumptions && card.assumptions.length > 0 && (
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              Accounting Assumptions
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {card.assumptions.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {card.caveats && card.caveats.length > 0 && (
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              Auditor Caveats & Notes
            </span>
            <ul className="list-disc list-inside space-y-1 text-amber-300/80">
              {card.caveats.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
