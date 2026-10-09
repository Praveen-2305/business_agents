import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import type { UnresolvedIssue } from '../types';

export const UnresolvedIssues: React.FC = () => {
  const { session } = useAuditStore();
  const issues = session?.unresolved_issues || [];

  if (issues.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center border-slate-800">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">Zero Critical Blockers</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          No unresolved data discrepancies or quality anomalies detected. Run an audit to perform deep automated inspection.
        </p>
      </div>
    );
  }

  const getSeverityStyle = (severity: UnresolvedIssue['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6 border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Prioritized Remediation & Unresolved Discrepancies ({issues.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Action items ranked by monetary risk and regulatory compliance impact.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
            Requires Attention
          </span>
        </div>

        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border font-bold ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {issue.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  {issue.monetary_impact && (
                    <span className="text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                      Impact: ${issue.monetary_impact.toFixed(2)}
                    </span>
                  )}
                  <span className="text-slate-400">
                    {issue.rows_affected} {issue.rows_affected === 1 ? 'row' : 'rows'} affected
                  </span>
                </div>
              </div>

              {/* Recommended Action Box */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-start gap-3">
                <Wrench className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300 block mb-0.5">
                    Recommended Auditor Action:
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {issue.recommended_action}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
