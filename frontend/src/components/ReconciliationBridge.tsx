import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Scale,
  AlertOctagon,
  Eye,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import type { BridgeStep } from '../types';

export const ReconciliationBridge: React.FC = () => {
  const { session, setActiveSampleRows } = useAuditStore();
  const recon = session?.reconciliation;

  if (!recon) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center border-slate-800">
        <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">Reconciliation Bridge Not Generated</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Run the audit workflow to calculate cross-dataset entity matching, waterfall variance decomposition, and residual gap isolation.
        </p>
      </div>
    );
  }

  // Format data for Recharts waterfall representation
  const chartData = recon.steps.map((step) => {
    const isBase = step.category === 'base_file_a' || step.category === 'base_file_b';
    return {
      name: step.title.length > 20 ? step.title.slice(0, 18) + '...' : step.title,
      fullName: step.title,
      delta: step.delta_amount,
      displayDelta: Math.abs(step.delta_amount),
      cumulative: step.cumulative_amount,
      category: step.category,
      isResidual: step.is_residual,
      isBase,
    };
  });

  const getBarColor = (entry: any) => {
    if (entry.isResidual) return '#f43f5e'; // Bright Rose/Red for Residual
    if (entry.category === 'base_file_a') return '#0ea5e9'; // Sky Blue
    if (entry.category === 'base_file_b') return '#10b981'; // Emerald
    if (entry.delta < 0) return '#f59e0b'; // Amber for deductions
    return '#8b5cf6'; // Violet
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">
            Source Total ({recon.file_a_name.replace('.csv', '')})
          </span>
          <div className="text-lg font-bold text-sky-400 font-mono mt-1">
            {formatCurrency(recon.file_a_total)}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">
            Target Total ({recon.file_b_name.replace('.csv', '')})
          </span>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {formatCurrency(recon.file_b_total)}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">
            Total Gross Variance
          </span>
          <div className="text-lg font-bold text-amber-400 font-mono mt-1 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4" />
            <span>{formatCurrency(recon.total_variance)}</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border-rose-900/50 bg-rose-950/20">
          <span className="text-[11px] font-mono uppercase text-rose-300 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Residual Gap (Red Flag)</span>
          </span>
          <div className="text-lg font-extrabold text-rose-400 font-mono mt-1">
            {formatCurrency(recon.residual_variance)}
          </div>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="glass-panel rounded-xl p-6 border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-400" />
              <span>Financial Waterfall Bridge</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes step-by-step variance attribution from source billing to recognized revenue.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Base Total
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Variance Delta
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Residual Gap
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-lg border border-slate-700 text-xs font-mono shadow-xl">
                        <div className="font-bold text-slate-200 mb-1">{data.fullName}</div>
                        <div className="text-slate-400">
                          Delta: <span className={data.delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}>{formatCurrency(data.delta)}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          Cumulative: <span className="text-sky-300">{formatCurrency(data.cumulative)}</span>
                        </div>
                        {data.isResidual && (
                          <div className="mt-1.5 text-rose-400 font-bold text-[11px] bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                            UNRECONCILED RESIDUAL
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="displayDelta" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="glass-panel rounded-xl p-6 border-slate-800 overflow-hidden">
        <h4 className="font-semibold text-sm text-slate-100 mb-4">
          Variance Attribution & Root Cause Hypotheses
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-mono tracking-wider">
                <th className="pb-3 pr-4">Step</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4 text-right">Delta ($)</th>
                <th className="pb-3 pr-4 text-right">Cumulative ($)</th>
                <th className="pb-3 pr-4 text-center">Affected Rows</th>
                <th className="pb-3 pr-4">Hypothesis & Accounting Rationale</th>
                <th className="pb-3 text-right">Sample Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recon.steps.map((step) => {
                const isResidual = step.is_residual;
                return (
                  <tr
                    key={step.step_id}
                    className={`transition hover:bg-slate-900/40 ${
                      isResidual ? 'bg-rose-950/20 text-rose-200 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4 font-semibold text-slate-200">
                      {step.title}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-slate-400">
                      <code>{step.category}</code>
                    </td>
                    <td
                      className={`py-3.5 pr-4 text-right font-mono font-semibold ${
                        isResidual
                          ? 'text-rose-400'
                          : step.delta_amount < 0
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(step.delta_amount)}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono text-slate-300">
                      {formatCurrency(step.cumulative_amount)}
                    </td>
                    <td className="py-3.5 pr-4 text-center font-mono">
                      {step.rows_affected}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-400 max-w-xs text-[11px] leading-relaxed">
                      {step.hypothesis}
                    </td>
                    <td className="py-3.5 text-right">
                      {step.sample_rows && step.sample_rows.length > 0 && (
                        <button
                          onClick={() =>
                            setActiveSampleRows({
                              title: step.title,
                              rows: step.sample_rows,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 font-mono text-[11px] transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Sample</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
