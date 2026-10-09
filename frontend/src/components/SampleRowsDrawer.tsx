import React, { useEffect } from 'react';
import { X, Table, Eye } from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';

export const SampleRowsDrawer: React.FC = () => {
  const { activeSampleRows, setActiveSampleRows } = useAuditStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSampleRows(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveSampleRows]);

  if (!activeSampleRows) return null;

  const rows = activeSampleRows.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={() => setActiveSampleRows(null)} />

      <div className="relative w-full max-w-2xl h-full bg-slate-950 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase">
                Reconciliation Factor Sample
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-2">
                {activeSampleRows.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Showing sample affected records contributing to this variance delta.
              </p>
            </div>

            <button
              onClick={() => setActiveSampleRows(null)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-panel rounded-xl p-4 border-slate-800 overflow-x-auto">
            {rows.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No sample records available for this step.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    {columns.map((col) => (
                      <th key={col} className="pb-2 pr-4 font-semibold text-slate-300">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40">
                      {columns.map((col) => (
                        <td key={col} className="py-2.5 pr-4 truncate max-w-[140px]">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
          Sample record audit inspection drawer &bull; Press Esc to close
        </div>
      </div>
    </div>
  );
};
