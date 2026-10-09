import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Sparkles,
  Info,
  Wrench,
} from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import type { Finding } from '../types';

export const QualityDashboard: React.FC = () => {
  const { session } = useAuditStore();
  const quality = session?.quality;

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [fileFilter, setFileFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  if (!quality) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center border-slate-800">
        <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">Quality Audit Not Yet Executed</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Load demo datasets or upload your CSV files, then click "Run Audit & Reconciliation" to generate 5-dimension quality scores and anomaly findings.
        </p>
      </div>
    );
  }

  const findings = quality.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (fileFilter !== 'ALL' && f.file !== fileFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        f.check_name.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        f.suggested_fix.toLowerCase().includes(q) ||
        f.dimension.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (score >= 75) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  const getSeverityBadge = (severity: Finding['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top File Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(quality.file_scores).map(([filename, scores], idx) => (
          <div key={filename} className="glass-panel rounded-xl p-6 border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-sky-400">
                  File {idx === 0 ? 'A' : 'B'}
                </span>
                <h4 className="text-sm font-semibold text-slate-200 mt-0.5 truncate max-w-[280px]">
                  {filename}
                </h4>
              </div>
              <div className={`text-2xl font-extrabold font-mono px-3 py-1 rounded-lg border ${getScoreBg(scores.overall)}`}>
                {scores.overall}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>

            {/* 5 Dimension Progress Bars */}
            <div className="mt-6 space-y-3">
              {[
                { label: 'Completeness', val: scores.completeness },
                { label: 'Uniqueness', val: scores.uniqueness },
                { label: 'Validity', val: scores.validity },
                { label: 'Consistency', val: scores.consistency },
                { label: 'Timeliness', val: scores.timeliness },
              ].map((dim) => (
                <div key={dim.label}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400">{dim.label}</span>
                    <span className={getScoreColor(dim.val)}>{dim.val}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dim.val >= 90 ? 'bg-emerald-400' : dim.val >= 75 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${dim.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Findings Table Section */}
      <div className="glass-panel rounded-xl p-6 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Audit Findings & Anomalies ({filteredFindings.length})</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Violations detected across completeness, format validity, primary key duplication, and ledger rules.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Files</option>
              {Object.keys(quality.file_scores).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Findings List Table */}
        <div className="divide-y divide-slate-800/60">
          {filteredFindings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No findings matching the selected filters.
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const isExpanded = expandedFindingId === finding.id;
              return (
                <div key={finding.id} className="py-3">
                  <div
                    onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                    className="flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 p-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {finding.check_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            [{finding.dimension}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-lg">
                          {finding.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-mono text-slate-400">
                        {finding.affected_rows_count} {finding.affected_rows_count === 1 ? 'row' : 'rows'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Remediation Drawer */}
                  {isExpanded && (
                    <div className="mt-2 ml-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-3 animate-fadeIn">
                      <div>
                        <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-sky-400" />
                          <span>Suggested Remediation</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/80">
                          {finding.suggested_fix}
                        </p>
                      </div>

                      {finding.sample_row_ids && finding.sample_row_ids.length > 0 && (
                        <div>
                          <div className="text-slate-400 font-medium mb-1">
                            Sample Affected Record Keys / Index:
                          </div>
                          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                            {finding.sample_row_ids.map((id, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
