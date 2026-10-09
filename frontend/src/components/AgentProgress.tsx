import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  FileCheck2,
  Scale,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';

interface NodeMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ORDERED_NODES: NodeMeta[] = [
  { key: 'ingest', label: 'Dataset Ingestion', description: 'Load CSVs, parse schemas, compute SHA-256 cryptographic hashes', icon: <FileCheck2 className="w-4 h-4" /> },
  { key: 'align', label: 'Semantic Alignment', description: 'Map primary keys, identify metric columns, compute overlap rate', icon: <Scale className="w-4 h-4" /> },
  { key: 'audit', label: 'Quality Audit (5D)', description: 'Inspect Completeness, Uniqueness, Validity, Consistency, Timeliness', icon: <Search className="w-4 h-4" /> },
  { key: 'reconcile', label: 'Reconciliation Bridge', description: 'Compute waterfall deltas: cutoff, duplicates, missing, refunds, fees', icon: <Scale className="w-4 h-4" /> },
  { key: 'plan', label: 'Hypothesis Planning', description: 'Formulate analytical calculation plan and dual-engine assertions', icon: <BrainCircuit className="w-4 h-4" /> },
  { key: 'execute', label: 'Dual-Engine Execution', description: 'Concurrently run queries in Pandas and SQL (DuckDB/SQLite)', icon: <Clock className="w-4 h-4" /> },
  { key: 'verify', label: 'Precision Parity Check', description: 'Compare decimal tolerance, log variances, certify calculation parity', icon: <ShieldCheck className="w-4 h-4" /> },
  { key: 'critic', label: 'Quality & Confidence Critic', description: 'Evaluate findings, assess residual variance, score confidence tier', icon: <BrainCircuit className="w-4 h-4" /> },
  { key: 'compose', label: 'Narrative Synthesis', description: 'Synthesize executive summary, bridge explanations, and findings', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'number_guard', label: 'Number Guard Audit', description: 'Cross-reference cited figures against verified calculation logs', icon: <ShieldCheck className="w-4 h-4" /> },
  { key: 'report', label: 'Artifact Compilation', description: 'Export HTML audit report, reproduce_audit.py, and calculation_log.json', icon: <FileCheck2 className="w-4 h-4" /> },
];

export const AgentProgress: React.FC = () => {
  const { session, isAuditing } = useAuditStore();
  const timeline = session?.node_timeline || [];

  return (
    <div className="glass-panel rounded-xl p-6 border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
            <BrainCircuit className="w-4 h-4 text-sky-400" />
            <span>Autonomous LangGraph Reasoning Trail</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Live Server-Sent Events (SSE) tracking node-by-node execution across the 11-step audit graph.
          </p>
        </div>
        {isAuditing && (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Stream Active</span>
          </span>
        )}
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
        {ORDERED_NODES.map((node, index) => {
          const eventsForNode = timeline.filter((e) => e.node === node.key);
          const completedEvent = eventsForNode.find((e) => e.status === 'completed');
          const startedEvent = eventsForNode.find((e) => e.status === 'started');
          const errorEvent = eventsForNode.find((e) => e.status === 'error');

          const isRunning = startedEvent && !completedEvent && !errorEvent;
          const isDone = !!completedEvent;
          const isError = !!errorEvent;
          const isPending = !isDone && !isRunning && !isError;

          return (
            <div key={node.key} className="relative flex items-start gap-4 group">
              {/* Vertical connector badge */}
              <div
                className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : isRunning
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-md shadow-sky-500/30 animate-pulse'
                    : isError
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isError ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-mono">{index + 1}</span>
                )}
              </div>

              {/* Node Card Details */}
              <div
                className={`flex-1 rounded-lg p-3.5 transition-all ${
                  isRunning
                    ? 'bg-sky-950/20 border border-sky-800/40'
                    : isDone
                    ? 'bg-slate-900/50 border border-slate-800/60'
                    : 'bg-slate-900/20 border border-slate-900/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{node.icon}</span>
                    <h4 className="text-xs font-semibold text-slate-200">
                      {node.label}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      [{node.key}]
                    </span>
                  </div>

                  {completedEvent && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {completedEvent.duration_ms}ms
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {completedEvent.timestamp}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1">
                  {completedEvent ? (
                    <span className="text-slate-300 font-mono text-[11px]">
                      {completedEvent.summary}
                    </span>
                  ) : (
                    node.description
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
